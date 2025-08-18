'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

function isValidRedirectUrl(url: string | null): boolean {
    if (!url) return false
    // Ensure the redirect is to a known, safe domain (your own)
    const allowedOrigin = process.env.NEXT_PUBLIC_AUTH_APP_URL || ''
    const viewerOrigin = process.env.NEXT_PUBLIC_VIEWER_APP_URL || '' // Add viewer app URL to .env

    return url.startsWith(allowedOrigin) || url.startsWith(viewerOrigin);
}

export async function signIn(formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const redirectTo = formData.get('redirect_to') as string | null
    const supabase = await createClient()

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        return redirect('/login?message=Could not authenticate user')
    }

    if (isValidRedirectUrl(redirectTo)) {
        return redirect(redirectTo!)
    }

    redirect('/dashboard')
}

export async function signUp(formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const supabase = await createClient()

    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: '/auth/callback',
        },
    })

    if (error) {
        return redirect('/login?message=Could not authenticate user')
    }

    // A confirmation email will be sent.
    // You might want to redirect to a page that tells the user to check their email.
    return redirect('/login?message=Check email to continue sign in process')
}

export async function signInWithGithub() {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
            redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
        },
    })

    if (error) {
        return redirect('/login?message=Could not authenticate with GitHub')
    }

    return redirect(data.url)
}

export async function signInWithGoogle() {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
        },
    })

    if (error) {
        return redirect('/login?message=Could not authenticate with Google')
    }

    return redirect(data.url)
}