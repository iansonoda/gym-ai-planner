import type { Request } from "express";
import { Prisma } from "../../generated/prisma/client";
import {
    analyticsEventInputSchema,
    analyticsSourceSchema,
    getValidationErrorMessage,
    type AnalyticsEventInput,
    type AnalyticsSource,
} from "../../../shared/schemas";
import type { AuthenticatedRequest } from "./auth";
import { prisma } from "./prisma";
import { getRequestIp } from "./request";

interface PersistAnalyticsEventInput {
    eventName: string;
    path?: string;
    sessionId: string;
    properties?: Record<string, unknown>;
    source: AnalyticsSource;
    userId?: string | null;
}

interface RecordServerEventInput {
    req: Request;
    eventName: string;
    properties?: Record<string, unknown>;
    startedAt?: number;
}

function isAnalyticsEnabled() {
    const rawValue = process.env.ANALYTICS_ENABLED;

    if (!rawValue) {
        return true;
    }

    return rawValue.toLowerCase() !== "false";
}

export function validateAnalyticsEventInput(payload: unknown) {
    const parsed = analyticsEventInputSchema.safeParse(payload);

    if (!parsed.success) {
        return {
            success: false as const,
            error: getValidationErrorMessage(parsed.error, "Invalid analytics event payload."),
        };
    }

    return {
        success: true as const,
        data: parsed.data,
    };
}

export async function persistAnalyticsEvent({
    eventName,
    path,
    sessionId,
    properties,
    source,
    userId = null,
}: PersistAnalyticsEventInput) {
    if (!isAnalyticsEnabled()) {
        return;
    }

    const validatedSource = analyticsSourceSchema.parse(source);

    try {
        await prisma.analytics_events.create({
            data: {
                user_id: userId,
                session_id: sessionId,
                source: validatedSource,
                event_name: eventName,
                path: path ?? null,
                properties: properties
                    ? (properties as Prisma.InputJsonValue)
                    : Prisma.JsonNull,
            },
        });
    } catch (error) {
        console.error("Failed to persist analytics event:", error);
    }
}

export async function recordClientAnalyticsEvent(
    payload: AnalyticsEventInput,
    userId?: string | null,
) {
    await persistAnalyticsEvent({
        ...payload,
        source: "client",
        userId,
    });
}

export async function recordServerEvent({
    req,
    eventName,
    properties = {},
    startedAt,
}: RecordServerEventInput) {
    const auth = (req as Partial<AuthenticatedRequest>).auth;
    const durationMs =
        typeof startedAt === "number" ? Math.round((performance.now() - startedAt) * 100) / 100 : undefined;
    const path = req.originalUrl || req.path;
    const userId = auth?.userId ?? null;
    const sessionId = userId ? `server-user:${userId}` : `server-ip:${getRequestIp(req)}`;

    await persistAnalyticsEvent({
        eventName,
        source: "server",
        sessionId,
        path,
        userId,
        properties: {
            method: req.method,
            route: path,
            ...(typeof durationMs === "number" ? { durationMs } : {}),
            ...properties,
        },
    });
}
