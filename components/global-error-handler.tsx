"use client"

import { useEffect } from "react"
import { logClientError } from "@/lib/error-tracking/client-logger"

/**
 * Global error handler component
 *
 * This component catches all uncaught errors and unhandled promise rejections
 * and logs them to Vercel Runtime Logs via the client logger.
 *
 * Add this to your root layout to capture all client-side errors.
 */
export function GlobalErrorHandler({ children }: { children?: React.ReactNode }) {
  useEffect(() => {
    // Handler for uncaught errors
    const handleError = (event: ErrorEvent) => {
      // Don't log ResizeObserver errors (common and usually harmless)
      if (event.message?.includes("ResizeObserver")) {
        return
      }

      logClientError(
        event.error || new Error(event.message),
        "Uncaught Error",
        {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        }
      )
    }

    // Handler for unhandled promise rejections
    const handleRejection = (event: PromiseRejectionEvent) => {
      const error =
        event.reason instanceof Error
          ? event.reason
          : new Error(String(event.reason))

      logClientError(error, "Unhandled Promise Rejection", {
        reason: String(event.reason),
      })
    }

    // Add event listeners
    window.addEventListener("error", handleError)
    window.addEventListener("unhandledrejection", handleRejection)

    // Cleanup
    return () => {
      window.removeEventListener("error", handleError)
      window.removeEventListener("unhandledrejection", handleRejection)
    }
  }, [])

  return <>{children}</>
}
