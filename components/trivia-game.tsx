'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTeam } from '@/lib/user-context';
import { sampleQuestions } from '@/lib/mock-data';
import type { TriviaQuestion } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface TriviaGameProps {
  onComplete: (score: number, correctAnswers: number) => void;
  onExit: () => void;
}

const SECONDS_PER_QUESTION = 15;
const QUESTIONS_PER_DAY = 5;
const POINTS_PER_CORRECT = 10;
const STREAK_BONUS = 5;

// Map letter answers to index
const answerToIndex: Record<string, number> = { a: 0, b: 1, c: 2, d: 3 };

// Transform mock data to TriviaQuestion format
function transformQuestion(q: typeof sampleQuestions[number]): TriviaQuestion {
  return {
    id: q.id,
    question: q.question_text,
    imageUrl: null,
    options: [q.option_a, q.option_b, q.option_c, q.option_d],
    correctAnswer: answerToIndex[q.correct_answer] ?? 0,
    difficulty: q.difficulty,
    category: q.category,
    explanation: q.hint_text,
  };
}

export function TriviaGame({ onComplete, onExit }: TriviaGameProps) {
  const { setTodayPlayed } = useTeam();
  const [questions] = useState<TriviaQuestion[]>(() => 
    [...sampleQuestions]
      .sort(() => Math.random() - 0.5)
      .slice(0, QUESTIONS_PER_DAY)
      .map(transformQuestion)
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(SECONDS_PER_QUESTION);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const currentQuestion = questions[currentIndex];
  const isCorrect = selectedAnswer === currentQuestion?.correctAnswer;
  const isLastQuestion = currentIndex === questions.length - 1;

  const handleTimeUp = useCallback(() => {
    if (!showResult && selectedAnswer === null) {
      setShowResult(true);
      setStreak(0);
    }
  }, [showResult, selectedAnswer]);

  useEffect(() => {
    if (showResult || isTransitioning) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showResult, isTransitioning, handleTimeUp]);

  const handleSelectAnswer = (index: number) => {
    if (showResult || selectedAnswer !== null) return;

    setSelectedAnswer(index);
    setShowResult(true);

    if (index === currentQuestion.correctAnswer) {
      const streakBonus = streak > 0 ? STREAK_BONUS * streak : 0;
      const timeBonus = Math.floor(timeRemaining / 3);
      const questionPoints = POINTS_PER_CORRECT + streakBonus + timeBonus;
      
      setScore((prev) => prev + questionPoints);
      setCorrectCount((prev) => prev + 1);
      setStreak((prev) => prev + 1);
    } else {
      setStreak(0);
    }
  };

  const handleNextQuestion = () => {
    if (isLastQuestion) {
      setTodayPlayed(true);
      onComplete(score, correctCount);
      return;
    }

    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setTimeRemaining(SECONDS_PER_QUESTION);
      setIsTransitioning(false);
    }, 300);
  };

  if (!currentQuestion) return null;

  const progressPercent = ((currentIndex + 1) / questions.length) * 100;
  const timePercent = (timeRemaining / SECONDS_PER_QUESTION) * 100;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="p-4 flex items-center justify-between border-b border-border">
        <button
          onClick={onExit}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Exit game"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
          </svg>
        </button>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Q{currentIndex + 1}/{questions.length}
          </div>
          <div className="flex items-center gap-2 bg-card px-3 py-1 rounded-full">
            <span className="text-primary font-bold">{score}</span>
            <span className="text-xs text-muted-foreground">pts</span>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="px-4 pt-2">
        <Progress value={progressPercent} className="h-1 bg-muted" />
      </div>

      {/* Timer */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-muted-foreground">Time</span>
          <span className={cn(
            'font-mono font-bold text-lg',
            timeRemaining <= 5 ? 'text-destructive' : 'text-primary'
          )}>
            {timeRemaining}s
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className={cn(
              'h-full transition-all duration-1000 ease-linear rounded-full',
              timeRemaining <= 5 ? 'bg-destructive' : 'bg-primary'
            )}
            style={{ width: `${timePercent}%` }}
          />
        </div>
      </div>

      {/* Streak Indicator */}
      {streak > 1 && (
        <div className="px-4 py-2">
          <div className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-medium inline-flex items-center gap-1">
            <span>🔥</span>
            <span>{streak} streak!</span>
          </div>
        </div>
      )}

      {/* Question */}
      <div className="flex-1 flex flex-col p-4">
        <div className="bg-card rounded-xl p-6 mb-6">
          <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">
            {currentQuestion.category} • {currentQuestion.difficulty}
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-foreground leading-tight text-balance">
            {currentQuestion.question}
          </h2>
        </div>

        {/* Answer Options */}
        <div className="space-y-3 flex-1">
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrectAnswer = index === currentQuestion.correctAnswer;
            
            let buttonStyle = 'bg-card border-border hover:border-primary/50';
            
            if (showResult) {
              if (isCorrectAnswer) {
                buttonStyle = 'bg-primary/20 border-primary text-primary';
              } else if (isSelected && !isCorrectAnswer) {
                buttonStyle = 'bg-destructive/20 border-destructive text-destructive';
              } else {
                buttonStyle = 'bg-card border-border opacity-50';
              }
            } else if (isSelected) {
              buttonStyle = 'bg-primary/10 border-primary';
            }

            return (
              <button
                key={index}
                onClick={() => handleSelectAnswer(index)}
                disabled={showResult}
                className={cn(
                  'w-full p-4 rounded-xl border-2 text-left transition-all',
                  'flex items-center gap-3',
                  buttonStyle
                )}
              >
                <span className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                  showResult && isCorrectAnswer 
                    ? 'bg-primary text-primary-foreground'
                    : showResult && isSelected && !isCorrectAnswer
                    ? 'bg-destructive text-destructive-foreground'
                    : 'bg-muted text-muted-foreground'
                )}>
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="flex-1 font-medium">{option}</span>
                {showResult && isCorrectAnswer && (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                    <path d="M20 6 9 17l-5-5"/>
                  </svg>
                )}
                {showResult && isSelected && !isCorrectAnswer && (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-destructive">
                    <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                  </svg>
                )}
              </button>
            );
          })}
        </div>

        {/* Result & Next Button */}
        {showResult && (
          <div className="mt-6 space-y-4">
            {currentQuestion.explanation && (
              <div className="bg-muted/50 rounded-xl p-4">
                <p className="text-sm text-muted-foreground">
                  {currentQuestion.explanation}
                </p>
              </div>
            )}
            <Button
              onClick={handleNextQuestion}
              className="w-full h-14 text-lg font-bold bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isLastQuestion ? 'See Results' : 'Next Question'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
