import { type NextRequest } from 'next/server'
import { createSupabaseMiddlewareClient } from '@repo/supabase/server'

export async function middleware(request: NextRequest) {
    const { supabase, response } = createSupabaseMiddlewareClient(request)

    // Refresh session if expired - required for Server Components
    const session = await supabase.auth.getSession()

    let cookies = request.cookies.get('sb-auth-token')

    if (cookies && !session.data.session) {
        const { data } = await supabase.auth.refreshSession()
        if (data.session) {
            const token = data.session.access_token
            response.cookies.set({
                name: 'sb-auth-token',
                value: token,
                httpOnly: true,
            })
        }
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
}