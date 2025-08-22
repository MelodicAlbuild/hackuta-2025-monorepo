'use server'

import { createSupabaseServerClient } from '@repo/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export async function signOut() {
    const supabase = await createSupabaseServerClient(cookies)
    await supabase.auth.signOut()
    // After signing out from the settings page, return to the login page
    return redirect('/login')
}