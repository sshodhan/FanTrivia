'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@/lib/user-context';
import { AVATARS } from '@/lib/database.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { AdminConsole } from '@/components/admin-console';
import { cn } from '@/lib/utils';

interface SettingsScreenProps {
  onBack: () => void;
  onResetFlow: () => void;
  isResetting?: boolean;
}

type SettingsTab = 'profile' | 'preferences' | 'logs' | 'admin';

interface DebugLog {
  id: string;
  timestamp: string;
  level: 'debug' | 'info' | 'warn';
  component: string;
  message: string;
  data?: Record<string, unknown>;
  url?: string;
}

export function SettingsScreen({ onBack, onResetFlow, isResetting }: SettingsScreenProps) {
  const { user, refreshUser, isLoading } = useUser();
  const [refreshStatus, setRefreshStatus] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  
  // Logs state
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [logsStats, setLogsStats] = useState<{ count: number; maxSize: number } | null>(null);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsFilter, setLogsFilter] = useState('');
  const [verboseLogging, setVerboseLogging] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Preferences state
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const getAvatarEmoji = () => {
    if (!user?.avatar) return '🦅';
    return AVATARS[user.avatar]?.emoji || '🦅';
  };

  const handleRefreshProfile = async () => {
    setRefreshStatus(null);
    const result = await refreshUser();
    if (result.success) {
      setRefreshStatus('Profile updated successfully!');
    } else {
      setRefreshStatus(result.error || 'Failed to refresh');
    }
    // Clear status after 3 seconds
    setTimeout(() => setRefreshStatus(null), 3000);
  };

  // Initialize states from localStorage
  useEffect(() => {
    try {
      const storedVerbose = localStorage.getItem('adminVerboseLogging');
      setVerboseLogging(storedVerbose === 'true');
      
      const storedSound = localStorage.getItem('soundEnabled');
      setSoundEnabled(storedSound !== 'false');
      
      const storedNotifications = localStorage.getItem('notificationsEnabled');
      setNotificationsEnabled(storedNotifications === 'true');
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

  // Toggle sound
  const handleToggleSound = (enabled: boolean) => {
    setSoundEnabled(enabled);
    try {
      localStorage.setItem('soundEnabled', enabled ? 'true' : 'false');
    } catch {
      // Ignore localStorage errors
    }
  };

  // Toggle notifications
  const handleToggleNotifications = (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    try {
      localStorage.setItem('notificationsEnabled', enabled ? 'true' : 'false');
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

  // Filter logs
  const filteredLogs = logs.filter(log =>
    !logsFilter ||
    log.component.toLowerCase().includes(logsFilter.toLowerCase()) ||
    log.message.toLowerCase().includes(logsFilter.toLowerCase())
  );

  // Build tabs - Admin only shows for admin users
  const tabs: { id: SettingsTab; label: string }[] = [
    { id: 'profile', label: 'Profile' },
    { id: 'preferences', label: 'Preferences' },
    { id: 'logs', label: 'Logs' },
  ];

  if (user?.is_admin) {
    tabs.push({ id: 'admin', label: 'Admin' });
  }

  // If on admin tab, render full AdminConsole
  if (activeTab === 'admin' && user?.is_admin) {
    return (
      <AdminConsole 
        onBack={() => setActiveTab('profile')} 
        onResetFlow={onResetFlow}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background pb-20">
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
          Settings
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
      <div className="flex-1 p-4 overflow-y-auto">
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            {/* User Card */}
            <div className="bg-card rounded-xl p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center">
                  <span className="text-5xl">{getAvatarEmoji()}</span>
                </div>
                <div className="flex-1">
                  <div className="font-bold text-foreground text-2xl">{user?.username || 'Guest'}</div>
                  <div className="text-sm text-muted-foreground">
                    Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
              </div>
              
              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-muted rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-primary">{user?.total_points || 0}</div>
                  <div className="text-xs text-muted-foreground">Points</div>
                </div>
                <div className="bg-muted rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-primary">{user?.current_streak || 0}</div>
                  <div className="text-xs text-muted-foreground">Streak</div>
                </div>
                <div className="bg-muted rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-primary">{user?.days_played || 0}</div>
                  <div className="text-xs text-muted-foreground">Days</div>
                </div>
              </div>
            </div>

            {/* User ID Section */}
            {user?.user_id && (
            <div className="bg-card rounded-xl p-4">
              <h3 className="font-bold text-foreground mb-2">Your User ID</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Save this ID to sign in on other devices or after resetting.
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-muted px-3 py-2 rounded-lg text-sm text-foreground font-mono overflow-x-auto">
                  {user.user_id}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(user.user_id);
                    setRefreshStatus('User ID copied!');
                    setTimeout(() => setRefreshStatus(null), 2000);
                  }}
                  className="shrink-0"
                >
                  Copy
                </Button>
              </div>
            </div>
            )}

            {/* Refresh Profile */}
            <div className="bg-card rounded-xl p-4">
              <h3 className="font-bold text-foreground mb-2">Sync Profile</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Refresh your profile to get the latest data from the server.
              </p>
              {refreshStatus && (
                <p className={cn(
                  'text-sm mb-3',
                  refreshStatus.includes('success') || refreshStatus.includes('copied') ? 'text-primary' : 'text-destructive'
                )}>
                  {refreshStatus}
                </p>
              )}
              <Button
                variant="outline"
                onClick={handleRefreshProfile}
                disabled={isLoading}
                className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              >
                {isLoading ? 'Refreshing...' : 'Refresh Profile'}
              </Button>
            </div>

            {/* Account Actions */}
            <div className="bg-card rounded-xl p-4 border border-destructive/30">
              <h3 className="font-bold text-foreground mb-2">Account</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Permanently delete your account and all associated data (scores, answers, photos) to start fresh.
              </p>

              {!showResetConfirm ? (
                <Button
                  variant="outline"
                  onClick={() => setShowResetConfirm(true)}
                  disabled={isResetting}
                  className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  Reset Account
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="bg-destructive/10 rounded-lg p-3 border border-destructive/30">
                    <p className="text-sm font-medium text-destructive">
                      This will permanently delete:
                    </p>
                    <ul className="text-sm text-destructive/80 mt-1 list-disc list-inside space-y-0.5">
                      <li>Your user profile ({user?.username})</li>
                      <li>All trivia answers and scores</li>
                      <li>Photos and likes</li>
                      <li>Streak and points history</li>
                    </ul>
                    <p className="text-sm font-medium text-destructive mt-2">
                      This action cannot be undone.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowResetConfirm(false)}
                      disabled={isResetting}
                      className="flex-1 border-border text-foreground hover:bg-muted"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowResetConfirm(false);
                        onResetFlow();
                      }}
                      disabled={isResetting}
                      className="flex-1 border-destructive bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isResetting ? 'Deleting...' : 'Confirm Delete'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Preferences Tab */}
        {activeTab === 'preferences' && (
          <div className="space-y-4">
            {/* Sound Settings */}
            <div className="bg-card rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-foreground">Sound Effects</h3>
                  <p className="text-sm text-muted-foreground">Play sounds during trivia</p>
                </div>
                <Switch
                  checked={soundEnabled}
                  onCheckedChange={handleToggleSound}
                />
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-card rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-foreground">Notifications</h3>
                  <p className="text-sm text-muted-foreground">Daily reminder to play trivia</p>
                </div>
                <Switch
                  checked={notificationsEnabled}
                  onCheckedChange={handleToggleNotifications}
                />
              </div>
            </div>

            {/* App Info */}
            <div className="bg-card rounded-xl p-4">
              <h3 className="font-bold text-foreground mb-3">About</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>Version</span>
                  <span className="text-foreground">1.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span>Theme</span>
                  <span className="text-foreground">Seahawks</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Logs Tab */}
        {activeTab === 'logs' && (
          <div className="space-y-4">
            {/* Verbose Logging Toggle */}
            <div className="bg-card rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-foreground">Verbose Logging</h3>
                  <p className="text-sm text-muted-foreground">
                    Enable to capture debug logs
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
                  <p className="text-xs mt-1">Enable verbose logging to capture activity</p>
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
                    </div>
                    {expandedLogId === log.id && log.data && (
                      <pre className="mt-2 p-2 bg-muted rounded text-xs text-muted-foreground overflow-auto">
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
