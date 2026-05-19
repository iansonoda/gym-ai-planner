import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/useAuth";
import { Settings, ShieldCheck, UserRound } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";

export default function Account() {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();

    if (!user) {
        return <Navigate to="/auth/sign-in" replace />;
    }

    async function handleSignOut() {
        await signOut();
        navigate("/");
    }

    return (
        <div className="min-h-screen px-6 pt-24 pb-12">
            <div className="mx-auto max-w-6xl space-y-8">
                <div className="max-w-3xl space-y-4">
                    <p className="text-sm uppercase tracking-[0.28em] text-[var(--color-muted)]">
                        Account Settings
                    </p>
                    <div className="space-y-3">
                        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
                            Manage your account inside the same training workspace.
                        </h1>
                        <p className="max-w-2xl text-base leading-7 text-[var(--color-muted)]">
                            Review your login provider and session details for this Gym AI workspace.
                        </p>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card variant="bordered" className="space-y-3">
                        <UserRound className="h-5 w-5 text-accent" />
                        <div>
                            <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-muted)]">Email</p>
                            <p className="mt-2 text-sm font-medium text-[var(--color-foreground)]">
                                {user.email}
                            </p>
                        </div>
                    </Card>
                    <Card variant="bordered" className="space-y-3">
                        <ShieldCheck className="h-5 w-5 text-accent" />
                        <div>
                            <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-muted)]">Provider</p>
                            <p className="mt-2 text-sm font-medium text-[var(--color-foreground)]">
                                {user.providers?.join(", ") || "OAuth"}
                            </p>
                        </div>
                    </Card>
                    <Card variant="bordered" className="space-y-3">
                        <Settings className="h-5 w-5 text-accent" />
                        <div>
                            <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-muted)]">Workspace</p>
                            <p className="mt-2 text-sm font-medium text-[var(--color-foreground)]">
                                Gym AI training planner
                            </p>
                        </div>
                    </Card>
                </div>

                <Card variant="bordered" className="space-y-5">
                    <div>
                        <h2 className="text-xl font-semibold">Session</h2>
                        <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                            Signing out clears your local server session and returns you to the home page.
                        </p>
                    </div>
                    <Button type="button" variant="secondary" onClick={handleSignOut}>
                        Sign out
                    </Button>
                </Card>
            </div>
        </div>
    );
}
