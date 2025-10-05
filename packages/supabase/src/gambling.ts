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
export async function isGamblingWindowOpen(_supabase: SupabaseClient) {
  const window = await getNextGamblingWindow(_supabase);
  return window.is_open;
}

const CHICAGO_TIME_ZONE = 'America/Chicago';
const WINDOW_START_MINUTES = [150, 330, 510, 690, 870, 1050, 1230, 1410];
const WINDOW_DURATION_MINUTES = 30;
const MS_PER_MINUTE = 60_000;
const MS_PER_DAY = 86_400_000;

type GamblingWindow = {
  start: Date;
  end: Date;
};

function parseOffsetMinutes(date: Date) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: CHICAGO_TIME_ZONE,
    timeZoneName: 'shortOffset',
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const timeZonePart = formatter
    .formatToParts(date)
    .find((part) => part.type === 'timeZoneName')?.value;

  if (!timeZonePart) {
    throw new Error('Unable to determine Chicago timezone offset');
  }

  const match = timeZonePart.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);

  if (!match) {
    throw new Error(`Unexpected timezone offset format: ${timeZonePart}`);
  }

  const sign = match[1] === '-' ? -1 : 1;
  const hours = Number(match[2]);
  const minutes = Number(match[3] ?? '0');

  return sign * (hours * 60 + minutes);
}

function createChicagoDate(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0
) {
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, second);
  let offsetMinutes = parseOffsetMinutes(new Date(utcGuess));
  let candidate = new Date(utcGuess - offsetMinutes * MS_PER_MINUTE);
  const adjustedOffset = parseOffsetMinutes(candidate);

  if (adjustedOffset !== offsetMinutes) {
    offsetMinutes = adjustedOffset;
    candidate = new Date(utcGuess - offsetMinutes * MS_PER_MINUTE);
  }

  return candidate;
}

function mapDateParts(date: Date) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: CHICAGO_TIME_ZONE,
    hour12: false,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  });

  const parts = formatter.formatToParts(date);
  const partMap: Record<string, number> = {};

  for (const part of parts) {
    if (part.type !== 'literal') {
      partMap[part.type] = Number(part.value);
    }
  }

  return partMap as {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
  };
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * MS_PER_MINUTE);
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

function buildWindowSet(anchorMidnight: Date) {
  const windows: GamblingWindow[] = [];

  for (const offsetMinutes of WINDOW_START_MINUTES) {
    const start = addMinutes(anchorMidnight, offsetMinutes);
    const end = addMinutes(start, WINDOW_DURATION_MINUTES);
    windows.push({ start, end });
  }

  return windows;
}

// Get next gambling window info
export async function getNextGamblingWindow(_supabase: SupabaseClient) {
  const now = new Date();
  const { year, month, day, hour, minute, second } = mapDateParts(now);
  const nowChicago = createChicagoDate(year, month, day, hour, minute, second);
  const midnightToday = createChicagoDate(year, month, day, 0, 0, 0);

  const candidateWindows = [
    ...buildWindowSet(addDays(midnightToday, -1)),
    ...buildWindowSet(midnightToday),
    ...buildWindowSet(addDays(midnightToday, 1)),
  ].sort((a, b) => a.start.getTime() - b.start.getTime());

  const currentWindow = candidateWindows.find(
    (window) => window.start.getTime() <= nowChicago.getTime() && nowChicago.getTime() < window.end.getTime()
  );

  const nextWindow = candidateWindows.find((window) => window.start.getTime() > nowChicago.getTime());

  if (currentWindow) {
    return {
      is_open: true,
      opens_at: null,
      closes_at: currentWindow.end.toISOString(),
    };
  }

  if (!nextWindow) {
    // Fallback: should not occur, but ensure we always return something reasonable
    const defaultStart = addMinutes(addDays(midnightToday, 1), WINDOW_START_MINUTES[0]);
    return {
      is_open: false,
      opens_at: defaultStart.toISOString(),
      closes_at: addMinutes(defaultStart, WINDOW_DURATION_MINUTES).toISOString(),
    };
  }

  return {
    is_open: false,
    opens_at: nextWindow.start.toISOString(),
    closes_at: nextWindow.end.toISOString(),
  };
}
