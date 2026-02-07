'use client';

export function PartyFab({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed right-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-50 group flex items-center gap-2 rounded-full bg-primary/90 hover:bg-primary pl-3 pr-4 py-2 shadow-lg shadow-primary/25 active:scale-95 transition-all"
      aria-label="Party Info"
    >
      {/* Jiggling party popper icon */}
      <span className="relative flex items-center justify-center w-7 h-7">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-primary-foreground animate-jiggle"
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
        <span className="absolute -top-1 -right-1 w-2 h-2 bg-foreground rounded-full animate-pulse" />
      </span>

      {/* Label */}
      <span className="text-xs font-bold text-primary-foreground leading-tight tracking-wide">
        PARTY<br />Info
      </span>
    </button>
  );
}
