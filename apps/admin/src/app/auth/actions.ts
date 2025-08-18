'use server'

import { createSupabaseServerClient } from '@repo/supabase/server'
import { redirect } from 'next/navigation'

export async function signOut() {
    const supabase = await createSupabaseServerClient()
    await supabase.auth.signOut()

    // After signing out, redirect to the central login page
    const authAppLoginUrl = process.env.NEXT_PUBLIC_AUTH_APP_URL + '/login'
    return redirect(authAppLoginUrl)
}