'use server'

import { createSupabaseServerClient } from '@repo/supabase/server'
import { cookies } from 'next/headers'

export async function getMyPointHistory() {
    const supabase = await createSupabaseServerClient(cookies)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('User not authenticated')
    }

    // Get regular point history
    const { data: pointHistory, error: pointError } = await supabase
        .from('point_history')
        .select(`
      created_at,
      points_change,
      source,
      admin:profiles!admin_id (id)
    `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    if (pointError) {
        console.error(pointError)
    }

    // Get gambling transactions (deposits and withdrawals)
    const { data: gamblingTransactions, error: gamblingError } = await supabase
        .from('gambling_transactions')
        .select('*')
        .eq('user_id', user.id)
        .in('transaction_type', ['deposit', 'withdrawal'])
        .order('created_at', { ascending: false })

    if (gamblingError) {
        console.error(gamblingError)
    }

    // Combine and format both histories
    const formattedPointHistory = (pointHistory || []).map(item => ({
        created_at: item.created_at,
        points_change: item.points_change,
        source: item.source || 'Manual Action by Admin',
    }))

    const formattedGamblingHistory = (gamblingTransactions || []).map(item => ({
        created_at: item.created_at,
        points_change: item.transaction_type === 'deposit' ? -item.amount : item.amount,
        source: item.transaction_type === 'deposit'
            ? `Gambling Deposit (${item.amount.toLocaleString()} to slots)`
            : `Gambling Withdrawal (${item.amount.toLocaleString()} from slots)`,
    }))

    // Merge and sort by date
    const combined = [...formattedPointHistory, ...formattedGamblingHistory]
    combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return combined
}