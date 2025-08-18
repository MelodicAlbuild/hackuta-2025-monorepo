"use client";

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { UserProfileForm } from "@/components/dashboard/user-profile-form";
import { UpdatePasswordForm } from "@/components/dashboard/update-password-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";

export default function DashboardPage() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const method = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        redirect("/login");
      }

      setUser(user);
    };

    method();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your profile and account settings.
          </p>
        </header>

        <div className="grid gap-8 md:grid-cols-2">
          {/* User Profile Information Card */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal details here.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* We pass the user object to the client component */}
              {user && <UserProfileForm user={user} />}
            </CardContent>
          </Card>

          {/* Update Password Card */}
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
    </div>
  );
}
