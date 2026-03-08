import Link from "next/link";

/**
 * Footer – Minimal branding footer
 */
export function Footer() {
    return (
        <footer className="border-t border-border/50">
            <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
                <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md gradient-lime">
                        <span className="text-sm font-black text-black">F</span>
                    </div>
                    <span className="text-sm font-semibold">
                        Form<span className="gradient-lime-text">God</span> AI
                    </span>
                </div>

                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <Link href="/pricing" className="hover:text-foreground transition-colors">
                        Pricing
                    </Link>
                    <Link href="#" className="hover:text-foreground transition-colors">
                        Privacy
                    </Link>
                    <Link href="#" className="hover:text-foreground transition-colors">
                        Terms
                    </Link>
                </div>

                <p className="text-xs text-muted-foreground">
                    © {new Date().getFullYear()} FormGod AI. All rights reserved.
                </p>
            </div>
        </footer>
    );
}
