"use client";

import { useEffect, useState } from "react";

interface ScoreGaugeProps {
    score: number;
    size?: number;
}

/**
 * ScoreGauge – Animated circular score display with color gradient
 */
export function ScoreGauge({ score, size = 180 }: ScoreGaugeProps) {
    const [animatedScore, setAnimatedScore] = useState(0);

    // Animate score on mount
    useEffect(() => {
        const duration = 1500; // ms
        const start = performance.now();

        const animate = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setAnimatedScore(Math.round(score * eased));

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }, [score]);

    const strokeWidth = 10;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference - (animatedScore / 100) * circumference;

    // Color based on score
    const color =
        score >= 80
            ? "#00c851"
            : score >= 60
                ? "#8acc22"
                : score >= 40
                    ? "#ffbb33"
                    : "#ff4444";

    const label =
        score >= 80
            ? "Excellent"
            : score >= 60
                ? "Good"
                : score >= 40
                    ? "Needs Work"
                    : "Poor Form";

    return (
        <div className="flex flex-col items-center gap-2">
            <div className="relative" style={{ width: size, height: size }}>
                <svg width={size} height={size} className="-rotate-90">
                    {/* Background circle */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke="hsl(var(--muted))"
                        strokeWidth={strokeWidth}
                    />
                    {/* Score arc */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke={color}
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference}
                        strokeDashoffset={dashOffset}
                        strokeLinecap="round"
                        style={{
                            transition: "stroke-dashoffset 0.3s ease",
                            filter: `drop-shadow(0 0 8px ${color}50)`,
                        }}
                    />
                </svg>
                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span
                        className="text-4xl font-black"
                        style={{ color }}
                    >
                        {animatedScore}
                    </span>
                    <span className="text-xs text-muted-foreground">/100</span>
                </div>
            </div>
            <span
                className="text-sm font-semibold"
                style={{ color }}
            >
                {label}
            </span>
        </div>
    );
}
