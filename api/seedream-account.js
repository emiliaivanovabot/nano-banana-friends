// Vercel Serverless API Route for Seedream Account Info
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

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('📊 Seedream Account: Account info request received')
    
    if (!SEEDREAM_API_KEY) {
      return res.status(500).json({ 
        error: 'Seedream API Key not configured' 
      })
    }

    console.log('📤 Fetching from Seedream account API...')
    
    const response = await fetch(`${SEEDREAM_API_BASE_URL}/account/usage`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SEEDREAM_API_KEY}`
      }
    })
    
    console.log('📥 Seedream Account API responded:', response.status)

    if (!response.ok) {
      // If account endpoint doesn't exist, return basic info
      console.log('⚠️ Account endpoint not available, returning default info')
      return res.json({
        success: true,
        credits: 'Unknown',
        usage: 'Check BytePlus Console'
      })
    }

    const data = await response.json()
    console.log('✅ Seedream account info retrieved successfully')
    res.json({
      success: true,
      credits: data.credits || data.remaining_credits || 'Unknown',
      usage: data.usage || null
    })

  } catch (error) {
    console.error('❌ Seedream Account Error:', error)
    res.status(500).json({ 
      error: error.message,
      details: 'Account info serverless function error'
    })
  }
}