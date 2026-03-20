import { Router, type Request, type Response } from "express";
import { getValidationErrorMessage, profileInputSchema } from "../../../shared/schemas";
import { requireAuth, type AuthenticatedRequest } from "../lib/auth";
import { recordServerEvent } from "../lib/analytics";
import { prisma } from "../lib/prisma";
import { getCacheKey, profileCache } from "../lib/server-runtime";

export const profileRouter = Router();

profileRouter.use(requireAuth);

profileRouter.get("/", async (req: Request, res: Response) => {
    const startedAt = performance.now();

    try {
        const { userId } = (req as AuthenticatedRequest).auth;
        const cacheKey = getCacheKey(userId);
        const cachedProfile = profileCache.get(cacheKey);

        if (cachedProfile) {
            res.setHeader("X-Cache", "HIT");
            await recordServerEvent({
                req,
                eventName: "cache_hit",
                startedAt,
                properties: {
                    cacheKey,
                    cacheName: "profile",
                    statusCode: 200,
                },
            });
            return res.json(cachedProfile);
        }

        res.setHeader("X-Cache", "MISS");
        await recordServerEvent({
            req,
            eventName: "cache_miss",
            startedAt,
            properties: {
                cacheKey,
                cacheName: "profile",
            },
        });

        const profile = await prisma.user_profiles.findUnique({
            where: { user_id: userId },
        });

        if (!profile) {
            return res.status(404).json({ error: "User profile not found" });
        }

        const responseBody = {
            user_id: profile.user_id,
            goal: profile.goal,
            experience: profile.experience,
            days_per_week: profile.days_per_week,
            session_duration: profile.session_duration,
            equipment: profile.equipment,
            injuries: profile.injuries,
            general_notes: profile.general_notes,
            preferred_split: profile.preferred_split,
            updated_at: profile.updated_at,
        };

        profileCache.set(cacheKey, responseBody);

        res.json(responseBody);
    } catch (error) {
        console.error("Error fetching profile: ", error);
        return res.status(500).json({ error: "Failed to fetch profile" });
    }
});

profileRouter.post("/", async (req: Request, res: Response) => {
    try {
        const { userId } = (req as AuthenticatedRequest).auth;
        const parsedProfile = profileInputSchema.safeParse(req.body);

        if (!parsedProfile.success) {
            return res.status(400).json({
                error: getValidationErrorMessage(parsedProfile.error, "Invalid profile input."),
            });
        }

        const {
            goal,
            experience,
            daysPerWeek,
            sessionDuration,
            equipment,
            injuries,
            generalNotes,
            preferredSplit,
        } = parsedProfile.data;


        await prisma.user_profiles.upsert({
            where: {user_id: userId},
            update: {
                goal,
                experience,
                days_per_week: daysPerWeek,
                session_duration: sessionDuration,
                equipment,
                injuries: injuries.length > 0 ? injuries : null,
                general_notes: generalNotes.length > 0 ? generalNotes : null,
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
                injuries: injuries.length > 0 ? injuries : null,
                general_notes: generalNotes.length > 0 ? generalNotes : null,
                preferred_split: preferredSplit,
            }
        });

        profileCache.delete(getCacheKey(userId));

        res.json({ success: true });
        
    } catch (error) {
        console.error("Error saving profile: ", error);
        return res.status(500).json({ error: "Failed to save profile" });
    }
})
