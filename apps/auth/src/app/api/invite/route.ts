import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'

export async function POST(request: Request) {
    const supabase = await createClient()

    // 1. Check if the current user is authenticated
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. TODO: Check if the user has an 'organizer' role
    // We will add this logic in a later step once roles are defined.
    // For now, we'll assume any logged-in user can invite.

    // 3. Get the email to invite from the request body
    const { email } = await request.json()
    if (!email) {
        return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // 4. Use the Admin client to send the invite
    const supabaseAdmin = createAdminClient()
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email)

    if (error) {
        console.error('Supabase invite error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Invite sent successfully!', data }, { status: 200 })
}