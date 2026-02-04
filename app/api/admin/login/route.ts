import { NextRequest, NextResponse } from 'next/server'
import { validateAdminSecret, createAdminSession } from '@/lib/adminAuth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { secret } = body

    if (!secret) {
      return NextResponse.json(
        { error: 'Admin secret required' },
        { status: 400 }
      )
    }

    if (!validateAdminSecret(secret)) {
      return NextResponse.json(
        { error: 'Invalid admin secret' },
        { status: 401 }
      )
    }

    // Create session
    const sessionToken = createAdminSession()

    return NextResponse.json({
      success: true,
      token: sessionToken
    })

  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
