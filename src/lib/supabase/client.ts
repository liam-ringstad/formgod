import { createBrowserClient } from "@supabase/ssr";

/**
 * Creates a Supabase client for use in browser/client components.
 * Uses the public anon key – all queries are subject to RLS.
 */
export function createClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-url.supabase.co",
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key"
    );
}
