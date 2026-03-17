import { Card } from "@/components/ui/card";
import { useAuth } from "@/context/useAuth"
import { ArrowRight, Dumbbell, ShieldCheck, Sparkles, Target, TrendingUp } from "lucide-react";
import { Link, Navigate } from "react-router-dom"
import heroImage from "@/assets/hero.png";
import { Button } from "@/components/ui/button";

export default function Home() {
    const {user, isLoading} = useAuth();

    if (user && !isLoading) {
        return <Navigate to="/profile" replace/>
    }

    return (
        <div className="min-h-screen overflow-hidden px-6 pt-24 pb-16">
            <div className="mx-auto max-w-6xl space-y-16">
                <section className="relative overflow-hidden rounded-[2.5rem] border border-[var(--color-border)] bg-[radial-gradient(circle_at_top_left,rgba(163,230,53,0.12),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0))] px-6 py-10 shadow-[0_32px_120px_rgba(0,0,0,0.45)] md:px-10 md:py-14">
                    <div className="grid items-center gap-10 lg:grid-cols-[1fr_0.88fr]">
                        <div className="space-y-8">
                            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-card)]/80 px-4 py-2 text-xs uppercase tracking-[0.28em] text-[var(--color-muted)]">
                                <Sparkles className="h-4 w-4 text-accent" />
                                Personalized training intelligence
                            </div>

                            <div className="space-y-5">
                                <h1 className="max-w-3xl text-5xl font-semibold leading-[0.95] tracking-tight md:text-7xl">
                                    Build a training plan that feels tailored, not templated.
                                </h1>
                                <p className="max-w-2xl text-lg leading-8 text-[var(--color-muted)]">
                                    Gym AI Planner turns your goals, schedule, equipment, injuries, and preferences into a plan that looks structured enough to follow and flexible enough to evolve.
                                </p>
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row">
                                <Link to="/auth/sign-up">
                                    <Button size="lg" className="w-full gap-2 sm:w-auto">
                                        Start Planning <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </Link>
                                <Link to="/auth/sign-in">
                                    <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                                        Sign In
                                    </Button>
                                </Link>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-3">
                                <Card variant="bordered" className="space-y-2 bg-[var(--color-card)]/85">
                                    <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-muted)]">Built for adherence</p>
                                    <p className="text-2xl font-semibold">4-6</p>
                                    <p className="text-sm text-[var(--color-muted)]">focused movements per session with progression and alternatives.</p>
                                </Card>
                                <Card variant="bordered" className="space-y-2 bg-[var(--color-card)]/85">
                                    <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-muted)]">Constraint aware</p>
                                    <p className="text-2xl font-semibold">100%</p>
                                    <p className="text-sm text-[var(--color-muted)]">built around injuries, equipment limits, and time caps.</p>
                                </Card>
                                <Card variant="bordered" className="space-y-2 bg-[var(--color-card)]/85">
                                    <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-muted)]">Versioned refreshes</p>
                                    <p className="text-2xl font-semibold">Anytime</p>
                                    <p className="text-sm text-[var(--color-muted)]">regenerate the plan when your goals or setup change.</p>
                                </Card>
                            </div>
                        </div>

                        <div className="relative">
                            <div className="absolute -inset-6 rounded-[2rem] bg-linear-to-br from-accent/12 via-transparent to-transparent blur-3xl" />
                            <Card variant="bordered" className="relative overflow-hidden border-white/6 bg-[var(--color-card-2)] p-0">
                                <img
                                    src={heroImage}
                                    alt="Gym AI Planner workout preview"
                                    className="h-[560px] w-full object-cover object-center"
                                />
                                <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black via-black/65 to-transparent p-6">
                                    <div className="grid gap-3 md:grid-cols-2">
                                        <div className="rounded-2xl border border-white/10 bg-black/45 p-4 backdrop-blur-sm">
                                            <p className="text-xs uppercase tracking-[0.22em] text-white/60">Weekly split</p>
                                            <p className="mt-2 text-lg font-medium text-white">Structured, progressive, realistic</p>
                                        </div>
                                        <div className="rounded-2xl border border-white/10 bg-black/45 p-4 backdrop-blur-sm">
                                            <p className="text-xs uppercase tracking-[0.22em] text-white/60">Regeneration</p>
                                            <p className="mt-2 text-lg font-medium text-white">Update, refine, or rebuild your plan</p>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-3">
                    <Card variant="bordered" className="space-y-4">
                        <Dumbbell className="h-5 w-5 text-accent" />
                        <div className="space-y-2">
                            <h2 className="text-xl font-semibold">Equipment-aware programming</h2>
                            <p className="text-sm leading-6 text-[var(--color-muted)]">
                                Full gym, home setup, dumbbells only, or bodyweight. The plan adapts without pretending every user has the same tools.
                            </p>
                        </div>
                    </Card>
                    <Card variant="bordered" className="space-y-4">
                        <ShieldCheck className="h-5 w-5 text-accent" />
                        <div className="space-y-2">
                            <h2 className="text-xl font-semibold">Constraints built into the brief</h2>
                            <p className="text-sm leading-6 text-[var(--color-muted)]">
                                Injuries, training age, preferred split, and session time are handled upfront so the plan feels usable from day one.
                            </p>
                        </div>
                    </Card>
                    <Card variant="bordered" className="space-y-4">
                        <TrendingUp className="h-5 w-5 text-accent" />
                        <div className="space-y-2">
                            <h2 className="text-xl font-semibold">A system you can iterate on</h2>
                            <p className="text-sm leading-6 text-[var(--color-muted)]">
                                Keep the same direction, make targeted updates, or go back through onboarding and build a new version from scratch.
                            </p>
                        </div>
                    </Card>
                </section>

                <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
                    <Card variant="bordered" className="space-y-6">
                        <p className="text-xs uppercase tracking-[0.28em] text-[var(--color-muted)]">How It Works</p>
                        <div className="space-y-5">
                            <div className="space-y-2">
                                <Target className="h-5 w-5 text-accent" />
                                <h3 className="text-lg font-semibold">1. Define the brief</h3>
                                <p className="text-sm leading-6 text-[var(--color-muted)]">
                                    Capture goals, experience, equipment, injuries, and the extra notes that make a plan actually feel personal.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Sparkles className="h-5 w-5 text-accent" />
                                <h3 className="text-lg font-semibold">2. Generate the plan</h3>
                                <p className="text-sm leading-6 text-[var(--color-muted)]">
                                    Get a weekly structure, exercise detail, alternatives, and a progression strategy that respects the real constraints.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <ArrowRight className="h-5 w-5 text-accent" />
                                <h3 className="text-lg font-semibold">3. Keep refining</h3>
                                <p className="text-sm leading-6 text-[var(--color-muted)]">
                                    Regenerate the same framework, request targeted changes, or rebuild the whole brief when your priorities shift.
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card variant="bordered" className="grid gap-6 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0))] md:grid-cols-2">
                        <div className="space-y-4">
                            <p className="text-xs uppercase tracking-[0.28em] text-[var(--color-muted)]">What You Get</p>
                            <h2 className="text-3xl font-semibold leading-tight">
                                A cleaner way to go from goal to weekly execution.
                            </h2>
                            <p className="text-sm leading-7 text-[var(--color-muted)]">
                                This is not a content dump. It is a structured training brief designed to be read, understood, and followed.
                            </p>
                        </div>
                        <div className="grid gap-4 text-sm leading-6 text-[var(--color-muted)]">
                            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card-2)] p-4">
                                Weekly split with day-by-day focus and exercise lists.
                            </div>
                            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card-2)] p-4">
                                Progression guidance that matches the user’s goal and level.
                            </div>
                            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card-2)] p-4">
                                Alternatives and notes so the plan still works when equipment or recovery changes.
                            </div>
                        </div>
                    </Card>
                </section>
            </div>
        </div>
    )
}
