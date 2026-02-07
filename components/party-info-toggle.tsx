'use client';

import { cn } from '@/lib/utils';

interface PartyInfoToggleProps {
  isActive: boolean;
  onToggle: () => void;
}

export function PartyInfoToggle({ isActive, onToggle }: PartyInfoToggleProps) {
  return (
    <button
      onClick={onToggle}
      role="switch"
      aria-checked={isActive}
      aria-label={
        isActive
          ? 'Party info is active. Click to return to homepage.'
          : 'Party info is inactive. Click to view party information.'
      }
      className="group flex flex-col items-center gap-0.5 active:scale-95 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg p-1"
    >
      <span
        className={cn(
          'relative flex items-center justify-center w-11 h-11 rounded-full transition-all duration-300',
          isActive
            ? 'bg-primary shadow-[0_0_14px_rgba(105,190,40,0.55)] ring-2 ring-primary/60'
            : 'bg-primary/15 group-hover:bg-primary/25'
        )}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={cn(
            'transition-colors duration-300',
            isActive ? 'text-primary-foreground' : 'text-primary animate-jiggle'
          )}
        >
          <path d="M5.8 11.3 2 22l10.7-3.8" />
          <path d="M4 3h.01" />
          <path d="M22 8h.01" />
          <path d="M15 2h.01" />
          <path d="M22 20h.01" />
          <path d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10" />
          <path d="m22 13-.82-.33c-.86-.34-1.82.2-1.98 1.11c-.11.7-.72 1.22-1.43 1.22H17" />
          <path d="m11 2 .33.82c.34.86-.2 1.82-1.11 1.98C9.52 4.9 9 5.52 9 6.23V7" />
        </svg>
        {!isActive && (
          <span
            className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-primary rounded-full animate-pulse"
            aria-hidden="true"
          />
        )}
        {isActive && (
          <span
            className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-foreground rounded-full"
            aria-hidden="true"
          />
        )}
      </span>
      <span
        className={cn(
          'text-[10px] font-semibold tracking-wide leading-tight text-center transition-colors duration-300',
          isActive ? 'text-foreground' : 'text-primary'
        )}
      >
        PARTY
        <br />
        Info
      </span>
    </button>
  );
}
