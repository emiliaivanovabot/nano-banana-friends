/**
 * Vercel Serverless Function: Convert Base64 image to AVIF
 * Uses Canvas API server-side with Node.js canvas library
 */

import { createCanvas, loadImage } from 'canvas'

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

    const { base64Image, quality = 80 } = req.body

    if (!base64Image) {
      return res.status(400).json({ 
        error: 'Missing required field: base64Image' 
      })
    }

    console.log('🔄 Starting AVIF conversion...')

    try {
      // Load image from base64
      const image = await loadImage(base64Image)
      
      // Create canvas with image dimensions
      const canvas = createCanvas(image.width, image.height)
      const ctx = canvas.getContext('2d')
      
      // Draw image to canvas
      ctx.drawImage(image, 0, 0)
      
      // Try to convert to AVIF
      let resultImage
      let format = 'jpeg' // fallback
      
      try {
        // Attempt AVIF conversion
        resultImage = canvas.toDataURL('image/avif', quality / 100)
        if (resultImage.startsWith('data:image/avif')) {
          format = 'avif'
          console.log('✅ AVIF conversion successful')
        } else {
          throw new Error('AVIF not supported')
        }
      } catch (avifError) {
        console.log('⚠️ AVIF not supported, falling back to WebP')
        try {
          resultImage = canvas.toDataURL('image/webp', quality / 100)
          if (resultImage.startsWith('data:image/webp')) {
            format = 'webp'
            console.log('✅ WebP fallback successful')
          } else {
            throw new Error('WebP not supported')
          }
        } catch (webpError) {
          console.log('⚠️ WebP not supported, falling back to JPEG')
          resultImage = canvas.toDataURL('image/jpeg', quality / 100)
          format = 'jpeg'
          console.log('✅ JPEG fallback successful')
        }
      }

      const originalSizeKB = Math.round(base64Image.length / 1024)
      const compressedSizeKB = Math.round(resultImage.length / 1024)
      const compressionRatio = Math.round((1 - resultImage.length / base64Image.length) * 100)

      console.log(`🚀 Conversion complete: ${format.toUpperCase()}`, {
        original: originalSizeKB + 'KB',
        compressed: compressedSizeKB + 'KB',
        compression: compressionRatio + '% smaller'
      })

      return res.status(200).json({
        success: true,
        convertedImage: resultImage,
        format: format,
        originalSize: originalSizeKB,
        compressedSize: compressedSizeKB,
        compressionRatio: compressionRatio
      })

    } catch (conversionError) {
      throw new Error(`Image conversion failed: ${conversionError.message}`)
    }

  } catch (error) {
    console.error('❌ AVIF conversion failed:', error)
    
    return res.status(500).json({
      success: false,
      error: error.message,
      details: 'AVIF conversion failed'
    })
  }
}

// Configure function timeout
export const config = {
  maxDuration: 60, // 1 minute
}