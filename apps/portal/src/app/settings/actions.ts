'use server'

import { createSupabaseServerClient } from '@repo/supabase/server'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'

export async function updateUser(formData: { fullName: string }) {
    const supabase = await createSupabaseServerClient(cookies)
    const { data, error } = await supabase.auth.updateUser({
        data: { fullName: formData.fullName },
    })
    if (error) return { error: error.message }
    revalidatePath('/settings') // <-- Update this path
    return { data }
}

export async function updatePassword(formData: { password: string }) {
    const supabase = await createSupabaseServerClient(cookies)
    const { data, error } = await supabase.auth.updateUser({
        password: formData.password,
    })
    if (error) return { error: error.message }
    return { data }
}