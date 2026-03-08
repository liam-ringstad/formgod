"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ExportReelButtonProps {
    analysisId: string;
    score: number;
    exerciseType: string;
}

/**
 * ExportReelButton – One-click viral reel generation using FFmpeg.wasm
 * Creates 15s vertical MP4 with branding for TikTok/Reels
 */
export function ExportReelButton({ analysisId, score, exerciseType }: ExportReelButtonProps) {
    const [exporting, setExporting] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleExport = async () => {
        setExporting(true);
        setProgress(0);

        try {
            toast.loading("Loading video encoder...");

            // Dynamically import FFmpeg to avoid SSR issues
            const { FFmpeg } = await import("@ffmpeg/ffmpeg");
            const { fetchFile } = await import("@ffmpeg/util");

            const ffmpeg = new FFmpeg();

            ffmpeg.on("progress", ({ progress: p }) => {
                setProgress(Math.round(p * 100));
            });

            await ffmpeg.load();
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

            // Convert canvas to image
            const overlayBlob = await new Promise<Blob>((resolve) =>
                canvas.toBlob((b) => resolve(b!), "image/png")
            );
            const overlayData = await fetchFile(overlayBlob);
            await ffmpeg.writeFile("overlay.png", overlayData);

            // Create a 15-second video from the static overlay
            await ffmpeg.exec([
                "-loop", "1",
                "-i", "overlay.png",
                "-c:v", "libx264",
                "-t", "15",
                "-pix_fmt", "yuv420p",
                "-vf", "scale=1080:1920",
                "-preset", "ultrafast",
                "-y", "output.mp4",
            ]);

            // Read the output
            const data = await ffmpeg.readFile("output.mp4");
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
