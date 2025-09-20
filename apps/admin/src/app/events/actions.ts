'use server';

import { createSupabaseServerClient } from '@repo/supabase/server';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

// Convert a naive local datetime string (from <input type="datetime-local" />)
// interpreted in a specific IANA timezone into an ISO UTC string.
// Example input: '2025-10-04T19:00', timeZone: 'America/Chicago' -> '2025-10-05T00:00:00.000Z' (during CDT)
function zonedNaiveToUtcISO(
  localStr: string | null,
  timeZone: string | null,
): string | null {
  if (!localStr) return null;
  // Fallback to America/Chicago if not provided
  const tz = timeZone || 'America/Chicago';

  // Parse components
  const [datePart, timePart] = localStr.split('T');
  if (!datePart || !timePart) return localStr; // best-effort fallback
  const [y, m, d] = datePart.split('-').map((v) => parseInt(v, 10));
  const [hh, mm] = timePart.split(':').map((v) => parseInt(v, 10));

  // Initial UTC guess: treat the components as if they were UTC
  let ts = Date.UTC(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0, 0);

  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const getZonedUTCFromTS = (epochMs: number) => {
    const parts = dtf.formatToParts(new Date(epochMs));
    const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
    const zy = parseInt(map.year, 10);
    const zm = parseInt(map.month, 10) - 1; // zero-based
    const zd = parseInt(map.day, 10);
    const zH = parseInt(map.hour, 10);
    const zM = parseInt(map.minute, 10);
    const zS = parseInt(map.second, 10);
    // Convert the zoned fields back to a UTC epoch
    return Date.UTC(zy, zm, zd, zH, zM, zS, 0);
  };

  // Target UTC constructed from the intended zoned components
  const targetAsUTC = Date.UTC(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0, 0);

  // Two iterations get us to the correct instant for most TZ/DST boundaries
  let computed = getZonedUTCFromTS(ts);
  ts += targetAsUTC - computed;
  computed = getZonedUTCFromTS(ts);
  ts += targetAsUTC - computed;

  return new Date(ts).toISOString();
}

// Helper for security check
async function verifyAdminOrSuperAdmin() {
  const supabase = await createSupabaseServerClient(cookies);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (!profile || !['admin', 'super-admin'].includes(profile.role)) {
    throw new Error('You do not have permission to manage the schedule.');
  }
  return user.id;
}

// Action to CREATE a new event
export async function createEvent(formData: FormData) {
  const adminId = await verifyAdminOrSuperAdmin();
  const tz = (formData.get('tz') as string) || 'America/Chicago';
  const startLocal = formData.get('start_time') as string;
  const endLocal = (formData.get('end_time') as string) || null;
  const start_time = zonedNaiveToUtcISO(startLocal, tz) as string;
  const end_time = zonedNaiveToUtcISO(endLocal, tz);
  const newEvent = {
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    start_time,
    end_time,
    location: formData.get('location') as string,
    category: formData.get('category') as string,
    created_by: adminId,
  };

  const supabase = await createSupabaseServerClient(cookies);
  const { error } = await supabase.from('events').insert(newEvent);

  if (error) throw new Error(`Failed to create event: ${error.message}`);
  revalidatePath('/events'); // Revalidate the admin page
  revalidatePath('/schedule'); // Revalidate the public schedule page
  return { success: true };
}

// Action to UPDATE an event
export async function updateEvent(formData: FormData) {
  await verifyAdminOrSuperAdmin();
  const eventId = formData.get('id') as string;
  const tz = (formData.get('tz') as string) || 'America/Chicago';
  const startLocal = formData.get('start_time') as string;
  const endLocal = (formData.get('end_time') as string) || null;
  const start_time = zonedNaiveToUtcISO(startLocal, tz) as string;
  const end_time = zonedNaiveToUtcISO(endLocal, tz);
  const updatedEvent = {
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    start_time,
    end_time,
    location: formData.get('location') as string,
    category: formData.get('category') as string,
  };

  const supabase = await createSupabaseServerClient(cookies);
  const { error } = await supabase
    .from('events')
    .update(updatedEvent)
    .eq('id', eventId);

  if (error) throw new Error(`Failed to update event: ${error.message}`);
  revalidatePath('/events');
  revalidatePath('/schedule');
  return { success: true };
}

// Action to DELETE an event
export async function deleteEvent(eventId: number) {
  await verifyAdminOrSuperAdmin();
  const supabase = await createSupabaseServerClient(cookies);
  const { error } = await supabase.from('events').delete().eq('id', eventId);

  if (error) throw new Error(`Failed to delete event: ${error.message}`);
  revalidatePath('/events');
  revalidatePath('/schedule');
  return { success: true };
}
