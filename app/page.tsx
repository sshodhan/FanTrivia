'use client';

import { useState, useEffect } from 'react';
import { TeamProvider, useTeam } from '@/lib/team-context';
import { EntryScreen } from '@/components/entry-screen';
import { HomeScreen } from '@/components/home-screen';
import { TriviaGame } from '@/components/trivia-game';
import { ResultsScreen } from '@/components/results-screen';
import { Scoreboard } from '@/components/scoreboard';
import { PlayerCards } from '@/components/player-cards';
import { PhotoWall } from '@/components/photo-wall';
import { AdminConsole } from '@/components/admin-console';
import { BottomNav, type NavScreen } from '@/components/bottom-nav';

type AppScreen = 'entry' | 'home' | 'trivia' | 'results' | 'scoreboard' | 'players' | 'photos' | 'admin';

interface GameResult {
  score: number;
  correctAnswers: number;
}

function AppContent() {
  const { team, todayPlayed } = useTeam();
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('entry');
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [showNav, setShowNav] = useState(true);

  // Determine initial screen based on team registration
  useEffect(() => {
    if (team) {
      setCurrentScreen('home');
    } else {
      setCurrentScreen('entry');
    }
  }, [team]);

  // Hide nav on certain screens
  useEffect(() => {
    const hideNavScreens: AppScreen[] = ['entry', 'trivia', 'results'];
    setShowNav(!hideNavScreens.includes(currentScreen));
  }, [currentScreen]);

  const handleStartTrivia = () => {
    if (todayPlayed) return;
    setCurrentScreen('trivia');
  };

  const handleTriviaComplete = (score: number, correctAnswers: number) => {
    setGameResult({ score, correctAnswers });
    setCurrentScreen('results');
  };

  const handleNavigation = (screen: NavScreen) => {
    setCurrentScreen(screen as AppScreen);
  };

  // Map NavScreen to currentScreen for bottom nav
  const getNavScreen = (): NavScreen => {
    if (['entry', 'trivia', 'results'].includes(currentScreen)) return 'home';
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

      {currentScreen === 'admin' && (
        <AdminConsole onBack={() => setCurrentScreen('home')} />
      )}

      {showNav && (
        <BottomNav
          currentScreen={getNavScreen()}
          onNavigate={handleNavigation}
          showAdmin={true}
        />
      )}
    </main>
  );
}

export default function Home() {
  return (
    <TeamProvider>
      <AppContent />
    </TeamProvider>
  );
}
