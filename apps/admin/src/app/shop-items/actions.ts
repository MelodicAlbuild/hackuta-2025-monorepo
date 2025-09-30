'use server';

import { createSupabaseServerClient } from '@repo/supabase/server';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

async function verifyAdminOrSuperAdmin() {
  const supabase = await createSupabaseServerClient(cookies);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (!profile || !['admin', 'super-admin'].includes(profile.role)) {
    throw new Error('You do not have permission to manage shop items.');
  }
  return user.id;
}

export async function createShopItem(formData: FormData) {
  const adminId = await verifyAdminOrSuperAdmin();

  const newItem = {
    name: formData.get('name') as string,
    description: formData.get('description') as string,
    point_cost: parseInt(formData.get('point_cost') as string, 10),
    stock: formData.get('stock') ? parseInt(formData.get('stock') as string, 10) : null,
    image_url: formData.get('image_url') as string,
    category: formData.get('category') as string,
    is_active: formData.get('is_active') === 'true',
    created_by: adminId,
  };

  const supabase = await createSupabaseServerClient(cookies);
  const { error } = await supabase.from('shop_items').insert(newItem);

  if (error) throw new Error(`Failed to create shop item: ${error.message}`);
  revalidatePath('/shop-items');
  return { success: true };
}

export async function updateShopItem(formData: FormData) {
  await verifyAdminOrSuperAdmin();
  const itemId = formData.get('id') as string;

  const updatedItem = {
    name: formData.get('name') as string,
    description: formData.get('description') as string,
    point_cost: parseInt(formData.get('point_cost') as string, 10),
    stock: formData.get('stock') ? parseInt(formData.get('stock') as string, 10) : null,
    image_url: formData.get('image_url') as string,
    category: formData.get('category') as string,
    is_active: formData.get('is_active') === 'true',
    updated_at: new Date().toISOString(),
  };

  const supabase = await createSupabaseServerClient(cookies);
  const { error } = await supabase
    .from('shop_items')
    .update(updatedItem)
    .eq('id', itemId);

  if (error) throw new Error(`Failed to update shop item: ${error.message}`);
  revalidatePath('/shop-items');
  return { success: true };
}

export async function deleteShopItem(itemId: number) {
  await verifyAdminOrSuperAdmin();
  const supabase = await createSupabaseServerClient(cookies);
  const { error } = await supabase.from('shop_items').delete().eq('id', itemId);

  if (error) throw new Error(`Failed to delete shop item: ${error.message}`);
  revalidatePath('/shop-items');
  return { success: true };
}