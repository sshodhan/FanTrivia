import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import { createSupabaseAdminClient, isDemoMode } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

export async function POST(request: NextRequest) {
  try {
    const auth = requireAdmin(request)
    if (!auth.authenticated) {
      return auth.error
    }

    const body = await request.json()
    const { description, question_context } = body

    if (!description) {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      )
    }

    // If no API key, return a placeholder
    if (!OPENAI_API_KEY) {
      return NextResponse.json({
        image_url: '/placeholder-trivia-image.jpg',
        message: 'Demo mode - OpenAI API key not configured. Using placeholder image.'
      })
    }

    // Build the prompt with Seahawks theming
    const prompt = `A professional sports photography style image for a trivia game about the Seattle Seahawks Super Bowl victory.
${description}
${question_context ? `Context: ${question_context}` : ''}

Style: Dynamic, exciting sports imagery with Seahawks colors (navy blue #002244, action green #69BE28).
High quality, suitable for a mobile trivia game interface.
No text or words in the image.`

    // Call DALL-E API
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard'
      })
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('DALL-E API error:', error)
      return NextResponse.json(
        { error: 'Failed to generate image' },
        { status: 500 }
      )
    }

    const data = await response.json()
    const generatedImageUrl = data.data?.[0]?.url

    if (!generatedImageUrl) {
      return NextResponse.json(
        { error: 'No image generated' },
        { status: 500 }
      )
    }

    // Optionally upload to Supabase Storage for persistence
    if (!isDemoMode()) {
      const supabase = createSupabaseAdminClient()
      if (supabase) {
        try {
          // Download the image
          const imageResponse = await fetch(generatedImageUrl)
          const imageBuffer = Buffer.from(await imageResponse.arrayBuffer())

          // Upload to storage
          const fileName = `generated/${uuidv4()}.png`
          const { error: uploadError } = await supabase
            .storage
            .from('photos')
            .upload(fileName, imageBuffer, {
              contentType: 'image/png'
            })

          if (!uploadError) {
            const { data: urlData } = supabase
              .storage
              .from('photos')
              .getPublicUrl(fileName)

            return NextResponse.json({
              image_url: urlData.publicUrl,
              original_url: generatedImageUrl,
              stored: true
            })
          }
        } catch (uploadError) {
          console.error('Failed to store generated image:', uploadError)
          // Fall through to return original URL
        }
      }
    }

    return NextResponse.json({
      image_url: generatedImageUrl,
      stored: false,
      message: 'Image generated but not stored permanently'
    })

  } catch (error) {
    console.error('Generate image error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
