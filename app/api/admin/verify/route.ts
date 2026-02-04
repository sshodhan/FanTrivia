import { NextRequest, NextResponse } from 'next/server'
import { validateAdminSecret, createAdminToken } from '@/lib/adminAccess'

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

    // Create token
    const token = createAdminToken()

    return NextResponse.json({
      success: true,
      token
    })

  } catch (error) {
    console.error('Admin verify error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
