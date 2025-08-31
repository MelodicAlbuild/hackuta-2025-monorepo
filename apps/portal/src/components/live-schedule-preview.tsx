'use client';

import { useEffect, useState, useMemo } from 'react';
import { createSupabaseBrowserClient } from '@repo/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { startOfDay, differenceInMinutes } from 'date-fns';

// --- Type Definitions ---
type ScheduleEvent = {
  id: number;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string | null;
  location: string | null;
  category: string;
};

// A "processed" event includes layout properties
type ProcessedEvent = ScheduleEvent & {
  top: number;
  height: number;
  left: number;
  width: number;
  start: Date;
  end: Date;
};

// --- Constants ---
const pixelsPerHour = 100; // Each hour is 100px tall

// --- Main Component ---
export function LiveSchedulePreview({
  showNow = true,
}: { showNow?: boolean } = {}) {
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    const fetchEvents = async (): Promise<void> => {
      const { data } = await supabase
        .from('feature_flags')
        .select('value')
        .eq('name', 'show_full_schedule');
      const value = data && data.length > 0 ? data[0].value : undefined;
      if (value === 'true') {
        const { data } = await supabase
          .from('events')
          .select('*')
          .order('start_time');
        setEvents(data || []);
      } else {
        setEvents([
          {
            id: 1,
            title: 'Hacking Starts',
            description: '',
            start_time: '2025-10-04T11:00:00-05:00',
            end_time: '2025-10-04T12:00:00-05:00',
            location: 'SWSH Commons',
            category: 'keynote',
          },
        ]);
      }
      setIsLoading(false);
    };
    fetchEvents();
  }, [supabase]);

  // Group events by day and process their layout
  const displayTZ = 'America/Chicago';
  const eventsByDay = useMemo(() => {
    const grouped = events.reduce(
      (acc: Record<string, ScheduleEvent[]>, event) => {
        const day = new Date(event.start_time).toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          timeZone: displayTZ,
        });
        if (!acc[day]) acc[day] = [];
        acc[day].push(event);
        return acc;
      },
      {},
    );

    // Run the layout algorithm on each day's events
    Object.keys(grouped).forEach((day) => {
      grouped[day] = processDayLayout(grouped[day]) as ScheduleEvent[];
    });
    return grouped;
  }, [events]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Icons.spinner className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-12">
      {Object.entries(eventsByDay).map(([day, dayEvents]) => (
        <DayTimeline
          key={day}
          day={day}
          events={dayEvents as ProcessedEvent[]}
          showNowBar={showNow}
        />
      ))}
    </div>
  );
}

// --- Day Timeline Component ---
function DayTimeline({
  day,
  events,
  showNowBar = true,
}: {
  day: string;
  events: ProcessedEvent[];
  showNowBar?: boolean;
}) {
  // Determine the first hour to display and number of hours to cover
  const earliestStartMs = Math.min(...events.map((e) => e.start.getTime()));
  const latestEndMs = Math.max(...events.map((e) => e.end.getTime()));
  const earliest = new Date(earliestStartMs);
  const baseStart = new Date(
    startOfDay(earliest).setHours(earliest.getHours(), 0, 0, 0),
  );
  const hoursCount = Math.max(
    1,
    Math.ceil(differenceInMinutes(new Date(latestEndMs), baseStart) / 60) + 1,
  );
  const startHour = earliest.getHours();
  const hours = Array.from(
    { length: hoursCount },
    (_, i) => (startHour + i) % 24,
  );

  // Live-updating current time bar (America/Chicago)
  const displayTZ = 'America/Chicago';
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  const nowDayLabel = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: displayTZ,
  });
  const isToday = nowDayLabel === day;
  const nowZoned = zonedDate(now, displayTZ);
  const windowEnd = new Date(baseStart.getTime() + hoursCount * 60 * 60 * 1000);
  const inWindow =
    showNowBar && isToday && nowZoned >= baseStart && nowZoned <= windowEnd;
  const nowTop = inWindow
    ? differenceInMinutes(nowZoned, baseStart) * (pixelsPerHour / 60)
    : 0;
  const nowLabel = now.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: displayTZ,
  });

  return (
    <div>
      <h2 className="text-2xl font-bold text-center my-6 sticky top-0 backdrop-blur-sm z-20 py-2">
        {day}
      </h2>
      <div className="flex">
        {/* Time Gutter */}
        <div className="w-20 text-right pr-4 text-sm text-gray-500 flex-shrink-0">
          {hours.map((hour) => (
            <div
              key={hour}
              style={{ height: `${pixelsPerHour}px` }}
              className="relative -top-3"
            >
              <span className="font-semibold">
                {hour % 12 === 0 ? 12 : hour % 12}
              </span>
              <span className="text-xs">{hour < 12 ? ' AM' : ' PM'}</span>
            </div>
          ))}
        </div>

        {/* Event Container */}
        <div className="flex-1 bg-gray-50 rounded-lg relative border-l border-gray-200">
          {/* Hour Lines */}
          {hours.map((hour) => (
            <div
              key={hour}
              style={{ height: `${pixelsPerHour}px` }}
              className="border-t border-gray-200"
            />
          ))}
          {/* Current time bar */}
          {inWindow && (
            <div
              className="absolute inset-x-0 z-10 pointer-events-none"
              style={{ top: `${nowTop}px` }}
            >
              <div className="relative">
                <div className="border-t-2 border-red-500/60" />
                <div className="absolute -top-3 right-0 bg-red-500/80 text-white/95 text-[10px] px-1.5 py-0.5 rounded">
                  Now {nowLabel}
                </div>
              </div>
            </div>
          )}
          {/* Render Events */}
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Event Card Component ---
function EventCard({ event }: { event: ProcessedEvent }) {
  const categoryStyles: Record<string, string> = {
    workshop: 'bg-indigo-100 border-indigo-500 text-indigo-800',
    food: 'bg-orange-100 border-orange-500 text-orange-800',
    keynote: 'bg-rose-100 border-rose-500 text-rose-800',
    social: 'bg-teal-100 border-teal-500 text-teal-800',
    general: 'bg-blue-100 border-blue-500 text-blue-800',
  };
  const style = categoryStyles[event.category] || categoryStyles.general;

  return (
    <Card
      className={`absolute p-2 rounded-lg text-xs overflow-hidden border-l-4 ${style}`}
      style={{
        top: `${event.top}px`,
        height: `${event.height}px`,
        left: `${event.left}%`,
        width: `${event.width}%`,
      }}
    >
      <CardContent className="p-1 translate-y-[-10px]">
        <p className="font-bold">{event.title}</p>
        <div className="flex justify-between items-center">
          <p className="text-xs">
            {new Date(event.start_time).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              timeZone: 'America/Chicago',
            })}
          </p>
          {event.location && (
            <p className="text-muted-foreground mt-1 truncate">
              {event.location}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// --- The Layout Algorithm ---
function processDayLayout(dayEvents: ScheduleEvent[]): ProcessedEvent[] {
  const processedEvents: ProcessedEvent[] = dayEvents
    .map((e) => ({
      ...e,
      // Convert the stored UTC time into America/Chicago wall time Date objects
      start: zonedDate(new Date(e.start_time), 'America/Chicago'),
      end: zonedDate(
        new Date(
          e.end_time ||
            new Date(new Date(e.start_time).getTime() + 60 * 60 * 1000),
        ),
        'America/Chicago',
      ), // Default 1 hour
      top: 0,
      height: 0,
      left: 0,
      width: 0,
    }))
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  // Choose the day's schedule start hour from the earliest event
  const dayScheduleStartHour = processedEvents.length
    ? Math.floor(processedEvents[0].start.getHours())
    : 8; // fallback

  const columns: ProcessedEvent[][] = [];
  let lastEventEnd: Date | null = null;

  processedEvents.forEach((event) => {
    // If this event starts after the last cluster ended, pack the previous cluster and start a new one.
    if (lastEventEnd !== null && event.start >= lastEventEnd) {
      packColumns(columns, dayScheduleStartHour);
      columns.length = 0; // Reset columns for the new cluster
      lastEventEnd = null;
    }

    // Find a column for the event
    let placed = false;
    for (const col of columns) {
      if (col[col.length - 1].end <= event.start) {
        col.push(event);
        placed = true;
        break;
      }
    }

    // If no column was found, create a new one
    if (!placed) {
      columns.push([event]);
    }

    // Update the end time of the current cluster
    if (lastEventEnd === null || event.end > lastEventEnd) {
      lastEventEnd = event.end;
    }
  });

  // Pack the last cluster of events
  if (columns.length > 0) {
    packColumns(columns, dayScheduleStartHour);
  }

  return processedEvents;
}

function packColumns(
  columns: ProcessedEvent[][],
  dayScheduleStartHour: number,
) {
  const numColumns = columns.length;
  const colWidth = 100 / numColumns;
  const gap = 1; // 1% gap between cards

  columns.forEach((col, colIndex) => {
    col.forEach((event) => {
      const dayStart = startOfDay(event.start);
      const scheduleStart = new Date(
        dayStart.setHours(dayScheduleStartHour, 0, 0, 0),
      );

      event.top =
        differenceInMinutes(event.start, scheduleStart) * (pixelsPerHour / 60);
      event.height = Math.max(
        30,
        differenceInMinutes(event.end, event.start) * (pixelsPerHour / 60),
      ); // Min height for a 30-min event

      event.left = colIndex * colWidth;
      event.width = colWidth - gap;
    });
  });
}

// Convert a UTC Date into a Date that represents the same wall-clock time in a given IANA timezone.
// Note: This returns a Date object whose fields (getHours, etc.) reflect the zone's local time, but
// the internal epoch stays UTC. It's sufficient for layout math and formatting in this component.
function zonedDate(date: Date, timeZone: string): Date {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const parts = dtf.formatToParts(date);
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  const y = parseInt(map.year, 10);
  const m = parseInt(map.month, 10) - 1;
  const d = parseInt(map.day, 10);
  const hh = parseInt(map.hour, 10);
  const mm = parseInt(map.minute, 10);
  const ss = parseInt(map.second, 10);
  return new Date(y, m, d, hh, mm, ss, 0);
}
