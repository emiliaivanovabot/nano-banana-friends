// Vercel Serverless Function - Kling AI API Proxy
// This bypasses CORS by making API calls server-side

const KLING_ACCESS_KEY = process.env.VITE_KLING_AI_ACCESS_KEY
const KLING_SECRET_KEY = process.env.VITE_KLING_AI_SECRET_KEY
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

export default async function handler(req, res) {
  // Enable CORS for localhost
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  console.log('🔥 Kling Proxy API called:', req.method, req.url)
  
  try {
    if (!KLING_ACCESS_KEY || !KLING_SECRET_KEY) {
      return res.status(500).json({ error: 'Kling AI Keys nicht konfiguriert' })
    }

    const jwtToken = await createKlingJWTToken()
    
    let targetUrl = ''
    let method = req.method
    let body = null

    // Route different endpoints according to official KlingAI API
    if (req.url.includes('/generate')) {
      // Avatar generation
      targetUrl = `${KLING_API_BASE_URL}/v1/videos/image2video`
      method = 'POST'
      body = req.body
    } else if (req.url.includes('/status/')) {
      // Status check
      const taskId = req.url.split('/status/')[1]
      targetUrl = `${KLING_API_BASE_URL}/v1/videos/image2video/${taskId}`
      method = 'GET'
    } else if (req.url.includes('/credits')) {
      // Credits check
      targetUrl = `${KLING_API_BASE_URL}/v1/user/profile`
      method = 'GET'
    } else {
      return res.status(404).json({ error: 'Unknown endpoint' })
    }

    console.log('🚀 Proxying to:', targetUrl)

    // Make the actual API call to Kling AI with proper JWT authentication
    const response = await fetch(targetUrl, {
      method: method,
      headers: {
        'Authorization': `Bearer ${jwtToken}`,
        'Content-Type': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined
    })

    const data = await response.json()
    
    if (!response.ok) {
      console.error('❌ Kling API Error:', response.status, data)
      return res.status(response.status).json(data)
    }

    console.log('✅ Kling API Success:', data)
    res.status(200).json(data)

  } catch (error) {
    console.error('❌ Proxy Error:', error)
    res.status(500).json({ 
      error: 'Proxy Error', 
      message: error.message 
    })
  }
}