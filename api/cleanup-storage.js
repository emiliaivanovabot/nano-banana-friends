/**
 * Cleanup API: Remove Supabase Storage bucket that's no longer needed
 */

import { createClient } from '@supabase/supabase-js'

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

    console.log('🧹 Starting Supabase Storage cleanup...')

    // Initialize Supabase client with service role key
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !serviceKey) {
      throw new Error(`Missing Supabase credentials`)
    }
    
    const supabase = createClient(supabaseUrl, serviceKey)

    // First, list all files in temp-uploads bucket
    const { data: bucketFiles, error: listError } = await supabase.storage
      .from('temp-uploads')
      .list('', { limit: 1000 })
    
    if (listError) {
      console.log('❌ Cannot list bucket contents:', listError.message)
      return res.status(200).json({
        success: true,
        message: 'Bucket already cleaned or does not exist',
        error: listError.message
      })
    }

    console.log('🗂️ Found files in temp-uploads:', bucketFiles?.length || 0)

    // Delete all files in the bucket first
    if (bucketFiles && bucketFiles.length > 0) {
      const filePaths = bucketFiles.map(file => file.name)
      console.log('🗑️ Deleting files:', filePaths)
      
      const { data: deleteData, error: deleteError } = await supabase.storage
        .from('temp-uploads')
        .remove(filePaths)
      
      if (deleteError) {
        console.warn('⚠️ Some files could not be deleted:', deleteError.message)
      } else {
        console.log('✅ All files deleted from bucket')
      }
    }

    // Now try to delete the bucket itself
    console.log('🗑️ Attempting to delete temp-uploads bucket...')
    const { data: bucketDelete, error: bucketError } = await supabase.storage
      .deleteBucket('temp-uploads')

    if (bucketError) {
      console.warn('⚠️ Could not delete bucket:', bucketError.message)
      return res.status(200).json({
        success: true,
        message: 'Files cleaned, but bucket deletion requires admin access',
        filesDeleted: bucketFiles?.length || 0,
        bucketError: bucketError.message
      })
    }

    console.log('✅ Bucket deleted successfully!')

    return res.status(200).json({
      success: true,
      message: 'Supabase Storage completely cleaned up',
      filesDeleted: bucketFiles?.length || 0,
      bucketDeleted: true
    })

  } catch (error) {
    console.error('❌ Cleanup failed:', error)
    
    return res.status(500).json({
      success: false,
      error: error.message,
      details: 'Supabase Storage cleanup failed'
    })
  }
}