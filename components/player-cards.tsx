'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { cn } from '@/lib/utils';
import type { Player as ApiPlayer } from '@/lib/database.types';

interface PlayerCardsProps {
  onBack: () => void;
}

// Player category type
type PlayerCategory = 'sb48' | '2025-hawks' | '2025-pats' | 'hof';

// Position filter type
type PositionFilter = 'all' | 'offense' | 'defense' | 'special-teams' | 'coaches';

// Position filter configuration
const POSITION_FILTERS: { id: PositionFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'offense', label: 'Offense' },
  { id: 'defense', label: 'Defense' },
  { id: 'special-teams', label: 'Special Teams' },
  { id: 'coaches', label: 'Coaches' },
];

// Helper to check if a position is a coach/staff position
function isCoachPosition(position: string): boolean {
  const coachPositions = ['Head Coach', 'Offensive Coordinator', 'Defensive Coordinator', 'Assistant Head Coach', 'General Manager', 'Coordinator', 'Coach'];
  return coachPositions.some(cp => position.includes(cp) || position.toLowerCase().includes('coach') || position.toLowerCase().includes('coordinator') || position.toLowerCase().includes('manager'));
}

// Helper to determine position category
function getPositionCategory(position: string): PositionFilter {
  if (isCoachPosition(position)) return 'coaches';

  const offensePositions = ['Quarterback', 'Running Back', 'Wide Receiver', 'Tight End', 'Offensive Tackle', 'Guard', 'Center', 'Fullback'];
  const defensePositions = ['Defensive End', 'Defensive Tackle', 'Linebacker', 'Cornerback', 'Safety', 'Edge Rusher', 'Nose Tackle'];
  const specialTeamsPositions = ['Kicker', 'Punter', 'Long Snapper', 'Kick Returner', 'Punt Returner'];

  if (offensePositions.some(p => position.includes(p))) return 'offense';
  if (defensePositions.some(p => position.includes(p))) return 'defense';
  if (specialTeamsPositions.some(p => position.includes(p))) return 'special-teams';

  return 'all';
}

// Category configuration
const CATEGORIES: {
  id: PlayerCategory;
  label: string;
  emoji: string;
  title: string;
  subtitle: string;
  statsLabel: string;
}[] = [
  {
    id: 'sb48',
    label: 'SB 48',
    emoji: '🏆',
    title: 'Super Bowl Heroes',
    subtitle: 'Super Bowl XLVIII Champions',
    statsLabel: 'Super Bowl XLVIII Stats',
  },
  {
    id: '2025-hawks',
    label: '2025 Hawks',
    emoji: '🦅',
    title: '2025 Seahawks',
    subtitle: 'Super Bowl LX Roster',
    statsLabel: '2025 Season Stats',
  },
  {
    id: '2025-pats',
    label: '2025 Pats',
    emoji: '🔴',
    title: '2025 Patriots',
    subtitle: 'Super Bowl LX Opponent',
    statsLabel: '2025 Season Stats',
  },
  {
    id: 'hof',
    label: 'Hall of Fame',
    emoji: '⭐',
    title: 'Seahawks Hall of Fame',
    subtitle: 'Seahawks Legends',
    statsLabel: 'Career Stats',
  },
];

// Display format for the component
interface DisplayPlayer {
  id: string;
  name: string;
  number: number;
  position: string;
  imageUrl: string | null;
  stats: { label: string; value: string }[];
  trivia: string[];
  bio: string;
  superBowlHighlight: string | null;
}

interface PlayersResponse {
  players: ApiPlayer[];
  total: number;
  category: string;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

// Transform API player to display format
function transformPlayer(player: ApiPlayer): DisplayPlayer {
  // Convert stats object to array format
  const statsArray = player.stats
    ? Object.entries(player.stats).map(([label, value]) => ({
        label,
        value: String(value),
      }))
    : [];

  return {
    id: player.id,
    name: player.name,
    number: player.jersey_number,
    position: player.position,
    imageUrl: player.image_url,
    stats: statsArray,
    trivia: player.trivia || [],
    bio: player.bio || '',
    superBowlHighlight: player.super_bowl_highlight,
  };
}

export function PlayerCards({ onBack }: PlayerCardsProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<DisplayPlayer | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<PlayerCategory>('sb48');
  const [positionFilter, setPositionFilter] = useState<PositionFilter>('all');

  const currentCategory = CATEGORIES.find(c => c.id === selectedCategory) || CATEGORIES[0];

  const { data, error, isLoading } = useSWR<PlayersResponse>(
    `/api/players?category=${selectedCategory}`,
    fetcher
  );

  const allPlayers = data?.players.map(transformPlayer) || [];

  // Filter players by position
  const players = positionFilter === 'all'
    ? allPlayers
    : allPlayers.filter(p => getPositionCategory(p.position) === positionFilter);

  // Reusable header component
  const renderHeader = () => (
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
          {currentCategory.title}
        </h1>
        <p className="text-sm text-muted-foreground">{currentCategory.subtitle}</p>
      </div>
    </header>
  );

  // Reusable pill selector component
  const renderPillSelector = () => (
    <div className="sticky top-0 z-10 bg-background border-b border-border">
      {/* Category Pills */}
      <div className="flex gap-2 p-4 pb-2 overflow-x-auto scrollbar-hide">
        {CATEGORIES.map((category) => (
          <button
            key={category.id}
            onClick={() => {
              setSelectedCategory(category.id);
              setPositionFilter('all'); // Reset position filter when changing category
            }}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all",
              selectedCategory === category.id
                ? "bg-primary text-primary-foreground"
                : "bg-card text-foreground hover:bg-card/80"
            )}
          >
            <span>{category.emoji}</span>
            <span className="font-medium">{category.label}</span>
          </button>
        ))}
      </div>

      {/* Position Filter Tabs - only show for 2025 teams */}
      {(selectedCategory === '2025-hawks' || selectedCategory === '2025-pats') && (
        <div className="flex gap-4 px-4 pb-3 overflow-x-auto scrollbar-hide">
          {POSITION_FILTERS.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setPositionFilter(filter.id)}
              className={cn(
                "text-sm font-medium whitespace-nowrap transition-colors pb-1",
                positionFilter === filter.id
                  ? "text-foreground border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        {renderHeader()}
        {renderPillSelector()}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-muted-foreground">Loading players...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        {renderHeader()}
        {renderPillSelector()}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-destructive">Failed to load players</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      {renderHeader()}

      {/* Category Pills */}
      {renderPillSelector()}

      {/* Player Grid */}
      <div className="flex-1 overflow-auto p-4">
        {players.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No players found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {players.map((player) => (
              <button
                key={player.id}
                onClick={() => setSelectedPlayer(player)}
                className="bg-card rounded-xl p-4 text-left transition-all hover:scale-[1.02] hover:bg-card/80 active:scale-[0.98]"
              >
                {/* Player Avatar / Image */}
                <div className="aspect-square bg-muted rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                  {player.imageUrl ? (
                    <img
                      src={player.imageUrl}
                      alt={player.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const fallback = isCoachPosition(player.position)
                          ? '<span class="text-5xl">🏈</span>'
                          : `<span class="text-5xl font-bold text-muted-foreground/30">#${player.number}</span>`;
                        e.currentTarget.parentElement!.innerHTML = fallback;
                      }}
                    />
                  ) : isCoachPosition(player.position) ? (
                    <span className="text-5xl">🏈</span>
                  ) : (
                    <span className="text-5xl font-bold text-muted-foreground/30">
                      #{player.number}
                    </span>
                  )}
                </div>

                {/* Player Info */}
                <div className="space-y-1">
                  <div className="font-bold text-foreground truncate">
                    {player.name}
                  </div>
                  <div className="flex items-center gap-2">
                    {!isCoachPosition(player.position) && player.number > 0 && (
                      <span className="text-primary font-bold">#{player.number}</span>
                    )}
                    <span className="text-muted-foreground text-sm">{player.position}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Player Detail Modal */}
      {selectedPlayer && (
        <div 
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-3"
          onClick={() => setSelectedPlayer(null)}
        >
          <div 
            className="bg-background w-full max-w-md max-h-[95vh] rounded-2xl overflow-hidden border-2 border-primary animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Scrollable Content */}
            <div className="overflow-y-auto max-h-[95vh]">
              {/* Player Image Header - Taller full-bleed design */}
              <div className="relative h-[55vh] min-h-[380px] bg-card">
                {/* Full-bleed player image */}
                {selectedPlayer.imageUrl && (
                  <img
                    src={selectedPlayer.imageUrl}
                    alt={selectedPlayer.name}
                    className="absolute inset-0 w-full h-full object-cover object-top grayscale"
                    onError={(e) => {
                      // Fallback to placeholder if image fails to load
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}
                {/* Jersey number fallback when no image */}
                {!selectedPlayer.imageUrl && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    {isCoachPosition(selectedPlayer.position) ? (
                      <span className="text-[80px]">🏈</span>
                    ) : (
                      <span className="text-[120px] font-bold text-muted-foreground/20">
                        #{selectedPlayer.number}
                      </span>
                    )}
                  </div>
                )}
                {/* Gradient overlay for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />

                {/* Jersey Number Badge - hide for coaches */}
                {!isCoachPosition(selectedPlayer.position) && selectedPlayer.number > 0 && (
                  <div className="absolute top-4 right-4 w-16 h-16 bg-primary rounded-full flex items-center justify-center shadow-lg z-10">
                    <span className="text-primary-foreground font-bold text-xl">#{selectedPlayer.number}</span>
                  </div>
                )}
                
                {/* Close Button */}
                <button
                  onClick={() => setSelectedPlayer(null)}
                  className="absolute top-4 right-24 w-11 h-11 bg-muted-foreground/60 rounded-full flex items-center justify-center text-white hover:bg-muted-foreground/80 transition-colors z-10"
                  aria-label="Close"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                  </svg>
                </button>
                
                {/* Player Info Overlay - positioned at bottom of image */}
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <p className="text-primary text-sm font-semibold uppercase tracking-wider mb-1">{currentCategory.subtitle}</p>
                  <h2 className="text-4xl font-bold text-foreground leading-tight">{selectedPlayer.name}</h2>
                  <p className="text-muted-foreground text-lg">{selectedPlayer.position}</p>
                </div>
              </div>

              {/* Stats Section */}
              <div className="p-4 border-l-4 border-primary">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">📊</span>
                  <h3 className="text-sm font-bold text-primary uppercase tracking-wide">
                    {currentCategory.statsLabel}
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
