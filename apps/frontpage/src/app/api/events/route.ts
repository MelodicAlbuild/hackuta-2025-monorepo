import { createSupabaseServerClient } from '@repo/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient(cookies);

    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .order('start_time');

    if (error) {
      console.error('Failed to fetch events:', error.message);
      return NextResponse.json(
        { error: 'Failed to fetch events' },
        { status: 500 },
      );
    }

    return NextResponse.json({ events: events || [] });
  } catch (error) {
    console.error('Events API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
