import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, isDemoMode } from '@/lib/supabase'
import { samplePhotos } from '@/lib/mock-data'
import type { PhotoWithTeam } from '@/lib/database.types'
import { logServer, logServerError } from '@/lib/error-tracking/server-logger'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const cursor = searchParams.get('cursor') // ISO timestamp for pagination
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
    const teamId = request.headers.get('x-team-id') // For checking if user liked

    logServer({
      level: 'info',
      component: 'photos-api',
      event: 'request_received',
      data: { cursor, limit, teamId, isDemoMode: isDemoMode() }
    })

    // Demo mode
    if (isDemoMode()) {
      logServer({
        level: 'info',
        component: 'photos-api',
        event: 'demo_mode_active',
        data: { samplePhotosCount: samplePhotos?.length }
      })
      let photos = [...samplePhotos]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

      // Apply cursor pagination
      if (cursor) {
        const cursorTime = new Date(cursor).getTime()
        photos = photos.filter(p => new Date(p.createdAt).getTime() < cursorTime)
      }

      // Apply limit
      photos = photos.slice(0, limit)

      const response: PhotoWithTeam[] = photos.map(p => ({
        id: p.id,
        team_id: p.teamId,
        image_url: p.imageUrl,
        caption: p.caption,
        likes: p.likes,
        is_approved: true,
        is_hidden: false,
        uploaded_at: p.createdAt,
        team_name: p.teamName,
        team_image: null,
        has_liked: false
      }))

      return NextResponse.json({
        photos: response,
        next_cursor: response.length > 0 ? response[response.length - 1].uploaded_at : null,
        has_more: photos.length === limit
      })
    }

    const supabase = createSupabaseServerClient()
    logServer({
      level: 'info',
      component: 'photos-api',
      event: 'supabase_client',
      data: { hasClient: !!supabase }
    })
    if (!supabase) {
      logServer({
        level: 'error',
        component: 'photos-api',
        event: 'no_supabase_client',
        data: { error: 'Database not available' }
      })
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      )
    }

    // Build query - photo_uploads uses username directly, not team_id
    let query = supabase
      .from('photo_uploads')
      .select('*')
      .eq('is_approved', true)
      .eq('is_hidden', false)
      .order('created_at', { ascending: false })
      .limit(limit)

    // Apply cursor pagination
    if (cursor) {
      query = query.lt('created_at', cursor)
    }

    const { data: photos, error } = await query

    if (error) {
      logServerError('photos-api', 'query_failed', error, { cursor, limit, teamId })
      return NextResponse.json(
        { error: 'Failed to fetch photos' },
        { status: 500 }
      )
    }

    logServer({
      level: 'info',
      component: 'photos-api',
      event: 'query_success',
      data: { photosCount: photos?.length, hasPhotos: !!photos }
    })

    // Check which photos the user has liked
    let likedPhotoIds = new Set<string>()
    if (teamId && photos && photos.length > 0) {
      const photoIds = photos.map(p => p.id)
      const { data: likes } = await supabase
        .from('photo_likes')
        .select('photo_id')
        .eq('user_id', teamId)
        .in('photo_id', photoIds)

      likedPhotoIds = new Set(likes?.map(l => l.photo_id) || [])
    }

    // Transform response - map actual DB columns to API response format
    const response: PhotoWithTeam[] = (photos || []).map(p => ({
      id: p.id,
      team_id: p.username,  // Using username as identifier
      image_url: p.image_url,
      caption: p.caption,
      likes: p.like_count,  // DB uses like_count
      is_approved: p.is_approved,
      is_hidden: p.is_hidden,
      uploaded_at: p.created_at,  // DB uses created_at
      team_name: p.username,  // Display username as team name
      team_image: null,
      has_liked: likedPhotoIds.has(p.id)
    }))

    // If database is empty and this is the first page, show placeholder photos
    if (response.length === 0 && !cursor) {
      logServer({
        level: 'info',
        component: 'photos-api',
        event: 'empty_db_showing_placeholders',
        data: { samplePhotosCount: samplePhotos?.length }
      })

      const placeholders: PhotoWithTeam[] = samplePhotos.map(p => ({
        id: p.id,
        team_id: p.teamId,
        image_url: p.imageUrl,
        caption: p.caption,
        likes: p.likes,
        is_approved: true,
        is_hidden: false,
        uploaded_at: p.createdAt,
        team_name: p.teamName,
        team_image: null,
        has_liked: false
      }))

      return NextResponse.json({
        photos: placeholders,
        next_cursor: null,
        has_more: false
      })
    }

    return NextResponse.json({
      photos: response,
      next_cursor: response.length > 0 ? response[response.length - 1].uploaded_at : null,
      has_more: response.length === limit
    })

  } catch (error) {
    logServerError('photos-api', 'unexpected_error', error, {})
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
