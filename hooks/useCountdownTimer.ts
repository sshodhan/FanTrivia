'use client';

import { useState, useEffect } from 'react';

interface CountdownTime {
  hours: number;
  minutes: number;
  isUrgent: boolean;
}

function getTimeUntilNextDay(): CountdownTime {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const diff = tomorrow.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return {
    hours,
    minutes,
    isUrgent: hours === 0 && minutes <= 30,
  };
}

export function useCountdownTimer() {
  const [time, setTime] = useState<CountdownTime>(getTimeUntilNextDay());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(getTimeUntilNextDay());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  const formatted = `${time.hours}h ${time.minutes}m`;

  return {
    ...time,
    formatted,
  };
}
