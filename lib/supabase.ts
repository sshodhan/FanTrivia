import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'
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
    console.warn('Supabase is not configured. Using mock data.')
    return null
  }
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
}

// Server client for API routes (using anon key)
export const createSupabaseServerClient = () => {
  if (!isSupabaseConfigured()) {
    return null
  }
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Admin client with service role for privileged operations
export const createSupabaseAdminClient = () => {
  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('Supabase admin client not configured')
    return null
  }
  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Singleton instances for browser use
let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null

export const getSupabaseBrowserClient = () => {
  if (!browserClient && isSupabaseConfigured()) {
    browserClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
  }
  return browserClient
}

// Helper to check if we're in demo mode (no Supabase)
export const isDemoMode = () => !isSupabaseConfigured()
