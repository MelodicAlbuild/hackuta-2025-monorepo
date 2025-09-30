'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShopItemForm, ShopItem } from './shop-item-form';
import { deleteShopItem } from '../actions';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';

export function ShopItemManager({
  initialItems,
}: {
  initialItems: ShopItem[];
}) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ShopItem | null>(null);

  return (
    <>
      <div className="space-y-4">
        <Button onClick={() => setIsCreateOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create New Shop Item
        </Button>

        <div className="border rounded-lg">
          <ul className="divide-y divide-gray-200">
            {initialItems.map((item) => (
              <li
                key={item.id}
                className="p-4 flex justify-between items-start"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg">{item.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${item.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {item.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                      {item.category}
                    </span>
                  </div>
                  {item.description && (
                    <p className="text-sm text-gray-600 mb-2">
                      {item.description}
                    </p>
                  )}
                  <div className="flex gap-4 text-sm text-gray-500">
                    <span className="font-semibold text-blue-600">
                      {item.point_cost} points
                    </span>
                    <span>
                      Stock: {item.stock === null ? '∞' : item.stock}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditingItem(item)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => {
                      if (
                        confirm('Are you sure you want to delete this item?')
                      ) {
                        deleteShopItem(item.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Dialog for Creating a Shop Item */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Shop Item</DialogTitle>
          </DialogHeader>
          <ShopItemForm onComplete={() => setIsCreateOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Dialog for Editing a Shop Item */}
      <Dialog
        open={!!editingItem}
        onOpenChange={(isOpen) => !isOpen && setEditingItem(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Shop Item</DialogTitle>
          </DialogHeader>
          <ShopItemForm
            item={editingItem}
            onComplete={() => setEditingItem(null)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}