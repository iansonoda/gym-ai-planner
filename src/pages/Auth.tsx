import { AuthView } from "@neondatabase/neon-js/auth/react";
import { useParams } from "react-router-dom";

export default function Auth() {
    const { pathname } = useParams();
    return (
        <div className="neon-auth-shell min-h-screen overflow-hidden px-6 pt-24 pb-12">
            <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
                <div className="space-y-6">
                    <p className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-card)]/80 px-4 py-2 text-xs uppercase tracking-[0.28em] text-[var(--color-muted)]">
                        Gym AI Planner
                    </p>
                    <div className="space-y-4">
                        <h1 className="max-w-md text-4xl font-semibold leading-tight md:text-5xl">
                            Your training system, without the spreadsheet chaos.
                        </h1>
                        <p className="max-w-xl text-base leading-7 text-[var(--color-muted)]">
                            Sign in to manage your plan, regenerate your programming, and keep your account settings inside one consistent dark workspace.
                        </p>
                    </div>
                </div>

                <div className="relative">
                    <div className="absolute inset-0 rounded-[2rem] bg-linear-to-br from-accent/12 via-transparent to-transparent blur-3xl" />
                    <div className="relative rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-card)]/90 p-4 shadow-[0_32px_120px_rgba(0,0,0,0.45)]">
            <div className="w-full max-w-md mx-auto">
                <AuthView pathname={pathname} />
            </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
