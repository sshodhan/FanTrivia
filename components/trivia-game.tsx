'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import useSWR from 'swr';
import { useUser } from '@/lib/user-context';
import { sampleQuestions } from '@/lib/mock-data';
import type { TriviaQuestionPublic, AnswerResult, AnswerOption } from '@/lib/database.types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';
import { logClientError, logClientDebug } from '@/lib/error-tracking/client-logger';

interface TriviaGameProps {
  onComplete: (score: number, correctAnswers: number) => void;
  onExit: () => void;
}

const SECONDS_PER_QUESTION = 15;

// Index to letter mapping
const indexToLetter: AnswerOption[] = ['a', 'b', 'c', 'd'];

// Fetcher for SWR
const fetcher = (url: string) => fetch(url).then(res => res.json());

// Display question format
interface DisplayQuestion {
  id: string;
  question: string;
  imageUrl: string | null;
  options: string[];
  difficulty: string;
  category: string;
  hint: string | null;
}

// Transform API question to display format
function transformApiQuestion(q: TriviaQuestionPublic): DisplayQuestion {
  return {
    id: q.id,
    question: q.question_text,
    imageUrl: q.image_url,
    options: [q.option_a, q.option_b, q.option_c, q.option_d],
    difficulty: q.difficulty,
    category: q.category || 'General',
    hint: q.hint_text,
  };
}

// Transform mock question for fallback
function transformMockQuestion(q: typeof sampleQuestions[number]): DisplayQuestion {
  return {
    id: q.id,
    question: q.question_text,
    imageUrl: null,
    options: [q.option_a, q.option_b, q.option_c, q.option_d],
    difficulty: q.difficulty,
    category: q.category,
    hint: q.hint_text,
  };
}

export function TriviaGame({ onComplete, onExit }: TriviaGameProps) {
  const { user, setTodayPlayed, refreshUser } = useUser();

  // Fetch questions from API
  const { data: apiData, error: apiError, isLoading: isLoadingQuestions } = useSWR(
    '/api/trivia/daily',
    fetcher
  );

  // Questions state
  const [questions, setQuestions] = useState<DisplayQuestion[]>([]);
  const [questionsReady, setQuestionsReady] = useState(false);

  // Game state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(SECONDS_PER_QUESTION);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // API result state
  const [lastResult, setLastResult] = useState<AnswerResult | null>(null);
  const [correctAnswerIndex, setCorrectAnswerIndex] = useState<number | null>(null);

  // Track start time for answer submission
  const questionStartTime = useRef<number>(Date.now());

  // Load questions from API or fallback
  useEffect(() => {
    if (apiData?.questions && apiData.questions.length > 0) {
      const alreadyAnswered = new Set(apiData.already_answered_ids || []);
      const availableQuestions = apiData.questions
        .filter((q: TriviaQuestionPublic) => !alreadyAnswered.has(q.id))
        .map(transformApiQuestion);

      logClientDebug('TriviaGame', 'Questions loaded from API', {
        data_source: apiData.data_source || 'unknown',
        total_from_api: apiData.questions.length,
        already_answered: apiData.already_answered_ids?.length || 0,
        available: availableQuestions.length,
        day_identifier: apiData.day_identifier,
        questions: availableQuestions.map((q: DisplayQuestion) => ({
          id: q.id,
          question: q.question.substring(0, 60),
          options: q.options,
          category: q.category,
        })),
      }, { force: true });

      if (availableQuestions.length > 0) {
        setQuestions(availableQuestions);
      } else {
        // All questions answered, use mock for demo
        const mockQuestions = [...sampleQuestions]
          .sort(() => Math.random() - 0.5)
          .slice(0, 5)
          .map(transformMockQuestion);
        setQuestions(mockQuestions);
      }
      setQuestionsReady(true);
    } else if (apiError || (apiData && (!apiData.questions || apiData.questions.length === 0))) {
      // Fallback to mock questions
      logClientDebug('TriviaGame', 'FALLING BACK TO CLIENT MOCK DATA', {
        reason: apiError ? 'api_error' : 'empty_api_response',
        api_error: apiError?.message || null,
        api_data: apiData ? { questions_count: apiData.questions?.length, data_source: apiData.data_source } : null,
      }, { force: true, level: 'warn' });

      const mockQuestions = [...sampleQuestions]
        .sort(() => Math.random() - 0.5)
        .slice(0, 5)
        .map(transformMockQuestion);
      setQuestions(mockQuestions);
      setQuestionsReady(true);
    }
  }, [apiData, apiError]);

  // Reset start time when moving to next question
  useEffect(() => {
    questionStartTime.current = Date.now();
  }, [currentIndex]);

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

  const handleTimeUp = useCallback(() => {
    if (!showResult && selectedAnswer === null && !isSubmitting) {
      // Time's up - submit with no answer
      handleSelectAnswer(-1);
    }
  }, [showResult, selectedAnswer, isSubmitting]);

  // Timer effect
  useEffect(() => {
    if (showResult || isTransitioning || !questionsReady || isSubmitting) return;

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
  }, [showResult, isTransitioning, questionsReady, isSubmitting, handleTimeUp]);

  const handleSelectAnswer = async (index: number) => {
    if (showResult || selectedAnswer !== null || isSubmitting) return;

    setSelectedAnswer(index);
    setIsSubmitting(true);

    const timeTakenMs = Date.now() - questionStartTime.current;
    const answerLetter = index >= 0 ? indexToLetter[index] : 'a'; // Default if time up

    logClientDebug('TriviaGame', 'Answer selected', {
      question_id: currentQuestion.id,
      question_text: currentQuestion.question,
      selected_index: index,
      selected_letter: answerLetter,
      selected_option_text: index >= 0 ? currentQuestion.options[index] : 'TIME_UP',
      all_options: currentQuestion.options,
      index_to_letter_mapping: indexToLetter,
      time_taken_ms: timeTakenMs,
    }, { force: true });

    try {
      // Submit answer to API
      const response = await fetch('/api/trivia/daily/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user?.username || 'anonymous',
          question_id: currentQuestion.id,
          selected_answer: answerLetter,
          time_taken_ms: timeTakenMs,
        }),
      });

      const result: AnswerResult = await response.json();

      if (response.ok) {
        const correctIdx = indexToLetter.indexOf(result.correct_answer);

        logClientDebug('TriviaGame', 'Answer result received', {
          question_id: currentQuestion.id,
          question_text: currentQuestion.question,
          api_is_correct: result.is_correct,
          api_correct_answer_letter: result.correct_answer,
          api_correct_answer_index: correctIdx,
          api_correct_answer_text: correctIdx >= 0 ? currentQuestion.options[correctIdx] : 'INVALID_INDEX',
          user_selected_index: index,
          user_selected_letter: answerLetter,
          user_selected_text: index >= 0 ? currentQuestion.options[index] : 'TIME_UP',
          all_options: currentQuestion.options,
          points_earned: result.points_earned,
          indexToLetter_array: indexToLetter,
        }, { force: true });

        setLastResult(result);
        setCorrectAnswerIndex(correctIdx);

        if (result.is_correct) {
          setScore((prev) => prev + result.points_earned + result.streak_bonus);
          setCorrectCount((prev) => prev + 1);
          setStreak(result.current_streak);
        } else {
          setStreak(0);
        }
      } else {
        // API error - don't highlight any answer as correct since we don't know
        logClientError(
          `Answer submission failed: ${JSON.stringify(result)}`,
          'TriviaGame API Error',
          { question_id: currentQuestion.id, status: response.status, result }
        );
        setCorrectAnswerIndex(-1);
        setStreak(0);
      }
    } catch (error) {
      logClientError(
        error instanceof Error ? error : new Error(String(error)),
        'TriviaGame Network Error',
        { question_id: currentQuestion.id }
      );
      // Fallback for network errors - don't highlight any answer as correct
      setCorrectAnswerIndex(-1);
      setStreak(0);
    } finally {
      setIsSubmitting(false);
      setShowResult(true);
    }
  };

  const handleNextQuestion = async () => {
    if (isLastQuestion) {
      setTodayPlayed(true);
      // Refresh user data to get updated points
      await refreshUser();
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
      setLastResult(null);
      setCorrectAnswerIndex(null);
    }, 300);
  };

  // Loading state
  if (isLoadingQuestions || !questionsReady) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading questions...</p>
      </div>
    );
  }

  if (!currentQuestion || questions.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-xl font-bold text-foreground mb-2">All Done!</h2>
        <p className="text-muted-foreground text-center mb-6">
          You've answered all available questions for today.
        </p>
        <Button onClick={onExit}>Go Home</Button>
      </div>
    );
  }

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
            const isCorrectAnswer = correctAnswerIndex === index;

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
                disabled={showResult || isSubmitting}
                className={cn(
                  'w-full p-4 rounded-xl border-2 text-left transition-all',
                  'flex items-center gap-3',
                  buttonStyle,
                  isSubmitting && 'opacity-50 cursor-wait'
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

        {/* Submitting indicator */}
        {isSubmitting && (
          <div className="mt-4 flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Checking answer...</span>
          </div>
        )}

        {/* Result & Next Button */}
        {showResult && !isSubmitting && (
          <div className="mt-6 space-y-4">
            {/* Points earned */}
            {lastResult && (
              <div className={cn(
                'rounded-xl p-4 text-center',
                lastResult.is_correct ? 'bg-primary/20' : 'bg-destructive/20'
              )}>
                <p className={cn(
                  'font-bold text-lg',
                  lastResult.is_correct ? 'text-primary' : 'text-destructive'
                )}>
                  {lastResult.is_correct ? 'Correct!' : 'Incorrect'}
                </p>
                {lastResult.is_correct && (
                  <p className="text-sm text-muted-foreground">
                    +{lastResult.points_earned} pts
                    {lastResult.streak_bonus > 0 && ` (+${lastResult.streak_bonus} streak bonus)`}
                  </p>
                )}
              </div>
            )}

            {/* Hint */}
            {currentQuestion.hint && (
              <div className="bg-muted/50 rounded-xl p-4">
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold">Hint:</span> {currentQuestion.hint}
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
