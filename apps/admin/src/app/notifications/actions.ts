'use server'

import { createSupabaseAdminClient, createSupabaseServerClient } from '@repo/supabase/server'
import { cookies } from 'next/headers';

type Notification = {
    id: number;
    created_at: string;
    title: string;
    message: string;
};

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
    const { data, error } = await supabase
        .from('notifications')
        .insert({ title: title, message: message, type: 'broadcast' })
        .select()

    if (error) {
        throw new Error(`Failed to send notification: ${error.message}`)
    }

    console.log(data)

    supabase.channel("notifications").send({
        type: "broadcast",
        event: "shout",
        payload: { id: data[0].id, created_at: data[0].created_at, title: data[0].title, message: data[0].message, target_user_id: null, }
    });

    return { success: true, message: 'Notification sent successfully!' }
}

export async function sendDirectNotification(formData: FormData) {
    const title = formData.get('title') as string;
    const message = formData.get('message') as string;
    const targetUserId = formData.get('targetUserId') as string;

    if (!title || !message || !targetUserId) {
        throw new Error('Title, message, and a target user are required.');
    }

    const supabase = await createSupabaseServerClient(cookies);

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

    const supabaseAdmin = createSupabaseAdminClient();

    const userEmail = await supabaseAdmin.auth.admin.getUserById(targetUserId);

    const { data, error } = await supabase
        .from('notifications')
        .insert({
            title: title,
            message: message,
            type: 'direct', // Set the type to 'direct'
            target_user_id: targetUserId, // Populate the target user ID
            recipient_email: userEmail.data.user?.email
        }).select();

    if (error) {
        throw new Error(`Failed to send direct notification: ${error.message}`);
    }

    supabase.channel("notifications").send({
        type: "broadcast",
        event: "shout",
        payload: { id: data[0].id, created_at: data[0].created_at, title: data[0].title, message: data[0].message, target_user_id: data[0].target_user_id, recipient_email: userEmail.data.user?.email }
    });

    return { success: true, message: `Direct message sent successfully!` };
}