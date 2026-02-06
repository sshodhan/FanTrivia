'use client';

import { useState, useEffect, useCallback } from 'react';
import { sampleQuestions, sampleLeaderboard } from '@/lib/mock-data';
import { AVATARS, type AvatarId } from '@/lib/database.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';

interface AdminConsoleProps {
  onBack: () => void;
  onResetFlow?: () => void;
}

type AdminTab = 'questions' | 'scores' | 'photos' | 'day-control' | 'settings' | 'logs';

type DayIdentifier = 'day_minus_4' | 'day_minus_3' | 'day_minus_2' | 'day_minus_1' | 'game_day';

interface GameSettings {
  id: number;
  current_mode: string;
  current_day: DayIdentifier;
  questions_per_day: number;
  timer_duration: number;
  scores_locked: boolean;
  live_question_index: number;
  is_paused: boolean;
  updated_at: string;
}

const DAY_OPTIONS: { value: DayIdentifier; label: string; description: string }[] = [
  { value: 'day_minus_4', label: 'Day -4', description: '4 days before game' },
  { value: 'day_minus_3', label: 'Day -3', description: '3 days before game' },
  { value: 'day_minus_2', label: 'Day -2', description: '2 days before game' },
  { value: 'day_minus_1', label: 'Day -1', description: '1 day before game' },
  { value: 'game_day', label: 'Game Day', description: 'Game day trivia' },
];

interface DebugLog {
  id: string;
  timestamp: string;
  level: 'debug' | 'info' | 'warn';
  component: string;
  message: string;
  data?: Record<string, unknown>;
  url?: string;
}

interface Question {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'a' | 'b' | 'c' | 'd';
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
}

export function AdminConsole({ onBack, onResetFlow }: AdminConsoleProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('questions');
  const [questions, setQuestions] = useState<Question[]>(sampleQuestions as Question[]);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [showAddQuestion, setShowAddQuestion] = useState(false);

  // Debug logs state
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [logsStats, setLogsStats] = useState<{ count: number; maxSize: number } | null>(null);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsFilter, setLogsFilter] = useState('');
  const [verboseLogging, setVerboseLogging] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Day control state
  const [gameSettings, setGameSettings] = useState<GameSettings | null>(null);
  const [dayControlLoading, setDayControlLoading] = useState(false);
  const [dayUpdateError, setDayUpdateError] = useState<string | null>(null);
  const [dayUpdateSuccess, setDayUpdateSuccess] = useState<string | null>(null);

  // Initialize verbose logging state from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('adminVerboseLogging');
      setVerboseLogging(stored === 'true');
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Toggle verbose logging
  const handleToggleVerboseLogging = (enabled: boolean) => {
    setVerboseLogging(enabled);
    try {
      if (enabled) {
        localStorage.setItem('adminVerboseLogging', 'true');
      } else {
        localStorage.removeItem('adminVerboseLogging');
      }
    } catch {
      // Ignore localStorage errors
    }
  };

  // Fetch debug logs from API
  const fetchLogs = useCallback(async (clear = false) => {
    setLogsLoading(true);
    try {
      const url = clear ? '/api/log-client-debug?clear=true' : '/api/log-client-debug';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs || []);
        setLogsStats(data.stats || null);
      }
    } catch (e) {
      console.error('Failed to fetch logs:', e);
    } finally {
      setLogsLoading(false);
    }
  }, []);

  // Auto-fetch logs when logs tab is active
  useEffect(() => {
    if (activeTab === 'logs') {
      fetchLogs();
    }
  }, [activeTab, fetchLogs]);

  // Fetch game settings for day control
  const fetchGameSettings = useCallback(async () => {
    setDayControlLoading(true);
    setDayUpdateError(null);
    try {
      const adminSecret = localStorage.getItem('adminSecret') || '';
      const res = await fetch('/api/admin/game', {
        headers: {
          'x-admin-secret': adminSecret,
        },
      });
      const data = await res.json();
      if (data.game_settings) {
        setGameSettings(data.game_settings);
      } else if (data.error) {
        setDayUpdateError(data.error);
      }
    } catch (e) {
      console.error('Failed to fetch game settings:', e);
      setDayUpdateError('Failed to fetch game settings');
    } finally {
      setDayControlLoading(false);
    }
  }, []);

  // Update current day
  const updateCurrentDay = async (newDay: DayIdentifier) => {
    setDayControlLoading(true);
    setDayUpdateError(null);
    setDayUpdateSuccess(null);
    try {
      const adminSecret = localStorage.getItem('adminSecret') || '';
      const res = await fetch('/api/admin/game', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': adminSecret,
        },
        body: JSON.stringify({ current_day: newDay }),
      });
      const data = await res.json();
      if (data.game_settings) {
        setGameSettings(data.game_settings);
        const dayLabel = DAY_OPTIONS.find(d => d.value === newDay)?.label || newDay;
        setDayUpdateSuccess(`Day updated to ${dayLabel}`);
        setTimeout(() => setDayUpdateSuccess(null), 3000);
      } else if (data.error) {
        setDayUpdateError(data.error);
      }
    } catch (e) {
      console.error('Failed to update day:', e);
      setDayUpdateError('Failed to update day');
    } finally {
      setDayControlLoading(false);
    }
  };

  // Auto-fetch game settings when day-control tab is active
  useEffect(() => {
    if (activeTab === 'day-control') {
      fetchGameSettings();
    }
  }, [activeTab, fetchGameSettings]);

  // Filter logs
  const filteredLogs = logs.filter(log =>
    !logsFilter ||
    log.component.toLowerCase().includes(logsFilter.toLowerCase()) ||
    log.message.toLowerCase().includes(logsFilter.toLowerCase())
  );

  const tabs: { id: AdminTab; label: string }[] = [
    { id: 'questions', label: 'Questions' },
    { id: 'scores', label: 'Scores' },
    { id: 'photos', label: 'Photos' },
    { id: 'day-control', label: 'Day Control' },
    { id: 'settings', label: 'Settings' },
    { id: 'logs', label: 'Logs' },
  ];

  const handleDeleteQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const getAvatarEmoji = (avatar: AvatarId | string) => {
    return AVATARS[avatar as AvatarId]?.emoji || '🦅';
  };

  const getOptions = (q: Question) => [q.option_a, q.option_b, q.option_c, q.option_d];
  const getCorrectIndex = (q: Question) => ['a', 'b', 'c', 'd'].indexOf(q.correct_answer);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="p-4 flex items-center gap-4 border-b border-border">
        <button
          onClick={onBack}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Go back"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
        </button>
        <h1 className="font-[var(--font-heading)] text-2xl font-bold text-foreground">
          Admin Console
        </h1>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-border overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap',
              activeTab === tab.id
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {activeTab === 'questions' && (
          <div className="space-y-4">
            {/* Add Question Button */}
            <Button
              onClick={() => setShowAddQuestion(true)}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <path d="M5 12h14"/><path d="M12 5v14"/>
              </svg>
              Add Question
            </Button>

            {/* Questions List */}
            {questions.map((question, index) => (
              <div key={question.id} className="bg-card rounded-xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground">
                      #{index + 1}
                    </span>
                    <span className={cn(
                      'text-xs px-2 py-1 rounded-full',
                      question.difficulty === 'easy' ? 'bg-green-500/20 text-green-500' :
                      question.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-500' :
                      'bg-red-500/20 text-red-500'
                    )}>
                      {question.difficulty}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingQuestion(question)}
                      className="text-muted-foreground hover:text-foreground p-1"
                      aria-label="Edit question"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(question.id)}
                      className="text-muted-foreground hover:text-destructive p-1"
                      aria-label="Delete question"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                      </svg>
                    </button>
                  </div>
                </div>
                <p className="text-foreground font-medium mb-3">{question.question_text}</p>
                <div className="grid grid-cols-2 gap-2">
                  {getOptions(question).map((option, optIndex) => (
                    <div
                      key={optIndex}
                      className={cn(
                        'text-xs px-3 py-2 rounded-lg',
                        optIndex === getCorrectIndex(question)
                          ? 'bg-primary/20 text-primary border border-primary/30'
                          : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {String.fromCharCode(65 + optIndex)}. {option}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'scores' && (
          <div className="space-y-4">
            {/* Score Controls */}
            <div className="bg-card rounded-xl p-4 space-y-3">
              <h3 className="font-bold text-foreground">Scoreboard Controls</h3>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="bg-transparent border-border text-foreground hover:bg-muted">
                  Lock Scores
                </Button>
                <Button variant="outline" className="bg-transparent border-border text-foreground hover:bg-muted">
                  Reset All
                </Button>
                <Button variant="outline" className="bg-transparent border-border text-foreground hover:bg-muted col-span-2">
                  Export to CSV
                </Button>
              </div>
            </div>

            {/* Scores List */}
            {sampleLeaderboard.map((entry, index) => (
              <div key={entry.username} className="bg-card rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>
                  <span className="text-2xl">{getAvatarEmoji(entry.avatar)}</span>
                  <div>
                    <div className="font-bold text-foreground">{entry.username}</div>
                    <div className="text-sm text-muted-foreground">
                      {entry.days_played} days • {entry.current_streak} streak
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-primary">{entry.total_points}</div>
                  <button className="text-xs text-muted-foreground hover:text-foreground">
                    Adjust
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'photos' && (
          <div className="space-y-4">
            <div className="bg-card rounded-xl p-4">
              <h3 className="font-bold text-foreground mb-3">Photo Moderation</h3>
              <p className="text-sm text-muted-foreground">
                Review and moderate user-submitted photos. Remove inappropriate content as needed.
              </p>
            </div>

            <div className="text-center py-12 text-muted-foreground">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-3 opacity-50">
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
              </svg>
              <p>No photos pending approval</p>
            </div>
          </div>
        )}

        {activeTab === 'day-control' && (
          <div className="space-y-4 pb-24">
            {/* Current Day Status */}
            <div className="bg-card rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-foreground">Current Day</h3>
                  <p className="text-sm text-muted-foreground">
                    Controls which trivia questions are active
                  </p>
                </div>
                <Button
                  onClick={() => fetchGameSettings()}
                  disabled={dayControlLoading}
                  variant="outline"
                  size="sm"
                  className="bg-transparent border-border text-foreground hover:bg-muted"
                >
                  {dayControlLoading ? (
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                      <path d="M3 3v5h5"/>
                      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
                      <path d="M16 21h5v-5"/>
                    </svg>
                  )}
                </Button>
              </div>

              {/* Current Day Display */}
              {gameSettings && (
                <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                        <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
                        <line x1="16" x2="16" y1="2" y2="6"/>
                        <line x1="8" x2="8" y1="2" y2="6"/>
                        <line x1="3" x2="21" y1="10" y2="10"/>
                      </svg>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-primary">
                        {DAY_OPTIONS.find(d => d.value === gameSettings.current_day)?.label || gameSettings.current_day}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {DAY_OPTIONS.find(d => d.value === gameSettings.current_day)?.description}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {dayUpdateError && (
                <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 mb-4">
                  <p className="text-sm text-destructive">{dayUpdateError}</p>
                </div>
              )}

              {/* Success Message */}
              {dayUpdateSuccess && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mb-4">
                  <p className="text-sm text-green-500">{dayUpdateSuccess}</p>
                </div>
              )}
            </div>

            {/* Day Selection */}
            <div className="bg-card rounded-xl p-4">
              <h3 className="font-bold text-foreground mb-4">Select Day</h3>
              <div className="space-y-2">
                {DAY_OPTIONS.map((day, index) => {
                  const isCurrentDay = gameSettings?.current_day === day.value;
                  const currentIndex = DAY_OPTIONS.findIndex(d => d.value === gameSettings?.current_day);
                  const isPast = index < currentIndex;
                  const isNext = index === currentIndex + 1;

                  return (
                    <button
                      key={day.value}
                      onClick={() => updateCurrentDay(day.value)}
                      disabled={dayControlLoading || isCurrentDay}
                      className={cn(
                        'w-full flex items-center justify-between p-4 rounded-lg border transition-all',
                        isCurrentDay
                          ? 'bg-primary/20 border-primary text-primary cursor-default'
                          : isNext
                          ? 'bg-green-500/10 border-green-500/50 text-foreground hover:bg-green-500/20'
                          : isPast
                          ? 'bg-muted/50 border-border text-muted-foreground hover:bg-muted'
                          : 'bg-card border-border text-foreground hover:bg-muted'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                          isCurrentDay
                            ? 'bg-primary text-primary-foreground'
                            : isPast
                            ? 'bg-muted-foreground/20 text-muted-foreground'
                            : 'bg-muted text-foreground'
                        )}>
                          {index + 1}
                        </div>
                        <div className="text-left">
                          <div className="font-medium">{day.label}</div>
                          <div className="text-xs text-muted-foreground">{day.description}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isCurrentDay && (
                          <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">
                            Current
                          </span>
                        )}
                        {isNext && !isCurrentDay && (
                          <span className="text-xs bg-green-500/20 text-green-500 px-2 py-1 rounded-full">
                            Next
                          </span>
                        )}
                        {isPast && (
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-card rounded-xl p-4">
              <h3 className="font-bold text-foreground mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => {
                    const currentIndex = DAY_OPTIONS.findIndex(d => d.value === gameSettings?.current_day);
                    if (currentIndex < DAY_OPTIONS.length - 1) {
                      updateCurrentDay(DAY_OPTIONS[currentIndex + 1].value);
                    }
                  }}
                  disabled={dayControlLoading || gameSettings?.current_day === 'game_day'}
                  className="bg-green-600 text-white hover:bg-green-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                    <path d="m9 18 6-6-6-6"/>
                  </svg>
                  Advance Day
                </Button>
                <Button
                  onClick={() => updateCurrentDay('day_minus_4')}
                  disabled={dayControlLoading || gameSettings?.current_day === 'day_minus_4'}
                  variant="outline"
                  className="bg-transparent border-border text-foreground hover:bg-muted"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                    <path d="M3 3v5h5"/>
                  </svg>
                  Reset to Day -4
                </Button>
              </div>
            </div>

            {/* Game Settings Info */}
            {gameSettings && (
              <div className="bg-card rounded-xl p-4">
                <h3 className="font-bold text-foreground mb-3">Current Settings</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Game Mode:</span>
                    <span className="text-foreground font-medium">{gameSettings.current_mode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Questions Per Day:</span>
                    <span className="text-foreground font-medium">{gameSettings.questions_per_day}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Timer Duration:</span>
                    <span className="text-foreground font-medium">{gameSettings.timer_duration}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Updated:</span>
                    <span className="text-foreground font-medium">
                      {new Date(gameSettings.updated_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-4 pb-24">
            {/* Game Day Mode */}
            <div className="bg-card rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-bold text-foreground">Game Day Mode</h3>
                  <p className="text-sm text-muted-foreground">Enable special trivia with 20-25 questions</p>
                </div>
                <button className="w-12 h-6 bg-muted rounded-full relative transition-colors">
                  <span className="absolute left-1 top-1 w-4 h-4 bg-muted-foreground rounded-full transition-transform" />
                </button>
              </div>
            </div>

            {/* Daily Questions */}
            <div className="bg-card rounded-xl p-4">
              <h3 className="font-bold text-foreground mb-3">Daily Questions</h3>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  defaultValue={5}
                  min={3}
                  max={10}
                  className="w-20 bg-muted border-border text-foreground"
                />
                <span className="text-muted-foreground">questions per day</span>
              </div>
            </div>

            {/* Timer Settings */}
            <div className="bg-card rounded-xl p-4">
              <h3 className="font-bold text-foreground mb-3">Timer Duration</h3>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  defaultValue={15}
                  min={10}
                  max={30}
                  className="w-20 bg-muted border-border text-foreground"
                />
                <span className="text-muted-foreground">seconds per question</span>
              </div>
            </div>

            {/* Save Button */}
            <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              Save Settings
            </Button>

            {/* Reset User Flow */}
            <div className="bg-card rounded-xl p-4 mt-6 border border-destructive/30">
              <h3 className="font-bold text-foreground mb-2">Reset User Flow</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Clear your registration and return to the first screen. This will reset your team name and avatar selection.
              </p>
              <Button
                variant="outline"
                onClick={onResetFlow}
                className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                Reset to Registration Screen
              </Button>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-4 pb-24">
            {/* Verbose Logging Toggle */}
            <div className="bg-card rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-foreground">Verbose Logging</h3>
                  <p className="text-sm text-muted-foreground">
                    Enable to capture [v0] prefixed console logs
                  </p>
                </div>
                <Switch
                  checked={verboseLogging}
                  onCheckedChange={handleToggleVerboseLogging}
                />
              </div>
            </div>

            {/* Log Controls */}
            <div className="flex gap-2">
              <Input
                placeholder="Filter by component or message..."
                value={logsFilter}
                onChange={(e) => setLogsFilter(e.target.value)}
                className="flex-1 bg-muted border-border text-foreground"
              />
              <Button
                onClick={() => fetchLogs()}
                disabled={logsLoading}
                variant="outline"
                className="bg-transparent border-border text-foreground hover:bg-muted"
              >
                {logsLoading ? (
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                    <path d="M3 3v5h5"/>
                    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
                    <path d="M16 21h5v-5"/>
                  </svg>
                )}
              </Button>
              <Button
                onClick={() => fetchLogs(true)}
                disabled={logsLoading}
                variant="outline"
                className="bg-transparent border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                Clear
              </Button>
            </div>

            {/* Stats */}
            {logsStats && (
              <div className="text-sm text-muted-foreground">
                Showing {filteredLogs.length} of {logsStats.count} logs (max {logsStats.maxSize})
              </div>
            )}

            {/* Logs List */}
            <div className="space-y-2">
              {filteredLogs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-3 opacity-50">
                    <path d="M14 3v4a1 1 0 0 0 1 1h4"/>
                    <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z"/>
                    <path d="M9 9h1"/>
                    <path d="M9 13h6"/>
                    <path d="M9 17h6"/>
                  </svg>
                  <p>No logs yet</p>
                  <p className="text-xs mt-1">Enable verbose logging and use console.log("[v0] message")</p>
                </div>
              ) : (
                filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className={cn(
                      'bg-card rounded-lg p-3 border-l-4 cursor-pointer transition-colors',
                      log.level === 'warn' ? 'border-yellow-500' :
                      log.level === 'info' ? 'border-blue-500' :
                      'border-muted-foreground'
                    )}
                    onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={cn(
                            'text-xs px-2 py-0.5 rounded-full font-medium',
                            log.level === 'warn' ? 'bg-yellow-500/20 text-yellow-500' :
                            log.level === 'info' ? 'bg-blue-500/20 text-blue-500' :
                            'bg-muted text-muted-foreground'
                          )}>
                            {log.component}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm text-foreground mt-1 break-words">{log.message}</p>
                      </div>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={cn(
                          'text-muted-foreground transition-transform flex-shrink-0',
                          expandedLogId === log.id && 'rotate-180'
                        )}
                      >
                        <path d="m6 9 6 6 6-6"/>
                      </svg>
                    </div>
                    {expandedLogId === log.id && log.data && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <pre className="text-xs text-muted-foreground overflow-x-auto whitespace-pre-wrap break-all">
                          {JSON.stringify(log.data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Question Modal */}
      {(showAddQuestion || editingQuestion) && (
        <div
          className="fixed inset-0 bg-black/80 flex items-end justify-center z-50"
          onClick={() => {
            setShowAddQuestion(false);
            setEditingQuestion(null);
          }}
        >
          <div
            className="bg-card w-full max-w-lg rounded-t-3xl p-6 max-h-[90vh] overflow-auto animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground">
                {editingQuestion ? 'Edit Question' : 'Add Question'}
              </h2>
              <button
                onClick={() => {
                  setShowAddQuestion(false);
                  setEditingQuestion(null);
                }}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                </svg>
              </button>
            </div>

            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Question</label>
                <textarea
                  className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground min-h-[100px] focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter your question..."
                  defaultValue={editingQuestion?.question_text}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {['A', 'B', 'C', 'D'].map((letter, index) => (
                  <div key={letter}>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Option {letter}
                    </label>
                    <Input
                      placeholder={`Option ${letter}`}
                      className="bg-muted border-border text-foreground"
                      defaultValue={editingQuestion ? getOptions(editingQuestion)[index] : ''}
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Correct Answer</label>
                <select className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                  <option value="a">A</option>
                  <option value="b">B</option>
                  <option value="c">C</option>
                  <option value="d">D</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Difficulty</label>
                  <select className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Category</label>
                  <Input
                    placeholder="Category"
                    className="bg-muted border-border text-foreground"
                    defaultValue={editingQuestion?.category || 'Seahawks History'}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
              >
                {editingQuestion ? 'Save Changes' : 'Add Question'}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
