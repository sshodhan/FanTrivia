'use client';

import { useEffect, useCallback, useRef } from 'react';
import { AVATARS, type AvatarId } from '@/lib/database.types';
import { cn } from '@/lib/utils';

interface LightboxPhoto {
  id: string;
  username: string;
  userAvatar: AvatarId;
  imageUrl: string;
  caption: string;
  likes: number;
  hasLiked: boolean;
  uploadedAt: string;
}

interface PhotoLightboxProps {
  photo: LightboxPhoto;
  onClose: () => void;
  onLike: () => void;
  formatDate: (dateString: string) => string;
}

export function PhotoLightbox({ photo, onClose, onLike, formatDate }: PhotoLightboxProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  // Stable close handler that won't be affected by re-renders
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  // Escape key to close & lock body scroll
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleClose]);

  // Focus the close button on mount for accessibility
  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label={`Full view: ${photo.caption || 'Photo'}`}
    >
      {/* Backdrop tap to close */}
      <div
        className="absolute inset-0"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Content layer above backdrop */}
      <div className="relative z-10 flex flex-col h-full overflow-y-auto">
        {/* Top bar with user info and close */}
        <div className="flex items-center justify-between px-3 py-3 sm:px-5 sm:py-4 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-primary/20 rounded-full flex items-center justify-center shrink-0">
              <span className="text-base sm:text-lg">{AVATARS[photo.userAvatar]?.emoji || '🦅'}</span>
            </div>
            <div className="min-w-0">
              <div className="font-bold text-foreground text-sm sm:text-base truncate">{photo.username}</div>
              <div className="text-xs text-muted-foreground">{formatDate(photo.uploadedAt)}</div>
            </div>
          </div>

          {/* Close button */}
          <button
            ref={closeRef}
            type="button"
            onClick={handleClose}
            className="w-12 h-12 sm:w-10 sm:h-10 bg-muted/80 rounded-full flex items-center justify-center text-foreground active:bg-muted active:scale-95 transition-all shrink-0 ml-2 touch-manipulation select-none"
            aria-label="Close full view"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none">
              <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
            </svg>
          </button>
        </div>

        {/* Full-bleed photo area */}
        <div className="flex-1 flex items-center justify-center px-2 sm:px-4 min-h-0">
          <img
            src={photo.imageUrl}
            alt={photo.caption || 'Photo'}
            className="max-w-full max-h-[70vh] sm:max-h-[75vh] w-auto h-auto rounded-lg object-contain animate-in zoom-in-95 duration-200"
          />
        </div>

        {/* Bottom bar with caption and actions */}
        <div className="px-3 py-3 sm:px-5 sm:py-4 shrink-0">
          {photo.caption && (
            <p className="text-foreground text-sm sm:text-base mb-2.5 sm:mb-3 leading-relaxed">{photo.caption}</p>
          )}
          <button
            type="button"
            onClick={onLike}
            className={cn(
              "flex items-center gap-2 py-1 transition-colors touch-manipulation select-none",
              photo.hasLiked ? "text-primary" : "text-muted-foreground active:text-primary"
            )}
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill={photo.hasLiked ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="pointer-events-none"
            >
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
            </svg>
            <span className="font-medium pointer-events-none">{photo.likes}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
