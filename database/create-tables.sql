-- Nano Banana Friends Database Schema
-- Creates users, user_stats, and daily_usage_history tables
-- Execute this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =======================================
-- 1. USERS TABLE
-- =======================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- =======================================
-- 2. USER_STATS TABLE
-- =======================================
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

-- =======================================
-- 3. DAILY_USAGE_HISTORY TABLE
-- =======================================
CREATE TABLE IF NOT EXISTS daily_usage_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- =======================================
-- 4. PERFORMANCE INDEXES
-- =======================================

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

-- =======================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- =======================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_usage_history ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (id = auth.uid());

-- User stats - users can only access their own stats
CREATE POLICY "Users can view own stats" ON user_stats
  FOR ALL USING (user_id = auth.uid());

-- Daily usage history - users can only access their own history
CREATE POLICY "Users can view own usage history" ON daily_usage_history
  FOR ALL USING (user_id = auth.uid());

-- =======================================
-- 6. USEFUL FUNCTIONS
-- =======================================

-- Function to update user's updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at on users table
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to reset daily stats (can be called by cron job)
CREATE OR REPLACE FUNCTION reset_daily_stats()
RETURNS void AS $$
BEGIN
    UPDATE user_stats 
    SET 
        daily_prompt_tokens = 0,
        daily_output_tokens = 0,
        daily_cost_usd = 0.0000,
        daily_count_2k_9_16 = 0,
        daily_count_2k_4_3 = 0,
        daily_count_4k_9_16 = 0,
        daily_count_4k_4_3 = 0,
        daily_generation_time_seconds = 0,
        daily_errors = 0,
        daily_reset_date = CURRENT_DATE
    WHERE daily_reset_date < CURRENT_DATE;
END;
$$ language 'plpgsql';

-- =======================================
-- 4. COMMUNITY_PROMPTS TABLE
-- =======================================
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

-- =======================================
-- 5. COMMUNITY PROMPTS INDEXES
-- =======================================
CREATE INDEX IF NOT EXISTS idx_community_prompts_category ON community_prompts(category);
CREATE INDEX IF NOT EXISTS idx_community_prompts_likes ON community_prompts(likes DESC);
CREATE INDEX IF NOT EXISTS idx_community_prompts_active ON community_prompts(is_active) WHERE is_active = true;

-- =======================================
-- 6. COMMUNITY PROMPTS RLS POLICIES
-- =======================================
ALTER TABLE community_prompts ENABLE ROW LEVEL SECURITY;

-- Community prompts are public read-only for all authenticated users
CREATE POLICY "Community prompts are public readable" ON community_prompts
  FOR SELECT USING (is_active = true);

-- Only authenticated users can view community prompts
CREATE POLICY "Authenticated users can read community prompts" ON community_prompts
  FOR SELECT USING (auth.role() = 'authenticated');

-- =======================================
-- VERIFICATION QUERIES
-- =======================================

-- Check if tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('users', 'user_stats', 'daily_usage_history', 'community_prompts');

-- Check indexes
SELECT schemaname, tablename, indexname 
FROM pg_indexes 
WHERE tablename IN ('users', 'user_stats', 'daily_usage_history', 'community_prompts');

-- Success message
DO $$
BEGIN
    RAISE NOTICE '🎉 Nano Banana Friends database schema created successfully!';
    RAISE NOTICE '📊 Tables: users, user_stats, daily_usage_history, community_prompts';
    RAISE NOTICE '🔍 Indexes: Performance indexes created';
    RAISE NOTICE '🔒 RLS: Row Level Security enabled';
    RAISE NOTICE '⚡ Functions: Auto-updaters and daily reset available';
    RAISE NOTICE '🌟 Community Prompts: Ready for bananaprompts.xyz integration';
END $$;