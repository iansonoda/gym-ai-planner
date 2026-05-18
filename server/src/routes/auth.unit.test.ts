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

import { createApp } from "../app";
import { prisma } from "../lib/prisma";

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
});
