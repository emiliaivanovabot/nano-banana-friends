// KIE.AI Status Check Proxy - Vercel Serverless Function
// Handles task status checks for both Nano-Banana and VEO tasks

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

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { taskId, type = 'nanoBanana' } = req.query

    if (!taskId) {
      return res.status(400).json({ error: 'TaskId is required' })
    }

    console.log('🔍 KIE.AI Status Check:', { taskId, type })

    if (!KIE_AI_API_KEY) {
      return res.status(500).json({ 
        error: 'KIE.AI API Key not configured',
        details: 'Missing environment variable'
      })
    }

    // Determine endpoint based on task type
    let endpoint
    if (type === 'veo' || taskId.startsWith('veo_')) {
      endpoint = `${KIE_AI_API_URL}/api/v1/veo/record-info?taskId=${taskId}`
    } else {
      endpoint = `${KIE_AI_API_URL}/api/v1/jobs/recordInfo?taskId=${taskId}`
    }

    console.log('📤 Checking status at:', endpoint)

    // Make request to KIE.AI status endpoint
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${KIE_AI_API_KEY}`
      }
    })

    console.log('📥 KIE.AI Status response:', response.status)

    const data = await response.json()

    if (!response.ok) {
      console.error('❌ KIE.AI Status Error:', response.status, data)
      return res.status(response.status).json({
        error: data.error || 'Status check failed',
        details: data,
        kieStatus: response.status
      })
    }

    // Normalize response format for different task types
    let normalizedResponse
    if (type === 'veo' || taskId.startsWith('veo_')) {
      // VEO video task
      normalizedResponse = {
        success: true,
        state: data.data?.successFlag === 1 ? 'success' : 
               data.data?.successFlag === 0 ? 'generating' : 'failed',
        resultUrls: data.data?.response?.resultUrls,
        data: data
      }
    } else {
      // Nano-Banana image task
      normalizedResponse = {
        success: true,
        state: data.data?.state,
        resultUrls: data.data?.resultJson ? JSON.parse(data.data.resultJson).resultUrls : null,
        data: data
      }
    }

    console.log('✅ Status check completed:', { 
      state: normalizedResponse.state,
      hasResults: !!normalizedResponse.resultUrls
    })
    
    res.json(normalizedResponse)

  } catch (error) {
    console.error('❌ KIE.AI Status Proxy Error:', error)
    res.status(500).json({ 
      error: error.message,
      details: 'Serverless function error'
    })
  }
}