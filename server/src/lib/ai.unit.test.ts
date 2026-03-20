import { describe, expect, it } from "vitest";
import { buildPrompt, formatPlanResponse, normalizeProfile, parseAiPlanResponse } from "./ai";

const baseProfile = {
    goal: "strength",
    experience: "intermediate",
    days_per_week: 4,
    session_duration: 60,
    equipment: "full_gym",
    injuries: null,
    general_notes: "Prioritize pull-ups",
    preferred_split: "upper_lower",
};

describe("normalizeProfile", () => {
    it("fills in defaults when fields are missing or malformed", () => {
        expect(
            normalizeProfile({
                goal: "",
                experience: 2,
                days_per_week: "4",
                session_duration: undefined,
                equipment: null,
                injuries: 42,
                general_notes: "Needs shorter sessions",
                preferred_split: "",
            }),
        ).toEqual({
            goal: "bulk",
            experience: "beginner",
            days_per_week: 4,
            session_duration: 60,
            equipment: "full_gym",
            injuries: null,
            general_notes: "Needs shorter sessions",
            preferred_split: "upper_lower",
        });
    });
});

describe("buildPrompt", () => {
    it("includes mode-specific guidance for same, update, and change regenerations", () => {
        const samePrompt = buildPrompt(baseProfile, { mode: "same" });
        const updatePrompt = buildPrompt(baseProfile, { mode: "update", notes: "Add more dumbbell work" });
        const changePrompt = buildPrompt(baseProfile, { mode: "change", notes: "Switch to full body" });

        expect(samePrompt).toContain("Regeneration Mode: same");
        expect(samePrompt).toContain("Keep the plan direction largely the same");
        expect(updatePrompt).toContain("Regeneration Mode: update");
        expect(updatePrompt).toContain("apply the user's requested updates");
        expect(updatePrompt).toContain("Add more dumbbell work");
        expect(changePrompt).toContain("Regeneration Mode: change");
        expect(changePrompt).toContain("Treat this as a meaningful plan change");
        expect(changePrompt).toContain("Switch to full body");
    });

    it("includes the previous plan context when regenerating an existing plan", () => {
        const prompt = buildPrompt(baseProfile, {
            mode: "update",
            previousPlan: {
                weeklySchedule: [{ day: "Monday", focus: "Upper Body" }],
            },
        });

        expect(prompt).toContain("Previous plan context");
        expect(prompt).toContain("\"day\": \"Monday\"");
        expect(prompt).toContain("\"focus\": \"Upper Body\"");
    });
});

describe("AI response parsing and formatting", () => {
    it("[scenario] AI fallback formatting handles malformed partial plan data", () => {
        const formatted = formatPlanResponse(
            {
                overview: {
                    goal: "",
                },
                weeklySchedule: [
                    {
                        day: "Monday",
                        exercises: [
                            {
                                name: "",
                                reps: "",
                            },
                        ],
                    },
                ],
            },
            baseProfile,
        );

        expect(formatted.overview.goal).toBe("Customized strength program");
        expect(formatted.overview.frequency).toBe("4 days per week");
        expect(formatted.weeklySchedule[0]).toMatchObject({
            day: "Monday",
            focus: "Full Body",
        });
        expect(formatted.weeklySchedule[0].exercises[0]).toMatchObject({
            name: "Exercise",
            sets: 3,
            reps: "10-12",
            rest: "60s",
            rpe: 8,
            alternatives: [],
        });
        expect(formatted.progression).toContain("Increase weight by 2.5-5lbs");
    });

    it("parses valid JSON content and throws on invalid JSON", () => {
        expect(
            parseAiPlanResponse(
                JSON.stringify({
                    overview: { goal: "Strength" },
                    weeklySchedule: [],
                }),
            ),
        ).toEqual({
            overview: { goal: "Strength" },
            weeklySchedule: [],
        });

        expect(() => parseAiPlanResponse("{")).toThrow();
    });
});
