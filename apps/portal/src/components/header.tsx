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
import { NotificationsPanel } from './notifications-panel';
import { ThemeToggle } from './theme-toggle';

export async function Header() {
  const supabase = await createSupabaseServerClient(cookies);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userRole = 'user';
  if (user) {
    // Fetch the user's role from their profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .single();
    if (profile) userRole = profile.role;
  }

  let initialNotifications = [];
  if (user) {
    // Call our new database function to get notifications
    const { data } = await supabase.rpc('get_notifications_for_user');
    initialNotifications = data || [];
  }

  const isAdmin =
    userRole === 'volunteer' ||
    userRole === 'admin' ||
    userRole === 'super-admin';
  const adminPortalUrl = process.env.NEXT_PUBLIC_VIEWER_APP_URL || '/';

  return (
    <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-bold text-foreground">
            HackUTA Portal
          </Link>
          <div className="hidden md:flex items-center gap-4 text-sm font-medium text-muted-foreground">
            {/* Conditional link to the admin portal */}
            {isAdmin && (
              <Link
                href={adminPortalUrl}
                className="hover:text-primary font-semibold text-primary"
              >
                Admin Portal
              </Link>
            )}
            <Link
              href="/scan"
              className="hover:text-primary font-semibold text-secondary"
            >
              Scan Code
            </Link>
          </div>
        </div>

        {user && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {user.email}
            </span>
            <NotificationsPanel
              initialNotifications={initialNotifications}
              role={userRole}
            />
            <ThemeToggle />

            {/* Mobile Navigation Menu */}
            <div className="md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Menu className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Navigation</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link href={adminPortalUrl}>Admin Portal</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link href="/scan">Scan Code</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

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
