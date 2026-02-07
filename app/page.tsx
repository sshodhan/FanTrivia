'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import useSWR from 'swr';
import { useUser } from '@/lib/user-context';
import type { Category, CategoryProgress } from '@/lib/category-types';
import { ALL_CATEGORIES } from '@/lib/category-data';
import { logClientDebug, logClientError } from '@/lib/error-tracking/client-logger';
import { EntryScreen } from '@/components/entry-screen';
import { HomeScreen } from '@/components/home-screen';
import { TriviaGame } from '@/components/trivia-game';
import { ResultsScreen } from '@/components/results-screen';
import { Scoreboard } from '@/components/scoreboard';
import { PlayerCards } from '@/components/player-cards';
import { PhotoWall } from '@/components/photo-wall';
import { SettingsScreen } from '@/components/settings-screen';
import { DailyCategoriesScreen } from '@/components/daily-categories';
import { PartyPlanScreen } from '@/components/party-plan-screen';
import { BottomNav, type NavScreen } from '@/components/bottom-nav';
import { dayIdentifierToNumber } from '@/lib/category-data';

type AppScreen = 'entry' | 'home' | 'trivia' | 'categories' | 'results' | 'scoreboard' | 'players' | 'photos' | 'party' | 'settings';
const fetcher = (url: string) => fetch(url).then(res => res.json());

type AppScreen = 'entry' | 'home' | 'trivia' | 'categories' | 'results' | 'scoreboard' | 'players' | 'photos' | 'settings';

interface GameResult {
  score: number;
  correctAnswers: number;
}

function AppContent() {
  const { user, todayPlayed, resetAccount, refreshUser } = useUser();
  const [currentDay, setCurrentDay] = useState(1);
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('entry');

  // Fetch real category progress from DB
  const { data: progressData, mutate: mutateProgress } = useSWR(
    user?.username ? `/api/trivia/daily/progress?username=${encodeURIComponent(user.username)}` : null,
    fetcher
  );
  const completedCategories: CategoryProgress[] = progressData?.progress ?? [];
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [showNav, setShowNav] = useState(true);
  const hasInitializedScreen = useRef(false);

  // Determine initial screen based on user registration (runs only on login/logout, not on data refresh)
  useEffect(() => {
    const isLoggedIn = !!user;
    const wasLoggedIn = hasInitializedScreen.current;

    console.log("[v0] useEffect[user] fired", { isLoggedIn, wasLoggedIn, username: user?.username, currentScreen });

    if (!wasLoggedIn && isLoggedIn) {
      // First time user is available (login or page load with existing session)
      hasInitializedScreen.current = true;
      console.log("[v0] Setting screen to HOME (initial login)");
      setCurrentScreen('home');
    } else if (wasLoggedIn && !isLoggedIn) {
      // User logged out or account reset
      hasInitializedScreen.current = false;
      console.log("[v0] Setting screen to ENTRY (logged out)");
      setCurrentScreen('entry');
    } else {
      console.log("[v0] SKIPPING screen override (data refresh, wasLoggedIn && isLoggedIn)");
    }
  }, [user]);

  // Fetch current game day from existing trivia API
  useEffect(() => {
    let isMounted = true;

    fetch('/api/trivia/daily')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (isMounted && data?.day_identifier) {
          setCurrentDay(dayIdentifierToNumber(data.day_identifier));
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  // Hide nav on certain screens + log screen transitions for debugging
  useEffect(() => {
    const hideNavScreens: AppScreen[] = ['entry', 'trivia', 'results', 'party'];
    setShowNav(!hideNavScreens.includes(currentScreen));
    console.log("[v0] SCREEN CHANGED to:", currentScreen);
  }, [currentScreen]);

  const handleStartCategory = useCallback((categoryId: string) => {
    const category = ALL_CATEGORIES.find(c => c.id === categoryId) || null;
    console.log("[v0] handleStartCategory called", { categoryId, dbCategory: category?.dbCategory, found: !!category });
    setSelectedCategory(category);
    setCurrentScreen('trivia');
    console.log("[v0] setCurrentScreen('trivia') called from handleStartCategory");
  }, []);

  const handleViewCategoryResults = (categoryId: string) => {
    // Future: navigate to category-specific results
    if (gameResult) {
      setCurrentScreen('results');
    }
  };

  const handleRetakeCategory = useCallback(async (categoryId: string) => {
    if (!user?.username) return;

    const category = ALL_CATEGORIES.find(c => c.id === categoryId);

    logClientDebug('AppContent', 'Category retake initiated', {
      categoryId,
      categoryTitle: category?.title,
      dbCategory: category?.dbCategory,
      username: user.username,
    }, { force: true });

    try {
      const response = await fetch('/api/trivia/daily/reset-category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.username,
          category_id: categoryId,
        }),
      });

      if (response.ok) {
        const result = await response.json();

        console.log("[v0] retake: about to mutateProgress");
        // Refresh progress data so the card goes back to "unlocked"
        await mutateProgress();
        console.log("[v0] retake: mutateProgress done, about to refreshUser");
        // Refresh user data so header points/streak are updated
        await refreshUser();
        console.log("[v0] retake: refreshUser done, hasInitializedScreen =", hasInitializedScreen.current);

        logClientDebug('AppContent', 'Category retake reset successful', {
          categoryId,
          categoryTitle: category?.title,
          username: user.username,
          deleted: result.deleted,
          points_deducted: result.points_deducted,
          new_total_points: result.new_total_points,
        }, { force: true });

        // Automatically open the trivia game for this category
        console.log("[v0] retake: about to call handleStartCategory", categoryId);
        handleStartCategory(categoryId);
        console.log("[v0] retake: handleStartCategory returned");
      } else {
        const result = await response.json();
        logClientError(
          `Category retake failed: ${result.error}`,
          'Category Retake Soft Error',
          { categoryId, categoryTitle: category?.title, status: response.status, username: user.username }
        );
      }
    } catch (error) {
      logClientError(
        error instanceof Error ? error : new Error(String(error)),
        'Category Retake Soft Error',
        { categoryId, categoryTitle: category?.title, username: user.username }
      );
    }
  }, [user?.username, mutateProgress, refreshUser, handleStartCategory]);

  const handleStartTrivia = () => {
    if (todayPlayed) return;
    setCurrentScreen('trivia');
  };

  const handleTriviaComplete = (score: number, correctAnswers: number) => {
    setGameResult({ score, correctAnswers });
    setCurrentScreen('results');
    // Refresh category progress after completing a trivia session
    mutateProgress();
  };

  const handleNavigation = (screen: NavScreen) => {
    if (screen === 'trivia') {
      setCurrentScreen('categories');
    } else {
      setCurrentScreen(screen as AppScreen);
    }
  };

  const [isResetting, setIsResetting] = useState(false);

  const handleResetFlow = async () => {
    logClientDebug('AppContent', 'handleResetFlow: user initiated reset', {
      user_id: user?.user_id || 'none',
      username: user?.username || 'none',
      current_screen: currentScreen,
    }, { force: true });

    setIsResetting(true);
    const result = await resetAccount();
    setIsResetting(false);

    if (result.success) {
      logClientDebug('AppContent', 'handleResetFlow: reset succeeded, navigating to entry', {
        user_id: user?.user_id || 'already_cleared',
      }, { force: true });
      setCurrentScreen('entry');
    } else {
      logClientError(
        `handleResetFlow: reset failed but navigating to entry anyway: ${result.error}`,
        'Account Reset Flow Soft Error',
        { user_id: user?.user_id || 'already_cleared', error: result.error }
      );
      // Still navigate to entry even on error -- local state is cleared
      setCurrentScreen('entry');
    }
  };

  // Map NavScreen to currentScreen for bottom nav
  const getNavScreen = (): NavScreen => {
    if (['entry', 'trivia', 'results'].includes(currentScreen)) return 'home';
    if (currentScreen === 'categories') return 'trivia';
    if (currentScreen === 'settings') return 'settings';
    return currentScreen as NavScreen;
  };

  return (
    <main className="min-h-screen bg-background">
      {currentScreen === 'entry' && (
        <EntryScreen onStartTrivia={() => setCurrentScreen('home')} />
      )}

      {currentScreen === 'home' && (
        <HomeScreen
          onStartTrivia={handleStartTrivia}
          onViewScoreboard={() => setCurrentScreen('scoreboard')}
          onViewPlayers={() => setCurrentScreen('players')}
          onViewPhotos={() => setCurrentScreen('photos')}
          onViewParty={() => setCurrentScreen('party')}
        />
      )}

      {currentScreen === 'trivia' && (
        <TriviaGame
          categoryId={selectedCategory?.id}
          dbCategory={selectedCategory?.dbCategory}
          onComplete={handleTriviaComplete}
          onExit={() => setCurrentScreen('home')}
        />
      )}

      {currentScreen === 'results' && gameResult && (
        <ResultsScreen
          score={gameResult.score}
          correctAnswers={gameResult.correctAnswers}
          totalQuestions={5}
          onViewScoreboard={() => setCurrentScreen('scoreboard')}
          onGoHome={() => setCurrentScreen('home')}
        />
      )}

      {currentScreen === 'scoreboard' && (
        <Scoreboard
          onBack={() => setCurrentScreen('home')}
          userScore={gameResult || undefined}
        />
      )}

      {currentScreen === 'players' && (
        <PlayerCards onBack={() => setCurrentScreen('home')} />
      )}

      {currentScreen === 'photos' && (
        <PhotoWall onBack={() => setCurrentScreen('home')} />
      )}

      {currentScreen === 'categories' && (
        <DailyCategoriesScreen
          currentDay={currentDay}
          completedCategories={completedCategories}
          streak={user?.current_streak ?? 0}
          onStartCategory={handleStartCategory}
          onViewResults={handleViewCategoryResults}
          onRetakeCategory={handleRetakeCategory}
          onBack={() => setCurrentScreen('home')}
        />
      )}

      {currentScreen === 'party' && (
        <PartyPlanScreen onBack={() => setCurrentScreen('home')} onViewScoreboard={() => setCurrentScreen('scoreboard')} />
      )}

      {currentScreen === 'settings' && (
        <SettingsScreen 
          onBack={() => setCurrentScreen('home')} 
          onResetFlow={handleResetFlow}
          isResetting={isResetting}
        />
      )}

      {showNav && (
        <BottomNav
          currentScreen={getNavScreen()}
          onNavigate={handleNavigation}
        />
      )}
    </main>
  );
}

export default function Home() {
  return <AppContent />;
}
