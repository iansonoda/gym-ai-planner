import { createContext } from "react";
import type { ProfileInput, RegeneratePlanInput, TrainingPlan, User } from "../types";

export interface AuthContextType {
    user: User | null;
    plan: TrainingPlan | null;
    isLoading: boolean;
    saveProfile: (profile: ProfileInput) => Promise<void>;
    generatePlan: (input?: RegeneratePlanInput) => Promise<void>;
    refreshData: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);
