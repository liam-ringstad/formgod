"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExerciseSelector } from "@/components/analyze/exercise-selector";
import { CameraView } from "@/components/analyze/camera-view";
import { UploadView } from "@/components/analyze/upload-view";
import { computeFormScore } from "@/lib/scoring/score-engine";
import { toast } from "sonner";

/**
 * Analyze Page – Main experience: select exercise, camera/upload, record, analyze
 */
export default function AnalyzePage() {
    const [exerciseType, setExerciseType] = useState("");
    const [processing, setProcessing] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleRecordingComplete = useCallback(
        async (blob: Blob, jointData: Record<string, unknown>) => {
            if (!exerciseType) {
                toast.error("Please select an exercise first");
                return;
            }

            setProcessing(true);

            try {
                // 1. Check usage limits
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error("Not authenticated");

                const { data: profile } = await supabase
                    .from("profiles")
                    .select("free_analyses_used, is_pro, free_analyses_reset_at")
                    .eq("id", user.id)
                    .single();

                if (!profile) throw new Error("Profile not found");

                // Check if needs reset (monthly)
                const now = new Date();
                const resetAt = new Date(profile.free_analyses_reset_at);
                if (now > resetAt) {
                    await supabase
                        .from("profiles")
                        .update({
                            free_analyses_used: 0,
                            free_analyses_reset_at: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString(),
                        })
                        .eq("id", user.id);
                    profile.free_analyses_used = 0;
                }

                // Check limit
                if (!profile.is_pro && profile.free_analyses_used >= 5) {
                    toast.error("You've used all 5 free analyses this month. Upgrade to Pro for unlimited!");
                    router.push("/pricing");
                    return;
                }

                // 2. Compute score from joint data
                const { score, tips } = computeFormScore(jointData as Record<string, { angle: number; ideal: [number, number]; deviation: number; tip: string; weight: number }>);

                // 3. Upload thumbnail (first frame as screenshot) and actual video
                let thumbnailUrl = null;
                let originalVideoUrl = null;
                try {
                    // Upload the actual raw video clip
                    const videoPath = `${user.id}/videos/${Date.now()}.webm`;
                    await supabase.storage.from("formgod").upload(videoPath, blob);
                    const { data: videoPublicUrl } = supabase.storage.from("formgod").getPublicUrl(videoPath);
                    originalVideoUrl = videoPublicUrl.publicUrl;

                    // Create a video element to extract first frame
                    const tempVideo = document.createElement("video");
                    tempVideo.src = URL.createObjectURL(blob);
                    await new Promise<void>((resolve) => {
                        tempVideo.onloadeddata = () => resolve();
                    });

                    const tempCanvas = document.createElement("canvas");
                    tempCanvas.width = tempVideo.videoWidth || 360;
                    tempCanvas.height = tempVideo.videoHeight || 640;
                    const ctx = tempCanvas.getContext("2d");
                    if (ctx) {
                        ctx.drawImage(tempVideo, 0, 0, tempCanvas.width, tempCanvas.height);
                        const thumbnailBlob = await new Promise<Blob>((resolve) =>
                            tempCanvas.toBlob((b) => resolve(b!), "image/jpeg", 0.7)
                        );

                        const thumbnailPath = `${user.id}/thumbnails/${Date.now()}.jpg`;
                        await supabase.storage.from("formgod").upload(thumbnailPath, thumbnailBlob);
                        const { data: publicUrl } = supabase.storage.from("formgod").getPublicUrl(thumbnailPath);
                        thumbnailUrl = publicUrl.publicUrl;
                    }
                } catch (err) {
                    console.warn("Media upload failed, continuing without:", err);
                }

                // 4. Call analysis API for AI-enhanced tips
                let enhancedTips = tips;
                try {
                    const res = await fetch("/api/analyze", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            exerciseType,
                            jointData,
                            score,
                            tips,
                        }),
                    });
                    if (res.ok) {
                        const data = await res.json();
                        if (data.tips) enhancedTips = data.tips;
                    }
                } catch {
                    // Replicate fallback failed, use local tips
                    console.warn("AI enhancement unavailable, using local analysis");
                }

                // 5. Save analysis to Supabase
                const { data: analysis, error } = await supabase
                    .from("analyses")
                    .insert({
                        user_id: user.id,
                        exercise_type: exerciseType,
                        score,
                        joint_data: jointData,
                        tips: enhancedTips,
                        thumbnail_url: thumbnailUrl,
                        reel_url: originalVideoUrl, // Store the raw video here so we can composite it later
                    })
                    .select()
                    .single();

                if (error) throw error;

                // 6. Increment usage counter
                await supabase
                    .from("profiles")
                    .update({ free_analyses_used: profile.free_analyses_used + 1 })
                    .eq("id", user.id);

                toast.success(`Form score: ${score}/100`);
                router.push(`/results/${analysis.id}`);
            } catch (err) {
                console.error("Analysis error:", err);
                toast.error(err instanceof Error ? err.message : "Analysis failed");
            } finally {
                setProcessing(false);
            }
        },
        [exerciseType, router, supabase]
    );

    return (
        <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold">
                    Analyze Your <span className="gradient-lime-text">Form</span>
                </h1>
                <p className="mt-2 text-muted-foreground">
                    Select an exercise, then record or upload a video
                </p>
            </div>

            {/* Exercise selector */}
            <div className="mb-6 flex justify-center">
                <ExerciseSelector value={exerciseType} onChange={setExerciseType} />
            </div>

            {!exerciseType && (
                <div className="rounded-xl border border-border/50 bg-card/30 py-12 text-center text-muted-foreground">
                    <span className="text-3xl">👆</span>
                    <p className="mt-3">Select an exercise above to get started</p>
                </div>
            )}

            {exerciseType && (
                <Tabs defaultValue="camera" className="mt-6">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="camera">📹 Camera</TabsTrigger>
                        <TabsTrigger value="upload">📤 Upload</TabsTrigger>
                    </TabsList>

                    <TabsContent value="camera" className="mt-4">
                        <CameraView
                            exerciseType={exerciseType}
                            onRecordingComplete={handleRecordingComplete}
                        />
                    </TabsContent>

                    <TabsContent value="upload" className="mt-4">
                        <UploadView
                            exerciseType={exerciseType}
                            onAnalysisComplete={handleRecordingComplete}
                        />
                    </TabsContent>
                </Tabs>
            )}

            {processing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-8">
                        <div className="h-12 w-12 animate-spin rounded-full border-4 border-muted border-t-primary" />
                        <p className="font-semibold">Analyzing your form...</p>
                        <p className="text-sm text-muted-foreground">This takes a few seconds</p>
                    </div>
                </div>
            )}
        </div>
    );
}
