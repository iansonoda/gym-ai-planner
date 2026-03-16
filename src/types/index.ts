export interface User {
    id: string;
    email: string;
    createdAt: string;
}

export interface UserProfile {
    user_id: string;
    goal: "cut" | "bulk" | "recomp" | "strength" | "endurance";
    experience: "beginner" | "intermediate" | "advanced";
    days_per_week: number;
    session_duration: number;
    equipment: "full_gym" | "home" | "dumbbells" | "calisthenics";
    injuries: string | null;
    preferred_split: "push_pull_legs" | "upper_lower" | "full_body" | "custom";
    updated_at: string;
}

export interface ProfileInput {
    goal: string;
    experience: string;
    daysPerWeek: number;
    sessionDuration: number;
    equipment: string;
    injuries: string;
    preferredSplit: string;
}
