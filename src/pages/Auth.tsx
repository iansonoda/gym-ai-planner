import { AuthView } from "@neondatabase/neon-js/auth/react";
import { ArrowRight, Calendar, Sparkles, Target, Zap } from "lucide-react";
import { useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";

const sharedFeatures = [
  {
    icon: Sparkles,
    title: "Tailored programming",
    description: "Get a plan built around your goal, experience, and equipment.",
  },
  {
    icon: Calendar,
    title: "Fits your schedule",
    description: "Train two days or six without forcing a generic template.",
  },
  {
    icon: Target,
    title: "Built for progress",
    description: "Every cycle is structured around clear progression and recovery.",
  },
];

export default function Auth() {
  const { pathname } = useParams();
  const isSignUp = pathname === "sign-up";

  const heading = isSignUp ? "Build your training system in minutes." : "Pick up your training plan where you left off.";
  const description = isSignUp
    ? "Create your account to generate a plan that matches your goal, schedule, and equipment from day one."
    : "Sign in to review your programming, regenerate your plan, and manage your account inside the same workspace.";
  const formLabel = isSignUp ? "Create your account" : "Welcome back";

  return (
    <div className="neon-auth-shell min-h-screen overflow-hidden">
      <section className="relative flex min-h-screen items-center px-6 pt-24 pb-12">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-accent)]/6 via-transparent to-transparent" />
        <div className="absolute top-20 left-1/2 h-[760px] w-[760px] -translate-x-1/2 rounded-full bg-[var(--color-accent)]/10 blur-3xl" />

        <div className="relative mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_0.95fr] lg:items-center">
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-2">
              <Zap className="h-4 w-4 text-[var(--color-accent)]" />
              <span className="text-sm text-[var(--color-muted)]">
                {isSignUp ? "Start your AI-built program" : "Your plan is waiting"}
              </span>
            </div>

            <h1 className="max-w-xl text-5xl font-bold tracking-tight md:text-6xl">
              {heading}
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-[var(--color-muted)]">
              {description}
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {sharedFeatures.map((feature) => (
                <Card
                  key={feature.title}
                  variant="bordered"
                  className="group h-full bg-[var(--color-card)]/80 p-5 transition-colors hover:border-[var(--color-accent)]/40"
                >
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-accent)]/10 transition-colors group-hover:bg-[var(--color-accent)]/20">
                    <feature.icon className="h-5 w-5 text-[var(--color-accent)]" />
                  </div>
                  <h2 className="text-lg font-semibold">{feature.title}</h2>
                  <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
                    {feature.description}
                  </p>
                </Card>
              ))}
            </div>

            <div className="mt-6 flex items-center gap-2 text-sm text-[var(--color-muted)]">
              <ArrowRight className="h-4 w-4 text-[var(--color-accent)]" />
              <span>Everything stays inside the same training workspace.</span>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_top,rgba(163,230,53,0.18),transparent_60%)] blur-2xl" />
            <div className="relative rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-card)]/92 p-5 shadow-[0_32px_120px_rgba(0,0,0,0.45)] backdrop-blur">
              <div className="mb-5 border-b border-[var(--color-border)] pb-5">
                <p className="text-xs uppercase tracking-[0.28em] text-[var(--color-muted)]">
                  {formLabel}
                </p>
                <h2 className="mt-3 text-2xl font-semibold">
                  {isSignUp ? "Set up your account" : "Sign in to Gym AI"}
                </h2>
                <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                  {isSignUp
                    ? "Create an account and move straight into building your personalized plan."
                    : "Access your latest training cycle, notes, and account settings."}
                </p>
              </div>

              <div className="mx-auto w-full max-w-md">
                <AuthView pathname={pathname} />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
