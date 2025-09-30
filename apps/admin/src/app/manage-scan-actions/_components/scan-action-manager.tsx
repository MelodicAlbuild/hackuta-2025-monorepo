'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScanActionForm, ScanAction } from './scan-action-form';
import { deleteScanAction } from '../actions';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';

export function ScanActionManager({
  initialActions,
}: {
  initialActions: ScanAction[];
}) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingAction, setEditingAction] = useState<ScanAction | null>(null);

  const formatDate = (dateStr: string | undefined) =>
    dateStr ? new Date(dateStr).toLocaleString() : 'N/A';

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      ceremony: 'bg-purple-100 text-purple-800',
      hacking: 'bg-blue-100 text-blue-800',
      workshop: 'bg-green-100 text-green-800',
      food: 'bg-orange-100 text-orange-800',
      activity: 'bg-pink-100 text-pink-800',
      quiet: 'bg-gray-100 text-gray-800',
      judging: 'bg-red-100 text-red-800',
      milestone: 'bg-yellow-100 text-yellow-800',
      general: 'bg-slate-100 text-slate-800',
    };
    return colors[category] || colors.general;
  };

  return (
    <>
      <div className="space-y-4">
        <Button onClick={() => setIsCreateOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create New Action
        </Button>

        <div className="border rounded-lg">
          <ul className="divide-y divide-gray-200">
            {initialActions.map((action) => (
              <li
                key={action.id}
                className="p-4 flex justify-between items-start"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold">{action.name}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${getCategoryBadge(action.category)}`}>
                      {action.category}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${action.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {action.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {action.description && (
                    <p className="text-sm text-gray-600 mb-2">
                      {action.description}
                    </p>
                  )}
                  <div className="flex gap-4 text-sm text-gray-500">
                    <span className="font-semibold text-green-600">
                      +{action.points_value} points
                    </span>
                    <span>Start: {formatDate(action.start_time)}</span>
                    <span>End: {formatDate(action.end_time)}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditingAction(action)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => {
                      if (
                        confirm(
                          'Are you sure you want to delete this action?'
                        )
                      ) {
                        deleteScanAction(action.id);
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

      {/* Dialog for Creating an Action */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Action</DialogTitle>
          </DialogHeader>
          <ScanActionForm onComplete={() => setIsCreateOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Dialog for Editing an Action */}
      <Dialog
        open={!!editingAction}
        onOpenChange={(isOpen) => !isOpen && setEditingAction(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Action</DialogTitle>
          </DialogHeader>
          <ScanActionForm
            action={editingAction}
            onComplete={() => setEditingAction(null)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}