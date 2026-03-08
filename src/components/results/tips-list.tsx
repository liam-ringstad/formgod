interface Tip {
    joint: string;
    message: string;
    severity: "good" | "warning" | "error";
}

interface TipsListProps {
    tips: Tip[];
}

/**
 * TipsList – Coaching tips with severity icons and descriptions
 */
export function TipsList({ tips }: TipsListProps) {
    const severityConfig = {
        good: {
            icon: "✅",
            bg: "bg-green-500/10",
            border: "border-green-500/20",
            text: "text-green-400",
        },
        warning: {
            icon: "⚠️",
            bg: "bg-yellow-500/10",
            border: "border-yellow-500/20",
            text: "text-yellow-400",
        },
        error: {
            icon: "❌",
            bg: "bg-red-500/10",
            border: "border-red-500/20",
            text: "text-red-400",
        },
    };

    return (
        <div className="space-y-3">
            <h3 className="text-lg font-semibold">Coaching Tips</h3>
            {tips.map((tip, index) => {
                // Backwards compatibility for string arrays
                if (typeof tip === "string") {
                    return (
                        <div
                            key={index}
                            className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-4 transition-all hover:scale-[1.01]"
                        >
                            <div className="flex items-start gap-3">
                                <span className="mt-0.5 text-lg">⚠️</span>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-yellow-400">
                                        Coaching Note
                                    </p>
                                    <p className="mt-1 text-sm text-foreground/80">
                                        {tip as string}
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                }

                const config = severityConfig[tip.severity] || severityConfig.warning;
                return (
                    <div
                        key={index}
                        className={`rounded-xl border ${config.border} ${config.bg} p-4 transition-all hover:scale-[1.01]`}
                    >
                        <div className="flex items-start gap-3">
                            <span className="mt-0.5 text-lg">{config.icon}</span>
                            <div className="flex-1">
                                <p className={`text-sm font-medium ${config.text}`}>
                                    {tip.joint}
                                </p>
                                <p className="mt-1 text-sm text-foreground/80">
                                    {tip.message}
                                </p>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
