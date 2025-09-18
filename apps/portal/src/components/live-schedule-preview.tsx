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

type DayGroup = {
  key: string;
  label: string;
  events: ProcessedEvent[];
  firstEventStart: Date;
};

// --- Constants ---
const pixelsPerHour = 100; // Each hour is 100px tall

// --- Main Component ---
export function LiveSchedulePreview({
  showNow = true,
}: { showNow?: boolean } = {}) {
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    const fetchEvents = async (): Promise<void> => {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .order('start_time');

        if (error) {
          console.error('Error fetching events:', error);
          setEvents([]);
        } else {
          setEvents(data || []);
        }
      } catch (error) {
        console.error('Error fetching events:', error);
        setEvents([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();

    // Set up real-time subscription for dynamic updates
    const eventsSubscription = supabase
      .channel('events-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all changes (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'events',
        },
        (payload) => {
          console.log('Events table changed:', payload);
          // Refetch events when database changes
          fetchEvents();
        },
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      eventsSubscription.unsubscribe();
    };
  }, [supabase]);

  // Group events by day and process their layout
  const displayTZ = 'America/Chicago';
  const dayGroups = useMemo(() => {
    if (events.length === 0) {
      return [] as DayGroup[];
    }

    const dayFormatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: displayTZ,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    const labelFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: displayTZ,
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });

    const groups = new Map<string, { label: string; events: ScheduleEvent[] }>();

    events.forEach((event) => {
      const start = new Date(event.start_time);
      const key = dayFormatter.format(start);
      const label = labelFormatter.format(start);

      if (!groups.has(key)) {
        groups.set(key, { label, events: [] });
      }

      groups.get(key)!.events.push(event);
    });

    return Array.from(groups.entries())
      .map(([key, value]) => {
        const processedEvents = processDayLayout(value.events);
        const firstEvent = processedEvents[0];

        return {
          key,
          label: value.label,
          events: processedEvents,
          firstEventStart: firstEvent ? firstEvent.start : new Date(),
        } satisfies DayGroup;
      })
      .sort((a, b) => a.firstEventStart.getTime() - b.firstEventStart.getTime());
  }, [events, displayTZ]);

  useEffect(() => {
    if (dayGroups.length === 0) {
      setSelectedDayKey(null);
      return;
    }

    setSelectedDayKey((current) => {
      if (current && dayGroups.some((group) => group.key === current)) {
        return current;
      }

      return dayGroups[0].key;
    });
  }, [dayGroups]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Icons.spinner className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Show empty state if no events
  if (events.length === 0) {
    return (
      <div className="bg-gradient-to-br from-card to-muted/20 rounded-2xl p-8 border">
        <div className="text-center max-w-md mx-auto">
          <div className="w-16 h-16 mx-auto mb-6 bg-primary/10 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-3">
            Schedule Coming Soon
          </h3>
          <p className="text-muted-foreground leading-relaxed">
            We're putting together an amazing lineup of events for you. Check
            back soon to see what's planned!
          </p>
        </div>
      </div>
    );
  }

  // Get current time in display timezone
  const now = new Date();

  // Find happening now and upcoming events
  const happeningNow = events.filter((event) => {
    const start = new Date(event.start_time);
    const end = new Date(
      event.end_time || new Date(start.getTime() + 60 * 60 * 1000),
    );
    return now >= start && now <= end;
  });

  const upNext = events
    .filter((event) => {
      const start = new Date(event.start_time);
      return start > now;
    })
    .slice(0, 3); // Show next 3 events

  const selectedGroup =
    dayGroups.find((group) => group.key === selectedDayKey) ?? dayGroups[0];

  const formatTimeForDisplay = (
    value: Date | string | null | undefined,
  ): string => {
    if (!value) return '';
    const date = typeof value === 'string' ? new Date(value) : value;

    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: displayTZ,
    });
  };

  const formatChipLabel = (group: DayGroup): string => {
    const date = group.events[0]?.start ?? group.firstEventStart;
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      timeZone: displayTZ,
    });
  };

  const firstEventOfDay = selectedGroup?.events[0];
  const lastEventOfDay = selectedGroup?.events[selectedGroup.events.length - 1];
  const dayTimeRange =
    firstEventOfDay && lastEventOfDay
      ? `${formatTimeForDisplay(firstEventOfDay.start)} – ${formatTimeForDisplay(lastEventOfDay.end)}`
      : '';

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-2xl font-semibold text-foreground">Event Schedule</h2>
        <p className="text-sm text-muted-foreground">
          {events.length} event{events.length !== 1 ? 's' : ''} across {dayGroups.length}{' '}
          day{dayGroups.length !== 1 ? 's' : ''}. Stay on track with the live calendar view.
        </p>
      </header>

      {happeningNow.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 animate-pulse rounded-full bg-destructive" />
            <h3 className="text-lg font-semibold text-foreground">Happening Now</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {happeningNow.map((event) => (
              <EventCardNew key={event.id} event={event} isLive={true} />
            ))}
          </div>
        </section>
      )}

      {upNext.length > 0 && (
        <section className="space-y-4">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <svg
              className="h-5 w-5 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Up Next
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {upNext.map((event) => (
              <EventCardNew key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}

      <section className="space-y-6">
        <div className="flex flex-wrap gap-2">
          {dayGroups.map((group) => {
            const isActive = group.key === selectedGroup?.key;
            return (
              <button
                key={group.key}
                onClick={() => setSelectedDayKey(group.key)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {formatChipLabel(group)}
                <span className="ml-2 text-xs font-normal">
                  {group.events.length} event{group.events.length !== 1 ? 's' : ''}
                </span>
              </button>
            );
          })}
        </div>

        {selectedGroup ? (
          <div className="space-y-6">
            <section className="overflow-hidden rounded-lg border border-border bg-card">
              <div className="flex flex-col gap-3 border-b border-border bg-muted/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {selectedGroup.label}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {dayTimeRange || 'Scroll through the timeline below.'}
                  </p>
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>
                      {firstEventOfDay
                        ? formatTimeForDisplay(firstEventOfDay.start)
                        : '--'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    </svg>
                    <span>
                      {selectedGroup.events.length} event
                      {selectedGroup.events.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>

              <div className="max-h-[520px] overflow-auto px-4 py-6">
                <DayTimeline
                  day={selectedGroup.label}
                  events={selectedGroup.events}
                  showNowBar={showNow}
                />
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2">
              {selectedGroup.events.map((event) => (
                <EventCardNew
                  key={event.id}
                  event={event}
                  isLive={happeningNow.some((live) => live.id === event.id)}
                />
              ))}
            </section>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-muted/20 p-12 text-center text-sm text-muted-foreground">
            We’ll unlock the day view as soon as the first event is published.
          </div>
        )}
      </section>
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

  if (events.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
        No events scheduled yet.
      </div>
    );
  }

  const formatHourLabel = (hourValue: number) => {
    const normalized = ((hourValue % 24) + 24) % 24;
    const suffix = normalized >= 12 ? 'PM' : 'AM';
    const hourDisplay = normalized % 12 === 0 ? 12 : normalized % 12;
    return `${hourDisplay}:00 ${suffix}`;
  };

  return (
    <div className="flex gap-4">
      {/* Time Gutter */}
      <div className="w-20 flex-shrink-0 text-right text-xs text-muted-foreground">
        {hours.map((hour, index) => (
          <div
            key={`${hour}-${index}`}
            style={{ height: `${pixelsPerHour}px` }}
            className="relative flex items-start justify-end pr-2"
          >
            <span className="translate-y-[-10px] font-semibold text-foreground">
              {formatHourLabel(startHour + index)}
            </span>
          </div>
        ))}
      </div>

      {/* Event Container */}
      <div className="relative flex-1 overflow-hidden rounded-lg border border-border/60 bg-muted/20">
        <div className="absolute inset-0">
          {hours.map((hour, index) => (
            <div
              key={`grid-${hour}-${index}`}
              style={{
                top: `${index * pixelsPerHour}px`,
                height: `${pixelsPerHour}px`,
              }}
              className="absolute inset-x-0 border-b border-border/60"
            />
          ))}
        </div>

        {/* Current time bar */}
        {inWindow && (
          <div
            className="pointer-events-none absolute inset-x-0 z-10"
            style={{ top: `${nowTop}px` }}
          >
            <div className="relative">
              <div className="border-t-2 border-destructive/60" />
              <div className="absolute -top-3 right-0 rounded-full bg-destructive/80 px-2 py-0.5 text-[10px] font-semibold text-destructive-foreground shadow">
                Now {nowLabel}
              </div>
            </div>
          </div>
        )}

        {/* Render Events */}
        <div className="relative z-10">
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
  const categoryStyles: Record<string, { card: string; badge: string }> = {
    workshop: {
      card: 'border-primary/40 bg-primary/10',
      badge: 'bg-primary/20 text-primary',
    },
    food: {
      card: 'border-secondary/40 bg-secondary/10',
      badge: 'bg-secondary/20 text-secondary',
    },
    keynote: {
      card: 'border-accent/40 bg-accent/10',
      badge: 'bg-accent/20 text-accent-foreground',
    },
    social: {
      card: 'border-muted-foreground/30 bg-muted/40',
      badge: 'bg-muted-foreground/10 text-muted-foreground',
    },
    general: {
      card: 'border-border/60 bg-background/95',
      badge: 'bg-border/40 text-muted-foreground',
    },
  };

  const style = categoryStyles[event.category] || categoryStyles.general;

  return (
    <Card
      className={`absolute overflow-hidden rounded-lg border shadow-sm transition-colors ${style.card}`}
      style={{
        top: `${event.top}px`,
        height: `${event.height}px`,
        left: `calc(${event.left}% + 0.5%)`,
        width: `calc(${event.width}% - 1%)`,
      }}
    >
      <CardContent className="flex h-full flex-col justify-between gap-2 p-3">
        <div className="space-y-1">
          <div className="flex items-start justify-between gap-2">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${style.badge}`}>
              {event.category}
            </span>
            <span className="text-[10px] font-medium text-muted-foreground">
              {new Date(event.start_time).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'America/Chicago',
              })}
            </span>
          </div>
          <p className="text-sm font-semibold leading-tight text-foreground line-clamp-2">
            {event.title}
          </p>
        </div>

        {event.location && (
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span className="truncate">{event.location}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// --- New Event Card Component ---
function EventCardNew({
  event,
  isLive = false,
}: {
  event: ScheduleEvent;
  isLive?: boolean;
}) {
  const getCategoryStyle = (category: string) => {
    const styles = {
      workshop: 'border-primary/20 bg-primary/5',
      food: 'border-secondary/20 bg-secondary/5',
      keynote: 'border-accent/20 bg-accent/5',
      social: 'border-muted-foreground/20 bg-muted/50',
      general: 'border-border bg-card',
    };
    return styles[category as keyof typeof styles] || styles.general;
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      workshop: 'text-primary',
      food: 'text-secondary',
      keynote: 'text-accent-foreground',
      social: 'text-muted-foreground',
      general: 'text-foreground',
    };
    return colors[category as keyof typeof colors] || colors.general;
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'America/Chicago',
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      timeZone: 'America/Chicago',
    });
  };

  return (
    <Card
      className={`relative p-4 transition-all hover:shadow-md border ${getCategoryStyle(event.category)} ${isLive ? 'ring-2 ring-destructive/50' : ''}`}
    >
      <CardContent className="p-0">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {isLive && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-destructive rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium text-destructive uppercase tracking-wide">
                    LIVE
                  </span>
                </div>
              )}
              <span
                className={`text-xs font-medium px-2 py-1 rounded-full ${getCategoryColor(event.category)} bg-current/10 capitalize`}
              >
                {event.category}
              </span>
            </div>
            <h4 className="font-semibold text-foreground text-base mb-2 line-clamp-2">
              {event.title}
            </h4>
            {event.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {event.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{formatTime(event.start_time)}</span>
              {event.end_time && <span>- {formatTime(event.end_time)}</span>}
            </div>
            <div className="hidden sm:block text-muted-foreground">
              {formatDate(event.start_time)}
            </div>
          </div>
          {event.location && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span className="truncate max-w-[120px]">{event.location}</span>
            </div>
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
