import type { NextFunction, Request, Response } from "express";
import dotenv from "dotenv";
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import path from "node:path";

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), "..", ".env") });

const authBaseUrl = process.env.NEON_AUTH_URL || process.env.VITE_NEON_AUTH_URL;
const jwksUrl = authBaseUrl
    ? new URL("jwks", authBaseUrl.endsWith("/") ? authBaseUrl : `${authBaseUrl}/`)
    : null;
const jwks = jwksUrl ? createRemoteJWKSet(jwksUrl) : null;

export interface AuthenticatedRequest extends Request {
    auth: {
        payload: JWTPayload;
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

        if (typeof payload.sub !== "string" || payload.sub.length === 0) {
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
