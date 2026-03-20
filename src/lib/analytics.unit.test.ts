// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./auth", () => ({
    getAuthToken: vi.fn(),
}));

import { getAuthToken } from "./auth";
import { getAnalyticsSessionId, trackEvent } from "./analytics";

describe("client analytics", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        window.localStorage.clear();
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
        vi.mocked(getAuthToken).mockResolvedValue("token-123");
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
                headers: expect.objectContaining({
                    Authorization: "Bearer token-123",
                    "Content-Type": "application/json",
                }),
                keepalive: true,
            }),
        );
    });
});
