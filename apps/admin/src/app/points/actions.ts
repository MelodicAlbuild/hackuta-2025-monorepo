'use server'

import { createSupabaseServerClient } from '@repo/supabase/server'
import { revalidatePath } from 'next/cache'
import { cookies } from "next/headers"

// Action to add points to a user's score
export async function addPoints(userId: string, amount: number) {
    const supabase = await createSupabaseServerClient(cookies)
    const { error } = await supabase.rpc('add_points', { user_id_param: userId, amount_param: amount })
    if (error) throw new Error(error.message)
    revalidatePath('/points')
}

// Action to remove points from a user's score
export async function removePoints(userId: string, amount: number) {
    const supabase = await createSupabaseServerClient(cookies)
    const { error } = await supabase.rpc('remove_points', { user_id_param: userId, amount_param: amount })
    if (error) throw new Error(error.message)
    revalidatePath('/points')
}

// Action to set a user's score to a specific value
export async function setPoints(userId: string, amount: number) {
    const supabase = await createSupabaseServerClient(cookies)
    const { error } = await supabase
        .from('points')
        .update({ score: amount })
        .eq('user_id', userId)
    if (error) throw new Error(error.message)
    revalidatePath('/points')
}

// Action to bulk set all users' points
export async function bulkSetPoints(amount: number) {
    const supabase = await createSupabaseServerClient(cookies)
    const { error } = await supabase.rpc('bulk_set_points', { amount_param: amount })
    if (error) throw new Error(error.message)
    revalidatePath('/points')
}