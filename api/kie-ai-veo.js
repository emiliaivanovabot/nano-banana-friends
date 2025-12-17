// KIE.AI VEO Video Generation Proxy - Vercel Serverless Function
// Handles VEO 3.1 video generation through KIE.AI

const KIE_AI_API_KEY = process.env.KIE_AI_API_KEY
const KIE_AI_API_URL = process.env.KIE_AI_API_URL || 'https://api.kie.ai'

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
    console.log('🔄 KIE.AI VEO Proxy: Processing video generation request')

    if (!KIE_AI_API_KEY) {
      return res.status(500).json({ 
        error: 'KIE.AI API Key not configured',
        details: 'Missing environment variable'
      })
    }

    console.log('📤 Sending to KIE.AI VEO API:', {
      prompt: req.body.prompt?.substring(0, 50) + '...',
      model: req.body.model,
      aspectRatio: req.body.aspectRatio,
      hasImageUrls: !!req.body.imageUrls?.length
    })

    // Make request to KIE.AI VEO endpoint
    const response = await fetch(`${KIE_AI_API_URL}/api/v1/veo/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${KIE_AI_API_KEY}`
      },
      body: JSON.stringify(req.body)
    })

    console.log('📥 KIE.AI VEO response:', response.status)

    const data = await response.json()

    if (!response.ok) {
      console.error('❌ KIE.AI VEO Error:', response.status, data)
      return res.status(response.status).json({
        error: data.error || 'VEO generation failed',
        details: data,
        kieStatus: response.status
      })
    }

    console.log('✅ KIE.AI VEO task started:', data.data?.taskId)
    
    res.json(data)

  } catch (error) {
    console.error('❌ KIE.AI VEO Proxy Error:', error)
    res.status(500).json({ 
      error: error.message,
      details: 'Serverless function error'
    })
  }
}