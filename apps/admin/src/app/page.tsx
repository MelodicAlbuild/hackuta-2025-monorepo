import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { createSupabaseServerClient } from '@repo/supabase/server';
import { Users } from 'lucide-react';
import { cookies } from 'next/headers';

export default async function AdminDashboard() {
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

  const { count, error } = await supabase
    .from('interest-form')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('Error fetching submission count:', error);
  }

  function capitalizeFirstLetter(str: string) {
    if (str.length === 0) {
      return ''; // Handle empty strings
    }
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function capitalizeStringArray(str: string[]) {
    return str.map(capitalizeFirstLetter);
  }

  return (
    <div className="space-y-8">
      {/* Welcome Message */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-semibold mb-2">
          Welcome,{' '}
          {userRole.includes('-')
            ? capitalizeStringArray(userRole.split('-')).join(' ')
            : capitalizeFirstLetter(userRole)}
          !
        </h2>
        {user && (
          <div>
            <p className="font-mono bg-gray-100 p-2 rounded mt-2">
              <strong>User ID:</strong> {user.id}
            </p>
            <p className="font-mono bg-gray-100 p-2 rounded mt-2">
              <strong>Email:</strong> {user.email}
            </p>
          </div>
        )}
      </div>

      {/* ** NEW: Grid for statistics cards ** */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {userRole !== 'volunteer' && (
          <>
            {/* Total Submissions Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Submissions
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{count ?? '0'}</div>
                <p className="text-xs text-muted-foreground">
                  Total applicants in the system
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
