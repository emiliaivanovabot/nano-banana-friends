// Vercel Serverless API Route for Seedream 4.5
// This replaces the Express proxy server for production deployment

const SEEDREAM_API_KEY = process.env.SEEDREAM_API_KEY
const SEEDREAM_API_BASE_URL = 'https://ark.ap-southeast.bytepluses.com/api/v3'

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('🌱 Seedream Generate: Image generation request received')
    console.log('📊 Request details:', {
      prompt: req.body.prompt?.substring(0, 50) + '...',
      hasImage: !!req.body.image,
      imageCount: Array.isArray(req.body.image) ? req.body.image.length : (req.body.image ? 1 : 0),
      size: req.body.size
    })
    
    if (!SEEDREAM_API_KEY) {
      return res.status(500).json({ 
        error: 'Seedream API Key not configured' 
      })
    }

    console.log('📤 Sending to Seedream API...')
    
    // Log what we're actually sending (without full base64 data)
    const requestBody = {
      ...req.body,
      image: Array.isArray(req.body.image) 
        ? `[${req.body.image.length} base64 images]` 
        : req.body.image ? '[1 base64 image]' : 'none'
    }
    console.log('📋 Request body structure:', JSON.stringify(requestBody, null, 2))
    
    const response = await fetch(`${SEEDREAM_API_BASE_URL}/text2img/generation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SEEDREAM_API_KEY}`
      },
      body: JSON.stringify(req.body)
    })
    
    console.log('📥 Seedream API responded:', response.status)

    const data = await response.json()

    if (!response.ok) {
      console.error('❌ Seedream API Error:', response.status, data)
      return res.status(response.status).json(data)
    }

    console.log('✅ Seedream generation successful')
    res.json(data)

  } catch (error) {
    console.error('❌ Seedream Generate Error:', error)
    res.status(500).json({ 
      error: error.message,
      details: 'Serverless function error'
    })
  }
}