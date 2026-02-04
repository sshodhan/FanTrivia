import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

export async function POST(request: NextRequest) {
  try {
    const auth = requireAdmin(request)
    if (!auth.authenticated) {
      return auth.error
    }

    const body = await request.json()
    const { topic, difficulty, category } = body

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      )
    }

    // If no API key, return a sample generated question
    if (!OPENAI_API_KEY) {
      return NextResponse.json({
        question: {
          question_text: `What is a notable fact about ${topic} related to the Seattle Seahawks Super Bowl history?`,
          options: [
            'Sample answer A',
            'Sample answer B (correct)',
            'Sample answer C',
            'Sample answer D'
          ],
          correct_answer_index: 1,
          hint_text: `This question is about ${topic} in Seahawks Super Bowl history.`,
          difficulty: difficulty || 'medium',
          category: category || 'History'
        },
        message: 'Demo question generated - OpenAI API key not configured'
      })
    }

    // Call OpenAI API
    const systemPrompt = `You are a trivia question generator specializing in Seattle Seahawks Super Bowl history,
particularly Super Bowl XLVIII (2014) where they defeated the Denver Broncos 43-8.

Generate a trivia question based on the given topic. The question should be:
- Factually accurate about the Seahawks Super Bowl
- Appropriate for the specified difficulty level
- Have exactly 4 answer options with only one correct answer
- Include a hint that doesn't give away the answer

Respond in JSON format with this exact structure:
{
  "question_text": "The trivia question",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correct_answer_index": 0,
  "hint_text": "A helpful hint",
  "explanation": "Brief explanation of the answer"
}`

    const userPrompt = `Generate a ${difficulty || 'medium'} difficulty trivia question about: ${topic}
${category ? `Category: ${category}` : ''}`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('OpenAI API error:', error)
      return NextResponse.json(
        { error: 'Failed to generate question' },
        { status: 500 }
      )
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content

    if (!content) {
      return NextResponse.json(
        { error: 'No response from AI' },
        { status: 500 }
      )
    }

    // Parse the JSON response
    let generatedQuestion
    try {
      generatedQuestion = JSON.parse(content)
    } catch {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        generatedQuestion = JSON.parse(jsonMatch[0])
      } else {
        return NextResponse.json(
          { error: 'Failed to parse AI response' },
          { status: 500 }
        )
      }
    }

    // Add metadata
    generatedQuestion.difficulty = difficulty || 'medium'
    generatedQuestion.category = category || 'General'

    return NextResponse.json({
      question: generatedQuestion
    })

  } catch (error) {
    console.error('Generate question error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
