'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { createScanAction, updateScanAction } from '../actions';

export type ScanAction = {
  id: number;
  name: string;
  description: string | null;
  points_value: number;
  action_type: string;
  category: string;
  color: string;
  is_active: boolean;
  start_time: string;
  end_time: string;
  show_minutes_before: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

type ScanActionFormProps = {
  action?: ScanAction | null;
  onComplete: () => void;
};

const toDateTimeLocal = (dateStr: string | undefined) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
};

export function ScanActionForm({ action, onComplete }: ScanActionFormProps) {
  const formAction = action ? updateScanAction : createScanAction;

  return (
    <form
      action={async (formData) => {
        await formAction(formData);
        onComplete();
      }}
      className="space-y-4 pt-4"
    >
      <input
        type="hidden"
        name="tz"
        value={Intl.DateTimeFormat().resolvedOptions().timeZone}
      />
      {action && <input type="hidden" name="id" value={action.id} />}

      <div className="space-y-2">
        <Label htmlFor="name">Action Name</Label>
        <Input id="name" name="name" defaultValue={action?.name} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="points_value">Points to Award</Label>
        <Input
          id="points_value"
          name="points_value"
          type="number"
          defaultValue={action?.points_value || 10}
          required
          min="1"
        />
      </div>
      <input type="hidden" name="action_type" value="add" />

      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Select name="category" defaultValue={action?.category || 'general'}>
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
            <SelectItem value="general">General</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_time">Start Time</Label>
          <Input
            id="start_time"
            name="start_time"
            type="datetime-local"
            defaultValue={toDateTimeLocal(action?.start_time)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end_time">End Time</Label>
          <Input
            id="end_time"
            name="end_time"
            type="datetime-local"
            defaultValue={toDateTimeLocal(action?.end_time)}
            required
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="is_active"
          name="is_active"
          value="true"
          defaultChecked={action?.is_active ?? true}
        />
        <Label htmlFor="is_active" className="cursor-pointer">
          Active (users can scan for this action)
        </Label>
      </div>

      <div className="flex justify-end">
        <Button type="submit">
          {action ? 'Update Action' : 'Create Action'}
        </Button>
      </div>
    </form>
  );
}