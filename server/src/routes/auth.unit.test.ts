import { EventEmitter } from "node:events";
import type { Request, Response } from "express";
import { createRequest, createResponse } from "node-mocks-http";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../lib/session", () => ({
  createSessionMiddleware: () => (req: { session?: Record<string, unknown> }, _res: unknown, next: () => void) => {
    req.session = {};
    next();
  },
}));

vi.mock("../lib/oauth", () => ({
  findOrCreateOAuthUser: vi.fn(),
}));

vi.mock("../lib/prisma", () => ({
  prisma: {
    users: {
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      create: vi.fn(),
    },
    oauth_accounts: {
      findMany: vi.fn(),
    },
  },
  pool: {},
}));

vi.mock("passport-google-oauth20", () => ({
  Strategy: vi.fn(function Strategy(this: { name: string }, _options: unknown) {
    this.name = "google";
  }),
}));

vi.mock("passport-github2", () => ({
  Strategy: vi.fn(function Strategy(this: { name: string }, _options: unknown) {
    this.name = "github";
  }),
}));

vi.mock("../lib/rate-limit", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/rate-limit")>();

  return {
    ...actual,
    createRateLimitMiddleware: vi.fn(() => (_req: unknown, _res: unknown, next: () => void) => next()),
  };
});

import { createApp } from "../app";
import { findOrCreateOAuthUser } from "../lib/oauth";
import { prisma } from "../lib/prisma";
import { createRateLimitMiddleware } from "../lib/rate-limit";
import { Strategy as GitHubStrategy } from "passport-github2";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

const mockedPrisma = prisma as unknown as {
  users: {
    findUnique: ReturnType<typeof vi.fn>;
    findUniqueOrThrow: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };
  oauth_accounts: {
    findMany: ReturnType<typeof vi.fn>;
  };
};
const mockedFindOrCreateOAuthUser = vi.mocked(findOrCreateOAuthUser);

function parseBody(data: unknown) {
  if (typeof data !== "string" || data.length === 0) {
    return data;
  }

  try {
    return JSON.parse(data);
  } catch {
    return data;
  }
}

interface TestApp {
  handle: (req: Request, res: Response, next: (error?: unknown) => void) => void;
}

async function invokeExpressRoute(app: unknown, options: { method: string; url: string }) {
  const testApp = app as TestApp;
  const req = createRequest({
    method: options.method as "GET" | "POST",
    url: options.url,
  });
  const res = createResponse({ eventEmitter: EventEmitter });

  await new Promise<void>((resolve, reject) => {
    res.on("finish", resolve);
    res.on("end", resolve);

    testApp.handle(req, res, (error: unknown) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });

  return {
    status: res.statusCode,
    body: parseBody(res._getData()),
  };
}

describe("auth routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SESSION_SECRET = "test-session-secret";
    process.env.GOOGLE_CLIENT_ID = "google-client";
    process.env.GOOGLE_CLIENT_SECRET = "google-secret";
    process.env.GITHUB_CLIENT_ID = "github-client";
    process.env.GITHUB_CLIENT_SECRET = "github-secret";
    process.env.APP_ORIGIN = "http://localhost:5173";
    process.env.API_BASE_URL = "http://localhost:3001";
    delete process.env.ENABLE_DEV_LOGIN;
  });

  it("returns 401 for anonymous /api/auth/me", async () => {
    const app = createApp();

    const res = await invokeExpressRoute(app, {
      method: "GET",
      url: "/api/auth/me",
    });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Authentication required" });
  });

  it("blocks dev login in production", async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    const app = createApp();

    const res = await invokeExpressRoute(app, {
      method: "POST",
      url: "/api/auth/dev-login",
    });

    process.env.NODE_ENV = originalEnv;
    expect(res.status).toBe(404);
    expect(mockedPrisma.users.create).not.toHaveBeenCalled();
  });

  it("does not require provider credentials to create the app", async () => {
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    delete process.env.GITHUB_CLIENT_ID;
    delete process.env.GITHUB_CLIENT_SECRET;

    expect(() => createApp()).not.toThrow();
  });

  it("returns a setup error when Google OAuth credentials are not configured", async () => {
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    const app = createApp();

    const res = await invokeExpressRoute(app, {
      method: "GET",
      url: "/api/auth/google",
    });

    expect(res.status).toBe(503);
    expect(res.body).toEqual({
      error: "Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.",
    });
  });

  it("returns a setup error when GitHub OAuth credentials are not configured", async () => {
    delete process.env.GITHUB_CLIENT_ID;
    delete process.env.GITHUB_CLIENT_SECRET;
    const app = createApp();

    const res = await invokeExpressRoute(app, {
      method: "GET",
      url: "/api/auth/github",
    });

    expect(res.status).toBe(503);
    expect(res.body).toEqual({
      error: "GitHub OAuth is not configured. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET.",
    });
  });

  it("requires an explicit development opt-in for dev login", async () => {
    process.env.NODE_ENV = "development";
    const app = createApp();

    const res = await invokeExpressRoute(app, {
      method: "POST",
      url: "/api/auth/dev-login",
    });

    expect(res.status).toBe(404);
    expect(mockedPrisma.users.create).not.toHaveBeenCalled();
  });

  it("registers OAuth strategies with state protection and GitHub raw emails", () => {
    createApp();

    expect(GoogleStrategy).toHaveBeenCalledWith(
      expect.objectContaining({
        state: true,
      }),
      expect.any(Function),
    );
    expect(GitHubStrategy).toHaveBeenCalledWith(
      expect.objectContaining({
        allRawEmails: true,
        state: true,
      }),
      expect.any(Function),
    );
  });

  it("normalizes verified GitHub raw email profiles", async () => {
    createApp();
    const verify = vi.mocked(GitHubStrategy).mock.calls[0][1] as unknown as (
      accessToken: string,
      refreshToken: string,
      profile: {
        id: string;
        emails?: Array<{ value?: string; verified?: boolean; primary?: boolean }>;
        displayName?: string;
        username?: string;
        photos?: Array<{ value?: string }>;
      },
      done: (error: Error | null, user?: unknown) => void,
    ) => Promise<void>;
    mockedFindOrCreateOAuthUser.mockResolvedValue({
      id: "user-1",
      email: "ian@example.com",
      name: "Ian",
      avatarUrl: null,
    });

    await verify(
      "access-token",
      "refresh-token",
      {
        id: "github-1",
        emails: [
          { value: "fallback@example.com", verified: false, primary: true },
          { value: "ian@example.com", verified: true, primary: false },
        ],
        username: "ian",
      },
      vi.fn(),
    );

    expect(mockedFindOrCreateOAuthUser).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "github",
        providerAccountId: "github-1",
        email: "ian@example.com",
        emailVerified: true,
      }),
    );
  });

  it("applies API rate limiting before auth routes", () => {
    createApp();

    expect(createRateLimitMiddleware).toHaveBeenCalled();
  });
});
