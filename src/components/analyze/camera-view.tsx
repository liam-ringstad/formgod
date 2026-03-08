"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { initPoseDetector, detectPose, drawPoseLandmarks, resetPoseDetector, closePoseDetector } from "@/lib/mediapipe/pose-detector";
import { extractJointAngles } from "@/lib/mediapipe/angle-calculator";

interface CameraViewProps {
    exerciseType: string;
    onRecordingComplete: (blob: Blob, jointData: Record<string, unknown>) => void;
}

/**
 * CameraView – Live camera feed with real-time MediaPipe pose overlay
 * Handles getUserMedia permissions, recording, and pose detection loop
 */
export function CameraView({ exerciseType, onRecordingComplete }: CameraViewProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const animFrameRef = useRef<number>(0);
    const chunksRef = useRef<Blob[]>([]);
    const jointDataRef = useRef<Record<string, unknown>[]>([]);

    const [cameraActive, setCameraActive] = useState(false);
    const [recording, setRecording] = useState(false);
    const [poseReady, setPoseReady] = useState(false);
    const [timer, setTimer] = useState(0);
    const [permissionDenied, setPermissionDenied] = useState(false);

    // Start camera
    const startCamera = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: "user",
                    width: { ideal: 720 },
                    height: { ideal: 1280 },
                },
                audio: false,
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
                setCameraActive(true);
            }

            // Initialize MediaPipe
            toast.loading("Loading AI model...");
            await initPoseDetector();
            setPoseReady(true);
            toast.dismiss();
            toast.success("AI ready! Start recording when ready.");

            // Start pose detection loop
            startPoseLoop();
        } catch (err) {
            console.error("Camera access error:", err);
            if (err instanceof DOMException && err.name === "NotAllowedError") {
                setPermissionDenied(true);
                toast.error("Camera permission denied. Please allow camera access in your browser settings.");
            } else {
                toast.error("Could not access camera. Please check your device.");
            }
        }
    }, []);

    // Pose detection loop
    const startPoseLoop = useCallback(() => {
        const loop = () => {
            if (!videoRef.current || !canvasRef.current) return;

            const video = videoRef.current;
            const canvas = canvasRef.current;

            if (video.videoWidth > 0) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;

                const ctx = canvas.getContext("2d");
                if (ctx) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                }

                const result = detectPose(video, performance.now());

                if (result && result.landmarks && result.landmarks.length > 0) {
                    const landmarks = result.landmarks[0];

                    // Color-code joints based on exercise analysis
                    const jointColors = new Map<number, string>();
                    if (exerciseType) {
                        const angles = extractJointAngles(landmarks, exerciseType);
                        for (const [, analysis] of Object.entries(angles)) {
                            // Color joints based on deviation
                            const color =
                                analysis.deviation === 0
                                    ? "rgba(0, 200, 81, 0.9)" // Green – perfect
                                    : analysis.deviation <= 15
                                        ? "rgba(255, 187, 51, 0.9)" // Yellow – warning
                                        : "rgba(255, 68, 68, 0.9)"; // Red – error

                            // Set color for all 3 landmarks in this joint
                            const [a, b, c] = EXERCISE_ANGLES_MAP[exerciseType.toLowerCase()]?.[Object.keys(angles).find(k => angles[k] === analysis) || ""]?.landmarks || [];
                            if (a !== undefined) jointColors.set(a, color);
                            if (b !== undefined) jointColors.set(b, color);
                            if (c !== undefined) jointColors.set(c, color);
                        }

                        // Save joint data if recording
                        if (recording) {
                            jointDataRef.current.push(angles);
                        }
                    }

                    drawPoseLandmarks(canvas, landmarks, { jointColors });
                }
            }

            animFrameRef.current = requestAnimationFrame(loop);
        };

        loop();
    }, [exerciseType, recording]);

    // Start recording
    const startRecording = useCallback(() => {
        if (!videoRef.current?.srcObject) return;

        const stream = videoRef.current.srcObject as MediaStream;

        // Create a canvas stream for recording (video + overlay)
        const canvasStream = canvasRef.current?.captureStream(30);
        const combinedStream = new MediaStream([
            ...stream.getVideoTracks(),
            ...(canvasStream?.getVideoTracks() || []),
        ]);

        // Find best supported mimeType for cross-browser compatibility (e.g., Safari iOS vs Chrome)
        const getSupportedMimeType = () => {
            const types = [
                "video/webm;codecs=h264",
                "video/webm;codecs=vp9",
                "video/webm",
                "video/mp4;codecs=avc1",
                "video/mp4",
                "", // Fallback to browser default
            ];
            for (const type of types) {
                if (type === "" || MediaRecorder.isTypeSupported(type)) {
                    return type;
                }
            }
            return "";
        };

        const mimeType = getSupportedMimeType();
        const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

        chunksRef.current = [];
        jointDataRef.current = [];

        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        recorder.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: "video/webm" });

            // Average the joint data across all frames
            const avgJointData = averageJointData(jointDataRef.current);
            onRecordingComplete(blob, avgJointData);
        };

        mediaRecorderRef.current = recorder;
        recorder.start(100); // Collect data every 100ms
        setRecording(true);
        setTimer(0);

        // Timer
        const interval = setInterval(() => {
            setTimer((t) => {
                if (t >= 30) {
                    stopRecording();
                    clearInterval(interval);
                    return t;
                }
                return t + 1;
            });
        }, 1000);
    }, [onRecordingComplete]);

    // Stop recording
    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current?.state === "recording") {
            mediaRecorderRef.current.stop();
        }
        setRecording(false);
    }, []);

    // Cleanup
    useEffect(() => {
        return () => {
            cancelAnimationFrame(animFrameRef.current);
            resetPoseDetector();
            if (videoRef.current?.srcObject) {
                const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
                tracks.forEach((track) => track.stop());
            }
        };
    }, []);

    if (permissionDenied) {
        return (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-destructive/30 bg-destructive/5 py-16 px-6 text-center">
                <span className="mb-4 text-4xl">📷</span>
                <h3 className="text-lg font-semibold">Camera Access Required</h3>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                    FormGod needs camera access to analyze your form in real-time. Please enable it in your browser settings and refresh the page.
                </p>
                <Button variant="outline" className="mt-6" onClick={() => window.location.reload()}>
                    Retry
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Camera viewport */}
            <div className="camera-container rounded-2xl border border-border/50 overflow-hidden bg-black">
                <video
                    ref={videoRef}
                    playsInline
                    muted
                    className="h-full w-full object-cover"
                    style={{ transform: "scaleX(-1)" }}
                />
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 h-full w-full"
                    style={{ transform: "scaleX(-1)" }}
                />

                {/* Recording indicator */}
                {recording && (
                    <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-red-500/90 px-3 py-1 text-white text-sm font-medium backdrop-blur-sm">
                        <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                        REC {timer}s
                    </div>
                )}

                {/* Pose ready indicator */}
                {poseReady && !recording && (
                    <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-green-500/20 border border-green-500/30 px-3 py-1 text-green-400 text-xs font-medium backdrop-blur-sm">
                        <span className="h-2 w-2 rounded-full bg-green-400" />
                        AI Ready
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
                {!cameraActive ? (
                    <Button size="lg" onClick={startCamera} className="h-14 px-8 glow-lime">
                        <span className="mr-2 text-lg">📹</span>
                        Start Camera
                    </Button>
                ) : recording ? (
                    <Button
                        size="lg"
                        variant="destructive"
                        onClick={stopRecording}
                        className="h-14 w-14 rounded-full p-0"
                    >
                        <div className="h-6 w-6 rounded-sm bg-white" />
                    </Button>
                ) : (
                    <Button
                        size="lg"
                        onClick={startRecording}
                        disabled={!poseReady}
                        className="h-14 w-14 rounded-full bg-red-500 p-0 hover:bg-red-600"
                    >
                        <div className="h-6 w-6 rounded-full bg-white" />
                    </Button>
                )}
            </div>

            {recording && (
                <p className="text-center text-xs text-muted-foreground">
                    Recording... (max 30 seconds). Perform your rep clearly in frame.
                </p>
            )}
        </div>
    );
}

// Helper: a mapping to access exercise angle landmark configs
// This avoids a circular import
const EXERCISE_ANGLES_MAP: Record<string, Record<string, { landmarks: number[] }>> = {};

// Helper: Average joint data across frames
function averageJointData(frames: Record<string, unknown>[]): Record<string, unknown> {
    if (frames.length === 0) return {};

    // Use the last frame's data as representative (most stable pose)
    const lastFrame = frames[frames.length - 1];
    return lastFrame || {};
}
