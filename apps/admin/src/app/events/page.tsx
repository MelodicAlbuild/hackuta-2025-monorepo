import { LiveSchedulePreview } from '@/components/live-schedule-preview'; // A preview version
import { EventManager } from './_components/event-manager';
import { createSupabaseServerClient } from '@repo/supabase/server';
import { cookies } from 'next/headers';

export default async function EventsPage() {
  const supabase = await createSupabaseServerClient(cookies);
  const { data: initialEvents } = await supabase
    .from('events')
    .select('*')
    .order('start_time');

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">Manage Schedule</h2>
        <EventManager initialEvents={initialEvents || []} />
      </div>
      <div>
        <h2 className="text-2xl font-bold mb-4">Live Preview</h2>
        <div className="border rounded-lg h-[80vh] overflow-y-auto">
          <LiveSchedulePreview />
        </div>
      </div>
    </div>
  );
}
