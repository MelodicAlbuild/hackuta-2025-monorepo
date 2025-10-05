'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  acceptDisclaimer,
  createSupabaseBrowserClient,
} from '@repo/supabase/client';

interface DisclaimerDialogProps {
  userId: string;
  onAccept: () => void;
}

export function DisclaimerDialog({ userId, onAccept }: DisclaimerDialogProps) {
  const [accepted, setAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAccept = async () => {
    if (!accepted) return;

    setIsSubmitting(true);
    try {
      const supabase = createSupabaseBrowserClient();
      await acceptDisclaimer(supabase, userId);
      onAccept();
    } catch (error) {
      console.error('Failed to accept disclaimer:', error);
      alert('Failed to accept disclaimer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Gambling Disclaimer</DialogTitle>
          <DialogDescription>
            Please read and accept the following terms before proceeding
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 max-h-[400px] overflow-y-auto">
          <div className="space-y-3 text-sm">
            <p className="font-semibold">Important Notice:</p>

            <p>
              This gambling system is for entertainment purposes only within the
              context of this event. By participating, you acknowledge and agree
              to the following:
            </p>

            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                Points used in this system have no real-world monetary value
              </li>
              <li>
                All gambling outcomes are determined by random number generation
              </li>
              <li>
                The house edge means you are statistically likely to break even
                points over time
              </li>
              <li>You participate at your own risk and discretion</li>
              <li>You are responsible for managing your own point balance</li>
              <li>Past results do not guarantee future outcomes</li>
              <li>
                This activity is meant for fun and should not be taken as
                encouragement for real gambling
              </li>
            </ul>

            <p className="font-semibold mt-4">Responsible Gaming:</p>
            <p>
              Only gamble what you can afford to lose. If you feel you are
              developing unhealthy gambling habits, please stop immediately.
            </p>
          </div>

          <div className="flex items-start space-x-2 pt-4 border-t">
            <input
              type="checkbox"
              id="accept-disclaimer"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-1"
            />
            <label
              htmlFor="accept-disclaimer"
              className="text-sm cursor-pointer"
            >
              I have read and understand the gambling disclaimer, and I accept
              the terms and conditions.
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleAccept} disabled={!accepted || isSubmitting}>
            {isSubmitting ? 'Processing...' : 'Accept and Continue'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
