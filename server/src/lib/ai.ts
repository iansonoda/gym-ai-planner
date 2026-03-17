import OpenAI from "openai";
import dotenv from "dotenv";
import { TrainingPlan, UserProfile } from "../../types";

dotenv.config();

export async function generateTrainingPlan(
    profile: UserProfile | Record<string, unknown>
) : Promise<Omit<TrainingPlan, "id" | "userId" | "version" | "createdAt">> {

    // Normalize Profile Data
    const normalizedProfile: UserProfile = {
        goal: profile.goal || "bulk",
        experience: profile.experience || "beginner",
        days_per_week: profile.days_per_week || 4,
        session_duration: profile.session_duration || 60,
        equipment: profile.equipment || "full_gym",
        injuries: profile.injuries || null,
        preferred_split: profile.preferred_split || "upper_lower",
    };

    const apiKey = process.env.OPEN_ROUTER_KEY;

    if (!apiKey) {
        throw new Error("OPEN_ROUTER_KEY is not defined in environment variables")
    }

    const openai = new OpenAI({
        apiKey,
        baseURL: "https://openrouter.ai/api/v1",
        timeout: 60000,
        defaultHeaders: {
            "HTTP-Referer": process.env.BASE_URL || "http://localhost:3001",
            "X-Title": "GymAI Planner"
        }
    })

    // Build prompt
    const prompt = buildPrompt(normalizedProfile);

    try {
        // Call OpenRouter API
        const completion = await openai.chat.completions.create({
            model: "arcee-ai/trinity-large-preview:free",
            messages: [
                {
                    role: "system",
                    content: "You are an expert personal trainer and strength coach with over 10 years of experience. You specialize in creating personalized, evidence-based training programs for clients with diverse goals, experience levels, and equipment availabilities. You must always respond with valid JSON. Do not include markdown formatting, code blocks, reasoning, or any other text outside of the JSON object."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.7,
            response_format: { type: "json_object" },
        });

        // This is the raw response from the AI
        const content = completion.choices[0].message.content; 

        if (!content) {
            console.error(
                "[AI] No content in AI response:",
                JSON.stringify(completion, null, 2)
            );
            throw new Error("No content received from AI");
        }

        const planData = JSON.parse(content);

        return formatPlanResponse(planData, normalizedProfile);
    } catch (error) {
        console.error("[AI] Error generating plan:", error);
        throw new Error("Failed to generate training plan");
    }
}

function formatPlanResponse(aiResponse: any, profile: UserProfile): Omit<TrainingPlan, "id" | "userId" | "version" | "createdAt"> {
    const plan: Omit<TrainingPlan, "id" | "userId" | "version" | "createdAt"> = {
        overview: {
            goal: aiResponse.overview?.goal || `Customized ${profile.goal} program`,
            frequency: aiResponse.overview?.frequency || `${profile.days_per_week} days per week`,
            split: aiResponse.overview?.split || profile.preferred_split,
            notes: aiResponse.overview?.notes || "Follow this plan consistently for best results",
        },
        weeklySchedule: (aiResponse.weeklySchedule || []).map((day: any) => ({
            day: day.day || "Day",
            focus: day.focus || "Full Body",
            exercises: (day.exercises || []).map((ex: any) => ({
                name: ex.name || "Exercise",
                sets: ex.sets || 3,
                reps: ex.reps || "10-12",
                rest: ex.rest || "60s",
                rpe: ex.rpe || 8,
                notes: ex.notes || "",
                alternatives: ex.alternatives || [],
            })),
        })),
        progression: aiResponse.progression || "Increase weight by 2.5-5lbs (1-2.5kg) when you can complete all sets with good form. Track your progress weekly.",
    };

    return plan;
}

function buildPrompt(profile: UserProfile) : string {
    const goalMap: Record<string, string> = {
        bulk: "Lean Bulk - Build muscle while minimizing fat gain",
        cut: "Cut - Maximize fat loss while preserving muscle",
        recomp: "Body Recomposition - Build muscle and lose fat simultaneously",
        strength: "Strength Gain - Focus on progressive overload and strength development",
        endurance: "Endurance - Improve cardiovascular fitness and muscular endurance",
    };

    const experienceMap: Record<string, string> = {
        beginner: "Beginner (0-1 years of training experience)",
        intermediate: "Intermediate (1-3 years of training experience)",
        advanced: "Advanced (3+ years of training experience)",
    };

    const equipmentMap: Record<string, string> = {
        full_gym: "Full gym access with all equipment",
        home: "Home gym with basic equipment",
        dumbbells: "Only dumbbells available",
        calisthenics: "Bodyweight only",
    };

    const splitMap: Record<string, string> = {
        push_pull_legs: "Push, Pull, Legs split",
        upper_lower: "Upper, Lower split",
        full_body: "Full Body split",
        custom: "Best split for their goals, experience level, equipement availibility, frequency, and session duration",
    };

    const prompt = `    
    Create a personalized ${profile.days_per_week}-day per week training plan for a user with the following profile:
    
    Goal: ${goalMap[profile.goal] || profile.goal}
    Experience Level: ${experienceMap[profile.experience] || profile.experience}
    Session Duration: ${profile.session_duration} minutes per session
    Equipment: ${equipmentMap[profile.equipment] || profile.equipment}
    Injuries: ${profile.injuries || "None"}
    Preferred Split: ${splitMap[profile.preferred_split] || profile.preferred_split}

    Generate a comprehensive, evidence-based training plan that is tailored to the user's specific needs and goals. The plan should be realistic, progressive, and sustainable. It should include:
    - A weekly schedule with ${profile.days_per_week} days of training
    - ${profile.session_duration} minutes per session
    - ${profile.preferred_split} split
    - ${profile.equipment} equipment
    - ${profile.injuries || "None"} injuries
    - ${profile.goal} goal
    - ${profile.experience} experience
    
    IMPORTANT!: The plan should be returned as a JSON object matching the TrainingPlan interface.
    Do NOT include markdown formatting or code blocks.
    
    TrainingPlan Interface:
    {
        "overview": {
            "goal": "string",
            "experience": "string",
            "frequency": "string",
            "duration": "string",
            "split": "string"
        },
        "weeklySchedule": [
            {
                "day": "string",
                "focus": "string",
                "exercises": [
                    {
                        "name": "string",
                        "sets": number,
                        "reps": "string",
                        "rest": "string",
                        "rpe": number,
                        "notes": "string",
                        "alternatives": ["string1", "string2", "string3"]
                    }
                ]
            }
        ],
        "progression": "string",
    }

    Example of a good response:
    {
        "overview": {
            "goal": "Lean Bulk - Build muscle while minimizing fat gain",
            "experience": "Beginner - 0-1 years of training experience",
            "frequency": "4 days per week",
            "duration": "60 minutes per session",
            "split": "Upper, Lower split"
        },
        "weeklySchedule": [
            {
                "day": "Monday",
                "focus": "Upper Body",
                "exercises": [
                    {
                        "name": "Barbell Squat",
                        "sets": 3,
                        "reps": "8-12",
                        "rest": "2-3 minutes",
                        "rpe": 7-8,
                        "notes": "Form cues or tips (optional)",
                        "alternatives": ["string1", "string2", "string3"]
                    }
                ]
            }
        ],
        "progression": "string",
    }

    Requirements: 
    - Create exactly ${profile.days_per_week} days of training
    - Use well known exercises that are safe and effective
    - Each workout should fit within ${profile.session_duration} minutes of training maximum
    - Include optional warm-up and cool-down section exercises, but do not count them towards the total workout time
    - Include around 4-6 exercises per workout, more if needed to fill the time
    - RPE (Rate of Perceived Exertion) should be between 6-9 for most exercises
    - Include compound movement for beginners/intermediates. Advanced users can include more isolation exercises
    - Always match the ${profile.preferred_split} split
    ${profile.injuries ? `- Avoid exercises that aggravate the following injuries: ${profile.injuries}` : ""}
    - Provide alternative exercises when appropriate, especially if the user has limited equipment
    - Provide a detailed progression strategy suitable for ${profile.goal} and ${profile.experience} experience level


    Ensure the JSON is valid and can be parsed by JSON.parse()
    Return ONLY the JSON object, with no markdown formatting or code blocks.
    `;

    return prompt;
}