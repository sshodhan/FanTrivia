'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { SquaresGame } from '@/lib/database.types';

interface ShareSectionProps {
  game: SquaresGame;
}

export function ShareSection({ game }: ShareSectionProps) {
  const [copied, setCopied] = useState(false);

  if (!game.share_code) return null;

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}?squares=${game.share_code}`
    : '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(game.share_code!);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = game.share_code!;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${game.name} - Super Bowl Squares`,
          text: `Join my Super Bowl Squares game! Use code: ${game.share_code}`,
          url: shareUrl,
        });
      } catch {
        // User cancelled share
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="bg-card rounded-xl p-4">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        Share Game
      </h3>
      <div className="flex items-center gap-3">
        <div className="flex-1 bg-muted/30 rounded-lg px-4 py-3 text-center">
          <span className="font-mono text-2xl font-bold tracking-[0.3em] text-primary">
            {game.share_code}
          </span>
        </div>
        <Button
          onClick={handleCopy}
          variant="outline"
          className="px-4"
        >
          {copied ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
          )}
        </Button>
        <Button
          onClick={handleShare}
          className="bg-primary text-primary-foreground hover:bg-primary/90 px-4"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/></svg>
        </Button>
      </div>
      {game.entry_fee && (
        <p className="text-xs text-muted-foreground mt-2 text-center">
          ${game.entry_fee} per square
        </p>
      )}
    </div>
  );
}
