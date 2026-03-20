import { describe, expect, it } from "vitest";
import { InMemoryCache } from "./cache";

describe("InMemoryCache", () => {
    it("returns cached values until the TTL expires", () => {
        const cache = new InMemoryCache<string>(100);

        cache.set("profile:user_1", "cached-profile", 100, 1_000);

        expect(cache.get("profile:user_1", 1_050)).toBe("cached-profile");
        expect(cache.get("profile:user_1", 1_101)).toBeNull();
    });

    it("invalidates entries by key", () => {
        const cache = new InMemoryCache<string>(100);

        cache.set("plan:user_1", "cached-plan");
        cache.delete("plan:user_1");

        expect(cache.get("plan:user_1")).toBeNull();
    });

    it("keeps keys isolated from each other", () => {
        const cache = new InMemoryCache<string>(100);

        cache.set("profile:user_1", "profile");
        cache.set("plan:user_1", "plan");

        expect(cache.get("profile:user_1")).toBe("profile");
        expect(cache.get("plan:user_1")).toBe("plan");
    });
});
