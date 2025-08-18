import { createSupabaseAdminClient } from "@repo/supabase/server";
import { UserRolesTable } from "./_components/user-roles-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { InviteUserDialog } from "./_components/invite-user-dialog";

export default async function ManageRolesPage() {
  const supabaseAdmin = createSupabaseAdminClient();

  // Fetch all users from the auth schema
  const {
    data: { users },
    error: usersError,
  } = await supabaseAdmin.auth.admin.listUsers();
  if (usersError) {
    return <p>Error fetching users: {usersError.message}</p>;
  }

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
          <InviteUserDialog />
        </div>
      </CardHeader>
      <CardContent>
        <UserRolesTable users={usersWithRoles} />
      </CardContent>
    </Card>
  );
}
