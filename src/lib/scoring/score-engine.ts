/**
 * Score Engine – Computes form score (0-100) from joint angle deviations
 */

interface JointAnalysis {
    angle: number;
    ideal: [number, number];
    deviation: number;
    tip: string;
    weight: number;
}

/**
 * Compute overall form score from joint analyses
 * Uses weighted average of joint scores, where each joint is scored
 * based on its deviation from ideal range
 */
export function computeFormScore(
    joints: Record<string, JointAnalysis>
): { score: number; tips: Array<{ joint: string; message: string; severity: "good" | "warning" | "error" }> } {
    const entries = Object.entries(joints);
    if (entries.length === 0) return { score: 50, tips: [] };

    let totalWeight = 0;
    let weightedScore = 0;
    const tips: Array<{ joint: string; message: string; severity: "good" | "warning" | "error" }> = [];

    for (const [name, joint] of entries) {
        totalWeight += joint.weight;

        // Score this joint: 100 if in ideal range, decreasing as deviation increases
        // Max deviation of ~45 degrees = 0 score for that joint
        const maxDeviation = 45;
        const jointScore = Math.max(0, 100 - (joint.deviation / maxDeviation) * 100);
        weightedScore += jointScore * joint.weight;

        // Generate tip with severity
        const formattedName = name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

        if (joint.deviation === 0) {
            tips.push({
                joint: formattedName,
                message: `${formattedName}: Perfect! (${joint.angle}° in ideal ${joint.ideal[0]}-${joint.ideal[1]}° range)`,
                severity: "good",
            });
        } else if (joint.deviation <= 15) {
            tips.push({
                joint: formattedName,
                message: `${formattedName}: ${joint.angle}° (${joint.deviation}° off from ideal ${joint.ideal[0]}-${joint.ideal[1]}°) – ${joint.tip}`,
                severity: "warning",
            });
        } else {
            tips.push({
                joint: formattedName,
                message: `${formattedName}: ${joint.angle}° (${joint.deviation}° off from ideal ${joint.ideal[0]}-${joint.ideal[1]}°) – ${joint.tip}`,
                severity: "error",
            });
        }
    }

    // Sort tips: errors first, then warnings, then good
    const severityOrder = { error: 0, warning: 1, good: 2 };
    tips.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    const score = Math.round(weightedScore / totalWeight);
    return { score: Math.max(0, Math.min(100, score)), tips };
}
