'use server'

import { createSupabaseServerClient } from '@repo/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from "next/headers"

export async function signOut() {
    const supabase = await createSupabaseServerClient(cookies)
    await supabase.auth.signOut()

    // After signing out, redirect to the central login page
    const authAppLoginUrl = process.env.NEXT_PUBLIC_AUTH_APP_URL + '/login'
    return redirect(authAppLoginUrl)
}