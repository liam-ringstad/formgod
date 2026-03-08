/**
 * Replicate Form Analyzer – AI-powered coaching tip enhancement
 * Uses Meta Llama 3 via Replicate for natural language coaching
 */
import Replicate from "replicate";

interface FormAnalysisInput {
    exerciseType: string;
    jointData: Record<string, unknown>;
    score: number;
    basicTips: string[];
}

interface CoachingTip {
    joint: string;
    message: string;
    severity: "good" | "warning" | "error";
}

/**
 * Enhance coaching tips with AI-powered analysis
 * Falls back to basic tips if Replicate is unavailable
 */
export async function enhanceCoachingTips(
    input: FormAnalysisInput
): Promise<CoachingTip[]> {
    if (!process.env.REPLICATE_API_TOKEN) {
        // Return basic tips formatted as CoachingTip
        return input.basicTips.map((tip) => ({
            joint: "General",
            message: tip,
            severity: input.score >= 70 ? "good" : input.score >= 40 ? "warning" : "error",
        }));
    }

    const replicate = new Replicate({
        auth: process.env.REPLICATE_API_TOKEN,
    });

    const prompt = `You are a certified personal trainer and exercise biomechanics expert. Analyze the following exercise form data and provide specific, actionable coaching tips.

Exercise: ${input.exerciseType}
Overall Score: ${input.score}/100
Joint Angle Data: ${JSON.stringify(input.jointData, null, 2)}

Current basic tips: ${JSON.stringify(input.basicTips)}

Provide 3-5 enhanced coaching cues. Be specific with degree corrections. Structure as JSON:
[{"joint": "Joint Name", "message": "Specific tip with degree corrections", "severity": "good|warning|error"}]

Return ONLY the JSON array.`;

    try {
        const output = await replicate.run("meta/meta-llama-3-8b-instruct", {
            input: {
                prompt,
                max_tokens: 600,
                temperature: 0.2,
                top_p: 0.9,
            },
        });

        const text = Array.isArray(output) ? output.join("") : String(output);
        const jsonMatch = text.match(/\[[\s\S]*?\]/);

        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]) as CoachingTip[];
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed;
            }
        }
    } catch (err) {
        console.error("Replicate analysis failed:", err);
    }

    // Fallback
    return input.basicTips.map((tip) => ({
        joint: "Form Check",
        message: tip,
        severity: input.score >= 70 ? "good" : input.score >= 40 ? "warning" : "error",
    }));
}
