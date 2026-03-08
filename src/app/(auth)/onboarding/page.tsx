"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

/**
 * Onboarding Page – Post-signup profile setup
 * User selects fitness level and optional display name
 */
export default function OnboardingPage() {
    const [displayName, setDisplayName] = useState("");
    const [fitnessLevel, setFitnessLevel] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const levels = [
        {
            value: "beginner",
            label: "Beginner",
            description: "New to the gym or <6 months experience",
            emoji: "🌱",
        },
        {
            value: "intermediate",
            label: "Intermediate",
            description: "6 months to 2 years of consistent training",
            emoji: "💪",
        },
        {
            value: "advanced",
            label: "Advanced",
            description: "2+ years of structured training",
            emoji: "🏆",
        },
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fitnessLevel) {
            toast.error("Please select your fitness level");
            return;
        }
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            const { error } = await supabase
                .from("profiles")
                .update({
                    display_name: displayName || null,
                    fitness_level: fitnessLevel,
                })
                .eq("id", user.id);

            if (error) throw error;
            toast.success("Profile set up! Let's analyze your form.");
            router.push("/dashboard");
            router.refresh();
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Failed to save profile");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center px-4">
            <div className="absolute inset-0 -z-10">
                <div className="absolute left-1/4 top-1/4 h-[400px] w-[400px] rounded-full bg-[#b5ff2b] opacity-[0.03] blur-[120px]" />
                <div className="absolute right-1/4 bottom-1/4 h-[300px] w-[300px] rounded-full bg-[#00e5ff] opacity-[0.03] blur-[100px]" />
            </div>

            <Card className="w-full max-w-lg border-border/50 bg-card/80 backdrop-blur-sm">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl gradient-lime">
                        <span className="text-2xl font-black text-black">F</span>
                    </div>
                    <CardTitle className="text-2xl">Set up your profile</CardTitle>
                    <CardDescription>
                        This helps us tailor coaching to your experience level
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <Label htmlFor="displayName">Display Name (optional)</Label>
                            <Input
                                id="displayName"
                                placeholder="How should we call you?"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <Label className="mb-3 block">Fitness Level</Label>
                            <div className="grid gap-3">
                                {levels.map((level) => (
                                    <button
                                        key={level.value}
                                        type="button"
                                        onClick={() => setFitnessLevel(level.value)}
                                        className={`flex items-center gap-4 rounded-xl border p-4 text-left transition-all ${fitnessLevel === level.value
                                                ? "border-primary bg-primary/10 glow-lime-sm"
                                                : "border-border/50 bg-card hover:border-border"
                                            }`}
                                    >
                                        <span className="text-2xl">{level.emoji}</span>
                                        <div>
                                            <div className="font-semibold">{level.label}</div>
                                            <div className="text-sm text-muted-foreground">
                                                {level.description}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full glow-lime-sm"
                            disabled={loading || !fitnessLevel}
                        >
                            {loading ? "Saving..." : "Continue to Dashboard →"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
