'use client';

import { useMemo, useState, useEffect } from 'react';
import {
  type LucideIcon,
  Sparkles,
  Code2,
  Wrench,
  UtensilsCrossed,
  PartyPopper,
  Moon,
  Gavel,
  Flag,
  Loader2,
} from 'lucide-react';

// Database event type (what we get from the API)
type DatabaseEvent = {
  id: number;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string | null;
  location: string | null;
  category: string;
  created_by: string;
  created_at: string;
};

// Types for schedule data structure
export type ScheduleCategory =
  | 'ceremony'
  | 'hacking'
  | 'workshop'
  | 'food'
  | 'activity'
  | 'quiet'
  | 'judging'
  | 'milestone';

export type ScheduleDay = {
  id: string;
  title: string;
  date: string;
  summary: string;
  slots: ScheduleSlot[];
};

export type ScheduleSlot = {
  timeRange: string;
  highlight?: boolean;
  events: ScheduleEvent[];
};

export type ScheduleEvent = {
  title: string;
  type: ScheduleCategory;
  start: string;
  end?: string;
  location?: string;
};

const categoryStyles: Record<
  ScheduleCategory,
  { label: string; badgeClass: string; dotClass: string; icon: LucideIcon }
> = {
  ceremony: {
    label: 'Ceremony',
    badgeClass: 'bg-amber-500/10 text-amber-100 border border-amber-400/30',
    dotClass: 'bg-amber-300',
    icon: Sparkles,
  },
  hacking: {
    label: 'Hacking',
    badgeClass:
      'bg-emerald-500/10 text-emerald-100 border border-emerald-400/30',
    dotClass: 'bg-emerald-300',
    icon: Code2,
  },
  workshop: {
    label: 'Workshop',
    badgeClass: 'bg-sky-500/10 text-sky-100 border border-sky-400/30',
    dotClass: 'bg-sky-300',
    icon: Wrench,
  },
  food: {
    label: 'Food',
    badgeClass: 'bg-orange-500/10 text-orange-100 border border-orange-400/30',
    dotClass: 'bg-orange-300',
    icon: UtensilsCrossed,
  },
  activity: {
    label: 'Mini Event',
    badgeClass: 'bg-purple-500/10 text-purple-100 border border-purple-400/30',
    dotClass: 'bg-purple-300',
    icon: PartyPopper,
  },
  quiet: {
    label: 'Quiet Hours',
    badgeClass: 'bg-gray-500/10 text-gray-100 border border-gray-300/30',
    dotClass: 'bg-gray-300',
    icon: Moon,
  },
  judging: {
    label: 'Judging',
    badgeClass: 'bg-rose-500/10 text-rose-100 border border-rose-400/30',
    dotClass: 'bg-rose-300',
    icon: Gavel,
  },
  milestone: {
    label: 'Milestone',
    badgeClass: 'bg-white/10 text-white border border-white/40',
    dotClass: 'bg-white',
    icon: Flag,
  },
};

type ScheduleFilterKey = 'all' | 'main' | 'workshop' | 'activity' | 'food';

type CategoryFilter = {
  id: ScheduleFilterKey;
  label: string;
  match: (category: ScheduleCategory) => boolean;
};

const MAIN_EVENT_TYPES: ScheduleCategory[] = [
  'ceremony',
  'hacking',
  'judging',
  'milestone',
  'quiet',
];

const categoryFilters: CategoryFilter[] = [
  {
    id: 'all',
    label: 'All Events',
    match: () => true,
  },
  {
    id: 'main',
    label: 'Main Events',
    match: (category) => MAIN_EVENT_TYPES.includes(category),
  },
  {
    id: 'workshop',
    label: 'Workshops',
    match: (category) => category === 'workshop',
  },
  {
    id: 'activity',
    label: 'Mini Events',
    match: (category) => category === 'activity',
  },
  {
    id: 'food',
    label: 'Food',
    match: (category) => category === 'food',
  },
];

type DisplayEvent = {
  id: string;
  time: string;
  title: string;
  location?: string;
  type: ScheduleCategory;
};

// Helper function to format time display
function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/Chicago',
  });
}

// Helper function to format date for day titles
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/Chicago',
  });
}

// Helper function to get day key for grouping
function getDayKey(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    timeZone: 'America/Chicago',
  });
}

// Map database category to ScheduleCategory
function mapCategory(category: string): ScheduleCategory {
  // Valid schedule categories
  const validCategories: ScheduleCategory[] = [
    'ceremony',
    'hacking',
    'workshop',
    'food',
    'activity',
    'quiet',
    'judging',
    'milestone',
  ];

  // Return the category if it's valid, otherwise default to 'activity'
  return validCategories.includes(category as ScheduleCategory)
    ? (category as ScheduleCategory)
    : 'activity';
}

// Transform database events into the day/slot structure
function transformEventsToSchedule(events: DatabaseEvent[]): ScheduleDay[] {
  // Separate pre-workshop events (negative IDs) from regular events
  const preWorkshopEvents = events.filter((event) => event.id < 0);
  const regularEvents = events.filter((event) => event.id >= 0);

  const scheduleDays: ScheduleDay[] = [];

  // Create Pre-Event Workshops day if there are any pre-workshop events
  if (preWorkshopEvents.length > 0) {
    // Sort pre-workshop events by start time
    const sortedPreEvents = preWorkshopEvents.sort(
      (a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
    );

    // Create slots for pre-workshop events
    const preWorkshopSlots: ScheduleSlot[] = sortedPreEvents.map((event) => {
      const startTime = formatTime(event.start_time);
      const endTime = event.end_time ? formatTime(event.end_time) : null;
      const timeRange = endTime ? `${startTime} – ${endTime}` : startTime;
      const eventDate = formatDate(event.start_time);

      return {
        timeRange: `${eventDate} • ${timeRange}`,
        events: [
          {
            title: event.title,
            type: mapCategory(event.category),
            start: startTime,
            end: endTime || undefined,
            location: event.location || undefined,
          },
        ],
      };
    });

    scheduleDays.push({
      id: 'pre-event-workshops',
      title: 'Pre-Event Workshops',
      date: 'Before HackUTA',
      summary: 'Workshop sessions to prepare for the hackathon',
      slots: preWorkshopSlots,
    });
  }

  // Group regular events by day
  const eventsByDay = regularEvents.reduce(
    (acc, event) => {
      const dayKey = getDayKey(event.start_time);
      if (!acc[dayKey]) {
        acc[dayKey] = [];
      }
      acc[dayKey].push(event);
      return acc;
    },
    {} as Record<string, DatabaseEvent[]>,
  );

  // Convert each day to ScheduleDay format
  const regularDays = Object.entries(eventsByDay).map(([dayKey, dayEvents]) => {
    // Sort events by start time
    const sortedEvents = dayEvents.sort(
      (a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
    );

    const firstEvent = sortedEvents[0];
    const dayDate = formatDate(firstEvent.start_time);

    // Create slots with events
    const slots: ScheduleSlot[] = sortedEvents.map((event) => {
      const startTime = formatTime(event.start_time);
      const endTime = event.end_time ? formatTime(event.end_time) : null;
      const timeRange = endTime ? `${startTime} – ${endTime}` : startTime;

      return {
        timeRange,
        events: [
          {
            title: event.title,
            type: mapCategory(event.category),
            start: startTime,
            end: endTime || undefined,
            location: event.location || undefined,
          },
        ],
      };
    });

    return {
      id: `day-${dayKey}`,
      title: `Day ${Object.keys(eventsByDay).indexOf(dayKey) + 1}`,
      date: dayDate,
      summary: `Events for ${dayDate}`,
      slots,
    };
  });

  // Return pre-event workshops first, then regular days
  return [...scheduleDays, ...regularDays];
}

// Pre-HACKUTA workshops (hardcoded)
const preHackutaWorkshops: DatabaseEvent[] = [
  {
    id: -1,
    title: 'Intro to React w/ MOBI',
    description:
      'Pre-HACKUTA Workshop: Learn the fundamentals of React development',
    start_time: '2025-09-29T17:30:00-05:00', // Sept 29, 2025, 5:30 PM CDT
    end_time: '2025-09-29T18:30:00-05:00', // Sept 29, 2025, 6:30 PM CDT
    location: 'SEIR 194',
    category: 'workshop',
    created_by: 'system',
    created_at: new Date().toISOString(),
  },
  {
    id: -2,
    title: 'Full Stack Development',
    description:
      'Pre-HACKUTA Workshop: Complete web development from frontend to backend',
    start_time: '2025-10-02T16:00:00-05:00', // Oct 2, 2025, 4:00 PM CDT
    end_time: '2025-10-02T17:30:00-05:00', // Oct 2, 2025, 5:30 PM CDT
    location: 'SEIR 198',
    category: 'workshop',
    created_by: 'system',
    created_at: new Date().toISOString(),
  },
  {
    id: -3,
    title: 'Team Mixer',
    description: 'Pre-HACKUTA Workshop: Meet other participants and form teams',
    start_time: '2025-10-02T17:30:00-05:00', // Oct 2, 2025, 5:30 PM CDT
    end_time: '2025-10-02T18:30:00-05:00', // Oct 2, 2025, 6:30 PM CDT
    location: 'SEIR 198',
    category: 'activity',
    created_by: 'system',
    created_at: new Date().toISOString(),
  },
  {
    id: -4,
    title: 'Intro to Python',
    description: 'Pre-HACKUTA Workshop: Python programming fundamentals',
    start_time: '2025-10-02T17:30:00-05:00', // Oct 2, 2025, 5:30 PM CDT
    end_time: '2025-10-02T18:30:00-05:00', // Oct 2, 2025, 6:30 PM CDT
    location: 'Online',
    category: 'workshop',
    created_by: 'system',
    created_at: new Date().toISOString(),
  },
];

export default function Schedule() {
  const [events, setEvents] = useState<DatabaseEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch events from API
  useEffect(() => {
    async function fetchEvents() {
      try {
        const response = await fetch('/api/events');
        if (!response.ok) {
          throw new Error('Failed to fetch events');
        }
        const data = await response.json();
        // Combine API events with hardcoded pre-HACKUTA workshops
        const allEvents = [...preHackutaWorkshops, ...(data.events || [])];
        setEvents(allEvents);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load schedule',
        );
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, []);

  // Transform events into schedule format
  const schedule = useMemo(() => transformEventsToSchedule(events), [events]);

  const [activeDayId, setActiveDayId] = useState(() => schedule[0]?.id ?? '');
  const activeDay = useMemo(
    () => schedule.find((day) => day.id === activeDayId) ?? schedule[0],
    [activeDayId, schedule],
  );

  // Update active day when schedule changes
  useEffect(() => {
    if (schedule.length > 0 && !activeDayId) {
      setActiveDayId(schedule[0].id);
    }
  }, [schedule, activeDayId]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 sm:mb-12 text-center">
          <h2 className="text-3xl sm:text-5xl font-bold text-white">
            HackUTA Schedule
          </h2>
          <p className="mt-3 text-base sm:text-lg text-gray-300 font-franklinGothic max-w-2xl mx-auto">
            A clear look at everything happening across the weekend.
          </p>
        </div>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-red-400" />
          <span className="ml-3 text-gray-300">Loading schedule...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 sm:mb-12 text-center">
          <h2 className="text-3xl sm:text-5xl font-bold text-white">
            HackUTA Schedule
          </h2>
          <p className="mt-3 text-base sm:text-lg text-gray-300 font-franklinGothic max-w-2xl mx-auto">
            A clear look at everything happening across the weekend.
          </p>
        </div>
        <div className="text-center py-20">
          <p className="text-red-400 mb-4">Failed to load schedule</p>
          <p className="text-gray-300">{error}</p>
        </div>
      </div>
    );
  }

  if (!schedule.length || !activeDay) {
    return (
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 sm:mb-12 text-center">
          <h2 className="text-3xl sm:text-5xl font-bold text-white">
            HackUTA Schedule
          </h2>
          <p className="mt-3 text-base sm:text-lg text-gray-300 font-franklinGothic max-w-2xl mx-auto">
            A clear look at everything happening across the weekend.
          </p>
        </div>
        <div className="text-center py-20">
          <p className="text-gray-300">
            No events scheduled yet. Check back soon!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
      <div className="mb-10 sm:mb-12 text-center">
        <h2 className="text-3xl sm:text-5xl font-bold text-white">
          HackUTA Schedule
        </h2>
        <p className="mt-3 text-base sm:text-lg text-gray-300 font-franklinGothic max-w-2xl mx-auto">
          A clear look at everything happening across the weekend.
        </p>
      </div>

      <div className="mb-8 flex justify-center">
        <div
          role="tablist"
          aria-label="Select schedule day"
          className="inline-flex items-center gap-2 overflow-x-auto rounded-full border border-red-500/30 bg-gradient-to-r from-red-900/40 via-blue-900/40 to-red-900/40 px-2 py-2 backdrop-blur-md"
        >
          {schedule.map((day) => {
            const isActive = day.id === activeDay.id;
            return (
              <button
                key={day.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveDayId(day.id)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-200 font-franklinGothic ${
                  isActive
                    ? 'bg-red-500 text-white shadow-[0_12px_30px_-18px_rgba(248,113,113,0.75)]'
                    : 'text-gray-200 hover:text-white/90'
                }`}
              >
                <span className="uppercase tracking-[0.25em] text-[11px] sm:text-xs">
                  {day.date}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <DayPanel key={activeDay.id} day={activeDay} />
    </div>
  );
}

function DayPanel({ day }: { day: ScheduleDay }) {
  const [activeFilter, setActiveFilter] = useState<ScheduleFilterKey>('all');
  const events = useMemo(() => buildDisplayEvents(day), [day]);
  const filterMeta = useMemo(
    () =>
      categoryFilters.map((filter) => ({
        ...filter,
        count: events.filter((event) => filter.match(event.type)).length,
      })),
    [events],
  );
  const showFilters = day.id !== 'pre-event-workshops';
  const activeFilterConfig =
    filterMeta.find((filter) => filter.id === activeFilter) ?? filterMeta[0];
  const filteredEvents = showFilters
    ? events.filter((event) => activeFilterConfig.match(event.type))
    : events;

  return (
    <article className="faq-glow flex h-full flex-col rounded-3xl border border-red-500/30 bg-gradient-to-br from-red-900/30 via-blue-900/20 to-black/60 backdrop-blur-xl overflow-hidden">
      <header className="border-b border-red-500/20 bg-gradient-to-r from-red-900/40 via-transparent to-blue-900/30 px-6 py-6 sm:px-8 sm:py-8 text-left">
        <h3 className="text-xl sm:text-2xl font-semibold text-white">
          {day.title}
        </h3>
        <p className="mt-1 text-xs uppercase tracking-[0.35em] text-rose-200 font-franklinGothic">
          {day.date}
        </p>
        <p className="mt-3 text-sm text-gray-300 font-franklinGothic max-w-xl">
          {day.summary}
        </p>
      </header>
      {showFilters && (
        <div className="border-b border-white/10 bg-black/20 px-6 py-4 sm:px-8 sm:py-5">
          <div className="flex flex-wrap items-center gap-2">
            {filterMeta.map((filter) => {
              const isActive = filter.id === activeFilterConfig.id;
              return (
                <button
                  key={filter.id}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setActiveFilter(filter.id)}
                  className={`flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] transition-colors duration-200 font-franklinGothic shadow-[0_0_20px_-15px_rgba(248,113,113,0.75)] ${
                    isActive
                      ? 'border-red-400/70 bg-red-500/20 text-white'
                      : 'border-white/10 bg-white/5 text-gray-300 hover:border-red-400/50 hover:text-white'
                  }`}
                >
                  <span>{filter.label}</span>
                  <span className="rounded-full bg-black/40 px-1.5 py-0.5 text-[10px] tracking-[0.15em]">
                    {filter.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {filteredEvents.length > 0 ? (
        <ul className="flex-1 divide-y divide-white/10 bg-black/30">
          {filteredEvents.map((event) => (
            <ScheduleRow key={event.id} event={event} />
          ))}
        </ul>
      ) : (
        <div className="flex flex-1 items-center justify-center bg-black/30 px-6 py-12 sm:px-8">
          <p className="text-center text-sm text-gray-300 font-franklinGothic">
            No events in this category for {day.title}. Try another filter.
          </p>
        </div>
      )}
    </article>
  );
}

function ScheduleRow({ event }: { event: DisplayEvent }) {
  const category = categoryStyles[event.type];
  const Icon = category.icon;

  return (
    <li className="px-6 py-5 sm:px-7 sm:py-6 transition-colors duration-300 hover:bg-red-500/10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
        <div className="flex items-start gap-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-red-400/30 bg-red-500/10 text-lg text-red-200">
            <Icon className="h-5 w-5" strokeWidth={2} />
          </span>
          <div className="min-w-[180px] sm:min-w-[220px]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs uppercase tracking-[0.3em] text-gray-300 font-franklinGothic">
                {event.time}
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.3em] transition-colors duration-300 ${category.badgeClass}`}
              >
                {category.label}
              </span>
            </div>
            <p className="mt-2 text-base sm:text-lg font-semibold text-white font-franklinGothic text-left">
              {event.title}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-200 font-franklinGothic">
          <span className={`h-2.5 w-2.5 rounded-full ${category.dotClass}`} />
          <span className="whitespace-nowrap font-semibold text-white/90">
            {event.location ?? 'Room TBD'}
          </span>
        </div>
      </div>
    </li>
  );
}

function buildDisplayEvents(day: ScheduleDay): DisplayEvent[] {
  const rows: DisplayEvent[] = [];
  const includeDateWithTime = day.id === 'pre-event-workshops';

  day.slots.forEach((slot) => {
    slot.events.forEach((event, index) => {
      rows.push({
        id: `${day.id}-${slot.timeRange}-${event.title}-${index}`,
        time: includeDateWithTime ? slot.timeRange : resolveTime(slot, event),
        title: event.title,
        location: event.location,
        type: event.type,
      });
    });
  });

  return rows;
}

function resolveTime(slot: ScheduleSlot, event: ScheduleEvent) {
  if (event.end && event.end !== event.start) {
    return `${event.start} – ${event.end}`;
  }
  if (event.start) {
    return event.start;
  }
  return slot.timeRange;
}
