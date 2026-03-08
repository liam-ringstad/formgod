import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScoreGauge } from "@/components/results/score-gauge";
import { TipsList } from "@/components/results/tips-list";
import { ExportReelButton } from "@/components/results/export-reel-button";
import { ShareButton } from "@/components/results/share-button";

interface ResultsPageProps {
    params: Promise<{ id: string }>;
}

/**
 * Results Page – Displays analysis score, tips, and reel export
 */
export default async function ResultsPage({ params }: ResultsPageProps) {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const { data: analysis, error } = await supabase
        .from("analyses")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

    if (error || !analysis) notFound();

    const tips = Array.isArray(analysis.tips) ? analysis.tips : [];

    return (
        <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
            {/* Back button */}
            <Link
                href="/dashboard"
                className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
                ← Back to Dashboard
            </Link>

            {/* Header */}
            <div className="mb-8 text-center">
                <Badge variant="secondary" className="mb-4 text-sm">
                    {analysis.exercise_type}
                </Badge>
                <h1 className="text-3xl font-bold">
                    Form <span className="gradient-lime-text">Analysis</span>
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    {new Date(analysis.created_at).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                    })}
                </p>
            </div>

            {/* Score */}
            <div className="mb-8 flex justify-center">
                <ScoreGauge score={analysis.score} />
            </div>

            <Separator className="my-8" />

            {/* Tips */}
            <div className="mb-8">
                <TipsList tips={tips as Array<{ joint: string; message: string; severity: "good" | "warning" | "error" }>} />
            </div>

            {/* Joint data details */}
            {analysis.joint_data && Object.keys(analysis.joint_data).length > 0 && (
                <>
                    <Separator className="my-8" />
                    <div className="mb-8">
                        <h3 className="mb-4 text-lg font-semibold">Joint Angles</h3>
                        <div className="grid gap-3 sm:grid-cols-2">
                            {Object.entries(analysis.joint_data as Record<string, { angle: number; ideal: [number, number]; deviation: number }>).map(
                                ([name, data]) => {
                                    const isGood = data.deviation === 0;
                                    const isWarning = data.deviation > 0 && data.deviation <= 15;
                                    const statusColor = isGood
                                        ? "text-green-400"
                                        : isWarning
                                            ? "text-yellow-400"
                                            : "text-red-400";
                                    const statusBg = isGood
                                        ? "bg-green-500/10 border-green-500/20"
                                        : isWarning
                                            ? "bg-yellow-500/10 border-yellow-500/20"
                                            : "bg-red-500/10 border-red-500/20";

                                    return (
                                        <div
                                            key={name}
                                            className={`rounded-lg border ${statusBg} p-3`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium capitalize">
                                                    {name.replace(/_/g, " ")}
                                                </span>
                                                <span className={`text-sm font-bold ${statusColor}`}>
                                                    {data.angle}°
                                                </span>
                                            </div>
                                            <div className="mt-1 text-xs text-muted-foreground">
                                                Ideal: {data.ideal[0]}°–{data.ideal[1]}°
                                                {data.deviation > 0 && (
                                                    <span className={`ml-2 ${statusColor}`}>
                                                        ({data.deviation}° off)
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                }
                            )}
                        </div>
                    </div>
                </>
            )}

            <Separator className="my-8" />

            {/* Export & Share */}
            <div className="space-y-4">
                <ExportReelButton
                    analysisId={analysis.id}
                    score={analysis.score}
                    exerciseType={analysis.exercise_type}
                />

                <div className="flex gap-3">
                    <ShareButton />
                    <Link href="/analyze" className="flex-1">
                        <Button variant="outline" className="w-full">
                            🔄 New Analysis
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
