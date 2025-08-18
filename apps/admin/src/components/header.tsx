import Link from "next/link";
import { createSupabaseServerClient } from "@repo/supabase/server";
import { Button } from "@/components/ui/button";
import { signOut } from "@/app/auth/actions";

export async function Header() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let userRole = "user";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .single();
    if (profile) {
      userRole = profile.role;
    }
  }

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-bold text-gray-900">
            HackUTA Admin
          </Link>
          {/* Navigation links only show if the user is logged in */}
          {user && (
            <div className="hidden md:flex items-center gap-4 text-sm font-medium text-gray-600">
              <Link href="/" className="hover:text-blue-600">
                Dashboard
              </Link>
              <Link href="/registrations" className="hover:text-blue-600">
                Registrations
              </Link>
              {userRole === "super-admin" && (
                <Link href="/manage-roles" className="hover:text-blue-600">
                  Manage Roles
                </Link>
              )}
            </div>
          )}
        </div>

        {/* The sign-out form only shows if the user is logged in */}
        {user && (
          <form action={signOut}>
            <Button variant="outline" type="submit">
              Sign Out
            </Button>
          </form>
        )}
      </nav>
    </header>
  );
}
