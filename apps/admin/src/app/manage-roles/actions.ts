'use server'

import { createSupabaseServerClient, createSupabaseAdminClient } from '@repo/supabase/server'
import { revalidatePath } from 'next/cache'
import { cookies } from "next/headers"

export async function updateUserRole(targetUserId: string, newRole: 'user' | 'admin' | 'super-admin') {
    const supabase = await createSupabaseServerClient(cookies)

    // Security Check 1: Verify the current user is a super-admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        throw new Error('Not authenticated')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'super-admin') {
        throw new Error('You do not have permission to change user roles.')
    }

    // Security Check 2: Prevent a super-admin from changing their own role
    if (user.id === targetUserId) {
        throw new Error('Super-admins cannot change their own role.')
    }

    // If checks pass, use the Admin Client to perform the update
    const supabaseAdmin = createSupabaseAdminClient()
    const { error } = await supabaseAdmin
        .from('profiles')
        .update({ role: newRole })
        .eq('id', targetUserId)

    if (error) {
        throw new Error(`Failed to update role: ${error.message}`)
    }

    // Refresh the page to show the updated role
    revalidatePath('/manage-roles')
    return { success: true, message: `Role updated to ${newRole}.` }
}

export async function inviteNewUserWithRole(formData: { email: string, role: 'user' | 'admin' | 'super-admin' }) {
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
        throw new Error('You do not have permission to invite new users.')
    }

    // Use the Admin Client to send an invite with the role in the metadata
    const supabaseAdmin = createSupabaseAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(
        formData.email,
        {
            data: { role: formData.role }, // Pass the role here
        }
    )

    if (error) {
        throw new Error(`Failed to invite user: ${error.message}`)
    }

    // Refresh the page to show the (eventually) new user
    revalidatePath('/manage-roles')
    return { success: true, message: `Invitation sent to ${formData.email}.` }
}

function generateRandomPassword(length = 12) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

export async function createUserManually(formData: FormData) {
    const email = formData.get('email') as string;
    const role = formData.get('role') as string;

    const supabase = await createSupabaseServerClient(cookies);

    // Security Check: Verify the current user is a super-admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'super-admin') {
        throw new Error('You do not have permission to create users.');
    }

    // Generate a password and create the user with the Admin Client
    const supabaseAdmin = createSupabaseAdminClient();

    // ** NEW: Read the feature flag **
    const { data: flag } = await supabaseAdmin
        .from('feature_flags')
        .select('value')
        .eq('name', 'invite_method')
        .single();

    const inviteMethod = flag?.value || 'email'; // Default to email if flag not found
    const password = generateRandomPassword();

    const { data: newUser, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { role },
    });

    if (error) throw new Error(`Failed to create user: ${error.message}`);

    if (inviteMethod === 'discord') {
        // ** NEW: Save password to the database for the bot to fetch **
        await supabaseAdmin
            .from('temporary_passwords')
            .insert({ user_id: newUser.user.id, temp_password: password });

        revalidatePath('/manage-roles');
        return { success: true, message: `User ${email} created. They can now get their password from the Discord bot.` };
    } else {
        // ** OLD: Return the password directly to the admin **
        revalidatePath('/manage-roles');
        return { success: true, email: newUser.user.email, password };
    }
}