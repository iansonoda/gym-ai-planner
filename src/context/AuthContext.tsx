import { useCallback, useEffect, useRef, useState } from "react";
import type { User, ProfileInput, TrainingPlan } from "../types";
import { authClient } from "@/lib/auth";
import { api } from "@/lib/api";
import { AuthContext } from "./auth-context";

interface PlanResponse {
    id: string;
    userId: string;
    planJson: TrainingPlan;
    version: string;
    createdAt: string;
}

interface SessionUserLike {
    id: string;
    email: string;
    createdAt?: Date | string;
}

function mapUser(user: SessionUserLike): User {
    return {
        id: user.id,
        email: user.email,
        createdAt:
            user.createdAt instanceof Date
                ? user.createdAt.toISOString()
                : typeof user.createdAt === "string"
                  ? user.createdAt
                  : "",
    };
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
    const [neonUser, setNeonUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [plan, setPlan] = useState<TrainingPlan | null>(null);
    const isRefreshingRef = useRef(false);
    const userId = neonUser?.id ?? null;

    useEffect(() => {
        async function loadUser() {
            try {
                const result = await authClient.getSession();
                const sessionData = result?.data;
                const rawUser = sessionData && "user" in sessionData ? sessionData.user : null;

                if (rawUser && typeof rawUser.id === "string" && typeof rawUser.email === "string") {
                    const user = mapUser(rawUser);
                    setNeonUser(user);

                    const planData = await api.getCurrentPlan().catch(() => null);
                    if (planData) {
                        setPlan(mapPlan(planData as PlanResponse));
                    }
                } else {
                    setNeonUser(null);
                    setPlan(null);
                }
            } catch (error) {
                console.error(error);
                setNeonUser(null);
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

    async function saveProfile(profileData: ProfileInput) {
        if (!userId) {
            throw new Error("User must be logged in to save profile");
        }

        await api.saveProfile(profileData);
        await refreshData();
    }

    async function generatePlan() {
        if (!userId) {
            throw new Error("User must be logged in to generate plan");
        }

        await api.generatePlan();
        await refreshData();
    }

    return (
        <AuthContext.Provider 
            value={{
                user: neonUser, 
                plan, 
                isLoading, 
                saveProfile, 
                generatePlan, 
                refreshData
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}
