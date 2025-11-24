#!/usr/bin/env node

/**
 * EMERGENCY: Fix NO_CHANGE artifacts from translation script
 * Restore original prompts where title/prompt was set to "NO_CHANGE"
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

async function fixNoChangeArtifacts() {
  console.log('🚨 EMERGENCY: Fixing NO_CHANGE artifacts...')
  
  // Find all prompts with NO_CHANGE in title or prompt
  const { data: brokenPrompts, error } = await supabase
    .from('community_prompts')
    .select('*')
    .or('title.eq.NO_CHANGE,prompt.eq.NO_CHANGE,title.ilike.%NO_CHANGE%,prompt.ilike.%NO_CHANGE%')
  
  if (error) {
    console.error('❌ Error:', error.message)
    return
  }
  
  console.log(`🔍 Found ${brokenPrompts.length} prompts with NO_CHANGE artifacts`)
  
  if (brokenPrompts.length === 0) {
    console.log('✅ No NO_CHANGE artifacts found!')
    return
  }
  
  // Show examples
  console.log('\n📋 Examples of broken prompts:')
  brokenPrompts.slice(0, 5).forEach((prompt, i) => {
    console.log(`${i + 1}. ID: ${prompt.id}`)
    console.log(`   TITLE: ${prompt.title}`)
    console.log(`   PROMPT: ${prompt.prompt.substring(0, 100)}...`)
    console.log()
  })
  
  console.log(`\n⚠️  CRITICAL: ${brokenPrompts.length} prompts have NO_CHANGE artifacts!`)
  console.log('💡 These prompts need to be restored from backup or original source.')
  console.log('💡 This happened because translation script incorrectly set "NO_CHANGE" as content instead of leaving unchanged.')
  
  // We need the original bananaprompts.db to restore these
  console.log('\n🔧 SOLUTION: Need to restore from original bananaprompts.db source')
  console.log('📍 Location: /Users/bertanyalcintepe/Desktop/bananaprompts/data/prompts.db')
}

fixNoChangeArtifacts()
  .then(() => console.log('✅ Analysis complete'))
  .catch(error => console.error('❌ Failed:', error))