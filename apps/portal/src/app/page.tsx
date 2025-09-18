import { createSupabaseServerClient } from '@repo/supabase/server';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { QrCodeDisplay } from '@/components/qr-code-display';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cookies } from 'next/headers';
import { PointsCard } from '@/components/points-cards';
import { LiveSchedulePreview } from '@/components/live-schedule-preview';

export default async function PortalPage() {
  const supabase = await createSupabaseServerClient(cookies);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, points ( score )')
    .eq('id', user!.id)
    .single();

  const userPoints = profile?.points?.score ?? 0;
  const accountSettingsUrl = '/settings';

  return (
    <div className="p-4 sm:p-8 space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Welcome back, {user?.email}!
        </h1>
        <p className="text-muted-foreground mt-1">
          This is your central hub for the HackUTA hackathon.
        </p>
      </header>

      <div className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <Card className="lg:h-full">
            <CardHeader>
              <CardTitle>Your Event Pass</CardTitle>
              <CardDescription>
                Use this QR code for check-in and interactions.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <QrCodeDisplay />
            </CardContent>
          </Card>

          <div className="flex flex-col gap-6">
            <PointsCard initialPoints={userPoints} />

            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>
                  Manage your profile and password.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link href={accountSettingsUrl}>Go to Settings</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <LiveSchedulePreview />
      </div>
    </div>
  );
}
