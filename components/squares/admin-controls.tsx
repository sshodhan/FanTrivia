'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { logClientDebug, logClientError } from '@/lib/error-tracking/client-logger';
import type { SquaresGame, SquaresEntry, SquaresWinner } from '@/lib/database.types';
import { getLatestQuarter, getWinningSquare, countClaimed, isBoardFull, getUniquePlayers } from '@/lib/squares-utils';

interface AdminControlsProps {
  game: SquaresGame;
  entries: SquaresEntry[];
  winners: SquaresWinner[];
  onGameUpdated: () => void;
  username: string;
}

export function AdminControls({ game, entries, winners, onGameUpdated, username }: AdminControlsProps) {
  const [isLocking, setIsLocking] = useState(false);
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);
  const [isUndoing, setIsUndoing] = useState(false);
  const [isReshuffling, setIsReshuffling] = useState(false);
  const [isBulkFilling, setIsBulkFilling] = useState(false);
  const [scoreA, setScoreA] = useState('');
  const [scoreB, setScoreB] = useState('');
  const [error, setError] = useState('');
  const [showPlayerPanel, setShowPlayerPanel] = useState(false);
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [showBulkFill, setShowBulkFill] = useState(false);
  const [bulkFillMode, setBulkFillMode] = useState<'round_robin' | 'house'>('round_robin');
  const [houseName, setHouseName] = useState('House');

  const claimed = countClaimed(entries);
  const boardFull = isBoardFull(entries);
  const latestQuarter = getLatestQuarter(game);
  const nextQuarter = latestQuarter + 1;
  const canReshuffle = game.status === 'locked' && game.q1_score_a === null;
  const players = getUniquePlayers(entries);

  const handleLockBoard = async () => {
    if (!confirm(`Lock the board and assign random numbers? This cannot be undone. ${claimed}/100 squares are claimed.`)) {
      return;
    }

    setIsLocking(true);
    setError('');

    try {
      const response = await fetch('/api/squares/lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game_id: game.id, username }),
      });

      const data = await response.json();

      if (!response.ok) {
        logClientError(`Lock board failed: ${data.error || 'Unknown error'}`, 'Squares Soft Error', { gameId: game.id, claimed, status: response.status });
        setError(data.error || 'Failed to lock board');
        return;
      }

      logClientDebug('AdminControls', 'Board locked', { gameId: game.id, gameName: game.name, claimed, username }, { force: true });
      onGameUpdated();
    } catch (err) {
      logClientError(err instanceof Error ? err : new Error('Network error locking board'), 'Squares Network Error', { gameId: game.id });
      setError('Network error. Please try again.');
    } finally {
      setIsLocking(false);
    }
  };

  const handleSubmitScore = async (e: React.FormEvent) => {
    e.preventDefault();

    if (scoreA === '' || scoreB === '') {
      setError('Both scores are required');
      return;
    }

    const parsedA = parseInt(scoreA, 10);
    const parsedB = parseInt(scoreB, 10);

    if (isNaN(parsedA) || isNaN(parsedB) || parsedA < 0 || parsedB < 0) {
      setError('Scores must be non-negative numbers');
      return;
    }

    setIsSubmittingScore(true);
    setError('');

    try {
      const response = await fetch('/api/squares/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game_id: game.id,
          username,
          quarter: nextQuarter,
          score_a: parsedA,
          score_b: parsedB,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        logClientError(`Score submission failed: ${data.error || 'Unknown error'}`, 'Squares Soft Error', { gameId: game.id, quarter: nextQuarter, scoreA: parsedA, scoreB: parsedB, status: response.status });
        setError(data.error || 'Failed to submit scores');
        return;
      }

      logClientDebug('AdminControls', 'Scores submitted', { gameId: game.id, quarter: nextQuarter, scoreA: parsedA, scoreB: parsedB, winner: data.winner?.player_name || null, username }, { force: true });

      setScoreA('');
      setScoreB('');
      onGameUpdated();
    } catch (err) {
      logClientError(err instanceof Error ? err : new Error('Network error submitting scores'), 'Squares Network Error', { gameId: game.id, quarter: nextQuarter });
      setError('Network error. Please try again.');
    } finally {
      setIsSubmittingScore(false);
    }
  };

  const handleUndoScore = async () => {
    if (!confirm(`Undo Q${latestQuarter} score? This will remove the winner for that quarter.`)) return;

    setIsUndoing(true);
    setError('');

    try {
      const response = await fetch('/api/squares/undo-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game_id: game.id, username, quarter: latestQuarter }),
      });

      const data = await response.json();

      if (!response.ok) {
        logClientError(`Undo score failed: ${data.error}`, 'Squares Soft Error', { gameId: game.id, quarter: latestQuarter });
        setError(data.error || 'Failed to undo score');
        return;
      }

      logClientDebug('AdminControls', 'Score undone', { gameId: game.id, quarter: latestQuarter, username }, { force: true });
      onGameUpdated();
    } catch (err) {
      logClientError(err instanceof Error ? err : new Error('Network error undoing score'), 'Squares Network Error', { gameId: game.id });
      setError('Network error. Please try again.');
    } finally {
      setIsUndoing(false);
    }
  };

  const handleReshuffle = async () => {
    if (!confirm('Reshuffle all numbers? This will randomly reassign row and column numbers. Squares stay the same.')) return;

    setIsReshuffling(true);
    setError('');

    try {
      const response = await fetch('/api/squares/reshuffle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game_id: game.id, username }),
      });

      const data = await response.json();

      if (!response.ok) {
        logClientError(`Reshuffle failed: ${data.error}`, 'Squares Soft Error', { gameId: game.id });
        setError(data.error || 'Failed to reshuffle');
        return;
      }

      logClientDebug('AdminControls', 'Numbers reshuffled', { gameId: game.id, username }, { force: true });
      onGameUpdated();
    } catch (err) {
      logClientError(err instanceof Error ? err : new Error('Network error reshuffling'), 'Squares Network Error', { gameId: game.id });
      setError('Network error. Please try again.');
    } finally {
      setIsReshuffling(false);
    }
  };

  const handleBulkFill = async () => {
    if (!confirm(`Fill ${100 - claimed} empty squares using ${bulkFillMode === 'house' ? `"${houseName}"` : 'round-robin among existing players'}?`)) return;

    setIsBulkFilling(true);
    setError('');

    try {
      const response = await fetch('/api/squares/bulk-fill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game_id: game.id,
          username,
          mode: bulkFillMode,
          house_name: bulkFillMode === 'house' ? houseName : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        logClientError(`Bulk fill failed: ${data.error}`, 'Squares Soft Error', { gameId: game.id, mode: bulkFillMode });
        setError(data.error || 'Failed to bulk-fill');
        return;
      }

      logClientDebug('AdminControls', 'Bulk fill completed', { gameId: game.id, mode: bulkFillMode, filled: data.filled }, { force: true });
      setShowBulkFill(false);
      onGameUpdated();
    } catch (err) {
      logClientError(err instanceof Error ? err : new Error('Network error bulk filling'), 'Squares Network Error', { gameId: game.id });
      setError('Network error. Please try again.');
    } finally {
      setIsBulkFilling(false);
    }
  };

  return (
    <div className="bg-card rounded-xl p-4 space-y-4">
      <h3 className="font-[var(--font-heading)] text-lg font-bold text-foreground flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
        Game Controls
      </h3>

      {/* Lock Board Button */}
      {game.status === 'open' && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {claimed}/100 squares claimed.
            {boardFull ? ' Board is full!' : ' You can lock early if needed.'}
          </p>
          <Button
            onClick={handleLockBoard}
            disabled={isLocking || claimed === 0}
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
          >
            {isLocking ? 'Locking...' : 'Lock Board & Assign Numbers'}
          </Button>

          {/* Bulk Fill */}
          {!boardFull && (
            <div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBulkFill(!showBulkFill)}
                className="w-full"
              >
                Auto-fill {100 - claimed} Empty Squares
              </Button>

              {showBulkFill && (
                <div className="mt-2 p-3 bg-muted/30 rounded-lg space-y-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setBulkFillMode('round_robin')}
                      className={`flex-1 py-2 px-3 rounded text-xs font-medium transition-all ${
                        bulkFillMode === 'round_robin'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted/50 text-muted-foreground'
                      }`}
                    >
                      Round Robin
                    </button>
                    <button
                      onClick={() => setBulkFillMode('house')}
                      className={`flex-1 py-2 px-3 rounded text-xs font-medium transition-all ${
                        bulkFillMode === 'house'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted/50 text-muted-foreground'
                      }`}
                    >
                      House Player
                    </button>
                  </div>
                  {bulkFillMode === 'house' && (
                    <Input
                      value={houseName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHouseName(e.target.value)}
                      placeholder="House"
                      className="bg-input text-sm"
                      maxLength={30}
                    />
                  )}
                  <Button
                    size="sm"
                    onClick={handleBulkFill}
                    disabled={isBulkFilling || (bulkFillMode === 'round_robin' && players.length === 0)}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {isBulkFilling ? 'Filling...' : `Fill ${100 - claimed} Squares`}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Player List */}
          {players.length > 0 && (
            <div>
              <button
                onClick={() => setShowPlayerPanel(!showPlayerPanel)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                {players.length} Players ({claimed} squares)
              </button>
              {showPlayerPanel && (
                <div className="mt-2 space-y-1">
                  {players.map(p => (
                    <div key={p.name} className="flex items-center justify-between bg-muted/20 rounded px-2 py-1.5 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                        <span>{p.emoji}</span>
                        <span className="text-foreground">{p.name}</span>
                      </div>
                      <span className="text-muted-foreground text-xs">{p.count} sq</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Reshuffle Button (locked, no scores) */}
      {canReshuffle && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleReshuffle}
          disabled={isReshuffling}
          className="w-full"
        >
          {isReshuffling ? 'Reshuffling...' : 'Reshuffle Numbers'}
        </Button>
      )}

      {/* Score Entry */}
      {game.status !== 'open' && nextQuarter <= 4 && (
        <form onSubmit={handleSubmitScore} className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Enter scores at end of Q{nextQuarter}:
            {nextQuarter === 4 && (
              <span className="text-yellow-400 text-xs block mt-0.5">
                Enter the final score including overtime if applicable.
              </span>
            )}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">{game.team_a_name} Score</Label>
              <Input
                type="number"
                min="0"
                value={scoreA}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setScoreA(e.target.value)}
                className="bg-input"
                placeholder="0"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">{game.team_b_name} Score</Label>
              <Input
                type="number"
                min="0"
                value={scoreB}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setScoreB(e.target.value)}
                className="bg-input"
                placeholder="0"
              />
            </div>
          </div>
          <Button
            type="submit"
            disabled={isSubmittingScore}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isSubmittingScore ? 'Submitting...' : `Submit Q${nextQuarter} Score`}
          </Button>
        </form>
      )}

      {/* Undo Last Score */}
      {latestQuarter > 0 && game.status !== 'completed' && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleUndoScore}
          disabled={isUndoing}
          className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
        >
          {isUndoing ? 'Undoing...' : `Undo Q${latestQuarter} Score`}
        </Button>
      )}

      {/* Quarter Results Summary */}
      {latestQuarter > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Results:</p>
          {[1, 2, 3, 4].map(q => {
            const result = getWinningSquare(game, q, entries);
            const scores = q === 1 ? { a: game.q1_score_a, b: game.q1_score_b }
              : q === 2 ? { a: game.q2_score_a, b: game.q2_score_b }
              : q === 3 ? { a: game.q3_score_a, b: game.q3_score_b }
              : { a: game.q4_score_a, b: game.q4_score_b };

            if (scores.a === null) return null;

            return (
              <div key={q} className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2 text-sm">
                <span className="text-muted-foreground">Q{q}: {scores.a}-{scores.b}</span>
                <span className={result ? 'font-bold text-yellow-400' : 'text-muted-foreground italic'}>
                  {result ? result.entry.player_name : 'No winner (unclaimed)'}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {game.status === 'completed' && (
        <div className="text-center py-2">
          <p className="text-primary font-bold">Game Complete!</p>
        </div>
      )}

      {/* Audit Log Toggle */}
      <button
        onClick={() => setShowAuditLog(!showAuditLog)}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {showAuditLog ? 'Hide' : 'Show'} Audit Log
      </button>

      {showAuditLog && <AuditLogPanel gameId={game.id} />}

      {error && (
        <div className="text-destructive text-sm">{error}</div>
      )}
    </div>
  );
}

function AuditLogPanel({ gameId }: { gameId: string }) {
  const [logs, setLogs] = useState<Array<{ id: string; action: string; details: Record<string, unknown>; performed_by: string; created_at: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/squares/audit?game_id=${gameId}`)
      .then(r => r.json())
      .then(data => {
        setLogs(data.logs || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [gameId]);

  if (loading) {
    return <p className="text-xs text-muted-foreground">Loading audit log...</p>;
  }

  if (logs.length === 0) {
    return <p className="text-xs text-muted-foreground">No audit log entries yet.</p>;
  }

  return (
    <div className="max-h-48 overflow-y-auto space-y-1">
      {logs.map(log => (
        <div key={log.id} className="bg-muted/20 rounded px-2 py-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-medium text-foreground capitalize">{log.action.replace(/_/g, ' ')}</span>
            <span className="text-muted-foreground">
              {new Date(log.created_at).toLocaleTimeString()}
            </span>
          </div>
          <div className="text-muted-foreground truncate">
            by {log.performed_by}
          </div>
        </div>
      ))}
    </div>
  );
}
