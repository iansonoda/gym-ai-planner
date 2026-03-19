import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  Calendar,
  Clock3,
  Dumbbell,
  Loader2,
  RefreshCcw,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useAuth } from "../context/useAuth";
import { Button } from "@/components/ui/button";
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
    description: "Keep the current direction and generate a fresh version.",
  },
  {
    value: "update",
    label: "Update this plan",
    description: "Keep the core structure, but adjust details and constraints.",
  },
  {
    value: "change",
    label: "Change my plan",
    description: "Go back through onboarding and rebuild the program more fully.",
  },
];

export default function Profile() {
  const { user, plan, isLoading, generatePlan } = useAuth();
  const navigate = useNavigate();
  const [isRegenerateModalOpen, setIsRegenerateModalOpen] = useState(false);
  const [regenerateMode, setRegenerateMode] =
    useState<RegeneratePlanMode>("same");
  const [regenerateNotes, setRegenerateNotes] = useState("");
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regenerateError, setRegenerateError] = useState("");

  if (!user && !isLoading) {
    return <Navigate to="/auth/sign-in" replace />;
  }

  if (!isLoading && !plan) {
    return <Navigate to="/onboarding" replace />;
  }

  if (!plan) {
    return null;
  }

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const quickStats = [
    {
      icon: Target,
      label: "Primary goal",
      value: plan.overview.goal,
    },
    {
      icon: Calendar,
      label: "Training frequency",
      value: plan.overview.frequency,
    },
    {
      icon: Dumbbell,
      label: "Split",
      value: plan.overview.split,
    },
    {
      icon: TrendingUp,
      label: "Plan version",
      value: plan.version,
    },
  ];

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
      setRegenerateError(
        error instanceof Error ? error.message : "Failed to regenerate plan",
      );
    } finally {
      setIsRegenerating(false);
    }
  }

  return (
    <div className="min-h-screen overflow-hidden">
      <section className="relative px-6 pt-28 pb-12">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-accent)]/6 via-transparent to-transparent" />
        <div className="absolute top-16 left-1/2 h-[760px] w-[760px] -translate-x-1/2 rounded-full bg-[var(--color-accent)]/8 blur-3xl" />

        <div className="relative mx-auto max-w-6xl">
          <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-2">
                <Zap className="h-4 w-4 text-[var(--color-accent)]" />
                <span className="text-sm text-[var(--color-muted)]">
                  Personalized AI-built programming
                </span>
              </div>

              <h1 className="text-5xl font-bold tracking-tight md:text-6xl">
                Your current
                <br />
                <span className="text-[var(--color-accent)]">training plan</span>
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--color-muted)]">
                Review your latest cycle, check the structure, and regenerate it
                without dropping into a generic dashboard.
              </p>
            </div>

            <Card
              variant="bordered"
              className="w-full max-w-md bg-[var(--color-card)]/85 backdrop-blur"
            >
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--color-muted)]">
                Current cycle
              </p>
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-[var(--color-accent)]" />
                  <p className="text-lg font-semibold">Version {plan.version}</p>
                </div>
                <div className="flex items-center gap-3 text-sm text-[var(--color-muted)]">
                  <Clock3 className="h-4 w-4 text-[var(--color-accent)]" />
                  <span>Created {formatDate(plan.createdAt)}</span>
                </div>
              </div>

              <Button
                variant="secondary"
                className="mt-6 w-full gap-2"
                onClick={() => {
                  setRegenerateError("");
                  setIsRegenerateModalOpen(true);
                }}
              >
                <RefreshCcw className="h-4 w-4" />
                Regenerate Plan
              </Button>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {quickStats.map((stat) => (
              <Card
                key={stat.label}
                variant="bordered"
                className="group bg-[var(--color-card)]/80 transition-colors hover:border-[var(--color-accent)]/40"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-accent)]/10 transition-colors group-hover:bg-[var(--color-accent)]/20">
                  <stat.icon className="h-5 w-5 text-[var(--color-accent)]" />
                </div>
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-muted)]">
                  {stat.label}
                </p>
                <p className="mt-3 text-lg font-semibold">{stat.value}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-14">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <Card variant="bordered" className="bg-[var(--color-card)]/80">
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--color-muted)]">
              Plan notes
            </p>
            <h2 className="mt-3 text-2xl font-semibold">How this cycle is built</h2>
            <p className="mt-4 text-sm leading-7 text-[var(--color-muted)]">
              {plan.overview.notes}
            </p>
          </Card>

          <Card variant="bordered" className="bg-[var(--color-card)]/80">
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--color-muted)]">
              Progression
            </p>
            <h2 className="mt-3 text-2xl font-semibold">How to push the plan forward</h2>
            <p className="mt-4 text-sm leading-7 text-[var(--color-muted)]">
              {plan.progression}
            </p>
          </Card>
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--color-muted)]">
                Weekly schedule
              </p>
              <h2 className="mt-3 text-3xl font-semibold">Your training week</h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-[var(--color-muted)]">
              Each session is arranged around the equipment, frequency, and split
              chosen for this cycle.
            </p>
          </div>

          <PlanDisplay weeklySchedule={plan.weeklySchedule} />
        </div>
      </section>

      {isRegenerateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-6 py-8 backdrop-blur-sm">
          <Card
            variant="bordered"
            className="w-full max-w-3xl bg-[var(--color-card)]/96 shadow-[0_32px_120px_rgba(0,0,0,0.45)]"
          >
            <div className="mb-6 flex flex-col gap-4 border-b border-[var(--color-border)] pb-6 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-[var(--color-muted)]">
                  Regenerate
                </p>
                <h2 className="mt-3 text-2xl font-semibold">
                  Adjust your plan without starting over
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
                  Choose whether to keep the current direction, make targeted
                  updates, or return to onboarding for a bigger shift.
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
                    className={`flex min-h-40 flex-col justify-between rounded-2xl border p-5 text-left transition-colors ${
                      isSelected
                        ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-black"
                        : "border-[var(--color-border)] bg-[var(--color-card-2)] hover:border-[var(--color-accent)]/35 hover:bg-[var(--color-card)]"
                    }`}
                    onClick={() => setRegenerateMode(option.value)}
                    disabled={isRegenerating}
                  >
                    <p className="text-base font-semibold">{option.label}</p>
                    <p
                      className={`mt-4 text-sm leading-6 ${
                        isSelected ? "text-black/80" : "text-[var(--color-muted)]"
                      }`}
                    >
                      {option.description}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="mt-6">
              {regenerateMode !== "change" ? (
                <Textarea
                  id="regenerateNotes"
                  label="What should change? (Optional)"
                  placeholder={
                    regenerateMode === "same"
                      ? "Optional: ask for a slightly different version while keeping the same direction."
                      : "Example: shorten sessions, keep the same goal, and use more dumbbell work."
                  }
                  rows={4}
                  value={regenerateNotes}
                  onChange={(e) => setRegenerateNotes(e.target.value)}
                  disabled={isRegenerating}
                />
              ) : (
                <Card
                  variant="default"
                  className="border border-[var(--color-border)] bg-[var(--color-card-2)]"
                >
                  <p className="text-sm font-semibold">Rebuild from onboarding</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                    You&apos;ll return to onboarding with your current answers
                    prefilled so you can reshape the program more substantially.
                  </p>
                </Card>
              )}
            </div>

            {regenerateError && (
              <p className="mt-4 text-sm text-red-500">{regenerateError}</p>
            )}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
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
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Regenerating...
                  </>
                ) : regenerateMode === "change" ? (
                  <>
                    <RefreshCcw className="h-4 w-4" />
                    Go To Onboarding
                  </>
                ) : (
                  <>
                    <RefreshCcw className="h-4 w-4" />
                    Regenerate Plan
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
