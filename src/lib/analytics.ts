import { getAuthToken } from "./auth";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
const SESSION_STORAGE_KEY = "gymai.analytics.session-id";

export interface ClientAnalyticsEvent {
    eventName: string;
    path?: string;
    properties?: Record<string, unknown>;
}

function createSessionId() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }

    return `session-${Date.now()}`;
}

export function getAnalyticsSessionId() {
    if (typeof window === "undefined") {
        return "server-render";
    }

    const existingSessionId = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (existingSessionId) {
        return existingSessionId;
    }

    const sessionId = createSessionId();
    window.localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
    return sessionId;
}

async function postAnalyticsEvent(payload: ClientAnalyticsEvent) {
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    };

    const token = await getAuthToken().catch(() => null);
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    await fetch(`${BASE_URL}/api/analytics/events`, {
        method: "POST",
        headers,
        body: JSON.stringify({
            ...payload,
            sessionId: getAnalyticsSessionId(),
        }),
        keepalive: true,
    });
}

export function trackEvent(payload: ClientAnalyticsEvent) {
    void postAnalyticsEvent(payload).catch(() => undefined);
}
