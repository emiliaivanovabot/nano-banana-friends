// Seedream 4.5 Generation Proxy - Vercel Serverless Function
// Handles Seedream 4.5 image generation through BytePlus API

const SEEDREAM_API_KEY = process.env.SEEDREAM_API_KEY
const SEEDREAM_API_BASE_URL = 'https://ark.ap-southeast.bytepluses.com/api/v3'

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('🌱 Seedream Proxy: Processing generation request')
    console.log('📊 Request details:', {
      prompt: req.body.prompt?.substring(0, 50) + '...',
      hasImage: !!req.body.image,
      imageCount: Array.isArray(req.body.image) ? req.body.image.length : (req.body.image ? 1 : 0),
      size: req.body.size
    })

    if (!SEEDREAM_API_KEY) {
      return res.status(500).json({ 
        error: 'Seedream API Key not configured',
        details: 'Missing environment variable'
      })
    }

    console.log('📤 Sending to Seedream API...')

    // Make request to Seedream API
    const response = await fetch(`${SEEDREAM_API_BASE_URL}/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SEEDREAM_API_KEY}`
      },
      body: JSON.stringify(req.body)
    })

    console.log('📥 Seedream API response:', response.status)

    const data = await response.json()

    if (!response.ok) {
      console.error('❌ Seedream API Error:', response.status, data)
      return res.status(response.status).json({
        error: data.error || 'Seedream generation failed',
        details: data,
        seedreamStatus: response.status
      })
    }

    console.log('✅ Seedream generation successful')
    
    res.json(data)

  } catch (error) {
    console.error('❌ Seedream Generate Proxy Error:', error)
    res.status(500).json({ 
      error: error.message,
      details: 'Serverless function error'
    })
  }
}