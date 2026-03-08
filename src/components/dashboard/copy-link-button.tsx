"use client";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function CopyLinkButton({ code }: { code: string }) {
    const handleCopy = () => {
        navigator.clipboard.writeText(`${window.location.origin}/signup?ref=${code}`);
        toast.success("Referral link copied!");
    };

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="text-xs"
        >
            Copy Link
        </Button>
    );
}
