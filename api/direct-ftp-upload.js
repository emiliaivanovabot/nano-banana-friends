/**
 * Vercel Serverless Function: Direct Base64 to Boertlay FTP Upload
 * 
 * Process:
 * 1. Receive Base64 image data from client
 * 2. Convert Base64 to Buffer
 * 3. Upload directly to Boertlay FTP
 * 4. Return Boertlay public URL
 */

import { Client as FTPClient } from 'basic-ftp'

export default async function handler(req, res) {
  try {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true)
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version')

    if (req.method === 'OPTIONS') {
      res.status(200).end()
      return
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    const { base64Image, username, filename } = req.body

    if (!base64Image || !username || !filename) {
      return res.status(400).json({ 
        error: 'Missing required fields: base64Image, username, filename' 
      })
    }

    console.log('🚀 Starting direct FTP upload:', { username, filename })

    // Debug Environment Variables
    const debugInfo = {
      BOERTLAY_FTP_HOST: !!process.env.BOERTLAY_FTP_HOST,
      BOERTLAY_FTP_USER: !!process.env.BOERTLAY_FTP_USER,
      BOERTLAY_FTP_PASSWORD: !!process.env.BOERTLAY_FTP_PASSWORD,
      BOERTLAY_BASE_URL: !!process.env.BOERTLAY_BASE_URL
    }
    console.log('🔍 Environment Debug:', debugInfo)

    // Convert Base64 to Buffer
    console.log('📤 Step 1: Converting Base64 to Buffer...')
    const base64Data = base64Image.replace(/^data:image\/[a-z]+;base64,/, '')
    const imageBuffer = Buffer.from(base64Data, 'base64')
    console.log('✅ Buffer created, size:', imageBuffer.length, 'bytes')

    // Initialize FTP client
    const ftpClient = new FTPClient()
    ftpClient.ftp.verbose = false

    try {
      // Connect to Boertlay FTP
      console.log('🔌 Connecting to FTP:', { 
        host: process.env.BOERTLAY_FTP_HOST, 
        user: process.env.BOERTLAY_FTP_USER,
        port: parseInt(process.env.BOERTLAY_FTP_PORT) || 21
      })
      
      await ftpClient.access({
        host: process.env.BOERTLAY_FTP_HOST,
        user: process.env.BOERTLAY_FTP_USER,
        password: process.env.BOERTLAY_FTP_PASSWORD,
        port: parseInt(process.env.BOERTLAY_FTP_PORT) || 21,
        secure: false
      })

      console.log('✅ Connected to Boertlay FTP')

      // Create directory structure
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const remotePath = `/httpdocs/user_pics/generated/${username}/${year}/${month}/`

      console.log('📁 Creating directory:', remotePath)
      await ftpClient.ensureDir(remotePath)

      // Upload buffer to FTP using uploadFrom with Readable stream
      const { Readable } = await import('stream')
      const remoteFilePath = remotePath + filename
      console.log('📤 Uploading to FTP:', remoteFilePath)
      
      // Convert Buffer to Readable stream for FTP upload
      const imageStream = Readable.from(imageBuffer)
      await ftpClient.uploadFrom(imageStream, remoteFilePath)
      
      console.log('✅ Uploaded to Boertlay FTP successfully')

      // Close FTP connection
      ftpClient.close()

      // Generate public URL
      const boertlayUrl = `${process.env.BOERTLAY_BASE_URL}/user_pics/generated/${username}/${year}/${month}/${filename}`
      
      console.log('🌐 Generated Boertlay URL:', boertlayUrl)
      console.log('🎉 Direct FTP upload completed successfully!')

      return res.status(200).json({
        success: true,
        boertlayUrl: boertlayUrl,
        message: 'Image uploaded successfully to Boertlay FTP',
        fileSize: imageBuffer.length
      })

    } catch (ftpError) {
      ftpClient.close()
      throw new Error(`FTP operation failed: ${ftpError.message}`)
    }

  } catch (error) {
    console.error('❌ Direct FTP upload failed:', error)
    
    // Include debug info in error response for troubleshooting
    const debugInfo = {
      BOERTLAY_FTP_HOST: !!process.env.BOERTLAY_FTP_HOST,
      BOERTLAY_FTP_USER: !!process.env.BOERTLAY_FTP_USER,
      BOERTLAY_FTP_PASSWORD: !!process.env.BOERTLAY_FTP_PASSWORD,
      BOERTLAY_BASE_URL: !!process.env.BOERTLAY_BASE_URL
    }
    
    return res.status(500).json({
      success: false,
      error: error.message,
      details: 'Direct FTP upload to Boertlay failed',
      debug: debugInfo,
      requestData: { 
        username: req.body?.username, 
        filename: req.body?.filename,
        hasBase64: !!req.body?.base64Image
      }
    })
  }
}

// Configure function timeout (5 minutes max for Pro plan)
export const config = {
  maxDuration: 300, // 5 minutes
}