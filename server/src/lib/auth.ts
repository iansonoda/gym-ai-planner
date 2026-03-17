import type { NextFunction, Request, Response } from "express";
import dotenv from "dotenv";
import { createRemoteJWKSet, jwtVerify } from "jose";
import path from "node:path";

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), "..", ".env") });

export function resolveJwksUrl(
    authBaseUrl: string | undefined,
    explicitJwksUrl: string | undefined = process.env.NEON_AUTH_JWKS_URL
): URL | null {
    if (explicitJwksUrl) {
        return new URL(explicitJwksUrl);
    }

    if (!authBaseUrl) {
        return null;
    }

    const normalizedBaseUrl = authBaseUrl.endsWith("/") ? authBaseUrl : `${authBaseUrl}/`;
    return new URL(".well-known/jwks.json", normalizedBaseUrl);
}

const jwksUrl = resolveJwksUrl(
    process.env.NEON_AUTH_BASE_URL || process.env.NEON_AUTH_URL || process.env.VITE_NEON_AUTH_URL,
    process.env.NEON_AUTH_JWKS_URL
);
const jwks = jwksUrl ? createRemoteJWKSet(jwksUrl) : null;

interface AuthPayload {
    sub?: string;
    aud?: string;
    [key: string]: unknown;
}

export interface AuthenticatedRequest extends Request {
    auth: {
        payload: AuthPayload;
        token: string;
        userId: string;
    };
}

function getBearerToken(authorization?: string) {
    if (!authorization) {
        return null;
    }

    const [scheme, token] = authorization.split(" ");
    if (scheme !== "Bearer" || !token) {
        return null;
    }

    return token;
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
    if (!jwks) {
        return res.status(500).json({ error: "Neon auth is not configured on the server" });
    }

    const token = getBearerToken(req.header("authorization"));
    if (!token) {
        return res.status(401).json({ error: "Authentication required" });
    }

    try {
        const { payload } = await jwtVerify(token, jwks);

        if (!payload || typeof payload.sub !== "string" || payload.sub.length === 0) {
            return res.status(401).json({ error: "Invalid authentication token" });
        }

        (req as AuthenticatedRequest).auth = {
            payload,
            token,
            userId: payload.sub,
        };

        next();
    } catch (error) {
        console.error("Error verifying auth token:", error);
        return res.status(401).json({ error: "Invalid or expired authentication token" });
    }
}
