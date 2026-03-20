import { describe, expect, it } from "vitest";
import { createResponse } from "node-mocks-http";
import { InMemoryRateLimiter, setRateLimitHeaders } from "./rate-limit";

describe("InMemoryRateLimiter", () => {
    it("allows requests until the configured limit is exceeded", () => {
        const limiter = new InMemoryRateLimiter(1_000, 2);

        expect(limiter.consume("user:1", 1_000)).toMatchObject({
            limited: false,
            remaining: 1,
        });
        expect(limiter.consume("user:1", 1_100)).toMatchObject({
            limited: false,
            remaining: 0,
        });
        expect(limiter.consume("user:1", 1_200)).toMatchObject({
            limited: true,
            remaining: 0,
        });
    });

    it("resets counters after the window elapses", () => {
        const limiter = new InMemoryRateLimiter(1_000, 1);

        expect(limiter.consume("user:1", 1_000).limited).toBe(false);
        expect(limiter.consume("user:1", 1_100).limited).toBe(true);
        expect(limiter.consume("user:1", 2_100).limited).toBe(false);
    });

    it("writes rate limit headers and retry-after for blocked requests", () => {
        const limiter = new InMemoryRateLimiter(1_000, 1);
        const response = createResponse();

        limiter.consume("user:1", 1_000);
        const result = limiter.consume("user:1", 1_100);

        setRateLimitHeaders(response, result);

        expect(response.getHeader("X-RateLimit-Limit")).toBe("1");
        expect(response.getHeader("X-RateLimit-Remaining")).toBe("0");
        expect(response.getHeader("Retry-After")).toBe("1");
    });
});
