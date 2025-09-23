import { NextResponse } from 'next/server'
import { createSupabaseServerClient, createSupabaseAdminClient } from '@repo/supabase/server'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
    const supabase = await createSupabaseServerClient(cookies)

    if (request.headers.has("legacy")) {
        supabase.auth.setSession({
            access_token: request.headers.get("access")!,
            refresh_token: request.headers.get("refresh")!
        })
    }

    // 1. Check if the current user is authenticated
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: flag } = await supabase
        .from('feature_flags')
        .select('value')
        .eq('name', 'invite_method')
        .single();

    let inviteMethod = flag?.value || 'email';

    // 2. TODO: Check if the user has an 'organizer' role
    // We will add this logic in a later step once roles are defined.
    // For now, we'll assume any logged-in user can invite.

    // 3. Get the email to invite from the request body
    const { email } = await request.json()
    if (!email) {
        return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const options: { data: { role: string }, redirectTo?: string } = {
        data: {
            role: 'user'
        }
    }

    if (inviteMethod === 'email-otp') {
        options.redirectTo = "https://auth.hackuta.org/otp"
    }

    // 4. Use the Admin client to send the invite
    const supabaseAdmin = createSupabaseAdminClient()
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, options)

    if (error) {
        console.error('Supabase invite error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Invite sent successfully!', data }, { status: 200 })
}