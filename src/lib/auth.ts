import type { User } from "@/types";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

async function readError(res: Response, fallback: string) {
    const data = await res.json().catch(() => ({}));
    return data.error || fallback;
}

export async function getCurrentUser(): Promise<User | null> {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
        credentials: "include",
    });

    if (res.status === 401) {
        return null;
    }

    if (!res.ok) {
        throw new Error(await readError(res, "Failed to load user"));
    }

    const data = await res.json();
    return data.user;
}

export async function signOut() {
    const res = await fetch(`${BASE_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
    });

    if (!res.ok) {
        throw new Error(await readError(res, "Failed to sign out"));
    }
}

export async function devLogin(): Promise<User> {
    const res = await fetch(`${BASE_URL}/api/auth/dev-login`, {
        method: "POST",
        credentials: "include",
    });

    if (!res.ok) {
        throw new Error(await readError(res, "Failed to create dev session"));
    }

    const data = await res.json();
    return data.user;
}
