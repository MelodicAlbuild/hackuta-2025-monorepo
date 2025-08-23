'use server'

import { createSupabaseServerClient } from '@repo/supabase/server'
import { cookies } from 'next/headers'

export async function applyPointsAction(
    { userId, amount, source }: { userId: string; amount: number; source: string; }
) {
    const supabase = await createSupabaseServerClient(cookies)

    // Security Check: Verify the user performing the action is an admin/super-admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (!profile || !['admin', 'super-admin'].includes(profile.role)) {
        throw new Error('You do not have permission to perform this action.')
    }

    // Use the existing RPC to update points and create a history log
    // The `amount` can be positive or negative.
    const { error } = await supabase.rpc('update_points_and_log', {
        target_user_id: userId,
        points_change_amount: amount,
        change_source: source,
    })

    if (error) {
        throw new Error(`Failed to apply points: ${error.message}`)
    }

    // No revalidation needed, the client will handle its own state
    return { success: true }
}