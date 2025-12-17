// KIE.AI Upload Proxy - Vercel Serverless Function
// Handles secure image uploads to KIE.AI storage

const KIE_AI_API_KEY = process.env.KIE_AI_API_KEY
const KIE_AI_UPLOAD_URL = process.env.KIE_AI_UPLOAD_URL || 'https://kieai.redpandaai.co'

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
    console.log('🔄 KIE.AI Upload Proxy: Processing upload request')

    if (!KIE_AI_API_KEY) {
      return res.status(500).json({ 
        error: 'KIE.AI API Key not configured',
        details: 'Missing environment variable'
      })
    }

    // Extract upload data from request
    const { base64Data, fileName, uploadPath = 'documents/upload' } = req.body

    if (!base64Data) {
      return res.status(400).json({
        error: 'Missing base64Data in request body'
      })
    }

    console.log('📤 Uploading to KIE.AI:', {
      fileName: fileName || 'Generated file',
      uploadPath,
      dataSize: base64Data.length
    })

    // Make request to KIE.AI upload endpoint
    const response = await fetch(`${KIE_AI_UPLOAD_URL}/api/file-base64-upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${KIE_AI_API_KEY}`
      },
      body: JSON.stringify({
        base64Data,
        uploadPath,
        fileName: fileName || `${Date.now()}.jpg`
      })
    })

    console.log('📥 KIE.AI Upload response:', response.status)

    const data = await response.json()

    if (!response.ok) {
      console.error('❌ KIE.AI Upload Error:', response.status, data)
      return res.status(response.status).json({
        error: data.error || 'Upload failed',
        details: data,
        kieStatus: response.status
      })
    }

    console.log('✅ KIE.AI Upload successful')
    
    res.json({
      success: true,
      data: data,
      downloadUrl: data.data?.downloadUrl
    })

  } catch (error) {
    console.error('❌ KIE.AI Upload Proxy Error:', error)
    res.status(500).json({ 
      error: error.message,
      details: 'Serverless function error'
    })
  }
}