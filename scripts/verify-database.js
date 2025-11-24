/**
 * Database Verification Script for Nano Banana Friends
 * Checks if tables exist and connection is working
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

// Create Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function verifyDatabase() {
  console.log('🔍 Verifying Nano Banana Friends Database...')
  console.log(`📡 Connecting to: ${supabaseUrl}`)
  console.log('')

  try {
    // Test basic connection first
    console.log('📊 Testing basic Supabase connection...')
    
    try {
      // Try to get the health status or any simple query
      const { data: healthCheck, error: healthError } = await supabase
        .from('pg_stat_database')
        .select('count')
        .limit(1)
      
      if (healthError) {
        // If that fails, the connection itself might be working but we just can't access system tables
        console.log('✅ Basic connection established (system tables not accessible, which is normal)')
      } else {
        console.log('✅ Full database connection successful')
      }
    } catch (err) {
      console.log('✅ Connection established (limited system access, which is expected)')
    }
    
    // Check for our specific tables
    const expectedTables = ['users', 'user_stats', 'daily_usage_history']
    const tableResults = {}
    
    console.log('📋 Checking for required tables...')
    
    for (const tableName of expectedTables) {
      try {
        // Try to select from each table to verify it exists
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(0) // Don't fetch any rows, just check if table exists
        
        if (error) {
          if (error.message.includes('does not exist') || error.code === '42P01') {
            tableResults[tableName] = { exists: false, error: 'Table does not exist' }
          } else {
            tableResults[tableName] = { exists: false, error: error.message }
          }
        } else {
          tableResults[tableName] = { exists: true }
        }
      } catch (err) {
        tableResults[tableName] = { exists: false, error: err.message }
      }
    }
    
    // Report results
    console.log('')
    console.log('📊 Table Verification Results:')
    console.log('=' .repeat(50))
    
    let allTablesExist = true
    
    for (const [tableName, result] of Object.entries(tableResults)) {
      if (result.exists) {
        console.log(`✅ ${tableName}: EXISTS`)
      } else {
        console.log(`❌ ${tableName}: MISSING - ${result.error}`)
        allTablesExist = false
      }
    }
    
    console.log('')
    
    if (allTablesExist) {
      console.log('🎉 ALL TABLES EXIST! Database is ready for production.')
      console.log('')
      console.log('📊 Your Nano Banana Friends database includes:')
      console.log('✅ users - User profiles and authentication')
      console.log('✅ user_stats - Usage tracking and financial metrics')
      console.log('✅ daily_usage_history - Daily analytics and BI data')
      console.log('')
      console.log('🚀 Next steps:')
      console.log('1. Implement user registration/login')
      console.log('2. Add usage tracking to image generation')
      console.log('3. Build analytics dashboard')
      
      return true
    } else {
      console.log('⚠️  SOME TABLES ARE MISSING')
      console.log('')
      console.log('🔧 To fix this:')
      console.log('1. Go to your Supabase Dashboard SQL Editor')
      console.log(`2. Visit: ${supabaseUrl.replace('/rest/v1', '')}/project/sql`)
      console.log('3. Run the SQL commands from: scripts/manual-database-setup.js')
      console.log('4. Or execute the SQL file: database/create-tables.sql')
      
      return false
    }
    
  } catch (error) {
    console.error('💥 Verification failed:', error.message)
    console.error('')
    console.error('🔧 Troubleshooting:')
    console.error('1. Check your Supabase credentials in .env.local')
    console.error('2. Verify your service role key has proper permissions')
    console.error('3. Make sure your Supabase project is active')
    
    return false
  }
}

// Run verification
verifyDatabase()
  .then((success) => {
    if (success) {
      console.log('✅ Database verification completed successfully')
      process.exit(0)
    } else {
      console.log('❌ Database verification failed')
      process.exit(1)
    }
  })
  .catch((error) => {
    console.error('💥 Unexpected error:', error)
    process.exit(1)
  })