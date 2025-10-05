'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Icons } from '@/components/icons';
import { createSupabaseBrowserClient } from '@repo/supabase/client';
import { GamblingTransaction, SlotSpin } from '@repo/supabase/gambling';

interface TransactionHistoryProps {
  userId: string;
}

type CombinedTransaction = {
  id: string;
  type: 'deposit' | 'withdrawal' | 'spin';
  amount: number;
  profit?: number;
  result?: string;
  symbols?: string;
  created_at: string;
};

export function TransactionHistory({ userId }: TransactionHistoryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [transactions, setTransactions] = useState<CombinedTransaction[]>([]);

  const loadHistory = async () => {
    setIsOpen(true);
    setIsLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();

      // Get gambling transactions (deposits and withdrawals)
      const { data: gamblingTxns } = await supabase
        .from('gambling_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(25);

      // Get slot spins
      const { data: spins } = await supabase
        .from('slot_spins')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(25);

      // Combine and format
      const combined: CombinedTransaction[] = [];

      (gamblingTxns || []).forEach((txn: GamblingTransaction) => {
        combined.push({
          id: `txn-${txn.id}`,
          type: txn.transaction_type as 'deposit' | 'withdrawal',
          amount: txn.amount,
          created_at: txn.created_at,
        });
      });

      (spins || []).forEach((spin: SlotSpin) => {
        combined.push({
          id: `spin-${spin.id}`,
          type: 'spin',
          amount: spin.bet_amount,
          profit: spin.profit,
          result: spin.result_type,
          symbols: `${spin.reel1_symbol} ${spin.reel2_symbol} ${spin.reel3_symbol}`,
          created_at: spin.created_at,
        });
      });

      // Sort by date and limit to 25 total
      combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setTransactions(combined.slice(0, 25));
    } catch (error) {
      console.error('Failed to load transaction history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTransactionDisplay = (txn: CombinedTransaction) => {
    switch (txn.type) {
      case 'deposit':
        return {
          label: 'Deposit',
          description: `Deposited ${txn.amount.toLocaleString()} points to gambling balance`,
          color: 'text-blue-500',
          icon: '💰',
        };
      case 'withdrawal':
        return {
          label: 'Withdrawal',
          description: `Withdrew ${txn.amount.toLocaleString()} points to main balance`,
          color: 'text-green-500',
          icon: '💵',
        };
      case 'spin':
        const isWin = (txn.profit || 0) > 0;
        const isBreakEven = txn.profit === 0;
        return {
          label: 'Slot Spin',
          description: `${txn.symbols} - Bet ${txn.amount.toLocaleString()}`,
          color: isWin ? 'text-green-500' : isBreakEven ? 'text-yellow-500' : 'text-red-500',
          icon: '🎰',
          profit: txn.profit,
        };
    }
  };

  return (
    <>
      <Button onClick={loadHistory} variant="outline" size="sm">
        View Transaction History
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Transaction History</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[60vh]">
            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <Icons.spinner className="h-8 w-8 animate-spin" />
              </div>
            ) : transactions.length > 0 ? (
              <ul className="space-y-3">
                {transactions.map((txn) => {
                  const display = getTransactionDisplay(txn);
                  return (
                    <li
                      key={txn.id}
                      className="flex justify-between items-start border-b pb-3"
                    >
                      <div className="flex gap-3 flex-1">
                        <span className="text-2xl">{display.icon}</span>
                        <div className="flex-1">
                          <p className="font-medium">{display.label}</p>
                          <p className="text-sm text-muted-foreground">
                            {display.description}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(txn.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {txn.type === 'spin' && display.profit !== undefined ? (
                          <p className={`font-bold ${display.color}`}>
                            {display.profit > 0 ? '+' : ''}
                            {display.profit.toLocaleString()}
                          </p>
                        ) : (
                          <p className={`font-bold ${display.color}`}>
                            {txn.type === 'deposit' ? '-' : '+'}
                            {txn.amount.toLocaleString()}
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No transaction history found.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
