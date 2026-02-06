import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Check if Supabase is configured
export const isSupabaseConfigured = () => {
  return Boolean(supabaseUrl && supabaseAnonKey)
}

// Browser client for frontend use
export const createSupabaseBrowserClient = () => {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase is not configured.')
    return null
  }
  return createClient<Database>(supabaseUrl, supabaseAnonKey)
}

// Server client for API routes (using anon key)
export const createSupabaseServerClient = () => {
  if (!isSupabaseConfigured()) {
    return null
  }
  return createClient<Database>(supabaseUrl, supabaseAnonKey)
}

// Admin client with service role for privileged operations
export const createSupabaseAdminClient = () => {
  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('Supabase admin client not configured')
    return null
  }
  return createClient<Database>(supabaseUrl, supabaseServiceKey)
}

// Singleton instances for browser use
let browserClient: SupabaseClient<Database> | null = null

export const getSupabaseBrowserClient = () => {
  if (!browserClient && isSupabaseConfigured()) {
    browserClient = createClient<Database>(supabaseUrl, supabaseAnonKey)
  }
  return browserClient
}

// --- Demo mode: controlled by admin setting in game_settings table ---
// Cached demo mode value to avoid hitting DB on every request
let demoModeCache: { value: boolean; timestamp: number } | null = null
const DEMO_MODE_CACHE_TTL = 30_000 // 30 seconds

/**
 * Check if demo mode is enabled via the admin setting in game_settings.
 * Uses Supabase by default. Demo mode must be explicitly enabled by an admin.
 * Results are cached for 30 seconds to minimize DB queries.
 */
export async function checkDemoMode(): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    // Supabase not configured — cannot check DB, default to not demo
    return false
  }

  // Return cached value if still fresh
  if (demoModeCache && Date.now() - demoModeCache.timestamp < DEMO_MODE_CACHE_TTL) {
    return demoModeCache.value
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey)
    const { data, error } = await supabase
      .from('game_settings')
      .select('demo_mode')
      .eq('id', 1)
      .single()

    if (error || !data) {
      // On error, default to false (use Supabase)
      demoModeCache = { value: false, timestamp: Date.now() }
      return false
    }

    const isDemoMode = data.demo_mode === true
    demoModeCache = { value: isDemoMode, timestamp: Date.now() }
    return isDemoMode
  } catch {
    demoModeCache = { value: false, timestamp: Date.now() }
    return false
  }
}

/** Invalidate the demo mode cache (call after admin updates demo_mode setting) */
export function invalidateDemoModeCache() {
  demoModeCache = null
}
