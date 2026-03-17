import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "@/components/ui/button";
import { Calendar, Dumbbell, RefreshCcw, Target, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PlanDisplay } from "@/components/plan/PlanDisplay";

export default function Profile() {
    const {user, plan, isLoading, generatePlan} = useAuth();

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

                    <Button variant="secondary" className="gap-2" onClick={async () => await generatePlan()}>
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
        </div>
    )
}
