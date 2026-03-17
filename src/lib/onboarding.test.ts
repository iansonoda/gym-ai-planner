import assert from "node:assert/strict";
import test from "node:test";
import { normalizeOnboardingProfile } from "./onboarding";

test("normalizeOnboardingProfile converts select values to numbers and trims injuries", () => {
    const profile = normalizeOnboardingProfile({
        goal: "strength",
        experience: "intermediate",
        daysPerWeek: "4",
        sessionDuration: "60",
        equipment: "full_gym",
        injuries: "  knee pain  ",
        preferredSplit: "upper_lower",
    });

    assert.deepEqual(profile, {
        goal: "strength",
        experience: "intermediate",
        daysPerWeek: 4,
        sessionDuration: 60,
        equipment: "full_gym",
        injuries: "knee pain",
        preferredSplit: "upper_lower",
    });
});
