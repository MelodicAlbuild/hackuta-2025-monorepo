import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "@repo/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UsersTable } from "./_components/users-table";
import { cookies } from "next/headers";

export default async function UserManagementPage() {
  const supabase = await createSupabaseServerClient(cookies);
  const supabaseAdmin = createSupabaseAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .single();
  const currentUserRole = profile?.role || "user";

  const {
    data: { users },
    error: usersError,
  } = await supabaseAdmin.auth.admin.listUsers();
  if (usersError) return <p>Error fetching users: {usersError.message}</p>;

  const { data: profiles, error: profilesError } = await supabaseAdmin
    .from("profiles")
    .select("id, role");
  if (profilesError)
    return <p>Error fetching profiles: {profilesError.message}</p>;

  const filteredUsers = users.filter((user) => {
    if (currentUserRole !== "super-admin") {
      return user.role !== "admin" && user.role !== "super-admin";
    } else {
      return true;
    }
  });

  const usersWithRoles = filteredUsers.map((user) => {
    const profile = profiles.find((p) => p.id === user.id);
    return { ...user, role: profile?.role || "user" };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
        <CardDescription>
          View and manage all registered users in the system.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <UsersTable users={usersWithRoles} currentUserRole={currentUserRole} />
      </CardContent>
    </Card>
  );
}
