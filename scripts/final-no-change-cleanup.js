#!/usr/bin/env node

/**
 * FINAL CLEANUP: Remove "NO_CHANGE" text from within prompt content
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

async function finalNoChangeCleanup() {
  console.log('🎯 Final cleanup: Removing "NO_CHANGE" text from prompt content...')
  
  const { data: prompts, error } = await supabase
    .from('community_prompts')
    .select('*')
    .or('title.ilike.%NO_CHANGE%,prompt.ilike.%NO_CHANGE%')
  
  if (error) {
    console.error('❌ Error:', error.message)
    return
  }
  
  console.log(`🔍 Found ${prompts.length} prompts containing "NO_CHANGE"`)
  
  let cleaned = 0
  
  for (const prompt of prompts) {
    let titleCleaned = prompt.title
    let promptCleaned = prompt.prompt
    let hasChanges = false
    
    // Remove "NO_CHANGE" from title
    if (titleCleaned && titleCleaned.includes('NO_CHANGE')) {
      titleCleaned = titleCleaned.replace(/NO_CHANGE/gi, '').replace(/\s+/g, ' ').trim()
      hasChanges = true
    }
    
    // Remove "NO_CHANGE" from prompt content
    if (promptCleaned && promptCleaned.includes('NO_CHANGE')) {
      promptCleaned = promptCleaned
        .replace(/NO_CHANGE/gi, '')
        .replace(/\s+/g, ' ')
        .replace(/[,\s]*\s*[,]/g, ',')
        .replace(/\.\s*\./g, '.')
        .replace(/,\s*\./g, '.')
        .trim()
      
      // Ensure proper sentence ending
      if (promptCleaned && !promptCleaned.match(/[.!?]$/)) {
        promptCleaned += '.'
      }
      
      hasChanges = true
    }
    
    if (hasChanges) {
      const { error: updateError } = await supabase
        .from('community_prompts')
        .update({
          title: titleCleaned,
          prompt: promptCleaned
        })
        .eq('id', prompt.id)
      
      if (!updateError) {
        cleaned++
        console.log(`✅ Cleaned ID ${prompt.id}: Removed NO_CHANGE text`)
      } else {
        console.error(`❌ Failed to clean ${prompt.id}:`, updateError.message)
      }
    }
  }
  
  console.log(`\n🎉 Final cleanup complete!`)
  console.log(`🧽 Cleaned prompts: ${cleaned}`)
  
  // Final verification
  const { data: remaining } = await supabase
    .from('community_prompts')
    .select('id')
    .or('title.ilike.%NO_CHANGE%,prompt.ilike.%NO_CHANGE%')
  
  console.log(`✅ Remaining NO_CHANGE references: ${remaining?.length || 0}`)
  
  if (remaining?.length === 0) {
    console.log(`🎉 ALL NO_CHANGE references successfully removed!`)
  }
}

finalNoChangeCleanup()
  .then(() => console.log('✅ Final cleanup complete'))
  .catch(error => console.error('❌ Final cleanup failed:', error))