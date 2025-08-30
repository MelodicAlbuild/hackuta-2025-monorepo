'use client';

import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@repo/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin } from 'lucide-react';
import { Icons } from '@/components/icons';

// 1. Define the exact shape of a schedule event
type ScheduleEvent = {
  id: number;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string | null;
  location: string | null;
  category: string;
  created_by: string | null;
  created_at: string;
};

// 2. Helper to format time with explicit types
const formatTime = (dateStr: string): string => {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

// 3. Fully-typed component for a single event card
function EventCard({ event }: { event: ScheduleEvent }) {
  const categoryColors: Record<string, string> = {
    workshop: 'bg-indigo-500',
    food: 'bg-orange-500',
    keynote: 'bg-rose-500',
    social: 'bg-teal-500',
    general: 'bg-blue-500',
  };

  const bgColor = categoryColors[event.category] || 'bg-gray-500';

  return (
    <div className="flex items-start gap-4">
      <div className="flex flex-col items-center flex-shrink-0">
        <div className="w-20 text-right font-semibold text-gray-800">
          {formatTime(event.start_time)}
        </div>
        {event.end_time && (
          <div className="text-xs text-gray-500">
            til {formatTime(event.end_time)}
          </div>
        )}
      </div>
      <div className="relative w-full pl-4 border-l-2 border-gray-200">
        <div
          className={`absolute -left-[9px] top-1 h-4 w-4 rounded-full ${bgColor} border-2 border-white`}
        ></div>
        <Card>
          <CardHeader className="pb-4">
            <CardTitle>{event.title}</CardTitle>
          </CardHeader>
          <CardContent>
            {event.description && (
              <p className="text-gray-600 mb-4 whitespace-pre-wrap">
                {event.description}
              </p>
            )}
            {event.location && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <MapPin className="h-4 w-4" />
                <span>{event.location}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function LiveSchedulePreview() {
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    const fetchEvents = async (): Promise<void> => {
      // Don't set loading to true here to avoid flicker on real-time updates
      const { data } = await supabase
        .from('events')
        .select('*')
        .order('start_time');
      setEvents(data || []);
      setIsLoading(false); // Only set loading to false after the initial fetch
    };

    fetchEvents();

    const channel = supabase
      .channel('events-channel-admin')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'events' },
        (_payload) => {
          // When any change happens, just re-fetch the whole list to ensure order
          fetchEvents();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Icons.spinner className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Group events by day
  const eventsByDay = events.reduce(
    (acc: Record<string, ScheduleEvent[]>, event: ScheduleEvent) => {
      const day = new Date(event.start_time).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      });
      if (!acc[day]) {
        acc[day] = [];
      }
      acc[day].push(event);
      return acc;
    },
    {},
  );

  return (
    <div className="p-4 space-y-8">
      {Object.keys(eventsByDay).length > 0 ? (
        Object.entries(eventsByDay).map(([day, dayEvents]) => (
          <div key={day}>
            <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">
              {day}
            </h2>
            <div className="space-y-6">
              {dayEvents.map((event: ScheduleEvent) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        ))
      ) : (
        <p className="text-center text-gray-500 py-12">
          No events scheduled yet.
        </p>
      )}
    </div>
  );
}
