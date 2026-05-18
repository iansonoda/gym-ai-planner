import { useCallback, useEffect, useRef, useState } from "react";
import type { User, ProfileInput, RegeneratePlanInput, TrainingPlan } from "../types";
import { devLogin as createDevSession, getCurrentUser, signOut as destroySession } from "@/lib/auth";
import { trackEvent } from "@/lib/analytics";
import { api } from "@/lib/api";
import { AuthContext } from "./auth-context";

interface PlanResponse {
    id: string;
    userId: string;
    planJson: TrainingPlan;
    version: string;
    createdAt: string;
}

function mapPlan(planData: PlanResponse): TrainingPlan {
    return {
        id: planData.id,
        userId: planData.userId,
        overview: planData.planJson.overview,
        weeklySchedule: planData.planJson.weeklySchedule,
        progression: planData.planJson.progression,
        version: planData.version,
        createdAt: planData.createdAt,
    };
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [plan, setPlan] = useState<TrainingPlan | null>(null);
    const isRefreshingRef = useRef(false);
    const userId = user?.id ?? null;

    useEffect(() => {
        async function loadUser() {
            try {
                const currentUser = await getCurrentUser();

                if (currentUser) {
                    setUser(currentUser);
                    const planData = await api.getCurrentPlan().catch(() => null);
                    if (planData) {
                        setPlan(mapPlan(planData as PlanResponse));
                    }
                } else {
                    setUser(null);
                    setPlan(null);
                }
            } catch (error) {
                console.error(error);
                setUser(null);
                setPlan(null);
            } finally {
                setIsLoading(false);
            }
        }

        loadUser();
    }, [])

    useEffect(() => {
        if (!isLoading && !userId) {
            setPlan(null);
        }
    }, [userId, isLoading])

    const refreshData = useCallback(async () => {
        if (!userId || isRefreshingRef.current) return;

        isRefreshingRef.current = true;
        try {
            const planData = await api.getCurrentPlan().catch(() => null);

            if (planData) {
                setPlan(mapPlan(planData as PlanResponse));
            }
        } catch (error) {
            console.error("Error refreshing data:", error);
        } finally {
            isRefreshingRef.current = false;
        }
    }, [userId])

    const signOut = useCallback(async () => {
        await destroySession();
        setUser(null);
        setPlan(null);
    }, []);

    const devLogin = useCallback(async () => {
        const devUser = await createDevSession();
        setUser(devUser);
        const planData = await api.getCurrentPlan().catch(() => null);
        setPlan(planData ? mapPlan(planData as PlanResponse) : null);
    }, []);

    async function saveProfile(profileData: ProfileInput) {
        if (!userId) {
            throw new Error("User must be logged in to save profile");
        }

        await api.saveProfile(profileData);
        trackEvent({
            eventName: "profile_saved",
            path: "/onboarding",
            properties: {
                goal: profileData.goal,
                experience: profileData.experience,
                preferredSplit: profileData.preferredSplit,
            },
        });
        await refreshData();
    }

    async function generatePlan(input?: RegeneratePlanInput) {
        if (!userId) {
            throw new Error("User must be logged in to generate plan");
        }

        const mode = input?.mode ?? "same";

        trackEvent({
            eventName: "plan_generation_requested",
            path: "/profile",
            properties: {
                mode,
            },
        });

        try {
            await api.generatePlan(input);
            trackEvent({
                eventName: "plan_generation_succeeded",
                path: "/profile",
                properties: {
                    mode,
                },
            });
            await refreshData();
        } catch (error) {
            trackEvent({
                eventName: "plan_generation_failed",
                path: "/profile",
                properties: {
                    mode,
                    message: error instanceof Error ? error.message : "Unknown error",
                },
            });
            throw error;
        }
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                plan,
                isLoading,
                saveProfile,
                generatePlan,
                refreshData,
                signOut,
                devLogin,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}
