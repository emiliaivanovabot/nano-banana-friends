#!/usr/bin/env node

/**
 * FIX DOLLAR PLACEHOLDERS
 * 
 * Fixes the $1 placeholders that were incorrectly created during attribute removal
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

async function fixDollarPlaceholders() {
  console.log('🔧 Fixing $1 placeholders from attribute removal...')
  
  // Get all NO_CHANGE prompts
  const { data: prompts, error } = await supabase
    .from('community_prompts')
    .select('*')
    .or('title.eq.NO_CHANGE,prompt.eq.NO_CHANGE,title.ilike.%NO_CHANGE%,prompt.ilike.%NO_CHANGE%')
  
  if (error) {
    console.error('❌ Error:', error.message)
    return
  }
  
  console.log(`🔍 Found ${prompts.length} prompts to check for $1 placeholders`)
  
  let fixedCount = 0
  
  for (const prompt of prompts) {
    if (prompt.prompt.includes('$1')) {
      console.log(`\n🔧 Fixing ID ${prompt.id}: "${prompt.title}"`)
      
      // Replace $1 with appropriate gender-neutral terms
      let fixedPrompt = prompt.prompt
        .replace(/A \$1 with/gi, 'A person with')
        .replace(/a \$1 with/gi, 'a person with')
        .replace(/\$1,/gi, 'person,')
        .replace(/\$1 /gi, 'person ')
        .replace(/of a \$1/gi, 'of a person')
        .replace(/\$1$/gi, 'person')
      
      console.log(`   Before: ${prompt.prompt.substring(0, 100)}...`)
      console.log(`   After:  ${fixedPrompt.substring(0, 100)}...`)
      
      const { error: updateError } = await supabase
        .from('community_prompts')
        .update({
          prompt: fixedPrompt
        })
        .eq('id', prompt.id)
      
      if (updateError) {
        console.error(`❌ Failed to fix ID ${prompt.id}:`, updateError.message)
      } else {
        fixedCount++
        console.log(`✅ Fixed successfully`)
      }
    }
  }
  
  console.log(`\n🎉 Fixed ${fixedCount} prompts with $1 placeholders`)
}

fixDollarPlaceholders()
  .then(() => console.log('✅ Fix complete'))
  .catch(error => console.error('❌ Fix failed:', error))