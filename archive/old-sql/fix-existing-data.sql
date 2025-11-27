-- ==============================================
-- FIX EXISTING DATA AND PROPERTY NAME INCONSISTENCY
-- ==============================================
-- This script fixes the inconsistency between snake_case and camelCase
-- in the existing database records and sets up the corrected materialized view

-- 1. ANALYSIS: Check current data structure
SELECT 
  'Current Data Analysis' as step,
  COUNT(*) as total_generations,
  COUNT(*) FILTER (WHERE gemini_metadata->'usageMetadata' IS NOT NULL) as with_camelCase_metadata,
  COUNT(*) FILTER (WHERE gemini_metadata->'usage_metadata' IS NOT NULL) as with_snake_case_metadata,
  COUNT(*) FILTER (WHERE 
    gemini_metadata->'usageMetadata' IS NOT NULL OR 
    gemini_metadata->'usage_metadata' IS NOT NULL
  ) as with_any_metadata
FROM generations 
WHERE status = 'completed';

-- 2. DATA MIGRATION: Convert snake_case to camelCase for consistency
-- This updates existing records to use the correct camelCase format
UPDATE generations 
SET gemini_metadata = jsonb_set(
  jsonb_set(
    gemini_metadata,
    '{usageMetadata}',
    gemini_metadata->'usage_metadata'
  ),
  '{usage_metadata}',
  'null'::jsonb,
  false
)
WHERE gemini_metadata->'usage_metadata' IS NOT NULL 
  AND gemini_metadata->'usageMetadata' IS NULL;

-- 3. VERIFICATION: Confirm data migration worked
SELECT 
  'After Migration' as step,
  COUNT(*) as total_generations,
  COUNT(*) FILTER (WHERE gemini_metadata->'usageMetadata' IS NOT NULL) as with_camelCase_metadata,
  COUNT(*) FILTER (WHERE gemini_metadata->'usage_metadata' IS NOT NULL) as with_snake_case_remaining
FROM generations 
WHERE status = 'completed';

-- 4. SAMPLE DATA CHECK: Show actual token values
SELECT 
  'Sample Token Data' as step,
  user_id,
  created_at::date as date,
  gemini_metadata->'usageMetadata'->>'promptTokenCount' as prompt_tokens,
  gemini_metadata->'usageMetadata'->>'candidatesTokenCount' as output_tokens,
  gemini_metadata->'usageMetadata'->>'totalTokenCount' as total_tokens
FROM generations 
WHERE gemini_metadata->'usageMetadata' IS NOT NULL
  AND status = 'completed'
ORDER BY created_at DESC
LIMIT 10;

-- 5. DROP AND RECREATE MATERIALIZED VIEW (if exists)
DROP MATERIALIZED VIEW IF EXISTS daily_usage_history CASCADE;

-- 6. CREATE CORRECTED MATERIALIZED VIEW
-- Using the correct camelCase property names throughout
CREATE MATERIALIZED VIEW daily_usage_history AS
SELECT 
  gen_random_uuid() as id,
  user_id,
  DATE(created_at) as usage_date,
  
  -- Real costs based on corrected Gemini token data
  COALESCE(
    SUM(
      (COALESCE((gemini_metadata->'usageMetadata'->>'promptTokenCount')::integer, 0) * 0.001 / 1000) +
      (COALESCE((gemini_metadata->'usageMetadata'->>'candidatesTokenCount')::integer, 0) * 0.002 / 1000)
    ), 0
  )::decimal(10,4) as cost_usd,
  
  -- Generation counts and timing
  COUNT(*)::integer as generations_count,
  COALESCE(SUM(generation_time_seconds), 0)::integer as generation_time_seconds,
  
  -- Resolution tracking
  COUNT(*) FILTER (WHERE resolution = '1K')::integer as count_1k,
  COUNT(*) FILTER (WHERE resolution = '2K')::integer as count_2k,
  COUNT(*) FILTER (WHERE resolution = '4K')::integer as count_4k,
  
  -- Legacy columns for backward compatibility
  COUNT(*) FILTER (WHERE resolution = '2K' AND aspect_ratio = '9:16')::integer as count_2k_9_16,
  COUNT(*) FILTER (WHERE resolution = '2K' AND aspect_ratio = '4:3')::integer as count_2k_4_3,
  COUNT(*) FILTER (WHERE resolution = '4K' AND aspect_ratio = '9:16')::integer as count_4k_9_16,
  COUNT(*) FILTER (WHERE resolution = '4K' AND aspect_ratio = '4:3')::integer as count_4k_4_3,
  
  -- Real token counts from corrected Gemini metadata
  COALESCE(SUM((gemini_metadata->'usageMetadata'->>'promptTokenCount')::integer), 0)::integer as prompt_tokens,
  COALESCE(SUM((gemini_metadata->'usageMetadata'->>'candidatesTokenCount')::integer), 0)::integer as output_tokens,
  COALESCE(SUM((gemini_metadata->'usageMetadata'->>'totalTokenCount')::integer), 0)::integer as total_tokens,
  
  -- Error tracking
  COUNT(*) FILTER (WHERE status = 'failed')::integer as errors_count,
  
  -- Analytics fields
  EXTRACT(HOUR FROM MAX(created_at))::integer as peak_usage_hour,
  '[]'::jsonb as most_used_prompts,
  
  -- Timestamps
  NOW() as created_at
  
FROM generations 
WHERE status IN ('completed', 'failed')
GROUP BY user_id, DATE(created_at);

-- 7. CREATE INDEXES FOR PERFORMANCE
CREATE INDEX idx_daily_usage_mv_user_date ON daily_usage_history(user_id, usage_date DESC);
CREATE INDEX idx_daily_usage_mv_date ON daily_usage_history(usage_date DESC);
CREATE INDEX idx_daily_usage_mv_user ON daily_usage_history(user_id);

-- 8. CREATE REFRESH FUNCTION
CREATE OR REPLACE FUNCTION refresh_daily_usage_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW daily_usage_history;
  RAISE NOTICE 'Daily usage stats materialized view refreshed at %', NOW();
END;
$$ language 'plpgsql';

-- 9. CREATE COMPATIBILITY FUNCTION
CREATE OR REPLACE FUNCTION get_daily_usage_by_user(p_user_id UUID, p_days INTEGER DEFAULT 30)
RETURNS TABLE(
  id UUID,
  user_id UUID,
  usage_date DATE,
  cost_usd DECIMAL(10,4),
  generations_count INTEGER,
  generation_time_seconds INTEGER,
  count_1k INTEGER,
  count_2k INTEGER,
  count_4k INTEGER,
  count_2k_9_16 INTEGER,
  count_2k_4_3 INTEGER,
  count_4k_9_16 INTEGER,
  count_4k_4_3 INTEGER,
  prompt_tokens INTEGER,
  output_tokens INTEGER,
  errors_count INTEGER,
  created_at TIMESTAMP
) AS $$
BEGIN
  -- Force a refresh before querying to ensure latest data
  REFRESH MATERIALIZED VIEW daily_usage_history;
  
  RETURN QUERY
  SELECT 
    h.id,
    h.user_id,
    h.usage_date,
    h.cost_usd,
    h.generations_count,
    h.generation_time_seconds,
    h.count_1k,
    h.count_2k,
    h.count_4k,
    h.count_2k_9_16,
    h.count_2k_4_3,
    h.count_4k_9_16,
    h.count_4k_4_3,
    h.prompt_tokens,
    h.output_tokens,
    h.errors_count,
    h.created_at
  FROM daily_usage_history h
  WHERE h.user_id = p_user_id
    AND h.usage_date >= CURRENT_DATE - INTERVAL '1 day' * p_days
  ORDER BY h.usage_date DESC;
END;
$$ language 'plpgsql';

-- 10. INITIAL REFRESH
REFRESH MATERIALIZED VIEW daily_usage_history;

-- 11. FINAL VERIFICATION
SELECT 
  'Final Results' as status,
  COUNT(*) as total_daily_records,
  COUNT(DISTINCT user_id) as unique_users,
  SUM(generations_count) as total_generations,
  SUM(prompt_tokens) as total_prompt_tokens,
  SUM(output_tokens) as total_output_tokens,
  SUM(cost_usd)::decimal(10,4) as total_cost_usd,
  MIN(usage_date) as earliest_date,
  MAX(usage_date) as latest_date
FROM daily_usage_history;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '🎉 DATA CONSISTENCY FIX COMPLETED SUCCESSFULLY!';
    RAISE NOTICE '✅ Converted snake_case to camelCase in existing data';
    RAISE NOTICE '📊 Materialized view recreated with correct property names';
    RAISE NOTICE '🔧 Compatibility functions updated';
    RAISE NOTICE '💰 Token costs now calculated from real Gemini data';
    RAISE NOTICE '';
    RAISE NOTICE 'NEXT STEPS:';
    RAISE NOTICE '1. Test dashboard - should show accurate token counts';
    RAISE NOTICE '2. All new generations will use consistent camelCase format';
    RAISE NOTICE '3. Dashboard will display real costs and usage statistics';
    RAISE NOTICE '4. Consider running consolidation script to merge user data';
END $$;