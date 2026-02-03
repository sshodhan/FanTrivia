'use client';

import { useState } from 'react';
import { samplePlayers } from '@/lib/mock-data';
import type { Player } from '@/lib/types';
import { cn } from '@/lib/utils';

interface PlayerCardsProps {
  onBack: () => void;
}

export function PlayerCards({ onBack }: PlayerCardsProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="p-4 flex items-center gap-4 border-b border-border">
        <button
          onClick={onBack}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Go back"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
        </button>
        <div>
          <h1 className="font-[var(--font-heading)] text-2xl font-bold text-foreground">
            Super Bowl Heroes
          </h1>
          <p className="text-sm text-muted-foreground">Super Bowl XLVIII Champions</p>
        </div>
      </header>

      {/* Player Grid */}
      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-2 gap-4">
          {samplePlayers.map((player) => (
            <button
              key={player.id}
              onClick={() => setSelectedPlayer(player)}
              className="bg-card rounded-xl p-4 text-left transition-all hover:scale-[1.02] hover:bg-card/80 active:scale-[0.98]"
            >
              {/* Player Avatar Placeholder */}
              <div className="aspect-square bg-muted rounded-lg mb-3 flex items-center justify-center">
                <span className="text-5xl font-bold text-muted-foreground/30">
                  #{player.number}
                </span>
              </div>
              
              {/* Player Info */}
              <div className="space-y-1">
                <div className="font-bold text-foreground truncate">
                  {player.name}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-primary font-bold">#{player.number}</span>
                  <span className="text-muted-foreground text-sm">{player.position}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Player Detail Modal */}
      {selectedPlayer && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-end justify-center z-50"
          onClick={() => setSelectedPlayer(null)}
        >
          <div 
            className="bg-card w-full max-w-lg rounded-t-3xl p-6 animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setSelectedPlayer(null)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                </svg>
              </button>
            </div>

            {/* Player Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 bg-muted rounded-xl flex items-center justify-center">
                <span className="text-3xl font-bold text-primary">
                  #{selectedPlayer.number}
                </span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  {selectedPlayer.name}
                </h2>
                <p className="text-muted-foreground">{selectedPlayer.position}</p>
              </div>
            </div>

            {/* Super Bowl Stats */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Super Bowl XLVIII Stats
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {selectedPlayer.stats.map((stat, index) => (
                  <div key={index} className="bg-muted/50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-primary">{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Highlight */}
            <div className="bg-primary/10 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-primary mb-2">
                Game Highlight
              </h3>
              <p className="text-foreground">
                {selectedPlayer.superBowlHighlight}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
