'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { createShopItem, updateShopItem } from '../actions';

export type ShopItem = {
  id: number;
  name: string;
  description: string | null;
  point_cost: number;
  stock: number | null;
  image_url: string | null;
  category: string;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

type ShopItemFormProps = {
  item?: ShopItem | null;
  onComplete: () => void;
};

export function ShopItemForm({ item, onComplete }: ShopItemFormProps) {
  const formAction = item ? updateShopItem : createShopItem;

  return (
    <form
      action={async (formData) => {
        await formAction(formData);
        onComplete();
      }}
      className="space-y-4 pt-4"
    >
      {item && <input type="hidden" name="id" value={item.id} />}

      <div className="space-y-2">
        <Label htmlFor="name">Item Name</Label>
        <Input id="name" name="name" defaultValue={item?.name} required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="point_cost">Point Cost</Label>
          <Input
            id="point_cost"
            name="point_cost"
            type="number"
            defaultValue={item?.point_cost || 10}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="stock">Stock (leave empty for unlimited)</Label>
          <Input
            id="stock"
            name="stock"
            type="number"
            defaultValue={item?.stock || ''}
            placeholder="Unlimited"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Input
          id="category"
          name="category"
          defaultValue={item?.category || 'general'}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="is_active"
          name="is_active"
          value="true"
          defaultChecked={item?.is_active ?? true}
        />
        <Label htmlFor="is_active" className="cursor-pointer">
          Active (users can purchase this item)
        </Label>
      </div>

      <div className="flex justify-end">
        <Button type="submit">
          {item ? 'Update Shop Item' : 'Create Shop Item'}
        </Button>
      </div>
    </form>
  );
}