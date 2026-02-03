'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Team, GameState } from './types';

interface TeamContextType {
  team: Team | null;
  setTeam: (team: Team) => void;
  clearTeam: () => void;
  gameState: GameState | null;
  setGameState: (state: GameState | null) => void;
  todayPlayed: boolean;
  setTodayPlayed: (played: boolean) => void;
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

export function TeamProvider({ children }: { children: ReactNode }) {
  const [team, setTeamState] = useState<Team | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [todayPlayed, setTodayPlayedState] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load team from localStorage on mount
    const savedTeam = localStorage.getItem('hawktrivia_team');
    const savedTodayPlayed = localStorage.getItem('hawktrivia_today_played');
    const savedDate = localStorage.getItem('hawktrivia_played_date');
    
    if (savedTeam) {
      setTeamState(JSON.parse(savedTeam));
    }
    
    // Check if played today
    const today = new Date().toISOString().split('T')[0];
    if (savedDate === today && savedTodayPlayed === 'true') {
      setTodayPlayedState(true);
    } else if (savedDate !== today) {
      // Reset for new day
      localStorage.removeItem('hawktrivia_today_played');
      localStorage.removeItem('hawktrivia_played_date');
    }
    
    setIsLoaded(true);
  }, []);

  const setTeam = (newTeam: Team) => {
    setTeamState(newTeam);
    localStorage.setItem('hawktrivia_team', JSON.stringify(newTeam));
  };

  const clearTeam = () => {
    setTeamState(null);
    localStorage.removeItem('hawktrivia_team');
  };

  const setTodayPlayed = (played: boolean) => {
    setTodayPlayedState(played);
    if (played) {
      const today = new Date().toISOString().split('T')[0];
      localStorage.setItem('hawktrivia_today_played', 'true');
      localStorage.setItem('hawktrivia_played_date', today);
    }
  };

  if (!isLoaded) {
    return null;
  }

  return (
    <TeamContext.Provider value={{ 
      team, 
      setTeam, 
      clearTeam, 
      gameState, 
      setGameState,
      todayPlayed,
      setTodayPlayed
    }}>
      {children}
    </TeamContext.Provider>
  );
}

export function useTeam() {
  const context = useContext(TeamContext);
  if (context === undefined) {
    throw new Error('useTeam must be used within a TeamProvider');
  }
  return context;
}
