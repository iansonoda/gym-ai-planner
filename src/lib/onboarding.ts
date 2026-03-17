import type { ProfileInput } from "../types";

export interface OnboardingFormData {
    goal: string;
    experience: string;
    daysPerWeek: string;
    sessionDuration: string;
    equipment: string;
    injuries: string;
    preferredSplit: string;
}

export function normalizeOnboardingProfile(formData: OnboardingFormData): ProfileInput {
    return {
        goal: formData.goal,
        experience: formData.experience,
        daysPerWeek: Number(formData.daysPerWeek),
        sessionDuration: Number(formData.sessionDuration),
        equipment: formData.equipment,
        injuries: formData.injuries.trim(),
        preferredSplit: formData.preferredSplit,
    };
}
