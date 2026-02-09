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
  type Expense,
  type SquaresSettlement,
} from '@/lib/expense-splitter';

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface ExpenseSplitterScreenProps {
  onBack: () => void;
}

export function ExpenseSplitterScreen({ onBack }: ExpenseSplitterScreenProps) {
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

  // State for squares integration
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [potCollector, setPotCollector] = useState<string>('');

  // State for UI
  const [showResults, setShowResults] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'people' | 'expenses' | 'squares'>('people');

  // Fetch available squares games
  const { data: gamesData } = useSWR('/api/squares', fetcher);
  const games = gamesData?.games || [];

  // Fetch settlement data for selected game
  const { data: settlementData } = useSWR(
    selectedGameId ? `/api/squares/settlements?game_id=${selectedGameId}` : null,
    fetcher
  );

  const squaresSettlements: SquaresSettlement[] = settlementData?.settlements || [];
  const squaresPlayers: string[] = settlementData?.players || [];

  // Add a person
  const handleAddPerson = useCallback(() => {
    const name = newPersonName.trim();
    if (!name || people.includes(name)) return;
    setPeople((prev: string[]) => [...prev, name]);
    setNewPersonName('');
  }, [newPersonName, people]);

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
  }, []);

  // Import names from squares game
  const handleImportSquaresPlayers = useCallback(() => {
    if (!squaresPlayers.length) return;
    setPeople((prev: string[]) => {
      const combined = new Set([...prev, ...squaresPlayers]);
      return Array.from(combined);
    });
  }, [squaresPlayers]);

  // Add an expense
  const handleAddExpense = useCallback(() => {
    const desc = newExpenseDesc.trim();
    const amount = parseFloat(newExpenseAmount);
    if (!desc || isNaN(amount) || amount <= 0 || !newExpensePaidBy) return;

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
      },
    ]);

    setNewExpenseDesc('');
    setNewExpenseAmount('');
    setNewExpensePaidBy('');
    setSplitMode('everyone');
    setCustomSplit(new Set());
  }, [newExpenseDesc, newExpenseAmount, newExpensePaidBy, splitMode, customSplit, people]);

  // Remove an expense
  const handleRemoveExpense = useCallback((id: string) => {
    setExpenses((prev: Expense[]) => prev.filter((e: Expense) => e.id !== id));
  }, []);

  // Toggle person in custom split
  const toggleCustomSplit = useCallback((name: string) => {
    setCustomSplit(prev => {
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
    const balances = calculateBalances(expenses, squaresSettlements, potCollector || null);
    const settlements = minimizeTransactions(balances);
    const message = generateWhatsAppMessage(settlements, balances, expenses, squaresSettlements);
    return { balances, settlements, message };
  }, [showResults, expenses, squaresSettlements, potCollector]);

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

  const canCalculate = people.length >= 2 && (expenses.length > 0 || squaresSettlements.length > 0);

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
              {results.balances.map(b => (
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
                {results.settlements.map((s, idx) => (
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
        {(['people', 'expenses', 'squares'] as const).map(tab => (
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
            {tab === 'squares' && 'Squares'}
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

            {/* Import from squares */}
            {squaresPlayers.length > 0 && (
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
                {people.map(name => (
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
                    placeholder="What was it for? (e.g. Venue deposit)"
                    className="bg-input"
                  />
                  <Input
                    value={newExpenseAmount}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewExpenseAmount(e.target.value)}
                    placeholder="Amount ($)"
                    type="number"
                    min="0"
                    step="0.01"
                    className="bg-input"
                  />

                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Paid by</label>
                    <Select value={newExpensePaidBy} onValueChange={setNewExpensePaidBy}>
                      <SelectTrigger className="w-full bg-input">
                        <SelectValue placeholder="Who paid?" />
                      </SelectTrigger>
                      <SelectContent>
                        {people.map(name => (
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
                        {people.map(name => (
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
                    disabled={!newExpenseDesc.trim() || !newExpenseAmount || !newExpensePaidBy}
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
                    {expenses.map(exp => (
                      <div key={exp.id} className="bg-card rounded-lg px-4 py-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium text-foreground">{exp.description}</span>
                            <span className="text-primary font-bold ml-2">${exp.amount.toFixed(2)}</span>
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

        {/* Squares Tab */}
        {activeTab === 'squares' && (
          <>
            <p className="text-sm text-muted-foreground">
              Link a Squares game to include entry fees and winnings in the settlement.
            </p>

            {games.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">🏈</div>
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
                    onValueChange={(value) => setSelectedGameId(value || null)}
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
                    {/* Game info */}
                    <div className="bg-card rounded-xl p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Entry fee</span>
                        <span className="font-medium text-foreground">
                          ${settlementData.game.entryFee.toFixed(2)}/square
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total pot</span>
                        <span className="font-medium text-foreground">
                          ${settlementData.totalPot.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Quarters scored</span>
                        <span className="font-medium text-foreground">
                          {settlementData.quartersScored}/4
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Per-quarter payout</span>
                        <span className="font-medium text-foreground">
                          ${settlementData.quarterPayout.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Player squares breakdown */}
                    <div className="bg-card rounded-xl p-4">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                        Players
                      </h3>
                      <div className="space-y-2">
                        {squaresSettlements.map(s => (
                          <div key={s.playerName} className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2 text-sm">
                            <div>
                              <span className="font-medium text-foreground">{s.playerName}</span>
                              <span className="text-muted-foreground ml-2">
                                {s.squareCount} sq
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

                    {/* Pot collector */}
                    {people.length > 0 && (
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">
                          Who collects/manages the pot?
                        </label>
                        <Select value={potCollector} onValueChange={setPotCollector}>
                          <SelectTrigger className="w-full bg-input">
                            <SelectValue placeholder="Select pot collector..." />
                          </SelectTrigger>
                          <SelectContent>
                            {people.map(name => (
                              <SelectItem key={name} value={name}>{name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Calculate button - fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
        <Button
          onClick={() => setShowResults(true)}
          disabled={!canCalculate}
          className="w-full h-14 text-lg font-bold bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Calculate Settlement
        </Button>
        {!canCalculate && (
          <p className="text-xs text-muted-foreground text-center mt-1">
            Add at least 2 people and 1 expense or link a squares game
          </p>
        )}
      </div>
    </div>
  );
}
