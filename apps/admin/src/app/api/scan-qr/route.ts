import { createSupabaseAdminClient } from '@repo/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    // TODO: Add admin/super-admin role check from the session for security

    const { qr_token } = await request.json()
    if (!qr_token) {
        return NextResponse.json({ error: 'QR Token is required' }, { status: 400 })
    }

    const supabaseAdmin = createSupabaseAdminClient()

    // 1. Find the user_id from the qr_token
    const { data: identity } = await supabaseAdmin
        .from('qr_identities')
        .select('user_id')
        .eq('qr_token', qr_token)
        .single()

    if (!identity) {
        return NextResponse.json({ error: 'Invalid QR Code: User not found' }, { status: 404 })
    }

    // 2. Fetch the user's auth details (like email)
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(identity.user_id)
    if (authError) {
        return NextResponse.json({ error: `Could not retrieve user: ${authError.message}` }, { status: 500 })
    }

    // 3. Fetch the user's profile and points data
    const { data: userProfile } = await supabaseAdmin
        .from('profiles')
        .select('*, points ( score )')
        .eq('id', identity.user_id)
        .single()

    // 4. Combine all data into a single response
    const combinedUser = {
        id: userProfile?.id,
        email: authUser.user.email,
        role: userProfile?.role,
        score: userProfile?.points[0]?.score ?? 0,
    }

    return NextResponse.json({ user: combinedUser })
}