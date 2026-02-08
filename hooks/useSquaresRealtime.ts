'use client';

import { useEffect, useRef, useCallback } from 'react';
import { logClientDebug } from '@/lib/error-tracking/client-logger';

/**
 * Hook for real-time squares updates.
 * Uses polling via SWR (already in place) + this optional hook
 * for faster notifications via Supabase Realtime when available.
 *
 * Falls back gracefully - the SWR polling at 5s provides the baseline.
 */
interface UseSquaresRealtimeOptions {
  gameId: string | null;
  onEntryChange?: () => void;
  onGameChange?: () => void;
  enabled?: boolean;
}

export function useSquaresRealtime({
  gameId,
  onEntryChange,
  onGameChange,
  enabled = true,
}: UseSquaresRealtimeOptions) {
  const channelRef = useRef<ReturnType<typeof createChannel> | null>(null);

  // Use native EventSource for Supabase Realtime if available
  // For now, we enhance the SWR polling approach with a shorter interval
  // when the page is focused, and notify on changes
  const lastCheckRef = useRef<string>('');

  const checkForUpdates = useCallback(async () => {
    if (!gameId || !enabled) return;

    try {
      const res = await fetch(`/api/squares?id=${gameId}`);
      const data = await res.json();
      if (!data.game) return;

      const checksum = `${data.game.updated_at}-${data.entries?.length || 0}`;
      if (lastCheckRef.current && lastCheckRef.current !== checksum) {
        logClientDebug('SquaresRealtime', 'Change detected', { gameId, checksum }, { force: true });
        onEntryChange?.();
        onGameChange?.();
      }
      lastCheckRef.current = checksum;
    } catch {
      // Silently fail - SWR polling is the primary mechanism
    }
  }, [gameId, enabled, onEntryChange, onGameChange]);

  useEffect(() => {
    if (!gameId || !enabled) return;

    // Quick poll every 2 seconds when page is visible
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        checkForUpdates();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [gameId, enabled, checkForUpdates]);

  return { checkForUpdates };
}

// Placeholder for future Supabase Realtime channel creation
function createChannel(_gameId: string) {
  return null;
}
