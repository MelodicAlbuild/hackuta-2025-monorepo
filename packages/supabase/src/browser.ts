import { createBrowserClient } from '@supabase/ssr'

export function createSupabaseBrowserClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookieOptions: {
                domain: process.env.NODE_ENV === 'production' ? ".hackuta.org" : "localhost",
                secure: process.env.NODE_ENV === 'production',
                path: "/",
                sameSite: "lax"
            },
            auth: {
                storageKey: 'sb-auth-token',
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: true,
            }
        }
    )
}