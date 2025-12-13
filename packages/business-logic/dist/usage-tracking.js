/**
 * Usage Tracking Utilities for daily_usage_history table
 * Extracted from monolith to @repo/business-logic package
 */
import { getSupabaseClient } from '@repo/database';
/**
 * Update daily usage statistics
 */
export const updateDailyUsage = async ({ userId, resolution, generationCount, generationTimeSeconds, promptTokens = 0, outputTokens = 0, costUsd = 0 }) => {
    try {
        const supabase = getSupabaseClient();
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
        // First, try to get existing record for today
        const { data: existingRecord, error: fetchError } = await supabase
            .from('daily_usage_history')
            .select('*')
            .eq('user_id', userId)
            .eq('usage_date', today)
            .single();
        if (fetchError && fetchError.code !== 'PGRST116') {
            // Error other than "not found"
            throw fetchError;
        }
        // Determine resolution column
        const resolutionColumn = resolution === '1K' ? 'count_1k' :
            resolution === '2K' ? 'count_2k' : 'count_4k';
        if (existingRecord) {
            // Update existing record
            const { data, error } = await supabase
                .from('daily_usage_history')
                .update({
                cost_usd: (parseFloat(existingRecord.cost_usd) || 0) + costUsd,
                generations_count: (existingRecord.generations_count || 0) + generationCount,
                generation_time_seconds: (existingRecord.generation_time_seconds || 0) + generationTimeSeconds,
                [resolutionColumn]: (existingRecord[resolutionColumn] || 0) + generationCount,
                prompt_tokens: (existingRecord.prompt_tokens || 0) + promptTokens,
                output_tokens: (existingRecord.output_tokens || 0) + outputTokens
            })
                .eq('id', existingRecord.id)
                .select();
            if (error)
                throw error;
            console.log('✅ Daily usage updated:', {
                userId,
                date: today,
                totalGenerations: (existingRecord.generations_count || 0) + generationCount,
                totalTime: (existingRecord.generation_time_seconds || 0) + generationTimeSeconds
            });
            return { success: true, data: data[0], updated: true };
        }
        else {
            // Create new record
            const newRecord = {
                user_id: userId,
                usage_date: today,
                cost_usd: costUsd,
                generations_count: generationCount,
                generation_time_seconds: generationTimeSeconds,
                count_1k: resolution === '1K' ? generationCount : 0,
                count_2k: resolution === '2K' ? generationCount : 0,
                count_4k: resolution === '4K' ? generationCount : 0,
                prompt_tokens: promptTokens,
                output_tokens: outputTokens,
                errors_count: 0
            };
            const { data, error } = await supabase
                .from('daily_usage_history')
                .insert([newRecord])
                .select();
            if (error)
                throw error;
            console.log('✅ Daily usage created:', {
                userId,
                date: today,
                generations: generationCount,
                time: generationTimeSeconds,
                resolution
            });
            return { success: true, data: data[0], updated: false };
        }
    }
    catch (error) {
        console.error('❌ Failed to update daily usage:', error);
        return { success: false, error: error.message };
    }
};
/**
 * Increment error count for today
 */
export const incrementErrorCount = async (username) => {
    try {
        const supabase = getSupabaseClient();
        const today = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase
            .rpc('increment_error_count', {
            p_username: username,
            p_date: today
        });
        if (error)
            throw error;
        console.log('⚠️ Error count incremented for:', username);
        return { success: true };
    }
    catch (error) {
        console.error('❌ Failed to increment error count:', error);
        return { success: false, error: error.message };
    }
};
/**
 * Get daily usage stats for a user using materialized view
 */
export const getDailyUsageHistory = async (userId, days = 30) => {
    try {
        const supabase = getSupabaseClient();
        console.log('🔄 Querying materialized view for user_id:', userId);
        // Call the compatibility function that refreshes and returns data
        const { data, error } = await supabase
            .rpc('get_daily_usage_by_user', {
            p_user_id: userId,
            p_days: days
        });
        if (error)
            throw error;
        console.log('📊 Materialized view returned:', data?.length, 'daily records');
        return { success: true, data: data || [] };
    }
    catch (error) {
        console.error('❌ Failed to get usage history from materialized view:', error);
        // Fallback: try direct materialized view query
        try {
            const supabase = getSupabaseClient();
            console.log('🔄 Trying direct materialized view fallback...');
            const { data: fallbackData, error: fallbackError } = await supabase
                .from('daily_usage_history')
                .select('*')
                .eq('user_id', userId)
                .order('usage_date', { ascending: false })
                .limit(days);
            if (fallbackError)
                throw fallbackError;
            console.log('✅ Fallback successful, got:', fallbackData?.length, 'records');
            console.log('🔍 First record sample:', fallbackData?.[0]);
            // Fix null usage_date by using today's date for records with null dates
            const fixedData = fallbackData?.map(record => ({
                ...record,
                usage_date: record.usage_date || new Date().toISOString().split('T')[0]
            })) || [];
            console.log('🔧 Fixed data with usage_date:', fixedData[0]);
            return { success: true, data: fixedData };
        }
        catch (fallbackError) {
            console.error('❌ Fallback also failed:', fallbackError);
            return { success: false, error: fallbackError.message, data: [] };
        }
    }
};
/**
 * Get top aspect ratios used by user
 */
export const getTopAspectRatios = async (userId, days = 30, limit = 2) => {
    try {
        const supabase = getSupabaseClient();
        let dateLimit;
        if (days === 1) {
            // For "today", start from beginning of today (00:00)
            dateLimit = new Date();
            dateLimit.setHours(0, 0, 0, 0);
        }
        else if (days === 7) {
            // For "this week", start from beginning of this week (Monday 00:00)
            dateLimit = new Date();
            const dayOfWeek = dateLimit.getDay(); // 0 = Sunday, 1 = Monday, etc.
            const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Calculate days back to Monday
            dateLimit.setDate(dateLimit.getDate() - daysToMonday);
            dateLimit.setHours(0, 0, 0, 0);
        }
        else {
            // For other periods, use days back from now
            dateLimit = new Date();
            dateLimit.setDate(dateLimit.getDate() - days);
        }
        console.log('🔍 Querying aspect ratios for user_id:', userId);
        console.log('🔍 Date filter - looking for generations after:', dateLimit.toISOString());
        const { data: aspectRatios, error } = await supabase
            .from('generations')
            .select('aspect_ratio')
            .eq('user_id', userId)
            .eq('status', 'completed')
            .gte('created_at', dateLimit.toISOString());
        if (error)
            throw error;
        console.log('🔍 Raw aspect ratio data:', aspectRatios);
        console.log('🔍 Found', aspectRatios?.length || 0, 'completed generations');
        // Count aspect ratio usage
        const ratioCount = {};
        aspectRatios.forEach(gen => {
            const ratio = gen.aspect_ratio || 'Unknown';
            console.log('🔍 Processing generation with aspect_ratio:', ratio);
            ratioCount[ratio] = (ratioCount[ratio] || 0) + 1;
        });
        console.log('🔍 Aspect ratio counts:', ratioCount);
        // Convert to array and sort by usage
        const sortedRatios = Object.entries(ratioCount)
            .map(([aspect_ratio, count]) => ({
            aspect_ratio,
            count,
            percentage: Math.round((count / aspectRatios.length) * 100)
        }))
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
        console.log('📊 Top aspect ratios:', sortedRatios);
        return { success: true, data: sortedRatios };
    }
    catch (error) {
        console.error('❌ Failed to get aspect ratios:', error);
        return { success: false, error: error.message, data: [] };
    }
};
/**
 * Get unified statistics combining daily_usage_history and generations tables
 * Returns real token counts from Gemini API instead of estimates
 */
export const getUnifiedGenerationStats = async (userId, days = 90) => {
    try {
        const supabase = getSupabaseClient();
        const dateLimit = new Date();
        dateLimit.setDate(dateLimit.getDate() - days);
        console.log('🔍 Querying generations for user_id:', userId);
        console.log('📅 Date limit:', dateLimit.toISOString());
        console.log('📊 Looking for records newer than:', dateLimit.toLocaleDateString());
        // Get completed generations with real token data
        const { data: generations, error: genError } = await supabase
            .from('generations')
            .select(`
        created_at,
        status,
        resolution,
        generation_time_seconds,
        gemini_metadata,
        user_id
      `)
            .eq('user_id', userId)
            .eq('status', 'completed')
            .gte('created_at', dateLimit.toISOString())
            .order('created_at', { ascending: false });
        console.log('📊 Raw generations query result:', {
            count: generations?.length || 0,
            error: genError,
            sample: generations?.[0]
        });
        if (genError)
            throw genError;
        // Process generations to extract real token data
        const processedData = {};
        generations.forEach(gen => {
            const date = gen.created_at.split('T')[0]; // YYYY-MM-DD
            if (!processedData[date]) {
                processedData[date] = {
                    user_id: userId,
                    usage_date: date,
                    generations_count: 0,
                    generation_time_seconds: 0,
                    prompt_tokens: 0,
                    output_tokens: 0,
                    count_1k: 0,
                    count_2k: 0,
                    count_4k: 0,
                    cost_usd: 0,
                    errors_count: 0
                };
            }
            // Count generations
            processedData[date].generations_count += 1;
            processedData[date].generation_time_seconds += gen.generation_time_seconds || 0;
            // Count by resolution  
            if (gen.resolution === '1K')
                processedData[date].count_1k += 1;
            else if (gen.resolution === '2K')
                processedData[date].count_2k += 1;
            else if (gen.resolution === '4K')
                processedData[date].count_4k += 1;
            // Extract real token data from Gemini metadata (FIXED: camelCase property names)
            const tokenData = gen.gemini_metadata?.usageMetadata || {};
            processedData[date].prompt_tokens += tokenData.promptTokenCount || 0;
            processedData[date].output_tokens += tokenData.candidatesTokenCount || 0;
        });
        // Calculate costs based on real token usage
        Object.values(processedData).forEach(dayData => {
            // Gemini 2.5 Flash Image pricing (example rates)
            const promptCostPer1K = 0.001; // $0.001 per 1K input tokens
            const outputCostPer1K = 0.002; // $0.002 per 1K output tokens
            const promptCost = (dayData.prompt_tokens / 1000) * promptCostPer1K;
            const outputCost = (dayData.output_tokens / 1000) * outputCostPer1K;
            dayData.cost_usd = promptCost + outputCost;
        });
        // Convert to array and sort by date
        const sortedData = Object.values(processedData)
            .sort((a, b) => new Date(b.usage_date).getTime() - new Date(a.usage_date).getTime());
        return { success: true, data: sortedData };
    }
    catch (error) {
        console.error('❌ Failed to get unified generation stats:', error);
        return { success: false, error: error.message, data: [] };
    }
};
