// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./auth", () => ({
    getAuthToken: vi.fn(),
}));

import { api } from "./api";
import { getAuthToken } from "./auth";

function createJsonResponse(body: unknown, ok = true) {
    return {
        ok,
        json: vi.fn().mockResolvedValue(body),
    } as Response;
}

describe("api client", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubGlobal("fetch", vi.fn());
        vi.mocked(getAuthToken).mockResolvedValue(null);
    });

    it("adds the bearer token when authentication is available", async () => {
        vi.mocked(getAuthToken).mockResolvedValue("token-123");
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
                headers: expect.objectContaining({
                    Authorization: "Bearer token-123",
                    "Content-Type": "application/json",
                }),
            }),
        );
    });

    it("omits the authorization header when no auth token exists", async () => {
        vi.mocked(fetch).mockResolvedValue(createJsonResponse({ id: "plan_1" }));

        await api.generatePlan();

        expect(fetch).toHaveBeenCalledWith(
            "http://localhost:3001/api/plan/generate",
            expect.objectContaining({
                headers: {
                    "Content-Type": "application/json",
                },
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
