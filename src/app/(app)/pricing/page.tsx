"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

/**
 * Pricing Page – Free vs Pro comparison with checkout integration
 */
export default function PricingPage() {
    const [loading, setLoading] = useState(false);
    const [referralCode, setReferralCode] = useState("");
    const supabase = createClient();

    const handleCheckout = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/stripe/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });

            if (!res.ok) throw new Error("Failed to create checkout");

            const { url } = await res.json();
            if (url) {
                window.location.href = url;
            }
        } catch (err) {
            toast.error("Failed to start checkout. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleReferral = async () => {
        if (!referralCode.trim()) return;

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Look up the referral code
            const { data: referrer } = await supabase
                .from("profiles")
                .select("id, referral_code")
                .eq("referral_code", referralCode.toUpperCase())
                .single();

            if (!referrer) {
                toast.error("Invalid referral code");
                return;
            }

            if (referrer.id === user.id) {
                toast.error("You can't use your own referral code");
                return;
            }

            // Create referral record
            const { error } = await supabase.from("referrals").insert({
                referrer_id: referrer.id,
                referred_id: user.id,
            });

            if (error) {
                if (error.code === "23505") {
                    toast.error("You've already used a referral code");
                } else {
                    throw error;
                }
                return;
            }

            toast.success("Referral applied! You'll both get 1 free month when you subscribe.");
        } catch (err) {
            toast.error("Failed to apply referral code");
        }
    };

    return (
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
            {/* Header */}
            <div className="mb-12 text-center">
                <h1 className="text-4xl font-bold sm:text-5xl">
                    Simple <span className="gradient-lime-text">Pricing</span>
                </h1>
                <p className="mt-3 text-lg text-muted-foreground">
                    Start free. Upgrade when you need unlimited analyses.
                </p>
            </div>

            {/* Pricing Cards */}
            <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
                {/* Free */}
                <div className="rounded-2xl border border-border/50 bg-card p-8">
                    <h3 className="text-xl font-bold">Free</h3>
                    <div className="mt-4 text-5xl font-black">$0</div>
                    <p className="mt-2 text-sm text-muted-foreground">forever free</p>

                    <ul className="mt-8 space-y-4">
                        {[
                            "5 analyses per month",
                            "Real-time pose overlay",
                            "Form score (0-100)",
                            "Basic coaching tips",
                            "Video reel export",
                        ].map((feature) => (
                            <li key={feature} className="flex items-center gap-3 text-sm">
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500/20 text-green-400 text-xs">
                                    ✓
                                </span>
                                {feature}
                            </li>
                        ))}
                    </ul>

                    <Button variant="outline" className="mt-8 w-full" disabled>
                        Current Plan
                    </Button>
                </div>

                {/* Pro */}
                <div className="relative rounded-2xl border-2 border-primary/50 bg-card p-8 glow-lime-sm">
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-5 py-1 text-sm font-bold text-primary-foreground">
                        MOST POPULAR
                    </div>
                    <h3 className="text-xl font-bold">Pro</h3>
                    <div className="mt-4 text-5xl font-black">
                        $19
                        <span className="text-xl font-normal text-muted-foreground">/mo</span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">cancel anytime</p>

                    <ul className="mt-8 space-y-4">
                        {[
                            "Unlimited analyses",
                            "AI-enhanced coaching tips",
                            "Priority analysis speed",
                            "HD reel export with branding",
                            "Progress tracking & trends",
                            "Referral reward program",
                        ].map((feature) => (
                            <li key={feature} className="flex items-center gap-3 text-sm">
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-primary text-xs">
                                    ✓
                                </span>
                                {feature}
                            </li>
                        ))}
                    </ul>

                    <Button
                        className="mt-8 w-full glow-lime"
                        size="lg"
                        onClick={handleCheckout}
                        disabled={loading}
                    >
                        {loading ? "Loading..." : "Upgrade to Pro →"}
                    </Button>
                </div>
            </div>

            {/* Referral Section */}
            <div className="mx-auto mt-16 max-w-lg rounded-2xl border border-border/50 bg-card p-8 text-center">
                <h3 className="text-xl font-bold">Have a Referral Code?</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                    Enter a friend&apos;s code to get 1 free month of Pro when you subscribe
                </p>
                <div className="mt-6 flex gap-3">
                    <Input
                        placeholder="Enter referral code"
                        value={referralCode}
                        onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                        className="text-center font-mono"
                    />
                    <Button variant="outline" onClick={handleReferral}>
                        Apply
                    </Button>
                </div>
            </div>
        </div>
    );
}
