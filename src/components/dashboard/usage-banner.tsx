import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface UsageBannerProps {
    used: number;
    limit: number;
    isPro: boolean;
}

/**
 * UsageBanner – Shows free tier usage and upgrade CTA
 */
export function UsageBanner({ used, limit, isPro }: UsageBannerProps) {
    if (isPro) {
        return (
            <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20">
                    <span className="text-sm">⚡</span>
                </div>
                <div>
                    <p className="text-sm font-semibold text-primary">Pro Plan Active</p>
                    <p className="text-xs text-muted-foreground">Unlimited analyses</p>
                </div>
            </div>
        );
    }

    const remaining = Math.max(0, limit - used);
    const percentage = (used / limit) * 100;

    return (
        <div className="rounded-xl border border-border/50 bg-card p-4">
            <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium">
                    Free Analyses: <span className="text-primary">{remaining}</span> remaining
                </p>
                <span className="text-xs text-muted-foreground">
                    {used}/{limit} used
                </span>
            </div>
            <Progress value={percentage} className="h-2" />
            {remaining <= 2 && (
                <div className="mt-3 flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                        {remaining === 0 ? "Upgrade to continue analyzing" : "Running low!"}
                    </p>
                    <Link href="/pricing">
                        <Button size="sm" variant="outline" className="h-7 text-xs">
                            Upgrade to Pro
                        </Button>
                    </Link>
                </div>
            )}
        </div>
    );
}
