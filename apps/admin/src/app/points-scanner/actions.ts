'use server';

import { createSupabaseServerClient, createSupabaseAdminClient } from '@repo/supabase/server';
import { cookies } from 'next/headers';

export async function scanForPoints({
  qr_token,
  action_id,
}: {
  qr_token: string;
  action_id: number;
}) {
  const supabase = await createSupabaseServerClient(cookies);
  const supabaseAdmin = createSupabaseAdminClient();

  try {
    // 1. Verify admin is authenticated
    const {
      data: { user: adminUser },
    } = await supabase.auth.getUser();
    if (!adminUser) {
      return {
        success: false,
        message: 'Not authenticated',
      };
    }

    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', adminUser.id)
      .single();
    if (!adminProfile || !['admin', 'super-admin'].includes(adminProfile.role)) {
      return {
        success: false,
        message: 'You do not have permission to scan for points.',
      };
    }

    // 2. Find the user by QR token
    const { data: identity, error: identityError } = await supabaseAdmin
      .from('qr_identities')
      .select('user_id, sign_up_token')
      .or(`qr_token.eq.${qr_token},sign_up_token.eq.${qr_token}`)
      .single();

    if (identityError) {
      console.error('Failed to fetch QR identity', identityError);
      return {
        success: false,
        message: 'Failed to validate QR code. Please try again.',
      };
    }

    if (!identity) {
      return {
        success: false,
        message: 'Invalid QR code: User not found',
      };
    }

    // 3. Check if user is checked in
    if (!identity.sign_up_token) {
      return {
        success: false,
        message: 'User has not checked in yet',
      };
    }

    // 4. Get scan action details
    const { data: scanAction, error: scanActionError } = await supabaseAdmin
      .from('scan_actions')
      .select('*')
      .eq('id', action_id)
      .single();

    if (scanActionError) {
      console.error('Failed to fetch scan action', scanActionError);
      return {
        success: false,
        message: 'Unable to load scan action. Please refresh and try again.',
      };
    }

    if (!scanAction) {
      return {
        success: false,
        message: 'Scan action not found',
      };
    }

    if (!scanAction.is_active) {
      return {
        success: false,
        message: 'This scan action is not active',
      };
    }

    // 5. Check if currently within time window
    const now = new Date();
    const startTime = new Date(scanAction.start_time);
    const endTime = new Date(scanAction.end_time);

    if (now < startTime || now > endTime) {
      return {
        success: false,
        message: 'This event is not currently active',
      };
    }

    // 6. Check if user already scanned for this action
    const { data: existingScan, error: existingScanError } = await supabaseAdmin
      .from('scan_logs')
      .select('id')
      .eq('action_id', action_id)
      .eq('scanned_user_id', identity.user_id)
      .maybeSingle();

    if (existingScanError) {
      console.error('Failed to check existing scan', existingScanError);
      return {
        success: false,
        message: 'Unable to verify previous scans. Please try again.',
      };
    }

    if (existingScan) {
      return {
        success: false,
        message: 'User has already scanned for this event',
      };
    }

    // 7. Award points (always positive)
    const pointsChange = scanAction.points_value;

    const { error: pointsError } = await supabase.rpc('update_points_and_log', {
      target_user_id: identity.user_id,
      points_change_amount: pointsChange,
      change_source: scanAction.name,
    });

    if (pointsError) {
      console.error('Failed to update points', pointsError);
      return {
        success: false,
        message: 'Failed to update points. Please try again.',
      };
    }

    // 8. Log the scan
    const { error: logError } = await supabaseAdmin.from('scan_logs').insert({
      action_id: action_id,
      scanned_user_id: identity.user_id,
      admin_user_id: adminUser.id,
      points_awarded: pointsChange,
    });

    if (logError) {
      console.error('Failed to log scan', logError);
    }

    return {
      success: true,
      message: `Awarded ${scanAction.points_value} points!`,
    };
  } catch (error) {
    console.error('Unexpected error while scanning for points', error);
    return {
      success: false,
      message: 'Something went wrong while scanning. Please try again.',
    };
  }
}
