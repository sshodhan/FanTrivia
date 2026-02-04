import { NextRequest, NextResponse } from 'next/server'

const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY || 'development-admin-secret'
const ADMIN_SESSION_KEY = 'hawktrivia_admin_session'

// In-memory session store (use Redis in production)
const adminSessions = new Map<string, { createdAt: number }>()
const SESSION_TTL = 24 * 60 * 60 * 1000 // 24 hours

/**
 * Generate a random admin session token
 */
function generateAdminToken(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
  return `admin_${timestamp}_${random}`
}

/**
 * Validate admin secret key
 */
export function validateAdminSecret(secret: string): boolean {
  return secret === ADMIN_SECRET
}

/**
 * Create a new admin session
 */
export function createAdminSession(): string {
  // Clean up expired sessions
  const now = Date.now()
  for (const [token, session] of adminSessions.entries()) {
    if (now - session.createdAt > SESSION_TTL) {
      adminSessions.delete(token)
    }
  }

  const token = generateAdminToken()
  adminSessions.set(token, { createdAt: now })
  return token
}

/**
 * Validate an admin session token
 */
export function validateAdminSession(token: string): boolean {
  const session = adminSessions.get(token)
  if (!session) return false

  const now = Date.now()
  if (now - session.createdAt > SESSION_TTL) {
    adminSessions.delete(token)
    return false
  }

  return true
}

/**
 * Invalidate an admin session
 */
export function invalidateAdminSession(token: string): void {
  adminSessions.delete(token)
}

/**
 * Middleware helper to check admin authentication
 */
export function requireAdmin(request: NextRequest): {
  authenticated: boolean
  error?: NextResponse
} {
  const authHeader = request.headers.get('authorization')

  if (!authHeader) {
    return {
      authenticated: false,
      error: NextResponse.json(
        { error: 'Admin authentication required' },
        { status: 401 }
      )
    }
  }

  const token = authHeader.replace('Bearer ', '')

  // Check if it's the admin secret directly (for simple auth)
  if (token === ADMIN_SECRET) {
    return { authenticated: true }
  }

  // Check if it's a valid session token
  if (validateAdminSession(token)) {
    return { authenticated: true }
  }

  return {
    authenticated: false,
    error: NextResponse.json(
      { error: 'Invalid or expired admin session' },
      { status: 401 }
    )
  }
}

/**
 * Client-side helper to check admin status
 */
export function isAdminAuthenticated(): boolean {
  if (typeof window === 'undefined') return false
  const session = localStorage.getItem(ADMIN_SESSION_KEY)
  return Boolean(session)
}

/**
 * Client-side helper to get admin token
 */
export function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(ADMIN_SESSION_KEY)
}

/**
 * Client-side helper to set admin token
 */
export function setAdminToken(token: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(ADMIN_SESSION_KEY, token)
}

/**
 * Client-side helper to clear admin session
 */
export function clearAdminSession(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(ADMIN_SESSION_KEY)
}
