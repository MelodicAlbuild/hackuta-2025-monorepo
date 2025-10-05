import { createSupabaseServerClient } from '@repo/supabase/server';
import { getGamblingBalance, getGamblingSettings, hasAcceptedDisclaimer, getNextGamblingWindow } from '@repo/supabase/client';
import { cookies } from 'next/headers';
import { SlotsContent } from './_components/slots-content';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function SlotsPage() {
  const supabase = await createSupabaseServerClient(cookies);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <div>Please log in to access slots</div>;
  }

  const [gamblingBalance, settings, hasAccepted, windowInfo] = await Promise.all([
    getGamblingBalance(supabase, user.id),
    getGamblingSettings(supabase),
    hasAcceptedDisclaimer(supabase, user.id),
    getNextGamblingWindow(supabase),
  ]);

  // Get user's main points balance
  const { data: profile } = await supabase
    .from('profiles')
    .select('*, points ( score )')
    .eq('id', user.id)
    .single();

  const mainBalance = profile?.points?.score ?? 0;

  if (!settings.is_enabled) {
    return (
      <div className="p-4 sm:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Gambling System Closed</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{settings.closure_message || 'The gambling system is currently closed.'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if gambling window is open
  if (!windowInfo.is_open) {
    const opensAt = windowInfo.opens_at ? new Date(windowInfo.opens_at) : null;
    const formatChicagoDateTime = (date: Date) =>
      new Intl.DateTimeFormat('en-US', {
        month: 'numeric',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: 'America/Chicago',
      }).format(date);

    return (
      <div className="p-4 sm:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Gambling Window Closed</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>The gambling portal is currently closed.</p>
            <p>The portal opens every 3 hours at :30 for 30 minutes.</p>
            <p className="text-sm text-muted-foreground">Schedule: 23:30, 2:30, 5:30, 8:30, 11:30, 14:30, 17:30, 20:30</p>
            <p className="text-lg font-semibold">
              Next opening (CT): {opensAt ? formatChicagoDateTime(opensAt) : 'Loading...'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <SlotsContent
      userId={user.id}
      mainBalance={mainBalance}
      gamblingBalance={gamblingBalance}
      settings={settings}
      hasAccepted={hasAccepted}
      windowInfo={windowInfo}
    />
  );
}
