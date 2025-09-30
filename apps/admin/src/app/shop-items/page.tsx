import { ShopItemManager } from './_components/shop-item-manager';
import { createSupabaseServerClient } from '@repo/supabase/server';
import { cookies } from 'next/headers';

export default async function ShopItemsPage() {
  const supabase = await createSupabaseServerClient(cookies);
  const { data: initialItems } = await supabase
    .from('shop_items')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Manage Shop Items</h2>
      <p className="text-muted-foreground mb-6">
        Create and manage shop items that participants can purchase with points.
      </p>
      <ShopItemManager initialItems={initialItems || []} />
    </div>
  );
}