'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { EventForm, ScheduleEvent } from './event-form';
import { deleteEvent } from '../actions';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';

export function EventManager({
  initialEvents,
}: {
  initialEvents: ScheduleEvent[];
}) {
  // State to control which dialog is open
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);

  const formatDate = (dateStr: string | undefined) =>
    dateStr ? new Date(dateStr).toLocaleString() : 'N/A';

  return (
    <>
      <div className="space-y-4">
        <Button onClick={() => setIsCreateOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create New Event
        </Button>

        <div className="border rounded-lg">
          <ul className="divide-y divide-gray-200">
            {initialEvents.map((event) => (
              <li
                key={event.id}
                className="p-4 flex justify-between items-center"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{event.title}</p>
                    {event.description && (
                      <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold bg-amber-500/20 text-amber-700 border border-amber-400/40">
                        {event.description} pts
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {formatDate(event.start_time)}
                    {event.location ? ` - ${event.location}` : ''}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditingEvent(event)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => {
                      if (
                        confirm('Are you sure you want to delete this event?')
                      ) {
                        deleteEvent(event.id);
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

      {/* Dialog for Creating an Event */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Event</DialogTitle>
          </DialogHeader>
          <EventForm onComplete={() => setIsCreateOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Dialog for Editing an Event */}
      <Dialog
        open={!!editingEvent}
        onOpenChange={(isOpen) => !isOpen && setEditingEvent(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
          </DialogHeader>
          <EventForm
            event={editingEvent}
            onComplete={() => setEditingEvent(null)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
