import { Router, type Request, type Response } from "express";
import { requireAuth, type AuthenticatedRequest } from "../lib/auth";
import { prisma } from "../lib/prisma";

export const profileRouter = Router();

profileRouter.use(requireAuth);

profileRouter.post("/", async (req: Request, res: Response) => {
    try {
        const { userId } = (req as AuthenticatedRequest).auth;
        const profileData = req.body;

        const {
            goal,
            experience,
            daysPerWeek,
            sessionDuration,
            equipment,
            injuries,
            preferredSplit,
        } = profileData;

        if (
            !goal ||
            !experience ||
            !daysPerWeek ||
            !sessionDuration ||
            !equipment ||
            !preferredSplit
        ) {
            return res.status(400).json({ error: "Missing required fields" });
        }


        await prisma.user_profiles.upsert({
            where: {user_id: userId},
            update: {
                goal,
                experience,
                days_per_week: daysPerWeek,
                session_duration: sessionDuration,
                equipment,
                injuries: injuries || null,
                preferred_split: preferredSplit,
                updated_at: new Date(),
            },
            create: {
                user_id: userId,
                goal,
                experience,
                days_per_week: daysPerWeek,
                session_duration: sessionDuration,
                equipment,
                injuries: injuries || null,
                preferred_split: preferredSplit,
            }
        });

        res.json({ success: true });
        
    } catch (error) {
        console.error("Error saving profile: ", error);
        return res.status(500).json({ error: "Failed to save profile" });
    }
})
