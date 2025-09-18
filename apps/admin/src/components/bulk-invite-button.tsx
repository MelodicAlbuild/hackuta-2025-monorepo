'use client';

import { useCallback, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { inviteUser } from '../app/registrations/actions';
import { useRouter } from 'next/navigation';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

// BulkInviteButton
// - Dry run option (default ON) to preview who would be invited
// - Sequentially invites eligible applicants using the same server action as per-row invite
// - Shows progress and a copyable list of successful emails
type Registration = {
  id: number;
  email?: string | null;
  status?: string | null;
};

export function BulkInviteButton({
  registrations,
  className,
}: {
  registrations: Registration[];
  className?: string;
}) {
  const router = useRouter();
  const [isRunning, setIsRunning] = useState(false);
  const [completed, setCompleted] = useState(0);
  const [succeeded, setSucceeded] = useState(0);
  const [failed, setFailed] = useState(0);
  const [dryRun, setDryRun] = useState(true);
  const [successfulEmails, setSuccessfulEmails] = useState<string[]>([]);
  const [error, setError] = useState<{ email: string; message: string } | null>(
    null,
  );

  const eligible = useMemo(
    () =>
      (registrations || []).filter((r) => {
        const hasEmail = !!(r.email && r.email.trim());
        const isPending = !r.status || r.status === 'pending';
        return hasEmail && isPending;
      }),
    [registrations],
  );

  const total = eligible.length;

  const run = useCallback(async () => {
    if (isRunning) return;
    if (!total) {
      alert(
        'No eligible applicants to invite (need email and pending status).',
      );
      return;
    }

    const actionVerb = dryRun ? 'preview invites for' : 'invite';
    const ok = window.confirm(
      `Proceed to ${actionVerb} ${total} applicant${total === 1 ? '' : 's'}?`,
    );
    if (!ok) return;

    setIsRunning(true);
    setCompleted(0);
    setSucceeded(0);
    setFailed(0);
    setSuccessfulEmails([]);
    setError(null);

    let aborted = false;
    for (const r of eligible) {
      let shouldAbort = false;
      try {
        if (dryRun) {
          setSucceeded((s) => s + 1);
          setSuccessfulEmails((list) => [...list, r.email!]);
        } else {
          const res = await inviteUser(r.email!, r.id);
          if (res?.success) {
            setSucceeded((s) => s + 1);
            setSuccessfulEmails((list) => [...list, r.email!]);
          } else {
            setFailed((f) => f + 1);
            console.error('Failed to invite', r.email, res?.error);
            setError({
              email: r.email!,
              message: res?.error || 'Unknown error',
            });
            shouldAbort = true;
          }
        }
      } catch (err) {
        setFailed((f) => f + 1);
        console.error('Error inviting', r.email, err);
        setError({
          email: r.email!,
          message: err instanceof Error ? err.message : String(err),
        });
        shouldAbort = true;
      } finally {
        setCompleted((c) => c + 1);
      }
      if (shouldAbort) {
        aborted = true;
        break;
      }
    }

    if (!dryRun && !aborted) router.refresh();
    setIsRunning(false);
  }, [dryRun, eligible, isRunning, router, total]);

  const copyEmails = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(successfulEmails.join('\n'));
    } catch (e) {
      console.error('Failed to copy emails', e);
    }
  }, [successfulEmails]);

  return (
    <div className={className}>
      <div className="flex items-center gap-3 mb-2">
        <Label htmlFor="bulk-invite-dryrun">
          <div className="flex items-center gap-2">
            <Checkbox
              id="bulk-invite-dryrun"
              checked={dryRun}
              onCheckedChange={(v) => setDryRun(Boolean(v))}
            />
            Dry run (don’t send invites)
          </div>
        </Label>
      </div>
      <Button onClick={run} disabled={isRunning || total === 0}>
        {isRunning ? (
          <>
            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            Inviting {completed}/{total}
          </>
        ) : (
          <>Bulk Invite ({total})</>
        )}
      </Button>
      <div className="mt-1 text-xs text-muted-foreground">
        {isRunning ? (
          <span>
            Succeeded {succeeded}, Failed {failed}
          </span>
        ) : (
          <span>
            Eligible applicants: {total}
            {total === 0 && ': none (needs email and pending status)'}
          </span>
        )}
      </div>

      {error && (
        <div className="mt-2 text-sm text-red-600">
          Stopped due to error inviting {error.email}: {error.message}
        </div>
      )}

      {completed === total && total > 0 && (
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <div className="text-sm font-medium">
              Successfully invited emails ({successfulEmails.length}):
            </div>
            <Button variant="outline" size="sm" onClick={copyEmails}>
              Copy
            </Button>
          </div>
          <Textarea
            readOnly
            value={successfulEmails.join('\n')}
            className="font-mono text-xs h-32"
          />
          <div className="mt-1 text-xs text-muted-foreground">
            Tip: Copy this list to send individual emails.
          </div>
        </div>
      )}
    </div>
  );
}

export default BulkInviteButton;
