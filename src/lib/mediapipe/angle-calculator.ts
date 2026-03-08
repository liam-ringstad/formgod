/**
 * Angle Calculator – Computes joint angles from MediaPipe landmarks
 * Used to score exercise form by comparing actual angles to ideal ranges
 */

import { POSE_LANDMARKS } from "./pose-detector";

interface Landmark {
    x: number;
    y: number;
    z: number;
    visibility?: number;
}

/**
 * Calculate angle between three points (in degrees)
 * The angle is at point B (the middle point)
 */
export function calculateAngle(a: Landmark, b: Landmark, c: Landmark): number {
    const radians =
        Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs((radians * 180.0) / Math.PI);
    if (angle > 180) angle = 360 - angle;
    return angle;
}

/**
 * Ideal angle ranges per exercise type
 * Format: { jointName: [minAngle, maxAngle, weight] }
 * Weight determines how much this joint affects the overall score
 */
export const EXERCISE_ANGLES: Record<
    string,
    Record<string, { landmarks: [number, number, number]; ideal: [number, number]; weight: number; tip: string }>
> = {
    squat: {
        knee_angle: {
            landmarks: [POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.LEFT_KNEE, POSE_LANDMARKS.LEFT_ANKLE],
            ideal: [70, 100],
            weight: 3,
            tip: "Keep knees tracking over toes, aim for 90° at bottom",
        },
        hip_angle: {
            landmarks: [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.LEFT_KNEE],
            ideal: [60, 100],
            weight: 3,
            tip: "Hinge at hips more – chest should stay up",
        },
        back_angle: {
            landmarks: [POSE_LANDMARKS.LEFT_EAR, POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_HIP],
            ideal: [160, 180],
            weight: 2,
            tip: "Keep your spine neutral – avoid rounding your back",
        },
        ankle_angle: {
            landmarks: [POSE_LANDMARKS.LEFT_KNEE, POSE_LANDMARKS.LEFT_ANKLE, POSE_LANDMARKS.LEFT_FOOT_INDEX],
            ideal: [70, 90],
            weight: 1,
            tip: "Work on ankle mobility for deeper squats",
        },
    },
    "bench press": {
        elbow_angle: {
            landmarks: [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_ELBOW, POSE_LANDMARKS.LEFT_WRIST],
            ideal: [75, 100],
            weight: 3,
            tip: "Keep elbows at 45-75° angle from torso, not flared out",
        },
        shoulder_angle: {
            landmarks: [POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_ELBOW],
            ideal: [60, 80],
            weight: 2,
            tip: "Tuck shoulders – retract and depress your scapula",
        },
        wrist_alignment: {
            landmarks: [POSE_LANDMARKS.LEFT_ELBOW, POSE_LANDMARKS.LEFT_WRIST, POSE_LANDMARKS.LEFT_INDEX],
            ideal: [160, 180],
            weight: 2,
            tip: "Keep wrists straight – don't let them bend backward",
        },
    },
    deadlift: {
        hip_hinge: {
            landmarks: [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.LEFT_KNEE],
            ideal: [80, 120],
            weight: 3,
            tip: "Push hips back more – this should be a hip-dominant movement",
        },
        back_angle: {
            landmarks: [POSE_LANDMARKS.LEFT_EAR, POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_HIP],
            ideal: [165, 180],
            weight: 3,
            tip: "Keep your back flat – neutral spine is critical for deadlifts",
        },
        knee_angle: {
            landmarks: [POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.LEFT_KNEE, POSE_LANDMARKS.LEFT_ANKLE],
            ideal: [140, 170],
            weight: 2,
            tip: "Slight knee bend only – don't squat the deadlift",
        },
        shin_angle: {
            landmarks: [POSE_LANDMARKS.LEFT_KNEE, POSE_LANDMARKS.LEFT_ANKLE, POSE_LANDMARKS.LEFT_HEEL],
            ideal: [80, 95],
            weight: 1,
            tip: "Keep shins more vertical – bar should stay close to legs",
        },
    },
    "overhead press": {
        elbow_lockout: {
            landmarks: [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_ELBOW, POSE_LANDMARKS.LEFT_WRIST],
            ideal: [160, 180],
            weight: 3,
            tip: "Full lockout at the top – extend arms completely overhead",
        },
        shoulder_alignment: {
            landmarks: [POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_ELBOW],
            ideal: [160, 180],
            weight: 2,
            tip: "Press directly overhead – don't push the bar forward",
        },
        back_arch: {
            landmarks: [POSE_LANDMARKS.LEFT_EAR, POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_HIP],
            ideal: [165, 180],
            weight: 2,
            tip: "Brace your core – avoid excessive back arch",
        },
    },
    "barbell row": {
        hip_angle: {
            landmarks: [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.LEFT_KNEE],
            ideal: [70, 100],
            weight: 2,
            tip: "Hinge forward more at the hips – about 45° torso angle",
        },
        back_angle: {
            landmarks: [POSE_LANDMARKS.LEFT_EAR, POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_HIP],
            ideal: [165, 180],
            weight: 3,
            tip: "Keep back flat – don't round your upper back",
        },
        elbow_angle: {
            landmarks: [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_ELBOW, POSE_LANDMARKS.LEFT_WRIST],
            ideal: [40, 80],
            weight: 2,
            tip: "Pull elbows to hip level – squeeze your shoulder blades",
        },
    },
    "pull-up": {
        elbow_flexion: {
            landmarks: [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_ELBOW, POSE_LANDMARKS.LEFT_WRIST],
            ideal: [30, 60],
            weight: 3,
            tip: "Pull until chin clears the bar – full range of motion",
        },
        shoulder_engagement: {
            landmarks: [POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_ELBOW],
            ideal: [20, 50],
            weight: 2,
            tip: "Initiate with your lats – depress your shoulders first",
        },
    },
    lunge: {
        front_knee: {
            landmarks: [POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.LEFT_KNEE, POSE_LANDMARKS.LEFT_ANKLE],
            ideal: [80, 100],
            weight: 3,
            tip: "Front knee should be at 90° – don't let it go past your toes",
        },
        back_knee: {
            landmarks: [POSE_LANDMARKS.RIGHT_HIP, POSE_LANDMARKS.RIGHT_KNEE, POSE_LANDMARKS.RIGHT_ANKLE],
            ideal: [80, 100],
            weight: 2,
            tip: "Back knee should nearly touch the ground – full depth",
        },
        torso: {
            landmarks: [POSE_LANDMARKS.LEFT_EAR, POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_HIP],
            ideal: [165, 180],
            weight: 2,
            tip: "Keep torso upright – avoid leaning forward",
        },
    },
};

/**
 * Extract key joint angles for a given exercise from landmarks
 */
export function extractJointAngles(
    landmarks: Landmark[],
    exerciseType: string
): Record<string, { angle: number; ideal: [number, number]; deviation: number; tip: string; weight: number }> {
    const exerciseKey = exerciseType.toLowerCase();
    const config = EXERCISE_ANGLES[exerciseKey];
    if (!config) return {};

    const results: Record<string, { angle: number; ideal: [number, number]; deviation: number; tip: string; weight: number }> = {};

    for (const [name, joint] of Object.entries(config)) {
        const [a, b, c] = joint.landmarks;
        const angle = calculateAngle(landmarks[a], landmarks[b], landmarks[c]);

        // Calculate deviation from ideal range
        let deviation = 0;
        if (angle < joint.ideal[0]) {
            deviation = joint.ideal[0] - angle;
        } else if (angle > joint.ideal[1]) {
            deviation = angle - joint.ideal[1];
        }

        results[name] = {
            angle: Math.round(angle),
            ideal: joint.ideal,
            deviation: Math.round(deviation),
            tip: joint.tip,
            weight: joint.weight,
        };
    }

    return results;
}

/**
 * Get supported exercise types
 */
export function getSupportedExercises(): string[] {
    return Object.keys(EXERCISE_ANGLES).map(
        (key) => key.charAt(0).toUpperCase() + key.slice(1)
    );
}
