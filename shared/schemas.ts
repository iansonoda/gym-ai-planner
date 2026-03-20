import { z, type ZodError } from "zod";

export const goalValues = ["cut", "bulk", "recomp", "strength", "endurance"] as const;
export const experienceValues = ["beginner", "intermediate", "advanced"] as const;
export const equipmentValues = ["full_gym", "home", "dumbbells", "calisthenics"] as const;
export const preferredSplitValues = ["push_pull_legs", "upper_lower", "full_body", "custom"] as const;
export const regeneratePlanModeValues = ["same", "update", "change"] as const;

export const goalSchema = z.enum(goalValues);
export const experienceSchema = z.enum(experienceValues);
export const equipmentSchema = z.enum(equipmentValues);
export const preferredSplitSchema = z.enum(preferredSplitValues);
export const regeneratePlanModeSchema = z.enum(regeneratePlanModeValues);

const trimmedShortTextSchema = z
    .string()
    .trim()
    .max(500, "Keep this field under 500 characters.");

const trimmedNotesSchema = z
    .string()
    .trim()
    .max(1000, "Keep notes under 1000 characters.");

const daysPerWeekNumberSchema = z
    .number({ error: "Days per week must be a number." })
    .int("Days per week must be a whole number.")
    .min(2, "Days per week must be between 2 and 6.")
    .max(6, "Days per week must be between 2 and 6.");

const sessionDurationNumberSchema = z
    .number({ error: "Session duration must be a number." })
    .int("Session duration must be a whole number.")
    .min(30, "Session duration must be between 30 and 90 minutes.")
    .max(90, "Session duration must be between 30 and 90 minutes.");

const daysPerWeekInputSchema = z.coerce
    .number({ error: "Select a valid days-per-week option." })
    .int("Select a valid days-per-week option.")
    .min(2, "Select a valid days-per-week option.")
    .max(6, "Select a valid days-per-week option.");

const sessionDurationInputSchema = z.coerce
    .number({ error: "Select a valid session-duration option." })
    .int("Select a valid session-duration option.")
    .min(30, "Select a valid session-duration option.")
    .max(90, "Select a valid session-duration option.");

export const profileInputSchema = z.object({
    goal: goalSchema,
    experience: experienceSchema,
    daysPerWeek: daysPerWeekNumberSchema,
    sessionDuration: sessionDurationNumberSchema,
    equipment: equipmentSchema,
    injuries: trimmedShortTextSchema,
    generalNotes: trimmedNotesSchema,
    preferredSplit: preferredSplitSchema,
});

export const onboardingFormSchema = z
    .object({
        goal: goalSchema,
        experience: experienceSchema,
        daysPerWeek: daysPerWeekInputSchema,
        sessionDuration: sessionDurationInputSchema,
        equipment: equipmentSchema,
        injuries: trimmedShortTextSchema,
        generalNotes: trimmedNotesSchema,
        preferredSplit: preferredSplitSchema,
    })
    .transform((value) => profileInputSchema.parse(value));

const nullableTrimmedShortTextSchema = z.preprocess((value) => {
    if (value === null || value === undefined) {
        return null;
    }

    if (typeof value === "string") {
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : null;
    }

    return value;
}, z.string().max(500, "Keep this field under 500 characters.").nullable());

const nullableTrimmedNotesSchema = z.preprocess((value) => {
    if (value === null || value === undefined) {
        return null;
    }

    if (typeof value === "string") {
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : null;
    }

    return value;
}, z.string().max(1000, "Keep notes under 1000 characters.").nullable());

export const userProfileCoreSchema = z.object({
    goal: goalSchema,
    experience: experienceSchema,
    days_per_week: daysPerWeekNumberSchema,
    session_duration: sessionDurationNumberSchema,
    equipment: equipmentSchema,
    injuries: nullableTrimmedShortTextSchema,
    general_notes: nullableTrimmedNotesSchema,
    preferred_split: preferredSplitSchema,
});

export const normalizedUserProfileSchema = z.object({
    goal: goalSchema.catch("bulk"),
    experience: experienceSchema.catch("beginner"),
    days_per_week: z.coerce.number().int().min(2).max(6).catch(4),
    session_duration: z.coerce.number().int().min(30).max(90).catch(60),
    equipment: equipmentSchema.catch("full_gym"),
    injuries: nullableTrimmedShortTextSchema.catch(null),
    general_notes: nullableTrimmedNotesSchema.catch(null),
    preferred_split: preferredSplitSchema.catch("upper_lower"),
});

export const regeneratePlanInputSchema = z.object({
    mode: regeneratePlanModeSchema.optional(),
    notes: z.preprocess((value) => {
        if (value === undefined) {
            return undefined;
        }

        if (typeof value === "string") {
            const trimmed = value.trim();
            return trimmed.length > 0 ? trimmed : undefined;
        }

        return value;
    }, trimmedNotesSchema.optional()),
});

export const analyticsSourceSchema = z.enum(["client", "server"]);

export const analyticsEventInputSchema = z.object({
    eventName: z
        .string()
        .trim()
        .min(1, "Event name is required.")
        .max(100, "Event name must be under 100 characters."),
    path: z.preprocess((value) => {
        if (value === undefined || value === null) {
            return undefined;
        }

        if (typeof value === "string") {
            const trimmed = value.trim();
            return trimmed.length > 0 ? trimmed : undefined;
        }

        return value;
    }, z.string().max(500, "Path must be under 500 characters.").optional()),
    sessionId: z
        .string()
        .trim()
        .min(1, "Session ID is required.")
        .max(120, "Session ID must be under 120 characters."),
    properties: z.record(z.string(), z.unknown()).optional(),
});

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

const aiOptionalStringSchema = z.preprocess((value) => {
    if (typeof value !== "string") {
        return undefined;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
}, z.string().optional());

const aiOptionalNumberSchema = z.preprocess((value) => {
    return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}, z.number().optional());

const aiAlternativesSchema = z.preprocess((value) => {
    if (!Array.isArray(value)) {
        return undefined;
    }

    return value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
}, z.array(z.string()).optional());

const aiExerciseSchema = z.preprocess((value) => {
    return isRecord(value) ? value : {};
}, z.object({
    name: aiOptionalStringSchema,
    sets: aiOptionalNumberSchema,
    reps: aiOptionalStringSchema,
    rest: aiOptionalStringSchema,
    rpe: aiOptionalNumberSchema,
    notes: aiOptionalStringSchema,
    alternatives: aiAlternativesSchema,
}));

const aiDaySchema = z.preprocess((value) => {
    return isRecord(value) ? value : {};
}, z.object({
    day: aiOptionalStringSchema,
    focus: aiOptionalStringSchema,
    exercises: z.preprocess((value) => {
        return Array.isArray(value) ? value : [];
    }, z.array(aiExerciseSchema).optional()),
}));

const aiOverviewSchema = z.preprocess((value) => {
    return isRecord(value) ? value : {};
}, z.object({
    goal: aiOptionalStringSchema,
    frequency: aiOptionalStringSchema,
    split: aiOptionalStringSchema,
    notes: aiOptionalStringSchema,
}));

export const rawAiPlanResponseSchema = z.preprocess((value) => {
    return isRecord(value) ? value : {};
}, z.object({
    overview: aiOverviewSchema.optional(),
    weeklySchedule: z.preprocess((value) => {
        return Array.isArray(value) ? value : [];
    }, z.array(aiDaySchema).optional()),
    progression: aiOptionalStringSchema,
}));

export type Goal = z.infer<typeof goalSchema>;
export type Experience = z.infer<typeof experienceSchema>;
export type Equipment = z.infer<typeof equipmentSchema>;
export type PreferredSplit = z.infer<typeof preferredSplitSchema>;
export type RegeneratePlanMode = z.infer<typeof regeneratePlanModeSchema>;
export type ProfileInput = z.infer<typeof profileInputSchema>;
export type OnboardingFormData = z.input<typeof onboardingFormSchema>;
export type UserProfileCore = z.infer<typeof userProfileCoreSchema>;
export type RegeneratePlanInput = z.infer<typeof regeneratePlanInputSchema>;
export type AnalyticsSource = z.infer<typeof analyticsSourceSchema>;
export type AnalyticsEventInput = z.infer<typeof analyticsEventInputSchema>;
export type RawAiPlanResponse = z.infer<typeof rawAiPlanResponseSchema>;

export function getValidationErrorMessage(error: ZodError, fallback = "Invalid input.") {
    return error.issues[0]?.message ?? fallback;
}
