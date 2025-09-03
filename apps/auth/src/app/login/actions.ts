'use server'

import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@repo/supabase/server'
import { cookies } from "next/headers"

function isValidRedirectUrl(url: string | null): boolean {
    if (!url) return false;
    // Allow relative URLs (starting with /)
    if (url.startsWith('/')) return true;
    // Allow full URLs to hackuta.org subdomains or localhost
    const regex = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)*hackuta\.org(\/|$)/;
    return regex.test(url) || url.startsWith('http://localhost');
}

export async function signIn(formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const redirectTo = formData.get('redirect_to') as string | null;
    const supabase = await createSupabaseServerClient(cookies);

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        console.error('SignIn error:', error.message);
        return redirect('/login?message=Could not authenticate user');
    }

    console.log('SignIn success. redirectTo:', redirectTo);
    if (isValidRedirectUrl(redirectTo)) {
        console.log('Redirecting to:', redirectTo);
        return redirect(redirectTo!);
    } else {
        console.warn('Invalid redirectTo, redirecting to portal:', redirectTo);
    }

    redirect(`${process.env.NEXT_PUBLIC_PORTAL_APP_URL}/`);
}

export async function signUp(formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const supabase = await createSupabaseServerClient(cookies)

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
    const supabase = await createSupabaseServerClient(cookies)
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
    const supabase = await createSupabaseServerClient(cookies)
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