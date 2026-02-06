import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, checkDemoMode } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'
import type { Team, TeamInsert } from '@/lib/database.types'

// Simple profanity filter - expand as needed
const PROFANITY_LIST = [
  'fuck', 'shit', 'ass', 'bitch', 'damn', 'cunt', 'dick', 'cock',
  'pussy', 'nigger', 'faggot', 'retard'
]

function containsProfanity(text: string): boolean {
  const lowerText = text.toLowerCase().replace(/[^a-z]/g, '')
  return PROFANITY_LIST.some(word => lowerText.includes(word))
}

function validateTeamName(name: string): { valid: boolean; error?: string } {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Team name is required' }
  }

  const trimmed = name.trim()

  if (trimmed.length < 2) {
    return { valid: false, error: 'Team name must be at least 2 characters' }
  }

  if (trimmed.length > 30) {
    return { valid: false, error: 'Team name must be 30 characters or less' }
  }

  if (containsProfanity(trimmed)) {
    return { valid: false, error: 'Team name contains inappropriate language' }
  }

  return { valid: true }
}

// Rate limiting map (in production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const hourInMs = 60 * 60 * 1000
  const maxRequests = 5

  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + hourInMs })
    return true
  }

  if (entry.count >= maxRequests) {
    return false
  }

  entry.count++
  return true
}

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
               request.headers.get('x-real-ip') ||
               'unknown'

    // Rate limit check
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many registration attempts. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { team_name, image_url, device_fingerprint, is_preset_image } = body

    // Validate team name
    const nameValidation = validateTeamName(team_name)
    if (!nameValidation.valid) {
      return NextResponse.json(
        { error: nameValidation.error },
        { status: 400 }
      )
    }

    // Demo mode - return mock team
    if (await checkDemoMode()) {
      const sessionToken = `demo_ses_${Date.now()}_${Math.random().toString(36).slice(2)}`
      const mockTeam: Team = {
        id: uuidv4(),
        name: team_name.trim(),
        image_url: image_url || null,
        is_preset_image: is_preset_image || false,
        device_fingerprint: device_fingerprint || null,
        session_token: sessionToken,
        created_at: new Date().toISOString(),
        last_active: new Date().toISOString()
      }

      return NextResponse.json({
        team: mockTeam,
        session_token: sessionToken,
        is_new: true
      })
    }

    const supabase = createSupabaseServerClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      )
    }

    // Check if device already has a team
    if (device_fingerprint) {
      const { data: existingTeam } = await supabase
        .from('teams')
        .select('*')
        .eq('device_fingerprint', device_fingerprint)
        .single()

      if (existingTeam) {
        // Update last active and return existing team
        await supabase
          .from('teams')
          .update({ last_active: new Date().toISOString() })
          .eq('id', existingTeam.id)

        return NextResponse.json({
          team: existingTeam,
          session_token: existingTeam.session_token,
          is_new: false,
          message: 'Welcome back! Using your existing team.'
        })
      }
    }

    // Generate session token
    const sessionToken = `ses_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`

    // Create new team
    const newTeam: TeamInsert = {
      id: uuidv4(),
      name: team_name.trim(),
      image_url: image_url || null,
      is_preset_image: is_preset_image || false,
      device_fingerprint: device_fingerprint || null,
      session_token: sessionToken,
      last_active: new Date().toISOString()
    }

    const { data: team, error } = await supabase
      .from('teams')
      .insert(newTeam)
      .select()
      .single()

    if (error) {
      console.error('Team creation error:', error)

      // Handle unique constraint violation (device fingerprint)
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'A team already exists for this device' },
          { status: 409 }
        )
      }

      return NextResponse.json(
        { error: 'Failed to create team' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      team,
      session_token: sessionToken,
      is_new: true
    }, { status: 201 })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
