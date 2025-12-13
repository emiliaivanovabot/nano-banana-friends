import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@repo/database'

export async function POST(request: NextRequest) {
  try {
    const { prompt, images, userId } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
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

    // Build request body for Gemini API
    const requestBody: any = {
      contents: [{
        role: "user",
        parts: [
          {
            text: prompt
          }
        ]
      }],
      generation_config: {
        temperature: 1,
        candidate_count: 1,
        max_output_tokens: 8192
      }
    }

    // Add images if provided
    if (images && images.length > 0) {
      const imageParts = images.map((base64Image: string) => {
        // Extract base64 data and mime type
        const mimeType = base64Image.split(',')[0].split(':')[1].split(';')[0]
        const base64Data = base64Image.split(',')[1]
        
        return {
          inline_data: {
            mime_type: mimeType,
            data: base64Data
          }
        }
      })
      
      // Add images to the prompt
      requestBody.contents[0].parts.push(...imageParts)
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
      console.error('Gemini API Error:', errorText)
      return NextResponse.json(
        { error: `Gemini API Error: ${response.status}` }, 
        { status: response.status }
      )
    }

    const data = await response.json()

    // Extract generated image from response
    if (!data.candidates?.[0]?.content?.parts?.[0]?.inline_data?.data) {
      return NextResponse.json(
        { error: 'No image generated' }, 
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
        service: 'gemini',
        prompt,
        image_url: imageUrl,
        cost: 0.10,
        generation_time: Date.now(),
        metadata: {
          model,
          image_count: images?.length || 0,
          usage_metadata: data.usage_metadata
        }
      })

    if (saveError) {
      console.error('Error saving generation:', saveError)
    }

    return NextResponse.json({
      imageUrl,
      cost: 0.10,
      usageMetadata: data.usage_metadata
    })

  } catch (error) {
    console.error('Generation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}