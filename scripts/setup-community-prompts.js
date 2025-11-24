#!/usr/bin/env node

/**
 * Setup Community Prompts Database Table
 * 
 * This script creates the community_prompts table in Supabase
 * and prepares it for data from bananaprompts.xyz
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Load environment variables
import dotenv from 'dotenv'
dotenv.config()

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing environment variables!')
  console.error('Required: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Initialize Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function setupCommunityPromptsTable() {
  console.log('🍌 Setting up Community Prompts table...')
  
  try {
    // Read the updated SQL file that includes community_prompts table
    const sqlPath = path.join(process.cwd(), 'database', 'create-tables.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')
    
    // Extract just the community_prompts related statements
    const communityPromptsSQL = `
      -- Create community_prompts table
      CREATE TABLE IF NOT EXISTS community_prompts (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        title VARCHAR(255) NOT NULL,
        prompt TEXT NOT NULL,           -- Full prompt text from bananaprompts.xyz
        category VARCHAR(100) NOT NULL,
        likes INTEGER DEFAULT 0,
        author VARCHAR(255) DEFAULT 'bananaprompts.xyz',
        image_url TEXT NOT NULL,        -- Real CDN link from bananaprompts.xyz
        source_url TEXT,                -- Original URL on bananaprompts.xyz
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Create indexes for community_prompts
      CREATE INDEX IF NOT EXISTS idx_community_prompts_category ON community_prompts(category);
      CREATE INDEX IF NOT EXISTS idx_community_prompts_likes ON community_prompts(likes DESC);
      CREATE INDEX IF NOT EXISTS idx_community_prompts_active ON community_prompts(is_active) WHERE is_active = true;

      -- Enable RLS on community_prompts
      ALTER TABLE community_prompts ENABLE ROW LEVEL SECURITY;

      -- RLS Policies for community_prompts
      CREATE POLICY "Community prompts are public readable" ON community_prompts
        FOR SELECT USING (is_active = true);

      CREATE POLICY "Authenticated users can read community prompts" ON community_prompts
        FOR SELECT USING (auth.role() = 'authenticated');
    `
    
    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql_query: communityPromptsSQL })
    
    if (error) {
      // Try alternative approach if RPC doesn't work
      console.log('Trying individual table creation...')
      
      // Create table
      const { error: createError } = await supabase
        .from('community_prompts')
        .select('*')
        .limit(1)
      
      if (createError) {
        console.error('❌ Table creation failed:', createError.message)
        throw createError
      }
    }
    
    console.log('✅ Community prompts table setup complete!')
    
    // Test the table
    console.log('🧪 Testing table access...')
    const { data, error: testError } = await supabase
      .from('community_prompts')
      .select('count(*)', { count: 'exact', head: true })
    
    if (testError) {
      console.error('❌ Table test failed:', testError.message)
      throw testError
    }
    
    console.log('✅ Table is accessible and ready!')
    console.log(`📊 Current prompts count: ${data?.[0]?.count || 0}`)
    
    // Insert a test prompt to verify everything works
    console.log('🧪 Inserting test prompt...')
    const testPrompt = {
      title: 'Test Prompt - Community Integration',
      prompt: 'A beautiful woman in a professional setting, confident and elegant, shot in cinematic style with natural lighting.',
      category: 'Test',
      likes: 1,
      author: 'nano-banana-friends',
      image_url: 'https://via.placeholder.com/400x400/f472b6/ffffff?text=Test+Prompt',
      source_url: 'https://nano-banana-friends.app',
      is_active: true
    }
    
    const { data: insertData, error: insertError } = await supabase
      .from('community_prompts')
      .insert([testPrompt])
      .select()
    
    if (insertError) {
      console.error('❌ Test insert failed:', insertError.message)
      throw insertError
    }
    
    console.log('✅ Test prompt inserted successfully!')
    console.log('📝 Test prompt ID:', insertData[0].id)
    
    console.log('\n🎉 Community Prompts setup complete!')
    console.log('Next steps:')
    console.log('1. Run the scraper: node scripts/scrape-community-prompts.js')
    console.log('2. Visit /community-prompts in the app to see the results')
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message)
    process.exit(1)
  }
}

// Run the setup
setupCommunityPromptsTable()