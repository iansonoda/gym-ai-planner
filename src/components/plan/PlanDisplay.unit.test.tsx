// @vitest-environment jsdom

import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PlanDisplay } from "./PlanDisplay";

describe("PlanDisplay", () => {
    it("renders workout days, exercise details, and note text through the DOM", () => {
        render(
            <PlanDisplay
                weeklySchedule={[
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
                            {
                                name: "Chest Supported Row",
                                sets: 3,
                                reps: "8-10",
                                rest: "90s",
                                rpe: 7,
                                notes: "",
                                alternatives: [],
                            },
                        ],
                    },
                ]}
            />,
        );

        expect(screen.getByText("Monday")).toBeInTheDocument();
        expect(screen.getByText("Upper Body")).toBeInTheDocument();
        expect(screen.getByText("Bench Press")).toBeInTheDocument();
        expect(screen.getByText("Control the eccentric")).toBeInTheDocument();
        expect(screen.getByText("2 exercises")).toBeInTheDocument();

        const rows = screen.getAllByRole("row");
        expect(rows).toHaveLength(3);
        expect(within(rows[2]).getByText("Chest Supported Row")).toBeInTheDocument();
    });

    it("renders an empty-state message when no schedule is available", () => {
        render(<PlanDisplay weeklySchedule={[]} />);

        expect(screen.getByText("No plan generated yet")).toBeInTheDocument();
        expect(
            screen.getByText("Generate a training plan to see your weekly schedule and exercise details."),
        ).toBeInTheDocument();
    });
});
