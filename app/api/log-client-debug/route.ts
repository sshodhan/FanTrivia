import { type NextRequest, NextResponse } from "next/server"
import { addLog, getLogs, clearLogs, getBufferStats } from "@/lib/error-tracking/debug-log-buffer"

// Use Node.js runtime for in-memory storage (edge doesn't persist between requests)
export const runtime = "nodejs"

interface ClientDebugLog {
  level: "debug" | "info" | "warn"
  component: string
  message: string
  data?: Record<string, unknown>
  timestamp?: number
  url?: string
}

/**
 * POST: Log a debug message from the client
 *
 * This allows client console.log output to be visible in Vercel Runtime Logs
 * (and v0's server console), bypassing v0's iframe CSP restrictions.
 */
export async function POST(request: NextRequest) {
  try {
    const log: ClientDebugLog = await request.json()

    const timestamp = log.timestamp ? new Date(log.timestamp).toISOString() : new Date().toISOString()
    const levelEmoji = log.level === "warn" ? "⚠️" : log.level === "info" ? "ℹ️" : "🔍"

    // Store in buffer for admin viewing
    addLog({
      timestamp,
      level: log.level || "debug",
      component: log.component,
      message: log.message,
      data: log.data,
      url: log.url,
    })

    // Also log to console for Vercel Runtime Logs / v0 console
    const logFn = log.level === "warn" ? console.warn : console.log
    logFn(`${levelEmoji} [CLIENT][${log.component}] ${log.message}`)
    if (log.data && Object.keys(log.data).length > 0) {
      logFn(`   └─ Data:`, JSON.stringify(log.data, null, 2))
    }
    logFn(`   └─ Time: ${timestamp}`)

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (err) {
    console.error("[log-client-debug] Failed to process debug log:", err)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}

/**
 * GET: Retrieve stored debug logs for admin viewing
 *
 * Query params:
 * - component: Filter by component name (optional)
 * - level: Filter by level (optional)
 * - clear: Set to "true" to clear logs after retrieval (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const shouldClear = searchParams.get("clear") === "true"

    const logs = getLogs()
    const stats = getBufferStats()

    if (shouldClear) {
      clearLogs()
    }

    return NextResponse.json({
      success: true,
      logs,
      stats,
      cleared: shouldClear,
    })
  } catch (err) {
    console.error("[log-client-debug] Failed to retrieve logs:", err)
    return NextResponse.json({ success: false, error: "Failed to retrieve logs" }, { status: 500 })
  }
}
