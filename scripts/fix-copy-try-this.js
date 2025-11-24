#!/usr/bin/env node

/**
 * Remove "Copy Try this..." artifacts from community prompts
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing environment variables!')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function fixCopyTryThis() {
  console.log('🧹 Comprehensive cleanup of community prompts...')
  
  // Get total count first
  const { count } = await supabase
    .from('community_prompts')
    .select('id', { count: 'exact' })
  
  console.log(`📊 Total prompts in database: ${count}`)
  
  let allProcessed = 0
  let totalCleaned = 0
  const pageSize = 500
  
  // Process in chunks to avoid memory issues
  for (let offset = 0; offset < count; offset += pageSize) {
    console.log(`\n📋 Processing batch ${Math.floor(offset/pageSize) + 1}/${Math.ceil(count/pageSize)} (${offset + 1}-${Math.min(offset + pageSize, count)})...`)
    
    const { data: batchPrompts, error: fetchError } = await supabase
      .from('community_prompts')
      .select('id, prompt')
      .range(offset, offset + pageSize - 1)
    
    if (fetchError) {
      console.error('❌ Error fetching batch:', fetchError.message)
      continue
    }
  
    let batchCleaned = 0
    
    for (const promptData of batchPrompts) {
      let originalPrompt = promptData.prompt
      let cleanedPrompt = originalPrompt
      
      // Remove "Copy Try this" variations (case insensitive)
      cleanedPrompt = cleanedPrompt.replace(/copy try this[\.\s]*/gi, '')
      
      // Remove face reference instructions that conflict with our system
      cleanedPrompt = cleanedPrompt.replace(/Please use the user's reference image[^.]*\./gi, '')
      cleanedPrompt = cleanedPrompt.replace(/Use the uploaded photo as face reference[^.]*\./gi, '')
      cleanedPrompt = cleanedPrompt.replace(/Use minha foto como base[^.]*\./gi, '')
      
      // Remove technical parameters that don't work in our system
      cleanedPrompt = cleanedPrompt.replace(/--ar \d+:\d+/g, '')
      cleanedPrompt = cleanedPrompt.replace(/--s \d+/g, '')
      cleanedPrompt = cleanedPrompt.replace(/--raw/g, '')
      cleanedPrompt = cleanedPrompt.replace(/--style/g, '')
      
      // Clean up extra spaces and line breaks
      cleanedPrompt = cleanedPrompt.replace(/\s+/g, ' ').trim()
      
      // Remove empty parentheses or brackets left over
      cleanedPrompt = cleanedPrompt.replace(/\(\s*\)/g, '')
      cleanedPrompt = cleanedPrompt.replace(/\[\s*\]/g, '')
      
      if (cleanedPrompt !== originalPrompt) {
        // Update the prompt in database
        const { error: updateError } = await supabase
          .from('community_prompts')
          .update({ prompt: cleanedPrompt })
          .eq('id', promptData.id)
        
        if (updateError) {
          console.error(`❌ Failed to update prompt ${promptData.id}:`, updateError.message)
        } else {
          batchCleaned++
          totalCleaned++
          
          // Show examples from first batch only
          if (totalCleaned <= 3) {
            console.log(`📝 Example ${totalCleaned}:`)
            console.log(`   BEFORE: ${originalPrompt.substring(0, 150)}...`)
            console.log(`   AFTER:  ${cleanedPrompt.substring(0, 150)}...`)
          }
        }
      }
    }
    
    allProcessed += batchPrompts.length
    console.log(`   ✅ Batch complete: ${batchCleaned} cleaned out of ${batchPrompts.length} prompts`)
    console.log(`   📊 Overall progress: ${allProcessed}/${count} processed, ${totalCleaned} total cleaned`)
  }
  
  console.log(`\n🎉 Full cleanup complete!`)
  console.log(`📊 Total prompts processed: ${allProcessed}`)
  console.log(`✅ Prompts successfully cleaned: ${totalCleaned}`)
  
  // Final verification
  const { count: remainingCount } = await supabase
    .from('community_prompts')
    .select('id', { count: 'exact' })
    .ilike('prompt', '%copy try this%')
  
  console.log(`🔍 Final verification: ${remainingCount || 0} prompts still contain "copy try this"`)
}

fixCopyTryThis()
  .then(() => console.log('✅ Copy Try this cleanup complete!'))
  .catch(error => console.error('❌ Fix failed:', error))