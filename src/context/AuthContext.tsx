import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { User, ProfileInput, TrainingPlan } from "../types";
import { authClient } from "@/lib/auth";
import { api } from "@/lib/api";
import { useCallback } from "react";

interface AuthContextType {
    user: User | null;
    plan: TrainingPlan | null;
    isLoading: boolean;
    saveProfile: (profile: ProfileInput) => Promise<void>;
    generatePlan: () => Promise<void>;
    refreshData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const [neonUser, setNeonUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [plan, setPlan] = useState<TrainingPlan | null>(null);
    const isRefreshingRef = useRef(false);

    useEffect(() => {
        async function loadUser() {
            try {
                const result = await authClient.getSession()
                if (result && result.data?.user) {
                    const user = result.data.user;
                    setNeonUser(user);
                    
                    // Immediately fetch plan for the logged in user
                    const planData = await api.getCurrentPlan(user.id).catch(() => null);
                    if (planData) {
                        setPlan({
                            id: planData.id,
                            userId: planData.userId,
                            overview: planData.planJson.overview,
                            weeklySchedule: planData.planJson.weeklySchedule,
                            progression: planData.planJson.progression,
                            version: planData.version,
                            createdAt: planData.createdAt,
                        });
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
        if (!isLoading && !neonUser) {
            setPlan(null);
        }
    }, [neonUser?.id, isLoading])

    // refreshData with memoization
    const refreshData = useCallback(async () => {
        if (!neonUser || isRefreshingRef.current) return;
        
        isRefreshingRef.current = true;
        try {
            // Fetch profile
            //const profileData =

            // Fetch plan
            const planData = await api.getCurrentPlan(neonUser.id).catch(() => null);
        
            if (planData) {
                setPlan({
                    id: planData.id,
                    userId: planData.userId,
                    overview: planData.planJson.overview,
                    weeklySchedule: planData.planJson.weeklySchedule,
                    progression: planData.planJson.progression,
                    version: planData.version,
                    createdAt: planData.createdAt,
                })
            }
        } catch (error) {
            console.error("Error refreshing data:", error);
        } finally {
            isRefreshingRef.current = false;
        }
    }, [neonUser?.id])

    async function saveProfile(profileData: ProfileInput) {
        if (!neonUser) {
            throw new Error("User must be logged in to save profile");
        }

        await api.saveProfile(neonUser.id, profileData);
        await refreshData();
    }

    async function generatePlan() {
        if (!neonUser) {
            throw new Error("User must be logged in to generate plan");
        }

        await api.generatePlan(neonUser.id);
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

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}