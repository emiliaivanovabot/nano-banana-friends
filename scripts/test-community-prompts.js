#!/usr/bin/env node

/**
 * Debug Script - Test Community Prompts loading
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
dotenv.config()

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🔍 Testing Community Prompts loading...')
console.log('SUPABASE_URL:', SUPABASE_URL?.substring(0, 30) + '...')
console.log('ANON_KEY exists:', !!SUPABASE_ANON_KEY)
console.log('SERVICE_KEY exists:', !!SUPABASE_SERVICE_KEY)

// Test with anon key (like frontend)
const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

console.log('\n📡 Testing with ANON key (frontend simulation)...')

try {
  const { data: promptsData, error: promptsError } = await supabaseAnon
    .from('community_prompts')
    .select('*')
    .eq('is_active', true)
    .order('likes', { ascending: false })
    .limit(5)
  
  if (promptsError) {
    console.error('❌ ANON Error:', promptsError)
  } else {
    console.log('✅ ANON Success:', promptsData.length, 'prompts loaded')
    console.log('Sample prompt:', promptsData[0]?.title)
  }
} catch (error) {
  console.error('❌ ANON Exception:', error.message)
}

// Test with service key (like backend)
const supabaseService = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

console.log('\n🔑 Testing with SERVICE key (backend simulation)...')

try {
  const { data: promptsData, error: promptsError } = await supabaseService
    .from('community_prompts')
    .select('*')
    .eq('is_active', true)
    .order('likes', { ascending: false })
    .limit(5)
  
  if (promptsError) {
    console.error('❌ SERVICE Error:', promptsError)
  } else {
    console.log('✅ SERVICE Success:', promptsData.length, 'prompts loaded')
    console.log('Sample prompt:', promptsData[0]?.title)
  }
} catch (error) {
  console.error('❌ SERVICE Exception:', error.message)
}

// Check total count
try {
  const { count } = await supabaseService
    .from('community_prompts')
    .select('id', { count: 'exact' })
    .eq('is_active', true)
  
  console.log('\n📊 Total active prompts:', count)
  
  const { count: totalCount } = await supabaseService
    .from('community_prompts')
    .select('id', { count: 'exact' })
  
  console.log('📊 Total prompts (all):', totalCount)
  
} catch (error) {
  console.error('❌ Count Error:', error.message)
}