import { createSupabaseServerClient } from '@repo/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
    const supabase = await createSupabaseServerClient(cookies)
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (!user || userError) {
        return new Response('Unauthorized', { status: 401 })
    }

    const { data: group, error } = await supabase
        .from('user_groups')
        .select('user_group')
        .eq('user_id', user.id)
        .single()

    if (error || !group) {
        return new Response('Group not found', { status: 404 })
    }

    return new NextResponse(JSON.stringify({ group: group.user_group }), {
        headers: { 'Content-Type': 'application/json' },
    })
}