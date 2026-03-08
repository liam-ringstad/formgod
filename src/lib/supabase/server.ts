import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Creates a Supabase client for use in Server Components, Route Handlers,
 * and Server Actions. Handles cookie-based session management.
 */
export async function createClient() {
    const cookieStore = await cookies();

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-url.supabase.co",
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key",
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch {
                        // The `setAll` method is called from a Server Component
                        // where cookies cannot be set. This can be ignored if middleware
                        // is refreshing user sessions.
                    }
                },
            },
        }
    );
}

/**
 * Creates a Supabase admin client using the service role key.
 * ONLY use this in server-side contexts for operations that bypass RLS.
 */
export function createAdminClient() {
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-url.supabase.co",
        process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-key",
        {
            cookies: {
                getAll() {
                    return [];
                },
                setAll() { },
            },
        }
    );
}
