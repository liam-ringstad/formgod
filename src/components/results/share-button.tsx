"use client";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function ShareButton({ url = window.location.href }: { url?: string }) {
    const handleShare = async () => {
        try {
            if (navigator.share) {
                await navigator.share({
                    title: 'FormGod AI Analysis',
                    text: 'Check out my workout form analysis!',
                    url: url,
                });
            } else {
                await navigator.clipboard.writeText(url);
                toast.success("Link copied to clipboard!");
            }
        } catch (err) {
            console.error("Error sharing:", err);
        }
    };

    return (
        <Button
            variant="outline"
            className="flex-1"
            onClick={handleShare}
        >
            📋 Share Results
        </Button>
    );
}
