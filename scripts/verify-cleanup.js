#!/usr/bin/env node

/**
 * VERIFICATION: Check for literal NO_CHANGE artifacts vs legitimate "no changes" text
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

async function verifyCleanup() {
  console.log('🔍 FINAL VERIFICATION: Checking for actual NO_CHANGE artifacts...')
  
  // Check for literal "NO_CHANGE" (the actual artifacts)
  const { data: artifacts, error: artifactsError } = await supabase
    .from('community_prompts')
    .select('*')
    .or('title.eq.NO_CHANGE,prompt.eq.NO_CHANGE')
  
  if (artifactsError) {
    console.error('❌ Error checking artifacts:', artifactsError.message)
    return
  }
  
  console.log(`🎯 Literal "NO_CHANGE" artifacts: ${artifacts.length}`)
  
  if (artifacts.length > 0) {
    artifacts.forEach(artifact => {
      console.log(`   - ID ${artifact.id}: Title="${artifact.title}", Prompt="${artifact.prompt}"`)
    })
  }
  
  // Check for legitimate "no changes" text (which should remain)
  const { data: legitimateText, error: legitError } = await supabase
    .from('community_prompts')
    .select('id, title')
    .ilike('prompt', '%no changes%')
  
  if (legitError) {
    console.error('❌ Error checking legitimate text:', legitError.message)
    return
  }
  
  console.log(`📝 Prompts with legitimate "no changes" text: ${legitimateText?.length || 0}`)
  
  // Get overall statistics
  const { data: allPrompts, error: statsError } = await supabase
    .from('community_prompts')
    .select('id')
  
  if (statsError) {
    console.error('❌ Error getting stats:', statsError.message)
    return
  }
  
  console.log('\n' + '='.repeat(80))
  console.log('🎉 CLEANUP VERIFICATION COMPLETE!')
  console.log('='.repeat(80))
  console.log(`📊 Total prompts in database: ${allPrompts?.length || 0}`)
  console.log(`❌ Actual NO_CHANGE artifacts: ${artifacts.length}`)
  console.log(`✅ Legitimate "no changes" references: ${legitimateText?.length || 0}`)
  
  if (artifacts.length === 0) {
    console.log('\n🎉 SUCCESS: All NO_CHANGE artifacts have been successfully cleaned!')
    console.log('🎯 Community prompts are now properly formatted for nano-banana generation')
  } else {
    console.log('\n⚠️  Some NO_CHANGE artifacts still remain and need manual attention')
  }
  
  console.log('='.repeat(80))
}

verifyCleanup()
  .then(() => console.log('✅ Verification complete'))
  .catch(error => console.error('❌ Verification failed:', error))