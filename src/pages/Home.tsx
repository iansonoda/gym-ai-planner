import { Card } from "@/components/ui/card";
import { useAuth } from "@/context/useAuth"
import { ArrowRight, Dumbbell, ShieldCheck, Sparkles } from "lucide-react";
import { Link, Navigate } from "react-router-dom"
import heroImage from "@/assets/hero.png";
import { Button } from "@/components/ui/button";

export default function Home() {
    const {user, isLoading} = useAuth();

    if (user && !isLoading) {
        return <Navigate to="/profile" replace/>
    }

    return (
        <div className="min-h-screen pt-24 pb-12 px-6">
            <div className="max-w-6xl mx-auto grid lg:grid-cols-[1.1fr_0.9fr] gap-8 items-center">
                <div className="space-y-8">
                    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-4 py-2 text-sm text-muted">
                        <Sparkles className="w-4 h-4 text-accent" />
                        Personalized training plans with AI assistance
                    </div>

                    <div className="space-y-4">
                        <h1 className="text-5xl md:text-7xl font-semibold leading-none tracking-tight">
                            Build a plan you will actually follow.
                        </h1>
                        <p className="max-w-2xl text-lg text-muted leading-relaxed">
                            Answer a short onboarding flow, get a structured weekly split,
                            and regenerate your program as your goals or equipment change.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <Link to="/auth/sign-up">
                            <Button size="lg" className="gap-2 w-full sm:w-auto">
                                Start Planning <ArrowRight className="w-4 h-4" />
                            </Button>
                        </Link>
                        <Link to="/auth/sign-in">
                            <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                                Sign In
                            </Button>
                        </Link>
                    </div>

                    <div className="grid sm:grid-cols-3 gap-4">
                        <Card variant="bordered" className="space-y-2">
                            <Dumbbell className="w-5 h-5 text-accent" />
                            <h2 className="font-medium">Equipment-aware</h2>
                            <p className="text-sm text-muted">Plans adapt to full gyms, home setups, dumbbells, or bodyweight only.</p>
                        </Card>
                        <Card variant="bordered" className="space-y-2">
                            <ShieldCheck className="w-5 h-5 text-accent" />
                            <h2 className="font-medium">Constraint-aware</h2>
                            <p className="text-sm text-muted">Injuries, experience level, and preferred split are built into generation.</p>
                        </Card>
                        <Card variant="bordered" className="space-y-2">
                            <Sparkles className="w-5 h-5 text-accent" />
                            <h2 className="font-medium">Easy to regenerate</h2>
                            <p className="text-sm text-muted">Versioned plans let you refresh your training without losing history.</p>
                        </Card>
                    </div>
                </div>

                <div className="relative">
                    <div className="absolute inset-0 rounded-[2rem] bg-linear-to-br from-accent/15 via-transparent to-transparent blur-3xl" />
                    <Card variant="bordered" className="relative overflow-hidden p-0">
                        <img
                            src={heroImage}
                            alt="Gym AI Planner workout preview"
                            className="w-full h-[540px] object-cover"
                        />
                    </Card>
                </div>
            </div>
        </div>
    )
}
