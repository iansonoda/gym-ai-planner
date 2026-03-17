import assert from "node:assert/strict";
import test from "node:test";
import type { NextFunction, Request, Response } from "express";
import { requireAuth, resolveJwksUrl } from "./auth";

function createMockResponse() {
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

test("requireAuth rejects requests without an authorization header", async () => {
    const req = {
        header: () => undefined,
    } as Pick<Request, "header"> as Request;
    const res = createMockResponse() as Response & {
        statusCode: number;
        jsonBody: unknown;
    };
    let nextCalled = false;

    const next: NextFunction = () => {
        nextCalled = true;
    };

    await requireAuth(req, res, next);

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 401);
    assert.deepEqual(res.jsonBody, { error: "Authentication required" });
});

test("resolveJwksUrl uses Neon well-known JWKS path", () => {
    const jwksUrl = resolveJwksUrl("https://example.neon.tech/neondb/auth");

    assert.equal(jwksUrl?.toString(), "https://example.neon.tech/neondb/auth/.well-known/jwks.json");
});

test("resolveJwksUrl preserves an explicit JWKS override", () => {
    const jwksUrl = resolveJwksUrl(
        "https://example.neon.tech/neondb/auth",
        "https://auth.example.com/custom/jwks.json"
    );

    assert.equal(jwksUrl?.toString(), "https://auth.example.com/custom/jwks.json");
});
