import { ScanActionManager } from './_components/scan-action-manager';
import { createSupabaseServerClient } from '@repo/supabase/server';
import { cookies } from 'next/headers';

export default async function ManageScanActionsPage() {
  const supabase = await createSupabaseServerClient(cookies);
  const { data: initialActions } = await supabase
    .from('scan_actions')
    .select('*')
    .order('start_time', { ascending: false });

  return (
    <div className="max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Manage Event Points</h2>
      <p className="text-muted-foreground mb-6">
        Create and manage point-earning events that participants can scan QR codes for.
      </p>
      <ScanActionManager initialActions={initialActions || []} />
    </div>
  );
}