import Link from "next/link";
import { createSupabaseServerClient } from "@repo/supabase/server";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu } from "lucide-react";
import { signOut } from "@/app/auth/actions";
import { cookies } from "next/headers";

export async function Header() {
  const supabase = await createSupabaseServerClient(cookies);
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
        </div>

        {user && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 hidden sm:block">
              {user.email}
            </span>

            {/* --- NEW: Navigation Dropdown Menu --- */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Navigation</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/">Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/registrations">Registrations</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/points">Points</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/scanner">Scanner</Link>
                </DropdownMenuItem>

                {/* --- NEW: Conditional Super Admin Section --- */}
                {userRole === "super-admin" && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Super Admin</DropdownMenuLabel>
                    <DropdownMenuItem asChild>
                      <Link href="/manage-roles">Manage Roles</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/notifications">Send Notifications</Link>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <form action={signOut}>
              <Button variant="ghost" type="submit">
                Sign Out
              </Button>
            </form>
          </div>
        )}
      </nav>
    </header>
  );
}
