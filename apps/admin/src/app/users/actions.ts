'use server'

import { createSupabaseAdminClient, createSupabaseServerClient } from '@repo/supabase/server'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'

export async function deleteUser(targetUserId: string) {
    const supabase = await createSupabaseServerClient(cookies)

    // Security Check 1: Verify the current user is a super-admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'super-admin') {
        throw new Error('You do not have permission to delete users.')
    }

    // Security Check 2: Prevent a super-admin from deleting their own account
    if (user.id === targetUserId) {
        throw new Error('You cannot delete your own account.')
    }

    // Use the Admin Client to perform the deletion
    const supabaseAdmin = createSupabaseAdminClient()
    const { error } = await supabaseAdmin.auth.admin.deleteUser(targetUserId)

    if (error) {
        throw new Error(`Failed to delete user: ${error.message}`)
    }

    // Refresh the page to show the updated user list
    revalidatePath('/users')
    return { success: true, message: 'User deleted successfully.' }
}