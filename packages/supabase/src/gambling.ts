import { SupabaseClient } from '@supabase/supabase-js';

export interface GamblingBalance {
  user_id: string;
  balance: number;
  lifetime_deposited: number;
  lifetime_withdrawn: number;
  lifetime_wagered: number;
  lifetime_won: number;
  updated_at: string;
}

export interface GamblingTransaction {
  id: number;
  user_id: string;
  transaction_type: string;
  amount: number;
  main_balance_before: number | null;
  main_balance_after: number | null;
  gambling_balance_before: number | null;
  gambling_balance_after: number | null;
  notes: string | null;
  created_at: string;
}

export interface SlotSpin {
  id: number;
  user_id: string;
  bet_amount: number;
  reel1_symbol: string;
  reel2_symbol: string;
  reel3_symbol: string;
  result_type: string;
  payout_amount: number;
  profit: number;
  gambling_balance_before: number;
  gambling_balance_after: number;
  created_at: string;
}

export interface GamblingSettings {
  id: number;
  is_enabled: boolean;
  allow_deposits: boolean;
  allow_withdrawals: boolean;
  min_deposit: number;
  max_deposit: number;
  max_deposit_per_day: number;
  min_withdrawal: number;
  closure_message: string | null;
}

// Get user's gambling balance
export async function getGamblingBalance(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from('gambling_balances')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data as GamblingBalance | null;
}

// Get gambling settings
export async function getGamblingSettings(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('gambling_settings')
    .select('*')
    .eq('id', 1)
    .single();

  if (error) throw error;
  return data as GamblingSettings;
}

// Get user's recent transactions
export async function getRecentTransactions(supabase: SupabaseClient, userId: string, limit = 10) {
  const { data, error } = await supabase
    .from('gambling_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as GamblingTransaction[];
}

// Get user's recent spins
export async function getRecentSpins(supabase: SupabaseClient, userId: string, limit = 10) {
  const { data, error } = await supabase
    .from('slot_spins')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as SlotSpin[];
}

// Deposit points into gambling balance
export async function depositToGambling(
  supabase: SupabaseClient,
  userId: string,
  amount: number
) {
  const { data, error } = await supabase.rpc('deposit_to_gambling', {
    p_user_id: userId,
    p_amount: amount,
  });

  if (error) throw error;
  return data;
}

// Withdraw from gambling balance to main balance
export async function withdrawFromGambling(
  supabase: SupabaseClient,
  userId: string,
  amount: number
) {
  const { data, error } = await supabase.rpc('withdraw_from_gambling', {
    p_user_id: userId,
    p_amount: amount,
  });

  if (error) throw error;
  return data;
}

// Play slot machine
export async function playSlot(
  supabase: SupabaseClient,
  userId: string,
  betAmount: number
) {
  const { data, error } = await supabase.rpc('play_slot', {
    p_user_id: userId,
    p_bet_amount: betAmount,
  });

  if (error) throw error;
  return data as SlotSpin;
}

// Check if user has accepted disclaimer
export async function hasAcceptedDisclaimer(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from('gambling_disclaimer_acceptances')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return !!data;
}

// Accept gambling disclaimer
export async function acceptDisclaimer(supabase: SupabaseClient, userId: string) {
  const { error } = await supabase
    .from('gambling_disclaimer_acceptances')
    .insert({ user_id: userId });

  if (error) throw error;
}

// Check if gambling window is currently open
export async function isGamblingWindowOpen(supabase: SupabaseClient) {
  const { data, error } = await supabase.rpc('is_gambling_window_open');
  if (error) throw error;
  return data as boolean;
}

// Get next gambling window info
export async function getNextGamblingWindow(supabase: SupabaseClient) {
  const { data, error } = await supabase.rpc('get_next_gambling_window');
  if (error) throw error;
  return data as {
    is_open: boolean;
    opens_at: string | null;
    closes_at: string;
  };
}
