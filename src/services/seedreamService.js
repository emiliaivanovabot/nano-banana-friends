// Seedream 4.5 Service
// Integration for BytePlus Seedream 4.5 API - High-fidelity Image Generation
// Enhanced with Credit Tracking System

import { supabase } from '../lib/supabase'

const SEEDREAM_API_KEY = import.meta.env.VITE_SEEDREAM_API_KEY
const SEEDREAM_API_BASE_URL = 'https://ark.ap-southeast.bytepluses.com/api/v3'

// Convert file to base64 for API
async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// Credit Management Functions
async function getUserCredits(userId) {
  const { data, error } = await supabase.rpc('get_user_credits', {
    p_user_id: userId
  })
  
  if (error) {
    console.error('Failed to get user credits:', error)
    return null
  }
  
  return data
}

async function calculateSeedreamCost(numImages, resolution) {
  const { data, error } = await supabase.rpc('calculate_seedream_cost', {
    p_num_images: numImages,
    p_resolution: resolution
  })
  
  if (error) {
    console.error('Failed to calculate cost:', error)
    return 0.04 * numImages // Fallback calculation
  }
  
  return data
}

async function checkSufficientCredits(userId, estimatedCost) {
  const credits = await getUserCredits(userId)
  if (!credits) return false
  
  return credits.seedream_credits >= estimatedCost
}

async function deductCredits(userId, amount, generationId, metadata = {}) {
  const { data, error } = await supabase.rpc('deduct_user_credits', {
    p_user_id: userId,
    p_credit_type: 'seedream',
    p_amount: amount,
    p_generation_id: generationId,
    p_description: 'Seedream 4.5 Image Generation',
    p_metadata: metadata
  })
  
  if (error) {
    console.error('Failed to deduct credits:', error)
    throw new Error('Credit deduction failed')
  }
  
  return data
}

// Generate image with Seedream 4.5 (Enhanced with Credit Tracking)
export async function generateSeedreamImage(options = {}) {
  const {
    prompt,
    size = '1K', // '1K', '2K', '4K'
    aspectRatio = '9:16', // '9:16', '16:9', '4:3', '3:4', '2:3', '3:2'
    watermark = false,
    num_images = 1,
    style = 'auto', // auto, photographic, digital_art, comic_book, etc.
    images = [], // Reference images (0-14 files)
    sequential_image_generation = 'disabled', // 'auto', 'disabled'
    max_images = 15, // For sequential generation
    promptOptimization = 'standard', // 'standard' or 'fast'
    userId = null, // User ID for credit tracking
    generationId = null // Generation ID for linking to database
  } = options

  let estimatedCost = 0

  try {
    console.log('🌱 Starting Seedream 4.5 generation with credit tracking...')
    console.log('Options:', { prompt, size, watermark, num_images, style, userId })

    // Step 1: Calculate estimated cost
    estimatedCost = await calculateSeedreamCost(num_images, size)
    console.log(`💰 Estimated cost: $${estimatedCost} for ${num_images} images at ${size}`)

    // Step 2: Check if user has sufficient credits (only if userId provided)
    if (userId) {
      const hasCredits = await checkSufficientCredits(userId, estimatedCost)
      if (!hasCredits) {
        const userCredits = await getUserCredits(userId)
        throw new Error(`Nicht genügend Credits. Du hast $${userCredits?.seedream_credits || 0}, benötigt werden $${estimatedCost}. Bitte lade dein Konto auf.`)
      }
      console.log('✅ Credit check passed')
    }

    if (!SEEDREAM_API_KEY) {
      throw new Error('Seedream API Key nicht gefunden in Environment Variables')
    }

    if (!prompt || !prompt.trim()) {
      throw new Error('Prompt ist erforderlich')
    }

    // Convert size + aspectRatio to pixels - Seedream 4.5 Requirements
    const getPixelSize = (resolution, ratio) => {
      // Use Seedream 4.5 recommended sizes from documentation
      const sizeMap = {
        '1K': {
          '1:1': '2048x2048',     // 4,194,304 pixels
          '4:3': '2304x1728',     // 3,981,312 pixels  
          '3:4': '1728x2304',     // 3,981,312 pixels
          '16:9': '2560x1440',    // 3,686,400 pixels
          '9:16': '1440x2560',    // 3,686,400 pixels
          '3:2': '2496x1664',     // 4,153,344 pixels
          '2:3': '1664x2496',     // 4,153,344 pixels
          '21:9': '3024x1296'     // 3,919,104 pixels
        },
        '2K': {
          '1:1': '2048x2048',
          '4:3': '2304x1728', 
          '3:4': '1728x2304',
          '16:9': '2560x1440',
          '9:16': '1440x2560',
          '3:2': '2496x1664',
          '2:3': '1664x2496',
          '21:9': '3024x1296'
        },
        '4K': {
          '1:1': '4096x4096',     // 16,777,216 pixels (max)
          '4:3': '4096x3072',     // Too high, use smaller
          '3:4': '3072x4096',     // Too high, use smaller
          '16:9': '4096x2304',    // 9,437,184 pixels
          '9:16': '2304x4096',    // 9,437,184 pixels
          '3:2': '4096x2731',     // 11,189,504 pixels
          '2:3': '2731x4096',     // 11,189,504 pixels
          '21:9': '4096x1752'     // 7,176,192 pixels
        }
      }
      
      const aspectKey = ratio || '9:16'
      const resKey = resolution || '1K'
      
      return sizeMap[resKey]?.[aspectKey] || sizeMap['1K']['9:16']
    }
    
    const pixelSize = getPixelSize(size, aspectRatio)
    
    const requestData = {
      model: 'seedream-4-5-251128',
      prompt: prompt.trim(),
      size: pixelSize,
      watermark: watermark
    }

    // Add reference images if provided
    if (images && images.length > 0) {
      console.log(`📸 Processing ${images.length} reference image(s)...`)
      
      if (images.length === 1) {
        // Single image as string
        const imageBase64 = await fileToBase64(images[0])
        requestData.image = imageBase64
      } else if (images.length >= 2 && images.length <= 14) {
        // Multiple images as array
        const imagePromises = images.map(img => fileToBase64(img))
        const base64Images = await Promise.all(imagePromises)
        requestData.image = base64Images
      } else {
        throw new Error('Anzahl der Referenzbilder muss zwischen 1 und 14 liegen')
      }
    }

    // Add sequential generation options
    if (sequential_image_generation === 'auto') {
      requestData.sequential_image_generation = 'auto'
      requestData.sequential_image_generation_options = {
        max_images: Math.min(max_images, 15)
      }
    } else {
      // Explicitly set to disabled for single image generation
      requestData.sequential_image_generation = 'disabled'
      // For single image generation, we need to handle num_images differently
      // Since sequential_image_generation is disabled, we make multiple separate requests
      // But for now, let's just generate 1 image when disabled
    }

    // Add prompt optimization - only if enabled, seedream-4.5 only supports 'standard' mode
    if (promptOptimization === true) {
      requestData.optimize_prompt_options = {
        mode: 'standard' // Seedream-4.5 only supports standard mode
      }
    }

    console.log('🚀 Making Seedream API call...')

    // Use environment-specific endpoint
    const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    const apiEndpoint = isProduction
      ? '/api/seedream-generate'      // Production: use Vercel serverless function
      : 'http://localhost:3002/seedream/generate'  // Local: use local proxy server
    
    console.log(`🌍 Environment: ${isProduction ? 'Production' : 'Development'}`)
    console.log(`📡 API Endpoint: ${apiEndpoint}`)
    
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Seedream API Error:', response.status, errorData)
      
      if (response.status === 401) {
        throw new Error('Seedream API Authentication fehlgeschlagen. Bitte überprüfe deinen API Key.')
      } else if (response.status === 402) {
        throw new Error('Nicht genügend Credits. Bitte lade dein BytePlus Konto auf.')
      } else if (response.status === 429) {
        throw new Error('Rate Limit erreicht. Bitte warte einen Moment und versuche es erneut.')
      } else if (response.status === 400 && errorData.error?.code === 'InputImageSensitiveContentDetected') {
        throw new Error('Das hochgeladene Bild enthält nicht erlaubte Inhalte. Bitte verwende ein anderes Bild oder generiere ohne Referenzbild.')
      } else {
        // Show detailed error for debugging
        const errorMsg = errorData.error?.message || errorData.message || `API Fehler: ${response.status}`
        const errorDetails = errorData.error?.code ? ` (Code: ${errorData.error.code})` : ''
        console.error('🔍 Full error details:', errorData)
        throw new Error(errorMsg + errorDetails)
      }
    }

    const data = await response.json()
    console.log('✅ Seedream API response:', data)

    // Validate response structure
    if (!data.data || !data.data.length) {
      throw new Error('Ungültige API-Antwort: Keine Bilder erhalten')
    }

    // Step 3: Deduct credits after successful generation
    if (userId && estimatedCost > 0) {
      try {
        const actualImagesGenerated = data.data.length
        const finalCost = await calculateSeedreamCost(actualImagesGenerated, size)
        
        const deductResult = await deductCredits(userId, finalCost, generationId, {
          images_generated: actualImagesGenerated,
          resolution: size,
          aspect_ratio: aspectRatio,
          watermark: watermark,
          prompt_length: prompt.length,
          reference_images: images.length,
          api_usage: data.usage || null
        })
        
        console.log(`💸 Credits deducted: $${finalCost} (Balance: $${deductResult.balance_before} → $${deductResult.balance_after})`)
      } catch (creditError) {
        console.error('⚠️ Credit deduction failed:', creditError)
        // Don't fail the entire generation for credit tracking errors
        // The images were successfully generated
      }
    }

    return {
      success: true,
      images: data.data.map(item => ({
        url: item.url,
        revisedPrompt: item.revised_prompt || prompt
      })),
      usage: data.usage || null,
      cost: estimatedCost,
      message: 'Bilder erfolgreich generiert'
    }

  } catch (error) {
    console.error('❌ Seedream Service Error:', error)
    return {
      success: false,
      error: error.message,
      images: []
    }
  }
}

// Get account information and usage
export async function getSeedreamAccountInfo() {
  try {
    console.log('📊 Checking Seedream account info...')

    if (!SEEDREAM_API_KEY) {
      throw new Error('Seedream API Key nicht gefunden')
    }

    // Note: Account info via proxy - this might need adjustment based on actual BytePlus API endpoints
    const response = await fetch('/api/seedream-account', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      // If account endpoint doesn't exist, return basic info
      return {
        success: true,
        credits: 'Unknown',
        usage: 'Check BytePlus Console'
      }
    }

    const data = await response.json()
    console.log('💎 Seedream Account:', data)

    return {
      success: true,
      credits: data.credits || data.remaining_credits || 'Unknown',
      usage: data.usage || null
    }

  } catch (error) {
    console.error('❌ Account info error:', error)
    return {
      success: false,
      error: error.message,
      credits: 'Unknown'
    }
  }
}

// Test function for development
export async function testSeedreamService() {
  console.log('🧪 Testing Seedream 4.5 service...')
  
  try {
    const testResult = await generateSeedreamImage({
      prompt: 'A beautiful sunset over mountains, digital art style',
      size: '1K',
      watermark: false
    })
    
    console.log('Test result:', testResult)
    
    return testResult
    
  } catch (error) {
    console.error('Test failed:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// Helper function to validate image generation options
export function validateSeedreamOptions(options) {
  const errors = []
  
  if (!options.prompt || !options.prompt.trim()) {
    errors.push('Prompt ist erforderlich')
  }
  
  if (options.prompt && options.prompt.length > 1000) {
    errors.push('Prompt darf maximal 1000 Zeichen lang sein')
  }
  
  const validSizes = ['1K', '2K', '4K']
  if (options.size && !validSizes.includes(options.size)) {
    errors.push(`Gültige Bildgrößen: ${validSizes.join(', ')}`)
  }
  
  if (options.num_images && (options.num_images < 1 || options.num_images > 4)) {
    errors.push('Anzahl der Bilder muss zwischen 1 und 4 liegen')
  }

  // Validate reference images
  if (options.images && options.images.length > 0) {
    if (options.images.length > 14) {
      errors.push('Maximal 14 Referenzbilder erlaubt')
    }
    
    // Check file types and sizes
    const validImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/bmp', 'image/tiff', 'image/gif']
    options.images.forEach((file, index) => {
      if (!validImageTypes.includes(file.type)) {
        errors.push(`Bild ${index + 1}: Unterstützte Formate: JPEG, PNG, WebP, BMP, TIFF, GIF`)
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB
        errors.push(`Bild ${index + 1}: Maximale Dateigröße 10MB`)
      }
    })
    
    // Check sequential generation constraints
    if (options.sequential_image_generation === 'auto') {
      const totalImages = options.images.length + (options.max_images || 15)
      if (totalImages > 15) {
        errors.push('Referenzbilder + generierte Bilder darf nicht mehr als 15 sein')
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Helper function to validate uploaded files
export function validateImageFiles(files) {
  const errors = []
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/bmp', 'image/tiff', 'image/gif']
  const maxSize = 10 * 1024 * 1024 // 10MB
  
  if (files.length > 14) {
    errors.push('Maximal 14 Bilder gleichzeitig')
  }
  
  files.forEach((file, index) => {
    if (!validTypes.includes(file.type)) {
      errors.push(`${file.name}: Ungültiges Format`)
    }
    if (file.size > maxSize) {
      errors.push(`${file.name}: Zu groß (max 10MB)`)
    }
  })
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Export Credit Management Functions for external use
export { getUserCredits, calculateSeedreamCost, checkSufficientCredits, deductCredits }

// Available styles for Seedream 4.5
export const SEEDREAM_STYLES = [
  { value: 'auto', label: 'Automatisch' },
  { value: 'photographic', label: 'Fotorealistisch' },
  { value: 'digital_art', label: 'Digital Art' },
  { value: 'comic_book', label: 'Comic Style' },
  { value: 'fantasy_art', label: 'Fantasy Art' },
  { value: 'line_art', label: 'Line Art' },
  { value: 'anime', label: 'Anime Style' }
]

// Available sizes for Seedream 4.5
export const SEEDREAM_SIZES = [
  { value: '1K', label: '1024x1024 (1K)' },
  { value: '2K', label: '2048x2048 (2K)' },
  { value: '4K', label: '4096x4096 (4K)' }
]