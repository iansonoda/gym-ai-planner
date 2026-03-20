import { Router, type Request, type Response } from "express";
import { getValidationErrorMessage, regeneratePlanInputSchema } from "../../../shared/schemas";
import { Prisma } from "../../generated/prisma/client";
import { requireAuth, type AuthenticatedRequest } from "../lib/auth";
import { prisma } from "../lib/prisma";
import { generateTrainingPlan } from "../lib/ai";
import type { RegeneratePlanRequest } from "../../types";

export const planRouter = Router();

planRouter.use(requireAuth);

planRouter.post("/generate", async (req: Request, res: Response) => {
    try {
        const { userId } = (req as AuthenticatedRequest).auth;
        const parsedInput = regeneratePlanInputSchema.safeParse(req.body ?? {});

        if (!parsedInput.success) {
            return res.status(400).json({
                error: getValidationErrorMessage(parsedInput.error, "Invalid plan regeneration request."),
            });
        }

        const { mode, notes } = parsedInput.data as RegeneratePlanRequest;

        const profile = await prisma.user_profiles.findUnique({
            where: {user_id: userId}
        })

        if (!profile) {
            return res
            .status(404)
            .json({ error: "User profile not found. Complete onboarding first." });
        }

        // Get latest plan
        const latestPlan = await prisma.training_plans.findFirst({
            where: {user_id: userId},
            orderBy: {created_at: "desc"}
        });

        const nextVersion = latestPlan ? latestPlan.version + 1 : 1;
        // Call AI
        let planJson;

        try {
            planJson = await generateTrainingPlan(profile, {
                mode,
                notes,
                previousPlan: latestPlan?.plan_json ?? null,
            });
        } catch (error) {
            console.error("AI generation failed: ", error);
            return res.status(500).json({
                error: "Failed to generate training plan. Please try again.",
                details: error instanceof Error ? error.message : "Unknown error",
            })
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

        res.json({
            id: newPlan.id,
            version: newPlan.version,
            createdAt: newPlan.created_at,
        })

    } catch (error) {
       console.error("Error generating plan: ", error); 
       return res.status(500).json({ error: "Failed to generate plan" });
    }
})

planRouter.get("/current", async (req: Request, res: Response) => {
    try {
        const { userId } = (req as AuthenticatedRequest).auth;

        const plan = await prisma.training_plans.findFirst({
            where: {user_id: userId},
            orderBy: {created_at: "desc"}
        });

        if (!plan) {
            return res.status(404).json({error: "No plan found"})
        }

        res.json({
            id: plan.id,
            userId: plan.user_id,
            planJson: plan.plan_json,
            planText: plan.plan_text,
            version: plan.version,
            createdAt: plan.created_at,
        });
    } catch (error) {
        console.error("Error fetching plan: ", error);
        return res.status(500).json({ error: "Failed to fetch plan" });
    }
});
