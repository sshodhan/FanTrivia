'use client';

import { useState } from 'react';

export function HowToPlaySheet({ onClose }: { onClose: () => void }) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-40 squares-backdrop-enter"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed inset-x-0 top-0 bottom-0 z-50 flex items-start justify-center pt-12 pb-12 px-4 overflow-y-auto">
        <div className="bg-card rounded-2xl border border-border p-6 max-w-md w-full squares-sheet-enter relative">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>

          {/* Title */}
          <div className="text-center mb-5">
            <div className="text-3xl mb-2">🏈</div>
            <h2 className="font-[var(--font-heading)] text-xl font-bold text-foreground">
              How to Play
            </h2>
            <p className="text-xs text-muted-foreground mt-1">Super Bowl Squares</p>
          </div>

          {/* Steps */}
          <div className="space-y-4 text-sm">
            {/* Step 1 */}
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
              <div>
                <p className="font-bold text-foreground">Claim Your Squares</p>
                <p className="text-muted-foreground">Tap empty squares on the 10x10 grid to claim them. Pick an emoji icon to represent you.</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">2</div>
              <div>
                <p className="font-bold text-foreground">Board Gets Locked</p>
                <p className="text-muted-foreground">The admin locks the board before kickoff. Random numbers 0-9 are assigned to each row and column.</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">3</div>
              <div>
                <p className="font-bold text-foreground">Check Scores Each Quarter</p>
                <p className="text-muted-foreground">After each quarter, look at the <strong>last digit</strong> of each team&apos;s score.</p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-yellow-500/20 text-yellow-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C5.71 4 7 5.29 7 6.5V8l5-4 5 4V6.5C17 5.29 18.29 4 19.5 4a2.5 2.5 0 0 1 0 5H18l.05 2.63L12 18l-5.95-6.37L6 9Z"/></svg>
              </div>
              <div>
                <p className="font-bold text-foreground">Win!</p>
                <p className="text-muted-foreground">The square where those two digits meet wins that quarter. 4 chances to win!</p>
              </div>
            </div>
          </div>

          {/* Example */}
          <div className="mt-5 bg-muted/30 rounded-xl p-4">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Example</p>
            <p className="text-sm text-foreground">
              Score: <strong>Seahawks 17</strong> - <strong>Patriots 23</strong>
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Last digits: <strong className="text-primary">7</strong> and <strong className="text-primary">3</strong>
            </p>
            <p className="text-sm text-muted-foreground">
              The square at row <strong className="text-primary">7</strong>, column <strong className="text-primary">3</strong> wins!
            </p>
          </div>

          {/* Tips */}
          <div className="mt-4 space-y-2 text-xs text-muted-foreground">
            <div className="flex items-start gap-2">
              <span className="text-primary">+</span>
              <span>Tap your own squares to unclaim them (while board is open)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary">+</span>
              <span>Use &quot;Select Multiple&quot; to claim several squares at once</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary">+</span>
              <span>Numbers are randomly assigned -- every square has equal odds!</span>
            </div>
          </div>

          {/* Close */}
          <button
            onClick={onClose}
            className="mt-5 w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors"
          >
            Got It
          </button>
        </div>
      </div>
    </>
  );
}

export function HowToPlayButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-9 h-9 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      aria-label="How to play"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>
    </button>
  );
}
