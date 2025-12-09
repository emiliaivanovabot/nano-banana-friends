import express from 'express'
import fetch from 'node-fetch'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const app = express()
const port = 3002

app.use(express.json({ limit: '100mb' }))
app.use(express.urlencoded({ limit: '100mb', extended: true }))

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200)
  } else {
    next()
  }
})

const SEEDREAM_API_KEY = process.env.VITE_SEEDREAM_API_KEY
const SEEDREAM_API_BASE_URL = 'https://ark.ap-southeast.bytepluses.com/api/v3'

// Seedream Image Generation Proxy
app.post('/seedream/generate', async (req, res) => {
  try {
    console.log('🌱 Seedream Proxy: Image generation request received')
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
    
    // Log what we're actually sending
    const requestBody = {
      ...req.body,
      image: Array.isArray(req.body.image) 
        ? `[${req.body.image.length} base64 images]` 
        : req.body.image ? '[1 base64 image]' : 'none'
    }
    console.log('📋 Request body structure:', JSON.stringify(requestBody, null, 2))
    
    const response = await fetch(`${SEEDREAM_API_BASE_URL}/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SEEDREAM_API_KEY}`
      },
      body: JSON.stringify(req.body),
      timeout: 60000 // 60 seconds timeout
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
    console.error('❌ Seedream Proxy Error:', error)
    res.status(500).json({ 
      error: error.message,
      details: 'Proxy server error'
    })
  }
})

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'seedream-proxy',
    timestamp: new Date().toISOString()
  })
})

app.listen(port, () => {
  console.log(`🌱 Seedream Proxy server running on port ${port}`)
  console.log(`🔑 API Key configured: ${SEEDREAM_API_KEY ? 'Yes' : 'No'}`)
})

export default app