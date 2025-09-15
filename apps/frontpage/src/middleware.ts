import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseMiddlewareClient } from '@repo/supabase/server'

let redirectsCache: { map: Record<string, string>; expiresAt: number } | null = null
let redirectsFetchPromise: Promise<Record<string, string>> | null = null
const REDIRECTS_CACHE_TTL_MS = 10 * 60 * 1000

type RedirectRow = { path: string; redirect_url: string }
type FetchRedirects = () => Promise<RedirectRow[]>

async function getRedirectsMap(fetchRedirects: FetchRedirects): Promise<Record<string, string>> {
    const now = Date.now()
    if (redirectsCache && redirectsCache.expiresAt > now) return redirectsCache.map
    if (redirectsFetchPromise) return redirectsFetchPromise

    redirectsFetchPromise = (async () => {
        const data = await fetchRedirects()
        const map: Record<string, string> = {}
        data?.forEach((row) => {
            map[row.path] = row.redirect_url
        })
        redirectsCache = { map, expiresAt: Date.now() + REDIRECTS_CACHE_TTL_MS }
        return map
    })()

    try {
        return await redirectsFetchPromise
    } catch {
        return redirectsCache?.map ?? {}
    } finally {
        redirectsFetchPromise = null
    }
}

export async function middleware(request: NextRequest) {
    // This createClient function is the one we copied from the auth app.
    // It refreshes the session cookie.
    const { supabase, response } = createSupabaseMiddlewareClient(request)

    const pathMap = await getRedirectsMap(async () => {
        const { data, error } = await supabase
            .from('redirects')
            .select('path, redirect_url')
        if (error) throw new Error(error.message)
        return data ?? []
    })

    if (pathMap[request.nextUrl.pathname]) {
        const target = pathMap[request.nextUrl.pathname]
        const url = /^https?:\/\//i.test(target) ? target : new URL(target, request.url)
        return NextResponse.redirect(url)
    }

    // If a session exists, allow the request to proceed.
    return response
}

export const config = {
    matcher: [
        /* Match all paths except for the unauthorized page and static assets */
        '/((?!unauthorized|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
    ],
}