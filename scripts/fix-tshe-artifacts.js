#!/usr/bin/env node

/**
 * Emergency Fix for "tshe" and "tsshe" artifacts
 * Caused by broken word replacement script
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

async function fixTsheArtifacts() {
  console.log('🚨 EMERGENCY: Fixing tshe/tsshe artifacts...')
  
  const { count } = await supabase
    .from('community_prompts')
    .select('id', { count: 'exact' })
  
  console.log(`📊 Total prompts: ${count}`)
  
  let processed = 0
  let fixed = 0
  const pageSize = 100
  
  for (let offset = 0; offset < count; offset += pageSize) {
    console.log(`\n📋 Processing batch ${Math.floor(offset/pageSize) + 1}/${Math.ceil(count/pageSize)}...`)
    
    const { data: batch, error } = await supabase
      .from('community_prompts')
      .select('id, prompt, title')
      .range(offset, offset + pageSize - 1)
    
    if (error) {
      console.error('❌ Error fetching batch:', error.message)
      continue
    }
    
    let batchFixed = 0
    
    for (const item of batch) {
      let promptFixed = item.prompt
      let titleFixed = item.title
      let hasChanges = false
      
      // Fix tshe -> the
      if (promptFixed.includes('tshe')) {
        promptFixed = promptFixed.replace(/tshe/g, 'the')
        hasChanges = true
      }
      
      if (titleFixed.includes('tshe')) {
        titleFixed = titleFixed.replace(/tshe/g, 'the')
        hasChanges = true
      }
      
      // Fix tsshe -> the (double replacement artifact)
      if (promptFixed.includes('tsshe')) {
        promptFixed = promptFixed.replace(/tsshe/g, 'the')
        hasChanges = true
      }
      
      if (titleFixed.includes('tsshe')) {
        titleFixed = titleFixed.replace(/tsshe/g, 'the')
        hasChanges = true
      }
      
      // Fix Tshe -> The (capitalized)
      if (promptFixed.includes('Tshe')) {
        promptFixed = promptFixed.replace(/Tshe/g, 'The')
        hasChanges = true
      }
      
      if (titleFixed.includes('Tshe')) {
        titleFixed = titleFixed.replace(/Tshe/g, 'The')
        hasChanges = true
      }
      
      // Fix Tsshe -> The (capitalized double)
      if (promptFixed.includes('Tsshe')) {
        promptFixed = promptFixed.replace(/Tsshe/g, 'The')
        hasChanges = true
      }
      
      if (titleFixed.includes('Tsshe')) {
        titleFixed = titleFixed.replace(/Tsshe/g, 'The')
        hasChanges = true
      }
      
      if (hasChanges) {
        const { error: updateError } = await supabase
          .from('community_prompts')
          .update({
            prompt: promptFixed,
            title: titleFixed
          })
          .eq('id', item.id)
        
        if (updateError) {
          console.error(`❌ Update failed for ${item.id}:`, updateError.message)
        } else {
          fixed++
          batchFixed++
          
          if (fixed <= 5) {
            console.log(`📝 Fix Example ${fixed}:`)
            console.log(`   BEFORE: ${item.title} | ${item.prompt.substring(0, 80)}...`)
            console.log(`   AFTER:  ${titleFixed} | ${promptFixed.substring(0, 80)}...`)
          }
        }
      }
      
      processed++
    }
    
    console.log(`   ✅ ${batchFixed} fixed in this batch`)
    console.log(`   📊 Overall: ${processed}/${count} processed, ${fixed} fixed`)
  }
  
  console.log(`\n🎉 Artifact fix complete!`)
  console.log(`📊 Prompts processed: ${processed}`)
  console.log(`🔧 Prompts fixed: ${fixed}`)
  
  // Final verification
  const { count: remainingTshe } = await supabase
    .from('community_prompts')
    .select('id', { count: 'exact' })
    .or('prompt.ilike.%tshe%,title.ilike.%tshe%,prompt.ilike.%tsshe%,title.ilike.%tsshe%')
  
  console.log(`🔍 Remaining artifacts: ${remainingTshe || 0} prompts`)
}

fixTsheArtifacts()
  .then(() => console.log('✅ Emergency fix complete!'))
  .catch(error => console.error('❌ Fix failed:', error))