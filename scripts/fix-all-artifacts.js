#!/usr/bin/env node

/**
 * Comprehensive Fix for ALL word replacement artifacts
 * Fix ther, sher, wher and other broken patterns
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

async function fixAllArtifacts() {
  console.log('🔧 Comprehensive fix for ALL word replacement artifacts...')
  
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
      
      // Fix ther -> the (common artifact from "he" + "r" -> "ther")
      if (promptFixed.includes('ther ') && !promptFixed.includes('other ') && !promptFixed.includes('another ') && !promptFixed.includes('father ') && !promptFixed.includes('mother ')) {
        promptFixed = promptFixed.replace(/ther /g, 'the ')
        hasChanges = true
      }
      
      if (titleFixed.includes('ther ') && !titleFixed.includes('other ') && !titleFixed.includes('another ') && !titleFixed.includes('father ') && !titleFixed.includes('mother ')) {
        titleFixed = titleFixed.replace(/ther /g, 'the ')
        hasChanges = true
      }
      
      // Fix wher -> where (from "he" + "re" -> "where")
      if (promptFixed.includes('wher') && !promptFixed.includes('where') && !promptFixed.includes('everywhere') && !promptFixed.includes('somewhere') && !promptFixed.includes('anywhere')) {
        // This is tricky - need context. If it's isolated "wher", fix it
        promptFixed = promptFixed.replace(/\bwher\b/g, 'where')
        hasChanges = true
      }
      
      if (titleFixed.includes('wher') && !titleFixed.includes('where')) {
        titleFixed = titleFixed.replace(/\bwher\b/g, 'where')
        hasChanges = true
      }
      
      // Fix sher -> her (from "he" + "r" in middle of words)
      if (promptFixed.includes('sher') && !promptFixed.includes('usher') && !promptFixed.includes('washer') && !promptFixed.includes('kosher')) {
        promptFixed = promptFixed.replace(/\bsher\b/g, 'her')
        hasChanges = true
      }
      
      if (titleFixed.includes('sher') && !titleFixed.includes('usher')) {
        titleFixed = titleFixed.replace(/\bsher\b/g, 'her')
        hasChanges = true
      }
      
      // Fix specific common broken patterns
      // "Edit ther image" -> "Edit the image"
      promptFixed = promptFixed.replace(/Edit ther image/g, 'Edit the image')
      titleFixed = titleFixed.replace(/Edit ther image/g, 'Edit the image')
      
      // "using ther face" -> "using the face"  
      promptFixed = promptFixed.replace(/using ther face/g, 'using the face')
      
      // "from ther " -> "from the "
      promptFixed = promptFixed.replace(/from ther /g, 'from the ')
      
      // "with ther " -> "with the "
      promptFixed = promptFixed.replace(/with ther /g, 'with the ')
      
      // "in ther " -> "in the "
      promptFixed = promptFixed.replace(/in ther /g, 'in the ')
      
      // "of ther " -> "of the "
      promptFixed = promptFixed.replace(/of ther /g, 'of the ')
      
      // Check if any changes were made
      if (promptFixed !== item.prompt || titleFixed !== item.title) {
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
            if (item.prompt !== promptFixed) {
              console.log(`   PROMPT BEFORE: ${item.prompt.substring(0, 100)}...`)
              console.log(`   PROMPT AFTER:  ${promptFixed.substring(0, 100)}...`)
            }
            if (item.title !== titleFixed) {
              console.log(`   TITLE: ${item.title} → ${titleFixed}`)
            }
          }
        }
      }
      
      processed++
    }
    
    console.log(`   ✅ ${batchFixed} fixed in this batch`)
    console.log(`   📊 Overall: ${processed}/${count} processed, ${fixed} fixed`)
  }
  
  console.log(`\n🎉 Comprehensive fix complete!`)
  console.log(`📊 Prompts processed: ${processed}`)
  console.log(`🔧 Prompts fixed: ${fixed}`)
  
  // Final verification of remaining artifacts
  const patterns = ['ther ', 'sher', 'wher']
  let totalRemaining = 0
  
  for (const pattern of patterns) {
    const { count: remaining } = await supabase
      .from('community_prompts')
      .select('id', { count: 'exact' })
      .or(`prompt.ilike.%${pattern}%,title.ilike.%${pattern}%`)
    
    if (remaining > 0) {
      console.log(`🔍 Remaining "${pattern}": ${remaining} prompts`)
      totalRemaining += remaining
    }
  }
  
  console.log(`📈 Total remaining artifacts: ${totalRemaining}`)
}

fixAllArtifacts()
  .then(() => console.log('✅ Comprehensive artifact fix complete!'))
  .catch(error => console.error('❌ Fix failed:', error))