/**
 * MediaPipe Pose Detector – Initializes PoseLandmarker for real-time pose estimation
 * Uses the MediaPipe Vision Tasks API (WASM-based, runs entirely in browser)
 */
import { PoseLandmarker, FilesetResolver, DrawingUtils } from "@mediapipe/tasks-vision";

let poseLandmarker: PoseLandmarker | null = null;
let lastVideoTime = -1;

/**
 * Initialize the MediaPipe PoseLandmarker
 * Must be called once before detecting poses
 */
export async function initPoseDetector(): Promise<PoseLandmarker> {
    if (poseLandmarker) return poseLandmarker;

    const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );

    poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath:
                "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
            delegate: "GPU",
        },
        runningMode: "VIDEO",
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
    });

    return poseLandmarker;
}

/**
 * Detect pose from a video frame
 * Returns pose landmarks array or null
 */
export function detectPose(video: HTMLVideoElement, timestamp: number) {
    if (!poseLandmarker) return null;
    if (timestamp === lastVideoTime) return null;
    lastVideoTime = timestamp;

    try {
        const result = poseLandmarker.detectForVideo(video, timestamp);
        return result;
    } catch {
        return null;
    }
}

/**
 * Draw pose landmarks and connections on a canvas
 */
export function drawPoseLandmarks(
    canvas: HTMLCanvasElement,
    landmarks: Array<{ x: number; y: number; z: number; visibility?: number }>,
    options?: {
        jointColors?: Map<number, string>;
    }
) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const drawingUtils = new DrawingUtils(ctx);

    // Draw connections (skeleton lines)
    drawingUtils.drawConnectors(landmarks as any, PoseLandmarker.POSE_CONNECTIONS, {
        color: "rgba(181, 255, 43, 0.4)",
        lineWidth: 2,
    });

    // Draw landmarks (joints)
    landmarks.forEach((landmark, index) => {
        const color = options?.jointColors?.get(index) || "rgba(181, 255, 43, 0.8)";
        const x = landmark.x * canvas.width;
        const y = landmark.y * canvas.height;
        const radius = 4;

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
        ctx.lineWidth = 1;
        ctx.stroke();
    });
}

/**
 * Reset the pose detector (call when switching videos or on cleanup)
 */
export function resetPoseDetector() {
    lastVideoTime = -1;
}

/**
 * Cleanup: close the pose detector and free resources
 */
export async function closePoseDetector() {
    if (poseLandmarker) {
        poseLandmarker.close();
        poseLandmarker = null;
    }
    lastVideoTime = -1;
}

// MediaPipe Pose Landmark indices for reference
export const POSE_LANDMARKS = {
    NOSE: 0,
    LEFT_EYE_INNER: 1,
    LEFT_EYE: 2,
    LEFT_EYE_OUTER: 3,
    RIGHT_EYE_INNER: 4,
    RIGHT_EYE: 5,
    RIGHT_EYE_OUTER: 6,
    LEFT_EAR: 7,
    RIGHT_EAR: 8,
    MOUTH_LEFT: 9,
    MOUTH_RIGHT: 10,
    LEFT_SHOULDER: 11,
    RIGHT_SHOULDER: 12,
    LEFT_ELBOW: 13,
    RIGHT_ELBOW: 14,
    LEFT_WRIST: 15,
    RIGHT_WRIST: 16,
    LEFT_PINKY: 17,
    RIGHT_PINKY: 18,
    LEFT_INDEX: 19,
    RIGHT_INDEX: 20,
    LEFT_THUMB: 21,
    RIGHT_THUMB: 22,
    LEFT_HIP: 23,
    RIGHT_HIP: 24,
    LEFT_KNEE: 25,
    RIGHT_KNEE: 26,
    LEFT_ANKLE: 27,
    RIGHT_ANKLE: 28,
    LEFT_HEEL: 29,
    RIGHT_HEEL: 30,
    LEFT_FOOT_INDEX: 31,
    RIGHT_FOOT_INDEX: 32,
} as const;
