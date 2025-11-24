#!/usr/bin/env node

/**
 * DEBUG: Investigate remaining NO_CHANGE issues
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

async function debugNoChange() {
  console.log('🔍 Debugging remaining NO_CHANGE issues...')
  
  const { data: prompts, error } = await supabase
    .from('community_prompts')
    .select('*')
    .or('title.ilike.%NO_CHANGE%,prompt.ilike.%NO_CHANGE%')
  
  if (error) {
    console.error('❌ Error:', error.message)
    return
  }
  
  console.log(`📋 Found ${prompts.length} problematic prompts:`)
  console.log('')
  
  prompts.forEach((prompt, i) => {
    console.log(`${i + 1}. ID: ${prompt.id}`)
    console.log(`   TITLE: "${prompt.title}"`)
    console.log(`   TITLE includes NO_CHANGE: ${prompt.title?.includes('NO_CHANGE')}`)
    console.log(`   PROMPT includes NO_CHANGE: ${prompt.prompt?.includes('NO_CHANGE')}`)
    
    if (prompt.prompt?.includes('NO_CHANGE')) {
      const lines = prompt.prompt.split('\n')
      lines.forEach((line, lineIndex) => {
        if (line.includes('NO_CHANGE')) {
          console.log(`   LINE ${lineIndex + 1}: "${line}"`)
        }
      })
    }
    
    console.log(`   PROMPT START: "${prompt.prompt?.substring(0, 200)}..."`)
    console.log('')
  })
}

debugNoChange()
  .then(() => console.log('✅ Debug complete'))
  .catch(error => console.error('❌ Debug failed:', error))