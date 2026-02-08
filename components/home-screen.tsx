'use client';

import { useUser } from '@/lib/user-context';
import { AVATARS } from '@/lib/database.types';
import { Button } from '@/components/ui/button';
import { PartyInfoToggle } from '@/components/party-info-toggle';
import { cn } from '@/lib/utils';

interface HomeScreenProps {
  onStartTrivia: () => void;
  onViewScoreboard: () => void;
  onViewPlayers: () => void;
  onViewPhotos: () => void;
  onViewParty: () => void;
  onViewSquares: () => void;
}

export function HomeScreen({
  onStartTrivia,
  onViewScoreboard,
  onViewPlayers,
  onViewPhotos,
  onViewParty,
  onViewSquares,
}: HomeScreenProps) {
  const { user, todayPlayed } = useUser();

  const getAvatarEmoji = () => {
    if (!user?.avatar) return '🦅';
    return AVATARS[user.avatar]?.emoji || '🦅';
  };

  return (
    <div className="min-h-screen flex flex-col bg-background pb-20">
      {/* Header */}
      <header className="p-6 text-center relative">
        <div className="absolute left-3 top-5">
          <PartyInfoToggle isActive={false} onToggle={onViewParty} />
        </div>
        <div className="text-5xl mb-2">🦅</div>
        <h1 className="font-[var(--font-heading)] text-3xl font-bold text-primary tracking-tight">
          HAWKTRIVIA
        </h1>
        <p className="text-secondary text-sm mt-1">Super Bowl Edition</p>
      </header>

      {/* User Info */}
      {user && (
        <div className="px-6 mb-6">
          <div className="bg-card rounded-xl p-4 flex items-center gap-4">
            <div className="w-14 h-14 bg-primary/20 rounded-full flex items-center justify-center">
              <span className="text-3xl">{getAvatarEmoji()}</span>
            </div>
            <div className="flex-1">
              <div className="font-bold text-foreground text-lg">{user.username}</div>
              <div className="text-sm text-muted-foreground">
                {todayPlayed ? "Today's trivia complete!" : 'Ready to play'}
              </div>
            </div>
            {user.current_streak > 0 && (
              <div className="text-right">
                <div className="text-xl font-bold text-primary">{user.current_streak}</div>
                <div className="text-xs text-muted-foreground">Streak</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Action */}
      <div className="px-6 mb-4">
        <Button
          onClick={onStartTrivia}
          disabled={todayPlayed}
          className={cn(
            'w-full h-20 text-xl font-bold rounded-xl transition-all',
            todayPlayed
              ? 'bg-muted text-muted-foreground'
              : 'bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98]'
          )}
        >
          {todayPlayed ? (
            <div className="flex flex-col items-center">
              <span>Come Back Tomorrow!</span>
              <span className="text-sm font-normal opacity-70">New questions at midnight</span>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-3xl">🏈</span>
              <span>START DAILY TRIVIA</span>
            </div>
          )}
        </Button>
      </div>

      {/* SB Squares Button */}
      <div className="px-6 mb-6">
        <button
          onClick={onViewSquares}
          className="w-full h-16 rounded-xl bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-400 text-gray-900 font-bold text-lg flex items-center justify-center gap-3 transition-all hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-amber-400/40 border-2 border-amber-300"
        >
          <span className="text-2xl">🏈</span>
          <span>SB SQUARES</span>
          <span className="text-sm font-normal opacity-70 ml-1">- Party Game!</span>
        </button>
      </div>

      {/* Quick Stats */}
      <div className="px-6 mb-6">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-primary">5</div>
            <div className="text-xs text-muted-foreground">Questions</div>
          </div>
          <div className="bg-card rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-primary">15s</div>
            <div className="text-xs text-muted-foreground">Per Question</div>
          </div>
          <div className="bg-card rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-primary">50+</div>
            <div className="text-xs text-muted-foreground">Players</div>
          </div>
        </div>
      </div>

      {/* Menu Grid */}
      <div className="px-6 flex-1">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Explore
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={onViewScoreboard}
            className="bg-card rounded-xl p-5 text-left transition-all hover:bg-card/80 active:scale-[0.98]"
          >
            <div className="text-3xl mb-3">🏆</div>
            <div className="font-bold text-foreground">Leaderboard</div>
            <div className="text-sm text-muted-foreground">See top teams</div>
          </button>
          
          <button
            onClick={onViewPlayers}
            className="bg-card rounded-xl p-5 text-left transition-all hover:bg-card/80 active:scale-[0.98]"
          >
            <div className="text-3xl mb-3">⭐</div>
            <div className="font-bold text-foreground">SB Heroes</div>
            <div className="text-sm text-muted-foreground">Player cards</div>
          </button>
          
          <button
            onClick={onViewPhotos}
            className="bg-card rounded-xl p-5 text-left transition-all hover:bg-card/80 active:scale-[0.98]"
          >
            <div className="text-3xl mb-3">📸</div>
            <div className="font-bold text-foreground">Photo Wall</div>
            <div className="text-sm text-muted-foreground">Fan gallery</div>
          </button>
        </div>
      </div>
    </div>
  );
}
