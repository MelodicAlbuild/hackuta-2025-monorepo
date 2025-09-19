import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@repo/supabase/server';
import { UserProfileForm } from './_components/user-profile-form';
import { UpdatePasswordForm } from './_components/update-password-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cookies } from 'next/headers';

export default async function SettingsPage() {
  const supabase = await createSupabaseServerClient(cookies);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Middleware should handle this, but it's good practice for protection
    return redirect('/');
  }

  return (
    <div className="space-y-8 p-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Account Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your profile and password.
        </p>
      </header>

      <div className="grid gap-8 sm:grid-cols-1 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Update your personal details here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UserProfileForm user={user} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>
              Choose a new password for your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UpdatePasswordForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
