'use server'

import { createSupabaseServerClient, createSupabaseAdminClient } from '@repo/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateUserRole(targetUserId: string, newRole: 'user' | 'admin' | 'super-admin') {
    const supabase = await createSupabaseServerClient()

    // Security Check 1: Verify the current user is a super-admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        throw new Error('Not authenticated')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'super-admin') {
        throw new Error('You do not have permission to change user roles.')
    }

    // Security Check 2: Prevent a super-admin from changing their own role
    if (user.id === targetUserId) {
        throw new Error('Super-admins cannot change their own role.')
    }

    // If checks pass, use the Admin Client to perform the update
    const supabaseAdmin = createSupabaseAdminClient()
    const { error } = await supabaseAdmin
        .from('profiles')
        .update({ role: newRole })
        .eq('id', targetUserId)

    if (error) {
        throw new Error(`Failed to update role: ${error.message}`)
    }

    // Refresh the page to show the updated role
    revalidatePath('/manage-roles')
    return { success: true, message: `Role updated to ${newRole}.` }
}

export async function inviteNewUserWithRole(formData: { email: string, role: 'user' | 'admin' | 'super-admin' }) {
    const supabase = await createSupabaseServerClient()

    // Security Check: Verify the current user is a super-admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'super-admin') {
        throw new Error('You do not have permission to invite new users.')
    }

    // Use the Admin Client to send an invite with the role in the metadata
    const supabaseAdmin = createSupabaseAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(
        formData.email,
        {
            data: { role: formData.role }, // Pass the role here
        }
    )

    if (error) {
        throw new Error(`Failed to invite user: ${error.message}`)
    }

    // Refresh the page to show the (eventually) new user
    revalidatePath('/manage-roles')
    return { success: true, message: `Invitation sent to ${formData.email}.` }
}