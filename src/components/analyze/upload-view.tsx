"use client";

import { useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { initPoseDetector, detectPose, drawPoseLandmarks, resetPoseDetector } from "@/lib/mediapipe/pose-detector";
import { extractJointAngles } from "@/lib/mediapipe/angle-calculator";

interface UploadViewProps {
    exerciseType: string;
    onAnalysisComplete: (blob: Blob, jointData: Record<string, unknown>) => void;
}

/**
 * UploadView – Upload a recorded video clip for pose analysis
 * Processes video frame-by-frame with MediaPipe overlay
 */
export function UploadView({ exerciseType, onAnalysisComplete }: UploadViewProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoUrl, setVideoUrl] = useState<string>("");
    const [analyzing, setAnalyzing] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file size (50MB max)
        if (file.size > 50 * 1024 * 1024) {
            toast.error("Video must be under 50MB");
            return;
        }

        // Validate file type
        if (!file.type.startsWith("video/")) {
            toast.error("Please select a video file");
            return;
        }

        setVideoFile(file);
        const url = URL.createObjectURL(file);
        setVideoUrl(url);
    }, []);

    const analyzeVideo = useCallback(async () => {
        if (!videoRef.current || !videoFile) return;

        setAnalyzing(true);
        setProgress(0);

        try {
            toast.loading("Loading AI model...");
            await initPoseDetector();
            toast.dismiss();

            const video = videoRef.current;
            const canvas = canvasRef.current!;

            // Wait for video metadata
            await new Promise<void>((resolve) => {
                if (video.readyState >= 2) resolve();
                else video.onloadeddata = () => resolve();
            });

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            // Sample frames throughout the video
            const duration = video.duration;
            const frameCount = Math.min(30, Math.floor(duration * 10)); // ~10fps sampling
            const allJointData: Record<string, unknown>[] = [];

            for (let i = 0; i < frameCount; i++) {
                const time = (i / frameCount) * duration;
                video.currentTime = time;

                await new Promise<void>((resolve) => {
                    video.onseeked = () => resolve();
                });

                const result = detectPose(video, time * 1000);

                if (result?.landmarks?.[0]) {
                    const landmarks = result.landmarks[0];
                    const ctx = canvas.getContext("2d");
                    if (ctx) {
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                    }
                    drawPoseLandmarks(canvas, landmarks);

                    if (exerciseType) {
                        const angles = extractJointAngles(landmarks, exerciseType);
                        allJointData.push(angles);
                    }
                }

                setProgress(Math.round(((i + 1) / frameCount) * 100));
            }

            // Use the middle-frame data as representative (peak of movement)
            const midFrame = allJointData[Math.floor(allJointData.length / 2)] || {};

            // Create blob from the original file
            const blob = new Blob([videoFile], { type: videoFile.type });
            onAnalysisComplete(blob, midFrame);

            resetPoseDetector();
            toast.success("Analysis complete!");
        } catch (err) {
            console.error("Analysis error:", err);
            toast.error("Failed to analyze video. Please try again.");
        } finally {
            setAnalyzing(false);
        }
    }, [videoFile, exerciseType, onAnalysisComplete]);

    return (
        <div className="space-y-4">
            {/* Upload area */}
            {!videoUrl ? (
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/50 bg-card/30 py-16 transition-colors hover:border-primary/40 hover:bg-card/50"
                >
                    <span className="mb-4 text-4xl">📤</span>
                    <h3 className="text-lg font-semibold">Upload a Video</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                        MP4, WebM, or MOV · Max 50MB · 10-30 seconds
                    </p>
                    <Button variant="outline" className="mt-6">
                        Choose File
                    </Button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="video/*"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Video preview */}
                    <div className="relative rounded-2xl border border-border/50 overflow-hidden bg-black">
                        <video
                            ref={videoRef}
                            src={videoUrl}
                            controls
                            playsInline
                            className="w-full max-h-[60vh] object-contain"
                        />
                        <canvas
                            ref={canvasRef}
                            className="absolute inset-0 h-full w-full pointer-events-none"
                        />
                    </div>

                    {/* Analyze button */}
                    <div className="flex items-center justify-center gap-4">
                        {!analyzing ? (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setVideoFile(null);
                                        setVideoUrl("");
                                    }}
                                >
                                    Choose Different Video
                                </Button>
                                <Button
                                    size="lg"
                                    className="glow-lime"
                                    onClick={analyzeVideo}
                                    disabled={!exerciseType}
                                >
                                    <span className="mr-2">🤖</span>
                                    Analyze Form
                                </Button>
                            </>
                        ) : (
                            <div className="flex flex-col items-center gap-2">
                                <div className="h-2 w-48 overflow-hidden rounded-full bg-muted">
                                    <div
                                        className="h-full rounded-full gradient-lime transition-all duration-300"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Analyzing... {progress}%
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
