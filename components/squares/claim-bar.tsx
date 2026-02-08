'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ClaimBarProps {
  selectedCount: number;
  defaultPlayerName: string;
  onClaim: (playerName: string) => Promise<void>;
  onClear: () => void;
}

export function ClaimBar({ selectedCount, defaultPlayerName, onClaim, onClear }: ClaimBarProps) {
  const [playerName, setPlayerName] = useState(defaultPlayerName);
  const [isClaiming, setIsClaiming] = useState(false);

  if (selectedCount === 0) return null;

  const handleClaim = async () => {
    if (!playerName.trim()) return;
    setIsClaiming(true);
    try {
      await onClaim(playerName.trim());
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 z-50 safe-bottom animate-in slide-in-from-bottom-4">
      <div className="max-w-md mx-auto flex items-center gap-3">
        <Input
          value={playerName}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPlayerName(e.target.value)}
          placeholder="Your name"
          className="bg-input flex-1"
          maxLength={30}
        />
        <Button
          onClick={handleClaim}
          disabled={isClaiming || !playerName.trim()}
          className="bg-primary text-primary-foreground hover:bg-primary/90 whitespace-nowrap"
        >
          {isClaiming ? '...' : `Claim ${selectedCount}`}
        </Button>
        <Button
          variant="outline"
          onClick={onClear}
          className="px-3"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </Button>
      </div>
    </div>
  );
}
