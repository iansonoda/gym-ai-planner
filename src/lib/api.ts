import type { ProfileInput, RegeneratePlanInput, UserProfile } from "../types";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

async function post(path: string, body: object) {
    const res = await fetch(`${BASE_URL}/api${path}`, {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        throw new Error(
            (await res.json().catch(() => ({}))).error || "Request failed"
        );
    }
    return res.json();
}

async function get(path: string) {
    const res = await fetch(`${BASE_URL}/api${path}`, {
        credentials: "include",
    });
    if (!res.ok) {
        throw new Error(
            (await res.json().catch(() => ({}))).error || "Request failed"
        );
    }
    return res.json();
}

export const api = {
    saveProfile: (profile: ProfileInput) => {
        return post("/profile", profile);
    },
    getProfile: (): Promise<UserProfile> => get("/profile"),
    generatePlan: (input?: RegeneratePlanInput) => post("/plan/generate", input ?? {}),
    getCurrentPlan: () => get("/plan/current"),
};
