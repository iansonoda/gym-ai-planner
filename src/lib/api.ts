import type { ProfileInput, RegeneratePlanInput, UserProfile } from "../types"
import { getAuthToken } from "./auth";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

async function getAuthHeaders() {
    const token = await getAuthToken();
    const headers: Record<string, string> = {};

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    return headers;
}

async function post(path: string, body: object) {
    const authHeaders = await getAuthHeaders();
    const res = await fetch(`${BASE_URL}/api${path}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...authHeaders,
        },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        throw new Error(
            (await res.json().catch(() => ({}))).error || "Request failed"
        );
    }
    return res.json();
};

async function get(path: string) {
    const authHeaders = await getAuthHeaders();
    const res = await fetch(`${BASE_URL}/api${path}`, {
        headers: authHeaders,
    });
    if (!res.ok) {
        throw new Error(
            (await res.json().catch(() => ({}))).error || "Request failed"
        );
    }
    return res.json();

};

export const api = {
    saveProfile: (profile: ProfileInput) => {
        return post("/profile", profile)
    },
    getProfile: (): Promise<UserProfile> => get("/profile"),
    generatePlan: (input?: RegeneratePlanInput) => post("/plan/generate", input ?? {}),
    getCurrentPlan: () => get("/plan/current"),
};
