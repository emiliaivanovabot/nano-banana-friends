#!/usr/bin/env node
/**
 * EMERGENCY FIX: Repair malformed URI prompts again
 */
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

console.log('🚨 EMERGENCY: Re-fixing malformed prompts...')

const { data: prompts, error } = await supabase
  .from('community_prompts')
  .select('*')

if (error) {
  console.error('❌ Error fetching prompts:', error)
  process.exit(1)
}

let fixedCount = 0

for (const prompt of prompts) {
  const originalText = prompt.prompt || ''
  
  // Test if this prompt would crash
  let needsFix = false
  try {
    decodeURIComponent(originalText)
  } catch (error) {
    needsFix = true
  }
  
  if (needsFix) {
    // Fix the text: replace % followed by space with "percent"
    const fixedText = originalText.replace(/%(\s)/g, 'percent$1')
    
    // Update in database
    const { error: updateError } = await supabase
      .from('community_prompts')
      .update({ prompt: fixedText })
      .eq('id', prompt.id)
    
    if (!updateError) {
      console.log(`✅ Fixed prompt ${prompt.id}`)
      fixedCount++
    }
  }
}

console.log(`🎉 Emergency fix complete: ${fixedCount} prompts repaired`)