/**
 * Client-side error logger for capturing and reporting errors to Vercel
 *
 * IMPORTANT: Android WebView compatible - no localStorage without checks
 */

import {
  getActivityContext,
  getActivityDisplayName,
  getModalContext,
  getModalDisplayName,
} from "@/lib/activity-context"
import { getBreadcrumbs, type Breadcrumb } from "@/lib/error-tracking/event-breadcrumbs"

interface ErrorLogData {
  message: string
  stack?: string
  componentStack?: string
  url?: string
  userAgent?: string
  timestamp: number
  errorType: string
  activityContext?: string
  activityDisplayName?: string
  modalType?: string
  modalDisplayName?: string
  modalIsOpen?: boolean
  breadcrumbs?: Breadcrumb[]
  additionalInfo?: Record<string, unknown>
}

/**
 * Send error to Vercel logs via API endpoint
 * This is resilient and won't throw if the API fails
 */
export async function logClientError(
  error: Error | string,
  errorType = "Error",
  additionalInfo?: Record<string, unknown>,
) {
  try {
    // Only log in browser environment
    if (typeof window === "undefined") return

    const errorMessage = typeof error === "string" ? error : error.message
    const errorStack = typeof error === "string" ? undefined : error.stack

    const currentActivity = getActivityContext()
    const activityDisplayName = getActivityDisplayName(currentActivity)

    const modalContext = getModalContext()
    const modalDisplayName = modalContext ? getModalDisplayName(modalContext.type) : undefined

    const errorData: ErrorLogData = {
      message: errorMessage,
      stack: errorStack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
      errorType,
      activityContext: currentActivity || "unknown",
      activityDisplayName,
      modalType: modalContext?.type,
      modalDisplayName,
      modalIsOpen: modalContext?.isOpen,
      breadcrumbs: getBreadcrumbs(20),
      additionalInfo: {
        ...additionalInfo,
        isAndroid: /android/i.test(navigator.userAgent),
        isWebView: isWebView(),
      },
    }

    // Send to our API endpoint (fire and forget - don't await)
    fetch("/api/log-client-error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(errorData),
    }).catch(() => {
      // Silently fail if logging fails - don't crash the app
      console.error("[ClientLogger] Failed to send error to API")
    })

    console.error(`[ClientLogger] ${errorType} in ${activityDisplayName}:`, errorMessage)
    if (errorStack) {
      console.error(errorStack)
    }
  } catch (loggingError) {
    // Never let the error logger crash the app
    console.error("[ClientLogger] Error logging failed:", loggingError)
  }
}

/**
 * Detect if running in a WebView
 */
function isWebView(): boolean {
  if (typeof window === "undefined") return false

  const ua = navigator.userAgent

  // Android WebView detection
  if (/android/i.test(ua)) {
    // WebView doesn't have "Chrome" in user agent in older versions
    // Or has "wv" flag in newer versions
    return !ua.includes("Chrome") || ua.includes("wv")
  }

  // iOS WebView detection
  if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) {
    // iOS WebView doesn't have "Safari" in user agent
    return !ua.includes("Safari")
  }

  return false
}

/**
 * Log React component errors (for error boundaries)
 */
export function logReactError(error: Error, errorInfo: { componentStack?: string }) {
  logClientError(error, "React Error", {
    componentStack: errorInfo.componentStack,
  })
}

/**
 * Log localStorage-related errors specifically
 */
export function logLocalStorageError(error: Error, operation: string) {
  logClientError(error, "localStorage Error", {
    operation,
    hasWindow: typeof window !== "undefined",
    hasLocalStorage: typeof window !== "undefined" && typeof localStorage !== "undefined",
  })
}

/**
 * Log Android WebView-specific issues
 */
export function logAndroidWebViewError(error: Error, context: string) {
  logClientError(error, "Android WebView Error", {
    context,
    isWebView: isWebView(),
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
  })
}

/**
 * Check if verbose debug logging is enabled (admin setting)
 */
function isVerboseLoggingEnabled(): boolean {
  if (typeof window === "undefined") return false
  try {
    return localStorage.getItem("adminVerboseLogging") === "true"
  } catch {
    return false
  }
}

/**
 * Log client-side debug info to server (visible in v0's server console)
 *
 * This bypasses v0's iframe CSP restrictions by sending logs through
 * the API endpoint, making them visible as [SERVER] logs.
 *
 * Only logs when adminVerboseLogging is enabled in localStorage.
 *
 * @param component - Component/module name (e.g., "PuzzleUnlock", "HomePage")
 * @param message - Log message
 * @param data - Optional data to include
 * @param options - Optional settings (force: bypass admin check, level: log level)
 */
export function logClientDebug(
  component: string,
  message: string,
  data?: Record<string, unknown>,
  options?: { force?: boolean; level?: "debug" | "info" | "warn" }
) {
  // Only run in browser
  if (typeof window === "undefined") return

  // Check if verbose logging is enabled (unless forced)
  if (!options?.force && !isVerboseLoggingEnabled()) {
    return
  }

  // Also log to local console for immediate visibility
  const prefix = `[v0][${component}]`
  if (options?.level === "warn") {
    console.warn(prefix, message, data || "")
  } else {
    console.log(prefix, message, data || "")
  }

  // Send to server endpoint (fire and forget)
  fetch("/api/log-client-debug", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      level: options?.level || "debug",
      component,
      message,
      data,
      timestamp: Date.now(),
      url: window.location.href,
    }),
  }).catch(() => {
    // Silently fail - don't disrupt the app
  })
}

/**
 * Enable verbose logging for debugging (call from browser console)
 *
 * Usage in browser console:
 *   enableVerboseLogging()    // Enable
 *   enableVerboseLogging(false)  // Disable
 */
if (typeof window !== "undefined") {
  ;(window as unknown as Record<string, unknown>).enableVerboseLogging = (enable = true) => {
    try {
      if (enable) {
        localStorage.setItem("adminVerboseLogging", "true")
        console.log("[ClientLogger] Verbose logging ENABLED - client logs will be sent to server")
      } else {
        localStorage.removeItem("adminVerboseLogging")
        console.log("[ClientLogger] Verbose logging DISABLED")
      }
    } catch (e) {
      console.error("[ClientLogger] Failed to toggle verbose logging:", e)
    }
  }
}

/**
 * Console interceptor - automatically captures [v0] prefixed logs
 *
 * This intercepts console.log/warn calls and forwards any that start with [v0]
 * to the debug log buffer, making them visible in the in-app log viewer.
 */
let consoleInterceptorInstalled = false

function installConsoleInterceptor() {
  if (typeof window === "undefined") return
  if (consoleInterceptorInstalled) return

  const originalLog = console.log
  const originalWarn = console.warn

  // Helper to extract component and message from [v0][Component] format
  function parseV0Log(args: unknown[]): { component: string; message: string; data?: Record<string, unknown> } | null {
    if (args.length === 0) return null

    const first = args[0]
    if (typeof first !== "string") return null

    // Match [v0][ComponentName] or [v0] prefix
    const match = first.match(/^\[v0\](?:\[([^\]]+)\])?\s*(.*)/)
    if (!match) return null

    const component = match[1] || "App"
    const messagePart = match[2] || ""

    // Combine remaining args into message/data
    const restArgs = args.slice(1)
    let message = messagePart
    let data: Record<string, unknown> | undefined

    if (restArgs.length > 0) {
      // If first rest arg is a string, append to message
      if (typeof restArgs[0] === "string") {
        message = message ? `${message} ${restArgs[0]}` : restArgs[0]
        if (restArgs.length > 1) {
          data = { args: restArgs.slice(1) }
        }
      } else if (typeof restArgs[0] === "object" && restArgs[0] !== null) {
        // If it's an object, use as data
        data = restArgs[0] as Record<string, unknown>
      } else {
        data = { value: restArgs[0] }
      }
    }

    return { component, message: message || "(no message)", data }
  }

  // Send to server (debounced to avoid flooding)
  let pendingLogs: Array<{ level: string; component: string; message: string; data?: Record<string, unknown> }> = []
  let flushTimeout: ReturnType<typeof setTimeout> | null = null

  function queueLog(level: "debug" | "info" | "warn", component: string, message: string, data?: Record<string, unknown>) {
    if (!isVerboseLoggingEnabled()) return

    pendingLogs.push({ level, component, message, data })

    if (!flushTimeout) {
      flushTimeout = setTimeout(() => {
        const logsToSend = pendingLogs
        pendingLogs = []
        flushTimeout = null

        // Send each log
        logsToSend.forEach((log) => {
          fetch("/api/log-client-debug", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              level: log.level,
              component: log.component,
              message: log.message,
              data: log.data,
              timestamp: Date.now(),
              url: window.location.href,
            }),
          }).catch(() => {
            // Silently fail
          })
        })
      }, 100) // Batch logs every 100ms
    }
  }

  console.log = function (...args: unknown[]) {
    // Always call original
    originalLog.apply(console, args)

    // Check for [v0] prefix and forward to server
    const parsed = parseV0Log(args)
    if (parsed) {
      queueLog("debug", parsed.component, parsed.message, parsed.data)
    }
  }

  console.warn = function (...args: unknown[]) {
    // Always call original
    originalWarn.apply(console, args)

    // Check for [v0] prefix and forward to server
    const parsed = parseV0Log(args)
    if (parsed) {
      queueLog("warn", parsed.component, parsed.message, parsed.data)
    }
  }

  consoleInterceptorInstalled = true
}

// Install interceptor on module load (client-side only)
if (typeof window !== "undefined") {
  installConsoleInterceptor()
}
