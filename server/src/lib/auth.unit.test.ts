import type { NextFunction, Request, Response } from "express";
import { describe, expect, it } from "vitest";
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

describe("requireAuth", () => {
    it("rejects requests without an authorization header", async () => {
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

        expect(nextCalled).toBe(false);
        expect(res.statusCode).toBe(401);
        expect(res.jsonBody).toEqual({ error: "Authentication required" });
    });
});

describe("resolveJwksUrl", () => {
    it("uses Neon well-known JWKS path", () => {
        const jwksUrl = resolveJwksUrl("https://example.neon.tech/neondb/auth");

        expect(jwksUrl?.toString()).toBe("https://example.neon.tech/neondb/auth/.well-known/jwks.json");
    });

    it("preserves an explicit JWKS override", () => {
        const jwksUrl = resolveJwksUrl(
            "https://example.neon.tech/neondb/auth",
            "https://auth.example.com/custom/jwks.json",
        );

        expect(jwksUrl?.toString()).toBe("https://auth.example.com/custom/jwks.json");
    });
});
