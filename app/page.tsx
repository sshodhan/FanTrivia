'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/lib/user-context';
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
import { BottomNav, type NavScreen } from '@/components/bottom-nav';
import { useCurrentDay } from '@/hooks/useCurrentDay';

type AppScreen = 'entry' | 'home' | 'trivia' | 'categories' | 'results' | 'scoreboard' | 'players' | 'photos' | 'settings';

interface GameResult {
  score: number;
  correctAnswers: number;
}

function AppContent() {
  const { user, todayPlayed, resetAccount } = useUser();
  const currentDay = useCurrentDay();
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('entry');
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [showNav, setShowNav] = useState(true);

  // Determine initial screen based on user registration
  useEffect(() => {
    if (user) {
      setCurrentScreen('home');
    } else {
      setCurrentScreen('entry');
    }
  }, [user]);

  // Hide nav on certain screens
  useEffect(() => {
    const hideNavScreens: AppScreen[] = ['entry', 'trivia', 'results'];
    setShowNav(!hideNavScreens.includes(currentScreen));
  }, [currentScreen]);

  const handleStartCategory = (categoryId: string) => {
    // For now, start the general trivia game
    // Future: pass categoryId to load category-specific questions
    setCurrentScreen('trivia');
  };

  const handleViewCategoryResults = (categoryId: string) => {
    // Future: navigate to category-specific results
    if (gameResult) {
      setCurrentScreen('results');
    }
  };

  const handleStartTrivia = () => {
    if (todayPlayed) return;
    setCurrentScreen('trivia');
  };

  const handleTriviaComplete = (score: number, correctAnswers: number) => {
    setGameResult({ score, correctAnswers });
    setCurrentScreen('results');
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
        />
      )}

      {currentScreen === 'trivia' && (
        <TriviaGame
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
          completedCategories={[]}
          streak={user?.current_streak ?? 0}
          onStartCategory={handleStartCategory}
          onViewResults={handleViewCategoryResults}
          onBack={() => setCurrentScreen('home')}
        />
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
