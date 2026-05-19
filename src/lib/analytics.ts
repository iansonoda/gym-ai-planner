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
    await fetch(`${BASE_URL}/api/analytics/events`, {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
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
