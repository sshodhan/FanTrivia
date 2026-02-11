// Expense Splitting Algorithm
// All computation is client-side - no financial data is stored
// Generic: works for Squares, Poker, Fantasy, or any buy-in/payout game

export interface Expense {
  id: string;
  paidBy: string;       // WhatsApp name of person who paid
  description: string;  // What the expense was for
  amount: number;       // Total amount paid (or unitCount * costPerUnit)
  splitAmong: string[]; // WhatsApp names of people sharing this expense
  unitCount?: number;   // optional: 3 bags, 2 cases, etc.
  costPerUnit?: number; // optional: $5/bag, $25/case, etc.
}

/**
 * A player's entry in any game with buy-ins and payouts.
 * - Squares: unitCount=7 squares, costPerUnit=$10, totalOwed=$70, winnings from quarters
 * - Poker: unitCount=1 buy-in, costPerUnit=$50, totalOwed=$50, winnings from final pot
 */
export interface GameEntry {
  playerName: string;
  unitCount: number;      // squares purchased, buy-ins, etc.
  costPerUnit: number;    // $ per square, $ per buy-in
  totalOwed: number;      // unitCount * costPerUnit
  winnings: number;       // amount won (quarters, final pot, etc.)
  appUsername: string | null; // HawkTrivia username if they were logged in
}

// Backward-compatible alias
export type SquaresSettlement = GameEntry;

export interface Settlement {
  from: string;   // person who owes
  to: string;     // person who is owed
  amount: number; // how much
}

export interface BalanceSummary {
  name: string;
  totalPaid: number;    // how much they actually paid out of pocket
  totalShare: number;   // how much they should have paid (their fair share)
  netBalance: number;   // positive = they are owed, negative = they owe
}

/**
 * Calculate how much each person's fair share is for all expenses,
 * factoring in game entry fees and winnings.
 *
 * nameMap: maps game player names to WhatsApp names so they
 * are treated as the same person in the calculation.
 */
export function calculateBalances(
  expenses: Expense[],
  gameEntries: GameEntry[],
  potCollector: string | null, // who collected the game pot money
  nameMap?: Map<string, string>, // gameName -> whatsappName
): BalanceSummary[] {
  const balanceMap = new Map<string, { paid: number; share: number }>();

  // Resolve a squares name to its mapped WhatsApp name (or itself)
  const resolve = (name: string): string => {
    return nameMap?.get(name) ?? name;
  };

  const getOrCreate = (name: string) => {
    if (!balanceMap.has(name)) {
      balanceMap.set(name, { paid: 0, share: 0 });
    }
    return balanceMap.get(name)!;
  };

  // Process shared expenses (party supplies, venue, food, etc.)
  for (const expense of expenses) {
    if (expense.splitAmong.length === 0) continue;
    const perPerson = expense.amount / expense.splitAmong.length;

    // The payer paid the full amount
    const payer = getOrCreate(expense.paidBy);
    payer.paid += expense.amount;

    // Each person in the split owes their share
    for (const person of expense.splitAmong) {
      const p = getOrCreate(person);
      p.share += perPerson;
    }
  }

  // Process game entry fees (squares buy-ins, poker buy-ins, etc.)
  if (gameEntries.length > 0) {
    const totalPot = gameEntries.reduce((sum, s) => sum + s.totalOwed, 0);
    const totalWinnings = gameEntries.reduce((sum, s) => sum + s.winnings, 0);

    for (const settlement of gameEntries) {
      const resolvedName = resolve(settlement.playerName);
      const player = getOrCreate(resolvedName);
      // They owe their entry fees
      player.share += settlement.totalOwed;
      // They receive their winnings
      player.paid += settlement.winnings;
    }

    // If someone collected the pot physically, balance their books:
    // they received all entry fees and paid out all winnings
    if (potCollector) {
      const collector = getOrCreate(potCollector);
      collector.paid += totalPot;       // collected all entry fees
      collector.share += totalWinnings; // paid out all winnings
    }
  }

  // Build summaries
  const summaries: BalanceSummary[] = [];
  for (const [name, { paid, share }] of balanceMap) {
    summaries.push({
      name,
      totalPaid: Math.round(paid * 100) / 100,
      totalShare: Math.round(share * 100) / 100,
      netBalance: Math.round((paid - share) * 100) / 100,
    });
  }

  return summaries.sort((a, b) => b.netBalance - a.netBalance);
}

/**
 * Minimize the number of transactions needed to settle all debts.
 * Uses a greedy algorithm: match the largest creditor with the largest debtor.
 */
export function minimizeTransactions(balances: BalanceSummary[]): Settlement[] {
  // Separate into creditors (owed money) and debtors (owe money)
  const creditors: { name: string; amount: number }[] = [];
  const debtors: { name: string; amount: number }[] = [];

  for (const b of balances) {
    if (b.netBalance > 0.01) {
      creditors.push({ name: b.name, amount: b.netBalance });
    } else if (b.netBalance < -0.01) {
      debtors.push({ name: b.name, amount: Math.abs(b.netBalance) });
    }
  }

  // Sort descending by amount
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const settlements: Settlement[] = [];
  let i = 0;
  let j = 0;

  while (i < creditors.length && j < debtors.length) {
    const amount = Math.min(creditors[i].amount, debtors[j].amount);

    if (amount > 0.01) {
      settlements.push({
        from: debtors[j].name,
        to: creditors[i].name,
        amount: Math.round(amount * 100) / 100,
      });
    }

    creditors[i].amount -= amount;
    debtors[j].amount -= amount;

    if (creditors[i].amount < 0.01) i++;
    if (debtors[j].amount < 0.01) j++;
  }

  return settlements;
}

/**
 * Generate a WhatsApp-friendly settlement message
 */
export function generateWhatsAppMessage(
  settlements: Settlement[],
  balances: BalanceSummary[],
  expenses: Expense[],
  gameEntries: GameEntry[],
  auditLog?: AuditEntry[],
  nameMap?: Map<string, string>,
  gameLabel?: string, // e.g. "Squares", "Poker Night", "Fantasy League"
): string {
  const lines: string[] = [];

  lines.push('*Super Bowl Party - Expense Settlement*');
  lines.push('');

  // Expense summary
  if (expenses.length > 0) {
    lines.push('*Shared Expenses:*');
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    for (const exp of expenses) {
      const unitDetail = exp.unitCount && exp.costPerUnit
        ? ` (${exp.unitCount} x $${exp.costPerUnit.toFixed(2)})`
        : '';
      lines.push(`- ${exp.description}${unitDetail}: $${exp.amount.toFixed(2)} (paid by ${exp.paidBy})`);
    }
    lines.push(`Total: $${totalExpenses.toFixed(2)}`);
    lines.push('');
  }

  // Game summary (generic: squares, poker, etc.)
  if (gameEntries.length > 0) {
    const label = gameLabel || 'Game';
    const totalPot = gameEntries.reduce((sum, s) => sum + s.totalOwed, 0);
    lines.push(`*${label}:*`);
    lines.push(`Total pot: $${totalPot.toFixed(2)}`);
    const winners = gameEntries.filter(s => s.winnings > 0);
    if (winners.length > 0) {
      for (const w of winners) {
        lines.push(`- ${w.playerName} won $${w.winnings.toFixed(2)}`);
      }
    }
    lines.push('');
  }

  // Name mappings
  if (nameMap && nameMap.size > 0) {
    lines.push('*Name Mappings (Game -> WhatsApp):*');
    for (const [sqName, waName] of nameMap) {
      lines.push(`- ${sqName} = ${waName}`);
    }
    lines.push('');
  }

  // Who owes who
  if (settlements.length > 0) {
    lines.push('*Who pays who:*');
    for (const s of settlements) {
      lines.push(`${s.from} -> ${s.to}: *$${s.amount.toFixed(2)}*`);
    }
  } else {
    lines.push('All settled up!');
  }

  // Audit trail
  if (auditLog && auditLog.length > 0) {
    lines.push('');
    lines.push(formatAuditForWhatsApp(auditLog));
  }

  lines.push('');
  lines.push('_Generated by HawkTrivia Expense Bot_');

  return lines.join('\n');
}

// ============================================
// AUDIT TRAIL
// ============================================

export type AuditAction =
  | 'person_added'
  | 'person_removed'
  | 'expense_added'
  | 'expense_removed'
  | 'game_linked'
  | 'game_unlinked'
  | 'game_player_added'
  | 'game_player_removed'
  | 'fee_override'
  | 'payout_override'
  | 'pot_collector_set'
  | 'names_imported'
  | 'name_mapped'
  | 'settlement_calculated';

export interface AuditEntry {
  id: string;
  action: AuditAction;
  description: string;
  timestamp: number; // Date.now()
}

const AUDIT_LABELS: Record<AuditAction, string> = {
  person_added: 'Added person',
  person_removed: 'Removed person',
  expense_added: 'Added expense',
  expense_removed: 'Removed expense',
  game_linked: 'Linked game',
  game_unlinked: 'Unlinked game',
  game_player_added: 'Added game player',
  game_player_removed: 'Removed game player',
  fee_override: 'Set buy-in amount',
  payout_override: 'Set payout amount',
  pot_collector_set: 'Set pot collector',
  names_imported: 'Imported names',
  name_mapped: 'Linked name',
  settlement_calculated: 'Calculated settlement',
};

export function createAuditEntry(action: AuditAction, detail: string): AuditEntry {
  return {
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    action,
    description: `${AUDIT_LABELS[action]}: ${detail}`,
    timestamp: Date.now(),
  };
}

export function formatAuditTime(timestamp: number): string {
  const d = new Date(timestamp);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Format audit trail for WhatsApp message
 */
export function formatAuditForWhatsApp(auditLog: AuditEntry[]): string {
  if (auditLog.length === 0) return '';

  const lines: string[] = [];
  lines.push('*Audit Trail:*');
  for (const entry of auditLog) {
    const time = formatAuditTime(entry.timestamp);
    lines.push(`[${time}] ${entry.description}`);
  }
  return lines.join('\n');
}

/**
 * Generate a unique ID for expenses (no crypto needed, just for UI keys)
 */
export function generateExpenseId(): string {
  return `exp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}
