import { createSupabaseServerClient } from '@repo/supabase/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient(cookies);
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error('Failed to load Supabase user:', userError.message);
    }

    if (!user) {
      return Response.json({ registered: false });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (profileError) {
      // PGRST116 = row not found; treat as unregistered without noisy logs
      if (profileError.code !== 'PGRST116') {
        console.error('Failed to load user profile:', profileError.message);
      }
      return Response.json({ registered: false });
    }

    return Response.json({ registered: Boolean(profile) });
  } catch (error) {
    console.error('Registration status lookup failed:', error);
    return Response.json({ registered: false });
  }
}
