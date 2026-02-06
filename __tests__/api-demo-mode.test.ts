import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// --- Shared mocks ---

// Mock checkDemoMode and invalidateDemoModeCache
const mockCheckDemoMode = vi.fn<() => Promise<boolean>>()
const mockInvalidateDemoModeCache = vi.fn()

vi.mock('@/lib/supabase', () => ({
  checkDemoMode: (...args: unknown[]) => mockCheckDemoMode(...(args as [])),
  invalidateDemoModeCache: (...args: unknown[]) => mockInvalidateDemoModeCache(...(args as [])),
  createSupabaseAdminClient: vi.fn(() => null),
  isSupabaseConfigured: vi.fn(() => true),
}))

// Mock admin-auth
vi.mock('@/lib/admin-auth', () => ({
  validateAdminAccess: vi.fn().mockResolvedValue(null), // authorized
  getUsernameFromRequest: vi.fn().mockReturnValue('admin-user'),
}))

// Mock server logger (no-op)
vi.mock('@/lib/error-tracking/server-logger', () => ({
  logServer: vi.fn(),
  logTrivia: vi.fn(),
  logServerError: vi.fn(),
}))

// Mock @supabase/supabase-js (for routes that use createClient directly)
const mockSupabaseSingle = vi.fn()
const mockSupabaseEq = vi.fn(() => ({ single: mockSupabaseSingle }))
const mockSupabaseSelect = vi.fn(() => ({ eq: mockSupabaseEq }))
const mockSupabaseFrom = vi.fn(() => ({ select: mockSupabaseSelect }))
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: mockSupabaseFrom,
  })),
}))

function makeRequest(url: string, options?: RequestInit): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'), options)
}

// =============================================
// Scoreboard Route
// =============================================
describe('GET /api/scoreboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns demo leaderboard when demo mode is enabled', async () => {
    mockCheckDemoMode.mockResolvedValue(true)

    const { GET } = await import('@/app/api/scoreboard/route')
    const req = makeRequest('/api/scoreboard')
    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.leaderboard).toBeDefined()
    expect(body.leaderboard.length).toBeGreaterThan(0)
    expect(body.leaderboard[0]).toHaveProperty('username')
    expect(body.leaderboard[0]).toHaveProperty('rank')
    expect(body.leaderboard[0]).toHaveProperty('total_points')
  })

  it('returns 503 when demo mode is off and DB is unavailable', async () => {
    mockCheckDemoMode.mockResolvedValue(false)
    // getSupabase() returns null when env vars are empty — mock env
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '')
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '')

    // Need fresh import since env vars are read at module load
    vi.resetModules()
    // Re-apply mocks after resetModules
    vi.doMock('@/lib/supabase', () => ({
      checkDemoMode: mockCheckDemoMode,
      invalidateDemoModeCache: mockInvalidateDemoModeCache,
      createSupabaseAdminClient: vi.fn(() => null),
      isSupabaseConfigured: vi.fn(() => true),
    }))
    vi.doMock('@/lib/error-tracking/server-logger', () => ({
      logServer: vi.fn(),
      logTrivia: vi.fn(),
      logServerError: vi.fn(),
    }))
    vi.doMock('@supabase/supabase-js', () => ({
      createClient: vi.fn(() => ({
        from: mockSupabaseFrom,
      })),
    }))

    const { GET } = await import('@/app/api/scoreboard/route')
    const req = makeRequest('/api/scoreboard')
    const res = await GET(req)

    expect(res.status).toBe(503)
    const body = await res.json()
    expect(body.error).toBeDefined()
  })
})

// =============================================
// Register Route
// =============================================
describe('POST /api/register', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns mock user in demo mode', async () => {
    mockCheckDemoMode.mockResolvedValue(true)

    const { POST } = await import('@/app/api/register/route')
    const req = makeRequest('/api/register', {
      method: 'POST',
      body: JSON.stringify({ username: 'TestUser', avatar: 'hawk' }),
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.user).toBeDefined()
    expect(body.user.username).toBe('TestUser')
    expect(body.user.avatar).toBe('hawk')
    expect(body.user.total_points).toBe(0)
    expect(body.isNew).toBe(true)
  })

  it('validates username even in demo mode', async () => {
    mockCheckDemoMode.mockResolvedValue(true)

    const { POST } = await import('@/app/api/register/route')
    const req = makeRequest('/api/register', {
      method: 'POST',
      body: JSON.stringify({ username: 'X', avatar: 'hawk' }), // too short
    })
    const res = await POST(req)

    expect(res.status).toBe(400)
  })

  it('validates avatar even in demo mode', async () => {
    mockCheckDemoMode.mockResolvedValue(true)

    const { POST } = await import('@/app/api/register/route')
    const req = makeRequest('/api/register', {
      method: 'POST',
      body: JSON.stringify({ username: 'TestUser', avatar: 'invalid_avatar' }),
    })
    const res = await POST(req)

    expect(res.status).toBe(400)
  })
})

describe('GET /api/register', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns exists: false in demo mode', async () => {
    mockCheckDemoMode.mockResolvedValue(true)

    const { GET } = await import('@/app/api/register/route')
    const req = makeRequest('/api/register?username=TestUser')
    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.exists).toBe(false)
    expect(body.user).toBeNull()
  })

  it('returns 400 when username is missing', async () => {
    const { GET } = await import('@/app/api/register/route')
    const req = makeRequest('/api/register')
    const res = await GET(req)

    expect(res.status).toBe(400)
  })
})

// =============================================
// Trivia Daily Route
// =============================================
describe('GET /api/trivia/daily', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns demo questions when demo mode is enabled', async () => {
    mockCheckDemoMode.mockResolvedValue(true)

    const { GET } = await import('@/app/api/trivia/daily/route')
    const req = makeRequest('/api/trivia/daily')
    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.day_identifier).toBe('demo')
    expect(body.data_source).toBe('demo')
    expect(body.questions).toBeDefined()
    expect(body.questions.length).toBeGreaterThan(0)
    // Verify demo questions have required fields
    const q = body.questions[0]
    expect(q).toHaveProperty('question_text')
    expect(q).toHaveProperty('option_a')
    expect(q).toHaveProperty('option_b')
    expect(q).toHaveProperty('option_c')
    expect(q).toHaveProperty('option_d')
    // Verify correct answer is NOT included (stripped)
    expect(q).not.toHaveProperty('correct_answer')
  })
})

// =============================================
// Trivia Daily Answer Route
// =============================================
describe('POST /api/trivia/daily/answer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('grades demo answers correctly when demo mode is on', async () => {
    mockCheckDemoMode.mockResolvedValue(true)

    const { POST } = await import('@/app/api/trivia/daily/answer/route')
    // demo-1 correct answer is 'b' (2013)
    const req = makeRequest('/api/trivia/daily/answer', {
      method: 'POST',
      body: JSON.stringify({
        username: 'testuser',
        question_id: 'demo-1',
        selected_answer: 'b',
        time_taken_ms: 5000,
      }),
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.is_correct).toBe(true)
    expect(body.correct_answer).toBe('b')
    expect(body.points_earned).toBeGreaterThan(0)
  })

  it('grades incorrect demo answers', async () => {
    mockCheckDemoMode.mockResolvedValue(true)

    const { POST } = await import('@/app/api/trivia/daily/answer/route')
    const req = makeRequest('/api/trivia/daily/answer', {
      method: 'POST',
      body: JSON.stringify({
        username: 'testuser',
        question_id: 'demo-1',
        selected_answer: 'a', // wrong, correct is 'b'
        time_taken_ms: 5000,
      }),
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.is_correct).toBe(false)
    expect(body.correct_answer).toBe('b')
  })

  it('returns 404 for unknown demo question', async () => {
    mockCheckDemoMode.mockResolvedValue(true)

    const { POST } = await import('@/app/api/trivia/daily/answer/route')
    const req = makeRequest('/api/trivia/daily/answer', {
      method: 'POST',
      body: JSON.stringify({
        username: 'testuser',
        question_id: 'nonexistent-99',
        selected_answer: 'a',
        time_taken_ms: 5000,
      }),
    })
    const res = await POST(req)

    expect(res.status).toBe(404)
  })

  it('validates required fields before checking demo mode', async () => {
    mockCheckDemoMode.mockResolvedValue(true)

    const { POST } = await import('@/app/api/trivia/daily/answer/route')
    const req = makeRequest('/api/trivia/daily/answer', {
      method: 'POST',
      body: JSON.stringify({
        // missing required fields
        username: 'testuser',
      }),
    })
    const res = await POST(req)

    expect(res.status).toBe(400)
  })

  it('validates answer option', async () => {
    mockCheckDemoMode.mockResolvedValue(true)

    const { POST } = await import('@/app/api/trivia/daily/answer/route')
    const req = makeRequest('/api/trivia/daily/answer', {
      method: 'POST',
      body: JSON.stringify({
        username: 'testuser',
        question_id: 'demo-1',
        selected_answer: 'z', // invalid
        time_taken_ms: 5000,
      }),
    })
    const res = await POST(req)

    expect(res.status).toBe(400)
  })
})
