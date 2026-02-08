'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface NumberRevealProps {
  rowNumbers: number[];
  colNumbers: number[];
  onRevealComplete?: () => void;
}

/**
 * Hook that manages the slot-machine style number reveal animation.
 * Returns the current display state for each cell and whether the reveal is active.
 */
export function useNumberReveal({ rowNumbers, colNumbers, onRevealComplete }: NumberRevealProps) {
  // Each cell has: { revealed: boolean, currentDigit: number, spinning: boolean }
  const [revealedCols, setRevealedCols] = useState<boolean[]>(new Array(10).fill(false));
  const [revealedRows, setRevealedRows] = useState<boolean[]>(new Array(10).fill(false));
  const [spinDigits, setSpinDigits] = useState<number[]>(new Array(10).fill(0));
  const [isRevealing, setIsRevealing] = useState(false);
  const [allRevealed, setAllRevealed] = useState(false);
  const [showGridFlash, setShowGridFlash] = useState(false);
  const spinIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasRevealedRef = useRef(false);

  // Spin random digits rapidly
  useEffect(() => {
    if (isRevealing) {
      spinIntervalRef.current = setInterval(() => {
        setSpinDigits(prev => prev.map(() => Math.floor(Math.random() * 10)));
      }, 80);
    } else if (spinIntervalRef.current) {
      clearInterval(spinIntervalRef.current);
      spinIntervalRef.current = null;
    }
    return () => {
      if (spinIntervalRef.current) clearInterval(spinIntervalRef.current);
    };
  }, [isRevealing]);

  const startReveal = useCallback(() => {
    if (hasRevealedRef.current) return;
    hasRevealedRef.current = true;
    setIsRevealing(true);
    setRevealedCols(new Array(10).fill(false));
    setRevealedRows(new Array(10).fill(false));

    // Stagger column reveals: each 150ms apart
    for (let i = 0; i < 10; i++) {
      setTimeout(() => {
        setRevealedCols(prev => {
          const next = [...prev];
          next[i] = true;
          return next;
        });
      }, 300 + i * 150);
    }

    // Stagger row reveals after columns: each 150ms apart
    for (let i = 0; i < 10; i++) {
      setTimeout(() => {
        setRevealedRows(prev => {
          const next = [...prev];
          next[i] = true;
          return next;
        });
      }, 300 + 10 * 150 + i * 150);
    }

    // All done
    const totalTime = 300 + 20 * 150 + 400;
    setTimeout(() => {
      setIsRevealing(false);
      setAllRevealed(true);
      setShowGridFlash(true);
      setTimeout(() => setShowGridFlash(false), 600);
      onRevealComplete?.();
    }, totalTime);
  }, [onRevealComplete]);

  /**
   * Get the display value for a column header cell.
   */
  const getColDisplay = useCallback((colIdx: number): { digit: number; isRevealed: boolean; isSpinning: boolean } => {
    if (revealedCols[colIdx]) {
      return { digit: colNumbers[colIdx], isRevealed: true, isSpinning: false };
    }
    if (isRevealing) {
      return { digit: spinDigits[colIdx], isRevealed: false, isSpinning: true };
    }
    return { digit: 0, isRevealed: false, isSpinning: false };
  }, [revealedCols, colNumbers, isRevealing, spinDigits]);

  /**
   * Get the display value for a row header cell.
   */
  const getRowDisplay = useCallback((rowIdx: number): { digit: number; isRevealed: boolean; isSpinning: boolean } => {
    if (revealedRows[rowIdx]) {
      return { digit: rowNumbers[rowIdx], isRevealed: true, isSpinning: false };
    }
    if (isRevealing) {
      return { digit: spinDigits[rowIdx], isRevealed: false, isSpinning: true };
    }
    return { digit: 0, isRevealed: false, isSpinning: false };
  }, [revealedRows, rowNumbers, isRevealing, spinDigits]);

  return {
    startReveal,
    getColDisplay,
    getRowDisplay,
    isRevealing,
    allRevealed,
    showGridFlash,
  };
}
