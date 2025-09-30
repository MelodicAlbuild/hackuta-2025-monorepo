'use server';

import { createSupabaseServerClient } from '@repo/supabase/server';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

// Convert a naive local datetime string interpreted in a timezone to UTC ISO
function zonedNaiveToUtcISO(
  localStr: string | null,
  timeZone: string | null,
): string | null {
  if (!localStr) return null;
  const tz = timeZone || 'America/Chicago';

  const [datePart, timePart] = localStr.split('T');
  if (!datePart || !timePart) return localStr;
  const [y, m, d] = datePart.split('-').map((v) => parseInt(v, 10));
  const [hh, mm] = timePart.split(':').map((v) => parseInt(v, 10));

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
    const zm = parseInt(map.month, 10) - 1;
    const zd = parseInt(map.day, 10);
    const zH = parseInt(map.hour, 10);
    const zM = parseInt(map.minute, 10);
    const zS = parseInt(map.second, 10);
    return Date.UTC(zy, zm, zd, zH, zM, zS, 0);
  };

  const targetAsUTC = Date.UTC(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0, 0);
  let computed = getZonedUTCFromTS(ts);
  ts += targetAsUTC - computed;
  computed = getZonedUTCFromTS(ts);
  ts += targetAsUTC - computed;

  return new Date(ts).toISOString();
}

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
    throw new Error('You do not have permission to manage event points.');
  }
  return user.id;
}

export async function createScanAction(formData: FormData) {
  const adminId = await verifyAdminOrSuperAdmin();
  const tz = (formData.get('tz') as string) || 'America/Chicago';
  const startLocal = formData.get('start_time') as string;
  const endLocal = (formData.get('end_time') as string) || null;
  const start_time = zonedNaiveToUtcISO(startLocal, tz) as string;
  const end_time = zonedNaiveToUtcISO(endLocal, tz);

  const newAction = {
    name: formData.get('name') as string,
    description: formData.get('description') as string,
    points_value: parseInt(formData.get('points_value') as string, 10),
    action_type: formData.get('action_type') as string,
    category: formData.get('category') as string,
    color: formData.get('color') as string,
    start_time,
    end_time,
    is_active: formData.get('is_active') === 'true',
    created_by: adminId,
  };

  const supabase = await createSupabaseServerClient(cookies);
  const { error } = await supabase.from('scan_actions').insert(newAction);

  if (error) throw new Error(`Failed to create action: ${error.message}`);
  revalidatePath('/manage-scan-actions');
  return { success: true };
}

export async function updateScanAction(formData: FormData) {
  await verifyAdminOrSuperAdmin();
  const actionId = formData.get('id') as string;
  const tz = (formData.get('tz') as string) || 'America/Chicago';
  const startLocal = formData.get('start_time') as string;
  const endLocal = (formData.get('end_time') as string) || null;
  const start_time = zonedNaiveToUtcISO(startLocal, tz) as string;
  const end_time = zonedNaiveToUtcISO(endLocal, tz);

  const updatedAction = {
    name: formData.get('name') as string,
    description: formData.get('description') as string,
    points_value: parseInt(formData.get('points_value') as string, 10),
    action_type: formData.get('action_type') as string,
    category: formData.get('category') as string,
    color: formData.get('color') as string,
    start_time,
    end_time,
    is_active: formData.get('is_active') === 'true',
  };

  const supabase = await createSupabaseServerClient(cookies);
  const { error } = await supabase
    .from('scan_actions')
    .update(updatedAction)
    .eq('id', actionId);

  if (error) throw new Error(`Failed to update action: ${error.message}`);
  revalidatePath('/manage-scan-actions');
  return { success: true };
}

export async function deleteScanAction(actionId: number) {
  await verifyAdminOrSuperAdmin();
  const supabase = await createSupabaseServerClient(cookies);
  const { error } = await supabase.from('scan_actions').delete().eq('id', actionId);

  if (error) throw new Error(`Failed to delete action: ${error.message}`);
  revalidatePath('/manage-scan-actions');
  return { success: true };
}