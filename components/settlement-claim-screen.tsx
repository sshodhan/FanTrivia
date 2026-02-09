'use client';

import { useState, useCallback } from 'react';
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
import { useUser } from '@/lib/user-context';

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface SettlementClaimScreenProps {
  gameId: string;
  onBack: () => void;
}

interface SettlementPlayer {
  playerName: string;
  unitCount: number;
  costPerUnit: number;
  totalOwed: number;
  winnings: number;
  appUsername: string | null;
}

interface Claim {
  id: string;
  squares_player_name: string;
  whatsapp_name: string;
  app_username: string | null;
  squares_count: number;
  status: 'pending' | 'approved' | 'rejected';
}

export function SettlementClaimScreen({ gameId, onBack }: SettlementClaimScreenProps) {
  const { user } = useUser();

  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [whatsappName, setWhatsappName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Fetch game settlement data (player list)
  const { data: settlementData } = useSWR(
    `/api/squares/settlements?game_id=${gameId}`,
    fetcher
  );

  // Fetch existing claims to see which players are already claimed
  const { data: claimsData, mutate: mutateClaims } = useSWR(
    `/api/squares/settlements/claims?game_id=${gameId}`,
    fetcher
  );

  const players: SettlementPlayer[] = settlementData?.settlements || [];
  const claims: Claim[] = claimsData?.claims || [];
  const gameName = settlementData?.game?.name || 'Squares Game';

  // Players already claimed by someone
  const claimedNames = new Set(claims.map((c: Claim) => c.squares_player_name));

  // Find the user's existing claim (if any)
  const myClaim = user
    ? claims.find((c: Claim) => c.app_username === user.username)
    : null;

  const handleSubmit = useCallback(async () => {
    if (!selectedPlayer || !whatsappName.trim()) return;

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/squares/settlements/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game_id: gameId,
          squares_player_name: selectedPlayer,
          whatsapp_name: whatsappName.trim(),
          app_user_id: user?.user_id || null,
          app_username: user?.username || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to submit claim');
        return;
      }

      setSubmitted(true);
      mutateClaims();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [selectedPlayer, whatsappName, gameId, user, mutateClaims]);

  // Success state
  if (submitted || myClaim) {
    const claim = myClaim;
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <header className="p-4 flex items-center gap-3 border-b border-border">
          <button onClick={onBack} className="text-muted-foreground hover:text-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <h1 className="font-[var(--font-heading)] text-xl font-bold text-foreground">
            Claim Submitted
          </h1>
        </header>

        <div className="flex-1 p-6 flex flex-col items-center justify-center text-center gap-4">
          <div className="text-5xl">
            {claim?.status === 'approved' ? '✅' : claim?.status === 'rejected' ? '❌' : '⏳'}
          </div>
          <h2 className="text-lg font-bold text-foreground">
            {claim?.status === 'approved' && 'Approved!'}
            {claim?.status === 'rejected' && 'Rejected by admin'}
            {(!claim || claim?.status === 'pending') && 'Waiting for admin approval'}
          </h2>
          <div className="bg-card rounded-xl p-4 w-full max-w-sm space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Squares name</span>
              <span className="font-medium text-foreground">
                {claim?.squares_player_name || selectedPlayer}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">WhatsApp name</span>
              <span className="font-medium text-foreground">
                {claim?.whatsapp_name || whatsappName}
              </span>
            </div>
            {(claim?.app_username || user?.username) && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">App login</span>
                <span className="font-medium text-blue-400">
                  @{claim?.app_username || user?.username}
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Squares owned</span>
              <span className="font-medium text-foreground">
                {claim?.squares_count || players.find((p: SettlementPlayer) => p.playerName === selectedPlayer)?.squareCount || '?'}
              </span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground max-w-xs">
            The organizer will review your claim. Once approved, your identity will be linked in the settlement.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="p-4 flex items-center gap-3 border-b border-border">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <div className="flex-1">
          <h1 className="font-[var(--font-heading)] text-xl font-bold text-foreground">
            Claim Your Identity
          </h1>
          <p className="text-xs text-muted-foreground">{gameName}</p>
        </div>
      </header>

      <div className="flex-1 p-4 space-y-4">
        <p className="text-sm text-muted-foreground">
          Link your Squares name to your WhatsApp name so the settlement bot knows who you are.
        </p>

        {/* Step 1: Which squares player are you? */}
        <div className="bg-card rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">
            1. Which Squares player are you?
          </h3>

          {players.length === 0 ? (
            <p className="text-sm text-muted-foreground">Loading players...</p>
          ) : (
            <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
              <SelectTrigger className="w-full bg-input">
                <SelectValue placeholder="Select your Squares name..." />
              </SelectTrigger>
              <SelectContent>
                {players.map((p: SettlementPlayer) => {
                  const claimed = claimedNames.has(p.playerName);
                  return (
                    <SelectItem
                      key={p.playerName}
                      value={p.playerName}
                      disabled={claimed}
                    >
                      {p.playerName} ({p.unitCount} squares)
                      {claimed ? ' - already claimed' : ''}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          )}

          {/* Show selected player's details */}
          {selectedPlayer && (() => {
            const p = players.find((pl: SettlementPlayer) => pl.playerName === selectedPlayer);
            if (!p) return null;
            return (
              <div className="bg-muted/30 rounded-lg p-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Squares owned</span>
                  <span className="font-medium text-foreground">{p.unitCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Entry fee owed</span>
                  <span className="text-red-400">${p.totalOwed.toFixed(2)}</span>
                </div>
                {p.winnings > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Winnings</span>
                    <span className="text-green-400">${p.winnings.toFixed(2)}</span>
                  </div>
                )}
                {p.appUsername && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">App login</span>
                    <span className="text-blue-400">@{p.appUsername}</span>
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* Step 2: WhatsApp name */}
        <div className="bg-card rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">
            2. What&apos;s your WhatsApp display name?
          </h3>
          <p className="text-xs text-muted-foreground">
            Exactly as it appears in the group chat. This is how the settlement message will refer to you.
          </p>
          <Input
            value={whatsappName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWhatsappName(e.target.value)}
            placeholder="Your WhatsApp name..."
            className="bg-input"
          />
        </div>

        {/* Logged-in user info */}
        {user && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl px-4 py-3 text-sm">
            <span className="text-muted-foreground">Logged in as </span>
            <span className="text-blue-400 font-medium">@{user.username}</span>
            <span className="text-muted-foreground"> - this will be linked automatically.</span>
          </div>
        )}

        {error && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <Button
          onClick={handleSubmit}
          disabled={!selectedPlayer || !whatsappName.trim() || submitting}
          className="w-full h-14 text-lg font-bold bg-primary text-primary-foreground"
        >
          {submitting ? 'Submitting...' : 'Submit Claim'}
        </Button>
      </div>
    </div>
  );
}
