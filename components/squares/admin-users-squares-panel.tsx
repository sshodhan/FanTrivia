'use client';

import { useState, useEffect } from 'react';
import { AVATARS, type AvatarId } from '@/lib/database.types';

interface UserSquaresInfo {
  user_id: string | null;
  username: string;
  avatar: AvatarId | null;
  is_admin: boolean;
  squares_count: number;
  squares: Array<{ row: number; col: number }>;
}

interface AdminUsersSquaresPanelProps {
  gameId: string;
  username: string;
}

export function AdminUsersSquaresPanel({ gameId, username }: AdminUsersSquaresPanelProps) {
  const [users, setUsers] = useState<UserSquaresInfo[]>([]);
  const [guests, setGuests] = useState<UserSquaresInfo[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalSquares, setTotalSquares] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'with_squares' | 'without_squares'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(`/api/squares/admin-users?game_id=${gameId}`, {
          headers: { 'x-username': username },
        });
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Failed to fetch data');
          return;
        }

        setUsers(data.users || []);
        setGuests(data.guests || []);
        setTotalUsers(data.total_users || 0);
        setTotalSquares(data.total_squares_claimed || 0);
      } catch {
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [gameId, username]);

  const allPlayers = [...users, ...guests];

  const filtered = allPlayers.filter(u => {
    if (filter === 'with_squares' && u.squares_count === 0) return false;
    if (filter === 'without_squares' && u.squares_count > 0) return false;
    if (search) {
      const q = search.toLowerCase();
      return u.username.toLowerCase().includes(q) ||
        (u.user_id && u.user_id.toLowerCase().includes(q));
    }
    return true;
  });

  const usersWithSquares = allPlayers.filter(u => u.squares_count > 0).length;

  if (loading) {
    return (
      <div className="bg-card rounded-xl p-4">
        <p className="text-sm text-muted-foreground">Loading users...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card rounded-xl p-4">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl p-4 space-y-4">
      <h3 className="font-[var(--font-heading)] text-lg font-bold text-foreground flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        All Users &amp; Squares
      </h3>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-muted/30 rounded-lg p-2">
          <div className="text-lg font-bold text-foreground">{totalUsers}</div>
          <div className="text-xs text-muted-foreground">Total Users</div>
        </div>
        <div className="bg-muted/30 rounded-lg p-2">
          <div className="text-lg font-bold text-foreground">{usersWithSquares}</div>
          <div className="text-xs text-muted-foreground">With Squares</div>
        </div>
        <div className="bg-muted/30 rounded-lg p-2">
          <div className="text-lg font-bold text-foreground">{totalSquares}</div>
          <div className="text-xs text-muted-foreground">Claimed</div>
        </div>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search by name or ID..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary"
      />

      {/* Filter tabs */}
      <div className="flex gap-1">
        {(['all', 'with_squares', 'without_squares'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 py-1.5 px-2 rounded text-xs font-medium transition-all ${
              filter === f
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted/30 text-muted-foreground hover:text-foreground'
            }`}
          >
            {f === 'all' ? 'All' : f === 'with_squares' ? 'With Squares' : 'No Squares'}
          </button>
        ))}
      </div>

      {/* User list */}
      <div className="max-h-80 overflow-y-auto space-y-1">
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No users found</p>
        ) : (
          filtered.map((u, i) => (
            <div
              key={u.user_id || `guest-${u.username}-${i}`}
              className="flex items-center justify-between bg-muted/20 rounded-lg px-3 py-2"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {u.avatar && AVATARS[u.avatar] && (
                    <span className="text-sm flex-shrink-0">{AVATARS[u.avatar].emoji}</span>
                  )}
                  <span className="font-medium text-sm text-foreground truncate">
                    {u.username}
                  </span>
                  {u.is_admin && (
                    <span className="bg-yellow-500/20 text-yellow-400 text-[10px] px-1 py-0.5 rounded font-medium flex-shrink-0">
                      ADMIN
                    </span>
                  )}
                  {!u.user_id && (
                    <span className="bg-muted text-muted-foreground text-[10px] px-1 py-0.5 rounded font-medium flex-shrink-0">
                      GUEST
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground truncate mt-0.5">
                  {u.user_id || 'No account'}
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-2">
                <div className={`text-sm font-bold ${u.squares_count > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                  {u.squares_count}
                </div>
                <div className="text-[10px] text-muted-foreground">squares</div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="text-xs text-muted-foreground text-center">
        Showing {filtered.length} of {allPlayers.length} users
      </div>
    </div>
  );
}
