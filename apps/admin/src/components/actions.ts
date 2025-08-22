'use server'

import { createSupabaseServerClient } from '@repo/supabase/server'
import { revalidatePath } from 'next/cache'
import { cookies } from "next/headers"

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001"

export async function inviteUser(email: string, registrationId: number) {
    const authAppApiUrl = `${BASE_URL}/api/invite`
    const supabase = await createSupabaseServerClient(cookies)

    try {
        // Step 1: Call the centralized invite API in your auth app.
        // This requires the auth app to be running.
        const response = await fetch(authAppApiUrl, {
            method: 'POST',
            credentials: 'include', // Ensure cookies are sent with the request
            headers: {
                'Content-Type': 'application/json',
                'legacy': 'true',
                'access': (await supabase.auth.getSession()).data.session!.access_token!,
                'refresh': (await supabase.auth.getSession()).data.session!.refresh_token!,
            },
            body: JSON.stringify({ email }),
        });

        if (!response.ok) {
            const errorBody = await response.json();
            throw new Error(errorBody.error || 'Failed to send invite');
        }

        // Step 2: If the invite was sent successfully, update the user's status.
        const { error: updateError } = await supabase
            .from('interest-form')
            .update({ status: 'invited' })
            .eq('id', registrationId);

        if (updateError) {
            throw new Error(`Failed to update status: ${updateError.message}`);
        }

        // Step 3: Refresh the data on the page to show the new status.
        revalidatePath('/registrations');
        return { success: true };

    } catch (error) {
        console.error('Invite Error:', error);
        // In a real app, you'd want to handle this more gracefully.
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}