import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Replicate from "replicate";

/**
 * POST /api/analyze – Processes joint angle data with AI enhancement
 * Calls Replicate for AI-powered coaching tips, falls back to local tips
 */
export async function POST(request: NextRequest) {
    try {
        // Auth check
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { exerciseType, jointData, score, tips } = body;

        if (!exerciseType || !jointData) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Try Replicate AI enhancement
        let enhancedTips = tips;

        if (process.env.REPLICATE_API_TOKEN) {
            try {
                const replicate = new Replicate({
                    auth: process.env.REPLICATE_API_TOKEN,
                });

                const prompt = `You are an expert exercise coach. Analyze these joint angle measurements for a ${exerciseType} exercise and provide specific, actionable coaching tips.

Joint data: ${JSON.stringify(jointData, null, 2)}
Current score: ${score}/100
Current tips: ${JSON.stringify(tips)}

Provide 3-5 specific coaching cues in this JSON format:
[
  {"joint": "joint name", "message": "specific coaching tip with degree corrections", "severity": "good|warning|error"}
]

Focus on:
1. The most critical form issues first
2. Specific degree corrections (e.g., "Your knee angle is 15° too narrow")
3. Cues the user can immediately apply
4. Safety considerations

Return ONLY valid JSON array, no other text.`;

                const output = await replicate.run("meta/meta-llama-3-8b-instruct", {
                    input: {
                        prompt,
                        max_tokens: 500,
                        temperature: 0.3,
                    },
                });

                // Parse the AI response
                const responseText = Array.isArray(output) ? output.join("") : String(output);
                const jsonMatch = responseText.match(/\[[\s\S]*\]/);
                if (jsonMatch) {
                    const parsedTips = JSON.parse(jsonMatch[0]);
                    if (Array.isArray(parsedTips) && parsedTips.length > 0) {
                        enhancedTips = parsedTips;
                    }
                }
            } catch (err) {
                console.warn("Replicate API call failed, using local tips:", err);
                // Fall back to local tips
            }
        }

        return NextResponse.json({
            score,
            tips: enhancedTips,
            enhanced: enhancedTips !== tips,
        });
    } catch (err) {
        console.error("Analysis API error:", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
