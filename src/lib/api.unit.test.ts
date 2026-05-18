// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "./api";

function createJsonResponse(body: unknown, ok = true) {
    return {
        ok,
        json: vi.fn().mockResolvedValue(body),
    } as unknown as Response;
}

describe("api client", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubGlobal("fetch", vi.fn());
    });

    it("sends profile requests with cookie credentials", async () => {
        vi.mocked(fetch).mockResolvedValue(createJsonResponse({ success: true }));

        await api.saveProfile({
            goal: "strength",
            experience: "beginner",
            daysPerWeek: 4,
            sessionDuration: 60,
            equipment: "full_gym",
            injuries: "",
            generalNotes: "",
            preferredSplit: "upper_lower",
        });

        expect(fetch).toHaveBeenCalledWith(
            "http://localhost:3001/api/profile",
            expect.objectContaining({
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
            }),
        );
    });

    it("sends GET requests with cookie credentials", async () => {
        vi.mocked(fetch).mockResolvedValue(createJsonResponse({ id: "plan_1" }));

        await api.getCurrentPlan();

        expect(fetch).toHaveBeenCalledWith(
            "http://localhost:3001/api/plan/current",
            expect.objectContaining({
                credentials: "include",
            }),
        );
    });

    it("propagates JSON error payloads returned by the API", async () => {
        vi.mocked(fetch).mockResolvedValue(
            createJsonResponse({ error: "User profile not found" }, false),
        );

        await expect(api.getProfile()).rejects.toThrow("User profile not found");
    });

    it("falls back to a generic error when the API response body is not JSON", async () => {
        vi.mocked(fetch).mockResolvedValue({
            ok: false,
            json: vi.fn().mockRejectedValue(new Error("invalid json")),
        } as unknown as Response);

        await expect(api.getCurrentPlan()).rejects.toThrow("Request failed");
    });
});
