'use client';

import { useState, useEffect } from 'react';

export function useCurrentDay(): number {
  const [currentDay, setCurrentDay] = useState(1);

  useEffect(() => {
    let cancelled = false;

    async function fetchDay() {
      try {
        const res = await fetch('/api/game/day');
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && typeof data.current_day === 'number') {
          setCurrentDay(data.current_day);
        }
      } catch {
        // Fall back to day 1
      }
    }

    fetchDay();
    return () => { cancelled = true; };
  }, []);

  return currentDay;
}
