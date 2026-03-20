// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { normalizeOnboardingProfile, type OnboardingFormData } from "./onboarding";

interface NormalizationCase {
    title: string;
    input: OnboardingFormData;
    expected: {
        goal: string;
        experience: string;
        daysPerWeek: number;
        sessionDuration: number;
        equipment: string;
        injuries: string;
        generalNotes: string;
        preferredSplit: string;
    };
}

const baseInput: OnboardingFormData = {
    goal: "strength",
    experience: "intermediate",
    daysPerWeek: "4",
    sessionDuration: "60",
    equipment: "full_gym",
    injuries: "",
    generalNotes: "",
    preferredSplit: "upper_lower",
};

const cases: NormalizationCase[] = [
    {
        title: "[input] converts strength profile values for four day training",
        input: baseInput,
        expected: {
            ...baseInput,
            daysPerWeek: 4,
            sessionDuration: 60,
        },
    },
    {
        title: "[input] trims optional text fields before saving the profile",
        input: {
            ...baseInput,
            injuries: "  knee pain  ",
            generalNotes: "  prefer pull-ups and cables  ",
        },
        expected: {
            ...baseInput,
            daysPerWeek: 4,
            sessionDuration: 60,
            injuries: "knee pain",
            generalNotes: "prefer pull-ups and cables",
        },
    },
    {
        title: "[input] preserves empty optional text fields",
        input: {
            ...baseInput,
            injuries: "   ",
            generalNotes: "   ",
        },
        expected: {
            ...baseInput,
            daysPerWeek: 4,
            sessionDuration: 60,
            injuries: "",
            generalNotes: "",
        },
    },
    {
        title: "[input] converts a zero day-per-week string into a number",
        input: {
            ...baseInput,
            daysPerWeek: "0",
        },
        expected: {
            ...baseInput,
            daysPerWeek: 0,
            sessionDuration: 60,
        },
    },
    {
        title: "[input] converts a zero session-duration string into a number",
        input: {
            ...baseInput,
            sessionDuration: "0",
        },
        expected: {
            ...baseInput,
            daysPerWeek: 4,
            sessionDuration: 0,
        },
    },
    {
        title: "[input] converts decimal session-duration strings",
        input: {
            ...baseInput,
            sessionDuration: "45.5",
        },
        expected: {
            ...baseInput,
            daysPerWeek: 4,
            sessionDuration: 45.5,
        },
    },
    {
        title: "[input] converts number strings with leading spaces",
        input: {
            ...baseInput,
            daysPerWeek: " 3",
            sessionDuration: " 90",
        },
        expected: {
            ...baseInput,
            daysPerWeek: 3,
            sessionDuration: 90,
        },
    },
    {
        title: "[input] surfaces invalid day strings as NaN",
        input: {
            ...baseInput,
            daysPerWeek: "abc",
        },
        expected: {
            ...baseInput,
            daysPerWeek: Number.NaN,
            sessionDuration: 60,
        },
    },
    {
        title: "[input] surfaces invalid duration strings as NaN",
        input: {
            ...baseInput,
            sessionDuration: "sixty",
        },
        expected: {
            ...baseInput,
            daysPerWeek: 4,
            sessionDuration: Number.NaN,
        },
    },
    {
        title: "[input] keeps calisthenics selections intact",
        input: {
            ...baseInput,
            equipment: "calisthenics",
        },
        expected: {
            ...baseInput,
            daysPerWeek: 4,
            sessionDuration: 60,
            equipment: "calisthenics",
        },
    },
    {
        title: "[input] keeps custom split selections intact",
        input: {
            ...baseInput,
            preferredSplit: "custom",
        },
        expected: {
            ...baseInput,
            daysPerWeek: 4,
            sessionDuration: 60,
            preferredSplit: "custom",
        },
    },
    {
        title: "[input] trims multiline general notes without losing content",
        input: {
            ...baseInput,
            generalNotes: "\n  prioritise leg drive and scapular retraction\n",
        },
        expected: {
            ...baseInput,
            daysPerWeek: 4,
            sessionDuration: 60,
            generalNotes: "prioritise leg drive and scapular retraction",
        },
    },
];

describe("normalizeOnboardingProfile", () => {
    for (const testCase of cases) {
        it(testCase.title, () => {
            const normalized = normalizeOnboardingProfile(testCase.input);

            expect(normalized.goal).toBe(testCase.expected.goal);
            expect(normalized.experience).toBe(testCase.expected.experience);
            expect(normalized.equipment).toBe(testCase.expected.equipment);
            expect(normalized.injuries).toBe(testCase.expected.injuries);
            expect(normalized.generalNotes).toBe(testCase.expected.generalNotes);
            expect(normalized.preferredSplit).toBe(testCase.expected.preferredSplit);

            if (Number.isNaN(testCase.expected.daysPerWeek)) {
                expect(Number.isNaN(normalized.daysPerWeek)).toBe(true);
            } else {
                expect(normalized.daysPerWeek).toBe(testCase.expected.daysPerWeek);
            }

            if (Number.isNaN(testCase.expected.sessionDuration)) {
                expect(Number.isNaN(normalized.sessionDuration)).toBe(true);
            } else {
                expect(normalized.sessionDuration).toBe(testCase.expected.sessionDuration);
            }
        });
    }
});
