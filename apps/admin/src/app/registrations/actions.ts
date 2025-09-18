'use server';

import { createSupabaseServerClient } from '@repo/supabase/server';
import { revalidatePath } from 'next/cache';
import { createDiscordUser } from '../manage-roles/actions'; // Import our reusable action
import { cookies } from 'next/headers';

export async function inviteUser(email: string, registrationId: number) {
    const supabase = await createSupabaseServerClient(cookies);

    // 1. Check the feature flag
    const { data: flag } = await supabase
        .from('feature_flags')
        .select('value')
        .eq('name', 'invite_method')
        .single();

    const inviteMethod = flag?.value || 'email'; // Default to email

    try {
        if (inviteMethod === 'discord') {
            // 2a. If Discord, create the user and their temp password
            await createDiscordUser(email, 'user'); // Registrants are always 'user' role
        } else {
            // 2b. If Email, call the auth app's API endpoint
            const authAppApiUrl = `${process.env.NEXT_PUBLIC_AUTH_APP_URL}/api/invite`;
            const session = await supabase.auth.getSession();
            if (!session.data.session) {
                throw new Error('Not authenticated');
            }
            const response = await fetch(authAppApiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    legacy: 'true',
                    access: session.data.session.access_token,
                    refresh: session.data.session.refresh_token,
                },
                body: JSON.stringify({ email }),
            });
            if (!response.ok) {
                const errorBody = await response.json();
                throw new Error(errorBody.error || 'Failed to send invite');
            }
        }

        // 3. If successful, update the applicant's status to 'invited'
        const { error: updateError } = await supabase
            .from('interest-form')
            .update({ status: 'invited' })
            .eq('id', registrationId);
        if (updateError)
            throw new Error(`Failed to update status: ${updateError.message}`);

        revalidatePath('/registrations');
        return { success: true, message: `User invited via ${inviteMethod}.` };
    } catch (error) {
        console.error('Invite Error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
