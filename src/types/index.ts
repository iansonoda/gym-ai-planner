import type {
    Equipment,
    Experience,
    Goal,
    PreferredSplit,
    ProfileInput as SharedProfileInput,
    RegeneratePlanInput as SharedRegeneratePlanInput,
    UserProfileCore,
} from "../../shared/schemas";

export interface User {
    id: string;
    email: string;
    createdAt: string;
}

export type UserProfile = UserProfileCore & {
    user_id: string;
    updated_at: string;
};

export type ProfileInput = SharedProfileInput;
export type RegeneratePlanMode = "same" | "update" | "change";
export type RegeneratePlanInput = SharedRegeneratePlanInput;
export type ProfileGoal = Goal;
export type ProfileExperience = Experience;
export type ProfileEquipment = Equipment;
export type ProfilePreferredSplit = PreferredSplit;

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
