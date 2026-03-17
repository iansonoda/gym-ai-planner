import { useAuth } from "@/context/AuthContext"
import { RedirectToSignIn, SignedIn } from "@neondatabase/neon-js/auth/react";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useNavigate } from "react-router-dom";


const goalOptions = [
    {value: "bulk", label: "Build Muscle (Bulk)"},
    {value: "cut", label: "Lose Fat (Cut)"},
    {value: "recomp", label: "Body Recomposition"},
    {value: "strength", label: "Build Strength"},
    {value: "endurance", label: "Improve Endurance"},
];

const experience = [
    {value: "beginner", label: "Beginner (0-1 years)"},
    {value: "intermediate", label: "Intermediate (1-3 years)"},
    {value: "advanced", label: "Advanced (3+ years)"},
];

const daysOptions = [
    {value: 2, label: "2 Days per week"},
    {value: 3, label: "3 Days per week"},
    {value: 4, label: "4 Days per week"},
    {value: 5, label: "5 Days per week"},
    {value: 6, label: "6 Days per week"},
]

const sessionOptions = [
    {value: 30, label: "30 minutes"},
    {value: 45, label: "45 minutes"},
    {value: 60, label: "60 minutes"},
    {value: 90, label: "90 minutes"},
]

const equipmentOptions = [
    {value: "full_gym", label: "Full Gym Access"},
    {value: "home", label: "Home Gym"},
    {value: "dumbbells", label: "Dumbbells Only"},
    {value: "calisthenics", label: "Calisthenics Only"},
]

const splitOptions = [
    {value: "push_pull_legs", label: "Push, Pull, Legs"},
    {value: "upper_lower", label: "Upper, Lower"},
    {value: "full_body", label: "Full Body"},
    {value: "custom", label: "Let AI Decide"},
]

export default function Onboarding() {
    const { user, saveProfile, generatePlan} = useAuth();
    const [formData, setFormData] = useState({
        goal: "bulk",
        experience: "beginner",
        daysPerWeek: 2,
        sessionDuration: 30,
        equipment: "full_gym",
        injuries: "",
        preferredSplit: "upper_lower",
    });
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    function updateForm(field: string, value: string) {
        setFormData((prev) => ({ ...prev, [field]: value }));
    }

    async function handleQuestionnaire(e: React.SubmitEvent) {
        e.preventDefault();

        const profile = {
            goal: formData.goal,
            experience: formData.experience,
            daysPerWeek: Number(formData.daysPerWeek),
            sessionDuration: Number(formData.sessionDuration),
            equipment: formData.equipment,
            injuries: formData.injuries,
            preferredSplit: formData.preferredSplit,
        };
        try {
            await saveProfile(profile);
            setIsGenerating(true);
            // Logic for ai generation 
            await generatePlan();
            // Redirect to home page
            navigate("/profile");
        } catch (error) {
            setError(error instanceof Error ? error.message: 'Failed to save profile')
        } finally {
            setIsGenerating(false);
        }
    }

    if (!user) {
        return <RedirectToSignIn />;
    }


    return (
        <SignedIn>
            <div className="min-h-screen pt-24 pb-12 px-6">
                <div className="max-w-xl mx-auto">
                    { /* Progress Indicator */}

                    { /* Step 1: Questionnaire */}
                    {!isGenerating ? <Card variant="bordered">
                        <h1 className="text-2xl font-semibold">Tell Us About Yourself</h1>
                        <p className="text-muted mb-6">Help us create the perfect plan for you.</p>
                        <form onSubmit={handleQuestionnaire} className="space-y-5">
                            <Select 
                                id="goal" 
                                label="What's your primary goal?" 
                                options={goalOptions} 
                                value={formData.goal}
                                onChange={(e) => updateForm("goal", e.target.value)}
                            />
                            <Select 
                                id="experience" 
                                label="How experienced are you?" 
                                options={experience} 
                                value={formData.experience}
                                onChange={(e) => updateForm("experience", e.target.value)}
                            />
                            <div className="grid grid-cols-2 gap-4">
                            <Select 
                                id="daysPerWeek" 
                                label="Days Per Week" 
                                options={daysOptions} 
                                value={formData.daysPerWeek}
                                onChange={(e) => updateForm("daysPerWeek", e.target.value)}
                            />
                            <Select 
                                id="sessionDuration" 
                                label="Session Duration" 
                                options={sessionOptions} 
                                value={formData.sessionDuration}
                                onChange={(e) => updateForm("sessionDuration", e.target.value)}
                            />
                            </div>
                            <Select 
                                id="equipment" 
                                label="Equipment Access" 
                                options={equipmentOptions} 
                                value={formData.equipment}
                                onChange={(e) => updateForm("equipment", e.target.value)}
                            />
                            <Select 
                                id="preferredSplit" 
                                label="Preferred Split" 
                                options={splitOptions}
                                value={formData.preferredSplit}
                                onChange={(e) => updateForm("preferredSplit", e.target.value)}
                            />

                            <Textarea
                                id="injuries"
                                label="Do you have any injuries or limitations? (Optional)"
                                placeholder="E.g, lower back issues, knee pain, etc."
                                rows={3}
                                value={formData.injuries}
                                onChange={(e) => updateForm("injuries", e.target.value)}
                            />

                            <div className="flex gap-3 pt-2">
                                <Button type="submit" className="flex-1 gap-2">
                                    Generate My Plan <ArrowRight className="w-4 h-4"/>
                                </Button>
                            </div>
                        </form>
                    </Card> : (
                        <Card variant="bordered" className="text-center py-16">
                            <Loader2 className="w-12 h-12 text-accent mx-auto mb-6 animate-spin" />
                            <h1 className="text-2xl font-bold mb-2">Creating your Plan</h1>
                            <p className="text-muted"> Our AI is building your personalized workout plan. This may take a few seconds...</p>
                        </Card>
                    )}

                    { /* Step 2: Generating Plan */}
                </div>
            </div>
        </SignedIn>
    )
}