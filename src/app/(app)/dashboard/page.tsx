import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AnalysisCard } from "@/components/dashboard/analysis-card";
import { UsageBanner } from "@/components/dashboard/usage-banner";
import { CopyLinkButton } from "@/components/dashboard/copy-link-button";

/**
 * Dashboard Page – Displays past analyses grid, usage counter, and quick actions
 */
export default async function DashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    // Fetch profile
    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    // Fetch analyses ordered by newest first
    const { data: analyses } = await supabase
        .from("analyses")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    const displayName = profile?.display_name || user.email?.split("@")[0] || "there";

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
            {/* Header */}
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold">
                        Welcome back, <span className="gradient-lime-text">{displayName}</span>
                    </h1>
                    <p className="mt-1 text-muted-foreground">
                        Track your form improvements over time
                    </p>
                </div>
                <Link href="/analyze">
                    <Button className="glow-lime-sm">
                        <span className="mr-2">📹</span>
                        New Analysis
                    </Button>
                </Link>
            </div>

            {/* Usage banner */}
            <div className="mb-8">
                <UsageBanner
                    used={profile?.free_analyses_used || 0}
                    limit={5}
                    isPro={profile?.is_pro || false}
                />
            </div>

            {/* Referral code */}
            {profile?.referral_code && (
                <div className="mb-8 rounded-xl border border-border/50 bg-card p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm font-medium">Share & Get Free Months</p>
                            <p className="text-xs text-muted-foreground">
                                Each friend who signs up = 1 free month of Pro for you
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <code className="rounded-md border border-border bg-muted px-3 py-1 text-sm font-mono">
                                {profile.referral_code}
                            </code>
                            <CopyLinkButton code={profile.referral_code} />
                        </div>
                    </div>
                </div>
            )}

            {/* Analyses Grid */}
            {analyses && analyses.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {analyses.map((analysis) => (
                        <AnalysisCard
                            key={analysis.id}
                            id={analysis.id}
                            exerciseType={analysis.exercise_type}
                            score={analysis.score}
                            thumbnailUrl={analysis.thumbnail_url}
                            createdAt={analysis.created_at}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/50 py-20">
                    <span className="mb-4 text-5xl">🏋️</span>
                    <h3 className="text-lg font-semibold">No analyses yet</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Record your first exercise to get started
                    </p>
                    <Link href="/analyze" className="mt-6">
                        <Button className="glow-lime-sm">Start Your First Analysis</Button>
                    </Link>
                </div>
            )}
        </div>
    );
}
