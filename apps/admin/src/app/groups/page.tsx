import { createSupabaseAdminClient } from '@repo/supabase/server';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { GroupManager } from './_components/group-manager';

export default async function GroupsPage() {
  const supabaseAdmin = createSupabaseAdminClient();

  const {
    data: { users },
  } = await supabaseAdmin.auth.admin.listUsers();
  const { data: profiles } = await supabaseAdmin
    .from('profiles')
    .select('id, role');
  const { data: groups } = await supabaseAdmin.from('user_groups').select('*');

  const usersWithGroups = users
    .map((user) => {
      const profile = profiles?.find((p) => p.id === user.id);
      const group = groups?.find((g) => g.user_id === user.id);
      return {
        ...user,
        role: profile?.role || 'user', // Add the role to the user object
        group: group?.user_group || null,
      };
    })
    .filter((user) => user.role === 'user');

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Group Management</CardTitle>
        <CardDescription>
          Select users and distribute them into groups. This action is
          restricted to super-admins.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <GroupManager users={usersWithGroups} />
      </CardContent>
    </Card>
  );
}
