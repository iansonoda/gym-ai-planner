import { AccountView, RedirectToSignIn, SignedIn } from "@neondatabase/neon-js/auth/react";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/context/useAuth";
import { Settings, ShieldCheck, UserRound } from "lucide-react";
import { useParams } from "react-router-dom";

export default function Account() {
    const { user } = useAuth();
    const { pathname } = useParams();

    if (!pathname) {
        return <RedirectToSignIn />;
    }

    return (
        <SignedIn>
            <div className="neon-auth-shell min-h-screen px-6 pt-24 pb-12">
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
                                Update your login details, security settings, and account preferences without dropping into a separate generic auth screen.
                            </p>
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                        <Card variant="bordered" className="space-y-3">
                            <UserRound className="h-5 w-5 text-accent" />
                            <div>
                                <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-muted)]">Email</p>
                                <p className="mt-2 text-sm font-medium text-[var(--color-foreground)]">
                                    {user?.email ?? "Signed in"}
                                </p>
                            </div>
                        </Card>
                        <Card variant="bordered" className="space-y-3">
                            <ShieldCheck className="h-5 w-5 text-accent" />
                            <div>
                                <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-muted)]">Security</p>
                                <p className="mt-2 text-sm font-medium text-[var(--color-foreground)]">
                                    Password, sessions, and provider connections
                                </p>
                            </div>
                        </Card>
                        <Card variant="bordered" className="space-y-3">
                            <Settings className="h-5 w-5 text-accent" />
                            <div>
                                <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-muted)]">Workspace</p>
                                <p className="mt-2 text-sm font-medium text-[var(--color-foreground)]">
                                    Settings are styled to match the rest of the app
                                </p>
                            </div>
                        </Card>
                    </div>

                    <div className="rounded-[2rem] border border-[var(--color-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0))] p-4 shadow-[0_24px_90px_rgba(0,0,0,0.35)] md:p-6">
                        <div className="mb-6 border-b border-[var(--color-border)] pb-5">
                            <h2 className="text-xl font-semibold">Account Controls</h2>
                            <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                                Everything below is powered by Neon Auth, but presented in a cleaner settings shell.
                            </p>
                        </div>

                        <div className="mx-auto w-full max-w-4xl">
                            <AccountView pathname={pathname} />
                        </div>
                    </div>
                </div>
            </div>
        </SignedIn>
    )
}
