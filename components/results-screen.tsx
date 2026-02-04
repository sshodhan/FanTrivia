'use client';

import { useUser } from '@/lib/user-context';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ResultsScreenProps {
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  onViewScoreboard: () => void;
  onGoHome: () => void;
}

export function ResultsScreen({
  score,
  correctAnswers,
  totalQuestions,
  onViewScoreboard,
  onGoHome
}: ResultsScreenProps) {
  const { user } = useUser();
  const percentage = Math.round((correctAnswers / totalQuestions) * 100);
  
  const getMessage = () => {
    if (percentage === 100) return { text: 'PERFECT!', emoji: '🏆' };
    if (percentage >= 80) return { text: 'EXCELLENT!', emoji: '🌟' };
    if (percentage >= 60) return { text: 'GREAT JOB!', emoji: '👏' };
    if (percentage >= 40) return { text: 'NICE TRY!', emoji: '💪' };
    return { text: 'KEEP PRACTICING!', emoji: '📚' };
  };

  const message = getMessage();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
      {/* Result Animation */}
      <div className="text-center mb-8 animate-in fade-in zoom-in duration-500">
        <div className="text-7xl mb-4">{message.emoji}</div>
        <h1 className="font-[var(--font-heading)] text-4xl md:text-5xl font-bold text-primary tracking-tight">
          {message.text}
        </h1>
        {user && (
          <p className="text-secondary mt-2 text-lg">
            {user.username}
          </p>
        )}
      </div>

      {/* Score Card */}
      <div className="w-full max-w-sm bg-card rounded-2xl p-6 mb-8">
        {/* Main Score */}
        <div className="text-center mb-6">
          <div className="text-6xl font-bold text-primary mb-1">{score}</div>
          <div className="text-muted-foreground">points earned</div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-muted/50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-foreground">
              {correctAnswers}/{totalQuestions}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Correct</div>
          </div>
          <div className="bg-muted/50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-foreground">
              {percentage}%
            </div>
            <div className="text-xs text-muted-foreground mt-1">Accuracy</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progress</span>
            <span className="text-primary font-medium">{percentage}%</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div 
              className={cn(
                'h-full rounded-full transition-all duration-1000',
                percentage >= 80 ? 'bg-primary' : percentage >= 50 ? 'bg-secondary' : 'bg-muted-foreground'
              )}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="w-full max-w-sm space-y-3">
        <Button
          onClick={onViewScoreboard}
          className="w-full h-14 text-lg font-bold bg-primary text-primary-foreground hover:bg-primary/90"
        >
          View Leaderboard
        </Button>
        <Button
          onClick={onGoHome}
          variant="outline"
          className="w-full h-14 text-lg font-medium border-border text-foreground hover:bg-card bg-transparent"
        >
          Back to Home
        </Button>
      </div>

      {/* Next Trivia Info */}
      <div className="mt-8 text-center text-muted-foreground text-sm">
        <p>Come back tomorrow for more trivia!</p>
        <p className="mt-1 text-primary">New questions unlock at midnight</p>
      </div>
    </div>
  );
}
