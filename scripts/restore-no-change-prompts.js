#!/usr/bin/env node

/**
 * RESTORE: Fix NO_CHANGE artifacts by restoring from original bananaprompts.db
 */

import { createClient } from '@supabase/supabase-js'
import Database from 'better-sqlite3'
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

async function restoreNoChangePrompts() {
  console.log('🔧 Restoring NO_CHANGE artifacts from original source...')
  
  // Connect to original database
  const db = new Database('/Users/bertanyalcintepe/Desktop/bananaprompts/data/prompts.db', { readonly: true })
  
  // Get all broken prompts from Supabase
  const { data: brokenPrompts, error } = await supabase
    .from('community_prompts')
    .select('*')
    .or('title.eq.NO_CHANGE,prompt.eq.NO_CHANGE,title.ilike.%NO_CHANGE%,prompt.ilike.%NO_CHANGE%')
  
  if (error) {
    console.error('❌ Error:', error.message)
    return
  }
  
  console.log(`🔍 Found ${brokenPrompts.length} broken prompts to restore`)
  
  let restored = 0
  let notFound = 0
  
  for (const brokenPrompt of brokenPrompts) {
    try {
      // Find original prompt by matching similar content or source_url
      const originalQuery = `
        SELECT * FROM prompts 
        WHERE source_url = ? 
        OR (title LIKE ? AND length(title) > 5)
        LIMIT 1
      `
      
      let original = null
      
      // Try by source_url first
      if (brokenPrompt.source_url) {
        original = db.prepare(originalQuery).get(brokenPrompt.source_url, `%${brokenPrompt.title}%`)
      }
      
      // If not found and we have a decent title, try by title similarity
      if (!original && brokenPrompt.title !== 'NO_CHANGE' && brokenPrompt.title.length > 10) {
        const titleQuery = `SELECT * FROM prompts WHERE title LIKE ? LIMIT 1`
        original = db.prepare(titleQuery).get(`%${brokenPrompt.title}%`)
      }
      
      if (original) {
        // Restore the original content
        const { error: updateError } = await supabase
          .from('community_prompts')
          .update({
            title: original.title,
            prompt: original.prompt
          })
          .eq('id', brokenPrompt.id)
        
        if (updateError) {
          console.error(`❌ Failed to restore ${brokenPrompt.id}:`, updateError.message)
        } else {
          restored++
          
          if (restored <= 5) {
            console.log(`✅ Restored ${restored}:`)
            console.log(`   ID: ${brokenPrompt.id}`)
            console.log(`   TITLE: ${original.title}`)
            console.log(`   PROMPT: ${original.prompt.substring(0, 100)}...`)
            console.log()
          }
        }
      } else {
        notFound++
        if (notFound <= 5) {
          console.log(`⚠️  Could not find original for ID ${brokenPrompt.id}`)
        }
      }
      
    } catch (error) {
      console.error(`❌ Error processing ${brokenPrompt.id}:`, error.message)
    }
  }
  
  db.close()
  
  console.log(`\n🎉 Restoration complete!`)
  console.log(`✅ Restored: ${restored}`)
  console.log(`⚠️  Not found: ${notFound}`)
  console.log(`📊 Total: ${brokenPrompts.length}`)
}

restoreNoChangePrompts()
  .then(() => console.log('✅ Restoration script complete'))
  .catch(error => console.error('❌ Restoration failed:', error))