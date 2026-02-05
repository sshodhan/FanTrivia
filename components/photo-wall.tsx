'use client';

import { useState, useRef, useEffect } from 'react';
import useSWR from 'swr';
import { useUser } from '@/lib/user-context';
import type { PhotoWithTeam } from '@/lib/database.types';
import { AVATARS, type AvatarId } from '@/lib/database.types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { logClientDebug, logClientError } from '@/lib/error-tracking/client-logger';

interface PhotoWallProps {
  onBack: () => void;
}

interface PhotosResponse {
  photos: PhotoWithTeam[];
  next_cursor: string | null;
  has_more: boolean;
}

// Display format for the component
interface DisplayPhoto {
  id: string;
  username: string;
  userAvatar: AvatarId;
  imageUrl: string;
  caption: string;
  likes: number;
  hasLiked: boolean;
  uploadedAt: string;
}

// Transform API photo to display format
function transformPhoto(photo: PhotoWithTeam): DisplayPhoto {
  return {
    id: photo.id,
    username: photo.team_name || 'Unknown',
    userAvatar: 'hawk' as AvatarId, // Default avatar
    imageUrl: photo.image_url,
    caption: photo.caption || '',
    likes: photo.likes,
    hasLiked: photo.has_liked || false,
    uploadedAt: photo.uploaded_at,
  };
}

export function PhotoWall({ onBack }: PhotoWallProps) {
  const { user } = useUser();
  const [showUpload, setShowUpload] = useState(false);
  const [caption, setCaption] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetcher that includes user_id header
  const fetcher = (url: string) =>
    fetch(url, {
      headers: user?.user_id ? { 'x-team-id': user.user_id } : {},
    }).then(res => res.json());

  const { data, error, isLoading, mutate } = useSWR<PhotosResponse>(
    '/api/photos?limit=20',
    fetcher,
    { refreshInterval: 30000 }
  );

  // Debug logging for photos loading
  useEffect(() => {
    logClientDebug('PhotoWall', 'SWR state', { 
      isLoading, 
      hasError: !!error,
      errorMessage: error?.message || error,
      hasData: !!data,
      dataKeys: data ? Object.keys(data) : [],
      photosArray: data?.photos,
      photosIsArray: Array.isArray(data?.photos),
      photosLength: data?.photos?.length,
      rawData: data
    }, { force: true });
  }, [data, error, isLoading]);

  // Log any fetch errors
  useEffect(() => {
    if (error) {
      logClientError(error, 'PhotoWall Fetch Error', {
        url: '/api/photos?limit=20',
        userId: user?.user_id
      });
    }
  }, [error, user?.user_id]);

  const photos = data?.photos?.map(transformPhoto) || [];

  // Handle like/unlike
  const handleLike = async (photoId: string) => {
    if (!user?.user_id) return;

    try {
      const response = await fetch(`/api/photos/${photoId}/like`, {
        method: 'POST',
        headers: {
          'x-team-id': user.user_id,
        },
      });

      if (response.ok) {
        // Refresh the photos list
        mutate();
      }
    } catch (err) {
      console.error('Like error:', err);
    }
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Invalid file type. Allowed: JPG, PNG, WebP, GIF');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File too large. Maximum size is 5MB');
      return;
    }

    setUploadError(null);
    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  // Handle upload
  const handleUpload = async () => {
    if (!user?.user_id || !selectedFile) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      if (caption.trim()) {
        formData.append('caption', caption.trim());
      }

      const response = await fetch('/api/photos/upload', {
        method: 'POST',
        headers: {
          'x-team-id': user.user_id,
          'authorization': `Bearer ${user.user_id}`, // Using user_id as session token for demo
        },
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Upload failed');
      }

      // Success - refresh photos and close modal
      mutate();
      setCaption('');
      setSelectedFile(null);
      setPreviewUrl(null);
      setShowUpload(false);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  // Reset upload modal
  const resetUpload = () => {
    setShowUpload(false);
    setCaption('');
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadError(null);
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

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <header className="p-4 flex items-center justify-between border-b border-border">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Go back">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6"/>
              </svg>
            </button>
            <h1 className="font-[var(--font-heading)] text-2xl font-bold text-foreground">Photo Wall</h1>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-muted-foreground">Loading photos...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <header className="p-4 flex items-center justify-between border-b border-border">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Go back">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6"/>
              </svg>
            </button>
            <h1 className="font-[var(--font-heading)] text-2xl font-bold text-foreground">Photo Wall</h1>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-destructive">Failed to load photos</div>
        </div>
      </div>
    );
  }

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
          <div className="flex flex-col items-center justify-center h-64 text-center px-6">
            <div className="text-6xl mb-4">📸</div>
            <h2 className="text-2xl font-bold text-foreground mb-3">Join the 12th Man Gallery!</h2>
            <p className="text-muted-foreground mb-6 max-w-xs">
              Share your game day photos, Seahawks gear, or fan moments with fellow 12s!
            </p>
            {user && (
              <Button
                onClick={() => setShowUpload(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>
                </svg>
                Share Your First Photo
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {photos.map((photo) => (
              <div key={photo.id} className="bg-card rounded-xl overflow-hidden">
                {/* Photo Header */}
                <div className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                    <span className="text-lg">{AVATARS[photo.userAvatar]?.emoji || '🦅'}</span>
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-foreground">{photo.username}</div>
                    <div className="text-xs text-muted-foreground">{formatDate(photo.uploadedAt)}</div>
                  </div>
                </div>

                {/* Photo Image */}
                <div className="aspect-video bg-muted flex items-center justify-center overflow-hidden">
                  {photo.imageUrl ? (
                    <img
                      src={photo.imageUrl}
                      alt={photo.caption || 'Photo'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2 opacity-50">
                        <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                      </svg>
                      <span className="text-sm">Photo</span>
                    </div>
                  )}
                </div>

                {/* Caption & Actions */}
                <div className="p-4">
                  {photo.caption && <p className="text-foreground mb-3">{photo.caption}</p>}
                  <button
                    onClick={() => handleLike(photo.id)}
                    className={cn(
                      "flex items-center gap-2 transition-colors",
                      photo.hasLiked ? "text-primary" : "text-muted-foreground hover:text-primary"
                    )}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill={photo.hasLiked ? "currentColor" : "none"}
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                    </svg>
                    <span className="font-medium">{photo.likes}</span>
                  </button>
                </div>
              </div>
            ))}

            {/* Upload CTA at bottom of gallery */}
            {user && (
              <div className="bg-gradient-to-r from-primary/20 to-primary/10 rounded-xl p-6 text-center border border-primary/30">
                <h3 className="text-lg font-bold text-foreground mb-2">Your turn!</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Add your Seahawks photos to the gallery
                </p>
                <Button
                  onClick={() => setShowUpload(true)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>
                  </svg>
                  Share a Photo
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div
          className="fixed inset-0 bg-black/80 flex items-end justify-center z-50"
          onClick={resetUpload}
        >
          <div
            className="bg-card w-full max-w-lg rounded-t-3xl p-6 animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground">Share a Photo</h2>
              <button
                onClick={resetUpload}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                </svg>
              </button>
            </div>

            {/* Hidden file input - supports camera capture on mobile */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Upload Area / Preview */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "aspect-video rounded-xl mb-4 flex items-center justify-center border-2 border-dashed cursor-pointer transition-colors overflow-hidden",
                previewUrl ? "border-primary bg-card" : "border-border bg-muted hover:border-primary/50 hover:bg-muted/80"
              )}
            >
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center text-muted-foreground px-4">
                  <div className="flex justify-center gap-4 mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
                      <circle cx="12" cy="13" r="3"/>
                    </svg>
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                      <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                    </svg>
                  </div>
                  <span className="text-sm font-medium">Take a photo or choose from gallery</span>
                  <p className="text-xs mt-1 text-muted-foreground/70">JPG, PNG, WebP, GIF (max 5MB)</p>
                </div>
              )}
            </div>

            {/* Error message */}
            {uploadError && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
                {uploadError}
              </div>
            )}

            {/* Caption Input */}
            <div className="mb-6">
              <label htmlFor="caption" className="block text-sm font-medium text-foreground mb-2">
                Caption (optional)
              </label>
              <input
                id="caption"
                type="text"
                placeholder="Add a caption..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                maxLength={100}
              />
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-bold disabled:opacity-50"
            >
              {isUploading ? 'Uploading...' : 'Share Photo'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
