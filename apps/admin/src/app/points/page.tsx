import { createSupabaseAdminClient } from "@repo/supabase/server";
import { PointsTable } from "./_components/points-table";
import { BulkActions } from "./_components/bulk-actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function PointsPage() {
  const supabaseAdmin = createSupabaseAdminClient();

  // 1. Fetch all users
  const {
    data: { users },
    error: usersError,
  } = await supabaseAdmin.auth.admin.listUsers();
  if (usersError) return <p>Error fetching users: {usersError.message}</p>;

  // 2. Fetch all points and profiles
  const { data: points, error: pointsError } = await supabaseAdmin
    .from("points")
    .select("*");
  if (pointsError) return <p>Error fetching points: {pointsError.message}</p>;

  const { data: profiles, error: profilesError } = await supabaseAdmin
    .from("profiles")
    .select("*");
  if (profilesError)
    return <p>Error fetching profiles: {profilesError.message}</p>;

  // 3. Combine and filter the data
  const usersWithPoints = users
    .map((user) => {
      const profile = profiles.find((p) => p.id === user.id);
      const pointData = points.find((p) => p.user_id === user.id);
      return {
        ...user,
        role: profile?.role || "user", // Include the role
        score: pointData?.score || 0,
      };
    })
    // ** This is the new filtering step **
    .filter((user) => user.role !== "admin" && user.role !== "super-admin");

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Manage Points</CardTitle>
            <CardDescription>
              Add, remove, or set points for users.
            </CardDescription>
          </div>
          <BulkActions />
        </div>
      </CardHeader>
      <CardContent>
        {/* The filtered list is passed to the table */}
        <PointsTable users={usersWithPoints} />
      </CardContent>
    </Card>
  );
}
