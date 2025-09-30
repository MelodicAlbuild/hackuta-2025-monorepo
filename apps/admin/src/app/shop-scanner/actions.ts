'use server';

import { createSupabaseServerClient, createSupabaseAdminClient } from '@repo/supabase/server';
import { cookies } from 'next/headers';

export async function purchaseShopItem({
  qr_token,
  item_id,
}: {
  qr_token: string;
  item_id: number;
}) {
  const supabase = await createSupabaseServerClient(cookies);
  const supabaseAdmin = createSupabaseAdminClient();

  // 1. Verify admin is authenticated
  const {
    data: { user: adminUser },
  } = await supabase.auth.getUser();
  if (!adminUser) throw new Error('Not authenticated');

  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', adminUser.id)
    .single();
  if (!adminProfile || !['admin', 'super-admin'].includes(adminProfile.role)) {
    throw new Error('You do not have permission to process purchases.');
  }

  // 2. Find the user by QR token
  const { data: identity } = await supabaseAdmin
    .from('qr_identities')
    .select('user_id, sign_up_token')
    .or(`qr_token.eq.${qr_token},sign_up_token.eq.${qr_token}`)
    .single();

  if (!identity) {
    throw new Error('Invalid QR code: User not found');
  }

  // 3. Check if user is checked in
  if (!identity.sign_up_token) {
    throw new Error('User has not checked in yet');
  }

  // 4. Get shop item details
  const { data: shopItem } = await supabaseAdmin
    .from('shop_items')
    .select('*')
    .eq('id', item_id)
    .single();

  if (!shopItem) {
    throw new Error('Shop item not found');
  }

  if (!shopItem.is_active) {
    throw new Error('This item is not available for purchase');
  }

  // 5. Check stock
  if (shopItem.stock !== null && shopItem.stock <= 0) {
    throw new Error('This item is out of stock');
  }

  // 6. Check user's balance
  const { data: pointData } = await supabaseAdmin
    .from('points')
    .select('score')
    .eq('user_id', identity.user_id)
    .single();

  if (!pointData) {
    throw new Error('Failed to retrieve user points');
  }

  if (pointData.score < shopItem.point_cost) {
    throw new Error(
      `Insufficient balance. User has ${pointData.score} points, needs ${shopItem.point_cost} points`
    );
  }

  // 7. Deduct points
  const { error: pointsError } = await supabase.rpc('update_points_and_log', {
    target_user_id: identity.user_id,
    points_change_amount: -shopItem.point_cost,
    change_source: `Shop: ${shopItem.name}`,
  });

  if (pointsError) {
    throw new Error(`Failed to deduct points: ${pointsError.message}`);
  }

  // 8. Update stock if not unlimited
  if (shopItem.stock !== null) {
    const { error: stockError } = await supabaseAdmin
      .from('shop_items')
      .update({ stock: shopItem.stock - 1 })
      .eq('id', item_id);

    if (stockError) {
      console.error('Failed to update stock', stockError);
      // Try to refund points
      await supabase.rpc('update_points_and_log', {
        target_user_id: identity.user_id,
        points_change_amount: shopItem.point_cost,
        change_source: `Shop Refund: ${shopItem.name}`,
      });
      throw new Error('Failed to update stock');
    }
  }

  // 9. Log the purchase in scan_logs
  const { error: logError } = await supabaseAdmin.from('scan_logs').insert({
    shop_item_id: item_id,
    scanned_user_id: identity.user_id,
    admin_user_id: adminUser.id,
    points_awarded: -shopItem.point_cost,
  });

  if (logError) {
    console.error('Failed to log purchase', logError);
    // Still complete the purchase but warn about logging failure
    return {
      success: true,
      message: `Purchase successful! ${shopItem.point_cost} points deducted. (Warning: Failed to log transaction)`,
    };
  }

  return {
    success: true,
    message: `Purchase successful! ${shopItem.point_cost} points deducted.`,
  };
}