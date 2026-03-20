import type { NextFunction, Request, Response } from "express";
import { recordServerEvent } from "./analytics";
import { getRequestIp } from "./request";

interface RateLimitState {
    count: number;
    resetAt: number;
}

export interface RateLimitResult {
    limit: number;
    remaining: number;
    resetAt: number;
    retryAfterSeconds: number;
    limited: boolean;
}

interface CreateRateLimitMiddlewareOptions {
    key: (req: Request) => string;
    limit: number;
    windowMs: number;
    message: string;
}

export class InMemoryRateLimiter {
    private readonly store = new Map<string, RateLimitState>();

    constructor(
        private readonly windowMs: number,
        private readonly limit: number,
    ) {}

    consume(key: string, now = Date.now()): RateLimitResult {
        const current = this.store.get(key);

        if (!current || current.resetAt <= now) {
            const resetAt = now + this.windowMs;
            this.store.set(key, { count: 1, resetAt });

            return {
                limit: this.limit,
                remaining: Math.max(this.limit - 1, 0),
                resetAt,
                retryAfterSeconds: Math.max(Math.ceil(this.windowMs / 1000), 1),
                limited: false,
            };
        }

        current.count += 1;

        const remaining = Math.max(this.limit - current.count, 0);
        const limited = current.count > this.limit;

        return {
            limit: this.limit,
            remaining,
            resetAt: current.resetAt,
            retryAfterSeconds: Math.max(Math.ceil((current.resetAt - now) / 1000), 1),
            limited,
        };
    }

    clear() {
        this.store.clear();
    }
}

export function setRateLimitHeaders(res: Response, result: RateLimitResult) {
    res.setHeader("X-RateLimit-Limit", String(result.limit));
    res.setHeader("X-RateLimit-Remaining", String(result.remaining));
    res.setHeader("X-RateLimit-Reset", String(Math.ceil(result.resetAt / 1000)));

    if (result.limited) {
        res.setHeader("Retry-After", String(result.retryAfterSeconds));
    }
}

export function createRateLimitMiddleware(
    limiter: InMemoryRateLimiter,
    { key, limit, message }: CreateRateLimitMiddlewareOptions,
) {
    return async function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
        const rateLimitKey = key(req);
        const result = limiter.consume(rateLimitKey);

        setRateLimitHeaders(res, result);

        if (!result.limited) {
            return next();
        }

        await recordServerEvent({
            req,
            eventName: "rate_limited",
            properties: {
                key: rateLimitKey,
                limit,
                remaining: result.remaining,
                resetAt: result.resetAt,
                retryAfterSeconds: result.retryAfterSeconds,
                statusCode: 429,
            },
        });

        return res.status(429).json({ error: message });
    };
}
