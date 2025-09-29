import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseMiddlewareClient } from '@repo/supabase/server'

export async function middleware(request: NextRequest) {
    // This createClient function is the one we copied from the auth app.
    // It refreshes the session cookie.
    const { supabase, response } = createSupabaseMiddlewareClient(request)

    const {
        data: { session },
    } = await supabase.auth.getSession()

    // If no session is found, redirect the user to the centralized login page.
    if (!session) {
        // The URL of our central auth app's login page.
        const authAppLoginUrl = new URL(
            '/login',
            process.env.NEXT_PUBLIC_AUTH_APP_URL!, // e.g., 'http://localhost:3000'
        )

        // We pass the URL the user was trying to access as a query parameter.
        // The auth app will use this to redirect the user back after login.
        authAppLoginUrl.searchParams.set('redirect_to', request.url)

        // Perform the redirect.
        return NextResponse.redirect(authAppLoginUrl)
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .single()

    const superAdminOnlyRoutes = ['/manage-roles', '/notifications', '/points', '/scanner', '/vendor-codes'];
    const volunteerRoutes = ['/', '/action-scanner', '/check-in']

    if (superAdminOnlyRoutes.some(route => request.nextUrl.pathname.startsWith(route))) {
        if (profile?.role !== 'super-admin') {
            const unauthorizedUrl = new URL('/unauthorized', request.url)
            return NextResponse.redirect(unauthorizedUrl)
        }
    }

    const allowedRoles = ['volunteer', 'admin', 'super-admin'];
    if (!profile || !allowedRoles.includes(profile.role)) {
        const unauthorizedUrl = new URL('/unauthorized', request.url)
        return NextResponse.redirect(unauthorizedUrl)
    }

    // Lock Volunteers to specific routes ONLY
    if (profile?.role === 'volunteer' && !volunteerRoutes.some(route => request.nextUrl.pathname.startsWith(route))) {
        const unauthorizedUrl = new URL('/unauthorized', request.url)
        return NextResponse.redirect(unauthorizedUrl)
    }

    // If a session exists, allow the request to proceed.
    return response
}

export const config = {
    matcher: [
        /* Match all paths except for the unauthorized page and static assets */
        '/((?!unauthorized|_next/static|_next/image|favicon.ico).*)',
    ],
}