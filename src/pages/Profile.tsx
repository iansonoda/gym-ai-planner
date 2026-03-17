import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { Button } from "@/components/ui/button";
import { Calendar, Dumbbell, Loader2, RefreshCcw, Target, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PlanDisplay } from "@/components/plan/PlanDisplay";
import { Textarea } from "@/components/ui/textarea";
import type { RegeneratePlanMode } from "@/types";

const regenerateOptions: Array<{
    value: RegeneratePlanMode;
    label: string;
    description: string;
}> = [
    {
        value: "same",
        label: "Stay the same",
        description: "Keep the current direction and just generate a fresh version.",
    },
    {
        value: "update",
        label: "Update this plan",
        description: "Keep the core plan, but tweak parts of it.",
    },
    {
        value: "change",
        label: "Change my plan",
        description: "Shift the program in a more meaningful way.",
    },
];

export default function Profile() {
    const {user, plan, isLoading, generatePlan} = useAuth();
    const navigate = useNavigate();
    const [isRegenerateModalOpen, setIsRegenerateModalOpen] = useState(false);
    const [regenerateMode, setRegenerateMode] = useState<RegeneratePlanMode>("same");
    const [regenerateNotes, setRegenerateNotes] = useState("");
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [regenerateError, setRegenerateError] = useState("");

    if (!user && !isLoading) {
        return <Navigate to="/auth/sign-in" replace />
    }

    if (!isLoading && !plan) {
        return <Navigate to="/onboarding" replace />
    }

    if (!plan) {
        return null;
    }

    const formateDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    async function handleRegenerate() {
        if (regenerateMode === "change") {
            setRegenerateError("");
            setIsRegenerateModalOpen(false);
            navigate("/onboarding");
            return;
        }

        try {
            setIsRegenerating(true);
            setRegenerateError("");
            await generatePlan({
                mode: regenerateMode,
                notes: regenerateNotes.trim() || undefined,
            });

            if (regenerateMode !== "same") {
                setRegenerateNotes("");
            }

            setIsRegenerateModalOpen(false);
        } catch (error) {
            setRegenerateError(error instanceof Error ? error.message : "Failed to regenerate plan");
        } finally {
            setIsRegenerating(false);
        }
    }

    return (
        <div className="min-h-screen pt-24 pb-12 px-6">
            <div className="max-w-4xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold mb-1">Your Training Plan</h1>
                        <p className="text-muted">
                            Version {plan.version} • Created {formateDate(plan.createdAt)}
                        </p>
                    </div>

                    <Button
                        variant="secondary"
                        className="gap-2"
                        onClick={() => {
                            setRegenerateError("");
                            setIsRegenerateModalOpen(true);
                        }}
                    >
                        <RefreshCcw className="w-4 h-4" />
                        Regenerate Plan
                    </Button>
                </div>

                <div className="grid md:grid-cols-4 gap-4 mb-8">
                    <Card variant="bordered" className="flex items-center gap-3 p-4">
                        <div className="w-10 h-10 flex items-center justify-center">
                            <Target className="w-5 h-5 text-accent" />
                        </div>
                        <div>
                            <p className="text-xs text-muted">Primary Goal</p>
                            <p className="text-sm font-medium">{plan.overview.goal}</p>
                        </div>
                    </Card>

                                        <Card variant="bordered" className="flex items-center gap-3 p-4">
                        <div className="w-10 h-10 flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-accent" />
                        </div>
                        <div>
                            <p className="text-xs text-muted">Training Frequency</p>
                            <p className="text-sm font-medium">{plan.overview.frequency}</p>
                        </div>
                    </Card>

                                        <Card variant="bordered" className="flex items-center gap-3 p-4">
                        <div className="w-10 h-10 flex items-center justify-center">
                            <Dumbbell className="w-5 h-5 text-accent" />
                        </div>
                        <div>
                            <p className="text-xs text-muted">Split</p>
                            <p className="text-sm font-medium">{plan.overview.split}</p>
                        </div>
                    </Card>

                    <Card variant="bordered" className="flex items-center gap-3 p-4">
                        <div className="w-10 h-10 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-accent" />
                        </div>
                        <div>
                            <p className="text-xs text-muted">Version</p>
                            <p className="text-sm font-medium">{plan.version}</p>
                        </div>
                    </Card>
                </div>

                { /* Plan notes */ }
                <Card variant="bordered" className="mb-8">
                    <h2 className="font-semibold text-lg mb-2">Plan Notes</h2>
                    <p className="text-muted text-sm leading-relaxed">{plan.overview.notes}</p>
                </Card>

                { /* Weekly Schedule */ }
                <h2 className="font-semibold text-xl mb-4">Weekly Schedule</h2>
                <PlanDisplay weeklySchedule={plan.weeklySchedule} />

                <Card variant="bordered" className="mb-8">
                    <h2 className="font-semibold text-lg mb-2">Progression Strategy</h2>
                    <p className="text-muted text-sm leading-relaxed">{plan.progression}</p>
                </Card>

            </div>

            {isRegenerateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6">
                    <Card variant="bordered" className="w-full max-w-2xl space-y-5 shadow-2xl">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="font-semibold text-xl">Regenerate Your Plan</h2>
                                <p className="mt-1 text-sm text-muted">
                                    Choose whether to keep the plan mostly the same, update it, or change it.
                                </p>
                            </div>

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsRegenerateModalOpen(false)}
                                disabled={isRegenerating}
                            >
                                Close
                            </Button>
                        </div>

                        <div className="grid gap-3 md:grid-cols-3">
                            {regenerateOptions.map((option) => {
                                const isSelected = regenerateMode === option.value;

                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        className={`flex min-h-36 flex-col justify-between rounded-2xl border p-4 text-left transition-colors ${
                                            isSelected
                                                ? "border-[var(--color-accent)] bg-accent text-black"
                                                : "border-[var(--color-border)] bg-transparent hover:bg-[var(--color-card)]"
                                        }`}
                                        onClick={() => setRegenerateMode(option.value)}
                                        disabled={isRegenerating}
                                    >
                                        <p className="text-sm font-medium">{option.label}</p>
                                        <p className={`mt-2 text-sm ${isSelected ? "text-black/80" : "text-muted"}`}>
                                            {option.description}
                                        </p>
                                    </button>
                                );
                            })}
                        </div>

                        {regenerateMode !== "change" ? (
                            <Textarea
                                id="regenerateNotes"
                                label="What should change? (Optional)"
                                placeholder={
                                    regenerateMode === "same"
                                        ? "Optional: add a note if you want a slightly different version."
                                        : "Example: keep the goal the same, but make sessions shorter and add more dumbbell options."
                                }
                                rows={4}
                                value={regenerateNotes}
                                onChange={(e) => setRegenerateNotes(e.target.value)}
                                disabled={isRegenerating}
                            />
                        ) : (
                            <Card variant="default" className="border border-[var(--color-border)] p-4">
                                <p className="text-sm font-medium">Change my plan</p>
                                <p className="mt-2 text-sm text-muted">
                                    You&apos;ll go back to onboarding with your current answers prefilled so you can build a completely new plan.
                                </p>
                            </Card>
                        )}

                        {regenerateError && <p className="text-sm text-red-500">{regenerateError}</p>}

                        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <Button
                                variant="ghost"
                                onClick={() => setIsRegenerateModalOpen(false)}
                                disabled={isRegenerating}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="secondary"
                                className="gap-2"
                                onClick={handleRegenerate}
                                disabled={isRegenerating}
                            >
                                {isRegenerating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Regenerating...
                                    </>
                                ) : regenerateMode === "change" ? (
                                    <>
                                        <RefreshCcw className="w-4 h-4" />
                                        Go To Onboarding
                                    </>
                                ) : (
                                    <>
                                        <RefreshCcw className="w-4 h-4" />
                                        Regenerate Plan
                                    </>
                                )}
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    )
}
