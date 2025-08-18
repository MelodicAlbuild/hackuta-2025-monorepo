'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateUser(formData: { fullName: string }) {
    const supabase = await createClient()

    // The `updateUser` method allows updating user_metadata
    const { data, error } = await supabase.auth.updateUser({
        data: { fullName: formData.fullName },
    })

    if (error) {
        return { error: error.message }
    }

    // Revalidate the path to ensure the UI is updated with new data
    revalidatePath('/dashboard')
    return { data }
}

export async function updatePassword(formData: { password: string }) {
    const supabase = await createClient()

    const { data, error } = await supabase.auth.updateUser({
        password: formData.password,
    })

    if (error) {
        return { error: error.message }
    }

    return { data }
}