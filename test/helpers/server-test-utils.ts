import type { RegeneratePlanMode, UserProfile } from "../../server/types";

export const TEST_USER_ID = "user_123";

export function createAuthenticatedHeaders(token = "test-token") {
    return {
        Authorization: `Bearer ${token}`,
    };
}

export const profileFixtures: Record<string, UserProfile> = {
    beginnerStrengthFullGym: {
        goal: "strength",
        experience: "beginner",
        days_per_week: 4,
        session_duration: 60,
        equipment: "full_gym",
        injuries: null,
        general_notes: "Prefers barbells and cables",
        preferred_split: "upper_lower",
    },
    intermediateCutHome: {
        goal: "cut",
        experience: "intermediate",
        days_per_week: 5,
        session_duration: 45,
        equipment: "home",
        injuries: null,
        general_notes: "Needs efficient superset-friendly sessions",
        preferred_split: "full_body",
    },
    advancedRecompInjury: {
        goal: "recomp",
        experience: "advanced",
        days_per_week: 3,
        session_duration: 75,
        equipment: "full_gym",
        injuries: "Manage cranky shoulders and avoid upright rows",
        general_notes: "Likes heavy compounds first",
        preferred_split: "push_pull_legs",
    },
};

export function createGeneratedPlanFixture(mode: RegeneratePlanMode = "same") {
    return {
        overview: {
            goal: `Mode ${mode} strength plan`,
            frequency: "4 days per week",
            split: "upper_lower",
            notes: `Generated in ${mode} mode`,
        },
        weeklySchedule: [
            {
                day: "Monday",
                focus: "Upper Body",
                exercises: [
                    {
                        name: "Bench Press",
                        sets: 4,
                        reps: "6-8",
                        rest: "2 min",
                        rpe: 8,
                        notes: "Control the eccentric",
                        alternatives: ["Push-Up"],
                    },
                ],
            },
        ],
        progression: "Add load when reps are completed cleanly.",
    };
}

export function createStoredPlan(version = 1) {
    return {
        id: `plan_${version}`,
        user_id: TEST_USER_ID,
        version,
        created_at: new Date("2026-03-20T10:00:00.000Z"),
        plan_json: createGeneratedPlanFixture(),
        plan_text: JSON.stringify(createGeneratedPlanFixture(), null, 2),
    };
}
