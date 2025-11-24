#!/usr/bin/env node

/**
 * AGGRESSIVE Fix - repair ALL remaining artifacts
 * No more cautious approach - fix everything
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
dotenv.config()

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function aggressiveFix() {
  console.log('🚨 AGGRESSIVE FIX: Repariere ALLE verbliebenen Artefakte...')
  
  // Get ALL prompts with remaining artifacts
  const { data: artifactPrompts, error } = await supabase
    .from('community_prompts')
    .select('id, prompt, title')
    .or('prompt.ilike.%ther%,title.ilike.%ther%,prompt.ilike.%wher%,title.ilike.%wher%,prompt.ilike.%sher%,title.ilike.%sher%')
  
  if (error) {
    console.error('❌ Error:', error.message)
    return
  }
  
  console.log(`🎯 Found ${artifactPrompts.length} prompts with artifacts`)
  
  let fixed = 0
  
  for (const item of artifactPrompts) {
    let promptFixed = item.prompt
    let titleFixed = item.title
    let hasChanges = false
    
    // AGGRESSIVE: Fix ALL "ther" except in legitimate words
    const therExceptions = ['other', 'another', 'father', 'mother', 'brother', 'gather', 'weather', 'leather', 'feather', 'together', 'rather', 'either']
    
    // Split by spaces and fix each word
    const promptWords = promptFixed.split(' ')
    const titleWords = titleFixed.split(' ')
    
    for (let i = 0; i < promptWords.length; i++) {
      const word = promptWords[i].toLowerCase().replace(/[.,!?;:]$/, '') // Remove punctuation for checking
      
      if (word === 'ther' || word.endsWith('ther')) {
        const isException = therExceptions.some(exc => word.includes(exc))
        if (!isException) {
          promptWords[i] = promptWords[i].replace(/ther/gi, 'the')
          hasChanges = true
        }
      }
      
      // Fix wher -> where
      if (word === 'wher') {
        promptWords[i] = promptWords[i].replace(/wher/gi, 'where')
        hasChanges = true
      }
      
      // Fix sher -> her
      if (word === 'sher') {
        promptWords[i] = promptWords[i].replace(/sher/gi, 'her')
        hasChanges = true
      }
    }
    
    // Same for title
    for (let i = 0; i < titleWords.length; i++) {
      const word = titleWords[i].toLowerCase().replace(/[.,!?;:]$/, '')
      
      if (word === 'ther' || word.endsWith('ther')) {
        const isException = therExceptions.some(exc => word.includes(exc))
        if (!isException) {
          titleWords[i] = titleWords[i].replace(/ther/gi, 'the')
          hasChanges = true
        }
      }
      
      if (word === 'wher') {
        titleWords[i] = titleWords[i].replace(/wher/gi, 'where')
        hasChanges = true
      }
      
      if (word === 'sher') {
        titleWords[i] = titleWords[i].replace(/sher/gi, 'her')
        hasChanges = true
      }
    }
    
    promptFixed = promptWords.join(' ')
    titleFixed = titleWords.join(' ')
    
    // Additional aggressive replacements for common patterns
    promptFixed = promptFixed.replace(/\bther\b/g, 'the')
    titleFixed = titleFixed.replace(/\bther\b/g, 'the')
    
    if (hasChanges || promptFixed !== item.prompt || titleFixed !== item.title) {
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
        
        if (fixed <= 10) {
          console.log(`📝 Aggressive Fix ${fixed}:`)
          console.log(`   ID: ${item.id}`)
          if (item.prompt !== promptFixed) {
            console.log(`   PROMPT: ${item.prompt.substring(0, 80)}...`)
            console.log(`   FIXED:  ${promptFixed.substring(0, 80)}...`)
          }
          if (item.title !== titleFixed) {
            console.log(`   TITLE: ${item.title} → ${titleFixed}`)
          }
        }
        
        if (fixed % 50 === 0) {
          console.log(`✅ Aggressively fixed ${fixed} prompts so far...`)
        }
      }
    }
  }
  
  console.log(`\n🎉 Aggressive fix complete!`)
  console.log(`🔧 Prompts aggressively fixed: ${fixed}`)
  
  // Final verification
  const { count: finalArtifacts } = await supabase
    .from('community_prompts')
    .select('id', { count: 'exact' })
    .or('prompt.ilike.%ther%,title.ilike.%ther%,prompt.ilike.%wher%,title.ilike.%wher%,prompt.ilike.%sher%,title.ilike.%sher%')
  
  const cleanPrompts = 1706 - finalArtifacts
  console.log(`\n🎯 FINAL RESULT:`)
  console.log(`   ✅ Clean prompts: ${cleanPrompts}/1706 (${Math.round(cleanPrompts/1706*100)}%)`)
  console.log(`   ❌ Remaining artifacts: ${finalArtifacts}/1706`)
  
  if (finalArtifacts === 0) {
    console.log(`🎉 🎉 🎉 ALL 1706 PROMPTS ARE NOW CLEAN! 🎉 🎉 🎉`)
  }
}

aggressiveFix()
  .then(() => console.log('✅ Aggressive fix complete!'))
  .catch(error => console.error('❌ Aggressive fix failed:', error))