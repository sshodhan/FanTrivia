'use client';

import { useState, useCallback, useMemo } from 'react';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  calculateBalances,
  minimizeTransactions,
  generateWhatsAppMessage,
  generateExpenseId,
  createAuditEntry,
  formatAuditTime,
  type Expense,
  type GameEntry,
  type AuditEntry,
} from '@/lib/expense-splitter';

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface ExpenseSplitterScreenProps {
  onBack: () => void;
  onOpenClaimPage?: (gameId: string) => void;
}

export function ExpenseSplitterScreen({ onBack, onOpenClaimPage }: ExpenseSplitterScreenProps) {
  // State for people in the WhatsApp group
  const [people, setPeople] = useState<string[]>([]);
  const [newPersonName, setNewPersonName] = useState('');

  // State for expenses
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [newExpenseDesc, setNewExpenseDesc] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');
  const [newExpensePaidBy, setNewExpensePaidBy] = useState('');
  const [splitMode, setSplitMode] = useState<'everyone' | 'custom'>('everyone');
  const [customSplit, setCustomSplit] = useState<Set<string>>(new Set());
  // Amount entry: 'flat' = enter total directly, 'units' = enter quantity x price
  const [amountMode, setAmountMode] = useState<'flat' | 'units'>('flat');
  const [newExpenseQty, setNewExpenseQty] = useState('');
  const [newExpenseUnitPrice, setNewExpenseUnitPrice] = useState('');

  // Game mode: 'squares' = link to DB game, 'custom' = manual entry (poker, fantasy, etc.)
  const [gameMode, setGameMode] = useState<'squares' | 'custom'>('squares');
  const [gameLabel, setGameLabel] = useState('Squares'); // user-editable label

  // State for squares integration
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [potCollector, setPotCollector] = useState<string>('');
  // Admin-editable fee per unit (null = use game default)
  const [feeOverride, setFeeOverride] = useState<number | null>(null);
  // Custom quarter payout percentages for squares mode (default: even 25% each)
  const [quarterPayouts, setQuarterPayouts] = useState<[number, number, number, number]>([25, 25, 25, 25]);

  // State for custom game mode (poker, fantasy, etc.)
  const [customEntries, setCustomEntries] = useState<GameEntry[]>([]);
  const [newCustomPlayer, setNewCustomPlayer] = useState('');
  const [newCustomBuyIn, setNewCustomBuyIn] = useState('');
  const [newCustomPayout, setNewCustomPayout] = useState('');

  // Name mapping: game player name -> WhatsApp name
  // Used when someone's game name differs from their WhatsApp name
  const [nameMap, setNameMap] = useState<Map<string, string>>(new Map());

  // Audit trail - tracks all actions for transparency
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);

  const addAudit = useCallback((action: AuditEntry['action'], detail: string) => {
    setAuditLog((prev: AuditEntry[]) => [...prev, createAuditEntry(action, detail)]);
  }, []);

  // State for UI
  const [showResults, setShowResults] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'people' | 'expenses' | 'game' | 'activity'>('people');

  // Fetch available squares games
  const { data: gamesData } = useSWR('/api/squares', fetcher);
  const games = gamesData?.games || [];

  // Fetch settlement data for selected game
  const { data: settlementData } = useSWR(
    selectedGameId ? `/api/squares/settlements?game_id=${selectedGameId}` : null,
    fetcher
  );

  const rawSquaresEntries: GameEntry[] = (settlementData?.settlements || []).map(
    (s: { playerName: string; unitCount: number; costPerUnit: number; totalOwed: number; winnings: number; appUsername: string | null }) => ({
      playerName: s.playerName,
      unitCount: s.unitCount,
      costPerUnit: s.costPerUnit,
      totalOwed: s.totalOwed,
      winnings: s.winnings,
      appUsername: s.appUsername,
    })
  );
  const squaresPlayers: string[] = settlementData?.players || [];

  // The effective fee per unit: admin override or game default
  const gameFee: number = settlementData?.game?.entryFee ?? 0;
  const effectiveFee = feeOverride ?? gameFee;

  // Recompute squares entries with the admin's fee/payout overrides
  const squaresEntries: GameEntry[] = useMemo(() => {
    const isDefaultFee = effectiveFee === gameFee;
    const isDefaultPayouts = quarterPayouts[0] === 25 && quarterPayouts[1] === 25 && quarterPayouts[2] === 25 && quarterPayouts[3] === 25;
    if (isDefaultFee && isDefaultPayouts) return rawSquaresEntries;

    // Recalculate totalOwed and winnings with the new fee & payout splits
    const totalUnits = rawSquaresEntries.reduce((sum, s) => sum + s.unitCount, 0);
    const newTotalPot = totalUnits * effectiveFee;

    // Figure out which quarter each winner won, then apply custom payout %
    return rawSquaresEntries.map(s => {
      let newWinnings = 0;
      if (s.winnings > 0 && gameFee > 0) {
        // Determine how many quarters won and which ones
        const originalQuarterPayout = settlementData?.quarterPayout || 1;
        const quartersWon = Math.round(s.winnings / originalQuarterPayout);
        // With custom payouts, we can't know WHICH quarters they won from the API alone,
        // so we apply an average of the custom payout rates for their quarter count
        const totalPayoutPct = quarterPayouts.reduce((sum: number, pct: number) => sum + pct, 0);
        const avgPayoutPct = totalPayoutPct > 0 ? totalPayoutPct / 4 : 25;
        newWinnings = quartersWon * (newTotalPot * avgPayoutPct / 100);
      }
      return {
        ...s,
        costPerUnit: effectiveFee,
        totalOwed: s.unitCount * effectiveFee,
        winnings: newWinnings,
      };
    });
  }, [rawSquaresEntries, effectiveFee, gameFee, quarterPayouts, settlementData?.quarterPayout]);

  // The final game entries: either from squares DB or manual custom entries
  const gameEntries: GameEntry[] = gameMode === 'squares' ? squaresEntries : customEntries;

  // Fetch identity claims for the selected game
  const { data: claimsData, mutate: mutateClaims } = useSWR(
    selectedGameId ? `/api/squares/settlements/claims?game_id=${selectedGameId}` : null,
    fetcher
  );
  const claims: {
    id: string;
    squares_player_name: string;
    whatsapp_name: string;
    app_username: string | null;
    squares_count: number;
    status: 'pending' | 'approved' | 'rejected';
  }[] = claimsData?.claims || [];

  // Review a claim (approve/reject)
  const handleReviewClaim = useCallback(async (claimId: string, status: 'approved' | 'rejected') => {
    try {
      await fetch('/api/squares/settlements/claims/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claim_id: claimId, status }),
      });
      mutateClaims();

      const claim = claims.find((c: { id: string }) => c.id === claimId);
      if (claim) {
        addAudit(
          status === 'approved' ? 'name_mapped' : 'person_removed',
          status === 'approved'
            ? `Approved claim: "${claim.squares_player_name}" = "${claim.whatsapp_name}"`
            : `Rejected claim: "${claim.squares_player_name}" by "${claim.whatsapp_name}"`
        );
      }
    } catch {
      // silent fail - user can retry
    }
  }, [mutateClaims, claims, addAudit]);

  // Import approved claims into people list + name map
  const approvedClaims = claims.filter((c: { status: string }) => c.status === 'approved');

  const handleImportApprovedClaims = useCallback(() => {
    if (approvedClaims.length === 0) return;

    const newPeople = new Set(people);
    const newMap = new Map(nameMap);
    const imported: string[] = [];

    for (const claim of approvedClaims) {
      // Add the WhatsApp name to people list
      if (!newPeople.has(claim.whatsapp_name)) {
        newPeople.add(claim.whatsapp_name);
        imported.push(claim.whatsapp_name);
      }
      // Set name mapping if squares name differs from WhatsApp name
      if (claim.squares_player_name !== claim.whatsapp_name) {
        newMap.set(claim.squares_player_name, claim.whatsapp_name);
      }
    }

    setPeople(Array.from(newPeople));
    setNameMap(newMap);

    if (imported.length > 0) {
      addAudit('names_imported', `${imported.length} verified identities from claims (${imported.join(', ')})`);
    }
  }, [approvedClaims, people, nameMap, addAudit]);

  // Add a person
  const handleAddPerson = useCallback(() => {
    const name = newPersonName.trim();
    if (!name || people.includes(name)) return;
    setPeople((prev: string[]) => [...prev, name]);
    setNewPersonName('');
    addAudit('person_added', name);
  }, [newPersonName, people, addAudit]);

  // Remove a person
  const handleRemovePerson = useCallback((name: string) => {
    setPeople((prev: string[]) => prev.filter((p: string) => p !== name));
    setExpenses((prev: Expense[]) => prev.filter((e: Expense) => {
      if (e.paidBy === name) return false;
      const newSplit = e.splitAmong.filter((p: string) => p !== name);
      if (newSplit.length === 0) return false;
      e.splitAmong = newSplit;
      return true;
    }));
    addAudit('person_removed', name);
  }, [addAudit]);

  // Import names from squares game
  const handleImportSquaresPlayers = useCallback(() => {
    if (!squaresPlayers.length) return;
    setPeople((prev: string[]) => {
      const combined = new Set([...prev, ...squaresPlayers]);
      return Array.from(combined);
    });
    addAudit('names_imported', `${squaresPlayers.length} names (${squaresPlayers.join(', ')})`);
  }, [squaresPlayers, addAudit]);

  // Add an expense
  const handleAddExpense = useCallback(() => {
    const desc = newExpenseDesc.trim();
    if (!desc || !newExpensePaidBy) return;

    let amount: number;
    let unitCount: number | undefined;
    let costPerUnit: number | undefined;

    if (amountMode === 'units') {
      const qty = parseFloat(newExpenseQty);
      const price = parseFloat(newExpenseUnitPrice);
      if (isNaN(qty) || qty <= 0 || isNaN(price) || price <= 0) return;
      unitCount = qty;
      costPerUnit = price;
      amount = qty * price;
    } else {
      amount = parseFloat(newExpenseAmount);
      if (isNaN(amount) || amount <= 0) return;
    }

    const splitAmong = splitMode === 'everyone'
      ? [...people]
      : Array.from(customSplit);

    if (splitAmong.length === 0) return;

    setExpenses((prev: Expense[]) => [
      ...prev,
      {
        id: generateExpenseId(),
        paidBy: newExpensePaidBy,
        description: desc,
        amount,
        splitAmong,
        ...(unitCount !== undefined && { unitCount, costPerUnit }),
      },
    ]);

    const unitDetail = unitCount ? ` (${unitCount} x $${costPerUnit!.toFixed(2)})` : '';
    addAudit('expense_added', `${desc}${unitDetail} - $${amount.toFixed(2)} paid by ${newExpensePaidBy}, split among ${splitAmong.length} people`);

    setNewExpenseDesc('');
    setNewExpenseAmount('');
    setNewExpenseQty('');
    setNewExpenseUnitPrice('');
    setNewExpensePaidBy('');
    setSplitMode('everyone');
    setCustomSplit(new Set());
  }, [newExpenseDesc, newExpenseAmount, newExpensePaidBy, splitMode, customSplit, people, addAudit, amountMode, newExpenseQty, newExpenseUnitPrice]);

  // Remove an expense
  const handleRemoveExpense = useCallback((id: string) => {
    const removed = expenses.find((e: Expense) => e.id === id);
    setExpenses((prev: Expense[]) => prev.filter((e: Expense) => e.id !== id));
    if (removed) {
      addAudit('expense_removed', `${removed.description} - $${removed.amount.toFixed(2)}`);
    }
  }, [expenses, addAudit]);

  // Toggle person in custom split
  const toggleCustomSplit = useCallback((name: string) => {
    setCustomSplit((prev: Set<string>) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  }, []);

  // Calculate results
  const results = useMemo(() => {
    if (!showResults) return null;
    const balances = calculateBalances(expenses, gameEntries, potCollector || null, nameMap);
    const settlements = minimizeTransactions(balances);
    const message = generateWhatsAppMessage(settlements, balances, expenses, gameEntries, auditLog, nameMap, gameLabel);
    return { balances, settlements, message };
  }, [showResults, expenses, gameEntries, potCollector, auditLog, nameMap, gameLabel]);

  // Copy to clipboard
  const handleCopy = useCallback(async () => {
    if (!results?.message) return;
    try {
      await navigator.clipboard.writeText(results.message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = results.message;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [results?.message]);

  const canCalculate = people.length >= 2 && (expenses.length > 0 || gameEntries.length > 0);

  // Results view
  if (showResults && results) {
    return (
      <div className="min-h-screen flex flex-col bg-background pb-20">
        <header className="p-4 flex items-center gap-3 border-b border-border">
          <button onClick={() => setShowResults(false)} className="text-muted-foreground hover:text-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <h1 className="font-[var(--font-heading)] text-xl font-bold text-foreground">
            Settlement Results
          </h1>
        </header>

        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          {/* Balance Summary */}
          <div className="bg-card rounded-xl p-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Balance Summary
            </h3>
            <div className="space-y-2">
              {results.balances.map((b: { name: string; totalPaid: number; totalShare: number; netBalance: number }) => (
                <div key={b.name} className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2">
                  <div>
                    <span className="font-medium text-foreground">{b.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      paid ${b.totalPaid.toFixed(2)} / share ${b.totalShare.toFixed(2)}
                    </span>
                  </div>
                  <span className={`font-bold ${b.netBalance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {b.netBalance >= 0 ? '+' : ''}{b.netBalance.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Who Pays Who */}
          <div className="bg-card rounded-xl p-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Who Pays Who
            </h3>
            {results.settlements.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">All settled up!</p>
            ) : (
              <div className="space-y-3">
                {results.settlements.map((s: { from: string; to: string; amount: number }, idx: number) => (
                  <div key={idx} className="flex items-center gap-3 bg-muted/30 rounded-lg px-4 py-3">
                    <span className="font-medium text-red-400 flex-1 text-right">{s.from}</span>
                    <div className="flex flex-col items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                      <span className="text-xs font-bold text-primary">${s.amount.toFixed(2)}</span>
                    </div>
                    <span className="font-medium text-green-400 flex-1">{s.to}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Audit Trail */}
          {auditLog.length > 0 && (
            <div className="bg-card rounded-xl p-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Audit Trail ({auditLog.length} actions)
              </h3>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {auditLog.map((entry: AuditEntry) => (
                  <div key={entry.id} className="flex items-start justify-between gap-2 text-xs bg-muted/30 rounded px-2 py-1.5">
                    <span className="text-foreground">{entry.description}</span>
                    <span className="text-muted-foreground whitespace-nowrap">{formatAuditTime(entry.timestamp)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* WhatsApp Message Preview */}
          <div className="bg-card rounded-xl p-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              WhatsApp Message
            </h3>
            <pre className="text-sm text-foreground whitespace-pre-wrap bg-muted/30 rounded-lg p-3 font-mono text-xs leading-relaxed">
              {results.message}
            </pre>
            <Button
              onClick={handleCopy}
              className="w-full mt-3 bg-green-600 text-white hover:bg-green-700"
            >
              {copied ? 'Copied!' : 'Copy for WhatsApp'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background pb-20">
      {/* Header */}
      <header className="p-4 flex items-center gap-3 border-b border-border">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <div className="flex-1">
          <h1 className="font-[var(--font-heading)] text-xl font-bold text-foreground">
            Expense Splitter
          </h1>
          <p className="text-xs text-muted-foreground">
            Who owes who from the party
          </p>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {(['people', 'expenses', 'game', 'activity'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab === 'people' && `People (${people.length})`}
            {tab === 'expenses' && `Expenses (${expenses.length})`}
            {tab === 'game' && `Game (${gameEntries.length})`}
            {tab === 'activity' && `Activity (${auditLog.length})`}
          </button>
        ))}
      </div>

      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {/* People Tab */}
        {activeTab === 'people' && (
          <>
            <p className="text-sm text-muted-foreground">
              Add everyone from the WhatsApp thread. Use their WhatsApp display names.
            </p>

            {/* Add person form */}
            <div className="flex gap-2">
              <Input
                value={newPersonName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPersonName(e.target.value)}
                placeholder="WhatsApp name..."
                className="bg-input flex-1"
                onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && handleAddPerson()}
              />
              <Button
                onClick={handleAddPerson}
                disabled={!newPersonName.trim()}
                className="bg-primary text-primary-foreground"
              >
                Add
              </Button>
            </div>

            {/* Import from verified claims (preferred) */}
            {approvedClaims.length > 0 && (
              <button
                onClick={handleImportApprovedClaims}
                className="w-full bg-green-500/20 text-green-400 rounded-lg px-3 py-2 text-sm font-medium hover:bg-green-500/30 transition-colors"
              >
                Import {approvedClaims.length} verified identities (admin-approved)
              </button>
            )}

            {/* Import from squares (fallback) */}
            {squaresPlayers.length > 0 && approvedClaims.length === 0 && (
              <button
                onClick={handleImportSquaresPlayers}
                className="w-full bg-amber-500/20 text-amber-400 rounded-lg px-3 py-2 text-sm font-medium hover:bg-amber-500/30 transition-colors"
              >
                Import {squaresPlayers.length} names from Squares game
              </button>
            )}

            {/* People list */}
            {people.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">👥</div>
                <p className="text-muted-foreground text-sm">
                  Add people from your WhatsApp group
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {people.map((name: string) => (
                  <div key={name} className="flex items-center justify-between bg-card rounded-lg px-4 py-3">
                    <span className="font-medium text-foreground">{name}</span>
                    <button
                      onClick={() => handleRemovePerson(name)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Expenses Tab */}
        {activeTab === 'expenses' && (
          <>
            {people.length < 2 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">👈</div>
                <p className="text-muted-foreground text-sm">
                  Add at least 2 people first
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Add what people paid for. Nothing is saved - this stays in your browser only.
                </p>

                {/* Add expense form */}
                <div className="bg-card rounded-xl p-4 space-y-3">
                  <Input
                    value={newExpenseDesc}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewExpenseDesc(e.target.value)}
                    placeholder="What was it for? (e.g. Bags of ice, Venue deposit)"
                    className="bg-input"
                  />

                  {/* Amount entry mode toggle */}
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Amount</label>
                    <div className="flex gap-2 mb-2">
                      <button
                        onClick={() => setAmountMode('flat')}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          amountMode === 'flat'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        Flat amount
                      </button>
                      <button
                        onClick={() => setAmountMode('units')}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          amountMode === 'units'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        Qty x Price
                      </button>
                    </div>

                    {amountMode === 'flat' ? (
                      <Input
                        value={newExpenseAmount}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewExpenseAmount(e.target.value)}
                        placeholder="Total amount ($)"
                        type="number"
                        min="0"
                        step="0.01"
                        className="bg-input"
                      />
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Input
                            value={newExpenseQty}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewExpenseQty(e.target.value)}
                            placeholder="Qty (e.g. 3)"
                            type="number"
                            min="0"
                            step="1"
                            className="bg-input"
                          />
                        </div>
                        <div>
                          <Input
                            value={newExpenseUnitPrice}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewExpenseUnitPrice(e.target.value)}
                            placeholder="$/each (e.g. 5)"
                            type="number"
                            min="0"
                            step="0.01"
                            className="bg-input"
                          />
                        </div>
                        {newExpenseQty && newExpenseUnitPrice && (
                          <div className="col-span-2 text-xs text-muted-foreground text-right">
                            = ${(parseFloat(newExpenseQty) * parseFloat(newExpenseUnitPrice) || 0).toFixed(2)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Paid by</label>
                    <Select value={newExpensePaidBy} onValueChange={setNewExpensePaidBy}>
                      <SelectTrigger className="w-full bg-input">
                        <SelectValue placeholder="Who paid?" />
                      </SelectTrigger>
                      <SelectContent>
                        {people.map((name: string) => (
                          <SelectItem key={name} value={name}>{name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Split among</label>
                    <div className="flex gap-2 mb-2">
                      <button
                        onClick={() => setSplitMode('everyone')}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          splitMode === 'everyone'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        Everyone
                      </button>
                      <button
                        onClick={() => setSplitMode('custom')}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          splitMode === 'custom'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        Custom
                      </button>
                    </div>
                    {splitMode === 'custom' && (
                      <div className="flex flex-wrap gap-2">
                        {people.map((name: string) => (
                          <button
                            key={name}
                            onClick={() => toggleCustomSplit(name)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                              customSplit.has(name)
                                ? 'bg-primary/20 text-primary border border-primary/40'
                                : 'bg-muted text-muted-foreground border border-transparent'
                            }`}
                          >
                            {name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={handleAddExpense}
                    disabled={
                      !newExpenseDesc.trim() ||
                      !newExpensePaidBy ||
                      (amountMode === 'flat' ? !newExpenseAmount : (!newExpenseQty || !newExpenseUnitPrice))
                    }
                    className="w-full bg-primary text-primary-foreground"
                  >
                    Add Expense
                  </Button>
                </div>

                {/* Expense list */}
                {expenses.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Added Expenses
                    </h3>
                    {expenses.map((exp: Expense) => (
                      <div key={exp.id} className="bg-card rounded-lg px-4 py-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium text-foreground">{exp.description}</span>
                            <span className="text-primary font-bold ml-2">${exp.amount.toFixed(2)}</span>
                            {exp.unitCount && exp.costPerUnit && (
                              <span className="text-muted-foreground text-xs ml-1">
                                ({exp.unitCount} x ${exp.costPerUnit.toFixed(2)})
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => handleRemoveExpense(exp.id)}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                          </button>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Paid by {exp.paidBy} · Split among {exp.splitAmong.length} people
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <>
            <p className="text-sm text-muted-foreground">
              Full audit trail of every action. This is included in the WhatsApp message so everyone can verify.
            </p>

            {auditLog.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">📋</div>
                <p className="text-muted-foreground text-sm">
                  No activity yet. Actions will appear here as you add people, expenses, and link games.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {[...auditLog].reverse().map((entry: AuditEntry) => (
                  <div key={entry.id} className="bg-card rounded-lg px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-foreground">{entry.description}</span>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatAuditTime(entry.timestamp)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Game Tab */}
        {activeTab === 'game' && (
          <>
            {/* Game mode toggle */}
            <div className="flex gap-2 mb-2">
              <button
                onClick={() => { setGameMode('squares'); setGameLabel('Squares'); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  gameMode === 'squares'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                Squares
              </button>
              <button
                onClick={() => { setGameMode('custom'); setGameLabel('Poker'); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  gameMode === 'custom'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                Custom (Poker, etc.)
              </button>
            </div>

            {/* Game label - editable */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground">Game label:</label>
              <Input
                value={gameLabel}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGameLabel(e.target.value)}
                placeholder="e.g. Poker Night, Fantasy League"
                className="bg-input text-sm h-8 flex-1"
              />
            </div>

            {/* ============ SQUARES MODE ============ */}
            {gameMode === 'squares' && (
              <>
                <p className="text-sm text-muted-foreground">
                  Link a Squares game to include entry fees and winnings in the settlement.
                </p>

                {games.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground text-sm">
                      No squares games found
                    </p>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Select game</label>
                      <Select
                        value={selectedGameId || ''}
                        onValueChange={(value: string) => {
                          const prev = selectedGameId;
                          setSelectedGameId(value || null);
                          setFeeOverride(null);
                          if (value) {
                            const game = games.find((g: { id: string; name: string }) => g.id === value);
                            addAudit('game_linked', game?.name || value);
                          } else if (prev) {
                            addAudit('game_unlinked', '');
                          }
                        }}
                      >
                        <SelectTrigger className="w-full bg-input">
                          <SelectValue placeholder="Choose a Squares game..." />
                        </SelectTrigger>
                        <SelectContent>
                          {games.map((g: { id: string; name: string; status: string }) => (
                            <SelectItem key={g.id} value={g.id}>
                              {g.name} ({g.status})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {settlementData && (
                      <>
                        {/* Game info + fee multiplier */}
                        <div className="bg-card rounded-xl p-4 space-y-3">
                          <div>
                            <label className="text-xs text-muted-foreground mb-1 block">
                              $ per square
                            </label>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min="0"
                                step="1"
                                value={feeOverride ?? gameFee}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                  const val = parseFloat(e.target.value);
                                  if (isNaN(val) || val < 0) return;
                                  if (val === gameFee) {
                                    setFeeOverride(null);
                                  } else {
                                    setFeeOverride(val);
                                  }
                                }}
                                onBlur={() => {
                                  if (feeOverride !== null && feeOverride !== gameFee) {
                                    addAudit('fee_override', `$${feeOverride.toFixed(2)}/square (game default was $${gameFee.toFixed(2)})`);
                                  }
                                }}
                                className="bg-input w-28 text-center font-bold"
                              />
                              <span className="text-sm text-muted-foreground">per square</span>
                              {feeOverride !== null && feeOverride !== gameFee && (
                                <button
                                  onClick={() => setFeeOverride(null)}
                                  className="text-xs text-amber-400 hover:text-amber-300"
                                >
                                  reset to ${gameFee.toFixed(2)}
                                </button>
                              )}
                            </div>
                          </div>

                          {(() => {
                            const totalUnits = squaresEntries.reduce((sum, s) => sum + s.unitCount, 0);
                            const computedPot = totalUnits * effectiveFee;
                            return (
                              <>
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Total squares</span>
                                  <span className="font-medium text-foreground">{totalUnits}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Total pot</span>
                                  <span className="font-medium text-foreground">
                                    ${computedPot.toFixed(2)}
                                    {feeOverride !== null && feeOverride !== gameFee && (
                                      <span className="text-amber-400 text-xs ml-1">(overridden)</span>
                                    )}
                                  </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Quarters scored</span>
                                  <span className="font-medium text-foreground">{settlementData.quartersScored}/4</span>
                                </div>
                              </>
                            );
                          })()}

                          {/* Custom quarter payout percentages */}
                          <div>
                            <label className="text-xs text-muted-foreground mb-1 block">
                              Payout per quarter (%)
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                              {(['Q1', 'Q2', 'Q3', 'Q4'] as const).map((label, idx) => (
                                <div key={label} className="text-center">
                                  <span className="text-xs text-muted-foreground block mb-1">{label}</span>
                                  <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="5"
                                    value={quarterPayouts[idx]}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                      const val = parseFloat(e.target.value);
                                      if (isNaN(val) || val < 0) return;
                                      setQuarterPayouts((prev: [number, number, number, number]) => {
                                        const next = [...prev] as [number, number, number, number];
                                        next[idx] = val;
                                        return next;
                                      });
                                    }}
                                    onBlur={() => {
                                      const total = quarterPayouts.reduce((sum: number, pct: number) => sum + pct, 0);
                                      if (total !== 100) {
                                        // Just log it - don't prevent saving
                                      }
                                      const isDefault = quarterPayouts.every((p: number) => p === 25);
                                      if (!isDefault) {
                                        addAudit('payout_override', `Q1:${quarterPayouts[0]}% Q2:${quarterPayouts[1]}% Q3:${quarterPayouts[2]}% Q4:${quarterPayouts[3]}%`);
                                      }
                                    }}
                                    className="bg-input text-center text-sm h-8"
                                  />
                                </div>
                              ))}
                            </div>
                            {(() => {
                              const total = quarterPayouts.reduce((sum: number, pct: number) => sum + pct, 0);
                              const totalUnits = squaresEntries.reduce((sum, s) => sum + s.unitCount, 0);
                              const computedPot = totalUnits * effectiveFee;
                              if (total !== 100) {
                                return (
                                  <p className="text-xs text-amber-400 mt-1">
                                    Percentages total {total}% (should be 100%)
                                  </p>
                                );
                              }
                              return (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Q1: ${(computedPot * quarterPayouts[0] / 100).toFixed(0)} / Q2: ${(computedPot * quarterPayouts[1] / 100).toFixed(0)} / Q3: ${(computedPot * quarterPayouts[2] / 100).toFixed(0)} / Q4: ${(computedPot * quarterPayouts[3] / 100).toFixed(0)}
                                </p>
                              );
                            })()}
                          </div>
                        </div>

                        {/* Ask people to claim their identity */}
                        {onOpenClaimPage && selectedGameId && (
                          <button
                            onClick={() => onOpenClaimPage(selectedGameId)}
                            className="w-full bg-blue-500/20 text-blue-400 rounded-lg px-4 py-3 text-sm font-medium hover:bg-blue-500/30 transition-colors text-left"
                          >
                            <div className="font-semibold">Ask people to claim their identity</div>
                            <div className="text-xs text-blue-400/70 mt-0.5">
                              Share this page in WhatsApp so each person can map their name
                            </div>
                          </button>
                        )}

                        {/* Player breakdown */}
                        <div className="bg-card rounded-xl p-4">
                          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                            Players
                          </h3>
                          <div className="space-y-2">
                            {squaresEntries.map(s => (
                              <div key={s.playerName} className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2 text-sm">
                                <div>
                                  <span className="font-medium text-foreground">{s.playerName}</span>
                                  {s.appUsername && (
                                    <span className="text-blue-400 text-xs ml-1">@{s.appUsername}</span>
                                  )}
                                  <span className="text-muted-foreground ml-2">
                                    {s.unitCount} sq
                                  </span>
                                </div>
                                <div className="text-right">
                                  <span className="text-red-400">-${s.totalOwed.toFixed(2)}</span>
                                  {s.winnings > 0 && (
                                    <span className="text-green-400 ml-2">+${s.winnings.toFixed(2)}</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Name mapping - shown when game names don't match WhatsApp names */}
                        {people.length > 0 && squaresEntries.length > 0 && (() => {
                          const unmappedEntries = squaresEntries
                            .filter((s: GameEntry) => !people.includes(s.playerName) && !nameMap.has(s.playerName));
                          const mapped: [string, string][] = Array.from(nameMap.entries());

                          if (unmappedEntries.length === 0 && mapped.length === 0) return null;

                          return (
                            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                              <h3 className="text-sm font-semibold text-yellow-400 mb-1">
                                Link Names
                              </h3>
                              <p className="text-xs text-muted-foreground mb-3">
                                These game names don&apos;t match anyone in your People list. Link them to the right WhatsApp name.
                              </p>

                              {mapped.length > 0 && (
                                <div className="space-y-2 mb-3">
                                  {mapped.map(([gameName, waName]: [string, string]) => {
                                    const entry = squaresEntries.find((s: GameEntry) => s.playerName === gameName);
                                    return (
                                      <div key={gameName} className="bg-muted/30 rounded-lg px-3 py-2">
                                        <div className="flex items-center justify-between text-sm">
                                          <span className="text-muted-foreground">{gameName}</span>
                                          <span className="text-xs text-muted-foreground mx-2">=</span>
                                          <span className="font-medium text-green-400 flex-1">{waName}</span>
                                          <button
                                            onClick={() => {
                                              setNameMap((prev: Map<string, string>) => {
                                                const next = new Map(prev);
                                                next.delete(gameName);
                                                return next;
                                              });
                                            }}
                                            className="text-muted-foreground hover:text-destructive ml-2"
                                          >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                                          </button>
                                        </div>
                                        {entry?.appUsername && (
                                          <div className="text-xs text-muted-foreground mt-1">
                                            App login: @{entry.appUsername}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {unmappedEntries.map((s: GameEntry) => (
                                <div key={s.playerName} className="mb-3">
                                  <div className="flex items-center gap-2">
                                    <div className="flex-shrink-0 min-w-0">
                                      <span className="text-sm text-foreground whitespace-nowrap truncate block">
                                        {s.playerName}
                                      </span>
                                      {s.appUsername && (
                                        <span className="text-xs text-blue-400">
                                          app: @{s.appUsername}
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-xs text-muted-foreground">=</span>
                                    <Select
                                      value=""
                                      onValueChange={(waName: string) => {
                                        if (!waName) return;
                                        setNameMap((prev: Map<string, string>) => {
                                          const next = new Map(prev);
                                          next.set(s.playerName, waName);
                                          return next;
                                        });
                                        const detail = s.appUsername
                                          ? `"${s.playerName}" (game, app: @${s.appUsername}) = "${waName}" (WhatsApp)`
                                          : `"${s.playerName}" (game) = "${waName}" (WhatsApp)`;
                                        addAudit('name_mapped', detail);
                                      }}
                                    >
                                      <SelectTrigger className="bg-input flex-1 min-w-0">
                                        <SelectValue placeholder="WhatsApp name..." />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {people.map((name: string) => (
                                          <SelectItem key={name} value={name}>{name}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        })()}

                        {/* Identity Claims - admin review */}
                        {claims.length > 0 && (
                          <div className="bg-card rounded-xl p-4">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                              Identity Claims ({claims.filter((c: { status: string }) => c.status === 'pending').length} pending)
                            </h3>
                            <p className="text-xs text-muted-foreground mb-3">
                              People have claimed their game identity. Review and approve to auto-populate the People list.
                            </p>
                            <div className="space-y-2">
                              {claims.map((claim: {
                                id: string;
                                squares_player_name: string;
                                whatsapp_name: string;
                                app_username: string | null;
                                squares_count: number;
                                status: string;
                              }) => (
                                <div key={claim.id} className={`rounded-lg px-3 py-2 text-sm ${
                                  claim.status === 'approved'
                                    ? 'bg-green-500/10 border border-green-500/20'
                                    : claim.status === 'rejected'
                                    ? 'bg-red-500/10 border border-red-500/20'
                                    : 'bg-muted/30'
                                }`}>
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                      <span className="font-medium text-foreground">{claim.squares_player_name}</span>
                                      {claim.app_username && (
                                        <span className="text-blue-400 text-xs ml-1">@{claim.app_username}</span>
                                      )}
                                      <span className="text-muted-foreground mx-1">=</span>
                                      <span className="text-foreground">{claim.whatsapp_name}</span>
                                      <span className="text-muted-foreground text-xs ml-2">
                                        ({claim.squares_count} entries)
                                      </span>
                                    </div>
                                    {claim.status === 'pending' && (
                                      <div className="flex gap-1 ml-2">
                                        <button
                                          onClick={() => handleReviewClaim(claim.id, 'approved')}
                                          className="bg-green-500/20 text-green-400 rounded px-2 py-1 text-xs font-medium hover:bg-green-500/30"
                                        >
                                          Approve
                                        </button>
                                        <button
                                          onClick={() => handleReviewClaim(claim.id, 'rejected')}
                                          className="bg-red-500/20 text-red-400 rounded px-2 py-1 text-xs font-medium hover:bg-red-500/30"
                                        >
                                          Reject
                                        </button>
                                      </div>
                                    )}
                                    {claim.status === 'approved' && (
                                      <span className="text-green-400 text-xs font-medium ml-2">Approved</span>
                                    )}
                                    {claim.status === 'rejected' && (
                                      <span className="text-red-400 text-xs font-medium ml-2">Rejected</span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </>
            )}

            {/* ============ CUSTOM MODE (Poker, Fantasy, etc.) ============ */}
            {gameMode === 'custom' && (
              <>
                <p className="text-sm text-muted-foreground">
                  Add players with their buy-in and payout amounts. Works for poker, fantasy leagues, or any game with a pot.
                </p>

                {/* Add custom game entry */}
                <div className="bg-card rounded-xl p-4 space-y-3">
                  <Input
                    value={newCustomPlayer}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewCustomPlayer(e.target.value)}
                    placeholder="Player name"
                    className="bg-input"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Buy-in ($)</label>
                      <Input
                        value={newCustomBuyIn}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewCustomBuyIn(e.target.value)}
                        placeholder="50"
                        type="number"
                        min="0"
                        step="1"
                        className="bg-input"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Payout ($)</label>
                      <Input
                        value={newCustomPayout}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewCustomPayout(e.target.value)}
                        placeholder="0"
                        type="number"
                        min="0"
                        step="1"
                        className="bg-input"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      const name = newCustomPlayer.trim();
                      const buyIn = parseFloat(newCustomBuyIn) || 0;
                      const payout = parseFloat(newCustomPayout) || 0;
                      if (!name || buyIn <= 0) return;
                      const entry: GameEntry = {
                        playerName: name,
                        unitCount: 1,
                        costPerUnit: buyIn,
                        totalOwed: buyIn,
                        winnings: payout,
                        appUsername: null,
                      };
                      setCustomEntries((prev: GameEntry[]) => [...prev, entry]);
                      addAudit('game_player_added', `${name}: buy-in $${buyIn.toFixed(2)}, payout $${payout.toFixed(2)}`);
                      setNewCustomPlayer('');
                      setNewCustomBuyIn('');
                      setNewCustomPayout('');
                    }}
                    disabled={!newCustomPlayer.trim() || !newCustomBuyIn || parseFloat(newCustomBuyIn) <= 0}
                    className="w-full bg-primary text-primary-foreground"
                  >
                    Add Player
                  </Button>
                </div>

                {/* Custom entries list */}
                {customEntries.length > 0 && (
                  <div className="bg-card rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                      Players ({customEntries.length})
                    </h3>
                    {(() => {
                      const totalBuyIns = customEntries.reduce((sum: number, e: GameEntry) => sum + e.totalOwed, 0);
                      const totalPayouts = customEntries.reduce((sum: number, e: GameEntry) => sum + e.winnings, 0);
                      return (
                        <div className="flex justify-between text-xs text-muted-foreground mb-3 px-1">
                          <span>Total buy-ins: ${totalBuyIns.toFixed(2)}</span>
                          <span>Total payouts: ${totalPayouts.toFixed(2)}</span>
                          {Math.abs(totalBuyIns - totalPayouts) > 0.01 && (
                            <span className="text-amber-400">
                              Diff: ${Math.abs(totalBuyIns - totalPayouts).toFixed(2)}
                            </span>
                          )}
                        </div>
                      );
                    })()}
                    <div className="space-y-2">
                      {customEntries.map((entry: GameEntry, idx: number) => (
                        <div key={`${entry.playerName}-${idx}`} className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2 text-sm">
                          <span className="font-medium text-foreground">{entry.playerName}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-red-400">-${entry.totalOwed.toFixed(2)}</span>
                            {entry.winnings > 0 && (
                              <span className="text-green-400">+${entry.winnings.toFixed(2)}</span>
                            )}
                            <button
                              onClick={() => {
                                setCustomEntries((prev: GameEntry[]) => prev.filter((_, i) => i !== idx));
                                addAudit('game_player_removed', entry.playerName);
                              }}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Name mapping for custom mode */}
                {people.length > 0 && customEntries.length > 0 && (() => {
                  const unmappedEntries = customEntries
                    .filter((s: GameEntry) => !people.includes(s.playerName) && !nameMap.has(s.playerName));
                  const mapped: [string, string][] = Array.from(nameMap.entries());

                  if (unmappedEntries.length === 0 && mapped.length === 0) return null;

                  return (
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                      <h3 className="text-sm font-semibold text-yellow-400 mb-1">
                        Link Names
                      </h3>
                      <p className="text-xs text-muted-foreground mb-3">
                        Link game names to WhatsApp names if they differ.
                      </p>

                      {mapped.length > 0 && (
                        <div className="space-y-2 mb-3">
                          {mapped.map(([gameName, waName]: [string, string]) => (
                            <div key={gameName} className="bg-muted/30 rounded-lg px-3 py-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">{gameName}</span>
                                <span className="text-xs text-muted-foreground mx-2">=</span>
                                <span className="font-medium text-green-400 flex-1">{waName}</span>
                                <button
                                  onClick={() => {
                                    setNameMap((prev: Map<string, string>) => {
                                      const next = new Map(prev);
                                      next.delete(gameName);
                                      return next;
                                    });
                                  }}
                                  className="text-muted-foreground hover:text-destructive ml-2"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {unmappedEntries.map((s: GameEntry, idx: number) => (
                        <div key={`${s.playerName}-${idx}`} className="mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-foreground flex-shrink-0">{s.playerName}</span>
                            <span className="text-xs text-muted-foreground">=</span>
                            <Select
                              value=""
                              onValueChange={(waName: string) => {
                                if (!waName) return;
                                setNameMap((prev: Map<string, string>) => {
                                  const next = new Map(prev);
                                  next.set(s.playerName, waName);
                                  return next;
                                });
                                addAudit('name_mapped', `"${s.playerName}" (game) = "${waName}" (WhatsApp)`);
                              }}
                            >
                              <SelectTrigger className="bg-input flex-1 min-w-0">
                                <SelectValue placeholder="WhatsApp name..." />
                              </SelectTrigger>
                              <SelectContent>
                                {people.map((name: string) => (
                                  <SelectItem key={name} value={name}>{name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </>
            )}

            {/* Pot collector - shared across both modes */}
            {people.length > 0 && gameEntries.length > 0 && (
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Who collects/manages the pot?
                </label>
                <Select value={potCollector} onValueChange={(value: string) => {
                  setPotCollector(value);
                  if (value) addAudit('pot_collector_set', value);
                }}>
                  <SelectTrigger className="w-full bg-input">
                    <SelectValue placeholder="Select pot collector..." />
                  </SelectTrigger>
                  <SelectContent>
                    {people.map((name: string) => (
                      <SelectItem key={name} value={name}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </>
        )}
      </div>

      {/* Calculate button - fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
        <Button
          onClick={() => {
            addAudit('settlement_calculated', `${people.length} people, ${expenses.length} expenses`);
            setShowResults(true);
          }}
          disabled={!canCalculate}
          className="w-full h-14 text-lg font-bold bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Calculate Settlement
        </Button>
        {!canCalculate && (
          <p className="text-xs text-muted-foreground text-center mt-1">
            Add at least 2 people and 1 expense or add game entries
          </p>
        )}
      </div>
    </div>
  );
}
