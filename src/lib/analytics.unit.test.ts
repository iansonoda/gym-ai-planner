// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";

import { getAnalyticsSessionId, trackEvent } from "./analytics";

describe("client analytics", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        window.localStorage.clear();
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
    });

    it("persists a stable session id in local storage", () => {
        const firstSessionId = getAnalyticsSessionId();
        const secondSessionId = getAnalyticsSessionId();

        expect(firstSessionId).toBe(secondSessionId);
        expect(window.localStorage.getItem("gymai.analytics.session-id")).toBe(firstSessionId);
    });

    it("sends analytics events without blocking the caller", async () => {
        trackEvent({
            eventName: "page_view",
            path: "/profile",
            properties: {
                title: "My Plan | GymAI",
            },
        });

        await vi.waitFor(() => {
            expect(fetch).toHaveBeenCalledTimes(1);
        });

        expect(fetch).toHaveBeenCalledWith(
            "http://localhost:3001/api/analytics/events",
            expect.objectContaining({
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                keepalive: true,
            }),
        );
    });
});
