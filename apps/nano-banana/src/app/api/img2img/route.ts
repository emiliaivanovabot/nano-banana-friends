import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@repo/database'

export async function POST(request: NextRequest) {
  try {
    const { prompt, images, userId } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    if (!images || images.length < 2) {
      return NextResponse.json({ error: 'At least 2 images are required for image transformation' }, { status: 400 })
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Get user settings for API key
    const supabase = getServerSupabase()
    const { data: userSettings, error: settingsError } = await supabase
      .from('user_settings')
      .select('gemini_api_key')
      .eq('user_id', userId)
      .single()

    if (settingsError || !userSettings?.gemini_api_key) {
      return NextResponse.json(
        { error: 'Gemini API key not found. Please add it in Settings.' }, 
        { status: 400 }
      )
    }

    const apiKey = userSettings.gemini_api_key
    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash-image'

    // Build request body for Gemini API with multiple images
    const imageParts = images.map((base64Image: string) => {
      const mimeType = base64Image.split(',')[0].split(':')[1].split(';')[0]
      const base64Data = base64Image.split(',')[1]
      
      return {
        inline_data: {
          mime_type: mimeType,
          data: base64Data
        }
      }
    })

    const requestBody = {
      contents: [{
        role: "user",
        parts: [
          {
            text: prompt
          },
          ...imageParts
        ]
      }],
      generation_config: {
        temperature: 0.8,
        candidate_count: 1,
        max_output_tokens: 8192
      }
    }

    // Make request to Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify(requestBody)
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Gemini API Error (Img2Img):', errorText)
      return NextResponse.json(
        { error: `Gemini API Error: ${response.status}` }, 
        { status: response.status }
      )
    }

    const data = await response.json()

    // Extract generated image from response
    if (!data.candidates?.[0]?.content?.parts?.[0]?.inline_data?.data) {
      return NextResponse.json(
        { error: 'No transformed image generated' }, 
        { status: 500 }
      )
    }

    const imageData = data.candidates[0].content.parts[0].inline_data.data
    const imageMimeType = data.candidates[0].content.parts[0].inline_data.mime_type || 'image/png'
    
    // Convert to data URL
    const imageUrl = `data:${imageMimeType};base64,${imageData}`

    // Save generation record to database
    const { error: saveError } = await supabase
      .from('generations')
      .insert({
        user_id: userId,
        service: 'gemini-img2img',
        prompt,
        image_url: imageUrl,
        cost: 0.15, // Higher cost for image transformation
        generation_time: Date.now(),
        metadata: {
          model,
          image_count: images.length,
          transformation_type: 'img2img',
          usage_metadata: data.usage_metadata
        }
      })

    if (saveError) {
      console.error('Error saving img2img generation:', saveError)
    }

    return NextResponse.json({
      imageUrl,
      cost: 0.15,
      usageMetadata: data.usage_metadata
    })

  } catch (error) {
    console.error('Img2Img transformation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}