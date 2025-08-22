import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseMiddlewareClient } from '@repo/supabase/server'

export async function middleware(request: NextRequest) {
    const { supabase, response } = createSupabaseMiddlewareClient(request)
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
        const authAppLoginUrl = new URL('/login', process.env.NEXT_PUBLIC_AUTH_APP_URL!)
        if (authAppLoginUrl.searchParams.has('redirect_to')) {
            return
        }
        authAppLoginUrl.searchParams.set('redirect_to', request.url)
        return NextResponse.redirect(authAppLoginUrl)
    }

    return response
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}