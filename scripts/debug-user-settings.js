#!/usr/bin/env node

/**
 * DEBUG: Check user settings table structure
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
dotenv.config()

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

console.log('🔍 Debugging user settings table structure...')

// Get all columns from users table
const { data: allData, error } = await supabase
  .from('users')
  .select('*')
  .limit(1)

if (error) {
  console.error('❌ Error:', error)
  process.exit(1)
}

if (allData && allData.length > 0) {
  console.log('✅ Available columns in users table:')
  console.log(Object.keys(allData[0]))
  
  console.log('\n📊 Sample user data:')
  console.log(allData[0])
} else {
  console.log('❌ No users found in table')
}