import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@repo/database'

export async function POST(request: NextRequest) {
  try {
    const { image, prompt, userId } = await request.json()

    if (!image) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 })
    }

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Get Grok API key from environment or user settings
    const grokApiKey = process.env.GROK_API_KEY

    if (!grokApiKey) {
      return NextResponse.json(
        { error: 'Grok API key not configured' }, 
        { status: 500 }
      )
    }

    // Extract base64 data from image
    const base64Data = image.split(',')[1]
    const mimeType = image.split(',')[0].split(':')[1].split(';')[0]

    // Build request for Grok Vision API
    const requestPayload = {
      model: "grok-2-vision-1212",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Data}`,
                detail: "high"
              }
            },
            {
              type: "text",
              text: prompt
            }
          ]
        }
      ],
      max_tokens: 1000,
      temperature: 0.5
    }

    console.log('🧠 Calling Grok Vision API')

    // Call xAI Grok API
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${grokApiKey}`
      },
      body: JSON.stringify(requestPayload)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Grok API Error:', errorText)
      
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Grok Vision API not available. Please check model name or API access.' }, 
          { status: 404 }
        )
      }
      
      return NextResponse.json(
        { error: `Grok API Error: ${response.status}` }, 
        { status: response.status }
      )
    }

    const result = await response.json()
    console.log('🧠 Grok Response received')

    if (!result.choices?.[0]?.message?.content) {
      return NextResponse.json(
        { error: 'No analysis received from Grok' }, 
        { status: 500 }
      )
    }

    const analysis = result.choices[0].message.content

    // Save analysis to database
    const supabase = getServerSupabase()
    const { error: saveError } = await supabase
      .from('generations')
      .insert({
        user_id: userId,
        service: 'grok-vision',
        prompt,
        image_url: image, // Store the input image
        response_text: analysis,
        cost: 0.05,
        generation_time: Date.now(),
        metadata: {
          model: 'grok-2-vision-1212',
          analysis_type: 'vision',
          usage: result.usage
        }
      })

    if (saveError) {
      console.error('Error saving Grok analysis:', saveError)
    }

    return NextResponse.json({
      analysis,
      cost: 0.05,
      usage: result.usage
    })

  } catch (error) {
    console.error('Grok analysis error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}