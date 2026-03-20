import { Router, type Request, type Response } from "express";
import { recordClientAnalyticsEvent, validateAnalyticsEventInput } from "../lib/analytics";
import { resolveOptionalAuth } from "../lib/auth";

export const analyticsRouter = Router();

analyticsRouter.post("/events", async (req: Request, res: Response) => {
    const parsed = validateAnalyticsEventInput(req.body ?? {});

    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error });
    }

    const auth = await resolveOptionalAuth(req);

    await recordClientAnalyticsEvent(parsed.data, auth?.userId ?? null);

    return res.status(202).json({ accepted: true });
});
