'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { User, AvatarId, GameState } from './database.types';

// Re-export GameState from types.ts for compatibility
export type { GameState } from './types';

interface UserContextType {
  user: User | null;
  setUser: (user: User) => void;
  clearUser: () => void;
  isLoading: boolean;
  // Registration helper - calls API and sets user
  registerUser: (username: string, avatar: AvatarId) => Promise<{ success: boolean; error?: string }>;
  // Sign in with user_id
  signIn: (userId: string) => Promise<{ success: boolean; error?: string }>;
  // Refresh user data from server
  refreshUser: () => Promise<{ success: boolean; error?: string }>;
  // Game state (kept for compatibility)
  gameState: GameState | null;
  setGameState: (state: GameState | null) => void;
  todayPlayed: boolean;
  setTodayPlayed: (played: boolean) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const STORAGE_KEYS = {
  user: 'hawktrivia_user',
  todayPlayed: 'hawktrivia_today_played',
  playedDate: 'hawktrivia_played_date',
} as const;

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [todayPlayed, setTodayPlayedState] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load user from localStorage on mount
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem(STORAGE_KEYS.user);
      const savedTodayPlayed = localStorage.getItem(STORAGE_KEYS.todayPlayed);
      const savedDate = localStorage.getItem(STORAGE_KEYS.playedDate);

      if (savedUser) {
        setUserState(JSON.parse(savedUser));
      }

      // Check if played today
      const today = new Date().toISOString().split('T')[0];
      if (savedDate === today && savedTodayPlayed === 'true') {
        setTodayPlayedState(true);
      } else if (savedDate !== today) {
        // Reset for new day
        localStorage.removeItem(STORAGE_KEYS.todayPlayed);
        localStorage.removeItem(STORAGE_KEYS.playedDate);
      }
    } catch (error) {
      console.error('Error loading user from localStorage:', error);
    }

    setIsLoaded(true);
  }, []);

  const setUser = useCallback((newUser: User) => {
    setUserState(newUser);
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(newUser));
  }, []);

  const clearUser = useCallback(() => {
    setUserState(null);
    localStorage.removeItem(STORAGE_KEYS.user);
    localStorage.removeItem(STORAGE_KEYS.todayPlayed);
    localStorage.removeItem(STORAGE_KEYS.playedDate);
  }, []);

  const registerUser = useCallback(async (username: string, avatar: AvatarId): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, avatar }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error codes
        if (response.status === 409) {
          return { success: false, error: data.error || 'Username already taken. Please choose another or sign in.' };
        }
        if (response.status === 400) {
          return { success: false, error: data.error || 'Invalid username or avatar.' };
        }
        return { success: false, error: data.error || 'Registration failed. Please try again.' };
      }

      // Success - set the user
      const registeredUser: User = data.user;
      setUser(registeredUser);

      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Network error. Please check your connection.' };
    } finally {
      setIsLoading(false);
    }
  }, [setUser]);

  const signIn = useCallback(async (userId: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Sign in failed. Please check your User ID.' };
      }

      // Success - set the user
      const signedInUser: User = data.user;
      setUser(signedInUser);

      return { success: true };
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: 'Network error. Please check your connection.' };
    } finally {
      setIsLoading(false);
    }
  }, [setUser]);

  const setTodayPlayed = useCallback((played: boolean) => {
    setTodayPlayedState(played);
    if (played) {
      const today = new Date().toISOString().split('T')[0];
      localStorage.setItem(STORAGE_KEYS.todayPlayed, 'true');
      localStorage.setItem(STORAGE_KEYS.playedDate, today);
    }
  }, []);

  const refreshUser = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!user?.user_id) {
      return { success: false, error: 'No user logged in' };
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/user?user_id=${encodeURIComponent(user.user_id)}`);
      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to refresh user data' };
      }

      if (data.user) {
        setUser(data.user);
        return { success: true };
      }

      return { success: false, error: 'User not found' };
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  }, [user?.user_id, setUser]);

  // Don't render until loaded to prevent hydration mismatch
  if (!isLoaded) {
    return null;
  }

  return (
    <UserContext.Provider value={{
      user,
      setUser,
      clearUser,
      isLoading,
      registerUser,
      signIn,
      refreshUser,
      gameState,
      setGameState,
      todayPlayed,
      setTodayPlayed
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

// Compatibility hook - maps useUser to useTeam interface for gradual migration
export function useTeam() {
  const { user, setUser, clearUser, gameState, setGameState, todayPlayed, setTodayPlayed } = useUser();

  // Map User to Team-like interface for backward compatibility
  const team = user ? {
    id: user.username,
    name: user.username,
    imageUrl: null, // User uses avatar instead
  } : null;

  const setTeam = (newTeam: { id: string; name: string; imageUrl: string | null }) => {
    // This is a compatibility shim - in the new flow, use registerUser instead
    console.warn('setTeam is deprecated. Use registerUser instead.');
  };

  return {
    team,
    setTeam,
    clearTeam: clearUser,
    gameState,
    setGameState,
    todayPlayed,
    setTodayPlayed,
  };
}
