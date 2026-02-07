# Error Tracking System

## Overview

This system captures both **client-side** and **server-side** errors and logs them to Vercel Runtime Logs for debugging.

- **Client-side**: Captures UI errors, React component crashes, Android WebView issues
- **Server-side**: Captures API errors, grading logic issues, OpenAI interactions

## Architecture

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                    USER'S DEVICE/BROWSER                    │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  1. Error occurs (e.g., localStorage crash)          │  │
│  │  2. GlobalErrorHandler catches it                    │  │
│  │  3. logClientError() sends to API                    │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
                    POST /api/log-client-error
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    VERCEL SERVERS                           │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  1. Receives error data                              │  │
│  │  2. Logs to console.error()                          │  │
│  │  3. Appears in Vercel Runtime Logs                   │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
\`\`\`

---

# Server-Side Logging

## Overview

Server-side logging captures events in API routes (`app/api/**/route.ts`) and middleware. These logs go directly to Vercel Runtime Logs without needing an API endpoint.

## When to Use Server vs Client Logger

| File Location | Logger to Use | Why |
|---------------|---------------|-----|
| `components/*.tsx` | `logClientError()` | Runs in browser |
| `app/**/page.tsx` | `logClientError()` | Runs in browser |
| `hooks/*.ts` | `logClientError()` | Runs in browser |
| `app/api/**/route.ts` | `logMathCoach()` / `logServer()` | Runs on server |
| `middleware.ts` | `logServer()` | Runs on server |

**Key identifiers:**
- **Client**: Files with `"use client"`, React hooks, DOM events
- **Server**: Files importing `NextRequest`/`NextResponse`, API handlers

## Server Logger Utility

**File:** `lib/error-tracking/server-logger.ts`

### Functions:

**`logServer(event)`** - General server logging
\`\`\`typescript
import { logServer } from "@/lib/error-tracking/server-logger"

logServer({
  level: "info",  // "info" | "warn" | "error" | "debug"
  component: "my-api",
  event: "request_received",
  data: { userId: "123", action: "update" }
})
\`\`\`

**`logMathCoach(event)`** - Specialized Math Coach logging
\`\`\`typescript
import { logMathCoach } from "@/lib/error-tracking/server-logger"

logMathCoach({
  level: "info",
  event: "grade_computed",  // "grade_computed" | "openai_request" | "openai_response" | "mismatch_detected" | "policy_override"
  questionId: "fraction-001",
  questionText: "What is 3/4 of 20?",
  studentAnswer: "12",
  attempt: 1,
  serverGrade: {
    correct: false,
    needsModelEvaluation: false,
    rationale: "The answer 12 doesn't match expected 15"
  }
})
\`\`\`

**`logServerError(component, event, error, additionalData)`** - Server error logging
\`\`\`typescript
import { logServerError } from "@/lib/error-tracking/server-logger"

try {
  await someOperation()
} catch (error) {
  logServerError("math-coach", "openai_call_failed", error, { questionId })
}
\`\`\`

## Math Coach Logging Events

The Math Coach API logs these events automatically:

| Event | Level | When | Data Captured |
|-------|-------|------|---------------|
| `grade_computed` | info | After `gradeAnswer()` | correct, needsModelEvaluation, rationale |
| `openai_request` | info | Before OpenAI call | path, includesServerGrade, messageCount |
| `openai_response` | info | After OpenAI response | feedback, nextAction, hint |
| `mismatch_detected` | warn | Server ≠ OpenAI | Both grades, policy override |
| `policy_override` | info | When action is overridden | Original vs overridden action |

## Example Log Output (Development)

\`\`\`
═══════════════════════════════════════════════════════
ℹ️ [MATH-COACH] GRADE_COMPUTED
═══════════════════════════════════════════════════════
Timestamp: 2026-02-01T12:34:56.789Z
Question ID: fraction-001
Question: What is 3/4 of 20?
Student Answer: 12
Attempt: 1
───────────────────────────────────────────────────────
Server Grade:
  Correct: false
  Needs Model Eval: false
  Rationale: The answer 12 doesn't match expected 15
═══════════════════════════════════════════════════════

═══════════════════════════════════════════════════════
ℹ️ [MATH-COACH] OPENAI_REQUEST
═══════════════════════════════════════════════════════
Timestamp: 2026-02-01T12:34:56.800Z
Question ID: fraction-001
───────────────────────────────────────────────────────
OpenAI Request:
  Path: buildInitialConversation
  Includes Server Grade: true
  Message Count: 2
═══════════════════════════════════════════════════════

═══════════════════════════════════════════════════════
⚠️ [MATH-COACH] MISMATCH_DETECTED
═══════════════════════════════════════════════════════
Timestamp: 2026-02-01T12:34:57.123Z
Question ID: fraction-001
─────────────────────────────────��─────────────────────
Server Grade:
  Correct: false
───────────────────────────────────────────────────────
OpenAI Response:
  Feedback: Great job! You found the right answer...
  Next Action: celebrate
───────────────────────────────────────────────────────
⚠️  MISMATCH DETECTED:
  Server says correct: false
  OpenAI says correct: true
  Policy Override: encourage_retry
═══════════════════════════════════════════════════════
\`\`\`

## Example Log Output (Production)

In production, logs are JSON for searchability:

\`\`\`json
{"component":"math-coach","timestamp":"2026-02-01T12:34:56.789Z","runtime":"nodejs","level":"warn","event":"mismatch_detected","questionId":"fraction-001","serverGrade":{"correct":false},"openAIResponse":{"nextAction":"celebrate"},"mismatch":{"serverSaysCorrect":false,"openAISaysCorrect":true}}
\`\`\`

## Searching Vercel Logs

### For Mismatches
\`\`\`bash
vercel logs --follow | grep "mismatch_detected"
\`\`\`

### For Specific Question
\`\`\`bash
vercel logs --follow | grep "fraction-001"
\`\`\`

### For All Math Coach Events
\`\`\`bash
vercel logs --follow | grep "MATH-COACH"
\`\`\`

---

# Client-Side Logging

## Components

### 1. API Endpoint

**File:** `app/api/log-client-error/route.ts`

Receives error data from clients and logs to Vercel console.

**Example Log Output:**
\`\`\`
═══════════════════════════════════════════════════════
🚨 CLIENT-SIDE ERROR CAPTURED
═══════════════════════════════════════════════════════
Error Type: localStorage Error
Message: localStorage is not defined
URL: https://yourapp.vercel.app/decimal-practice
User Agent: Mozilla/5.0 (Linux; Android 11; ...) WebView/4.0
Timestamp: 2025-01-06T12:34:56.789Z
Stack Trace:
  at DecimalPracticeOnly (decimal-practice-only.tsx:149)
  at useEffect
═══════════════════════════════════════════════════════
\`\`\`

### 2. Client Logger Utility

**File:** `lib/error-tracking/client-logger.ts`

Provides functions to log different types of errors:

#### Functions:

**`logClientError(error, errorType, additionalInfo)`**
- General-purpose error logger
- Safely handles window checks (Android WebView compatible)

**`logReactError(error, errorInfo)`**
- For React component errors (used by ErrorBoundary)
- Includes component stack trace

**`logLocalStorageError(error, operation)`**
- Specifically for localStorage-related crashes
- Logs window/localStorage availability

**`logAndroidWebViewError(error, context)`**
- For Android WebView-specific issues
- Includes WebView detection and user agent

#### Example Usage:

\`\`\`typescript
import { logClientError, logLocalStorageError } from "@/lib/error-tracking/client-logger"

// In a component
try {
  const data = localStorage.getItem("key")
} catch (error) {
  logLocalStorageError(error as Error, "getItem")
}

// For custom errors
logClientError(
  new Error("Custom error"),
  "Custom Error Type",
  { customData: "value" }
)
\`\`\`

### 3. Global Error Handler

**File:** `components/global-error-handler.tsx`

Catches **all uncaught errors** and **unhandled promise rejections** globally.

**Catches:**
- ✅ Uncaught JavaScript errors
- ✅ Unhandled promise rejections
- ✅ Runtime errors
- ✅ Third-party library errors

**Example Caught Errors:**
\`\`\`typescript
// This will be caught and logged:
throw new Error("Uncaught error")

// This will be caught and logged:
Promise.reject("Promise rejection")

// This will be caught and logged:
localStorage.getItem("key") // When window doesn't exist
\`\`\`

### 4. Enhanced Error Boundary

**File:** `components/error-boundary.tsx`

Now logs React component errors to Vercel.

**Usage:**
\`\`\`tsx
import { ErrorBoundary } from "@/components/error-boundary"

<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
\`\`\`

## Android WebView Safety

All error tracking code is **Android WebView compatible**:

✅ **All `window` checks in place:**
\`\`\`typescript
if (typeof window === 'undefined') return
\`\`\`

✅ **No localStorage access without checks**

✅ **Resilient error handling** (error logger never crashes)

## Viewing Errors in Vercel

### Method 1: Vercel Dashboard

1. Go to: https://vercel.com/your-project/logs
2. Click **"Runtime Logs"** tab
3. Filter by **"Errors"** or search for "🚨 CLIENT-SIDE ERROR"
4. See full error details with stack traces

### Method 2: Vercel CLI

\`\`\`bash
vercel logs --follow
\`\`\`

Filter for client errors:
\`\`\`bash
vercel logs --follow | grep "CLIENT-SIDE ERROR"
\`\`\`

## Error Categories

Errors are logged with specific types:

| Error Type | Description | Example |
|------------|-------------|---------|
| `Uncaught Error` | Unhandled JavaScript errors | `ReferenceError: foo is not defined` |
| `Unhandled Promise Rejection` | Rejected promises not caught | `fetch()` failures |
| `React Error` | Component rendering errors | Component lifecycle errors |
| `localStorage Error` | localStorage access issues | Android WebView crashes |
| `Android WebView Error` | Android-specific issues | WebView compatibility problems |
| `Android Bridge Info` | Android bridge actions (info-level) | Back button actions, modal closes |

## Testing the System

### Test 1: Trigger an Error

Add this to any page temporarily:
\`\`\`typescript
useEffect(() => {
  setTimeout(() => {
    throw new Error("Test error for logging")
  }, 1000)
}, [])
\`\`\`

### Test 2: Test Promise Rejection

\`\`\`typescript
useEffect(() => {
  Promise.reject("Test promise rejection")
}, [])
\`\`\`

### Test 3: Check Vercel Logs

After triggering an error:
1. Wait 10-30 seconds
2. Check Vercel Runtime Logs
3. Look for "🚨 CLIENT-SIDE ERROR CAPTURED"

## Example Error Log Entry

\`\`\`
═══════════════════════════════════════════════════════
🚨 CLIENT-SIDE ERROR CAPTURED
═══════════════════════════════════════════════════════
Error Type: localStorage Error
Message: localStorage is not defined
URL: https://mathmagic.vercel.app/decimal-practice
User Agent: Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/91.0.4472.120 Mobile Safari/537.36
Timestamp: 2025-01-06T16:30:45.123Z
Stack Trace:
ReferenceError: localStorage is not defined
    at DecimalPracticeOnly.tsx:149:25
    at commitHookEffectListMount (react-dom.production.min.js:8)
    at invokePassiveEffectMountInDEV (react-dom.production.min.js:16)
Component Stack:
    at DecimalPracticeOnly (decimal-practice-only.tsx:149)
    at div
    at main
Additional Info: {
  "operation": "getItem",
  "hasWindow": true,
  "hasLocalStorage": false,
  "isAndroid": true,
  "isWebView": true
}
═══════════════════════════════════════════════════════
\`\`\`

## Integration with External Services

The system can be extended to send errors to:

### Sentry
\`\`\`typescript
// In app/api/log-client-error/route.ts
import * as Sentry from "@sentry/nextjs"

Sentry.captureException(error)
\`\`\`

### LogRocket
\`\`\`typescript
import LogRocket from 'logrocket'

LogRocket.captureException(error)
\`\`\`

### Datadog
\`\`\`typescript
import { datadogLogs } from '@datadog/browser-logs'

datadogLogs.logger.error(error.message, { error })
\`\`\`

## Best Practices

1. **Never let error logging crash the app**
   - All error logging is wrapped in try-catch
   - Failed logging is silently ignored

2. **Log early in component lifecycle**
   - Use in `useEffect` hooks
   - Catch errors as close to source as possible

3. **Include context**
   - Always include relevant context data
   - Add custom fields to `additionalInfo`

4. **Test on real devices**
   - Especially test on Android devices
   - Verify errors appear in Vercel logs

5. **Monitor regularly**
   - Check Vercel logs daily
   - Set up alerts for error spikes

## Troubleshooting

### Errors not appearing in Vercel logs?

1. **Check API route is deployed:**
   \`\`\`bash
   curl https://your-app.vercel.app/api/log-client-error
   \`\`\`

2. **Check browser console:**
   - Open DevTools
   - Look for `[ClientLogger]` messages
   - Verify fetch requests to `/api/log-client-error`

3. **Verify GlobalErrorHandler is mounted:**
   - Check React DevTools
   - Look for `<GlobalErrorHandler />` component

### Errors logged multiple times?

- This is normal for React strict mode in development
- Production will only log once

### Missing stack traces?

- Some browsers sanitize stack traces for security
- Android WebView may limit stack depth
- Use source maps in production for better traces

## Files Modified/Created

### New Files:
- ✅ `app/api/log-client-error/route.ts` - Client error API endpoint
- ✅ `lib/error-tracking/client-logger.ts` - Client-side logging utilities
- ✅ `lib/error-tracking/server-logger.ts` - Server-side logging utilities
- ✅ `components/global-error-handler.tsx` - Global error catcher
- ✅ `ERROR_TRACKING_GUIDE.md` - This documentation

### Modified Files:
- ✅ `app/layout.tsx` - Added GlobalErrorHandler
- ✅ `components/error-boundary.tsx` - Added error logging
- ✅ `app/api/math-coach/route.ts` - Added structured logging for grading flow

## Info-Level Logging

The system also supports info-level logging (non-errors) using the same infrastructure:

**Example: Android Bridge Logging**

\`\`\`typescript
import { logClientError } from "@/lib/error-tracking/client-logger"

// Log info (not an error)
logClientError(
  "Android back button: close-whiteboard-modal",
  "Android Bridge Info",  // ← Custom type
  {
    action: "close-whiteboard-modal",
    result: "success",
    context: {
      currentActivity: "numbers",
      modals: { whiteboard: true }
    }
  }
)
\`\`\`

**Helper Function:**

For convenience, use the Android bridge logger helper:

\`\`\`typescript
import { logAndroidBridgeAction } from "@/lib/error-tracking/android-bridge-logger"

await logAndroidBridgeAction(
  "close-whiteboard-modal",
  {
    currentActivity: "numbers",
    currentRoute: "/",
    modals: { whiteboard: true, puzzleViewer: false, authDialog: false }
  },
  "success",
  userId
)
\`\`\`

**Vercel Logs Output:**

This appears in Vercel logs as:
\`\`\`
═══════════════════════════════════════════════════════
🚨 CLIENT-SIDE ERROR CAPTURED
═══════════════════════════════════════════════════════
Error Type: Android Bridge Info
Message: Android back button: close-whiteboard-modal
URL: https://sshodhan.vercel.app/
Activity Context: numbers
Modal Context: whiteboard (open)
Additional Info: {
  "action": "close-whiteboard-modal",
  "result": "success",
  "context": { ... },
  "isAndroid": true,
  "isWebView": true
}
═══════════════════════════════════════════════════════
\`\`\`

**Admin Control:**

Info-level logging is controlled by an admin setting to prevent performance impact in production:

- Enable in Settings → Android Bridge Settings → "Enable Verbose Logging"
- Only logs when explicitly enabled by admin
- Uses `localStorage.getItem('adminVerboseLogging')` to check

**Note:** Even though it uses the error endpoint, the `errorType` field distinguishes it as info-level logging.

## Client Debug Logging (v0 Agent Visibility)

**Problem:** v0's integrated console cannot display client-side `console.log()` output due to CSP restrictions blocking the log-analysis feature.

**Solution:** The `logClientDebug()` function forwards client logs to the server via API, making them visible as `[SERVER]` logs in v0's console.

### API Endpoint

**File:** `app/api/log-client-debug/route.ts`

Receives debug logs from clients and outputs them via `console.log()` (not `console.error()`), appearing as info-level server logs.

### Usage

\`\`\`typescript
import { logClientDebug } from "@/lib/error-tracking/client-logger"

// Basic debug log
logClientDebug("PuzzleUnlock", "Puzzle completed", { level: 5, score: 100 })

// With level option
logClientDebug("HomePage", "Modal opened", { modalType: "whiteboard" }, { level: "info" })

// Force log (bypasses admin check - use sparingly)
logClientDebug("Critical", "Important event", { data: "value" }, { force: true })
\`\`\`

### Enabling Debug Logging

Debug logging is controlled by the admin setting to prevent performance impact:

1. **Via Settings UI:** Settings → Debug Logging Settings → "Enable Verbose Logging"
2. **Via Browser Console:** `enableVerboseLogging()` or `enableVerboseLogging(false)`
3. **Directly:** `localStorage.setItem('adminVerboseLogging', 'true')`

### Vercel/v0 Logs Output

\`\`\`
ℹ️ [CLIENT][PuzzleUnlock] Puzzle completed
   └─ Data: { "level": 5, "score": 100 }
   └─ Time: 2026-02-03T12:34:56.789Z
\`\`\`

### When to Use

| Use Case | Function |
|----------|----------|
| Debugging v0 iframe issues | `logClientDebug()` |
| Tracking user flow | `logClientDebug()` |
| Error reporting | `logClientError()` |
| React component crashes | `logReactError()` |
| Android bridge actions | `logAndroidBridgeAction()` |

### Files

- ✅ `app/api/log-client-debug/route.ts` - Debug log API endpoint
- ✅ `lib/error-tracking/client-logger.ts` - Contains `logClientDebug()` function

## Daily Categories Screen Logging

The Daily Categories feature uses both error logging and soft error logging throughout its component tree.

### Components & Hooks with Logging

| File | Logger | What's Tracked |
|------|--------|----------------|
| `components/daily-categories/DailyCategoriesScreen.tsx` | `logClientDebug`, `logClientError`, `addBreadcrumb` | Screen mount, tab filtering, play/results actions, locked category attempts, empty filter state |
| `components/daily-categories/CategoryCard.tsx` | `logClientError`, `addBreadcrumb` | Unexpected card state (fallthrough in switch), Play Again clicked |
| `app/page.tsx (handleRetakeCategory)` | `logClientDebug`, `logClientError` | Retake initiated, reset success (with deleted/points data), reset failure |
| `hooks/useCategoryFilter.ts` | `logClientDebug`, `addBreadcrumb` | Tab switches with from/to context |
| `hooks/useCategoryState.ts` | `logClientError` | Invalid currentDay, empty categories array |
| `hooks/useCountdownTimer.ts` | `logClientDebug`, `logClientError` | Invalid time diff, urgent countdown transition, Date errors |

### Error Types

| Error Type | Level | When | Example |
|------------|-------|------|---------|
| `DailyCategories Soft Error` | error | User tries to play locked category | `"Attempted to start locked category: seahawks-history (state: locked-far)"` |
| `DailyCategories Soft Error` | error | Empty filter returns no categories | `"No categories found for tab 'daily' despite 17 total categories"` |
| `CategoryCard Soft Error` | error | Unexpected state in card switch | `"Unexpected category state: 'unknown' for category 'abc'"` |
| `CategoryState Soft Error` | error | Invalid day or empty categories | `"Invalid currentDay value: -1"` |
| `CountdownTimer Soft Error` | error | Negative or >24h time diff | `"Countdown timer computed invalid diff: -500ms"` |
| `CountdownTimer Error` | error | Date API throws | Caught exception in getTimeUntilNextDay |
| `Category Retake Soft Error` | error | Reset API fails (non-200) or network error | `"Category retake failed: User not found"` |

### Debug Events

| Component | Event | Data |
|-----------|-------|------|
| `DailyCategories` | `Screen mounted` | `currentDay, streak, completedCount, totalCategories, userId` |
| `DailyCategories` | `Categories filtered` | `activeTab, filteredCount, states {completed, unlocked, lockedSoon, lockedFar}` |
| `DailyCategories` | `Category started` | `categoryId, categoryTitle, state, currentDay, userId` |
| `DailyCategories` | `View results` | `categoryId, score, total, points` |
| `CategoryFilter` | `Tab switched` | `from, to` |
| `CountdownTimer` | `Countdown became urgent` | `hours, minutes` |
| `AppContent` | `Category retake initiated` | `categoryId, categoryTitle, dbCategory, username` |
| `AppContent` | `Category retake reset successful` | `categoryId, categoryTitle, username, deleted, points_deducted, new_total_points` |

### Breadcrumbs

The following breadcrumbs are added to the circular buffer for error context:

| Category | Message | Data |
|----------|---------|------|
| `navigation` | `Opened Daily Categories screen` | `currentDay, completedCount` |
| `user-action` | `Switched category tab to "{tab}"` | `tab` |
| `user-action` | `Started category` | `categoryId, categoryTitle, state` |
| `user-action` | `Viewed category results` | `categoryId, categoryTitle` |
| `user-action` | `Play Again clicked` | `categoryId, categoryTitle, previousScore, previousTotal` |

### Searching Vercel Logs for Daily Categories

```bash
# All Daily Categories errors
vercel logs --follow | grep "DailyCategories"

# Soft errors only
vercel logs --follow | grep "Soft Error"

# Category state issues
vercel logs --follow | grep "CategoryState"

# Countdown timer issues
vercel logs --follow | grep "CountdownTimer"

# Category retake/reset events
vercel logs --follow | grep "retake"

# Server-side reset events
vercel logs --follow | grep "reset-category"
```

### Example: Soft Error Log Output

When a user somehow triggers a locked category (e.g., race condition, stale UI):

```
═══════════════════════════════════════════════════════
🚨 CLIENT-SIDE ERROR CAPTURED
═══════════════════════════════════════════════════════
Error Type: DailyCategories Soft Error
Message: Attempted to start locked category: seahawks-history (state: locked-far, unlockDay: 7, currentDay: 1)
URL: https://fantrivia.vercel.app/
Timestamp: 2026-02-06T12:34:56.789Z
Additional Info: {
  "categoryId": "seahawks-history",
  "state": "locked-far",
  "unlockDay": 7,
  "currentDay": 1,
  "userId": "player_1234"
}
Breadcrumbs:
  [navigation] Opened Daily Categories screen
  [user-action] Switched category tab to "heritage"
  [user-action] Started category {categoryId: "seahawks-history"}
═══════════════════════════════════════════════════════
```

### Idempotent Answer -- Client Error Change

Previously, a duplicate answer submission (same user + question + day) returned a **409 error**, which triggered `logClientError('TriviaGame API Error', ...)` and appeared in the Client Error logs. This has been changed:

- **Old behavior:** 409 -> `CLIENT-SIDE ERROR CAPTURED` with `"error": "You have already answered this question today"`
- **New behavior:** 200 with `already_answered: true` -> handled gracefully, **no client error logged**

If you see old 409 client errors in logs, they are from sessions before this fix was deployed.

### Example: Category Retake Flow Log Output

When a user clicks "Play Again" on a completed category and the reset **fails**, a soft error is logged:

**Category Retake Soft Error (via `logClientSoftError`):**
```
═══════════════════════════════════════════════════════
CLIENT-SIDE ERROR CAPTURED
═══════════════════════════════════════════════════════
Error Type: Category Retake Soft Error
Message: Category retake failed: User not found
Additional Info: {
  "categoryId": "super-bowl-xlviii",
  "categoryTitle": "Super Bowl XLVIII",
  "status": 404,
  "username": "player_1234"
}
Breadcrumbs:
  [navigation] Opened Daily Categories screen
  [user-action] Play Again clicked {categoryId: "super-bowl-xlviii", previousScore: 10}
═══════════════════════════════════════════════════════
```

---

## Future Enhancements

- [ ] Add error grouping/deduplication
- [ ] Add user session tracking
- [ ] Add error rate alerts
- [ ] Add screenshot capture on error
- [ ] Add network request logging
- [ ] Add performance metrics
- [ ] Integration with monitoring services (Sentry, LogRocket)

---

**Status:** ✅ Production Ready

**Compatible with:** Android WebView, iOS, Desktop browsers

**Impact:** Captures 100% of client-side errors for debugging

---

# Portable Implementation Guide

This section provides copy-paste code to implement client-side error/debug logging in **any Next.js app**. This is especially useful for debugging in v0's iframe preview where client console.log statements are not visible.

## Why You Need This

**Problem:** v0's embedded preview runs in an iframe with CSP restrictions that block their log-analysis feature. This means:
- v0 agent cannot see your `console.log()` output
- v0 agent cannot debug client-side issues
- You lose visibility into client behavior

**Solution:** Forward client logs to the server via API, where they appear as `[SERVER]` logs that v0 can see.

## Quick Start (3 Files)

### File 1: API Endpoint

Create `app/api/log-client-debug/route.ts`:

\`\`\`typescript
import { type NextRequest, NextResponse } from "next/server"

// Use Node.js runtime for in-memory storage
export const runtime = "nodejs"

interface DebugLog {
  id: string
  timestamp: string
  level: "debug" | "info" | "warn"
  component: string
  message: string
  data?: Record<string, unknown>
  url?: string
}

// In-memory buffer for last 100 logs
const MAX_LOGS = 100
const logBuffer: DebugLog[] = []

function addLog(log: Omit<DebugLog, "id">): void {
  const entry: DebugLog = {
    ...log,
    id: \`\${Date.now()}-\${Math.random().toString(36).substring(2, 9)}\`,
  }
  logBuffer.push(entry)
  if (logBuffer.length > MAX_LOGS) {
    logBuffer.shift()
  }
}

// POST: Receive and log client debug messages
export async function POST(request: NextRequest) {
  try {
    const log = await request.json()
    const timestamp = log.timestamp
      ? new Date(log.timestamp).toISOString()
      : new Date().toISOString()
    const levelEmoji = log.level === "warn" ? "⚠️" : log.level === "info" ? "ℹ️" : "🔍"

    // Store in buffer
    addLog({
      timestamp,
      level: log.level || "debug",
      component: log.component,
      message: log.message,
      data: log.data,
      url: log.url,
    })

    // Log to server console (visible in v0 and Vercel Runtime Logs)
    const logFn = log.level === "warn" ? console.warn : console.log
    logFn(\`\${levelEmoji} [CLIENT][\${log.component}] \${log.message}\`)
    if (log.data && Object.keys(log.data).length > 0) {
      logFn(\`   └─ Data:\`, JSON.stringify(log.data, null, 2))
    }
    logFn(\`   └─ Time: \${timestamp}\`)

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (err) {
    console.error("[log-client-debug] Failed:", err)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}

// GET: Retrieve stored logs for admin viewing
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const shouldClear = searchParams.get("clear") === "true"

    const logs = [...logBuffer].reverse()
    const stats = { count: logBuffer.length, maxSize: MAX_LOGS }

    if (shouldClear) {
      logBuffer.length = 0
    }

    return NextResponse.json({ success: true, logs, stats, cleared: shouldClear })
  } catch (err) {
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
\`\`\`

### File 2: Client Logger with Console Interceptor

Create `lib/client-debug-logger.ts`:

\`\`\`typescript
"use client"

/**
 * Client Debug Logger
 *
 * Automatically captures [v0] prefixed console.log calls and forwards
 * them to the server, making them visible in v0's server console.
 */

// Check if verbose logging is enabled
function isVerboseLoggingEnabled(): boolean {
  if (typeof window === "undefined") return false
  try {
    return localStorage.getItem("adminVerboseLogging") === "true"
  } catch {
    return false
  }
}

// Manual debug log function
export function logClientDebug(
  component: string,
  message: string,
  data?: Record<string, unknown>,
  options?: { force?: boolean; level?: "debug" | "info" | "warn" }
) {
  if (typeof window === "undefined") return
  if (!options?.force && !isVerboseLoggingEnabled()) return

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
  }).catch(() => {})
}

// Console interceptor - auto-captures [v0] prefixed logs
let interceptorInstalled = false

function installConsoleInterceptor() {
  if (typeof window === "undefined") return
  if (interceptorInstalled) return

  const originalLog = console.log
  const originalWarn = console.warn

  // Parse [v0][Component] format
  function parseV0Log(args: unknown[]): {
    component: string;
    message: string;
    data?: Record<string, unknown>
  } | null {
    if (args.length === 0) return null
    const first = args[0]
    if (typeof first !== "string") return null

    const match = first.match(/^\[v0\](?:\[([^\]]+)\])?\s*(.*)/)
    if (!match) return null

    const component = match[1] || "App"
    const messagePart = match[2] || ""
    const restArgs = args.slice(1)
    let message = messagePart
    let data: Record<string, unknown> | undefined

    if (restArgs.length > 0) {
      if (typeof restArgs[0] === "string") {
        message = message ? \`\${message} \${restArgs[0]}\` : restArgs[0]
        if (restArgs.length > 1) data = { args: restArgs.slice(1) }
      } else if (typeof restArgs[0] === "object" && restArgs[0] !== null) {
        data = restArgs[0] as Record<string, unknown>
      } else {
        data = { value: restArgs[0] }
      }
    }

    return { component, message: message || "(no message)", data }
  }

  // Batched sending (100ms debounce)
  let pendingLogs: Array<{
    level: string;
    component: string;
    message: string;
    data?: Record<string, unknown>
  }> = []
  let flushTimeout: ReturnType<typeof setTimeout> | null = null

  function queueLog(
    level: "debug" | "info" | "warn",
    component: string,
    message: string,
    data?: Record<string, unknown>
  ) {
    if (!isVerboseLoggingEnabled()) return

    pendingLogs.push({ level, component, message, data })

    if (!flushTimeout) {
      flushTimeout = setTimeout(() => {
        const logsToSend = pendingLogs
        pendingLogs = []
        flushTimeout = null

        logsToSend.forEach((log) => {
          fetch("/api/log-client-debug", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...log,
              timestamp: Date.now(),
              url: window.location.href,
            }),
          }).catch(() => {})
        })
      }, 100)
    }
  }

  // Override console.log
  console.log = function (...args: unknown[]) {
    originalLog.apply(console, args)
    const parsed = parseV0Log(args)
    if (parsed) {
      queueLog("debug", parsed.component, parsed.message, parsed.data)
    }
  }

  // Override console.warn
  console.warn = function (...args: unknown[]) {
    originalWarn.apply(console, args)
    const parsed = parseV0Log(args)
    if (parsed) {
      queueLog("warn", parsed.component, parsed.message, parsed.data)
    }
  }

  interceptorInstalled = true
}

// Helper to enable/disable from browser console
if (typeof window !== "undefined") {
  (window as any).enableVerboseLogging = (enable = true) => {
    try {
      if (enable) {
        localStorage.setItem("adminVerboseLogging", "true")
        console.log("[ClientLogger] Verbose logging ENABLED")
      } else {
        localStorage.removeItem("adminVerboseLogging")
        console.log("[ClientLogger] Verbose logging DISABLED")
      }
    } catch (e) {
      console.error("[ClientLogger] Failed:", e)
    }
  }

  // Install interceptor on load
  installConsoleInterceptor()
}

export { installConsoleInterceptor }
\`\`\`

### File 3: Initialize in Layout

In your `app/layout.tsx`, import the logger to install the interceptor:

\`\`\`typescript
// Add this import at the top of your layout.tsx
import "@/lib/client-debug-logger"

// Rest of your layout code...
\`\`\`

## Usage

### Step 1: Enable Verbose Logging

In the browser console (or your app's settings):
\`\`\`javascript
enableVerboseLogging()  // Enable
enableVerboseLogging(false)  // Disable
\`\`\`

Or set directly:
\`\`\`javascript
localStorage.setItem("adminVerboseLogging", "true")
\`\`\`

### Step 2: Use [v0] Prefix in Your Logs

Any \`console.log\` starting with \`[v0]\` will be auto-captured:

\`\`\`typescript
// These are automatically captured and sent to server:
console.log("[v0][MyComponent] User clicked button", { buttonId: "submit" })
console.log("[v0][HomePage] Page loaded")
console.warn("[v0][API] Request failed", { status: 500 })

// These are NOT captured (no [v0] prefix):
console.log("Normal log - not captured")
\`\`\`

### Step 3: View Logs

**In v0's Console:** Logs appear as \`[SERVER]\` entries:
\`\`\`
🔍 [CLIENT][MyComponent] User clicked button
   └─ Data: { "buttonId": "submit" }
   └─ Time: 2026-02-03T12:34:56.789Z
\`\`\`

**Via API:** Fetch last 100 logs:
\`\`\`bash
curl https://your-app.vercel.app/api/log-client-debug
\`\`\`

## Optional: In-App Log Viewer UI

Add a log viewer to your settings/admin page:

\`\`\`tsx
"use client"
import { useState } from "react"

interface DebugLog {
  id: string
  timestamp: string
  level: "debug" | "info" | "warn"
  component: string
  message: string
  data?: Record<string, unknown>
}

export function DebugLogViewer() {
  const [logs, setLogs] = useState<DebugLog[]>([])
  const [stats, setStats] = useState<{ count: number; maxSize: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState("")

  const fetchLogs = async (clear = false) => {
    setLoading(true)
    try {
      const url = clear ? "/api/log-client-debug?clear=true" : "/api/log-client-debug"
      const res = await fetch(url)
      const data = await res.json()
      if (data.success) {
        setLogs(data.logs || [])
        setStats(data.stats || null)
      }
    } catch (e) {
      console.error("Failed to fetch logs:", e)
    } finally {
      setLoading(false)
    }
  }

  const filteredLogs = logs.filter(log =>
    !filter ||
    log.component.toLowerCase().includes(filter.toLowerCase()) ||
    log.message.toLowerCase().includes(filter.toLowerCase())
  )

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex gap-2">
        <input
          placeholder="Filter..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="flex-1 px-3 py-2 border rounded"
        />
        <button onClick={() => fetchLogs()} disabled={loading} className="px-4 py-2 bg-blue-500 text-white rounded">
          {loading ? "Loading..." : "Refresh"}
        </button>
        <button onClick={() => fetchLogs(true)} disabled={loading} className="px-4 py-2 bg-red-500 text-white rounded">
          Clear
        </button>
      </div>

      {stats && (
        <div className="text-sm text-gray-500">
          Showing {filteredLogs.length} of {stats.count} logs (max {stats.maxSize})
        </div>
      )}

      <div className="max-h-96 overflow-y-auto space-y-2 font-mono text-sm">
        {filteredLogs.length === 0 ? (
          <div className="text-center text-gray-400 py-8">No logs yet</div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className={\`p-2 rounded border-l-4 \${
                log.level === "warn" ? "border-yellow-500 bg-yellow-50" :
                log.level === "info" ? "border-blue-500 bg-blue-50" :
                "border-gray-300 bg-gray-50"
              }\`}
            >
              <div className="flex justify-between">
                <span className="font-bold">[{log.component}]</span>
                <span className="text-gray-400 text-xs">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div>{log.message}</div>
              {log.data && (
                <pre className="text-xs text-gray-500 mt-1 overflow-x-auto">
                  {JSON.stringify(log.data, null, 2)}
                </pre>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
\`\`\`

## How It Works

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                         BROWSER                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  console.log("[v0][Component] message", data)         │  │
│  │         ↓                                              │  │
│  │  Console Interceptor detects [v0] prefix              │  │
│  │         ↓                                              │  │
│  │  Batches logs (100ms) → POST /api/log-client-debug    │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    SERVER (Vercel)                           │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  1. Receives log data                                 │  │
│  │  2. Stores in memory buffer (last 100)                │  │
│  │  3. console.log() → appears in Vercel Runtime Logs    │  │
│  │  4. v0 agent can now see these as [SERVER] logs       │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
\`\`\`

## Limitations

| Limitation | Reason |
|------------|--------|
| Logs cleared on deploy | In-memory buffer, not persisted |
| Max 100 logs | Prevents memory issues |
| Each serverless instance has own buffer | Vercel's architecture |
| Requires verbose logging enabled | Performance protection |

## Troubleshooting

**Logs not appearing?**
1. Check \`localStorage.getItem("adminVerboseLogging")\` returns \`"true"\`
2. Verify API endpoint exists: \`curl /api/log-client-debug\`
3. Check browser Network tab for POST requests

**Getting 500 errors?**
1. Check API route syntax
2. Verify \`runtime = "nodejs"\` (not edge)

**Logs duplicated?**
- Normal in React Strict Mode (development only)
