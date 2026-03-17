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
    general_notes: string | null;
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
    generalNotes: string;
    preferredSplit: string;
}

export type RegeneratePlanMode = "same" | "update" | "change";

export interface RegeneratePlanInput {
    mode: RegeneratePlanMode;
    notes?: string;
}

export interface PlanOverview {
    goal: string;
    frequency: string;
    split: string;
    notes: string;
}

export interface Exercise {
    name: string;
    sets: number;
    reps: string;
    rest: string;
    rpe: number;
    notes?: string;
    alternatives?: string[];
}

export interface DaySchedule {
    day: string;
    focus: string;
    exercises: Exercise[];
}

export interface TrainingPlan {
    id: string;
    userId: string;
    overview: PlanOverview;
    weeklySchedule: DaySchedule[];
    progression: string;
    version: string;
    createdAt: string;
}
