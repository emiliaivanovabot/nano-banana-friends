// Kling AI Avatar Service
// Integration for Kling Avatar 2.0 Pro API

const KLING_ACCESS_KEY = import.meta.env.VITE_KLING_AI_ACCESS_KEY
const KLING_SECRET_KEY = import.meta.env.VITE_KLING_AI_SECRET_KEY
const KLING_API_BASE_URL = 'https://api-singapore.klingai.com'

// Create JWT token for Kling API authentication
async function createKlingJWTToken() {
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
    return btoa(JSON.stringify(obj))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
  }

  const encodedHeader = base64UrlEncode(header)
  const encodedPayload = base64UrlEncode(payload)
  
  // Create signature
  const signatureBase = `${encodedHeader}.${encodedPayload}`
  const encoder = new TextEncoder()
  const keyData = encoder.encode(KLING_SECRET_KEY)
  const messageData = encoder.encode(signatureBase)
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData)
  const signatureArray = Array.from(new Uint8Array(signature))
  const encodedSignature = btoa(String.fromCharCode(...signatureArray))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
  
  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`
}

// Convert file to base64 for JSON transmission
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// Generate avatar video from image and text/audio
export async function generateKlingAvatar(options = {}) {
  const {
    imageFile,
    textInput = '',
    audioFile = null,
    mode = 'text', // 'text' or 'audio'
    duration = 5000, // milliseconds
    quality = 'HD', // 'HD' or 'FHD'
    aspectRatio = '16:9'
  } = options

  try {
    console.log('🎬 Starting Kling Avatar generation...')
    console.log('Options:', { mode, duration, quality, aspectRatio })

    if (!KLING_ACCESS_KEY || !KLING_SECRET_KEY) {
      throw new Error('Kling AI API Keys nicht gefunden in Environment Variables')
    }

    if (!imageFile) {
      throw new Error('Bild ist erforderlich')
    }

    if (mode === 'text' && !textInput.trim()) {
      throw new Error('Text ist erforderlich für Text-Modus')
    }

    if (mode === 'audio' && !audioFile) {
      throw new Error('Audio-Datei ist erforderlich für Audio-Modus')
    }

    // Create FormData for multipart upload
    const formData = new FormData()
    formData.append('image', imageFile)
    
    if (mode === 'text') {
      formData.append('text', textInput)
      formData.append('mode', 'text')
    } else {
      formData.append('audio', audioFile)
      formData.append('mode', 'audio')
    }

    formData.append('duration', duration.toString())
    formData.append('quality', quality)
    formData.append('aspect_ratio', aspectRatio)

    // Create JWT authentication token
    const jwtToken = await createKlingJWTToken()

    console.log('🚀 Making API call via Backend Proxy...')
    
    // Convert to KlingAI API format
    const cleanImageB64 = imageFile ? (await fileToBase64(imageFile)).split(',')[1] : null
    const cleanAudioB64 = audioFile ? (await fileToBase64(audioFile)).split(',')[1] : null
    
    const requestData = {
      image: cleanImageB64,
      mode: mode === 'text' ? 'std' : 'pro'
    }
    
    if (mode === 'text' && textInput) {
      requestData.prompt = textInput
    } else if (mode === 'audio' && cleanAudioB64) {
      requestData.sound_file = cleanAudioB64
    }

    const response = await fetch('http://localhost:3001/api/kling-proxy/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`
      },
      body: JSON.stringify(requestData)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Kling API Error:', response.status, errorData)
      
      if (response.status === 401) {
        throw new Error('API Authentication fehlgeschlagen. Bitte überprüfe deine Kling AI Keys.')
      } else if (response.status === 402) {
        throw new Error('Nicht genügend Credits. Bitte lade dein Kling AI Konto auf.')
      } else if (response.status === 429) {
        throw new Error('Rate Limit erreicht. Bitte warte einen Moment und versuche es erneut.')
      } else {
        throw new Error(errorData.message || `API Fehler: ${response.status}`)
      }
    }

    const data = await response.json()
    console.log('✅ Kling Avatar API response:', data)

    // Validate response structure
    if (!data.id) {
      throw new Error('Ungültige API-Antwort: Keine Task-ID erhalten')
    }

    return {
      success: true,
      taskId: data.id,
      estimatedDuration: 120000,
      status: 'processing',
      message: 'Avatar-Generierung gestartet'
    }

  } catch (error) {
    console.error('❌ Kling Avatar Service Error:', error)
    return {
      success: false,
      error: error.message,
      taskId: null
    }
  }
}

// Check generation status and get result
export async function getKlingAvatarStatus(taskId) {
  try {
    console.log('🔍 Checking Kling Avatar status for task:', taskId)

    if (!KLING_ACCESS_KEY || !KLING_SECRET_KEY) {
      throw new Error('Kling AI API Keys nicht gefunden')
    }

    const jwtToken = await createKlingJWTToken()

    const response = await fetch(`http://localhost:3001/api/kling-proxy/status/${taskId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Status check failed: ${response.status}`)
    }

    const data = await response.json()
    console.log('📊 Kling Avatar status:', data)

    let status = 'processing'
    let progress = 0
    let videoUrl = null
    let message = 'Verarbeitung...'

    if (data.status === 'succeed' && data.works && data.works[0] && data.works[0].resource) {
      status = 'completed'
      progress = 100
      videoUrl = data.works[0].resource
      message = 'Avatar erfolgreich generiert!'
    } else if (data.status === 'failed') {
      status = 'failed'
      message = data.message || 'Generierung fehlgeschlagen'
    } else if (data.status === 'processing') {
      status = 'processing'
      progress = 50
      message = 'Verarbeitung läuft...'
    }

    return {
      success: true,
      status: status,
      progress: progress,
      videoUrl: videoUrl,
      thumbnailUrl: null,
      message: message,
      estimatedTimeRemaining: status === 'completed' ? 0 : 90000
    }

  } catch (error) {
    console.error('❌ Status check error:', error)
    return {
      success: false,
      error: error.message,
      status: 'unknown'
    }
  }
}


// Polling function to wait for completion
export async function waitForKlingCompletion(taskId, maxWaitTime = 300000, pollInterval = 3000) {
  const startTime = Date.now()
  
  return new Promise((resolve, reject) => {
    const pollStatus = async () => {
      try {
        const statusResult = await getKlingAvatarStatus(taskId)
        
        if (!statusResult.success) {
          reject(new Error(statusResult.error))
          return
        }

        const { status, progress, videoUrl, message } = statusResult

        console.log(`🎬 Avatar generation: ${status} (${progress}%)`)

        if (status === 'completed' && videoUrl) {
          resolve({
            success: true,
            videoUrl,
            thumbnailUrl: statusResult.thumbnailUrl,
            message: 'Avatar erfolgreich generiert!'
          })
          return
        }

        if (status === 'failed') {
          reject(new Error(message || 'Avatar-Generierung fehlgeschlagen'))
          return
        }

        // Check timeout
        if (Date.now() - startTime > maxWaitTime) {
          reject(new Error('Timeout: Avatar-Generierung dauert zu lange'))
          return
        }

        // Continue polling
        setTimeout(pollStatus, pollInterval)

      } catch (error) {
        reject(error)
      }
    }

    // Start polling
    pollStatus()
  })
}

// Get user credit balance
export async function getKlingCredits() {
  try {
    console.log('💰 Checking Kling AI credits...')

    if (!KLING_ACCESS_KEY || !KLING_SECRET_KEY) {
      throw new Error('Kling AI API Keys nicht gefunden')
    }

    const jwtToken = await createKlingJWTToken()

    const response = await fetch('http://localhost:3001/api/kling-proxy/credits', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Credits check failed: ${response.status}`)
    }

    const data = await response.json()
    console.log('💎 Kling Credits:', data)

    return {
      success: true,
      credits: data.credits || 0,
      dailyLimit: data.daily_limit || 66,
      resetTime: data.reset_time || null
    }

  } catch (error) {
    console.error('❌ Credits check error:', error)
    return {
      success: false,
      error: error.message,
      credits: 0
    }
  }
}

// Test function for development
export async function testKlingService() {
  console.log('🧪 Testing Kling Avatar service...')
  
  try {
    // Test credits check
    const creditsResult = await getKlingCredits()
    console.log('Credits result:', creditsResult)
    
    return {
      success: true,
      message: 'Kling service test completed',
      credits: creditsResult.credits
    }
    
  } catch (error) {
    console.error('Test failed:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// Helper function to validate file types
export function validateKlingFiles(imageFile, audioFile = null) {
  const errors = []
  
  // Image validation
  if (!imageFile) {
    errors.push('Bild ist erforderlich')
  } else {
    const validImageTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validImageTypes.includes(imageFile.type)) {
      errors.push('Unterstützte Bildformate: JPEG, PNG, WebP')
    }
    
    // Check file size (max 10MB)
    if (imageFile.size > 10 * 1024 * 1024) {
      errors.push('Bild darf maximal 10MB groß sein')
    }
  }
  
  // Audio validation (if provided)
  if (audioFile) {
    const validAudioTypes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/m4a']
    if (!validAudioTypes.includes(audioFile.type)) {
      errors.push('Unterstützte Audio-Formate: MP3, WAV, M4A')
    }
    
    // Check file size (max 50MB)
    if (audioFile.size > 50 * 1024 * 1024) {
      errors.push('Audio-Datei darf maximal 50MB groß sein')
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}