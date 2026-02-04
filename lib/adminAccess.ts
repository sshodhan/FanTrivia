import { NextRequest, NextResponse } from 'next/server'

const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY || 'development-admin-secret'
const ADMIN_STORAGE_KEY = 'hawktrivia_admin_token'

// In-memory store (use Redis in production)
const adminTokens = new Map<string, { createdAt: number }>()
const TOKEN_TTL = 24 * 60 * 60 * 1000 // 24 hours

/**
 * Generate a random admin token
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
 * Create a new admin token
 */
export function createAdminToken(): string {
  // Clean up expired tokens
  const now = Date.now()
  for (const [token, data] of adminTokens.entries()) {
    if (now - data.createdAt > TOKEN_TTL) {
      adminTokens.delete(token)
    }
  }

  const token = generateAdminToken()
  adminTokens.set(token, { createdAt: now })
  return token
}

/**
 * Validate an admin token
 */
export function validateAdminToken(token: string): boolean {
  const data = adminTokens.get(token)
  if (!data) return false

  const now = Date.now()
  if (now - data.createdAt > TOKEN_TTL) {
    adminTokens.delete(token)
    return false
  }

  return true
}

/**
 * Invalidate an admin token
 */
export function invalidateAdminToken(token: string): void {
  adminTokens.delete(token)
}

/**
 * Middleware helper to check admin access
 */
export function requireAdmin(request: NextRequest): {
  authenticated: boolean
  error?: NextResponse
} {
  const header = request.headers.get('authorization')

  if (!header) {
    return {
      authenticated: false,
      error: NextResponse.json(
        { error: 'Admin access required' },
        { status: 401 }
      )
    }
  }

  const token = header.replace('Bearer ', '')

  // Validate against registered tokens only
  // This ensures TTL enforcement - admins must use /api/admin/login
  if (validateAdminToken(token)) {
    return { authenticated: true }
  }

  return {
    authenticated: false,
    error: NextResponse.json(
      { error: 'Invalid or expired admin token' },
      { status: 401 }
    )
  }
}

/**
 * Client-side helper to check admin status
 */
export function isAdminActive(): boolean {
  if (typeof window === 'undefined') return false
  const token = localStorage.getItem(ADMIN_STORAGE_KEY)
  return Boolean(token)
}

/**
 * Client-side helper to get admin token
 */
export function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(ADMIN_STORAGE_KEY)
}

/**
 * Client-side helper to set admin token
 */
export function setAdminToken(token: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(ADMIN_STORAGE_KEY, token)
}

/**
 * Client-side helper to clear admin token
 */
export function clearAdminToken(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(ADMIN_STORAGE_KEY)
}

// Legacy exports for backward compatibility (deprecated, will be removed)
export const createAdminSession = createAdminToken
export const validateAdminSession = validateAdminToken
export const invalidateAdminSession = invalidateAdminToken
export const isAdminAuthenticated = isAdminActive
export const clearAdminSession = clearAdminToken
