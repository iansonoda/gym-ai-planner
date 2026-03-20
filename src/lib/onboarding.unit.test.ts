// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { normalizeOnboardingProfile, type OnboardingFormData } from "./onboarding";

interface NormalizationCase {
    title: string;
    input: OnboardingFormData;
    expected?: {
        goal: string;
        experience: string;
        daysPerWeek: number;
        sessionDuration: number;
        equipment: string;
        injuries: string;
        generalNotes: string;
        preferredSplit: string;
    };
    expectedError?: string;
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
        title: "[input] rejects a zero day-per-week string during schema validation",
        input: {
            ...baseInput,
            daysPerWeek: "0",
        },
        expectedError: "Select a valid days-per-week option.",
    },
    {
        title: "[input] rejects a zero session-duration string during schema validation",
        input: {
            ...baseInput,
            sessionDuration: "0",
        },
        expectedError: "Select a valid session-duration option.",
    },
    {
        title: "[input] rejects decimal session-duration strings during schema validation",
        input: {
            ...baseInput,
            sessionDuration: "45.5",
        },
        expectedError: "Select a valid session-duration option.",
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
        title: "[input] rejects invalid day strings during schema validation",
        input: {
            ...baseInput,
            daysPerWeek: "abc",
        },
        expectedError: "Select a valid days-per-week option.",
    },
    {
        title: "[input] rejects invalid duration strings during schema validation",
        input: {
            ...baseInput,
            sessionDuration: "sixty",
        },
        expectedError: "Select a valid session-duration option.",
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
            if (testCase.expectedError) {
                expect(() => normalizeOnboardingProfile(testCase.input)).toThrow(testCase.expectedError);
                return;
            }

            const normalized = normalizeOnboardingProfile(testCase.input);
            const expected = testCase.expected!;

            expect(normalized.goal).toBe(expected.goal);
            expect(normalized.experience).toBe(expected.experience);
            expect(normalized.equipment).toBe(expected.equipment);
            expect(normalized.injuries).toBe(expected.injuries);
            expect(normalized.generalNotes).toBe(expected.generalNotes);
            expect(normalized.preferredSplit).toBe(expected.preferredSplit);
            expect(normalized.daysPerWeek).toBe(expected.daysPerWeek);
            expect(normalized.sessionDuration).toBe(expected.sessionDuration);
        });
    }
});
