import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PlanDisplay } from "./PlanDisplay";

test("PlanDisplay renders workout days and exercise details", () => {
    const markup = renderToStaticMarkup(
        React.createElement(PlanDisplay, {
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
                        },
                    ],
                },
            ],
        }),
    );

    assert.match(markup, /Monday/);
    assert.match(markup, /Upper Body/);
    assert.match(markup, /Bench Press/);
    assert.match(markup, /Control the eccentric/);
});
