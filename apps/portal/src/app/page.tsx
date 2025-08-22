import { createSupabaseServerClient } from "@repo/supabase/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { cookies } from "next/headers";
import { QrCodeModal } from "@/components/qr-code-modal";

export default async function PortalPage() {
  const supabase = await createSupabaseServerClient(cookies);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch the user's profile and points in one query
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      `
      *,
      points ( score )
    `
    )
    .eq("id", user!.id)
    .single();

  const userPoints = profile?.points[0]?.score ?? 0;

  return (
    <div className="p-4 sm:p-8 space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Your HackUTA Portal
          </h1>
          <p className="text-gray-600 mt-1">Welcome, {user?.email}!</p>
        </div>
        <QrCodeModal />
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Your Points</CardTitle>
            <CardDescription>
              Points are earned by participating in events.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-5xl font-bold">{userPoints}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Status</CardTitle>
            <CardDescription>
              Your current role in the HackUTA ecosystem.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold capitalize">{profile?.role}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
