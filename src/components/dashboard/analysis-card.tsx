import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface AnalysisCardProps {
    id: string;
    exerciseType: string;
    score: number;
    thumbnailUrl?: string | null;
    createdAt: string;
}

/**
 * AnalysisCard – Shows a past analysis with score, exercise type, and date
 */
export function AnalysisCard({
    id,
    exerciseType,
    score,
    thumbnailUrl,
    createdAt,
}: AnalysisCardProps) {
    const scoreColor =
        score >= 80
            ? "score-excellent"
            : score >= 60
                ? "score-good"
                : score >= 40
                    ? "score-fair"
                    : "score-poor";

    const scoreBg =
        score >= 80
            ? "bg-green-500/10 text-green-400 border-green-500/20"
            : score >= 60
                ? "bg-lime-500/10 text-lime-400 border-lime-500/20"
                : score >= 40
                    ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                    : "bg-red-500/10 text-red-400 border-red-500/20";

    return (
        <Link href={`/results/${id}`}>
            <Card className="group cursor-pointer overflow-hidden border-border/50 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
                {/* Thumbnail */}
                <div className="relative aspect-video bg-muted/50">
                    {thumbnailUrl ? (
                        <img
                            src={thumbnailUrl}
                            alt={exerciseType}
                            crossOrigin="anonymous"
                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                    ) : (
                        <div className="flex h-full items-center justify-center">
                            <span className="text-4xl opacity-30">🏋️</span>
                        </div>
                    )}
                    {/* Score overlay */}
                    <div className="absolute right-3 top-3">
                        <div className={`rounded-lg border px-3 py-1 text-lg font-black backdrop-blur-sm ${scoreBg}`}>
                            {score}
                        </div>
                    </div>
                </div>
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-xs">
                            {exerciseType}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                            {new Date(createdAt).toLocaleDateString()}
                        </span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                        <span className={`text-2xl font-black ${scoreColor}`}>{score}</span>
                        <span className="text-xs text-muted-foreground">/100</span>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}
