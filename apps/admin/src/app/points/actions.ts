'use server'

import { createSupabaseServerClient } from '@repo/supabase/server'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'

async function callUpdateRpc(userId: string, amount: number, source: string) {
    const supabase = await createSupabaseServerClient(cookies)
    const { error } = await supabase.rpc('update_points_and_log', {
        target_user_id: userId,
        points_change_amount: amount,
        change_source: source,
    })
    if (error) throw new Error(`Failed to update points: ${error.message}`)
    revalidatePath('/points')
}

export async function addPoints(userId: string, amount: number) {
    await callUpdateRpc(userId, amount, 'Admin Add')
}

export async function removePoints(userId: string, amount: number) {
    await callUpdateRpc(userId, -amount, 'Admin Remove') // Note: amount is negative
}

export async function setPoints(userId: string, amount: number) {
    const supabase = await createSupabaseServerClient(cookies)
    // To "set" points, we first get the current score, then calculate the difference
    const { data: pointData } = await supabase.from('points').select('score').eq('user_id', userId).single()
    if (pointData) {
        const difference = amount - pointData.score
        await callUpdateRpc(userId, difference, 'Admin Set')
    }
}

export async function getPointHistory(userId: string) {
    const supabase = await createSupabaseServerClient(cookies)

    const { data, error } = await supabase
        .from('point_history')
        .select(`
      *,
      admin:profiles!admin_id (id, email)
    `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

    if (error) {
        throw new Error(`Failed to get point history: ${error.message}`)
    }

    // Simplify the return type
    return data.map(item => ({
        ...item,
        admin_email: item.admin?.email || 'N/A', // Use optional chaining
    }))
}

export async function bulkSetPoints(amount: number) {
    const supabase = await createSupabaseServerClient(cookies)

    // Security Check: Ensure the user is an admin or super-admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (!profile || !['admin', 'super-admin'].includes(profile.role)) {
        throw new Error('You do not have permission to perform this action.')
    }

    // Call our new database function
    const { error } = await supabase.rpc('bulk_set_points_and_log', {
        target_score: amount,
        change_source: 'Bulk Set',
    })

    if (error) {
        throw new Error(`Bulk set points failed: ${error.message}`)
    }

    revalidatePath('/points')
    return { success: true, message: 'All user points have been set.' }
}