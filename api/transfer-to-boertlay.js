/**
 * Vercel Serverless Function: Transfer image from Supabase Storage to Boertlay FTP
 * 
 * Process:
 * 1. Download image from Supabase Storage 
 * 2. Upload image to Boertlay FTP
 * 3. Delete image from Supabase Storage
 * 4. Return Boertlay public URL
 */

import { createClient } from '@supabase/supabase-js'
import { Client as FTPClient } from 'basic-ftp'

export default async function handler(req, res) {
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

  const { supabasePath, username, filename } = req.body

  if (!supabasePath || !username || !filename) {
    return res.status(400).json({ 
      error: 'Missing required fields: supabasePath, username, filename' 
    })
  }

  console.log('🚀 Starting FTP transfer process:', { supabasePath, username, filename })

  // Debug Environment Variables
  console.log('🔍 Environment Debug:', {
    SUPABASE_URL: !!process.env.SUPABASE_URL,
    VITE_SUPABASE_URL: !!process.env.VITE_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    VITE_SUPABASE_SERVICE_ROLE_KEY: !!process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
    BOERTLAY_FTP_HOST: !!process.env.BOERTLAY_FTP_HOST,
    BOERTLAY_FTP_USER: !!process.env.BOERTLAY_FTP_USER,
    BOERTLAY_FTP_PASSWORD: !!process.env.BOERTLAY_FTP_PASSWORD,
    BOERTLAY_BASE_URL: !!process.env.BOERTLAY_BASE_URL
  })

  try {
    // Initialize Supabase client with service role key - try both possible env names
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !serviceKey) {
      throw new Error(`Missing Supabase credentials: URL=${!!supabaseUrl}, ServiceKey=${!!serviceKey}`)
    }
    
    const supabase = createClient(supabaseUrl, serviceKey)

    console.log('📥 Step 1: Downloading from Supabase Storage...', { bucket: 'temp-uploads', path: supabasePath })

    // Download image from Supabase Storage
    const { data: downloadData, error: downloadError } = await supabase.storage
      .from('temp-uploads')
      .download(supabasePath)

    if (downloadError) {
      throw new Error(`Supabase download failed: ${downloadError.message}`)
    }

    console.log('✅ Downloaded from Supabase Storage, size:', downloadData.size)

    console.log('📤 Step 2: Uploading to Boertlay FTP...')

    // Initialize FTP client
    const ftpClient = new FTPClient()
    ftpClient.ftp.verbose = false

    try {
      // Connect to Boertlay FTP
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

      // Convert blob to buffer for FTP upload
      const arrayBuffer = await downloadData.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      // Upload file to FTP
      const remoteFilePath = remotePath + filename
      console.log('📤 Uploading to FTP:', remoteFilePath)
      
      await ftpClient.uploadFrom(buffer, remoteFilePath)
      
      console.log('✅ Uploaded to Boertlay FTP successfully')

      // Close FTP connection
      ftpClient.close()

      // Generate public URL
      const boertlayUrl = `${process.env.BOERTLAY_BASE_URL}/user_pics/generated/${username}/${year}/${month}/${filename}`
      
      console.log('🌐 Generated Boertlay URL:', boertlayUrl)

      console.log('🗑️ Step 3: Deleting from Supabase Storage...')

      // Delete from Supabase Storage
      const { error: deleteError } = await supabase.storage
        .from('temp-uploads')
        .remove([supabasePath])

      if (deleteError) {
        console.warn('⚠️ Failed to delete from Supabase Storage:', deleteError.message)
        // Continue anyway - file was successfully uploaded to Boertlay
      } else {
        console.log('✅ Deleted from Supabase Storage')
      }

      console.log('🎉 Transfer process completed successfully!')

      return res.status(200).json({
        success: true,
        boertlayUrl: boertlayUrl,
        message: 'Image transferred successfully to Boertlay FTP'
      })

    } catch (ftpError) {
      ftpClient.close()
      throw new Error(`FTP operation failed: ${ftpError.message}`)
    }

  } catch (error) {
    console.error('❌ Transfer process failed:', error)
    
    // Include debug info in error response for troubleshooting
    const debugInfo = {
      SUPABASE_URL: !!process.env.SUPABASE_URL,
      VITE_SUPABASE_URL: !!process.env.VITE_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      VITE_SUPABASE_SERVICE_ROLE_KEY: !!process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
      BOERTLAY_FTP_HOST: !!process.env.BOERTLAY_FTP_HOST,
      BOERTLAY_FTP_USER: !!process.env.BOERTLAY_FTP_USER,
      BOERTLAY_FTP_PASSWORD: !!process.env.BOERTLAY_FTP_PASSWORD,
      BOERTLAY_BASE_URL: !!process.env.BOERTLAY_BASE_URL
    }
    
    return res.status(500).json({
      success: false,
      error: error.message,
      details: 'Image transfer from Supabase to Boertlay FTP failed',
      debug: debugInfo,
      requestData: { supabasePath, username, filename }
    })
  }
}

// Configure function timeout (5 minutes max for Pro plan)
export const config = {
  maxDuration: 300, // 5 minutes
}