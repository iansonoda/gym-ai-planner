import { beforeEach, describe, expect, it, vi } from "vitest";
import { performanceTargets } from "../../../test/fixtures/scenarios";
import { invokeExpressRoute } from "../../../test/helpers/express-test-utils";
import {
    createAuthenticatedHeaders,
    createGeneratedPlanFixture,
    profileFixtures,
    TEST_USER_ID,
} from "../../../test/helpers/server-test-utils";

vi.mock("../lib/prisma", () => ({
    prisma: {
        user_profiles: {
            findUnique: vi.fn(),
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
        resolveOptionalAuth: vi.fn(async () => ({
            payload: { sub: TEST_USER_ID },
            token: "test-token",
            userId: TEST_USER_ID,
        })),
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
    };
    training_plans: {
        findFirst: ReturnType<typeof vi.fn>;
        create: ReturnType<typeof vi.fn>;
    };
    analytics_events: {
        create: ReturnType<typeof vi.fn>;
    };
};

describe("plan route performance", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        resetServerRuntime();
        mockedPrisma.user_profiles.findUnique.mockResolvedValue(profileFixtures.beginnerStrengthFullGym);
        mockedPrisma.training_plans.findFirst.mockResolvedValue(null);
        mockedGenerateTrainingPlan.mockResolvedValue(createGeneratedPlanFixture());
        mockedPrisma.analytics_events.create.mockResolvedValue({ id: "analytics_1" });
        mockedPrisma.training_plans.create.mockResolvedValue({
            id: "plan_perf",
            user_id: TEST_USER_ID,
            version: 1,
            created_at: new Date("2026-03-20T12:00:00.000Z"),
            plan_json: createGeneratedPlanFixture(),
            plan_text: JSON.stringify(createGeneratedPlanFixture(), null, 2),
        });
    });

    it(performanceTargets[0].title, async () => {
        const app = createApp();
        const startedAt = performance.now();

        const res = await invokeExpressRoute(app, {
            method: "POST",
            url: "/api/plan/generate",
            headers: createAuthenticatedHeaders(),
            body: { mode: "same" },
        });

        const durationMs = performance.now() - startedAt;

        expect(res.status).toBe(200);
        expect(durationMs).toBeLessThan(performanceTargets[0].thresholdMs);
    });
});
