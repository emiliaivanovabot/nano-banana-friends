import express from 'express'
import fetch from 'node-fetch'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const app = express()
const port = 3002

app.use(express.json({ limit: '50mb' }))

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
    
    if (!SEEDREAM_API_KEY) {
      return res.status(500).json({ 
        error: 'Seedream API Key not configured' 
      })
    }

    const response = await fetch(`${SEEDREAM_API_BASE_URL}/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SEEDREAM_API_KEY}`
      },
      body: JSON.stringify(req.body)
    })

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