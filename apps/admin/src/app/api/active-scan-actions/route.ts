import { createSupabaseServerClient } from '@repo/supabase/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const supabase = await createSupabaseServerClient(cookies);

  // Verify user is admin
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['volunteer', 'admin', 'super-admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  // Get currently active actions
  const now = new Date();
  const nowISOMinus15Minutes = new Date(now.getTime() - 15 * 60000).toISOString();
  const nowISOPlus15Minutes = new Date(now.getTime() + 15 * 60000).toISOString();
  const { data: actions, error } = await supabase
    .from('scan_actions')
    .select('*')
    .eq('is_active', true)
    .lte('start_time', now)
    .gte('end_time', now)
    .order('start_time');

  if (error) {
    return NextResponse.json(
      { error: 'Failed to fetch actions' },
      { status: 500 }
    );
  }

  return NextResponse.json({ actions });
}