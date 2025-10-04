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

  // Get active shop items
  const { data: items, error } = await supabase
    .from('shop_items')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) {
    return NextResponse.json(
      { error: 'Failed to fetch shop items' },
      { status: 500 }
    );
  }

  return NextResponse.json({ items });
}