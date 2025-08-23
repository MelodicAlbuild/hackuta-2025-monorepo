'use server'

import { createSupabaseServerClient } from '@repo/supabase/server'
import { cookies } from 'next/headers'

export async function getMyPointHistory() {
    const supabase = await createSupabaseServerClient(cookies)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('User not authenticated')
    }

    const { data, error } = await supabase
        .from('point_history')
        .select(`
      created_at,
      points_change,
      source,
      admin:profiles!admin_id (id)
    `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    if (error) {
        console.error(error)
        return []
    }

    // We don't need the admin's email here, just a generic source
    return data.map(item => ({
        ...item,
        source: item.source || 'Manual Action by Admin',
    }))
}