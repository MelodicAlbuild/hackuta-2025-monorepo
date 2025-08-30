'use server'

import { createSupabaseServerClient } from '@repo/supabase/server'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers';

export async function distributeUserGroups(
    { userIds, groupCount }: { userIds: string[]; groupCount: number }
) {
    const supabase = await createSupabaseServerClient(cookies)

    // 1. Security Check: Verify the user is a super-admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'super-admin') {
        throw new Error('You do not have permission for this action.')
    }

    // 2. Validate Inputs
    if (!userIds || userIds.length === 0) {
        throw new Error('No users selected.');
    }
    if (groupCount < 1 || groupCount > 26) {
        throw new Error('Group count must be between 1 and 26.');
    }

    // 3. Generate group labels (A, B, C...)
    const groups = Array.from({ length: groupCount }, (_, i) => String.fromCharCode(65 + i));

    // 4. Create the data for the upsert operation
    const dataToUpsert = userIds.map((userId, index) => ({
        user_id: userId,
        user_group: groups[index % groupCount], // Round-robin assignment
    }));

    // 5. Perform a bulk upsert
    const { error } = await supabase
        .from('user_groups')
        .upsert(dataToUpsert, { onConflict: 'user_id' }); // Overwrites existing group for a user

    if (error) {
        throw new Error(`Failed to distribute groups: ${error.message}`);
    }

    revalidatePath('/groups');
    return { success: true, message: `${userIds.length} users have been assigned to ${groupCount} groups.` };
}

export async function updateUserGroup(
    { userId, newGroup }: { userId: string; newGroup: string }
) {
    const supabase = await createSupabaseServerClient(cookies)

    // 1. Security Check: Verify the user is a super-admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'super-admin') {
        throw new Error('You do not have permission for this action.')
    }

    // 2. Validate Input
    if (!userId || !newGroup || newGroup.length !== 1) {
        throw new Error('Invalid user or group provided.');
    }

    // 3. Upsert the new group assignment for the single user
    const { error } = await supabase
        .from('user_groups')
        .upsert({ user_id: userId, user_group: newGroup }, { onConflict: 'user_id' });

    if (error) {
        throw new Error(`Failed to update group: ${error.message}`);
    }

    revalidatePath('/groups');
    return { success: true, message: 'Group updated successfully.' };
}