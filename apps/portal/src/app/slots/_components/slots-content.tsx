'use client';

import { useState, useEffect } from 'react';
import { SlotMachine } from './slot-machine';
import { BalanceCard } from './balance-card';
import { TransactionHistory } from './transaction-history';
import { DisclaimerDialog } from './disclaimer-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { GamblingBalance, GamblingSettings } from '@repo/supabase/client';

interface SlotsContentProps {
  userId: string;
  mainBalance: number;
  gamblingBalance: GamblingBalance | null;
  settings: GamblingSettings;
  hasAccepted: boolean;
  windowInfo: {
    is_open: boolean;
    opens_at: string | null;
    closes_at: string;
  };
}

export function SlotsContent({
  userId,
  mainBalance,
  gamblingBalance,
  settings,
  hasAccepted: initialHasAccepted,
  windowInfo,
}: SlotsContentProps) {
  const [hasAccepted, setHasAccepted] = useState(initialHasAccepted);
  const [timeRemaining, setTimeRemaining] = useState('');

  useEffect(() => {
    const updateTimer = () => {
      const closesAt = new Date(windowInfo.closes_at);
      const now = new Date();
      const diff = closesAt.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining('Window closed - reloading...');
        setTimeout(() => window.location.reload(), 2000);
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeRemaining(`${minutes}m ${seconds}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [windowInfo.closes_at]);

  if (!hasAccepted) {
    return <DisclaimerDialog userId={userId} onAccept={() => setHasAccepted(true)} />;
  }

  return (
    <div className="p-4 sm:p-8 space-y-8">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Slot Machine
          </h1>
          <p className="text-muted-foreground mt-1">
            Try your luck and win big!
          </p>
          {timeRemaining && (
            <p className="text-sm text-orange-500 mt-1 font-medium">
              ⏰ Window closes in: {timeRemaining}
            </p>
          )}
        </div>
        <TransactionHistory userId={userId} />
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <SlotMachine
          userId={userId}
          initialBalance={gamblingBalance?.balance ?? 0}
        />

        <div className="space-y-6">
          <BalanceCard
            userId={userId}
            mainBalance={mainBalance}
            gamblingBalance={gamblingBalance?.balance ?? 0}
            settings={settings}
          />

          {gamblingBalance && (
            <Card>
              <CardHeader>
                <CardTitle>Your Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lifetime Wagered:</span>
                  <span className="font-medium">{gamblingBalance.lifetime_wagered.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lifetime Won:</span>
                  <span className="font-medium">{gamblingBalance.lifetime_won.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Net:</span>
                  <span className={`font-medium ${
                    gamblingBalance.lifetime_won - gamblingBalance.lifetime_wagered >= 0
                      ? 'text-green-500'
                      : 'text-red-500'
                  }`}>
                    {(gamblingBalance.lifetime_won - gamblingBalance.lifetime_wagered).toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
