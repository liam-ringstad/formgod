"use client";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const EXERCISES = [
    { value: "squat", label: "Squat", emoji: "🦵" },
    { value: "bench press", label: "Bench Press", emoji: "🏋️" },
    { value: "deadlift", label: "Deadlift", emoji: "💪" },
    { value: "overhead press", label: "Overhead Press", emoji: "🙆" },
    { value: "barbell row", label: "Barbell Row", emoji: "🚣" },
    { value: "pull-up", label: "Pull-up", emoji: "🧗" },
    { value: "lunge", label: "Lunge", emoji: "🦿" },
];

interface ExerciseSelectorProps {
    value: string;
    onChange: (value: string) => void;
}

/**
 * Exercise Selector – Dropdown for selecting exercise type to analyze
 */
export function ExerciseSelector({ value, onChange }: ExerciseSelectorProps) {
    return (
        <Select value={value} onValueChange={(val) => onChange(val || "")}>
            <SelectTrigger className="w-full sm:w-64">
                <SelectValue placeholder="Select exercise..." />
            </SelectTrigger>
            <SelectContent>
                {EXERCISES.map((exercise) => (
                    <SelectItem key={exercise.value} value={exercise.value}>
                        <span className="flex items-center gap-2">
                            <span>{exercise.emoji}</span>
                            <span>{exercise.label}</span>
                        </span>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
