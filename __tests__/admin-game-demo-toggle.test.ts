import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// --- Mocks ---

const mockCheckDemoMode = vi.fn<() => Promise<boolean>>()
const mockInvalidateDemoModeCache = vi.fn()

const mockSupabaseSingle = vi.fn()
const mockSupabaseSelect = vi.fn(() => ({ single: mockSupabaseSingle }))
const mockSupabaseEq = vi.fn(() => ({ select: mockSupabaseSelect }))
const mockSupabaseUpdate = vi.fn(() => ({ eq: mockSupabaseEq }))
const mockSupabaseInsert = vi.fn().mockResolvedValue({ error: null })
const mockSupabaseFrom = vi.fn((table: string) => {
  if (table === 'admin_action_logs') {
    return { insert: mockSupabaseInsert }
  }
  return {
    select: vi.fn(() => ({ eq: vi.fn(() => ({ single: mockSupabaseSingle })) })),
    update: mockSupabaseUpdate,
  }
})

const mockCreateSupabaseAdminClient = vi.fn(() => ({
  from: mockSupabaseFrom,
}))

vi.mock('@/lib/supabase', () => ({
  checkDemoMode: (...args: unknown[]) => mockCheckDemoMode(...(args as [])),
  invalidateDemoModeCache: (...args: unknown[]) => mockInvalidateDemoModeCache(...(args as [])),
  createSupabaseAdminClient: (...args: unknown[]) => mockCreateSupabaseAdminClient(...(args as [])),
  isSupabaseConfigured: vi.fn(() => true),
}))

vi.mock('@/lib/admin-auth', () => ({
  validateAdminAccess: vi.fn().mockResolvedValue(null),
  getUsernameFromRequest: vi.fn().mockReturnValue('admin-user'),
}))

vi.mock('@/lib/error-tracking/server-logger', () => ({
  logServer: vi.fn(),
  logTrivia: vi.fn(),
  logServerError: vi.fn(),
}))

// Mock mock-data to avoid import issues
vi.mock('@/lib/mock-data', () => ({
  sampleQuestions: [],
}))

function makeRequest(url: string, options?: RequestInit): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'), options)
}

describe('GET /api/admin/game', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns demo game settings when demo mode is on', async () => {
    mockCheckDemoMode.mockResolvedValue(true)

    const { GET } = await import('@/app/api/admin/game/route')
    const req = makeRequest('/api/admin/game', {
      headers: { 'x-username': 'admin-user' },
    })
    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.game_settings).toBeDefined()
    expect(body.game_settings.demo_mode).toBe(true)
    expect(body.game_settings.current_mode).toBe('daily')
  })

  it('fetches settings from DB when demo mode is off', async () => {
    mockCheckDemoMode.mockResolvedValue(false)

    const dbSettings = {
      id: 1,
      current_mode: 'live',
      questions_per_day: 10,
      timer_duration: 20,
      scores_locked: true,
      current_day: 'day_1',
      live_question_index: 3,
      is_paused: false,
      demo_mode: false,
      updated_at: '2026-02-06T00:00:00Z',
    }
    mockSupabaseSingle.mockResolvedValue({ data: dbSettings, error: null })

    const { GET } = await import('@/app/api/admin/game/route')
    const req = makeRequest('/api/admin/game', {
      headers: { 'x-username': 'admin-user' },
    })
    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.game_settings).toEqual(dbSettings)
  })

  it('returns 503 when demo mode is off and admin client is null', async () => {
    mockCheckDemoMode.mockResolvedValue(false)
    mockCreateSupabaseAdminClient.mockReturnValue(null)

    const { GET } = await import('@/app/api/admin/game/route')
    const req = makeRequest('/api/admin/game', {
      headers: { 'x-username': 'admin-user' },
    })
    const res = await GET(req)

    expect(res.status).toBe(503)
  })
})

describe('PATCH /api/admin/game - demo_mode toggle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset to return a valid client
    mockCreateSupabaseAdminClient.mockReturnValue({
      from: mockSupabaseFrom,
    })
  })

  it('toggles demo_mode ON and invalidates cache', async () => {
    const updatedSettings = {
      id: 1,
      demo_mode: true,
      updated_at: '2026-02-06T12:00:00Z',
    }
    mockSupabaseSingle.mockResolvedValue({ data: updatedSettings, error: null })

    const { PATCH } = await import('@/app/api/admin/game/route')
    const req = makeRequest('/api/admin/game', {
      method: 'PATCH',
      headers: { 'x-username': 'admin-user' },
      body: JSON.stringify({ demo_mode: true }),
    })
    const res = await PATCH(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.game_settings).toEqual(updatedSettings)
    // Cache must be invalidated
    expect(mockInvalidateDemoModeCache).toHaveBeenCalledTimes(1)
  })

  it('toggles demo_mode OFF and invalidates cache', async () => {
    const updatedSettings = {
      id: 1,
      demo_mode: false,
      updated_at: '2026-02-06T12:00:00Z',
    }
    mockSupabaseSingle.mockResolvedValue({ data: updatedSettings, error: null })

    const { PATCH } = await import('@/app/api/admin/game/route')
    const req = makeRequest('/api/admin/game', {
      method: 'PATCH',
      headers: { 'x-username': 'admin-user' },
      body: JSON.stringify({ demo_mode: false }),
    })
    const res = await PATCH(req)

    expect(res.status).toBe(200)
    expect(mockInvalidateDemoModeCache).toHaveBeenCalledTimes(1)
  })

  it('always uses real DB for demo_mode toggle (not demo fallback)', async () => {
    // Even if checkDemoMode would return true, the toggle should bypass it
    mockCheckDemoMode.mockResolvedValue(true)

    const updatedSettings = { id: 1, demo_mode: false }
    mockSupabaseSingle.mockResolvedValue({ data: updatedSettings, error: null })

    const { PATCH } = await import('@/app/api/admin/game/route')
    const req = makeRequest('/api/admin/game', {
      method: 'PATCH',
      headers: { 'x-username': 'admin-user' },
      body: JSON.stringify({ demo_mode: false }),
    })
    const res = await PATCH(req)

    expect(res.status).toBe(200)
    // createSupabaseAdminClient should be called (real DB, not demo fallback)
    expect(mockCreateSupabaseAdminClient).toHaveBeenCalled()
    // checkDemoMode should NOT have been called for the toggle path
    expect(mockCheckDemoMode).not.toHaveBeenCalled()
  })

  it('returns 503 when DB is unavailable for demo_mode toggle', async () => {
    mockCreateSupabaseAdminClient.mockReturnValue(null)

    const { PATCH } = await import('@/app/api/admin/game/route')
    const req = makeRequest('/api/admin/game', {
      method: 'PATCH',
      headers: { 'x-username': 'admin-user' },
      body: JSON.stringify({ demo_mode: true }),
    })
    const res = await PATCH(req)

    expect(res.status).toBe(503)
    expect(mockInvalidateDemoModeCache).not.toHaveBeenCalled()
  })

  it('returns 500 when DB update fails for demo_mode toggle', async () => {
    mockSupabaseSingle.mockResolvedValue({
      data: null,
      error: { message: 'update failed' },
    })

    const { PATCH } = await import('@/app/api/admin/game/route')
    const req = makeRequest('/api/admin/game', {
      method: 'PATCH',
      headers: { 'x-username': 'admin-user' },
      body: JSON.stringify({ demo_mode: true }),
    })
    const res = await PATCH(req)

    expect(res.status).toBe(500)
    // Cache should NOT be invalidated on failure
    expect(mockInvalidateDemoModeCache).not.toHaveBeenCalled()
  })

  it('logs admin action to admin_action_logs on successful toggle', async () => {
    mockSupabaseSingle.mockResolvedValue({
      data: { id: 1, demo_mode: true },
      error: null,
    })

    const { PATCH } = await import('@/app/api/admin/game/route')
    const req = makeRequest('/api/admin/game', {
      method: 'PATCH',
      headers: { 'x-username': 'admin-user' },
      body: JSON.stringify({ demo_mode: true }),
    })
    await PATCH(req)

    // Should have inserted into admin_action_logs
    expect(mockSupabaseFrom).toHaveBeenCalledWith('admin_action_logs')
    expect(mockSupabaseInsert).toHaveBeenCalledWith({
      action_type: 'demo_mode_toggle',
      target_type: 'game_settings',
      target_id: null,
      details: { demo_mode: true },
    })
  })
})

describe('PATCH /api/admin/game - non-demo settings in demo mode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateSupabaseAdminClient.mockReturnValue({
      from: mockSupabaseFrom,
    })
  })

  it('updates in-memory demo settings when demo mode is on', async () => {
    mockCheckDemoMode.mockResolvedValue(true)

    const { PATCH } = await import('@/app/api/admin/game/route')
    const req = makeRequest('/api/admin/game', {
      method: 'PATCH',
      headers: { 'x-username': 'admin-user' },
      body: JSON.stringify({ current_mode: 'live', timer_duration: 30 }),
    })
    const res = await PATCH(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.game_settings.current_mode).toBe('live')
    expect(body.game_settings.timer_duration).toBe(30)
    // Should NOT have called the DB for these non-demo_mode updates
    expect(mockCreateSupabaseAdminClient).not.toHaveBeenCalled()
  })
})
