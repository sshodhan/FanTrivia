'use client';

import { useState, useEffect } from 'react';
import { logClientDebug, logClientError } from '@/lib/error-tracking/client-logger';

interface CountdownTime {
  hours: number;
  minutes: number;
  isUrgent: boolean;
}

function getTimeUntilNextDay(): CountdownTime {
  try {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const diff = tomorrow.getTime() - now.getTime();

    // Soft error: negative or impossibly large diff
    if (diff < 0 || diff > 86_400_000) {
      logClientError(
        `Countdown timer computed invalid diff: ${diff}ms (now: ${now.toISOString()})`,
        'CountdownTimer Soft Error',
        { diff, now: now.toISOString(), tomorrow: tomorrow.toISOString() }
      );
      return { hours: 0, minutes: 0, isUrgent: false };
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return {
      hours,
      minutes,
      isUrgent: hours === 0 && minutes <= 30,
    };
  } catch (error) {
    logClientError(
      error instanceof Error ? error : new Error(String(error)),
      'CountdownTimer Error',
      { context: 'getTimeUntilNextDay' }
    );
    return { hours: 0, minutes: 0, isUrgent: false };
  }
}

export function useCountdownTimer() {
  const [time, setTime] = useState<CountdownTime>(getTimeUntilNextDay());

  useEffect(() => {
    const timer = setInterval(() => {
      const newTime = getTimeUntilNextDay();
      setTime(newTime);

      // Debug: log when countdown becomes urgent
      if (newTime.isUrgent && !time.isUrgent) {
        logClientDebug('CountdownTimer', 'Countdown became urgent', {
          hours: newTime.hours,
          minutes: newTime.minutes,
        }, { level: 'info' });
      }
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, [time.isUrgent]);

  const formatted = `${time.hours}h ${time.minutes}m`;

  return {
    ...time,
    formatted,
  };
}
