"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { User } from "@supabase/supabase-js";

/**
 * Navbar – Responsive top navigation with mobile drawer
 */
export function Navbar() {
    const [open, setOpen] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            setLoading(false);
        };
        fetchUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user || null);
        });

        return () => subscription.unsubscribe();
    }, [supabase.auth]);

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            toast.error("Failed to log out");
        } else {
            toast.success("Logged out successfully");
            router.push("/");
            router.refresh();
        }
    };

    const navLinks = [
        { href: "/dashboard", label: "Dashboard" },
        { href: "/analyze", label: "Analyze" },
        { href: "/pricing", label: "Pricing" },
    ];

    return (
        <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
            <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-lime">
                        <span className="text-lg font-black text-black">F</span>
                    </div>
                    <span className="text-xl font-bold tracking-tight">
                        Form<span className="gradient-lime-text">God</span>
                    </span>
                </Link>

                {/* Desktop links */}
                <div className="hidden items-center gap-1 md:flex">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>

                {/* Desktop CTA */}
                <div className="hidden items-center gap-3 md:flex">
                    {!loading && (
                        user ? (
                            <Button variant="ghost" size="sm" onClick={handleLogout}>
                                Log out
                            </Button>
                        ) : (
                            <>
                                <Link href="/login">
                                    <Button variant="ghost" size="sm">
                                        Log in
                                    </Button>
                                </Link>
                                <Link href="/signup">
                                    <Button size="sm" className="glow-lime-sm">
                                        Get Started Free
                                    </Button>
                                </Link>
                            </>
                        )
                    )}
                </div>

                {/* Mobile hamburger */}
                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger
                        className="md:hidden"
                        render={<Button variant="ghost" size="icon" />}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="3" y1="6" x2="21" y2="6" />
                            <line x1="3" y1="12" x2="21" y2="12" />
                            <line x1="3" y1="18" x2="21" y2="18" />
                        </svg>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-72">
                        <div className="flex flex-col gap-4 pt-8">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setOpen(false)}
                                    className="rounded-md px-4 py-3 text-lg font-medium transition-colors hover:bg-accent"
                                >
                                    {link.label}
                                </Link>
                            ))}
                            <div className="border-t border-border pt-4">
                                {!loading && (
                                    user ? (
                                        <Button variant="ghost" className="w-full justify-start text-red-500" onClick={() => { setOpen(false); handleLogout(); }}>
                                            Log out
                                        </Button>
                                    ) : (
                                        <>
                                            <Link href="/login" onClick={() => setOpen(false)}>
                                                <Button variant="ghost" className="w-full justify-start">
                                                    Log in
                                                </Button>
                                            </Link>
                                            <Link href="/signup" onClick={() => setOpen(false)}>
                                                <Button className="mt-2 w-full glow-lime-sm">
                                                    Get Started Free
                                                </Button>
                                            </Link>
                                        </>
                                    )
                                )}
                            </div>
                        </div>
                    </SheetContent>
                </Sheet>
            </nav>
        </header>
    );
}
