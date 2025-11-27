-- ==============================================
-- FIX TOKEN EXTRACTION IN MATERIALIZED VIEW
-- ==============================================
-- The JSON path was wrong - using 'usageMetadata' instead of 'usage_metadata'

-- DROP AND RECREATE WITH CORRECT JSON PATHS
DROP MATERIALIZED VIEW IF EXISTS daily_usage_history CASCADE;

CREATE MATERIALIZED VIEW daily_usage_history AS
SELECT 
  gen_random_uuid() as id,
  user_id,
  DATE(created_at) as usage_date,
  
  -- FIXED: Real costs based on Gemini token data (correct JSON paths!)
  COALESCE(
    SUM(
      (COALESCE((gemini_metadata->'usage_metadata'->>'promptTokenCount')::integer, 0) * 0.001 / 1000) +
      (COALESCE((gemini_metadata->'usage_metadata'->>'candidatesTokenCount')::integer, 0) * 0.002 / 1000)
    ), 0
  )::decimal(10,4) as cost_usd,
  
  -- Generation counts and timing
  COUNT(*)::integer as generations_count,
  COALESCE(SUM(generation_time_seconds), 0)::integer as generation_time_seconds,
  
  -- Resolution tracking (actual usage, not user defaults!)
  COUNT(*) FILTER (WHERE resolution = '1K')::integer as count_1k,
  COUNT(*) FILTER (WHERE resolution = '2K')::integer as count_2k,  
  COUNT(*) FILTER (WHERE resolution = '4K')::integer as count_4k,
  
  -- Legacy columns for backward compatibility
  COUNT(*) FILTER (WHERE resolution = '2K' AND aspect_ratio = '9:16')::integer as count_2k_9_16,
  COUNT(*) FILTER (WHERE resolution = '2K' AND aspect_ratio = '4:3')::integer as count_2k_4_3,
  COUNT(*) FILTER (WHERE resolution = '4K' AND aspect_ratio = '9:16')::integer as count_4k_9_16,
  COUNT(*) FILTER (WHERE resolution = '4K' AND aspect_ratio = '4:3')::integer as count_4k_4_3,
  
  -- FIXED: Real token counts from Gemini API (correct JSON paths!)
  COALESCE(SUM((gemini_metadata->'usage_metadata'->>'promptTokenCount')::integer), 0)::integer as prompt_tokens,
  COALESCE(SUM((gemini_metadata->'usage_metadata'->>'candidatesTokenCount')::integer), 0)::integer as output_tokens,
  COALESCE(SUM((gemini_metadata->'usage_metadata'->>'totalTokenCount')::integer), 0)::integer as total_tokens,
  
  -- Error tracking (generations table only stores completed/failed)
  COUNT(*) FILTER (WHERE status = 'failed')::integer as errors_count,
  
  -- Analytics fields  
  EXTRACT(HOUR FROM MAX(created_at))::integer as peak_usage_hour,
  '[]'::jsonb as most_used_prompts,  
  
  -- Timestamps
  NOW() as created_at
  
FROM generations 
WHERE status IN ('completed', 'failed')
  AND created_at IS NOT NULL
  AND user_id IS NOT NULL
GROUP BY user_id, DATE(created_at);

-- Recreate indexes
CREATE INDEX idx_daily_usage_mv_user_date ON daily_usage_history(user_id, usage_date DESC);
CREATE INDEX idx_daily_usage_mv_date ON daily_usage_history(usage_date DESC);
CREATE INDEX idx_daily_usage_mv_user ON daily_usage_history(user_id);

-- Test token extraction with sample record
SELECT 
  'Token Extraction Test' as test_type,
  gemini_metadata->'usage_metadata'->>'promptTokenCount' as prompt_tokens_raw,
  gemini_metadata->'usage_metadata'->>'candidatesTokenCount' as output_tokens_raw,
  gemini_metadata->'usage_metadata'->>'totalTokenCount' as total_tokens_raw,
  (gemini_metadata->'usage_metadata'->>'promptTokenCount')::integer as prompt_tokens_int,
  (gemini_metadata->'usage_metadata'->>'candidatesTokenCount')::integer as output_tokens_int,
  (gemini_metadata->'usage_metadata'->>'totalTokenCount')::integer as total_tokens_int
FROM generations 
WHERE gemini_metadata IS NOT NULL 
  AND gemini_metadata->'usage_metadata' IS NOT NULL
LIMIT 1;

-- Verify materialized view now shows tokens
SELECT 
  'Fixed Token Check' as status,
  usage_date,
  generations_count,
  prompt_tokens,
  output_tokens,
  total_tokens,
  cost_usd
FROM daily_usage_history
WHERE usage_date >= CURRENT_DATE - INTERVAL '2 days'
ORDER BY usage_date DESC;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '🔧 TOKEN EXTRACTION PATHS FIXED!';
    RAISE NOTICE '✅ Changed usageMetadata → usage_metadata';
    RAISE NOTICE '📊 Materialized view now extracts real tokens';
    RAISE NOTICE '🚀 Dashboard should show actual token usage!';
END $$;