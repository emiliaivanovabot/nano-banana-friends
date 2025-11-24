#!/usr/bin/env node

// Test user creation script for authentication system
// Backend Team - api-builder specialist

import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing environment variables!')
  console.error('Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Create admin client
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createTestUser() {
  try {
    console.log('🍌 Creating test user for Nano Banana Friends...')
    
    // Test user data
    const username = 'testuser'
    const password = 'password123'
    const hashedPassword = await bcrypt.hash(password, 12)
    
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, username')
      .eq('username', username)
      .single()
    
    if (existingUser) {
      console.log('✅ Test user already exists!')
      console.log(`Username: ${existingUser.username}`)
      console.log(`User ID: ${existingUser.id}`)
      return
    }
    
    // Create test user
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        username: username,
        password_hash: hashedPassword,
        gemini_api_key: '', // Will be filled during onboarding
        email: 'test@example.com',
        is_active: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) {
      console.error('❌ Error creating test user:', error)
      return
    }
    
    console.log('✅ Test user created successfully!')
    console.log(`Username: ${username}`)
    console.log(`Password: ${password}`)
    console.log(`User ID: ${newUser.id}`)
    console.log('')
    console.log('🎯 Login Instructions:')
    console.log('1. Go to http://localhost:5173/login')
    console.log(`2. Username: ${username}`)
    console.log(`3. Password: ${password}`)
    console.log('4. Complete onboarding with your Gemini API key')
    console.log('')
    console.log('📝 Note: User profile is incomplete - will redirect to onboarding')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the script
createTestUser()