import Link from "next/link";
import { createSupabaseServerClient } from "@repo/supabase/server";
import { Button } from "@/components/ui/button";
import { signOut } from "@/app/auth/actions";
import { cookies } from "next/headers";
import { NotificationsPanel } from "./notifications-panel";

export async function Header() {
  const supabase = await createSupabaseServerClient(cookies);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userRole = "user";
  if (user) {
    // Fetch the user's role from their profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .single();
    if (profile) userRole = profile.role;
  }

  let initialNotifications = [];
  if (user) {
    // Call our new database function to get notifications
    const { data } = await supabase.rpc("get_notifications_for_user");
    initialNotifications = data || [];
  }

  const isAdmin = userRole === "admin" || userRole === "super-admin";
  const adminPortalUrl = process.env.NEXT_PUBLIC_VIEWER_APP_URL || "/";

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-bold text-gray-900">
            HackUTA Portal
          </Link>
          <div className="hidden md:flex items-center gap-4 text-sm font-medium text-gray-600">
            {/* Conditional link to the admin portal */}
            {isAdmin && (
              <Link
                href={adminPortalUrl}
                className="hover:text-blue-600 font-semibold text-blue-600"
              >
                Admin Portal
              </Link>
            )}
            <Link
              href="/scan"
              className="hover:text-blue-600 font-semibold text-green-600"
            >
              Scan Code
            </Link>
          </div>
        </div>

        {user && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 hidden sm:block">
              {user.email}
            </span>
            <NotificationsPanel
              initialNotifications={initialNotifications}
              role={userRole}
            />
            <form action={signOut}>
              <Button variant="outline" type="submit">
                Sign Out
              </Button>
            </form>
          </div>
        )}
      </nav>
    </header>
  );
}
