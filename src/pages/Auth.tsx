import { ArrowRight, Calendar, Github, Sparkles, Target, Zap } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/useAuth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
const isDev = import.meta.env.DEV;

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
  const { devLogin } = useAuth();
  const navigate = useNavigate();
  const isSignUp = pathname === "sign-up";

  const heading = isSignUp ? "Build your training system in minutes." : "Pick up your training plan where you left off.";
  const description = isSignUp
    ? "Create your account to generate a plan that matches your goal, schedule, and equipment from day one."
    : "Sign in to review your programming, regenerate your plan, and manage your account inside the same workspace.";
  const formLabel = isSignUp ? "Create your account" : "Welcome back";

  async function handleDevLogin() {
    await devLogin();
    navigate("/profile");
  }

  return (
    <div className="min-h-screen overflow-hidden">
      <section className="relative flex min-h-screen items-center px-6 pt-24 pb-12">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-accent)]/6 via-transparent to-transparent" />

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

          <Card variant="bordered" className="bg-[var(--color-card)]/92 p-5 shadow-[0_32px_120px_rgba(0,0,0,0.45)] backdrop-blur">
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

            <div className="grid gap-3">
              <Button type="button" className="w-full gap-2" onClick={() => { window.location.href = `${API_URL}/api/auth/google`; }}>
                <Sparkles className="h-4 w-4" />
                Continue with Google
              </Button>
              <Button type="button" variant="secondary" className="w-full gap-2" onClick={() => { window.location.href = `${API_URL}/api/auth/github`; }}>
                <Github className="h-4 w-4" />
                Continue with GitHub
              </Button>
              {isDev ? (
                <Button type="button" variant="ghost" className="w-full" onClick={handleDevLogin}>
                  Continue as Dev User
                </Button>
              ) : null}
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
