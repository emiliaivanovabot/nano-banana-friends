#!/usr/bin/env node

/**
 * CLEANUP REMAINING: Process only prompts > ID 1000 (the remaining 706 prompts)
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

// Attribute patterns to remove
const ATTRIBUTE_PATTERNS = [
  // Hair color/style
  { pattern: /\b(blonde?|brunette|black hair|brown hair|red hair|redhead|ginger|auburn|platinum|dark hair|light hair|hair color|natural hair color)\b/gi, type: 'hair' },
  
  // Eye color
  { pattern: /\b(blue eyes|green eyes|brown eyes|hazel eyes|gray eyes|grey eyes|eye color)\b/gi, type: 'eyes' },
  
  // Skin tone
  { pattern: /\b(fair skin|pale skin|light skin|dark skin|skin tone|complexion)\b/gi, type: 'skin' },
  
  // Age qualifiers
  { pattern: /\byoung (man|woman|person)\b/gi, type: 'age', replacement: '$1' },
  { pattern: /\bold (man|woman|person)\b/gi, type: 'age', replacement: '$1' },
  { pattern: /\bmiddle-aged (man|woman|person)\b/gi, type: 'age', replacement: '$1' },
  
  // Body descriptions
  { pattern: /\b(fit at \d+\s*kg|weighs \d+\s*kg|\d+\s*kg|muscular physique|XXL body size)\b/gi, type: 'body' },
  
  // Tattoos
  { pattern: /\b(tattoo|tattooed|inked)\b/gi, type: 'tattoo' },
  
  // Grammar cleanup
  { pattern: /\s+/g, type: 'grammar', replacement: ' ' },
  { pattern: /\s,/g, type: 'grammar', replacement: ',' }
]

async function cleanupRemainingPrompts() {
  console.log('🧹 Cleaning up REMAINING prompts (IDs > 1000)...')
  
  // Get count of remaining prompts
  const { count } = await supabase
    .from('community_prompts')
    .select('*', { count: 'exact', head: true })
    .gt('id', 1000)
  
  console.log(`📊 Remaining prompts to process: ${count}`)
  
  // Get all remaining prompts
  const { data: prompts, error } = await supabase
    .from('community_prompts')
    .select('id, title, prompt')
    .gt('id', 1000)
    .order('id')
  
  if (error) {
    console.error('❌ Error fetching prompts:', error.message)
    return
  }
  
  let modified = 0
  
  for (const prompt of prompts) {
    let originalPrompt = prompt.prompt
    let modifiedPrompt = originalPrompt
    let changes = []
    
    // Apply cleanup patterns
    for (const { pattern, type, replacement } of ATTRIBUTE_PATTERNS) {
      const before = modifiedPrompt
      
      if (replacement) {
        modifiedPrompt = modifiedPrompt.replace(pattern, replacement)
      } else {
        modifiedPrompt = modifiedPrompt.replace(pattern, '')
      }
      
      if (before !== modifiedPrompt) {
        changes.push(type)
      }
    }
    
    // Clean up and trim
    modifiedPrompt = modifiedPrompt.replace(/\s+/g, ' ').trim()
    
    // Update if changed
    if (modifiedPrompt !== originalPrompt) {
      const { error: updateError } = await supabase
        .from('community_prompts')
        .update({ prompt: modifiedPrompt })
        .eq('id', prompt.id)
      
      if (updateError) {
        console.error(`❌ Failed to update ${prompt.id}:`, updateError.message)
      } else {
        modified++
        if (modified <= 10) {
          console.log(`🧽 Cleaned ID ${prompt.id}: Removed ${changes.join(', ')}`)
        }
      }
    }
  }
  
  console.log(`\n✅ REMAINING PROMPTS CLEANED!`)
  console.log(`📊 Processed: ${prompts.length}`)
  console.log(`🧽 Modified: ${modified}`)
}

cleanupRemainingPrompts()
  .then(() => console.log('✅ Cleanup of remaining prompts complete'))
  .catch(error => console.error('❌ Cleanup failed:', error))