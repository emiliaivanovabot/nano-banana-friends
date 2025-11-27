/**
 * Utility functions for image upload to Boertlay server
 */

import { supabase } from '../lib/supabase'
import { createClient } from '@supabase/supabase-js'
import { updateDailyUsage } from './usageTracking.js'

/**
 * Convert base64 image data to File object
 * @param {string} base64Data - Base64 encoded image data
 * @param {string} filename - Desired filename
 * @returns {File} File object ready for upload
 */
export const base64ToFile = (base64Data, filename) => {
  // Remove data URL prefix if present
  const base64 = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');
  
  // Convert base64 to binary
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  // Create File object
  return new File([bytes], filename, { type: 'image/png' });
};

/**
 * Upload image file to Boertlay server via FTP (BROWSER VERSION)
 * @param {File} file - Image file to upload
 * @param {string} modelId - Model ID for folder organization (e.g., 'emilia-berlin', 'jessy-germany')
 * @returns {Promise<string>} Public URL of uploaded image
 */
export const uploadToBoertlay = async (file, modelId) => {
  // For now, simulate upload and return a mock URL
  // TODO: Implement actual upload mechanism
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substr(2, 9);
  const filename = `${modelId}_${timestamp}_${randomId}.png`;
  
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  
  // Simulate upload delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Return mock URL (replace with real upload later)
  const mockUrl = `https://boertlay.de/user_pics/generated/${modelId}/${year}/${month}/${filename}`;
  
  console.log('🔄 Mock upload completed:', mockUrl);
  return mockUrl;
};

/**
 * Simple test function to verify FTP connection
 * @param {string} testModelId - Test model ID
 * @returns {Promise<boolean>} Success status
 */
export const testBoertlayConnection = async (testModelId = 'test-user') => {
  try {
    // Create a minimal test image (1x1 pixel PNG)
    const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    
    const testFile = base64ToFile(testImageBase64, 'test-connection.png');
    const uploadUrl = await uploadToBoertlay(testFile, testModelId);
    
    console.log('✅ FTP Upload Test Successful!');
    console.log('📁 Uploaded to:', uploadUrl);
    
    // Verify URL is accessible
    const checkResponse = await fetch(uploadUrl);
    if (checkResponse.ok) {
      console.log('✅ Image URL is accessible!');
      return true;
    } else {
      console.log('⚠️  Image uploaded but URL not accessible');
      return false;
    }
    
  } catch (error) {
    console.error('❌ FTP Upload Test Failed:', error);
    return false;
  }
};

/**
 * Batch upload multiple images (for 4x/10x generations)
 * @param {Array} results - Array of generation results with image data
 * @param {string} modelId - Model ID (e.g., 'emilia-berlin', 'jessy-germany')
 * @param {string} generationType - 'single', '4x', or '10x'
 * @param {string} batchId - UUID for grouping related images
 * @returns {Promise<Array>} Array of upload results
 */
export const uploadImageBatch = async (results, modelId, generationType, batchId) => {
  const uploadPromises = results.map(async (result, index) => {
    if (!result.success || !result.image) {
      return {
        index,
        success: false,
        error: 'No image data to upload'
      };
    }
    
    try {
      const timestamp = Date.now();
      const filename = `${generationType}_${timestamp}_${index}.png`;
      const imageFile = base64ToFile(result.image, filename);
      const imageUrl = await uploadToBoertlay(imageFile, modelId);
      
      return {
        index,
        success: true,
        imageUrl,
        batchId,
        generationType
      };
      
    } catch (error) {
      console.error(`Upload failed for image ${index}:`, error);
      return {
        index,
        success: false,
        error: error.message
      };
    }
  });
  
  return Promise.all(uploadPromises);
};

/**
 * Save image metadata to Supabase generations table
 * @param {string} imageUrl - Public URL of uploaded image
 * @param {string} username - Username (e.g., 'emilia.ivanova')
 * @param {string} generationType - 'single', '4x', or '10x'
 * @param {string} promptUsed - User's prompt
 * @param {string} originalFilename - Original filename
 * @param {number} fileSize - File size in bytes
 * @returns {Promise<Object>} Supabase insert result
 */
export const saveImageToDatabase = async (imageUrl, username, generationType, promptUsed, originalFilename, fileSize = null) => {
  try {
    const { data, error } = await supabase
      .from('generations')
      .insert([
        {
          id: crypto.randomUUID(),
          username: username,
          prompt: promptUsed,
          status: 'completed',
          result_image_url: imageUrl,
          generation_type: generationType,
          original_filename: originalFilename,
          file_size: fileSize,
          created_at: new Date().toISOString(),
          completed_at: new Date().toISOString()
        }
      ])
      .select()
    
    if (error) {
      throw error
    }
    
    console.log('✅ Image metadata saved to generations table:', data[0])
    return data[0]
    
  } catch (error) {
    console.error('❌ Failed to save image metadata:', error)
    throw error
  }
};

// REMOVED: uploadToSupabaseTemp() - No longer needed with direct FTP upload

/**
 * Convert base64 image to optimal format (AVIF/WebP/JPEG) using client-side Canvas
 * @param {string} base64Image - Base64 image data
 * @param {number} quality - Image quality (0-1, default 0.8)
 * @returns {Promise<Object>} Converted image with format info
 */
const convertToOptimalFormat = async (base64Image, quality = 0.8) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)
      
      let resultImage, format
      
      // Try AVIF first (most modern browsers support it)
      try {
        resultImage = canvas.toDataURL('image/avif', quality)
        if (resultImage.startsWith('data:image/avif') && resultImage.length < base64Image.length * 0.9) {
          format = 'avif'
          console.log('🚀 AVIF conversion successful:', {
            original: Math.round(base64Image.length / 1024) + 'KB',
            avif: Math.round(resultImage.length / 1024) + 'KB',
            compression: Math.round((1 - resultImage.length / base64Image.length) * 100) + '% smaller'
          })
          resolve({ image: resultImage, format })
          return
        }
      } catch (avifError) {
        // AVIF not supported, continue to WebP
      }
      
      // Try WebP as fallback
      try {
        resultImage = canvas.toDataURL('image/webp', quality)
        if (resultImage.startsWith('data:image/webp') && resultImage.length < base64Image.length * 0.9) {
          format = 'webp'
          console.log('🚀 WebP conversion successful:', {
            original: Math.round(base64Image.length / 1024) + 'KB',
            webp: Math.round(resultImage.length / 1024) + 'KB',
            compression: Math.round((1 - resultImage.length / base64Image.length) * 100) + '% smaller'
          })
          resolve({ image: resultImage, format })
          return
        }
      } catch (webpError) {
        // WebP not supported, continue to JPEG
      }
      
      // JPEG as final fallback
      resultImage = canvas.toDataURL('image/jpeg', 0.9)
      format = 'jpeg'
      
      console.log('📷 JPEG fallback:', {
        original: Math.round(base64Image.length / 1024) + 'KB',
        jpeg: Math.round(resultImage.length / 1024) + 'KB',
        compression: Math.round((1 - resultImage.length / base64Image.length) * 100) + '% smaller'
      })
      
      resolve({ image: resultImage, format })
    }
    
    img.onerror = () => {
      console.log('⚠️ Image load failed, returning original')
      resolve({ image: base64Image, format: 'png' })
    }
    
    img.src = base64Image
  })
}

/**
 * Complete image upload process: Direct Base64 → Vercel API → Boertlay → Database
 * @param {string} base64Image - Base64 image data
 * @param {string} username - Username (e.g., 'emilia.ivanova')
 * @param {string} generationType - 'single', '4x', or '10x'
 * @param {string} promptUsed - User's prompt
 * @param {number} imageIndex - Index for batch uploads (0 for single)
 * @param {string} resolution - '1K', '2K', or '4K' (optional)
 * @param {number} generationTimeSeconds - Generation time for batch (optional, only for first image)
 * @param {Object} usageMetadata - Token usage data from Gemini API (optional)
 * @param {string} aspectRatio - '9:16', '16:9', '4:3', '3:4', '2:3', '3:2' (optional)
 * @returns {Promise<Object>} Complete upload result
 */
export const uploadAndSaveImage = async (base64Image, username, generationType, promptUsed, imageIndex = 0, resolution = '4K', generationTimeSeconds = null, usageMetadata = null, aspectRatio = '9:16') => {
  try {
    console.log('🔥 UPLOADANDSAVEIMAGE CALLED WITH:', { username, generationType, imageIndex, generationTimeSeconds, hasUsageMetadata: !!usageMetadata })
    
    // 🚀 PRIORITY: Store token data FIRST before upload (in case upload fails)
    if (imageIndex === 0 && usageMetadata) {
      console.log('🔍 DEBUG usageMetadata structure:', usageMetadata)
      console.log('📊 Storing real token data in generations table:', {
        promptTokens: usageMetadata.promptTokenCount || 0,
        outputTokens: usageMetadata.candidatesTokenCount || 0,
        totalTokens: usageMetadata.totalTokenCount || 0
      })
      
      try {
        // Create admin client for user lookup (bypasses RLS)
        const adminSupabase = createClient(
          import.meta.env.VITE_SUPABASE_URL,
          import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
        )
        
        const { data: userData } = await adminSupabase
          .from('users')
          .select('id')
          .eq('username', username)
          .single()
          
        console.log('👤 User lookup result:', userData)
        
        if (userData) {
          const insertPayload = {
            id: crypto.randomUUID(), // Manual UUID generation
            user_id: userData.id,
            prompt: promptUsed,
            status: 'completed',
            resolution: resolution,
            aspect_ratio: aspectRatio, // Use actual aspect ratio parameter
            generation_time_seconds: Math.round(generationTimeSeconds || 0),
            gemini_metadata: {
              usageMetadata: usageMetadata,
              model: 'gemini-3-pro-image-preview',
              generation_type: generationType
            },
            completed_at: new Date().toISOString()
          }
          
          console.log('🔍 ABOUT TO INSERT:', insertPayload)
          console.log('🔍 ASPECT RATIO CHECK:', { aspectRatio, insertedAspectRatio: insertPayload.aspect_ratio })
          
          const { data: insertData, error: insertError } = await supabase
            .from('generations')
            .insert(insertPayload)
            .select() // ← WICHTIG: select() hinzugefügt um data zurück zu bekommen
          
          console.log('🔍 INSERT RESULT:', { 
            data: insertData, 
            error: insertError,
            count: insertData?.length || 0
          })
          
          if (insertError) {
            console.error('❌ Failed to insert generation record:', insertError)
            throw insertError
          }
          
          if (!insertData || insertData.length === 0) {
            console.error('❌ Insert "successful" but no data returned - RLS problem?')
            throw new Error('Insert failed - no data returned (possible RLS issue)')
          }
          
          console.log('✅ Generation data ACTUALLY stored!', insertData[0])
          
          // 🚀 CRITICAL FIX: Refresh materialized view to show new data in dashboard  
          // Also refreshes corrected pricing calculation
          try {
            const { error: refreshError } = await adminSupabase
              .rpc('refresh_daily_usage_stats')
            
            if (refreshError) {
              console.error('❌ Failed to refresh daily usage stats:', refreshError)
            } else {
              console.log('✅ Daily usage materialized view refreshed with corrected pricing!')
            }
          } catch (refreshError) {
            console.error('❌ Error refreshing materialized view:', refreshError)
          }
        }
      } catch (error) {
        console.error('❌ Failed to store generation data:', error)
      }
    }
    
    console.log('🚀 Starting direct upload process with AVIF conversion...')
    
    // Check original size
    const originalSizeKB = Math.round(base64Image.length / 1024)
    console.log('📏 Original PNG size:', originalSizeKB + 'KB')
    
    // Convert to optimal format (AVIF/WebP/JPEG)
    console.log('🔄 Converting to optimal format...')
    const conversionResult = await convertToOptimalFormat(base64Image, 0.8)
    
    // Determine file extension based on conversion result
    const fileExtension = conversionResult.format === 'avif' ? 'avif' : 
                         conversionResult.format === 'webp' ? 'webp' : 'jpg'
    const timestamp = Date.now()
    const filename = `nano-banana-${generationType}-${imageIndex + 1}-${timestamp}.${fileExtension}`
    
    console.log('📁 Final filename:', filename)
    
    // Direct AVIF/WebP/JPEG → FTP Upload
    const apiResponse = await fetch('/api/direct-ftp-upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        base64Image: conversionResult.image,
        username: username,
        filename: filename
      })
    })
    
    if (!apiResponse.ok) {
      const errorText = await apiResponse.text()
      throw new Error(`Direct FTP upload failed: ${apiResponse.statusText} - ${errorText}`)
    }
    
    const apiResult = await apiResponse.json()
    if (!apiResult.success) {
      throw new Error(`FTP upload failed: ${apiResult.error}`)
    }
    
    // Calculate file size from compressed image
    const fileSizeBytes = Math.round((conversionResult.image.length - conversionResult.image.indexOf(',') - 1) * 0.75)
    
    // Save metadata to database
    const dbResult = await saveImageToDatabase(
      apiResult.boertlayUrl, 
      username, 
      generationType, 
      promptUsed, 
      filename,
      fileSizeBytes
    )
    
    
    console.log('✅ Upload complete - statistics handled by materialized view')
    
    console.log('✅ Direct upload process successful!', {
      filename,
      boertlayUrl: apiResult.boertlayUrl,
      databaseId: dbResult.id
    })
    
    return {
      success: true,
      imageUrl: apiResult.boertlayUrl,
      databaseId: dbResult.id,
      filename
    }
    
  } catch (error) {
    console.error('❌ Direct upload process failed:', error)
    return {
      success: false,
      error: error.message
    }
  }
};