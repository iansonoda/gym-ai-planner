import type { NextFunction, Request, Response } from "express";
import { describe, expect, it } from "vitest";
import { requireAuth, resolveOptionalAuth } from "./auth";

function response() {
  return {
    statusCode: 200,
    jsonBody: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.jsonBody = payload;
      return this;
    },
  };
}

describe("session requireAuth", () => {
  it("rejects requests without a session user", async () => {
    const req = { user: undefined, isAuthenticated: () => false } as unknown as Request;
    const res = response() as Response & { statusCode: number; jsonBody: unknown };
    let nextCalled = false;

    await requireAuth(req, res, (() => { nextCalled = true; }) as NextFunction);

    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(401);
    expect(res.jsonBody).toEqual({ error: "Authentication required" });
  });

  it("attaches authenticated session context", async () => {
    const req = {
      user: { id: "550e8400-e29b-41d4-a716-446655440000", email: "ian@example.com", name: null, avatarUrl: null },
      isAuthenticated: () => true,
    } as unknown as Request;
    const res = response() as Response;
    let nextCalled = false;

    await requireAuth(req, res, (() => { nextCalled = true; }) as NextFunction);

    expect(nextCalled).toBe(true);
    expect((req as any).auth.userId).toBe("550e8400-e29b-41d4-a716-446655440000");
  });
});

describe("resolveOptionalAuth", () => {
  it("returns null when the request is anonymous", async () => {
    const req = { user: undefined, isAuthenticated: () => false } as unknown as Request;
    await expect(resolveOptionalAuth(req)).resolves.toBeNull();
  });
});
