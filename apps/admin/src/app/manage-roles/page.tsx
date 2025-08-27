import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "@repo/supabase/server";
import { UserRolesTable } from "./_components/user-roles-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { InviteUserDialog } from "./_components/invite-user-dialog";
import { CreateUserDialog } from "./_components/create-user-dialog";
import { cookies } from "next/headers";

export default async function ManageRolesPage() {
  const supabaseAdmin = createSupabaseAdminClient();
  const supabase = await createSupabaseServerClient(cookies);

  // Fetch all users from the auth schema
  const {
    data: { users },
    error: usersError,
  } = await supabaseAdmin.auth.admin.listUsers();
  if (usersError) {
    return <p>Error fetching users: {usersError.message}</p>;
  }

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  // Fetch all corresponding profiles
  const { data: profiles, error: profilesError } = await supabaseAdmin
    .from("profiles")
    .select("id, role");
  if (profilesError) {
    return <p>Error fetching profiles: {profilesError.message}</p>;
  }

  // Combine user and profile data
  const usersWithRoles = users.map((user) => {
    const profile = profiles.find((p) => p.id === user.id);
    return {
      ...user,
      role: profile?.role || "user", // Default to 'user' if no profile found
    };
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Manage User Roles</CardTitle>
            <CardDescription>
              Assign roles to users. Only super-admins can access this page.
            </CardDescription>
          </div>
          <div>
            <InviteUserDialog />
            {(user?.email === "ralexdrum@gmail.com" ||
              user?.email === "dominic.m.lamanna@gmail.com") && (
              <CreateUserDialog />
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <UserRolesTable users={usersWithRoles} />
      </CardContent>
    </Card>
  );
}
