/**
 * FFmpeg Reel Generator – Creates branded 15s vertical MP4 for TikTok/Reels
 * Uses FFmpeg.wasm (client-side, no server needed)
 */

/**
 * Generate a branded reel from analysis data
 * @param score - Form score (0-100)
 * @param exerciseType - Exercise name
 * @returns Blob of the generated MP4 video
 */
export async function generateReel(
    score: number,
    exerciseType: string,
): Promise<Blob> {
    const { FFmpeg } = await import("@ffmpeg/ffmpeg");
    const { fetchFile } = await import("@ffmpeg/util");

    const ffmpeg = new FFmpeg();
    await ffmpeg.load();

    // Create branded overlay using Canvas API
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext("2d")!;

    // Dark background with subtle gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 1920);
    gradient.addColorStop(0, "#0a0a0f");
    gradient.addColorStop(0.5, "#0d0d15");
    gradient.addColorStop(1, "#0a0a0f");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1080, 1920);

    // Decorative elements
    ctx.beginPath();
    ctx.arc(540, 960, 250, 0, 2 * Math.PI);
    ctx.strokeStyle = "rgba(181, 255, 43, 0.1)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(540, 960, 300, 0, 2 * Math.PI);
    ctx.strokeStyle = "rgba(181, 255, 43, 0.05)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Title
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 56px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Fixed with", 540, 260);

    // Brand name with lime
    ctx.fillStyle = "#b5ff2b";
    ctx.font = "black 72px sans-serif";
    ctx.fillText("FormGod AI", 540, 350);

    // Exercise type
    ctx.fillStyle = "#888888";
    ctx.font = "32px sans-serif";
    ctx.fillText(exerciseType.toUpperCase(), 540, 440);

    // Score
    const scoreColor =
        score >= 80 ? "#00c851" : score >= 60 ? "#8acc22" : score >= 40 ? "#ffbb33" : "#ff4444";

    // Score circle background
    ctx.beginPath();
    ctx.arc(540, 960, 200, 0, 2 * Math.PI);
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.lineWidth = 12;
    ctx.stroke();

    // Score arc
    const progress = score / 100;
    ctx.beginPath();
    ctx.arc(540, 960, 200, -Math.PI / 2, -Math.PI / 2 + 2 * Math.PI * progress);
    ctx.strokeStyle = scoreColor;
    ctx.lineWidth = 12;
    ctx.lineCap = "round";
    ctx.stroke();

    // Score number
    ctx.fillStyle = scoreColor;
    ctx.font = "black 140px sans-serif";
    ctx.textBaseline = "middle";
    ctx.fillText(String(score), 540, 940);

    ctx.fillStyle = "#666666";
    ctx.font = "40px sans-serif";
    ctx.fillText("/100", 540, 1040);

    // Score label
    const label = score >= 80 ? "EXCELLENT" : score >= 60 ? "GOOD" : score >= 40 ? "NEEDS WORK" : "POOR";
    ctx.fillStyle = scoreColor;
    ctx.font = "bold 48px sans-serif";
    ctx.fillText(label, 540, 1260);

    // Watermark
    ctx.fillStyle = "#444444";
    ctx.font = "24px sans-serif";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("FormGod.ai – Fix your form instantly", 540, 1780);

    // Convert to image
    const blob = await new Promise<Blob>((resolve) =>
        canvas.toBlob((b) => resolve(b!), "image/png")
    );

    const imageData = await fetchFile(blob);
    await ffmpeg.writeFile("frame.png", imageData);

    // Generate 15s video from static frame
    await ffmpeg.exec([
        "-loop", "1",
        "-i", "frame.png",
        "-c:v", "libx264",
        "-t", "15",
        "-pix_fmt", "yuv420p",
        "-vf", "scale=1080:1920",
        "-preset", "ultrafast",
        "-crf", "23",
        "-y", "reel.mp4",
    ]);

    const output = await ffmpeg.readFile("reel.mp4");
    return new Blob([output as any], { type: "video/mp4" });
}
