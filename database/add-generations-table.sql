-- ==============================================
-- ASYNC IMAGE GENERATION SYSTEM - GENERATIONS TABLE
-- ==============================================
-- This migration adds the generations table for async image generation
-- Solves mobile sleep/lock interruption issues by tracking generation status
-- Execute this SQL in your Supabase SQL Editor AFTER create-tables.sql

-- =======================================
-- 1. GENERATIONS TABLE
-- =======================================
CREATE TABLE IF NOT EXISTS generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Generation Request Data
  prompt TEXT NOT NULL,
  resolution VARCHAR(10) NOT NULL,
  aspect_ratio VARCHAR(10) NOT NULL,
  main_face_image_url TEXT,
  additional_images JSONB DEFAULT '[]',
  
  -- Generation Status & Results
  status VARCHAR(20) DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  result_image_url TEXT,
  result_base64 TEXT,
  error_message TEXT,
  
  -- Technical Metadata
  gemini_metadata JSONB DEFAULT '{}',
  generation_time_seconds INTEGER,
  retry_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  
  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('processing', 'completed', 'failed')),
  CONSTRAINT result_check CHECK (
    (status = 'completed' AND (result_image_url IS NOT NULL OR result_base64 IS NOT NULL)) OR
    (status = 'failed' AND error_message IS NOT NULL) OR
    (status = 'processing')
  )
);

-- =======================================
-- 2. PERFORMANCE INDEXES
-- =======================================

-- Primary query patterns: user's recent generations by status
CREATE INDEX idx_generations_user_status ON generations(user_id, status, created_at DESC);

-- Status monitoring queries
CREATE INDEX idx_generations_status_created ON generations(status, created_at DESC);

-- Cleanup queries for old generations
CREATE INDEX idx_generations_created_at ON generations(created_at);

-- Processing generations for background workers
CREATE INDEX idx_generations_processing ON generations(status, created_at) 
  WHERE status = 'processing';

-- User's recent activity
CREATE INDEX idx_generations_user_recent ON generations(user_id, created_at DESC);

-- =======================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- =======================================

-- Enable RLS on generations table
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;

-- Users can only access their own generations
CREATE POLICY "Users can view own generations" ON generations
  FOR SELECT USING (user_id = auth.uid());

-- Users can create their own generations
CREATE POLICY "Users can create own generations" ON generations
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own generations (for retry functionality)
CREATE POLICY "Users can update own generations" ON generations
  FOR UPDATE USING (user_id = auth.uid());

-- Users can delete their own generations (cleanup)
CREATE POLICY "Users can delete own generations" ON generations
  FOR DELETE USING (user_id = auth.uid());

-- =======================================
-- 4. HELPER FUNCTIONS
-- =======================================

-- Function to automatically set started_at when status changes to processing
CREATE OR REPLACE FUNCTION set_generation_started_at()
RETURNS TRIGGER AS $$
BEGIN
    -- Set started_at when status becomes processing (if not already set)
    IF NEW.status = 'processing' AND OLD.status != 'processing' AND NEW.started_at IS NULL THEN
        NEW.started_at = NOW();
    END IF;
    
    -- Set completed_at when status becomes completed or failed
    IF (NEW.status = 'completed' OR NEW.status = 'failed') AND 
       (OLD.status != NEW.status) AND 
       NEW.completed_at IS NULL THEN
        NEW.completed_at = NOW();
        
        -- Calculate generation time if we have started_at
        IF NEW.started_at IS NOT NULL THEN
            NEW.generation_time_seconds = EXTRACT(EPOCH FROM (NOW() - NEW.started_at))::INTEGER;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically set timestamps
CREATE TRIGGER trigger_generation_timestamps
    BEFORE UPDATE ON generations
    FOR EACH ROW
    EXECUTE FUNCTION set_generation_started_at();

-- Function to cleanup old generations (30-day retention)
CREATE OR REPLACE FUNCTION cleanup_old_generations()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM generations 
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log cleanup action
    RAISE NOTICE 'Cleaned up % old generations (older than 30 days)', deleted_count;
    
    RETURN deleted_count;
END;
$$ language 'plpgsql';

-- Function to get generation statistics for monitoring
CREATE OR REPLACE FUNCTION get_generation_stats(user_id_param UUID DEFAULT NULL)
RETURNS TABLE(
    total_generations BIGINT,
    processing_generations BIGINT,
    completed_generations BIGINT,
    failed_generations BIGINT,
    avg_generation_time_seconds NUMERIC,
    success_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_generations,
        COUNT(*) FILTER (WHERE status = 'processing') as processing_generations,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_generations,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_generations,
        AVG(generation_time_seconds) as avg_generation_time_seconds,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                (COUNT(*) FILTER (WHERE status = 'completed')::NUMERIC / COUNT(*)::NUMERIC) * 100
            ELSE 0
        END as success_rate
    FROM generations 
    WHERE (user_id_param IS NULL OR user_id = user_id_param)
    AND created_at > NOW() - INTERVAL '7 days';
END;
$$ language 'plpgsql';

-- =======================================
-- 5. VERIFICATION QUERIES
-- =======================================

-- Verify the table was created
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'generations' 
ORDER BY ordinal_position;

-- Verify indexes were created
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'generations';

-- Verify RLS policies
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'generations';

-- =======================================
-- 6. SAMPLE USAGE QUERIES
-- =======================================

-- Create a new generation request (example)
-- INSERT INTO generations (user_id, prompt, resolution, aspect_ratio, main_face_image_url)
-- VALUES (
--     'user-uuid-here',
--     'Create a professional headshot with a friendly smile',
--     '2K',
--     '9:16',
--     'https://storage.url/face-image.jpg'
-- );

-- Check generation status
-- SELECT id, status, created_at, completed_at, error_message
-- FROM generations 
-- WHERE user_id = 'user-uuid-here'
-- ORDER BY created_at DESC;

-- Get user's recent generations with results
-- SELECT 
--     id, 
--     prompt,
--     status,
--     result_image_url,
--     generation_time_seconds,
--     created_at
-- FROM generations 
-- WHERE user_id = 'user-uuid-here'
-- AND status = 'completed'
-- ORDER BY created_at DESC
-- LIMIT 10;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '🚀 Async Generation System database schema created successfully!';
    RAISE NOTICE '📋 Table: generations with optimized indexes';
    RAISE NOTICE '🔒 RLS: Row Level Security enabled for user isolation';
    RAISE NOTICE '⚡ Functions: Automatic timestamps and cleanup utilities';
    RAISE NOTICE '📊 Monitoring: Generation statistics functions available';
    RAISE NOTICE '🧹 Cleanup: 30-day retention policy implemented';
    RAISE NOTICE '📱 Mobile Ready: Supports async generation with status tracking';
END $$;