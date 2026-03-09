"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ExportReelButtonProps {
    analysisId: string;
    score: number;
    exerciseType: string;
    videoUrl?: string | null;
}

/**
 * ExportReelButton – One-click viral reel generation using FFmpeg.wasm
 * Creates 15s vertical MP4 with branding for TikTok/Reels
 */
export function ExportReelButton({ analysisId, score, exerciseType, videoUrl }: ExportReelButtonProps) {
    const [exporting, setExporting] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleExport = async () => {
        setExporting(true);
        setProgress(0);

        try {
            toast.loading("Loading video encoder...");

            // Dynamically import FFmpeg to avoid SSR issues
            const { FFmpeg } = await import("@ffmpeg/ffmpeg");
            const { fetchFile, toBlobURL } = await import("@ffmpeg/util");

            const ffmpeg = new FFmpeg();

            ffmpeg.on("progress", ({ progress: p }) => {
                setProgress(Math.round(p * 100));
            });

            const logs: string[] = [];
            // Stream ffmpeg console logs for deep debugging via Vercel / browser console
            ffmpeg.on("log", ({ message }) => {
                logs.push(message);
                console.log("[FFmpeg]", message);
            });

            // Load explicit core paths to fix WASM and Cross-Origin errors on Vercel
            const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
            await ffmpeg.load({
                coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
                wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
            });
            toast.dismiss();

            // Create branded overlay image using canvas
            const canvas = document.createElement("canvas");
            canvas.width = 1080;
            canvas.height = 1920;
            const ctx = canvas.getContext("2d")!;

            // Background
            ctx.fillStyle = "#0a0a0f";
            ctx.fillRect(0, 0, 1080, 1920);

            // Score section
            const scoreColor = score >= 80 ? "#00c851" : score >= 60 ? "#8acc22" : score >= 40 ? "#ffbb33" : "#ff4444";

            // Title
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 72px Inter, sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("Fixed with FormGod AI", 540, 200);

            // Exercise type
            ctx.fillStyle = "#b5ff2b";
            ctx.font = "bold 48px Inter, sans-serif";
            ctx.fillText(exerciseType.toUpperCase(), 540, 300);

            // Score circle
            ctx.beginPath();
            ctx.arc(540, 960, 200, 0, 2 * Math.PI);
            ctx.strokeStyle = scoreColor;
            ctx.lineWidth = 16;
            ctx.stroke();

            ctx.fillStyle = scoreColor;
            ctx.font = "black 120px Inter, sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(String(score), 540, 940);

            ctx.fillStyle = "#888";
            ctx.font = "36px Inter, sans-serif";
            ctx.fillText("/100", 540, 1020);

            // Score label
            const label = score >= 80 ? "EXCELLENT FORM" : score >= 60 ? "GOOD FORM" : score >= 40 ? "NEEDS WORK" : "POOR FORM";
            ctx.fillStyle = scoreColor;
            ctx.font = "bold 42px Inter, sans-serif";
            ctx.fillText(label, 540, 1200);

            // Watermark
            ctx.fillStyle = "#666";
            ctx.font = "28px Inter, sans-serif";
            ctx.fillText("FormGod.ai – Fix your form instantly", 540, 1800);

            // Convert canvas to image correctly formatted for FFmpeg WASM
            const overlayBlob = await new Promise<Blob>((resolve) =>
                canvas.toBlob((b) => resolve(b!), "image/png")
            );
            const overlayArrayBuffer = await overlayBlob.arrayBuffer();
            await ffmpeg.writeFile("overlay.png", new Uint8Array(overlayArrayBuffer));

            let ffmpegArgs: string[] = [];

            if (videoUrl) {
                // Fetch the actual source video and composite overlay on top of it
                // We fetch manually to avoid strict CORS/fetchFile issues and ensure Uint8Array format
                // Add explicit mode: cors to fix Safari WebKitBlobResource error 1
                const videoRes = await fetch(videoUrl, {
                    method: 'GET',
                    mode: 'cors',
                    credentials: 'omit',
                });

                if (!videoRes.ok) {
                    throw new Error(`Failed to fetch video: ${videoRes.status} ${videoRes.statusText}`);
                }

                // Get dynamic extension to prevent FFmpeg container mismatch errors on Safari MP4s
                const ext = videoUrl.split('.').pop()?.split('?')[0] || 'webm';
                const inputName = `input-video.${ext}`;

                const videoArrayBuffer = await videoRes.arrayBuffer();
                await ffmpeg.writeFile(inputName, new Uint8Array(videoArrayBuffer));

                // Complex filter to scale/crop the input video to fill 1080x1920,
                // darken it slightly, then lay the static overlay over it
                ffmpegArgs = [
                    "-i", inputName,
                    "-loop", "1", "-t", "15", "-i", "overlay.png",
                    "-filter_complex", "[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,colorchannelmixer=r=0.6:g=0.6:b=0.6[bg];[bg][1:v]overlay=0:0:shortest=1",
                    "-c:v", "libx264",
                    "-preset", "ultrafast",
                    "-pix_fmt", "yuv420p",
                    "-y", "output.mp4"
                ];
            } else {
                // Fallback to static black background viral reel
                ffmpegArgs = [
                    "-loop", "1",
                    "-i", "overlay.png",
                    "-c:v", "libx264",
                    "-t", "15",
                    "-pix_fmt", "yuv420p",
                    "-vf", "scale=1080:1920",
                    "-preset", "ultrafast",
                    "-y", "output.mp4",
                ];
            }

            // Execute FFmpeg
            console.log("Starting FFmpeg Export with args:", ffmpegArgs);
            const exitCode = await ffmpeg.exec(ffmpegArgs);

            if (exitCode !== 0) {
                throw new Error(`FFmpeg execution failed with code ${exitCode}. Check console for details.`);
            }

            // Read the output
            let data: any;
            try {
                data = await ffmpeg.readFile("output.mp4");
            } catch (fsErr) {
                // If the file doesn't exist, FFmpeg failed right before here without exiting non-zero
                const recentLogs = logs.slice(-10).join(" | ");
                throw new Error(`FS Error: output.mp4 not created. FFmpeg exited 0 but failed. Last logs: ${recentLogs}`);
            }

            const mp4Blob = new Blob([data as any], { type: "video/mp4" });

            // Auto-download
            const url = URL.createObjectURL(mp4Blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `formgod-${exerciseType.replace(/\s+/g, "-")}-${score}.mp4`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast.success("Reel exported! Share it on TikTok/Reels 🚀");
        } catch (err) {
            console.error("Export error:", err);
            toast.error("Failed to export reel. Please try again.");
        } finally {
            setExporting(false);
            setProgress(0);
        }
    };

    return (
        <div>
            <Button
                onClick={handleExport}
                disabled={exporting}
                className="w-full glow-lime"
                size="lg"
            >
                {exporting ? (
                    <span className="flex items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted border-t-primary-foreground" />
                        Exporting... {progress}%
                    </span>
                ) : (
                    <span className="flex items-center gap-2">
                        <span>🎬</span>
                        Export Viral Reel
                    </span>
                )}
            </Button>
            <p className="mt-2 text-center text-xs text-muted-foreground">
                15s vertical MP4 · Optimized for TikTok & Reels
            </p>
        </div>
    );
}
