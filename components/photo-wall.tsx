'use client';

import { useState } from 'react';
import { samplePhotos } from '@/lib/mock-data';
import { useUser } from '@/lib/user-context';
import type { Photo } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PhotoWallProps {
  onBack: () => void;
}

export function PhotoWall({ onBack }: PhotoWallProps) {
  const { user } = useUser();
  const [photos, setPhotos] = useState<Photo[]>(samplePhotos);
  const [showUpload, setShowUpload] = useState(false);
  const [caption, setCaption] = useState('');

  const handleLike = (photoId: string) => {
    setPhotos(photos.map(p => 
      p.id === photoId ? { ...p, likes: p.likes + 1 } : p
    ));
  };

  const handleUpload = () => {
    if (!user || !caption.trim()) return;

    const newPhoto: Photo = {
      id: `photo_${Date.now()}`,
      teamId: user.username,
      teamName: user.username,
      imageUrl: '/photos/placeholder.jpg',
      caption: caption.trim(),
      likes: 0,
      createdAt: new Date().toISOString(),
    };

    setPhotos([newPhoto, ...photos]);
    setCaption('');
    setShowUpload(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="p-4 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Go back"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6"/>
            </svg>
          </button>
          <h1 className="font-[var(--font-heading)] text-2xl font-bold text-foreground">
            Photo Wall
          </h1>
        </div>
        {user && (
          <Button
            onClick={() => setShowUpload(true)}
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>
            </svg>
            Share
          </Button>
        )}
      </header>

      {/* Photo Grid */}
      <div className="flex-1 overflow-auto p-4">
        {photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="text-5xl mb-4">📸</div>
            <h2 className="text-xl font-bold text-foreground mb-2">No photos yet</h2>
            <p className="text-muted-foreground">Be the first to share a photo!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {photos.map((photo) => (
              <div key={photo.id} className="bg-card rounded-xl overflow-hidden">
                {/* Photo Header */}
                <div className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                    <span className="text-lg">🦅</span>
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-foreground">{photo.teamName}</div>
                    <div className="text-xs text-muted-foreground">{formatDate(photo.createdAt)}</div>
                  </div>
                </div>

                {/* Photo Placeholder */}
                <div className="aspect-video bg-muted flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2 opacity-50">
                      <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                    </svg>
                    <span className="text-sm">Photo</span>
                  </div>
                </div>

                {/* Caption & Actions */}
                <div className="p-4">
                  <p className="text-foreground mb-3">{photo.caption}</p>
                  <button
                    onClick={() => handleLike(photo.id)}
                    className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                    </svg>
                    <span className="font-medium">{photo.likes}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-end justify-center z-50"
          onClick={() => setShowUpload(false)}
        >
          <div 
            className="bg-card w-full max-w-lg rounded-t-3xl p-6 animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground">Share a Photo</h2>
              <button
                onClick={() => setShowUpload(false)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                </svg>
              </button>
            </div>

            {/* Upload Area */}
            <div className="aspect-video bg-muted rounded-xl mb-4 flex items-center justify-center border-2 border-dashed border-border cursor-pointer hover:border-primary/50 transition-colors">
              <div className="text-center text-muted-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>
                </svg>
                <span className="text-sm">Tap to upload</span>
              </div>
            </div>

            {/* Caption Input */}
            <div className="mb-6">
              <label htmlFor="caption" className="block text-sm font-medium text-foreground mb-2">
                Caption
              </label>
              <input
                id="caption"
                type="text"
                placeholder="Add a caption..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                maxLength={150}
              />
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleUpload}
              disabled={!caption.trim()}
              className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-bold disabled:opacity-50"
            >
              Share Photo
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
