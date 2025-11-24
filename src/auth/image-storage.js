// Supabase Storage integration for profile image uploads
// Created by integration-master specialist

import { supabase } from '../../lib/supabase/client.js'

/**
 * Upload profile image to Supabase Storage
 * @param {File} file - Image file to upload
 * @param {string} userId - User ID for organizing files
 * @param {string} imageType - Type of image ('main', 'face2', 'face3')
 * @returns {Promise<{success: boolean, url: string|null, error: string|null}>}
 */
export async function uploadProfileImage(file, userId, imageType = 'main') {
  try {
    // Validate file
    if (!file) {
      return { success: false, url: null, error: 'No file provided' }
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return { 
        success: false, 
        url: null, 
        error: 'Invalid file type. Please use JPG, PNG, GIF, or WebP images.' 
      }
    }

    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return { 
        success: false, 
        url: null, 
        error: 'File too large. Please use images under 5MB.' 
      }
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${imageType}_${Date.now()}.${fileExt}`

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('profile-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Supabase storage error:', error)
      return { 
        success: false, 
        url: null, 
        error: 'Failed to upload image. Please try again.' 
      }
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('profile-images')
      .getPublicUrl(data.path)

    return {
      success: true,
      url: publicUrl,
      error: null
    }

  } catch (error) {
    console.error('Unexpected error uploading image:', error)
    return { 
      success: false, 
      url: null, 
      error: 'Unexpected error occurred during upload' 
    }
  }
}

/**
 * Delete profile image from Supabase Storage
 * @param {string} imageUrl - Full URL of the image to delete
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export async function deleteProfileImage(imageUrl) {
  try {
    if (!imageUrl) {
      return { success: true, error: null } // Nothing to delete
    }

    // Extract file path from URL
    const url = new URL(imageUrl)
    const pathParts = url.pathname.split('/')
    const bucketIndex = pathParts.findIndex(part => part === 'profile-images')
    
    if (bucketIndex === -1 || bucketIndex === pathParts.length - 1) {
      return { success: false, error: 'Invalid image URL format' }
    }

    const filePath = pathParts.slice(bucketIndex + 1).join('/')

    // Delete from Supabase Storage
    const { error } = await supabase.storage
      .from('profile-images')
      .remove([filePath])

    if (error) {
      console.error('Error deleting image:', error)
      return { success: false, error: 'Failed to delete image' }
    }

    return { success: true, error: null }

  } catch (error) {
    console.error('Unexpected error deleting image:', error)
    return { success: false, error: 'Unexpected error occurred during deletion' }
  }
}

/**
 * Create the profile-images bucket if it doesn't exist
 * This should be run once during setup
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export async function createProfileImagesBucket() {
  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('Error listing buckets:', listError)
      return { success: false, error: 'Failed to check existing buckets' }
    }

    const bucketExists = buckets.some(bucket => bucket.name === 'profile-images')
    
    if (bucketExists) {
      return { success: true, error: null }
    }

    // Create bucket
    const { error: createError } = await supabase.storage.createBucket('profile-images', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      fileSizeLimit: 5242880 // 5MB
    })

    if (createError) {
      console.error('Error creating bucket:', createError)
      return { success: false, error: 'Failed to create profile images bucket' }
    }

    return { success: true, error: null }

  } catch (error) {
    console.error('Unexpected error creating bucket:', error)
    return { success: false, error: 'Unexpected error occurred during bucket creation' }
  }
}

/**
 * Validate image URL format
 * @param {string} url - URL to validate
 * @returns {boolean}
 */
export function isValidImageUrl(url) {
  try {
    new URL(url)
    return url.match(/\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i) !== null
  } catch {
    return false
  }
}

/**
 * Get optimized image URL with transformations
 * @param {string} baseUrl - Base image URL
 * @param {object} options - Transformation options
 * @returns {string} - Optimized URL
 */
export function getOptimizedImageUrl(baseUrl, options = {}) {
  try {
    const {
      width = null,
      height = null,
      quality = 80,
      format = null
    } = options

    const url = new URL(baseUrl)
    
    if (width) url.searchParams.set('w', width.toString())
    if (height) url.searchParams.set('h', height.toString())
    if (quality !== 80) url.searchParams.set('q', quality.toString())
    if (format) url.searchParams.set('f', format)

    return url.toString()

  } catch (error) {
    console.error('Error optimizing image URL:', error)
    return baseUrl
  }
}