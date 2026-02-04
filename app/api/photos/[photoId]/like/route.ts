import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, isDemoMode } from '@/lib/supabase'

// Demo mode like storage
const demoLikes = new Map<string, Set<string>>()

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ photoId: string }> }
) {
  try {
    const { photoId } = await params
    const teamId = request.headers.get('x-team-id')

    if (!teamId) {
      return NextResponse.json(
        { error: 'Team ID required' },
        { status: 401 }
      )
    }

    // Demo mode
    if (isDemoMode()) {
      const photoLikes = demoLikes.get(photoId) || new Set()
      const wasLiked = photoLikes.has(teamId)

      if (wasLiked) {
        photoLikes.delete(teamId)
      } else {
        photoLikes.add(teamId)
      }
      demoLikes.set(photoId, photoLikes)

      return NextResponse.json({
        liked: !wasLiked,
        likes: photoLikes.size
      })
    }

    const supabase = createSupabaseServerClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      )
    }

    // Check if already liked
    const { data: existingLike } = await supabase
      .from('photo_likes')
      .select('id')
      .eq('photo_id', photoId)
      .eq('team_id', teamId)
      .single()

    let liked: boolean
    let newLikeCount: number

    if (existingLike) {
      // Unlike - delete the like record
      const { error: deleteError } = await supabase
        .from('photo_likes')
        .delete()
        .eq('photo_id', photoId)
        .eq('team_id', teamId)

      if (deleteError) {
        console.error('Unlike error:', deleteError)
        return NextResponse.json(
          { error: 'Failed to unlike' },
          { status: 500 }
        )
      }

      liked = false
    } else {
      // Like - insert new like record
      const { error: insertError } = await supabase
        .from('photo_likes')
        .insert({
          photo_id: photoId,
          team_id: teamId
        })

      if (insertError) {
        console.error('Like error:', insertError)
        return NextResponse.json(
          { error: 'Failed to like' },
          { status: 500 }
        )
      }

      liked = true
    }

    // Get updated like count
    const { data: photo } = await supabase
      .from('photo_uploads')
      .select('likes')
      .eq('id', photoId)
      .single()

    newLikeCount = photo?.likes || 0

    return NextResponse.json({
      liked,
      likes: newLikeCount
    })

  } catch (error) {
    console.error('Like toggle error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
