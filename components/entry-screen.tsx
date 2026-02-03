'use client';

import React from "react"

import { useState } from 'react';
import { useTeam } from '@/lib/team-context';
import { teamAvatars } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface EntryScreenProps {
  onStartTrivia: () => void;
}

export function EntryScreen({ onStartTrivia }: EntryScreenProps) {
  const { team, setTeam } = useTeam();
  const [teamName, setTeamName] = useState(team?.name || '');
  const [selectedAvatar, setSelectedAvatar] = useState(team?.imageUrl || teamAvatars[0].id);
  const [error, setError] = useState('');

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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
      {/* Logo/Title Section */}
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">🦅</div>
        <h1 className="font-[var(--font-heading)] text-4xl md:text-5xl font-bold text-primary tracking-tight">
          HAWKTRIVIA
        </h1>
        <p className="text-secondary mt-2 text-lg">
          Super Bowl Edition
        </p>
      </div>

      {/* Registration Form */}
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6">
        <div className="space-y-2">
          <label htmlFor="teamName" className="block text-sm font-medium text-foreground">
            Team Name
          </label>
          <Input
            id="teamName"
            type="text"
            placeholder="Enter your team name..."
            value={teamName}
            onChange={(e) => {
              setTeamName(e.target.value);
              setError('');
            }}
            className="bg-card border-border text-foreground placeholder:text-muted-foreground h-12 text-lg"
            maxLength={30}
          />
          {error && (
            <p className="text-destructive text-sm">{error}</p>
          )}
        </div>

        {/* Avatar Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">
            Choose Your Avatar
          </label>
          <div className="grid grid-cols-3 gap-3">
            {teamAvatars.map((avatar) => (
              <button
                key={avatar.id}
                type="button"
                onClick={() => setSelectedAvatar(avatar.id)}
                className={cn(
                  'flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all',
                  selectedAvatar === avatar.id
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-card hover:border-primary/50'
                )}
              >
                <span className="text-3xl mb-1">{avatar.emoji}</span>
                <span className="text-xs text-muted-foreground">{avatar.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Start Button */}
        <Button
          type="submit"
          className="w-full h-14 text-lg font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
        >
          START TRIVIA
        </Button>
      </form>

      {/* Footer Info */}
      <div className="mt-8 text-center text-muted-foreground text-sm">
        <p>5 questions daily • 15 seconds each</p>
        <p className="mt-1">Compete with fellow 12s!</p>
      </div>
    </div>
  );
}
