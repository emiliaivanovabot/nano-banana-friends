/**
 * Usage Tracking Utilities for daily_usage_history table
 */

import { supabase } from '../lib/supabase'

/**
 * Update daily usage statistics
 * @param {string} username - Username (e.g., 'emilia.ivanova')
 * @param {string} resolution - '1K', '2K', or '4K'
 * @param {number} generationCount - Number of images generated (1, 4, or 10)
 * @param {number} generationTimeSeconds - Total generation time in seconds
 * @param {number} promptTokens - Input tokens used (optional)
 * @param {number} outputTokens - Output tokens used (optional)
 * @param {number} costUsd - Cost in USD (optional)
 * @returns {Promise<Object>} Update result
 */
export const updateDailyUsage = async (
  username, 
  resolution, 
  generationCount, 
  generationTimeSeconds, 
  promptTokens = 0, 
  outputTokens = 0, 
  costUsd = 0
) => {
  try {
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
    
    // First, try to get existing record for today
    const { data: existingRecord, error: fetchError } = await supabase
      .from('daily_usage_history')
      .select('*')
      .eq('username', username)
      .eq('usage_date', today)
      .single()
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      // Error other than "not found"
      throw fetchError
    }
    
    // Determine resolution column
    const resolutionColumn = resolution === '1K' ? 'count_1k' : 
                            resolution === '2K' ? 'count_2k' : 'count_4k'
    
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
        .select()
      
      if (error) throw error
      
      console.log('✅ Daily usage updated:', {
        username,
        date: today,
        totalGenerations: (existingRecord.generations_count || 0) + generationCount,
        totalTime: (existingRecord.generation_time_seconds || 0) + generationTimeSeconds
      })
      
      return { success: true, data: data[0], updated: true }
      
    } else {
      // Create new record
      const newRecord = {
        username: username,
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
      }
      
      const { data, error } = await supabase
        .from('daily_usage_history')
        .insert([newRecord])
        .select()
      
      if (error) throw error
      
      console.log('✅ Daily usage created:', {
        username,
        date: today,
        generations: generationCount,
        time: generationTimeSeconds,
        resolution
      })
      
      return { success: true, data: data[0], updated: false }
    }
    
  } catch (error) {
    console.error('❌ Failed to update daily usage:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Increment error count for today
 * @param {string} username - Username
 * @returns {Promise<Object>} Update result
 */
export const incrementErrorCount = async (username) => {
  try {
    const today = new Date().toISOString().split('T')[0]
    
    const { data, error } = await supabase
      .rpc('increment_error_count', {
        p_username: username,
        p_date: today
      })
    
    if (error) throw error
    
    console.log('⚠️ Error count incremented for:', username)
    return { success: true }
    
  } catch (error) {
    console.error('❌ Failed to increment error count:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get daily usage stats for a user
 * @param {string} username - Username
 * @param {number} days - Number of days to fetch (default 30)
 * @returns {Promise<Array>} Usage history
 */
export const getDailyUsageHistory = async (username, days = 30) => {
  try {
    const { data, error } = await supabase
      .from('daily_usage_history')
      .select('*')
      .eq('username', username)
      .order('usage_date', { ascending: false })
      .limit(days)
    
    if (error) throw error
    
    return { success: true, data: data || [] }
    
  } catch (error) {
    console.error('❌ Failed to get usage history:', error)
    return { success: false, error: error.message, data: [] }
  }
}