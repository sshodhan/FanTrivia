'use client';

import React from "react"

import { useState, useRef } from 'react';
import { useTeam } from '@/lib/team-context';
import { teamAvatars, suggestedTeamNames } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface EntryScreenProps {
  onStartTrivia: () => void;
}

export function EntryScreen({ onStartTrivia }: EntryScreenProps) {
  const { team, setTeam } = useTeam();
  const [teamName, setTeamName] = useState(team?.name || '');
  const [selectedAvatar, setSelectedAvatar] = useState(team?.imageUrl || teamAvatars[0].id);
  const [error, setError] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!teamName.trim()) {
      setError('Please enter a team name');
      return;
    }
    
    if (teamName.trim().length < 2) {
      setError('Team name must be at least 2 characters');
      return;
    }

    const newTeam = {
      id: team?.id || `team_${Date.now()}`,
      name: teamName.trim(),
      imageUrl: selectedAvatar,
      createdAt: team?.createdAt || new Date().toISOString(),
    };
    
    setTeam(newTeam);
    onStartTrivia();
  };

  const handleSuggestionClick = (name: string) => {
    setTeamName(name);
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
        {/* Team Name Section */}
        <div className="space-y-2">
          <label htmlFor="teamName" className="block text-sm font-semibold text-foreground">
            Team Name
          </label>
          
          {/* Suggested Names - Horizontal Scroll */}
          <div 
            ref={scrollRef}
            className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1"
          >
            {suggestedTeamNames.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => handleSuggestionClick(name)}
                className={cn(
                  'flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all border',
                  teamName === name
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
            id="teamName"
            type="text"
            placeholder="Enter your team name..."
            value={teamName}
            onChange={(e) => {
              setTeamName(e.target.value);
              setError('');
            }}
            className="bg-card border-border text-foreground placeholder:text-muted-foreground h-12 text-base"
            maxLength={30}
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
          className="w-full h-12 text-lg font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all rounded-xl"
        >
          START TRIVIA
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
