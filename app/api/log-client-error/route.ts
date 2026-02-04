import { type NextRequest, NextResponse } from "next/server"
import { addLog } from "@/lib/error-tracking/debug-log-buffer"

// Use Node.js runtime for in-memory storage
export const runtime = "nodejs"

interface ClientErrorLog {
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
  breadcrumbs?: Array<{
    timestamp: number
    category: string
    message: string
    data?: Record<string, unknown>
  }>
  additionalInfo?: Record<string, unknown>
}

/**
 * POST: Log a client-side error
 *
 * This captures errors from the browser and logs them to Vercel Runtime Logs
 * for debugging. Errors are also stored in the in-memory buffer for admin viewing.
 */
export async function POST(request: NextRequest) {
  try {
    const errorData: ClientErrorLog = await request.json()

    const timestamp = errorData.timestamp
      ? new Date(errorData.timestamp).toISOString()
      : new Date().toISOString()

    // Store in buffer for admin viewing (as a warn-level log)
    addLog({
      timestamp,
      level: "warn",
      component: errorData.errorType || "Error",
      message: errorData.message,
      data: {
        stack: errorData.stack,
        componentStack: errorData.componentStack,
        url: errorData.url,
        userAgent: errorData.userAgent,
        activityContext: errorData.activityContext,
        activityDisplayName: errorData.activityDisplayName,
        modalType: errorData.modalType,
        modalDisplayName: errorData.modalDisplayName,
        modalIsOpen: errorData.modalIsOpen,
        breadcrumbs: errorData.breadcrumbs,
        ...errorData.additionalInfo,
      },
      url: errorData.url,
    })

    // Log to console for Vercel Runtime Logs
    const isDev = process.env.NODE_ENV === "development"

    if (isDev) {
      // Pretty format for development
      console.error(`
${"=".repeat(55)}
CLIENT-SIDE ERROR CAPTURED
${"=".repeat(55)}
Error Type: ${errorData.errorType}
Message: ${errorData.message}
URL: ${errorData.url || "unknown"}
Activity Context: ${errorData.activityDisplayName || errorData.activityContext || "unknown"}
${errorData.modalDisplayName ? `Modal Context: ${errorData.modalDisplayName} (${errorData.modalIsOpen ? "open" : "closed"})` : ""}
User Agent: ${errorData.userAgent || "unknown"}
Timestamp: ${timestamp}
${"-".repeat(55)}
Stack Trace:
${errorData.stack || "(no stack trace)"}
${errorData.componentStack ? `\nComponent Stack:\n${errorData.componentStack}` : ""}
${errorData.additionalInfo ? `\nAdditional Info: ${JSON.stringify(errorData.additionalInfo, null, 2)}` : ""}
${errorData.breadcrumbs?.length ? `\nRecent Events (${errorData.breadcrumbs.length}):\n${errorData.breadcrumbs.map((b) => `  [${b.category}] ${b.message}`).join("\n")}` : ""}
${"=".repeat(55)}
`)
    } else {
      // JSON format for production (easier to search in Vercel logs)
      console.error(
        JSON.stringify({
          type: "CLIENT_ERROR",
          timestamp,
          errorType: errorData.errorType,
          message: errorData.message,
          url: errorData.url,
          activityContext: errorData.activityContext,
          activityDisplayName: errorData.activityDisplayName,
          modalType: errorData.modalType,
          modalIsOpen: errorData.modalIsOpen,
          stack: errorData.stack,
          componentStack: errorData.componentStack,
          userAgent: errorData.userAgent,
          additionalInfo: errorData.additionalInfo,
          breadcrumbCount: errorData.breadcrumbs?.length || 0,
        })
      )
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (err) {
    console.error("[log-client-error] Failed to process error log:", err)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
