import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * OAuth Callback Route – Exchanges auth code for session
 */
export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    const redirect = requestUrl.searchParams.get("redirect") || "/dashboard";

    if (code) {
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            // Check if user has completed onboarding
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("fitness_level")
                    .eq("id", user.id)
                    .single();

                // If no fitness level set, redirect to onboarding
                if (!profile?.fitness_level || profile.fitness_level === "beginner") {
                    return NextResponse.redirect(new URL("/onboarding", requestUrl.origin));
                }
            }

            return NextResponse.redirect(new URL(redirect, requestUrl.origin));
        }
    }

    // If error, redirect to login with error
    return NextResponse.redirect(
        new URL("/login?error=auth_callback_error", requestUrl.origin)
    );
}
