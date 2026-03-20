import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { profileRouter } from "./routes/profile";
import { planRouter } from "./routes/plan";

export function createApp() {
    const app = express();

    app.use(cors());
    app.use(cookieParser());
    app.use(express.json());

    app.use("/api/profile", profileRouter);
    app.use("/api/plan", planRouter);

    return app;
}
