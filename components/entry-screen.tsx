'use client';

import React from "react"

import { useState, useRef } from 'react';
import { useUser } from '@/lib/user-context';
import { teamAvatars, suggestedTeamNames } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Check, Loader2 } from 'lucide-react';
import type { AvatarId } from '@/lib/database.types';

interface EntryScreenProps {
  onStartTrivia: () => void;
}

export function EntryScreen({ onStartTrivia }: EntryScreenProps) {
  const { user, registerUser, isLoading } = useUser();
  const [username, setUsername] = useState(user?.username || '');
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarId>(user?.avatar || teamAvatars[0].id);
  const [error, setError] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Mouse drag handlers for horizontal scroll
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  // Convert vertical wheel to horizontal scroll
  const handleWheel = (e: React.WheelEvent) => {
    if (!scrollRef.current) return;
    e.preventDefault();
    scrollRef.current.scrollLeft += e.deltaY;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedUsername = username.trim();

    if (!trimmedUsername) {
      setError('Please enter a username');
      return;
    }

    if (trimmedUsername.length < 2) {
      setError('Username must be at least 2 characters');
      return;
    }

    if (trimmedUsername.length > 30) {
      setError('Username must be 30 characters or less');
      return;
    }

    // Call the API to register
    const result = await registerUser(trimmedUsername, selectedAvatar);

    if (result.success) {
      onStartTrivia();
    } else {
      setError(result.error || 'Registration failed');
    }
  };

  const handleSuggestionClick = (name: string) => {
    setUsername(name);
    setError('');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start py-4 px-4 bg-background safe-top safe-bottom relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-8 left-4 text-6xl opacity-10 pointer-events-none">🦅</div>
      <div className="absolute bottom-32 right-8 text-4xl opacity-10 pointer-events-none rotate-12">⚡</div>
      
      {/* Logo/Title Section */}
      <div className="text-center mb-4">
        <div className="text-4xl mb-2">🦅</div>
        <h1 className="font-[var(--font-heading)] text-3xl font-bold text-primary tracking-tight">
          HAWKTRIVIA
        </h1>
        <p className="text-secondary mt-1 text-sm">
          Super Bowl Edition
        </p>
      </div>

      {/* Registration Form */}
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
        {/* Username Section */}
        <div className="space-y-2">
          <label htmlFor="username" className="block text-sm font-semibold text-foreground">
            Username
          </label>

          {/* Suggested Names - Horizontal Scroll */}
          <div
            ref={scrollRef}
            className={cn(
              "flex gap-2 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1",
              isDragging ? "cursor-grabbing" : "cursor-grab"
            )}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onWheel={handleWheel}
          >
            {suggestedTeamNames.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => handleSuggestionClick(name)}
                className={cn(
                  'flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all border',
                  username === name
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-foreground border-border hover:border-primary/50'
                )}
              >
                {name}
              </button>
            ))}
          </div>

          <p className="text-xs text-muted-foreground">Or enter your own:</p>
          <Input
            id="username"
            type="text"
            placeholder="Enter your username..."
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setError('');
            }}
            className="bg-card border-border text-foreground placeholder:text-muted-foreground h-12 text-base"
            maxLength={30}
            disabled={isLoading}
          />
          {error && (
            <p className="text-destructive text-sm">{error}</p>
          )}
        </div>

        {/* Avatar Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-foreground">
            Choose Your Avatar
          </label>
          <div className="grid grid-cols-4 gap-2">
            {teamAvatars.map((avatar) => (
              <button
                key={avatar.id}
                type="button"
                onClick={() => setSelectedAvatar(avatar.id)}
                className={cn(
                  'relative flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all',
                  selectedAvatar === avatar.id
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-card hover:border-primary/50'
                )}
              >
                {/* Checkmark badge */}
                {selectedAvatar === avatar.id && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </div>
                )}
                <span className="text-2xl">{avatar.emoji}</span>
                <span className="text-[10px] text-muted-foreground mt-0.5">{avatar.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Start Button */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 text-lg font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all rounded-xl disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              REGISTERING...
            </>
          ) : (
            'START TRIVIA'
          )}
        </Button>
      </form>

      {/* Footer Info */}
      <div className="mt-4 text-center text-muted-foreground text-xs">
        <p>5 questions daily • 15 seconds each</p>
        <p className="mt-1">Compete with fellow 12s!</p>
      </div>
    </div>
  );
}
