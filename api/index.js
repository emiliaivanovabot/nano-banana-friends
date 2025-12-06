// ==============================================
// ASYNC IMAGE GENERATION API SERVER
// ==============================================
// Express.js API server for handling async image generation
// Solves mobile sleep/lock interruption issues

import express from 'express'
import cors from 'cors'
import { createClient } from '@supabase/supabase-js'
import fetch from 'node-fetch'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: './.env.local' })

const app = express()
const port = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))

// Supabase client with service role for full access
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
)

// ==============================================
// UTILITY FUNCTIONS
// ==============================================

// Validate user authentication
const authenticateUser = async (userId) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, gemini_api_key')
      .eq('id', userId)
      .single()

    if (error || !user) {
      throw new Error('User not found or invalid')
    }

    if (!user.gemini_api_key) {
      throw new Error('User has no Gemini API key configured')
    }

    return user
  } catch (error) {
    throw new Error(`Authentication failed: ${error.message}`)
  }
}

// Process image data for Gemini API
const processImageForGemini = async (imageUrl) => {
  try {
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`)
    }
    
    const arrayBuffer = await response.arrayBuffer()
    const base64Data = Buffer.from(arrayBuffer).toString('base64')
    const contentType = response.headers.get('content-type') || 'image/jpeg'
    
    return {
      inline_data: {
        mime_type: contentType,
        data: base64Data
      }
    }
  } catch (error) {
    console.error('Image processing error:', error)
    throw error
  }
}

// Generate image with Gemini API
const generateWithGemini = async (generationData, userApiKey) => {
  const model = process.env.VITE_GEMINI_MODEL || 'gemini-2.5-flash-image'
  
  try {
    // Build request parts
    const parts = [{ text: generationData.prompt }]
    
    // Add main face image if provided
    if (generationData.main_face_image_url) {
      try {
        const faceImagePart = await processImageForGemini(generationData.main_face_image_url)
        parts.push(faceImagePart)
      } catch (error) {
        console.warn('Failed to load main face image:', error)
      }
    }
    
    // Add additional images
    if (generationData.additional_images && generationData.additional_images.length > 0) {
      for (const imageData of generationData.additional_images) {
        if (imageData.base64) {
          // Remove data URL prefix if present
          const base64Data = imageData.base64.includes(',') 
            ? imageData.base64.split(',')[1] 
            : imageData.base64
          
          const mimeType = imageData.mime_type || 'image/jpeg'
          
          parts.push({
            inline_data: {
              mime_type: mimeType,
              data: base64Data
            }
          })
        }
      }
    }
    
    // Build Gemini API request
    const requestBody = {
      contents: [{
        role: "user",
        parts: parts
      }],
      generationConfig: {
        response_modalities: ['TEXT', 'IMAGE'],
        image_config: {
          aspect_ratio: generationData.aspect_ratio,
          image_size: generationData.resolution
        }
      }
    }
    
    // Make API call with retry logic
    const maxRetries = 3
    let lastError = null
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Gemini API attempt ${attempt}/${maxRetries}`)
        
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': userApiKey
            },
            body: JSON.stringify(requestBody)
          }
        )
        
        if (!response.ok) {
          const errorText = await response.text()
          
          // Handle specific error codes
          if (response.status === 429 || response.status === 503) {
            if (attempt < maxRetries) {
              const waitTime = 1000 * Math.pow(2, attempt - 1) // Exponential backoff
              console.log(`Rate limited/server overloaded. Retrying in ${waitTime}ms...`)
              await new Promise(resolve => setTimeout(resolve, waitTime))
              continue
            }
          }
          
          throw new Error(`Gemini API Error ${response.status}: ${errorText}`)
        }
        
        const responseData = await response.json()
        
        // Process successful response
        if (responseData.candidates && responseData.candidates[0]) {
          const candidate = responseData.candidates[0]
          
          // Check for safety filter
          if (candidate.finishReason === 'IMAGE_SAFETY') {
            return {
              success: false,
              error: candidate.finishMessage || 'Image blocked by safety filter',
              isBlocked: true
            }
          }
          
          if (candidate.content && candidate.content.parts) {
            let resultText = ''
            let resultImage = null
            
            candidate.content.parts.forEach(part => {
              if (part.text) {
                resultText += part.text + ' '
              } else if (part.inline_data && part.inline_data.mime_type?.startsWith('image/')) {
                resultImage = `data:${part.inline_data.mime_type};base64,${part.inline_data.data}`
              } else if (part.inlineData && part.inlineData.mimeType?.startsWith('image/')) {
                resultImage = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`
              }
            })
            
            if (resultImage || resultText.trim()) {
              return {
                success: true,
                text: resultText.trim() || 'Image generated successfully!',
                image: resultImage,
                metadata: {
                  model,
                  attempt,
                  finishReason: candidate.finishReason
                },
                usageMetadata: responseData.usageMetadata || {
                  promptTokenCount: 0,
                  candidatesTokenCount: 0,
                  totalTokenCount: 0
                }
              }
            }
          }
        }
        
        throw new Error('No valid content received from Gemini API')
        
      } catch (error) {
        lastError = error
        console.error(`Attempt ${attempt} failed:`, error.message)
        
        if (attempt < maxRetries) {
          const waitTime = 1000 * Math.pow(2, attempt - 1)
          await new Promise(resolve => setTimeout(resolve, waitTime))
        }
      }
    }
    
    throw lastError || new Error('All retry attempts failed')
    
  } catch (error) {
    console.error('Gemini generation error:', error)
    return {
      success: false,
      error: error.message,
      isRetryable: error.message.includes('429') || error.message.includes('503')
    }
  }
}

// ==============================================
// API ENDPOINTS
// ==============================================

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Nano Banana Async Generation API',
    timestamp: new Date().toISOString()
  })
})

// Start async generation
app.post('/api/generations/start', async (req, res) => {
  try {
    const { 
      user_id, 
      prompt, 
      resolution = '2K', 
      aspect_ratio = '9:16',
      main_face_image_url,
      additional_images = []
    } = req.body
    
    // Validate required fields
    if (!user_id || !prompt) {
      return res.status(400).json({
        error: 'Missing required fields: user_id and prompt'
      })
    }
    
    // Authenticate user
    const user = await authenticateUser(user_id)
    
    // Create generation record
    const { data: generation, error: dbError } = await supabase
      .from('generations')
      .insert([{
        user_id,
        prompt,
        resolution,
        aspect_ratio,
        main_face_image_url,
        additional_images,
        status: 'processing',
        started_at: new Date().toISOString()
      }])
      .select()
      .single()
    
    if (dbError) {
      console.error('Database error:', dbError)
      return res.status(500).json({
        error: 'Failed to create generation record'
      })
    }
    
    // Start background generation (don't await)
    processGenerationInBackground(generation.id, generation, user.gemini_api_key)
    
    // Return immediately with generation ID
    res.status(202).json({
      generation_id: generation.id,
      status: 'processing',
      message: 'Generation started successfully',
      created_at: generation.created_at
    })
    
  } catch (error) {
    console.error('Start generation error:', error)
    res.status(500).json({
      error: error.message
    })
  }
})

// Background generation processing
const processGenerationInBackground = async (generationId, generationData, userApiKey) => {
  try {
    console.log(`Starting background generation for ID: ${generationId}`)
    
    // Generate with Gemini
    const result = await generateWithGemini(generationData, userApiKey)
    
    if (result.success) {
      // Update database with successful result
      const { error: updateError } = await supabase
        .from('generations')
        .update({
          status: 'completed',
          result_image_url: result.image ? 'base64_stored' : null, // Flag for base64 storage
          result_base64: result.image,
          gemini_metadata: {
            ...result.metadata,
            usageMetadata: result.usageMetadata
          },
          completed_at: new Date().toISOString()
        })
        .eq('id', generationId)
      
      if (updateError) {
        console.error('Failed to update successful generation:', updateError)
      } else {
        console.log(`Generation ${generationId} completed successfully`)
      }
    } else {
      // Update database with error
      const { error: updateError } = await supabase
        .from('generations')
        .update({
          status: 'failed',
          error_message: result.error,
          completed_at: new Date().toISOString()
        })
        .eq('id', generationId)
      
      if (updateError) {
        console.error('Failed to update failed generation:', updateError)
      } else {
        console.log(`Generation ${generationId} failed: ${result.error}`)
      }
    }
  } catch (error) {
    console.error(`Background generation error for ${generationId}:`, error)
    
    // Update database with unexpected error
    try {
      await supabase
        .from('generations')
        .update({
          status: 'failed',
          error_message: `Unexpected error: ${error.message}`,
          completed_at: new Date().toISOString()
        })
        .eq('id', generationId)
    } catch (dbError) {
      console.error('Failed to update generation with error status:', dbError)
    }
  }
}

// Check generation status
app.get('/api/generations/:id/status', async (req, res) => {
  try {
    const { id } = req.params
    const { user_id } = req.query
    
    if (!user_id) {
      return res.status(400).json({
        error: 'Missing user_id parameter'
      })
    }
    
    // Get generation with user verification
    const { data: generation, error } = await supabase
      .from('generations')
      .select('*')
      .eq('id', id)
      .eq('user_id', user_id)
      .single()
    
    if (error || !generation) {
      return res.status(404).json({
        error: 'Generation not found'
      })
    }
    
    // Return status with appropriate data
    const response = {
      id: generation.id,
      status: generation.status,
      created_at: generation.created_at,
      started_at: generation.started_at,
      completed_at: generation.completed_at
    }
    
    if (generation.status === 'completed') {
      response.result = {
        text: 'Image generated successfully!',
        image: generation.result_base64,
        generation_time_seconds: generation.generation_time_seconds
      }
      response.metadata = generation.gemini_metadata
    } else if (generation.status === 'failed') {
      response.error = generation.error_message
    }
    
    res.json(response)
    
  } catch (error) {
    console.error('Status check error:', error)
    res.status(500).json({
      error: error.message
    })
  }
})

// Get user's recent generations
app.get('/api/generations/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params
    const { limit = 10, status } = req.query
    
    // Build query
    let query = supabase
      .from('generations')
      .select(`
        id,
        prompt,
        resolution,
        aspect_ratio,
        status,
        result_base64,
        error_message,
        generation_time_seconds,
        created_at,
        completed_at
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit))
    
    // Filter by status if provided
    if (status) {
      query = query.eq('status', status)
    }
    
    const { data: generations, error } = await query
    
    if (error) {
      console.error('Database error:', error)
      return res.status(500).json({
        error: 'Failed to fetch generations'
      })
    }
    
    // Format response
    const formattedGenerations = generations.map(gen => ({
      id: gen.id,
      prompt: gen.prompt,
      resolution: gen.resolution,
      aspect_ratio: gen.aspect_ratio,
      status: gen.status,
      result: gen.status === 'completed' ? {
        image: gen.result_base64,
        generation_time_seconds: gen.generation_time_seconds
      } : null,
      error: gen.status === 'failed' ? gen.error_message : null,
      created_at: gen.created_at,
      completed_at: gen.completed_at
    }))
    
    res.json({
      generations: formattedGenerations,
      total: generations.length
    })
    
  } catch (error) {
    console.error('Get user generations error:', error)
    res.status(500).json({
      error: error.message
    })
  }
})

// Retry failed generation
app.post('/api/generations/:id/retry', async (req, res) => {
  try {
    const { id } = req.params
    const { user_id } = req.body
    
    if (!user_id) {
      return res.status(400).json({
        error: 'Missing user_id'
      })
    }
    
    // Get original generation
    const { data: generation, error } = await supabase
      .from('generations')
      .select('*')
      .eq('id', id)
      .eq('user_id', user_id)
      .single()
    
    if (error || !generation) {
      return res.status(404).json({
        error: 'Generation not found'
      })
    }
    
    if (generation.status === 'processing') {
      return res.status(400).json({
        error: 'Generation is still processing'
      })
    }
    
    // Get user API key
    const user = await authenticateUser(user_id)
    
    // Update status to processing
    const { error: updateError } = await supabase
      .from('generations')
      .update({
        status: 'processing',
        error_message: null,
        result_base64: null,
        result_image_url: null,
        retry_count: (generation.retry_count || 0) + 1,
        started_at: new Date().toISOString(),
        completed_at: null
      })
      .eq('id', id)
    
    if (updateError) {
      return res.status(500).json({
        error: 'Failed to update generation for retry'
      })
    }
    
    // Start background processing
    processGenerationInBackground(id, generation, user.gemini_api_key)
    
    res.json({
      message: 'Generation retry started',
      status: 'processing'
    })
    
  } catch (error) {
    console.error('Retry generation error:', error)
    res.status(500).json({
      error: error.message
    })
  }
})

// ==============================================
// KLING AI AVATAR ENDPOINTS (LOCAL DEVELOPMENT)
// ==============================================

// JWT Token creation for KlingAI
async function createKlingJWTToken() {
  const KLING_ACCESS_KEY = process.env.VITE_KLING_AI_ACCESS_KEY
  const KLING_SECRET_KEY = process.env.VITE_KLING_AI_SECRET_KEY
  
  if (!KLING_ACCESS_KEY || !KLING_SECRET_KEY) {
    throw new Error('Kling AI Access Key und Secret Key sind erforderlich')
  }

  // JWT Header
  const header = {
    "alg": "HS256",
    "typ": "JWT"
  }

  // JWT Payload
  const payload = {
    "iss": KLING_ACCESS_KEY,
    "exp": Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes expiry
    "nbf": Math.floor(Date.now() / 1000)
  }

  // Base64 URL encode
  const base64UrlEncode = (obj) => {
    return Buffer.from(JSON.stringify(obj))
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
  }

  const encodedHeader = base64UrlEncode(header)
  const encodedPayload = base64UrlEncode(payload)
  
  // Create signature
  const signatureBase = `${encodedHeader}.${encodedPayload}`
  const crypto = await import('crypto')
  const signature = crypto.createHmac('sha256', KLING_SECRET_KEY)
    .update(signatureBase)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
  
  return `${encodedHeader}.${encodedPayload}.${signature}`
}

// KlingAI Generate Avatar
app.post('/api/kling-proxy/generate', async (req, res) => {
  try {
    console.log('🎬 KlingAI Generate called')
    
    const jwtToken = await createKlingJWTToken()
    
    const response = await fetch('https://api-singapore.klingai.com/v1/videos/image2video', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwtToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    })

    const data = await response.json()
    
    if (!response.ok) {
      console.error('❌ KlingAI API Error:', response.status, data)
      return res.status(response.status).json(data)
    }

    console.log('✅ KlingAI Generate Success')
    res.json(data)

  } catch (error) {
    console.error('❌ KlingAI Generate Error:', error)
    res.status(500).json({ 
      error: 'KlingAI Generate Error', 
      message: error.message 
    })
  }
})

// KlingAI Check Status
app.get('/api/kling-proxy/status/:taskId', async (req, res) => {
  try {
    console.log('🔍 KlingAI Status check:', req.params.taskId)
    
    const jwtToken = await createKlingJWTToken()
    
    const response = await fetch(`https://api-singapore.klingai.com/v1/videos/image2video/${req.params.taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${jwtToken}`,
        'Content-Type': 'application/json'
      }
    })

    const data = await response.json()
    
    if (!response.ok) {
      return res.status(response.status).json(data)
    }

    res.json(data)

  } catch (error) {
    console.error('❌ KlingAI Status Error:', error)
    res.status(500).json({ 
      error: 'KlingAI Status Error', 
      message: error.message 
    })
  }
})

// KlingAI Check Credits
app.get('/api/kling-proxy/credits', async (req, res) => {
  try {
    console.log('💰 KlingAI Credits check')
    
    const jwtToken = await createKlingJWTToken()
    
    const response = await fetch('https://api-singapore.klingai.com/v1/user/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${jwtToken}`,
        'Content-Type': 'application/json'
      }
    })

    const data = await response.json()
    
    if (!response.ok) {
      return res.status(response.status).json(data)
    }

    res.json(data)

  } catch (error) {
    console.error('❌ KlingAI Credits Error:', error)
    res.status(500).json({ 
      error: 'KlingAI Credits Error', 
      message: error.message 
    })
  }
})

// ==============================================
// ERROR HANDLING & SERVER STARTUP
// ==============================================

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error)
  res.status(500).json({
    error: 'Internal server error',
    message: error.message
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    available_endpoints: [
      'GET /health',
      'POST /api/generations/start',
      'GET /api/generations/:id/status',
      'GET /api/generations/user/:userId',
      'POST /api/generations/:id/retry'
    ]
  })
})

// Start server
app.listen(port, () => {
  console.log(`🚀 Nano Banana Async Generation API running on port ${port}`)
  console.log(`🔗 Health check: http://localhost:${port}/health`)
  console.log(`📱 Ready to handle mobile-friendly async generations!`)
})

export default app