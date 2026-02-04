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
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedPlayer(null)}
        >
          <div 
            className="bg-background w-full max-w-md max-h-[90vh] rounded-2xl overflow-hidden border-2 border-primary animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Scrollable Content */}
            <div className="overflow-y-auto max-h-[90vh]">
              {/* Player Image Header */}
              <div className="relative aspect-[4/3] bg-gradient-to-b from-muted to-card">
                {/* Placeholder image with field background */}
                <div className="absolute inset-0 bg-[url('/field-bg.jpg')] bg-cover bg-center opacity-50" />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
                
                {/* Jersey Number Badge */}
                <div className="absolute top-4 right-4 w-14 h-14 bg-primary rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-primary-foreground font-bold text-lg">#{selectedPlayer.number}</span>
                </div>
                
                {/* Close Button */}
                <button
                  onClick={() => setSelectedPlayer(null)}
                  className="absolute top-4 right-20 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                  aria-label="Close"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                  </svg>
                </button>
                
                {/* Player Info Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-primary text-sm font-semibold uppercase tracking-wider">Super Bowl XLVIII</p>
                  <h2 className="text-3xl font-bold text-foreground">{selectedPlayer.name}</h2>
                  <p className="text-muted-foreground">{selectedPlayer.position}</p>
                </div>
              </div>

              {/* Stats Section */}
              <div className="p-4 border-l-4 border-primary">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">📊</span>
                  <h3 className="text-sm font-bold text-primary uppercase tracking-wide">
                    Super Bowl XLVIII Stats
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {selectedPlayer.stats.map((stat, index) => (
                    <div key={index} className="bg-card rounded-xl p-4">
                      <div className={cn(
                        "text-2xl font-bold",
                        index % 2 === 0 ? "text-foreground" : "text-primary"
                      )}>
                        {stat.value}
                      </div>
                      <div className="text-sm text-muted-foreground">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Trivia Section */}
              <div className="p-4 pb-8">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">⚡</span>
                  <h3 className="text-sm font-bold text-primary uppercase tracking-wide">
                    Key Trivia
                  </h3>
                </div>
                <div className="space-y-3">
                  {selectedPlayer.trivia.map((fact, index) => (
                    <div key={index} className="flex items-start gap-3 bg-card rounded-xl p-4">
                      <div className="flex-shrink-0 w-7 h-7 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-primary-foreground text-sm font-bold">{index + 1}</span>
                      </div>
                      <p className="text-foreground text-sm leading-relaxed pt-0.5">{fact}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
