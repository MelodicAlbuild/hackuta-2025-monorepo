'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createEvent, updateEvent } from '../actions';

export type ScheduleEvent = {
  id: number;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string | null;
  location: string | null;
  category: string;
};

type EventFormProps = {
  event?: ScheduleEvent | null;
  onComplete: () => void;
};

// Helper to format dates for the datetime-local input
const toDateTimeLocal = (dateStr: string | undefined) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
};

export function EventForm({ event, onComplete }: EventFormProps) {
  const action = event ? updateEvent : createEvent;

  return (
    <form
      action={async (formData) => {
        await action(formData);
        onComplete();
      }}
      className="space-y-4 pt-4"
    >
      {/* Pass client timezone to the server action so we can convert properly */}
      <input
        type="hidden"
        name="tz"
        value={Intl.DateTimeFormat().resolvedOptions().timeZone}
      />
      {event && <input type="hidden" name="id" value={event.id} />}

      <div className="space-y-2">
        <Label htmlFor="title">Event Title</Label>
        <Input id="title" name="title" defaultValue={event?.title} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Points</Label>
        <Input
          id="description"
          name="description"
          type="number"
          placeholder="Enter points value"
          defaultValue={event?.description ? event.description : ''}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_time">Start Time</Label>
          <Input
            id="start_time"
            name="start_time"
            type="datetime-local"
            defaultValue={toDateTimeLocal(event?.start_time)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end_time">End Time (Optional)</Label>
          <Input
            id="end_time"
            name="end_time"
            type="datetime-local"
            defaultValue={
              event?.end_time ? toDateTimeLocal(event?.end_time) : ''
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            name="location"
            defaultValue={event?.location ? event.location : ''}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select name="category" defaultValue={event?.category || 'activity'}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ceremony">Ceremony</SelectItem>
              <SelectItem value="hacking">Hacking</SelectItem>
              <SelectItem value="workshop">Workshop</SelectItem>
              <SelectItem value="food">Food</SelectItem>
              <SelectItem value="activity">Mini Event</SelectItem>
              <SelectItem value="quiet">Quiet Hours</SelectItem>
              <SelectItem value="judging">Judging</SelectItem>
              <SelectItem value="milestone">Milestone</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit">{event ? 'Update Event' : 'Create Event'}</Button>
      </div>
    </form>
  );
}
