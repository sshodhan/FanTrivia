'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import useSWR from 'swr';
import { useUser } from '@/lib/user-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SquaresGrid } from './squares-grid';
import { CreateGameForm } from './create-game-form';
import { AdminControls } from './admin-controls';
import { ShareSection } from './share-section';
import { ClaimSquareSheet } from './claim-square-sheet';
import { MultiSelectToolbar } from './multi-select-toolbar';
import { useSquaresRealtime } from '@/hooks/useSquaresRealtime';
import { countClaimed, countPlayerSquares, getWinningSquare, getWinningPosition, getLatestQuarter, getPlayerColor } from '@/lib/squares-utils';
import { fireBigConfetti } from '@/lib/confetti';
import { logClientDebug, logClientError } from '@/lib/error-tracking/client-logger';
import type { SquaresGame, SquaresEntry, SquaresWinner } from '@/lib/database.types';

const fetcher = (url: string) => fetch(url).then(res => res.json());

type ScreenView = 'lobby' | 'create' | 'join' | 'game';

interface SquaresGameScreenProps {
  onBack: () => void;
  initialShareCode?: string;
}

export function SquaresGameScreen({ onBack, initialShareCode }: SquaresGameScreenProps) {
  const { user } = useUser();
  const [view, setView] = useState<ScreenView>(initialShareCode ? 'join' : 'lobby');
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState(initialShareCode || '');
  const [joinError, setJoinError] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [selectedSquares, setSelectedSquares] = useState<Set<string>>(new Set());
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [showClaimSheet, setShowClaimSheet] = useState(false);
  const prevLatestQuarterRef = useRef(0);

  // Fetch user's games for the lobby
  const { data: lobbyData, mutate: mutateLobby } = useSWR(
    user?.username && view === 'lobby' ? `/api/squares?created_by=${encodeURIComponent(user.username)}` : null,
    fetcher
  );

  // Fetch active game data
  const { data: gameData, mutate: mutateGame } = useSWR(
    activeGameId ? `/api/squares?id=${activeGameId}` : null,
    fetcher,
    { refreshInterval: view === 'game' ? 5000 : 0 }
  );

  const game: SquaresGame | null = gameData?.game || null;
  const entries: SquaresEntry[] = gameData?.entries || [];
  const winners: SquaresWinner[] = gameData?.winners || [];

  // Realtime polling for faster updates
  useSquaresRealtime({
    gameId: activeGameId,
    enabled: view === 'game',
    onEntryChange: () => mutateGame(),
    onGameChange: () => mutateGame(),
  });

  // Auto-join from share code on mount
  useEffect(() => {
    if (initialShareCode && view === 'join') {
      handleJoinGame();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fire confetti when a new quarter winner is determined
  useEffect(() => {
    if (!game) return;
    const latestQ = getLatestQuarter(game);
    if (latestQ > prevLatestQuarterRef.current && prevLatestQuarterRef.current > 0) {
      const result = getWinningSquare(game, latestQ, entries);
      if (result) {
        fireBigConfetti();
      }
    }
    prevLatestQuarterRef.current = latestQ;
  }, [game, entries]);

  const handleGameCreated = useCallback((gameId: string) => {
    setActiveGameId(gameId);
    setView('game');
    mutateLobby();
  }, [mutateLobby]);

  const handleJoinGame = async () => {
    const code = joinCode.trim().toUpperCase();
    if (!code) {
      setJoinError('Enter a game code');
      return;
    }

    setIsJoining(true);
    setJoinError('');

    try {
      const response = await fetch(`/api/squares/join?code=${encodeURIComponent(code)}`);
      const data = await response.json();

      if (!response.ok) {
        logClientError(
          `Join game failed: ${data.error || 'Game not found'}`,
          'Squares Soft Error',
          { shareCode: code, status: response.status }
        )
        setJoinError(data.error || 'Game not found');
        return;
      }

      logClientDebug('SquaresGame', 'Game joined via code', {
        gameId: data.game.id,
        shareCode: code,
        gameName: data.game.name,
      }, { force: true })

      setActiveGameId(data.game.id);
      setView('game');
    } catch (err) {
      logClientError(
        err instanceof Error ? err : new Error('Network error joining game'),
        'Squares Network Error',
        { shareCode: code }
      )
      setJoinError('Network error. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };

  const handleOpenGame = (gameId: string) => {
    setActiveGameId(gameId);
    setView('game');
  };

  const handleSquareClick = useCallback((row: number, col: number) => {
    const key = `${row}-${col}`;

    if (isMultiSelectMode) {
      // In multi-select mode, toggle the square
      setSelectedSquares((prev: Set<string>) => {
        const next = new Set(prev);
        if (next.has(key)) {
          next.delete(key);
        } else {
          next.add(key);
        }
        return next;
      });
    } else {
      // Single select mode - select and immediately show claim sheet
      setSelectedSquares(new Set([key]));
      setShowClaimSheet(true);
    }
  }, [isMultiSelectMode]);

  const handleClaimSquares = useCallback(async (playerName: string, emoji: string) => {
    if (!activeGameId || selectedSquares.size === 0) return;

    const squareKeys = Array.from(selectedSquares) as string[];
    const squares = squareKeys.map((k) => {
      const [row, col] = k.split('-').map(Number);
      return { row, col };
    });

    try {
      const response = await fetch('/api/squares/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game_id: activeGameId,
          squares,
          player_name: playerName,
          player_user_id: user?.user_id || null,
          player_emoji: emoji,
          player_color: getPlayerColor(playerName),
        }),
      });

      if (response.ok) {
        logClientDebug('SquaresGame', 'Squares claimed', {
          gameId: activeGameId,
          playerName,
          emoji,
          squareCount: squares.length,
        }, { force: true })
        setSelectedSquares(new Set());
        setShowClaimSheet(false);
        setIsMultiSelectMode(false);
        mutateGame();
      } else {
        const data = await response.json();
        logClientError(
          `Claim squares failed: ${data.error || 'Unknown error'}`,
          'Squares Soft Error',
          { gameId: activeGameId, squareCount: squares.length, status: response.status }
        )
        throw new Error(data.error || 'Failed to claim squares');
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes('claim')) {
        throw err; // Re-throw for the sheet to display
      }
      logClientError(
        err instanceof Error ? err : new Error('Network error claiming squares'),
        'Squares Network Error',
        { gameId: activeGameId, squareCount: squares.length }
      )
      throw new Error('Network error. Please try again.');
    }
  }, [activeGameId, selectedSquares, user?.user_id, mutateGame]);

  const handleClearSelection = useCallback(() => {
    setSelectedSquares(new Set());
  }, []);

  const handleToggleMultiSelect = useCallback(() => {
    setIsMultiSelectMode(prev => !prev);
    setSelectedSquares(new Set());
  }, []);

  const handleClaimAll = useCallback(() => {
    if (selectedSquares.size > 0) {
      setShowClaimSheet(true);
    }
  }, [selectedSquares.size]);

  const handleRemoveEntry = useCallback(async (entry: SquaresEntry) => {
    if (!game || !user?.username) return;
    if (game.created_by !== user.username) return;

    const confirmed = window.confirm(`Remove ${entry.player_name}'s square at (${entry.row_index}, ${entry.col_index})?`);
    if (!confirmed) return;

    try {
      const response = await fetch('/api/squares/entries', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entry_id: entry.id,
          game_id: game.id,
          username: user.username,
        }),
      });

      if (response.ok) {
        logClientDebug('SquaresGame', 'Entry removed via long press', {
          gameId: game.id,
          entryId: entry.id,
          playerName: entry.player_name,
        }, { force: true });
        mutateGame();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to remove entry');
      }
    } catch {
      alert('Network error. Please try again.');
    }
  }, [game, user?.username, mutateGame]);

  const isCreator = game?.created_by === user?.username;
  const claimed = entries.length;
  const currentPlayerSquareCount = user?.username
    ? countPlayerSquares(entries, user.username)
    : 0;

  // Lobby view
  if (view === 'lobby') {
    const myGames: SquaresGame[] = lobbyData?.games || [];

    return (
      <div className="min-h-screen flex flex-col bg-background pb-20">
        <header className="p-4 flex items-center gap-3 border-b border-border">
          <button onClick={onBack} className="text-muted-foreground hover:text-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <h1 className="font-[var(--font-heading)] text-2xl font-bold text-foreground">
            Super Bowl Squares
          </h1>
        </header>

        <div className="flex-1 p-6 space-y-6">
          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={() => setView('create')}
              className="h-20 bg-primary text-primary-foreground hover:bg-primary/90 flex flex-col gap-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
              <span className="font-bold">New Game</span>
            </Button>
            <Button
              onClick={() => setView('join')}
              variant="outline"
              className="h-20 flex flex-col gap-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" x2="3" y1="12" y2="12"/></svg>
              <span className="font-bold">Join Game</span>
            </Button>
          </div>

          {/* My Games */}
          {myGames.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                My Games
              </h2>
              <div className="space-y-3">
                {myGames.map(g => (
                  <button
                    key={g.id}
                    onClick={() => handleOpenGame(g.id)}
                    className="w-full bg-card rounded-xl p-4 text-left transition-all hover:bg-card/80 active:scale-[0.98]"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-foreground">{g.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {g.team_a_name} vs {g.team_b_name}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          g.status === 'open' ? 'bg-primary/20 text-primary' :
                          g.status === 'locked' ? 'bg-yellow-500/20 text-yellow-400' :
                          g.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {g.status === 'open' ? 'Open' :
                           g.status === 'locked' ? 'Locked' :
                           g.status === 'in_progress' ? 'In Progress' :
                           'Completed'}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {myGames.length === 0 && (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">🏈</div>
              <p className="text-lg font-bold text-foreground mb-2">No games yet</p>
              <p className="text-sm text-muted-foreground">
                Create a new game or join one with a code!
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Create game view
  if (view === 'create') {
    return (
      <div className="min-h-screen bg-background pb-20">
        <header className="p-4 flex items-center gap-3 border-b border-border">
          <button onClick={() => setView('lobby')} className="text-muted-foreground hover:text-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <h1 className="font-[var(--font-heading)] text-xl font-bold text-foreground">
            New Game
          </h1>
        </header>
        <CreateGameForm
          username={user?.username || ''}
          onCreated={handleGameCreated}
          onCancel={() => setView('lobby')}
        />
      </div>
    );
  }

  // Join game view
  if (view === 'join') {
    return (
      <div className="min-h-screen bg-background pb-20">
        <header className="p-4 flex items-center gap-3 border-b border-border">
          <button onClick={() => setView('lobby')} className="text-muted-foreground hover:text-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <h1 className="font-[var(--font-heading)] text-xl font-bold text-foreground">
            Join Game
          </h1>
        </header>
        <div className="p-6 space-y-6">
          <div className="text-center">
            <div className="text-5xl mb-4">🎟</div>
            <p className="text-muted-foreground mb-6">
              Enter the 6-character code to join a game
            </p>
          </div>

          <div className="flex gap-3">
            <Input
              value={joinCode}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="ABCD12"
              className="bg-input text-center text-xl font-mono tracking-[0.3em] uppercase"
              maxLength={6}
              onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && handleJoinGame()}
            />
            <Button
              onClick={handleJoinGame}
              disabled={isJoining || joinCode.length < 6}
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-6"
            >
              {isJoining ? '...' : 'Join'}
            </Button>
          </div>

          {joinError && (
            <div className="text-destructive text-sm text-center">{joinError}</div>
          )}
        </div>
      </div>
    );
  }

  // Game view
  if (!game) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading game...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background pb-24">
      {/* Header */}
      <header className="p-4 flex items-center gap-3 border-b border-border">
        <button
          onClick={() => {
            setActiveGameId(null);
            setSelectedSquares(new Set());
            setIsMultiSelectMode(false);
            setShowClaimSheet(false);
            setView('lobby');
          }}
          className="text-muted-foreground hover:text-foreground"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <div className="flex-1">
          <h1 className="font-[var(--font-heading)] text-lg font-bold text-foreground leading-tight">
            {game.name}
          </h1>
          <p className="text-xs text-muted-foreground">
            {game.team_a_name} vs {game.team_b_name}
          </p>
        </div>
        <div className="text-right">
          <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
            game.status === 'open' ? 'bg-primary/20 text-primary' :
            game.status === 'locked' ? 'bg-yellow-500/20 text-yellow-400' :
            game.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
            'bg-muted text-muted-foreground'
          }`}>
            {claimed}/100
          </span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Winner announcement banner */}
        {getLatestQuarter(game) > 0 && (() => {
          const latestQ = getLatestQuarter(game);
          const result = getWinningSquare(game, latestQ, entries);
          const position = getWinningPosition(game, latestQ);
          if (!position) return null;

          const scores = latestQ === 1 ? { a: game.q1_score_a, b: game.q1_score_b }
            : latestQ === 2 ? { a: game.q2_score_a, b: game.q2_score_b }
            : latestQ === 3 ? { a: game.q3_score_a, b: game.q3_score_b }
            : { a: game.q4_score_a, b: game.q4_score_b };

          return (
            <div className="bg-yellow-500/20 border border-yellow-500/40 rounded-xl p-4 text-center squares-winner-burst">
              <div className="text-2xl mb-1">🏆</div>
              <p className="font-bold text-yellow-400">
                Q{latestQ} Winner: {result ? result.entry.player_name : 'Unclaimed Square'}
              </p>
              <p className="text-sm text-muted-foreground">
                {game.team_a_name} {scores.a} - {game.team_b_name} {scores.b}
              </p>
            </div>
          );
        })()}

        {/* Multi-select toolbar (only when game is open) */}
        {game.status === 'open' && (
          <MultiSelectToolbar
            isMultiSelectMode={isMultiSelectMode}
            selectedCount={selectedSquares.size}
            onToggleMultiSelect={handleToggleMultiSelect}
            onClaimAll={handleClaimAll}
            onClearSelection={handleClearSelection}
          />
        )}

        {/* Grid */}
        <SquaresGrid
          game={game}
          entries={entries}
          winners={winners}
          currentUser={user?.username}
          selectedSquares={selectedSquares}
          onSquareClick={handleSquareClick}
          onSquareLongPress={isCreator && game.status === 'open' ? handleRemoveEntry : undefined}
        />

        {/* Share Section */}
        <ShareSection game={game} />

        {/* Admin Controls (game creator only) */}
        {isCreator && (
          <AdminControls
            game={game}
            entries={entries}
            winners={winners}
            onGameUpdated={() => mutateGame()}
            username={user?.username || ''}
          />
        )}

        {/* Winners Display (for non-creators) */}
        {!isCreator && getLatestQuarter(game) > 0 && (
          <div className="bg-card rounded-xl p-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Winners
            </h3>
            <div className="space-y-2">
              {[1, 2, 3, 4].map(q => {
                const result = getWinningSquare(game, q, entries);
                const position = getWinningPosition(game, q);
                if (!position) return null;
                const scores = q === 1 ? { a: game.q1_score_a, b: game.q1_score_b }
                  : q === 2 ? { a: game.q2_score_a, b: game.q2_score_b }
                  : q === 3 ? { a: game.q3_score_a, b: game.q3_score_b }
                  : { a: game.q4_score_a, b: game.q4_score_b };

                return (
                  <div key={q} className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2 text-sm">
                    <span className="text-muted-foreground">
                      Q{q}: {game.team_a_name} {scores.a} - {game.team_b_name} {scores.b}
                    </span>
                    <span className="font-bold text-yellow-400">
                      {result ? result.entry.player_name : 'Unclaimed'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Grid Legend */}
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-primary/20 border border-primary/40" />
            <span>Your squares</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-card border border-border" />
            <span>Claimed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-yellow-500/30 border border-yellow-500" />
            <span>Winner</span>
          </div>
          {game.status === 'open' && (
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-primary/40 border border-primary" />
              <span>Selected</span>
            </div>
          )}
        </div>
      </div>

      {/* Claim Square Sheet */}
      {showClaimSheet && selectedSquares.size > 0 && game.status === 'open' && (
        <ClaimSquareSheet
          gameId={game.id}
          squares={Array.from(selectedSquares).map(k => {
            const [row, col] = k.split('-').map(Number);
            return { row, col };
          })}
          defaultPlayerName={user?.username || ''}
          defaultPlayerUserId={user?.user_id}
          maxSquaresPerPlayer={game.max_squares_per_player}
          currentPlayerSquareCount={currentPlayerSquareCount}
          onClaim={handleClaimSquares}
          onClose={() => {
            setShowClaimSheet(false);
            if (!isMultiSelectMode) {
              setSelectedSquares(new Set());
            }
          }}
        />
      )}
    </div>
  );
}
