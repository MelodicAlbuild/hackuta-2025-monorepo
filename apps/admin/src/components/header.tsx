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
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Navigation</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/">Dashboard</Link>
                  </DropdownMenuItem>

                  {userRole === 'admin' || userRole === 'super-admin' ? (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/check-in">Check-In</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/points-scanner">Points Scanner</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/shop-scanner">Shop Scanner</Link>
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>Admin</DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                        <Link href="/registrations">Registrations</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/users">Users</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/events">Schedule Events</Link>
                      </DropdownMenuItem>
                    </>
                  ) : null}

                  {userRole === 'super-admin' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>Super Admin</DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                        <Link href="/manage-scan-actions">Event Points Management</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/shop-items">Shop Items</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/vendor-codes">Vendor Codes</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/points">Points Management</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/manage-roles">Roles</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/notifications">Notifications</Link>
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
