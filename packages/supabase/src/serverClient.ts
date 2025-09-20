import { createServerClient } from '@supabase/ssr'
import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies'

export async function createSupabaseServerClient(cookies: () => Promise<ReadonlyRequestCookies>) {
    const cookieStore = await cookies()

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                // Use the new `getAll` method to read all cookies
                getAll() {
                    return cookieStore.getAll()
                },
                // Use the new `setAll` method to set all cookies
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
            cookieOptions: {
                domain: process.env.NODE_ENV === 'production' ? ".hackuta.org" : "localhost",
                secure: process.env.NODE_ENV === 'production',
                path: "/",
                sameSite: "lax"
            },
            auth: {
                storageKey: 'sb-auth-token',
                autoRefreshToken: false,
                persistSession: true,
                detectSessionInUrl: true,
            }
        }
    )
}