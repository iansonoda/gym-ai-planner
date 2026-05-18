// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AuthProvider from "./AuthContext";
import { useAuth } from "./useAuth";
import { getCurrentUser } from "@/lib/auth";

vi.mock("@/lib/auth", () => ({
    getCurrentUser: vi.fn(),
    signOut: vi.fn(),
    devLogin: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
    api: {
        getCurrentPlan: vi.fn().mockRejectedValue(new Error("No plan")),
    },
}));

vi.mock("@/lib/analytics", () => ({
    trackEvent: vi.fn(),
}));

function Probe() {
    const { user, isLoading } = useAuth();
    if (isLoading) return <span>Loading</span>;
    return <span>{user?.email ?? "Anonymous"}</span>;
}

describe("AuthProvider", () => {
    beforeEach(() => vi.clearAllMocks());

    it("loads the current session user from the auth API", async () => {
        vi.mocked(getCurrentUser).mockResolvedValue({
            id: "550e8400-e29b-41d4-a716-446655440000",
            email: "dev@example.com",
            name: "Dev User",
            avatarUrl: null,
            providers: ["dev"],
        });

        render(
            <AuthProvider>
                <Probe />
            </AuthProvider>,
        );

        await waitFor(() => {
            expect(screen.getByText("dev@example.com")).toBeInTheDocument();
        });
    });
});
