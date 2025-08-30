'use server'

import { createSupabaseServerClient } from '@repo/supabase/server'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'

// Helper for security check
async function verifySuperAdmin() {
    const supabase = await createSupabaseServerClient(cookies)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'super-admin') {
        throw new Error('You do not have permission to manage the schedule.')
    }
    return user.id;
}

// Action to CREATE a new event
export async function createEvent(formData: FormData) {
    const adminId = await verifySuperAdmin();
    const newEvent = {
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        start_time: formData.get('start_time') as string,
        end_time: formData.get('end_time') as string || null,
        location: formData.get('location') as string,
        category: formData.get('category') as string,
        created_by: adminId,
    };

    const supabase = await createSupabaseServerClient(cookies);
    const { error } = await supabase.from('events').insert(newEvent);

    if (error) throw new Error(`Failed to create event: ${error.message}`);
    revalidatePath('/events'); // Revalidate the admin page
    revalidatePath('/schedule'); // Revalidate the public schedule page
    return { success: true };
}

// Action to UPDATE an event
export async function updateEvent(formData: FormData) {
    await verifySuperAdmin();
    const eventId = formData.get('id') as string;
    const updatedEvent = {
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        start_time: formData.get('start_time') as string,
        end_time: formData.get('end_time') as string || null,
        location: formData.get('location') as string,
        category: formData.get('category') as string,
    };

    const supabase = await createSupabaseServerClient(cookies);
    const { error } = await supabase.from('events').update(updatedEvent).eq('id', eventId);

    if (error) throw new Error(`Failed to update event: ${error.message}`);
    revalidatePath('/events');
    revalidatePath('/schedule');
    return { success: true };
}

// Action to DELETE an event
export async function deleteEvent(eventId: number) {
    await verifySuperAdmin();
    const supabase = await createSupabaseServerClient(cookies);
    const { error } = await supabase.from('events').delete().eq('id', eventId);

    if (error) throw new Error(`Failed to delete event: ${error.message}`);
    revalidatePath('/events');
    revalidatePath('/schedule');
    return { success: true };
}