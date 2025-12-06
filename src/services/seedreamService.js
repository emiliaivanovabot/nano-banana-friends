// Seedream 4.5 Service
// Integration for BytePlus Seedream 4.5 API - High-fidelity Image Generation

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

// Generate image with Seedream 4.5
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
    promptOptimization = 'standard' // 'standard' or 'fast'
  } = options

  try {
    console.log('🌱 Starting Seedream 4.5 generation...')
    console.log('Options:', { prompt, size, watermark, num_images, style })

    if (!SEEDREAM_API_KEY) {
      throw new Error('Seedream API Key nicht gefunden in Environment Variables')
    }

    if (!prompt || !prompt.trim()) {
      throw new Error('Prompt ist erforderlich')
    }

    // Convert size + aspectRatio to pixels - KORREKTE Berechnung
    const getPixelSize = (resolution, ratio) => {
      const baseSizes = {
        '1K': 1024,
        '2K': 2048,  
        '4K': 4096
      }
      
      const calculateCorrectSize = (baseSize, aspectRatio) => {
        const [w, h] = aspectRatio.split(':').map(Number)
        
        if (w > h) {
          // Landscape: width ist die längste Seite
          const width = baseSize
          const height = Math.round(baseSize * (h / w))
          return { width, height }
        } else {
          // Portrait: height ist die längste Seite  
          const height = baseSize
          const width = Math.round(baseSize * (w / h))
          return { width, height }
        }
      }
      
      const baseSize = baseSizes[resolution] || 1024
      const result = calculateCorrectSize(baseSize, ratio)
      
      return `${result.width}x${result.height}`
    }
    
    const pixelSize = getPixelSize(size, aspectRatio)
    
    const requestData = {
      model: 'seedream-4-5-251128',
      prompt: prompt.trim(),
      size: pixelSize,
      watermark: watermark,
      num_images: num_images
    }

    // Add style if not auto
    if (style !== 'auto') {
      requestData.style = style
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
    }

    // Add prompt optimization
    if (promptOptimization && promptOptimization !== 'standard') {
      requestData.optimize_prompt_options = {
        mode: promptOptimization
      }
    }

    console.log('🚀 Making Seedream API call...')

    const response = await fetch('http://localhost:3002/seedream/generate', {
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
      } else {
        throw new Error(errorData.message || `API Fehler: ${response.status}`)
      }
    }

    const data = await response.json()
    console.log('✅ Seedream API response:', data)

    // Validate response structure
    if (!data.data || !data.data.length) {
      throw new Error('Ungültige API-Antwort: Keine Bilder erhalten')
    }

    return {
      success: true,
      images: data.data.map(item => ({
        url: item.url,
        revisedPrompt: item.revised_prompt || prompt
      })),
      usage: data.usage || null,
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

    // Note: This might need adjustment based on actual BytePlus API endpoints
    const response = await fetch(`${SEEDREAM_API_BASE_URL}/account/usage`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SEEDREAM_API_KEY}`,
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