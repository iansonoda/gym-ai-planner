import { beforeEach, describe, expect, it, vi } from "vitest";
import {
    planGenerationOutcomes,
    requestValidationOutcomes,
    userScenarios,
} from "../../../test/fixtures/scenarios";
import { invokeExpressRoute } from "../../../test/helpers/express-test-utils";
import {
    createAuthenticatedHeaders,
    createGeneratedPlanFixture,
    createStoredPlan,
    profileFixtures,
    TEST_USER_ID,
} from "../../../test/helpers/server-test-utils";

vi.mock("../lib/prisma", () => ({
    prisma: {
        user_profiles: {
            findUnique: vi.fn(),
            upsert: vi.fn(),
        },
        training_plans: {
            findFirst: vi.fn(),
            create: vi.fn(),
        },
        analytics_events: {
            create: vi.fn(),
        },
    },
}));

vi.mock("../lib/ai", () => ({
    generateTrainingPlan: vi.fn(),
}));

vi.mock("../lib/auth", async () => {
    const actual = await vi.importActual<typeof import("../lib/auth")>("../lib/auth");

    return {
        ...actual,
        requireAuth: vi.fn(async (req, res, next) => {
            if (!req.header("authorization")) {
                return res.status(401).json({ error: "Authentication required" });
            }

            req.auth = {
                payload: { sub: TEST_USER_ID },
                token: "test-token",
                userId: TEST_USER_ID,
            };

            return next();
        }),
        resolveOptionalAuth: vi.fn(async (req) => {
            if (!req.header("authorization")) {
                return null;
            }

            return {
                payload: { sub: TEST_USER_ID },
                token: "test-token",
                userId: TEST_USER_ID,
            };
        }),
    };
});

import { createApp } from "../app";
import { generateTrainingPlan } from "../lib/ai";
import { prisma } from "../lib/prisma";
import { resetServerRuntime } from "../lib/server-runtime";

const mockedGenerateTrainingPlan = vi.mocked(generateTrainingPlan);
const mockedPrisma = prisma as {
    user_profiles: {
        findUnique: ReturnType<typeof vi.fn>;
        upsert: ReturnType<typeof vi.fn>;
    };
    training_plans: {
        findFirst: ReturnType<typeof vi.fn>;
        create: ReturnType<typeof vi.fn>;
    };
    analytics_events: {
        create: ReturnType<typeof vi.fn>;
    };
};

describe("profile routes", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        resetServerRuntime();
        mockedPrisma.analytics_events.create.mockResolvedValue({ id: "analytics_1" });
    });

    it("creates or updates a profile for an authenticated user", async () => {
        const app = createApp();
        mockedPrisma.user_profiles.upsert.mockResolvedValue({
            user_id: TEST_USER_ID,
        });

        const res = await invokeExpressRoute(app, {
            method: "POST",
            url: "/api/profile",
            headers: createAuthenticatedHeaders(),
            body: {
                goal: "strength",
                experience: "intermediate",
                daysPerWeek: 4,
                sessionDuration: 60,
                equipment: "full_gym",
                injuries: "",
                generalNotes: "Prefer pull-ups",
                preferredSplit: "upper_lower",
            },
        });

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ success: true });
        expect(mockedPrisma.user_profiles.upsert).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { user_id: TEST_USER_ID },
                update: expect.objectContaining({
                    goal: "strength",
                    days_per_week: 4,
                }),
            }),
        );
    });

    it("fetches an existing profile for an authenticated user with caching", async () => {
        const app = createApp();
        mockedPrisma.user_profiles.findUnique.mockResolvedValue({
            user_id: TEST_USER_ID,
            ...profileFixtures.beginnerStrengthFullGym,
            updated_at: new Date("2026-03-20T12:00:00.000Z"),
        });

        const firstResponse = await invokeExpressRoute(app, {
            method: "GET",
            url: "/api/profile",
            headers: createAuthenticatedHeaders(),
        });

        const secondResponse = await invokeExpressRoute(app, {
            method: "GET",
            url: "/api/profile",
            headers: createAuthenticatedHeaders(),
        });

        expect(firstResponse.status).toBe(200);
        expect(firstResponse.headers["x-cache"]).toBe("MISS");
        expect(secondResponse.status).toBe(200);
        expect(secondResponse.headers["x-cache"]).toBe("HIT");
        expect(mockedPrisma.user_profiles.findUnique).toHaveBeenCalledTimes(1);
    });

    it("invalidates only the profile cache after a profile update", async () => {
        const app = createApp();
        mockedPrisma.user_profiles.findUnique.mockResolvedValue({
            user_id: TEST_USER_ID,
            ...profileFixtures.beginnerStrengthFullGym,
            updated_at: new Date("2026-03-20T12:00:00.000Z"),
        });
        mockedPrisma.user_profiles.upsert.mockResolvedValue({ user_id: TEST_USER_ID });
        mockedPrisma.training_plans.findFirst.mockResolvedValue(createStoredPlan(2));

        await invokeExpressRoute(app, {
            method: "GET",
            url: "/api/profile",
            headers: createAuthenticatedHeaders(),
        });
        await invokeExpressRoute(app, {
            method: "GET",
            url: "/api/plan/current",
            headers: createAuthenticatedHeaders(),
        });

        await invokeExpressRoute(app, {
            method: "POST",
            url: "/api/profile",
            headers: createAuthenticatedHeaders(),
            body: {
                goal: "strength",
                experience: "intermediate",
                daysPerWeek: 4,
                sessionDuration: 60,
                equipment: "full_gym",
                injuries: "",
                generalNotes: "Prefer pull-ups",
                preferredSplit: "upper_lower",
            },
        });

        const profileAfterUpdate = await invokeExpressRoute(app, {
            method: "GET",
            url: "/api/profile",
            headers: createAuthenticatedHeaders(),
        });
        const currentPlanAfterUpdate = await invokeExpressRoute(app, {
            method: "GET",
            url: "/api/plan/current",
            headers: createAuthenticatedHeaders(),
        });

        expect(profileAfterUpdate.headers["x-cache"]).toBe("MISS");
        expect(currentPlanAfterUpdate.headers["x-cache"]).toBe("HIT");
        expect(mockedPrisma.user_profiles.findUnique).toHaveBeenCalledTimes(2);
        expect(mockedPrisma.training_plans.findFirst).toHaveBeenCalledTimes(1);
    });

    it(requestValidationOutcomes[0].title, async () => {
        const app = createApp();
        const res = await invokeExpressRoute(app, {
            method: "POST",
            url: "/api/profile",
            headers: createAuthenticatedHeaders(),
            body: {
                goal: "marathon",
                experience: "intermediate",
                daysPerWeek: 4,
                sessionDuration: 60,
                equipment: "full_gym",
                injuries: "",
                generalNotes: "",
                preferredSplit: "upper_lower",
            },
        });

        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: "Invalid option: expected one of \"cut\"|\"bulk\"|\"recomp\"|\"strength\"|\"endurance\"" });
        expect(mockedPrisma.user_profiles.upsert).not.toHaveBeenCalled();
    });
});

describe("plan routes", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        resetServerRuntime();
        mockedGenerateTrainingPlan.mockResolvedValue(createGeneratedPlanFixture());
        mockedPrisma.analytics_events.create.mockResolvedValue({ id: "analytics_1" });
        mockedPrisma.training_plans.create.mockImplementation(
            async ({ data }: { data: Record<string, unknown> }) => ({
                id: "plan_new",
                user_id: TEST_USER_ID,
                version: data.version,
                created_at: new Date("2026-03-20T12:00:00.000Z"),
                plan_json: data.plan_json,
                plan_text: data.plan_text,
            }),
        );
    });

    for (const scenario of userScenarios.filter((item) => Boolean(item.profileKey && item.mode))) {
        it(scenario.title, async () => {
            const app = createApp();
            mockedPrisma.user_profiles.findUnique.mockResolvedValue(profileFixtures[scenario.profileKey!]);
            mockedPrisma.training_plans.findFirst.mockResolvedValue(null);
            mockedGenerateTrainingPlan.mockResolvedValue(createGeneratedPlanFixture(scenario.mode));

            const res = await invokeExpressRoute(app, {
                method: "POST",
                url: "/api/plan/generate",
                headers: createAuthenticatedHeaders(),
                body: {
                    mode: scenario.mode,
                    notes: `Scenario request for ${scenario.mode}`,
                },
            });

            expect(res.status).toBe(200);
            expect(res.body).toMatchObject({ version: 1 });
            expect(mockedGenerateTrainingPlan).toHaveBeenCalledWith(
                profileFixtures[scenario.profileKey!],
                expect.objectContaining({
                    mode: scenario.mode,
                }),
            );
        });
    }

    it(planGenerationOutcomes[0].title, async () => {
        const app = createApp();
        mockedPrisma.user_profiles.findUnique.mockResolvedValue(profileFixtures.beginnerStrengthFullGym);
        mockedPrisma.training_plans.findFirst.mockResolvedValue(null);

        const res = await invokeExpressRoute(app, {
            method: "POST",
            url: "/api/plan/generate",
            headers: createAuthenticatedHeaders(),
            body: { mode: "same" },
        });

        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({
            id: "plan_new",
            version: 1,
        });
    });

    it(planGenerationOutcomes[1].title, async () => {
        const app = createApp();
        mockedPrisma.user_profiles.findUnique.mockResolvedValue(profileFixtures.beginnerStrengthFullGym);
        mockedPrisma.training_plans.findFirst.mockResolvedValue(createStoredPlan(2));

        const res = await invokeExpressRoute(app, {
            method: "POST",
            url: "/api/plan/generate",
            headers: createAuthenticatedHeaders(),
            body: { mode: "update", notes: "Add more posterior chain work" },
        });

        expect(res.status).toBe(200);
        expect((res.body as { version: number }).version).toBe(3);
        expect(mockedGenerateTrainingPlan).toHaveBeenCalledWith(
            profileFixtures.beginnerStrengthFullGym,
            expect.objectContaining({
                mode: "update",
                previousPlan: createStoredPlan(2).plan_json,
            }),
        );
    });

    it(planGenerationOutcomes[2].title, async () => {
        const app = createApp();
        mockedPrisma.user_profiles.findUnique.mockResolvedValue(null);

        const res = await invokeExpressRoute(app, {
            method: "POST",
            url: "/api/plan/generate",
            headers: createAuthenticatedHeaders(),
            body: { mode: "same" },
        });

        expect(res.status).toBe(404);
        expect(res.body).toEqual({
            error: "User profile not found. Complete onboarding first.",
        });
    });

    it(planGenerationOutcomes[3].title, async () => {
        const app = createApp();
        mockedPrisma.user_profiles.findUnique.mockResolvedValue(profileFixtures.beginnerStrengthFullGym);
        mockedPrisma.training_plans.findFirst.mockResolvedValue(null);
        mockedGenerateTrainingPlan.mockRejectedValue(new Error("provider unavailable"));

        const res = await invokeExpressRoute(app, {
            method: "POST",
            url: "/api/plan/generate",
            headers: createAuthenticatedHeaders(),
            body: { mode: "same" },
        });

        expect(res.status).toBe(500);
        expect(res.body).toEqual({
            error: "Failed to generate training plan. Please try again.",
            details: "provider unavailable",
        });
    });

    it(planGenerationOutcomes[4].title, async () => {
        const app = createApp();
        const res = await invokeExpressRoute(app, {
            method: "POST",
            url: "/api/plan/generate",
            body: { mode: "same" },
        });

        expect(res.status).toBe(401);
        expect(res.body).toEqual({ error: "Authentication required" });
    });

    it(planGenerationOutcomes[5].title, async () => {
        const app = createApp();
        const res = await invokeExpressRoute(app, {
            method: "POST",
            url: "/api/plan/generate",
            headers: createAuthenticatedHeaders(),
            body: { mode: "swap" },
        });

        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: "Invalid option: expected one of \"same\"|\"update\"|\"change\"" });
        expect(mockedGenerateTrainingPlan).not.toHaveBeenCalled();
    });

    it(requestValidationOutcomes[1].title, async () => {
        const app = createApp();
        const res = await invokeExpressRoute(app, {
            method: "POST",
            url: "/api/plan/generate",
            headers: createAuthenticatedHeaders(),
            body: { mode: "swap" },
        });

        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: "Invalid option: expected one of \"same\"|\"update\"|\"change\"" });
        expect(mockedGenerateTrainingPlan).not.toHaveBeenCalled();
    });

    it("fetches the current plan with cache hit and miss headers", async () => {
        const app = createApp();
        const storedPlan = createStoredPlan(2);
        mockedPrisma.training_plans.findFirst.mockResolvedValue(storedPlan);

        const firstResponse = await invokeExpressRoute(app, {
            method: "GET",
            url: "/api/plan/current",
            headers: createAuthenticatedHeaders(),
        });
        const secondResponse = await invokeExpressRoute(app, {
            method: "GET",
            url: "/api/plan/current",
            headers: createAuthenticatedHeaders(),
        });

        expect(firstResponse.status).toBe(200);
        expect(firstResponse.headers["x-cache"]).toBe("MISS");
        expect(firstResponse.body).toMatchObject({
            id: storedPlan.id,
            userId: TEST_USER_ID,
            version: 2,
        });
        expect(secondResponse.status).toBe(200);
        expect(secondResponse.headers["x-cache"]).toBe("HIT");
        expect(mockedPrisma.training_plans.findFirst).toHaveBeenCalledTimes(1);
    });

    it("invalidates the current plan cache after a successful generation", async () => {
        const app = createApp();
        mockedPrisma.user_profiles.findUnique.mockResolvedValue(profileFixtures.beginnerStrengthFullGym);
        mockedPrisma.training_plans.findFirst.mockResolvedValue(createStoredPlan(2));

        const firstGet = await invokeExpressRoute(app, {
            method: "GET",
            url: "/api/plan/current",
            headers: createAuthenticatedHeaders(),
        });
        const secondGet = await invokeExpressRoute(app, {
            method: "GET",
            url: "/api/plan/current",
            headers: createAuthenticatedHeaders(),
        });

        const generateResponse = await invokeExpressRoute(app, {
            method: "POST",
            url: "/api/plan/generate",
            headers: createAuthenticatedHeaders(),
            body: { mode: "same" },
        });
        const thirdGet = await invokeExpressRoute(app, {
            method: "GET",
            url: "/api/plan/current",
            headers: createAuthenticatedHeaders(),
        });

        expect(firstGet.headers["x-cache"]).toBe("MISS");
        expect(secondGet.headers["x-cache"]).toBe("HIT");
        expect(generateResponse.status).toBe(200);
        expect(thirdGet.headers["x-cache"]).toBe("MISS");
        expect(mockedPrisma.training_plans.findFirst).toHaveBeenCalledTimes(3);
    });

    it("returns 404 when no current plan exists", async () => {
        const app = createApp();
        mockedPrisma.training_plans.findFirst.mockResolvedValue(null);

        const res = await invokeExpressRoute(app, {
            method: "GET",
            url: "/api/plan/current",
            headers: createAuthenticatedHeaders(),
        });

        expect(res.status).toBe(404);
        expect(res.body).toEqual({ error: "No plan found" });
        expect(res.headers["x-cache"]).toBe("MISS");
    });

    it("rate limits repeated plan generation requests", async () => {
        const app = createApp();
        mockedPrisma.user_profiles.findUnique.mockResolvedValue(profileFixtures.beginnerStrengthFullGym);
        mockedPrisma.training_plans.findFirst.mockResolvedValue(null);

        for (let index = 0; index < 5; index += 1) {
            const response = await invokeExpressRoute(app, {
                method: "POST",
                url: "/api/plan/generate",
                headers: createAuthenticatedHeaders(),
                body: {
                    mode: "same",
                    notes: `request-${index}`,
                },
            });

            expect(response.status).toBe(200);
        }

        const limitedResponse = await invokeExpressRoute(app, {
            method: "POST",
            url: "/api/plan/generate",
            headers: createAuthenticatedHeaders(),
            body: {
                mode: "same",
                notes: "request-6",
            },
        });

        expect(limitedResponse.status).toBe(429);
        expect(limitedResponse.body).toEqual({
            error: "Too many plan generation requests. Please wait and try again.",
        });
        expect(limitedResponse.headers["retry-after"]).toBeDefined();
    });

    it("deduplicates concurrent identical generate requests", async () => {
        const app = createApp();
        mockedPrisma.user_profiles.findUnique.mockResolvedValue(profileFixtures.beginnerStrengthFullGym);
        mockedPrisma.training_plans.findFirst.mockResolvedValue(null);

        let resolvePlan: ((value: ReturnType<typeof createGeneratedPlanFixture>) => void) | null = null;
        const pendingPlan = new Promise<ReturnType<typeof createGeneratedPlanFixture>>((resolve) => {
            resolvePlan = resolve;
        });
        mockedGenerateTrainingPlan.mockImplementation(() => pendingPlan);

        const firstRequest = invokeExpressRoute(app, {
            method: "POST",
            url: "/api/plan/generate",
            headers: createAuthenticatedHeaders(),
            body: {
                mode: "change",
                notes: "make it harder",
            },
        });

        await Promise.resolve();

        const secondRequest = invokeExpressRoute(app, {
            method: "POST",
            url: "/api/plan/generate",
            headers: createAuthenticatedHeaders(),
            body: {
                mode: "change",
                notes: "make it harder",
            },
        });

        resolvePlan?.(createGeneratedPlanFixture("change"));

        const [firstResponse, secondResponse] = await Promise.all([firstRequest, secondRequest]);

        expect(firstResponse.status).toBe(200);
        expect(secondResponse.status).toBe(200);
        expect(firstResponse.body).toEqual(secondResponse.body);
        expect(mockedGenerateTrainingPlan).toHaveBeenCalledTimes(1);
        expect(mockedPrisma.training_plans.create).toHaveBeenCalledTimes(1);
    });

    it("records server analytics for cache events and rate limits", async () => {
        const app = createApp();
        mockedPrisma.training_plans.findFirst.mockResolvedValue(createStoredPlan(1));
        mockedPrisma.user_profiles.findUnique.mockResolvedValue(profileFixtures.beginnerStrengthFullGym);

        await invokeExpressRoute(app, {
            method: "GET",
            url: "/api/plan/current",
            headers: createAuthenticatedHeaders(),
        });
        await invokeExpressRoute(app, {
            method: "GET",
            url: "/api/plan/current",
            headers: createAuthenticatedHeaders(),
        });

        for (let index = 0; index < 6; index += 1) {
            await invokeExpressRoute(app, {
                method: "POST",
                url: "/api/plan/generate",
                headers: createAuthenticatedHeaders(),
                body: {
                    mode: "same",
                    notes: `note-${index}`,
                },
            });
        }

        const eventNames = mockedPrisma.analytics_events.create.mock.calls.map(
            ([call]) => call.data.event_name,
        );

        expect(eventNames).toContain("cache_miss");
        expect(eventNames).toContain("cache_hit");
        expect(eventNames).toContain("rate_limited");
    });
});

describe("analytics routes", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        resetServerRuntime();
        mockedPrisma.analytics_events.create.mockResolvedValue({ id: "analytics_1" });
    });

    it("accepts anonymous analytics events", async () => {
        const app = createApp();

        const res = await invokeExpressRoute(app, {
            method: "POST",
            url: "/api/analytics/events",
            body: {
                eventName: "page_view",
                path: "/",
                sessionId: "session-1",
                properties: {
                    title: "GymAI",
                },
            },
        });

        expect(res.status).toBe(202);
        expect(res.body).toEqual({ accepted: true });
        expect(mockedPrisma.analytics_events.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    user_id: null,
                    source: "client",
                    event_name: "page_view",
                }),
            }),
        );
    });

    it("attaches the authenticated user to analytics events when auth is present", async () => {
        const app = createApp();

        const res = await invokeExpressRoute(app, {
            method: "POST",
            url: "/api/analytics/events",
            headers: createAuthenticatedHeaders(),
            body: {
                eventName: "plan_generation_requested",
                path: "/profile",
                sessionId: "session-2",
            },
        });

        expect(res.status).toBe(202);
        expect(mockedPrisma.analytics_events.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    user_id: TEST_USER_ID,
                    source: "client",
                    event_name: "plan_generation_requested",
                }),
            }),
        );
    });
});
