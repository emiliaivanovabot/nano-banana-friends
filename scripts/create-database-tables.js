/**
 * Database Table Creation Script for Nano Banana Friends
 * Creates users, user_stats, and daily_usage_history tables
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Create Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createTables() {
  console.log('🚀 Starting database table creation...')
  
  try {
    // 1. Create users table
    console.log('📊 Creating users table...')
    const usersTableSQL = `
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        gemini_api_key TEXT NOT NULL,
        email VARCHAR(255),
        
        -- Physical Attributes
        hair_color VARCHAR(50),
        eye_color VARCHAR(50),
        skin_tone VARCHAR(50),
        age_range VARCHAR(20),
        
        -- User Preferences
        default_resolution VARCHAR(10) DEFAULT '2K',
        default_aspect_ratio VARCHAR(10) DEFAULT '9:16',
        favorite_prompts JSONB DEFAULT '[]',
        
        -- Face Management
        main_face_image_url TEXT,
        face_2_image_url TEXT,
        face_2_name VARCHAR(100),
        face_3_image_url TEXT,
        face_3_name VARCHAR(100),
        
        -- System
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        last_login TIMESTAMP
      );
    `
    
    const usersResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceRoleKey}`,
        'Content-Type': 'application/json',
        'apikey': supabaseServiceRoleKey
      },
      body: JSON.stringify({ query: usersTableSQL })
    })
    
    if (!usersResponse.ok) {
      const errorText = await usersResponse.text()
      console.error('❌ Error creating users table:', errorText)
      throw new Error(`Users table creation failed: ${errorText}`)
    }
    console.log('✅ Users table created successfully')
    
    // 2. Create user_stats table
    console.log('📊 Creating user_stats table...')
    const userStatsTableSQL = `
      CREATE TABLE IF NOT EXISTS user_stats (
        user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        
        -- Token Tracking
        daily_prompt_tokens INTEGER DEFAULT 0,
        daily_output_tokens INTEGER DEFAULT 0,
        total_prompt_tokens INTEGER DEFAULT 0,
        total_output_tokens INTEGER DEFAULT 0,
        
        -- Financial Tracking
        daily_cost_usd DECIMAL(10,4) DEFAULT 0.0000,
        total_cost_usd DECIMAL(10,4) DEFAULT 0.0000,
        
        -- Feature Usage Counters
        daily_count_2k_9_16 INTEGER DEFAULT 0,
        daily_count_2k_4_3 INTEGER DEFAULT 0,
        daily_count_4k_9_16 INTEGER DEFAULT 0,
        daily_count_4k_4_3 INTEGER DEFAULT 0,
        daily_generation_time_seconds INTEGER DEFAULT 0,
        daily_errors INTEGER DEFAULT 0,
        daily_reset_date DATE DEFAULT CURRENT_DATE,
        
        -- Lifetime Totals
        total_count_2k_9_16 INTEGER DEFAULT 0,
        total_count_2k_4_3 INTEGER DEFAULT 0,
        total_count_4k_9_16 INTEGER DEFAULT 0,
        total_count_4k_4_3 INTEGER DEFAULT 0,
        total_generation_time_seconds INTEGER DEFAULT 0,
        total_generations INTEGER DEFAULT 0,
        total_errors INTEGER DEFAULT 0,
        
        -- Error Tracking
        last_error_message TEXT,
        last_error_timestamp TIMESTAMP
      );
    `
    
    const { error: userStatsError } = await supabase.rpc('exec_sql', { query: userStatsTableSQL })
    if (userStatsError) {
      console.error('❌ Error creating user_stats table:', userStatsError)
      throw userStatsError
    }
    console.log('✅ User_stats table created successfully')
    
    // 3. Create daily_usage_history table
    console.log('📊 Creating daily_usage_history table...')
    const dailyUsageHistoryTableSQL = `
      CREATE TABLE IF NOT EXISTS daily_usage_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        usage_date DATE NOT NULL,
        
        -- Financial Analytics
        cost_usd DECIMAL(10,4) DEFAULT 0.0000,
        generations_count INTEGER DEFAULT 0,
        generation_time_seconds INTEGER DEFAULT 0,
        
        -- Feature Usage Distribution
        count_2k_9_16 INTEGER DEFAULT 0,
        count_2k_4_3 INTEGER DEFAULT 0,
        count_4k_9_16 INTEGER DEFAULT 0,
        count_4k_4_3 INTEGER DEFAULT 0,
        
        -- Business Intelligence
        prompt_tokens INTEGER DEFAULT 0,
        output_tokens INTEGER DEFAULT 0,
        errors_count INTEGER DEFAULT 0,
        peak_usage_hour INTEGER,
        most_used_prompts JSONB,
        
        -- System
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, usage_date)
      );
    `
    
    const { error: dailyUsageError } = await supabase.rpc('exec_sql', { query: dailyUsageHistoryTableSQL })
    if (dailyUsageError) {
      console.error('❌ Error creating daily_usage_history table:', dailyUsageError)
      throw dailyUsageError
    }
    console.log('✅ Daily_usage_history table created successfully')
    
    // 4. Create performance indexes
    console.log('🔍 Creating performance indexes...')
    const indexesSQL = `
      -- Index for username lookups (login)
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
      
      -- Index for user email lookups
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      
      -- Index for active users
      CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active) WHERE is_active = true;
      
      -- Index for daily usage queries
      CREATE INDEX IF NOT EXISTS idx_daily_usage_user_date ON daily_usage_history(user_id, usage_date);
      
      -- Index for usage date queries
      CREATE INDEX IF NOT EXISTS idx_daily_usage_date ON daily_usage_history(usage_date);
      
      -- Index for user stats daily reset queries
      CREATE INDEX IF NOT EXISTS idx_user_stats_reset_date ON user_stats(daily_reset_date);
    `
    
    const { error: indexError } = await supabase.rpc('exec_sql', { query: indexesSQL })
    if (indexError) {
      console.error('❌ Error creating indexes:', indexError)
      throw indexError
    }
    console.log('✅ Performance indexes created successfully')
    
    // 5. Verify tables were created
    console.log('🔍 Verifying table creation...')
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['users', 'user_stats', 'daily_usage_history'])
    
    if (tablesError) {
      console.error('❌ Error verifying tables:', tablesError)
      throw tablesError
    }
    
    const createdTables = tables?.map(t => t.table_name) || []
    const expectedTables = ['users', 'user_stats', 'daily_usage_history']
    
    console.log('📋 Created tables:', createdTables)
    
    const missingTables = expectedTables.filter(table => !createdTables.includes(table))
    if (missingTables.length > 0) {
      console.error('❌ Missing tables:', missingTables)
      throw new Error(`Missing tables: ${missingTables.join(', ')}`)
    }
    
    console.log('🎉 All database tables created successfully!')
    console.log('📊 Database is ready for Nano Banana Friends Alpha → Commercial business model')
    
    return {
      success: true,
      tables: createdTables,
      message: 'Database tables created successfully with proper indexing and constraints'
    }
    
  } catch (error) {
    console.error('💥 Database creation failed:', error)
    return {
      success: false,
      error: error.message,
      message: 'Database table creation failed'
    }
  }
}

// Run the script
createTables()
  .then((result) => {
    if (result.success) {
      console.log('✅ Database setup completed successfully')
      process.exit(0)
    } else {
      console.error('❌ Database setup failed')
      process.exit(1)
    }
  })
  .catch((error) => {
    console.error('💥 Unexpected error:', error)
    process.exit(1)
  })