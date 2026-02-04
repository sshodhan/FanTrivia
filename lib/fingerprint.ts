import FingerprintJS from '@fingerprintjs/fingerprintjs'

const FINGERPRINT_STORAGE_KEY = 'hawktrivia_device_fp'

// Cache the fingerprint promise to avoid multiple initializations
let fingerprintPromise: Promise<string> | null = null

/**
 * Generates a unique device fingerprint using FingerprintJS
 * Falls back to a simpler hash if FingerprintJS fails
 */
export async function getDeviceFingerprint(): Promise<string> {
  // Return cached promise if exists
  if (fingerprintPromise) {
    return fingerprintPromise
  }

  fingerprintPromise = generateFingerprint()
  return fingerprintPromise
}

async function generateFingerprint(): Promise<string> {
  // Check localStorage first for consistency
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(FINGERPRINT_STORAGE_KEY)
    if (stored) {
      return stored
    }
  }

  try {
    // Use FingerprintJS for robust fingerprinting
    const fp = await FingerprintJS.load()
    const result = await fp.get()
    const fingerprint = result.visitorId

    // Store for consistency
    if (typeof window !== 'undefined') {
      localStorage.setItem(FINGERPRINT_STORAGE_KEY, fingerprint)
    }

    return fingerprint
  } catch {
    // Fallback to simple fingerprint
    const fallbackFingerprint = generateFallbackFingerprint()

    if (typeof window !== 'undefined') {
      localStorage.setItem(FINGERPRINT_STORAGE_KEY, fallbackFingerprint)
    }

    return fallbackFingerprint
  }
}

/**
 * Generate a simple fallback fingerprint using available browser characteristics
 */
function generateFallbackFingerprint(): string {
  if (typeof window === 'undefined') {
    return `server_${Date.now()}_${Math.random().toString(36).slice(2)}`
  }

  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || 0,
    // Canvas fingerprint
    getCanvasFingerprint(),
  ]

  // Simple hash function
  const hash = simpleHash(components.join('|'))
  return `fb_${hash}`
}

/**
 * Generate a canvas-based fingerprint component
 */
function getCanvasFingerprint(): string {
  try {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return 'no-canvas'

    canvas.width = 200
    canvas.height = 50

    ctx.textBaseline = 'top'
    ctx.font = '14px Arial'
    ctx.fillStyle = '#001f3f'
    ctx.fillRect(0, 0, 200, 50)
    ctx.fillStyle = '#69BE28'
    ctx.fillText('Hawktrivia Canvas FP', 2, 15)

    return canvas.toDataURL().slice(-50)
  } catch {
    return 'canvas-error'
  }
}

/**
 * Simple string hash function
 */
function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36)
}

/**
 * Clear stored fingerprint (for testing purposes)
 */
export function clearStoredFingerprint(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(FINGERPRINT_STORAGE_KEY)
    fingerprintPromise = null
  }
}

/**
 * Generate a session token for the team
 */
export function generateSessionToken(): string {
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
  return `ses_${timestamp}_${randomPart}`
}
