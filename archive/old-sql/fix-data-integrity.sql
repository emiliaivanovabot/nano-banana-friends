-- ==============================================
-- EMERGENCY DATA INTEGRITY FIX
-- ==============================================
-- Fix NULL created_at and user_id issues in generations table

-- 1. CHECK CURRENT DATA STATE
SELECT 
    'Data Integrity Check' as status,
    COUNT(*) as total_generations,
    COUNT(*) FILTER (WHERE created_at IS NULL) as null_created_at,
    COUNT(*) FILTER (WHERE user_id IS NULL) as null_user_id,
    COUNT(*) FILTER (WHERE created_at IS NOT NULL AND user_id IS NOT NULL) as valid_records
FROM generations;

-- 2. FIX NULL CREATED_AT TIMESTAMPS
-- Set missing timestamps to current time (or extract from id if UUID v1)
UPDATE generations 
SET created_at = NOW()
WHERE created_at IS NULL;

-- 3. FIX NULL USER_ID VALUES
-- You'll need to determine the correct user mapping
-- For now, let's see which users exist and recent activity patterns

SELECT 
    'User Analysis' as check_type,
    user_id,
    COUNT(*) as generation_count,
    MAX(created_at) as last_generation,
    MIN(created_at) as first_generation
FROM generations 
WHERE user_id IS NOT NULL
GROUP BY user_id
ORDER BY generation_count DESC;

-- 4. IDENTIFY RECENT NULL USER_ID RECORDS
SELECT 
    id,
    created_at,
    status,
    resolution,
    -- Add any prompt or metadata that might help identify user
    LEFT(prompt, 50) as prompt_preview
FROM generations 
WHERE user_id IS NULL 
ORDER BY created_at DESC NULLS LAST
LIMIT 10;

-- 5. REFRESH MATERIALIZED VIEW AFTER FIXES
REFRESH MATERIALIZED VIEW daily_usage_history;

-- 6. VERIFY MATERIALIZED VIEW NOW INCLUDES RECENT DATA
SELECT 
    'Fixed Materialized View Check' as status,
    COUNT(*) as total_daily_records,
    COUNT(DISTINCT user_id) as unique_users,
    MIN(usage_date) as earliest_date,
    MAX(usage_date) as latest_date,
    SUM(generations_count) as total_generations_in_view
FROM daily_usage_history
WHERE usage_date >= CURRENT_DATE - INTERVAL '7 days';