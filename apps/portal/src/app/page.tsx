import { createSupabaseServerClient } from "@repo/supabase/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { QrCodeModal } from "@/components/qr-code-modal";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cookies } from "next/headers";
import { PointsCard } from "@/components/points-cards";

export default async function PortalPage() {
  const supabase = await createSupabaseServerClient(cookies);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, points ( score )")
    .eq("id", user!.id)
    .single();

  const userPoints = profile?.points?.score ?? 0;
  const accountSettingsUrl = `${process.env.NEXT_PUBLIC_AUTH_APP_URL}/dashboard`;

  return (
    <div className="p-4 sm:p-8 space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Welcome back, {user?.email}!
        </h1>
        <p className="text-gray-600 mt-1">
          This is your central hub for the HackUTA hackathon.
        </p>
      </header>

      <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {/* QR Code Card */}
        <Card>
          <CardHeader>
            <CardTitle>Your Event Pass</CardTitle>
            <CardDescription>
              Use this QR code for check-in and interactions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <QrCodeModal />
          </CardContent>
        </Card>

        {/* Points Card */}
        <PointsCard initialPoints={userPoints} />

        {/* Account Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
            <CardDescription>Manage your profile and password.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/settings">Go to Settings</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
