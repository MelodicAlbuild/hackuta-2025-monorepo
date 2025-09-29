import Link from 'next/link';
import { createSupabaseServerClient } from '@repo/supabase/server';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Menu } from 'lucide-react';
import { signOut } from '@/app/auth/actions';
import { cookies } from 'next/headers';
import { ThemeToggle } from '@/components/theme-toggle';

export async function Header() {
  const supabase = await createSupabaseServerClient(cookies);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userRole = 'user';
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .single();
    if (profile) {
      userRole = profile.role;
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-bold text-foreground">
            HackUTA Admin
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {user && (
            <>
              <span className="hidden text-sm text-muted-foreground sm:block">
                {user.email}
              </span>
              <ThemeToggle />
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
                    <Link href="/action-scanner">Scanner</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/check-in">Check-In</Link>
                  </DropdownMenuItem>

                  {userRole === 'admin' || userRole === 'super-admin' ? (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>Admin</DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                        <Link href="/registrations">Registrations</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/users">User Management</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/events">Events</Link>
                      </DropdownMenuItem>
                    </>
                  ) : null}

                  {userRole === 'super-admin' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>Super Admin</DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                        <Link href="/manage-roles">Manage Roles</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/notifications">Send Notifications</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/points">Manage Points</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/scanner">Admin Scanner</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/vendor-codes">Manage Vendor Codes</Link>
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
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
