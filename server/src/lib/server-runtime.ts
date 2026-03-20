import type { RegeneratePlanInput } from "../../../shared/schemas";
import { InMemoryCache } from "./cache";
import { InMemoryRateLimiter } from "./rate-limit";

function getNumberEnv(name: string, fallback: number) {
    const rawValue = process.env[name];

    if (!rawValue) {
        return fallback;
    }

    const parsed = Number(rawValue);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const profileCache = new InMemoryCache<Record<string, unknown>>(
    getNumberEnv("CACHE_PROFILE_TTL_MS", 300_000),
);

export const currentPlanCache = new InMemoryCache<Record<string, unknown>>(
    getNumberEnv("CACHE_CURRENT_PLAN_TTL_MS", 120_000),
);

export const apiRateLimiter = new InMemoryRateLimiter(
    getNumberEnv("API_RATE_LIMIT_WINDOW_MS", 900_000),
    getNumberEnv("API_RATE_LIMIT_MAX", 120),
);

export const planRateLimiter = new InMemoryRateLimiter(
    getNumberEnv("PLAN_RATE_LIMIT_WINDOW_MS", 900_000),
    getNumberEnv("PLAN_RATE_LIMIT_MAX", 5),
);

const inFlightPlanRequests = new Map<string, Promise<Record<string, unknown>>>();

export function getCacheKey(userId: string) {
    return `user:${userId}`;
}

export function getPlanGenerationDeduplicationKey(
    userId: string,
    input: RegeneratePlanInput,
) {
    return JSON.stringify({
        userId,
        mode: input.mode ?? "same",
        notes: input.notes ?? "",
    });
}

export function getInFlightPlanRequest(key: string) {
    return inFlightPlanRequests.get(key) ?? null;
}

export function setInFlightPlanRequest(key: string, promise: Promise<Record<string, unknown>>) {
    inFlightPlanRequests.set(key, promise);
}

export function clearInFlightPlanRequest(key: string) {
    inFlightPlanRequests.delete(key);
}

export function resetServerRuntime() {
    profileCache.clear();
    currentPlanCache.clear();
    apiRateLimiter.clear();
    planRateLimiter.clear();
    inFlightPlanRequests.clear();
}
