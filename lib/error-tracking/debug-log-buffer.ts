/**
 * In-memory buffer for storing the last N debug logs
 *
 * Note: This buffer is cleared on server restart/redeploy.
 * For persistent storage, use Supabase or an external logging service.
 */

export interface StoredDebugLog {
  id: string
  timestamp: string
  level: "debug" | "info" | "warn"
  component: string
  message: string
  data?: Record<string, unknown>
  url?: string
}

const MAX_LOGS = 100
const logBuffer: StoredDebugLog[] = []

/**
 * Add a log entry to the buffer (circular buffer - oldest removed when full)
 */
export function addLog(log: Omit<StoredDebugLog, "id">): void {
  const entry: StoredDebugLog = {
    ...log,
    id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
  }

  logBuffer.push(entry)

  // Keep only the last MAX_LOGS entries
  if (logBuffer.length > MAX_LOGS) {
    logBuffer.shift()
  }
}

/**
 * Get all logs in the buffer (newest first)
 */
export function getLogs(): StoredDebugLog[] {
  return [...logBuffer].reverse()
}

/**
 * Get logs filtered by component
 */
export function getLogsByComponent(component: string): StoredDebugLog[] {
  return logBuffer
    .filter((log) => log.component.toLowerCase().includes(component.toLowerCase()))
    .reverse()
}

/**
 * Get logs filtered by level
 */
export function getLogsByLevel(level: "debug" | "info" | "warn"): StoredDebugLog[] {
  return logBuffer.filter((log) => log.level === level).reverse()
}

/**
 * Clear all logs
 */
export function clearLogs(): void {
  logBuffer.length = 0
}

/**
 * Get buffer stats
 */
export function getBufferStats(): { count: number; maxSize: number; oldestTimestamp?: string } {
  return {
    count: logBuffer.length,
    maxSize: MAX_LOGS,
    oldestTimestamp: logBuffer.length > 0 ? logBuffer[0].timestamp : undefined,
  }
}
