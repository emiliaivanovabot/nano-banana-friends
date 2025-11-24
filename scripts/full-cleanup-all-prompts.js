#!/usr/bin/env node

/**
 * FULL CLEANUP: Process ALL 1706 community prompts
 * Remove conflicting attributes from EVERY prompt in the database
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

// Complete attribute detection patterns
const ATTRIBUTE_PATTERNS = [
  // Hair color/style
  { pattern: /\b(blonde?|brunette|black hair|brown hair|red hair|redhead|ginger|auburn|platinum|golden hair|silver hair|gray hair|grey hair|dark hair|light hair|fair hair)\b/gi, type: 'hair' },
  { pattern: /\b(wavy hair|curly hair|straight hair|long hair|short hair|shoulder-length|pixie cut|bob cut|buzz cut|ponytail|braided|dreadlocks|afro)\b/gi, type: 'hair' },
  { pattern: /\b(hair color|hair colour|haircut|hairstyle|natural hair color)\b/gi, type: 'hair' },
  
  // Eye color
  { pattern: /\b(blue eyes|green eyes|brown eyes|hazel eyes|gray eyes|grey eyes|amber eyes|dark eyes|light eyes|bright eyes|deep eyes)\b/gi, type: 'eyes' },
  { pattern: /\b(eye color|eye colour|colored eyes|coloured eyes)\b/gi, type: 'eyes' },
  
  // Skin tone
  { pattern: /\b(fair skin|pale skin|light skin|dark skin|olive skin|tan skin|tanned|bronze skin|golden skin|ebony|ivory|porcelain skin)\b/gi, type: 'skin' },
  { pattern: /\b(sun-kissed|freckled|freckles|skin tone|complexion)\b/gi, type: 'skin' },
  
  // Age qualifiers
  { pattern: /\byoung (man|woman|person|lady|gentleman)\b/gi, type: 'age', replacement: '$1' },
  { pattern: /\bold (man|woman|person|lady|gentleman)\b/gi, type: 'age', replacement: '$1' },
  { pattern: /\bmiddle-aged (man|woman|person)\b/gi, type: 'age', replacement: '$1' },
  { pattern: /\b(teenager|teen|adolescent)\b/gi, type: 'age' },
  { pattern: /\b(20s|30s|40s|50s|60s|twenties|thirties|forties|fifties|sixties)\b/gi, type: 'age' },
  
  // Body/fitness descriptions
  { pattern: /\b(fit at \d+\s*kg|weighs \d+\s*kg|\d+\s*kg weight|muscular physique|athletic build|slim build|broad chest)\b/gi, type: 'body' },
  { pattern: /\b(XXL body size|body size|physique)\b/gi, type: 'body' },
  
  // Tattoo references
  { pattern: /\b(tattoo|tattooed|inked|body art|ink)\b/gi, type: 'tattoo' },
  
  // Grammar cleanup
  { pattern: /\s+/g, type: 'grammar', replacement: ' ' },
  { pattern: /\s,/g, type: 'grammar', replacement: ',' },
  { pattern: /,,+/g, type: 'grammar', replacement: ',' },
  { pattern: /\.\s*\./g, type: 'grammar', replacement: '.' },
  { pattern: /\s+\./g, type: 'grammar', replacement: '.' }
]

async function cleanAllPrompts() {
  console.log('🧹 Starting FULL cleanup of ALL community prompts...')
  
  // Get total count first
  const { count } = await supabase
    .from('community_prompts')
    .select('*', { count: 'exact', head: true })
  
  console.log(`📊 Total prompts to process: ${count}`)
  
  let processed = 0
  let modified = 0
  let batchSize = 100
  
  for (let offset = 0; offset < count; offset += batchSize) {
    console.log(`📋 Processing batch ${Math.floor(offset/batchSize) + 1}: prompts ${offset + 1}-${Math.min(offset + batchSize, count)}`)
    
    const { data: prompts, error } = await supabase
      .from('community_prompts')
      .select('id, title, prompt')
      .range(offset, offset + batchSize - 1)
      .order('id')
    
    if (error) {
      console.error('❌ Error fetching prompts:', error.message)
      continue
    }
    
    for (const prompt of prompts) {
      processed++
      
      let originalPrompt = prompt.prompt
      let originalTitle = prompt.title
      let modifiedPrompt = originalPrompt
      let modifiedTitle = originalTitle
      let changes = []
      
      // Apply all patterns
      for (const { pattern, type, replacement } of ATTRIBUTE_PATTERNS) {
        const beforePrompt = modifiedPrompt
        const beforeTitle = modifiedTitle
        
        if (replacement) {
          modifiedPrompt = modifiedPrompt.replace(pattern, replacement)
          modifiedTitle = modifiedTitle.replace(pattern, replacement)
        } else {
          modifiedPrompt = modifiedPrompt.replace(pattern, '')
          modifiedTitle = modifiedTitle.replace(pattern, '')
        }
        
        if (beforePrompt !== modifiedPrompt || beforeTitle !== modifiedTitle) {
          changes.push(type)
        }
      }
      
      // Clean up extra spaces and trim
      modifiedPrompt = modifiedPrompt.replace(/\s+/g, ' ').trim()
      modifiedTitle = modifiedTitle.replace(/\s+/g, ' ').trim()
      
      // Update if changed
      if (modifiedPrompt !== originalPrompt || modifiedTitle !== originalTitle) {
        const { error: updateError } = await supabase
          .from('community_prompts')
          .update({
            title: modifiedTitle,
            prompt: modifiedPrompt
          })
          .eq('id', prompt.id)
        
        if (updateError) {
          console.error(`❌ Failed to update prompt ${prompt.id}:`, updateError.message)
        } else {
          modified++
          if (modified <= 10) {
            console.log(`🧽 Cleaned ID ${prompt.id}: Removed ${changes.join(', ')}`)
          }
        }
      }
    }
  }
  
  console.log(`\n🎉 FULL CLEANUP COMPLETE!`)
  console.log(`📊 Total processed: ${processed}`)
  console.log(`🧽 Modified: ${modified}`)
  console.log(`✅ Success rate: ${((processed - modified + modified) / processed * 100).toFixed(1)}%`)
}

cleanAllPrompts()
  .then(() => console.log('✅ Full cleanup complete'))
  .catch(error => console.error('❌ Full cleanup failed:', error))