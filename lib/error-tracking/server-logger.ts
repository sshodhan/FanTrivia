/**
 * Server-side logging utilities for API routes and middleware
 *
 * These functions log to Vercel Runtime Logs. Use them in:
 * - app/api/.../route.ts files (any API route)
 * - middleware.ts
 */

type LogLevel = "debug" | "info" | "warn" | "error"

interface ServerLogEvent {
  level: LogLevel
  component: string
  event: string
  data?: Record<string, unknown>
}

interface TriviaLogEvent {
  level: LogLevel
  event: "question_served" | "answer_submitted" | "game_completed" | "error"
  userId?: string
  questionId?: string
  questionText?: string
  userAnswer?: string
  correct?: boolean
  score?: number
  data?: Record<string, unknown>
}

const isDev = process.env.NODE_ENV === "development"

/**
 * General server logging
 *
 * @example
 * logServer({
 *   level: "info",
 *   component: "my-api",
 *   event: "request_received",
 *   data: { userId: "123", action: "update" }
 * })
 */
export function logServer(event: ServerLogEvent): void {
  const timestamp = new Date().toISOString()
  const levelEmoji = getLevelEmoji(event.level)

  if (isDev) {
    // Pretty format for development
    const logFn = getLogFunction(event.level)
    logFn(`
${"=".repeat(55)}
${levelEmoji} [${event.component.toUpperCase()}] ${event.event.toUpperCase()}
${"=".repeat(55)}
Timestamp: ${timestamp}
${event.data ? `${"-".repeat(55)}\nData:\n${JSON.stringify(event.data, null, 2)}` : ""}
${"=".repeat(55)}
`)
  } else {
    // JSON format for production
    const logFn = getLogFunction(event.level)
    logFn(
      JSON.stringify({
        component: event.component,
        timestamp,
        runtime: "nodejs",
        level: event.level,
        event: event.event,
        ...event.data,
      })
    )
  }
}

/**
 * Specialized trivia game logging
 *
 * @example
 * logTrivia({
 *   level: "info",
 *   event: "answer_submitted",
 *   userId: "user-123",
 *   questionId: "q-001",
 *   questionText: "Who won Super Bowl XLVIII?",
 *   userAnswer: "Seahawks",
 *   correct: true,
 *   score: 100
 * })
 */
export function logTrivia(event: TriviaLogEvent): void {
  const timestamp = new Date().toISOString()
  const levelEmoji = getLevelEmoji(event.level)

  if (isDev) {
    // Pretty format for development
    const logFn = getLogFunction(event.level)
    logFn(`
${"=".repeat(55)}
${levelEmoji} [TRIVIA] ${event.event.toUpperCase()}
${"=".repeat(55)}
Timestamp: ${timestamp}
${event.userId ? `User ID: ${event.userId}` : ""}
${event.questionId ? `Question ID: ${event.questionId}` : ""}
${event.questionText ? `Question: ${event.questionText}` : ""}
${event.userAnswer !== undefined ? `User Answer: ${event.userAnswer}` : ""}
${event.correct !== undefined ? `Correct: ${event.correct}` : ""}
${event.score !== undefined ? `Score: ${event.score}` : ""}
${event.data ? `${"-".repeat(55)}\nAdditional Data:\n${JSON.stringify(event.data, null, 2)}` : ""}
${"=".repeat(55)}
`)
  } else {
    // JSON format for production
    const logFn = getLogFunction(event.level)
    logFn(
      JSON.stringify({
        component: "trivia",
        timestamp,
        runtime: "nodejs",
        level: event.level,
        event: event.event,
        userId: event.userId,
        questionId: event.questionId,
        questionText: event.questionText,
        userAnswer: event.userAnswer,
        correct: event.correct,
        score: event.score,
        ...event.data,
      })
    )
  }
}

/**
 * Log a server-side error with context
 *
 * @example
 * try {
 *   await someOperation()
 * } catch (error) {
 *   logServerError("trivia-api", "fetch_questions_failed", error, { userId })
 * }
 */
export function logServerError(
  component: string,
  event: string,
  error: unknown,
  additionalData?: Record<string, unknown>
): void {
  const timestamp = new Date().toISOString()
  const errorMessage = error instanceof Error ? error.message : String(error)
  const errorStack = error instanceof Error ? error.stack : undefined

  if (isDev) {
    console.error(`
${"=".repeat(55)}
[${component.toUpperCase()}] ${event.toUpperCase()}
${"=".repeat(55)}
Timestamp: ${timestamp}
${"-".repeat(55)}
Error: ${errorMessage}
${errorStack ? `\nStack Trace:\n${errorStack}` : ""}
${additionalData ? `\nAdditional Data:\n${JSON.stringify(additionalData, null, 2)}` : ""}
${"=".repeat(55)}
`)
  } else {
    console.error(
      JSON.stringify({
        component,
        timestamp,
        runtime: "nodejs",
        level: "error",
        event,
        error: errorMessage,
        stack: errorStack,
        ...additionalData,
      })
    )
  }
}

// Helper functions
function getLevelEmoji(level: LogLevel): string {
  switch (level) {
    case "debug":
      return "🔍"
    case "info":
      return "ℹ️"
    case "warn":
      return "⚠️"
    case "error":
      return "🚨"
    default:
      return "📝"
  }
}

function getLogFunction(level: LogLevel): typeof console.log {
  switch (level) {
    case "debug":
      return console.debug
    case "info":
      return console.info
    case "warn":
      return console.warn
    case "error":
      return console.error
    default:
      return console.log
  }
}
