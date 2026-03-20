import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./prisma", () => ({
    prisma: {
        analytics_events: {
            create: vi.fn(),
        },
    },
}));

import { prisma } from "./prisma";
import { persistAnalyticsEvent, validateAnalyticsEventInput } from "./analytics";

const mockedPrisma = prisma as {
    analytics_events: {
        create: ReturnType<typeof vi.fn>;
    };
};

describe("analytics helpers", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockedPrisma.analytics_events.create.mockResolvedValue({ id: "analytics_1" });
    });

    it("validates analytics payloads", () => {
        expect(
            validateAnalyticsEventInput({
                eventName: "page_view",
                path: "/profile",
                sessionId: "session-1",
                properties: {
                    title: "My Plan | GymAI",
                },
            }),
        ).toMatchObject({
            success: true,
        });

        expect(
            validateAnalyticsEventInput({
                eventName: "",
                sessionId: "",
            }),
        ).toMatchObject({
            success: false,
            error: "Event name is required.",
        });
    });

    it("persists analytics events with optional user association", async () => {
        await persistAnalyticsEvent({
            source: "client",
            eventName: "plan_generation_requested",
            sessionId: "session-2",
            path: "/profile",
            userId: "user_123",
            properties: {
                mode: "same",
            },
        });

        expect(mockedPrisma.analytics_events.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                user_id: "user_123",
                source: "client",
                event_name: "plan_generation_requested",
                path: "/profile",
            }),
        });
    });
});
