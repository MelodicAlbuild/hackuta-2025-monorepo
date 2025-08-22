import { createSupabaseAdminClient } from "@repo/supabase/server";
import { NotificationSender } from "./_components/notifications-sender";

export default async function NotificationsPage() {
  const supabaseAdmin = createSupabaseAdminClient();

  // Fetch all users so we can populate a dropdown
  const {
    data: { users },
    error,
  } = await supabaseAdmin.auth.admin.listUsers();
  if (error) {
    return <p>Could not load users.</p>;
  }

  // We only need the ID and email for the dropdown
  const userList = users.map((u) => ({ id: u.id, email: u.email! }));

  return <NotificationSender users={userList} />;
}
