'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createSupabaseBrowserClient } from '@repo/supabase/client';
import { playSlot } from '@repo/supabase/client';

const SYMBOLS = ['⚛️', '💻', '🤓', '🤖', '🕷️'];
const BET_AMOUNTS = [10, 25, 50, 100, 250];

interface SlotMachineProps {
  userId: string;
  initialBalance: number;
}

export function SlotMachine({ userId, initialBalance }: SlotMachineProps) {
  const [balance, setBalance] = useState(initialBalance);
  const [betAmount, setBetAmount] = useState(50);
  const [reels, setReels] = useState(['⚛️', '⚛️', '⚛️']);
  const [spinning, setSpinning] = useState(false);
  type SlotOutcome = 'win' | 'loss' | 'break_even' | 'big_win';

  const [lastResult, setLastResult] = useState<{
    profit: number;
    type: SlotOutcome;
  } | null>(null);
  const [message, setMessage] = useState('');

  const spin = async () => {
    if (!betAmount || betAmount <= 0) {
      setMessage('Invalid bet: Please select a valid bet amount');
      return;
    }

    if (betAmount > balance) {
      setMessage('Insufficient balance: You do not have enough points to place this bet');
      return;
    }

    setSpinning(true);
    setLastResult(null);

    // Animate reels
    const spinDuration = 2000;
    const spinInterval = 100;
    let elapsed = 0;

    const spinAnimation = setInterval(() => {
      setReels([
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      ]);
      elapsed += spinInterval;

      if (elapsed >= spinDuration) {
        clearInterval(spinAnimation);
      }
    }, spinInterval);

    try {
      const supabase = createSupabaseBrowserClient();
      const result = await playSlot(supabase, userId, betAmount);

      // Wait for animation to complete
      await new Promise(resolve => setTimeout(resolve, spinDuration));

      // Show final result
      setReels([result.reel1_symbol, result.reel2_symbol, result.reel3_symbol]);
      setBalance(result.gambling_balance_after);
      setLastResult({
        profit: result.profit,
        type: result.result_type as SlotOutcome,
      });

      if (result.result_type === 'break_even') {
        setMessage(`Break Even! You got your ${betAmount} points back`);
      } else if (result.profit > 0) {
        setMessage(`🎉 Winner! You won ${result.payout_amount.toLocaleString()} points (profit: +${result.profit.toLocaleString()})`);
      } else {
        setMessage(`Better luck next time. You lost ${betAmount} points`);
      }
    } catch (error: any) {
      setMessage(`Error: ${error.message || 'Failed to spin'}`);
    } finally {
      setSpinning(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Slot Machine</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Reels */}
        <div className="flex justify-center gap-4">
          {reels.map((symbol, index) => (
            <div
              key={index}
              className={`w-24 h-24 sm:w-32 sm:h-32 border-4 border-primary rounded-lg flex items-center justify-center text-5xl sm:text-6xl ${
                spinning ? 'animate-pulse' : ''
              }`}
            >
              {symbol}
            </div>
          ))}
        </div>

        {/* Last win display */}
        {lastResult && (
          <div className="text-center">
            <p
              className={`text-2xl font-bold ${
                lastResult.type === 'break_even'
                  ? 'text-yellow-500'
                  : lastResult.profit > 0
                  ? 'text-green-500'
                  : 'text-red-500'
              }`}
            >
              {lastResult.type === 'break_even'
                ? 'Break Even'
                : lastResult.profit > 0
                ? `+${lastResult.profit.toLocaleString()} points!`
                : `${lastResult.profit.toLocaleString()} points`}
            </p>
          </div>
        )}

        {/* Betting controls */}
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">Select Bet Amount</p>
            <div className="grid grid-cols-5 gap-2">
              {BET_AMOUNTS.map((amount) => (
                <Button
                  key={amount}
                  variant={betAmount === amount ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setBetAmount(amount)}
                  disabled={spinning}
                >
                  {amount}
                </Button>
              ))}
            </div>
          </div>

          <Button
            onClick={spin}
            disabled={spinning || balance <= 0}
            size="lg"
            className="w-full"
          >
            {spinning ? 'Spinning...' : `Spin (${betAmount} points)`}
          </Button>
        </div>

        {/* Message display */}
        {message && (
          <div className="text-center">
            <p className="text-sm">{message}</p>
          </div>
        )}

        {/* Balance display */}
        <div className="text-center pt-4 border-t">
          <p className="text-sm text-muted-foreground">Your Balance</p>
          <p className="text-2xl font-bold">{balance.toLocaleString()} points</p>
        </div>

        {/* Payout table */}
        <div className="pt-4 border-t">
          <p className="text-sm font-medium mb-2">Payouts</p>
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex justify-between">
              <span>3x 🕷️</span>
              <span>15x bet</span>
            </div>
            <div className="flex justify-between">
              <span>3x 🤖</span>
              <span>10x bet</span>
            </div>
            <div className="flex justify-between">
              <span>3x 🤓</span>
              <span>5x bet</span>
            </div>
            <div className="flex justify-between">
              <span>3x 💻</span>
              <span>3x bet</span>
            </div>
            <div className="flex justify-between">
              <span>3x ⚛️</span>
              <span>2x bet</span>
            </div>
            <div className="flex justify-between">
              <span>2x same</span>
              <span>1x bet (break even)</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
