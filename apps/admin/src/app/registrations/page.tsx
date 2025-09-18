import { createSupabaseServerClient } from '@repo/supabase/server';
import { RegistrationsTable } from '@/components/registrations-table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cookies } from 'next/headers';
import BulkInviteButton from '@/components/bulk-invite-button';

export default async function RegistrationsPage() {
  const supabase = await createSupabaseServerClient(cookies);

  const { data: registrations, error } = await supabase
    .from('interest-form')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return (
      <p>
        Could not load registrations. <br />
        {error.message}
      </p>
    );
  }

  const baseFiltered = (registrations ?? [])
    .filter(
      (reg) =>
        reg.age >= 18 && `${reg.firstName} ${reg.lastName}` !== 'Alex Drum',
    )
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

  const seenEmails = new Set<string>();
  const seenNames = new Set<string>();
  const dedupedRegistrations = [];
  for (const reg of baseFiltered) {
    const emailKey = (reg.email ?? '').trim().toLowerCase();
    const nameKey = `${reg.firstName ?? ''} ${reg.lastName ?? ''}`
      .trim()
      .toLowerCase();

    if (emailKey && seenEmails.has(emailKey)) continue;
    if (nameKey && seenNames.has(nameKey)) continue;

    if (emailKey) seenEmails.add(emailKey);
    if (nameKey) seenNames.add(nameKey);

    dedupedRegistrations.push(reg);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Applicants ({dedupedRegistrations.length})</CardTitle>
          <CardDescription>
            A list of all users who have submitted an interest form.
          </CardDescription>
        </div>
        <BulkInviteButton
          registrations={dedupedRegistrations}
          className="mt-1 shrink-0"
        />
      </CardHeader>
      <CardContent>
        <div className="overflow-y-auto h-md">
          <RegistrationsTable registrations={dedupedRegistrations || []} />
        </div>
      </CardContent>
    </Card>
  );
}
