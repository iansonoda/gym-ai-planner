import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import passport from "passport";
import { analyticsRouter } from "./routes/analytics";
import { authRouter, configurePassport } from "./routes/auth";
import { apiRateLimiter } from "./lib/server-runtime";
import { createRateLimitMiddleware } from "./lib/rate-limit";
import { getRequestIp } from "./lib/request";
import { profileRouter } from "./routes/profile";
import { planRouter } from "./routes/plan";
import { createSessionMiddleware } from "./lib/session";

export function createApp() {
    const app = express();
    const appOrigin = process.env.APP_ORIGIN || "http://localhost:5173";

    configurePassport();

    app.use(
        cors({
            origin: appOrigin,
            credentials: true,
            exposedHeaders: [
                "X-Cache",
                "X-RateLimit-Limit",
                "X-RateLimit-Remaining",
                "X-RateLimit-Reset",
                "Retry-After",
            ],
        }),
    );
    app.use(cookieParser());
    app.use(express.json());
    app.use(
        "/api",
        createRateLimitMiddleware(apiRateLimiter, {
            key: (req) => `ip:${getRequestIp(req)}`,
            limit: Number(process.env.API_RATE_LIMIT_MAX || 120),
            windowMs: Number(process.env.API_RATE_LIMIT_WINDOW_MS || 900000),
            message: "Too many API requests. Please try again shortly.",
        }),
    );
    app.use(createSessionMiddleware());
    app.use(passport.initialize());
    app.use(passport.session());

    app.use("/api/auth", authRouter);
    app.use("/api/analytics", analyticsRouter);
    app.use("/api/profile", profileRouter);
    app.use("/api/plan", planRouter);

    return app;
}
