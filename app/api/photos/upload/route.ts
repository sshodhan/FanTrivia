import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, createSupabaseAdminClient, isDemoMode } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

// Rate limiting map
const uploadRateLimits = new Map<string, number>()
const RATE_LIMIT_WINDOW = 5 * 60 * 1000 // 5 minutes

// Allowed file types
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

function checkRateLimit(teamId: string): boolean {
  const now = Date.now()
  const lastUpload = uploadRateLimits.get(teamId)

  if (lastUpload && now - lastUpload < RATE_LIMIT_WINDOW) {
    return false
  }

  uploadRateLimits.set(teamId, now)
  return true
}

export async function POST(request: NextRequest) {
  try {
    // Get team info from header
    const sessionToken = request.headers.get('authorization')?.replace('Bearer ', '')
    const teamId = request.headers.get('x-team-id')

    if (!sessionToken || !teamId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check rate limit
    if (!checkRateLimit(teamId)) {
      const lastUpload = uploadRateLimits.get(teamId)
      const waitTime = lastUpload ? Math.ceil((RATE_LIMIT_WINDOW - (Date.now() - lastUpload)) / 1000) : 0

      return NextResponse.json(
        {
          error: 'Rate limited. Please wait before uploading again.',
          retry_after_seconds: waitTime
        },
        { status: 429 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const caption = formData.get('caption') as string | null

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: JPG, PNG, WebP, GIF' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB' },
        { status: 400 }
      )
    }

    // Validate caption
    const sanitizedCaption = caption?.trim().slice(0, 100) || null

    // Demo mode
    if (isDemoMode()) {
      // In demo mode, we can't actually upload to storage
      // Return a mock response
      return NextResponse.json({
        success: true,
        photo: {
          id: uuidv4(),
          team_id: teamId,
          image_url: '/photos/demo-upload.jpg',
          caption: sanitizedCaption,
          likes: 0,
          uploaded_at: new Date().toISOString()
        },
        message: 'Demo mode - photo not actually uploaded'
      }, { status: 201 })
    }

    // Validate session with server
    const supabase = createSupabaseServerClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      )
    }

    // Verify team exists and session is valid
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('id')
      .eq('id', teamId)
      .eq('session_token', sessionToken)
      .single()

    if (teamError || !team) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      )
    }

    // Use admin client for storage upload
    const adminClient = createSupabaseAdminClient()
    if (!adminClient) {
      return NextResponse.json(
        { error: 'Storage not configured' },
        { status: 503 }
      )
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop() || 'jpg'
    const fileName = `${teamId}/${uuidv4()}.${fileExt}`

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await adminClient
      .storage
      .from('photos')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = adminClient
      .storage
      .from('photos')
      .getPublicUrl(fileName)

    const imageUrl = urlData.publicUrl

    // Create photo record
    const { data: photo, error: insertError } = await supabase
      .from('photo_uploads')
      .insert({
        team_id: teamId,
        image_url: imageUrl,
        caption: sanitizedCaption,
        is_approved: true, // Auto-approve by default
        is_hidden: false
      })
      .select()
      .single()

    if (insertError) {
      console.error('Photo record error:', insertError)
      // Try to clean up uploaded file
      await adminClient.storage.from('photos').remove([fileName])

      return NextResponse.json(
        { error: 'Failed to save photo record' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      photo
    }, { status: 201 })

  } catch (error) {
    console.error('Photo upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
