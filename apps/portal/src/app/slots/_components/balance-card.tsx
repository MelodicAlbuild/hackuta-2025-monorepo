'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createSupabaseBrowserClient } from '@repo/supabase/client';
import { depositToGambling, withdrawFromGambling } from '@repo/supabase/client';
import { useRouter } from 'next/navigation';

interface BalanceCardProps {
  userId: string;
  mainBalance: number;
  gamblingBalance: number;
  settings: {
    allow_deposits: boolean;
    allow_withdrawals: boolean;
    min_deposit: number;
    max_deposit: number;
    max_deposit_per_day: number;
    min_withdrawal: number;
  };
}

export function BalanceCard({ userId, mainBalance: initialMainBalance, gamblingBalance: initialGamblingBalance, settings }: BalanceCardProps) {
  const [mainBalance, setMainBalance] = useState(initialMainBalance);
  const [gamblingBalance, setGamblingBalance] = useState(initialGamblingBalance);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleDeposit = async () => {
    const amount = parseInt(depositAmount);

    if (!amount || amount < settings.min_deposit) {
      setMessage(`Invalid amount: Minimum deposit is ${settings.min_deposit} points`);
      return;
    }

    if (amount > settings.max_deposit) {
      setMessage(`Invalid amount: Maximum deposit is ${settings.max_deposit} points`);
      return;
    }

    if (amount > mainBalance) {
      setMessage('Insufficient balance: You do not have enough points');
      return;
    }

    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      await depositToGambling(supabase, userId, amount);

      setMainBalance(prev => prev - amount);
      setGamblingBalance(prev => prev + amount);
      setDepositAmount('');
      setMessage(`Deposit successful: Deposited ${amount} points to gambling balance`);

      router.refresh();
    } catch (error: any) {
      setMessage(`Deposit failed: ${error.message || 'Failed to deposit points'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseInt(withdrawAmount);

    if (!amount || amount < settings.min_withdrawal) {
      setMessage(`Invalid amount: Minimum withdrawal is ${settings.min_withdrawal} points`);
      return;
    }

    if (amount > gamblingBalance) {
      setMessage('Insufficient balance: You do not have enough points in gambling balance');
      return;
    }

    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      await withdrawFromGambling(supabase, userId, amount);

      setMainBalance(prev => prev + amount);
      setGamblingBalance(prev => prev - amount);
      setWithdrawAmount('');
      setMessage(`Withdrawal successful: Withdrew ${amount} points to main balance`);

      router.refresh();
    } catch (error: any) {
      setMessage(`Withdrawal failed: ${error.message || 'Failed to withdraw points'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Balance Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {message && (
          <div className="text-sm p-2 bg-muted rounded">
            {message}
          </div>
        )}

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Main Balance:</span>
            <span className="text-lg font-semibold">{mainBalance.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Gambling Balance:</span>
            <span className="text-lg font-semibold">{gamblingBalance.toLocaleString()}</span>
          </div>
        </div>

        {settings.allow_deposits && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Deposit to Gambling</p>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder={`Min: ${settings.min_deposit}`}
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                disabled={loading}
                min={settings.min_deposit}
                max={Math.min(settings.max_deposit, mainBalance)}
              />
              <Button onClick={handleDeposit} disabled={loading}>
                Deposit
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Min: {settings.min_deposit}, Max: {settings.max_deposit}
            </p>
          </div>
        )}

        {settings.allow_withdrawals && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Withdraw to Main</p>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder={`Min: ${settings.min_withdrawal}`}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                disabled={loading}
                min={settings.min_withdrawal}
                max={gamblingBalance}
              />
              <Button onClick={handleWithdraw} disabled={loading}>
                Withdraw
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Min: {settings.min_withdrawal}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
