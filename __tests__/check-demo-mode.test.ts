import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock @supabase/supabase-js before importing supabase module
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockSingle = vi.fn()
const mockFrom = vi.fn(() => ({ select: mockSelect }))

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
  })),
}))

// Set up env vars before importing
vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co')
vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key')
vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-service-key')

describe('checkDemoMode', () => {
  let checkDemoMode: typeof import('@/lib/supabase').checkDemoMode
  let invalidateDemoModeCache: typeof import('@/lib/supabase').invalidateDemoModeCache

  beforeEach(async () => {
    vi.resetModules()

    // Re-stub env vars for each fresh import
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key')
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-service-key')

    // Set up the chain: from().select().eq().single()
    mockSingle.mockResolvedValue({ data: { demo_mode: false }, error: null })
    mockEq.mockReturnValue({ single: mockSingle })
    mockSelect.mockReturnValue({ eq: mockEq })
    mockFrom.mockReturnValue({ select: mockSelect })

    const mod = await import('@/lib/supabase')
    checkDemoMode = mod.checkDemoMode
    invalidateDemoModeCache = mod.invalidateDemoModeCache
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns false when demo_mode is false in DB', async () => {
    mockSingle.mockResolvedValue({ data: { demo_mode: false }, error: null })

    const result = await checkDemoMode()
    expect(result).toBe(false)
  })

  it('returns true when demo_mode is true in DB', async () => {
    mockSingle.mockResolvedValue({ data: { demo_mode: true }, error: null })

    const result = await checkDemoMode()
    expect(result).toBe(true)
  })

  it('returns false on DB error', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'connection error' } })

    const result = await checkDemoMode()
    expect(result).toBe(false)
  })

  it('returns false when data is null', async () => {
    mockSingle.mockResolvedValue({ data: null, error: null })

    const result = await checkDemoMode()
    expect(result).toBe(false)
  })

  it('returns false on exception', async () => {
    mockSingle.mockRejectedValue(new Error('network failure'))

    const result = await checkDemoMode()
    expect(result).toBe(false)
  })

  it('caches the result and does not query DB on second call', async () => {
    mockSingle.mockResolvedValue({ data: { demo_mode: true }, error: null })

    const result1 = await checkDemoMode()
    expect(result1).toBe(true)

    // Clear call counts after first query
    const callsAfterFirst = mockFrom.mock.calls.length

    // Change the DB response — shouldn't matter because cache is active
    mockSingle.mockResolvedValue({ data: { demo_mode: false }, error: null })

    const result2 = await checkDemoMode()
    expect(result2).toBe(true) // Still cached as true

    // from() should NOT have been called again
    expect(mockFrom.mock.calls.length).toBe(callsAfterFirst)
  })

  it('invalidateDemoModeCache forces a fresh DB query', async () => {
    mockSingle.mockResolvedValue({ data: { demo_mode: true }, error: null })

    const result1 = await checkDemoMode()
    expect(result1).toBe(true)

    const callsAfterFirst = mockFrom.mock.calls.length

    // Invalidate the cache
    invalidateDemoModeCache()

    // Now change DB response
    mockSingle.mockResolvedValue({ data: { demo_mode: false }, error: null })

    const result2 = await checkDemoMode()
    expect(result2).toBe(false) // Fresh query returns false

    // from() should have been called exactly once more
    expect(mockFrom.mock.calls.length).toBe(callsAfterFirst + 1)
  })

  it('queries game_settings table with id=1', async () => {
    mockSingle.mockResolvedValue({ data: { demo_mode: false }, error: null })

    await checkDemoMode()

    expect(mockFrom).toHaveBeenCalledWith('game_settings')
    expect(mockSelect).toHaveBeenCalledWith('demo_mode')
    expect(mockEq).toHaveBeenCalledWith('id', 1)
  })

  it('cache expires after TTL', async () => {
    mockSingle.mockResolvedValue({ data: { demo_mode: true }, error: null })

    const result1 = await checkDemoMode()
    expect(result1).toBe(true)

    // Fast-forward time past the 30s TTL
    const originalDateNow = Date.now
    const startTime = Date.now()
    Date.now = () => startTime + 31_000

    // Change DB response
    mockSingle.mockResolvedValue({ data: { demo_mode: false }, error: null })

    const result2 = await checkDemoMode()
    expect(result2).toBe(false) // Cache expired, fresh query

    Date.now = originalDateNow
  })
})

describe('checkDemoMode - Supabase not configured', () => {
  it('returns false when Supabase env vars are missing', async () => {
    vi.resetModules()

    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '')
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '')

    const mod = await import('@/lib/supabase')
    const result = await mod.checkDemoMode()
    expect(result).toBe(false)
  })
})
