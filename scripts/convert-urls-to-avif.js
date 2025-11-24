#!/usr/bin/env node

/**
 * CONVERT IMAGE URLS: Update all community prompt images to AVIF format
 * 
 * FROM: https://boertlay.de/bilder/images/filename.jpeg|png
 * TO:   https://boertlay.de/bilder/images_avif/filename.avif
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
dotenv.config()

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing environment variables!')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function convertUrlsToAvif() {
  console.log('🔄 Converting all community prompt image URLs to AVIF format...')
  
  // Get total count
  const { count } = await supabase
    .from('community_prompts')
    .select('*', { count: 'exact', head: true })
    .not('image_url', 'is', null)
  
  console.log(`📊 Total prompts with images: ${count}`)
  
  let processed = 0
  let updated = 0
  let batchSize = 100
  
  for (let offset = 0; offset < count; offset += batchSize) {
    console.log(`📋 Processing batch ${Math.floor(offset/batchSize) + 1}: prompts ${offset + 1}-${Math.min(offset + batchSize, count)}`)
    
    const { data: prompts, error } = await supabase
      .from('community_prompts')
      .select('id, title, image_url')
      .not('image_url', 'is', null)
      .range(offset, offset + batchSize - 1)
      .order('id')
    
    if (error) {
      console.error('❌ Error fetching prompts:', error.message)
      continue
    }
    
    for (const prompt of prompts) {
      processed++
      
      const originalUrl = prompt.image_url
      
      // Check if URL matches the pattern we want to convert
      if (originalUrl && originalUrl.includes('boertlay.de/bilder/images/')) {
        
        // Extract filename and remove extension
        const urlParts = originalUrl.split('/')
        const filename = urlParts[urlParts.length - 1]
        const nameWithoutExt = filename.replace(/\.(jpeg|jpg|png|webp)$/i, '')
        
        // Create new AVIF URL
        const newUrl = `https://boertlay.de/bilder/images_avif/${nameWithoutExt}.avif`
        
        // Update in database
        const { error: updateError } = await supabase
          .from('community_prompts')
          .update({ image_url: newUrl })
          .eq('id', prompt.id)
        
        if (updateError) {
          console.error(`❌ Failed to update prompt ${prompt.id}:`, updateError.message)
        } else {
          updated++
          
          if (updated <= 10) {
            console.log(`✅ Updated ID ${prompt.id}:`)
            console.log(`   FROM: ${originalUrl}`)
            console.log(`   TO:   ${newUrl}`)
            console.log()
          }
        }
      } else {
        // Skip URLs that don't match our pattern
        if (processed <= 5 && !originalUrl.includes('boertlay.de/bilder/images/')) {
          console.log(`⏭️  Skipped ID ${prompt.id}: Different URL pattern`)
          console.log(`   URL: ${originalUrl}`)
          console.log()
        }
      }
    }
  }
  
  console.log(`\n🎉 URL CONVERSION COMPLETE!`)
  console.log(`📊 Total processed: ${processed}`)
  console.log(`✅ URLs updated: ${updated}`)
  console.log(`⏭️  Skipped: ${processed - updated}`)
  
  // Show some examples of the new URLs
  const { data: samples } = await supabase
    .from('community_prompts')
    .select('id, image_url')
    .ilike('image_url', '%images_avif%')
    .limit(3)
  
  if (samples && samples.length > 0) {
    console.log(`\n🖼️  SAMPLE NEW AVIF URLS:`)
    samples.forEach(prompt => {
      console.log(`   ID ${prompt.id}: ${prompt.image_url}`)
    })
  }
}

convertUrlsToAvif()
  .then(() => console.log('✅ AVIF conversion complete'))
  .catch(error => console.error('❌ AVIF conversion failed:', error))