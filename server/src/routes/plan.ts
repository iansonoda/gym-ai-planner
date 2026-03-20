import { Router, type Request, type Response } from "express";
import { getValidationErrorMessage, regeneratePlanInputSchema } from "../../../shared/schemas";
import { Prisma } from "../../generated/prisma/client";
import { requireAuth, type AuthenticatedRequest } from "../lib/auth";
import { recordServerEvent } from "../lib/analytics";
import { generateTrainingPlan } from "../lib/ai";
import { prisma } from "../lib/prisma";
import { getRequestIp } from "../lib/request";
import { createRateLimitMiddleware } from "../lib/rate-limit";
import {
    clearInFlightPlanRequest,
    currentPlanCache,
    getCacheKey,
    getInFlightPlanRequest,
    getPlanGenerationDeduplicationKey,
    planRateLimiter,
    setInFlightPlanRequest,
} from "../lib/server-runtime";
import type { RegeneratePlanRequest } from "../../types";

export const planRouter = Router();

planRouter.use(requireAuth);

class RouteError extends Error {
    constructor(
        public readonly status: number,
        public readonly body: Record<string, unknown>,
    ) {
        super(typeof body.error === "string" ? body.error : "Route error");
    }
}

const planGenerationRateLimiter = createRateLimitMiddleware(planRateLimiter, {
    key: (req) => {
        const auth = (req as Partial<AuthenticatedRequest>).auth;
        return auth?.userId ? `user:${auth.userId}` : `ip:${getRequestIp(req)}`;
    },
    limit: Number(process.env.PLAN_RATE_LIMIT_MAX || 5),
    windowMs: Number(process.env.PLAN_RATE_LIMIT_WINDOW_MS || 900000),
    message: "Too many plan generation requests. Please wait and try again.",
});

async function createPlanGenerationResponse(
    req: Request,
    input: RegeneratePlanRequest,
) {
    const { userId } = (req as AuthenticatedRequest).auth;
    const profile = await prisma.user_profiles.findUnique({
        where: { user_id: userId },
    });

    if (!profile) {
        throw new RouteError(404, {
            error: "User profile not found. Complete onboarding first.",
        });
    }

    const latestPlan = await prisma.training_plans.findFirst({
        where: { user_id: userId },
        orderBy: { created_at: "desc" },
    });

    const nextVersion = latestPlan ? latestPlan.version + 1 : 1;

    let planJson;

    try {
        planJson = await generateTrainingPlan(profile, {
            mode: input.mode,
            notes: input.notes,
            previousPlan: latestPlan?.plan_json ?? null,
        });
    } catch (error) {
        console.error("AI generation failed: ", error);
        throw new RouteError(500, {
            error: "Failed to generate training plan. Please try again.",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }

    const planText = JSON.stringify(planJson, null, 2);

    const newPlan = await prisma.training_plans.create({
        data: {
            user_id: userId,
            plan_json: planJson as Prisma.InputJsonValue,
            plan_text: planText,
            version: nextVersion,
        },
    });

    currentPlanCache.delete(getCacheKey(userId));

    return {
        id: newPlan.id,
        version: newPlan.version,
        createdAt: newPlan.created_at,
    };
}

planRouter.post(
    "/generate",
    planGenerationRateLimiter,
    async (req: Request, res: Response) => {
        const startedAt = performance.now();

        try {
            const { userId } = (req as AuthenticatedRequest).auth;
            const parsedInput = regeneratePlanInputSchema.safeParse(req.body ?? {});

            if (!parsedInput.success) {
                return res.status(400).json({
                    error: getValidationErrorMessage(parsedInput.error, "Invalid plan regeneration request."),
                });
            }

            const input = parsedInput.data as RegeneratePlanRequest;
            const dedupeKey = getPlanGenerationDeduplicationKey(userId, input);
            const inFlightRequest = getInFlightPlanRequest(dedupeKey);

            if (inFlightRequest) {
                const responseBody = await inFlightRequest;
                return res.json(responseBody);
            }

            const generationPromise = createPlanGenerationResponse(req, input);
            setInFlightPlanRequest(dedupeKey, generationPromise);

            try {
                await recordServerEvent({
                    req,
                    eventName: "plan_generate_started",
                    properties: {
                        mode: input.mode ?? "same",
                    },
                });

                const responseBody = await generationPromise;

                await recordServerEvent({
                    req,
                    eventName: "plan_generate_succeeded",
                    startedAt,
                    properties: {
                        mode: input.mode ?? "same",
                        statusCode: 200,
                        version: responseBody.version,
                    },
                });

                return res.json(responseBody);
            } finally {
                clearInFlightPlanRequest(dedupeKey);
            }
        } catch (error) {
            if (error instanceof RouteError) {
                if (error.status >= 500) {
                    await recordServerEvent({
                        req,
                        eventName: "plan_generate_failed",
                        startedAt,
                        properties: {
                            statusCode: error.status,
                            message: error.body.details ?? error.message,
                        },
                    });
                }

                return res.status(error.status).json(error.body);
            }

            console.error("Error generating plan: ", error);
            await recordServerEvent({
                req,
                eventName: "plan_generate_failed",
                startedAt,
                properties: {
                    statusCode: 500,
                    message: error instanceof Error ? error.message : "Unknown error",
                },
            });
            return res.status(500).json({ error: "Failed to generate plan" });
        }
    },
);

planRouter.get("/current", async (req: Request, res: Response) => {
    const startedAt = performance.now();

    try {
        const { userId } = (req as AuthenticatedRequest).auth;
        const cacheKey = getCacheKey(userId);
        const cachedPlan = currentPlanCache.get(cacheKey);

        if (cachedPlan) {
            res.setHeader("X-Cache", "HIT");
            await recordServerEvent({
                req,
                eventName: "cache_hit",
                startedAt,
                properties: {
                    cacheKey,
                    cacheName: "current_plan",
                    statusCode: 200,
                },
            });
            return res.json(cachedPlan);
        }

        res.setHeader("X-Cache", "MISS");
        await recordServerEvent({
            req,
            eventName: "cache_miss",
            startedAt,
            properties: {
                cacheKey,
                cacheName: "current_plan",
            },
        });

        const plan = await prisma.training_plans.findFirst({
            where: { user_id: userId },
            orderBy: { created_at: "desc" },
        });

        if (!plan) {
            return res.status(404).json({ error: "No plan found" });
        }

        const responseBody = {
            id: plan.id,
            userId: plan.user_id,
            planJson: plan.plan_json,
            planText: plan.plan_text,
            version: plan.version,
            createdAt: plan.created_at,
        };

        currentPlanCache.set(cacheKey, responseBody);

        res.json(responseBody);
    } catch (error) {
        console.error("Error fetching plan: ", error);
        return res.status(500).json({ error: "Failed to fetch plan" });
    }
});
