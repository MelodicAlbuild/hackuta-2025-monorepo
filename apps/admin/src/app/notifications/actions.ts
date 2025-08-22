'use server'

import { createSupabaseServerClient } from '@repo/supabase/server'
import { cookies } from 'next/headers';

export async function sendBroadcastNotification(formData: FormData) {
    const title = formData.get('title') as string;
    const message = formData.get('message') as string;

    if (!title || !message) throw new Error('Title and Message cannot be empty.');

    const supabase = await createSupabaseServerClient(cookies)

    // Security Check: Verify the current user is a super-admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'super-admin') {
        throw new Error('You do not have permission to send notifications.')
    }

    // Insert the new broadcast notification
    const { error } = await supabase
        .from('notifications')
        .insert({ title: title, message: message, type: 'broadcast' })

    if (error) {
        throw new Error(`Failed to send notification: ${error.message}`)
    }

    return { success: true, message: 'Notification sent successfully!' }
}