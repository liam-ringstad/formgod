import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

/**
 * Landing Page – Marketing hero with feature highlights and CTA
 */
export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          {/* Background effects */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-[#b5ff2b] opacity-[0.04] blur-[120px]" />
            <div className="absolute right-0 top-1/3 h-[300px] w-[400px] rounded-full bg-[#00e5ff] opacity-[0.03] blur-[100px]" />
          </div>

          <div className="mx-auto max-w-7xl px-4 pb-20 pt-24 sm:px-6 sm:pt-32 lg:pt-40">
            <div className="mx-auto max-w-3xl text-center">
              {/* Badge */}
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/50 px-4 py-1.5 text-sm backdrop-blur-sm">
                <span className="inline-block h-2 w-2 rounded-full bg-[#b5ff2b] animate-pulse" />
                AI-Powered Form Analysis
              </div>

              <h1 className="text-4xl font-black tracking-tight sm:text-6xl lg:text-7xl">
                Fix Your
                <br />
                <span className="gradient-lime-text">Workout Form</span>
                <br />
                Instantly
              </h1>

              <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground sm:text-xl">
                Record any exercise. Get scored 0-100 with AI coaching tips.
                Share viral before/after reels. All from your phone.
              </p>

              <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Link href="/signup">
                  <Button size="lg" className="h-12 px-8 text-base glow-lime">
                    Start Free Analysis →
                  </Button>
                </Link>
                <Link href="#features">
                  <Button variant="outline" size="lg" className="h-12 px-8 text-base">
                    See How It Works
                  </Button>
                </Link>
              </div>

              <p className="mt-4 text-xs text-muted-foreground">
                5 free analyses per month · No credit card required
              </p>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="features" className="border-t border-border/50 bg-card/30">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-bold sm:text-4xl">
                Fix Your Form in <span className="gradient-lime-text">3 Steps</span>
              </h2>
              <p className="mt-3 text-muted-foreground">
                From recording to viral reel in under 60 seconds.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {[
                {
                  step: "01",
                  title: "Record or Upload",
                  description:
                    "Use your phone camera or upload a 10-30s clip of any exercise – squats, bench, deadlifts, and more.",
                  icon: "📹",
                },
                {
                  step: "02",
                  title: "AI Analysis",
                  description:
                    "Real-time pose estimation scores your form 0-100 and identifies exactly what to fix with coaching tips.",
                  icon: "🤖",
                },
                {
                  step: "03",
                  title: "Share & Improve",
                  description:
                    "Export a TikTok-ready before/after reel with your score. Track progress over time on your dashboard.",
                  icon: "🚀",
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="group relative rounded-2xl border border-border/50 bg-card p-8 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
                >
                  <div className="mb-4 text-4xl">{item.icon}</div>
                  <div className="mb-2 text-xs font-bold uppercase tracking-widest text-primary">
                    Step {item.step}
                  </div>
                  <h3 className="mb-3 text-xl font-bold">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Exercises Supported */}
        <section className="border-t border-border/50">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold sm:text-4xl">
                Every Exercise, <span className="gradient-lime-text">Covered</span>
              </h2>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              {[
                "Squat",
                "Bench Press",
                "Deadlift",
                "Overhead Press",
                "Barbell Row",
                "Pull-up",
                "Lunge",
                "Romanian Deadlift",
                "Front Squat",
                "Hip Thrust",
              ].map((exercise) => (
                <div
                  key={exercise}
                  className="rounded-full border border-border/60 bg-card/80 px-5 py-2 text-sm font-medium transition-colors hover:border-primary/40 hover:text-primary"
                >
                  {exercise}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Preview */}
        <section className="border-t border-border/50 bg-card/30">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold sm:text-4xl">
                Simple <span className="gradient-lime-text">Pricing</span>
              </h2>
            </div>

            <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
              {/* Free */}
              <div className="rounded-2xl border border-border/50 bg-card p-8">
                <h3 className="text-lg font-bold">Free</h3>
                <div className="mt-2 text-4xl font-black">$0</div>
                <p className="mt-1 text-sm text-muted-foreground">forever</p>
                <ul className="mt-6 space-y-3 text-sm">
                  {["5 analyses per month", "Real-time pose overlay", "Form score & tips", "Video export"].map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <span className="text-primary">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/signup" className="mt-8 block">
                  <Button variant="outline" className="w-full">
                    Get Started
                  </Button>
                </Link>
              </div>

              {/* Pro */}
              <div className="relative rounded-2xl border-2 border-primary/50 bg-card p-8 glow-lime-sm">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-0.5 text-xs font-bold text-primary-foreground">
                  MOST POPULAR
                </div>
                <h3 className="text-lg font-bold">Pro</h3>
                <div className="mt-2 text-4xl font-black">
                  $19<span className="text-lg font-normal text-muted-foreground">/mo</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">cancel anytime</p>
                <ul className="mt-6 space-y-3 text-sm">
                  {[
                    "Unlimited analyses",
                    "Priority AI coaching",
                    "HD reel export",
                    "Progress tracking",
                    "Referral rewards",
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <span className="text-primary">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/signup" className="mt-8 block">
                  <Button className="w-full glow-lime-sm">
                    Start Pro Trial
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="border-t border-border/50">
          <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 text-center">
            <h2 className="text-3xl font-bold sm:text-4xl lg:text-5xl">
              Ready to <span className="gradient-lime-text">Perfect Your Form?</span>
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
              Join thousands of gym-goers who use FormGod AI to lift safer, heavier, and smarter.
            </p>
            <Link href="/signup" className="mt-8 inline-block">
              <Button size="lg" className="h-14 px-10 text-lg glow-lime">
                Start Analyzing Free →
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
