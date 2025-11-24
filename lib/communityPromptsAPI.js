/**
 * Community Prompts API Layer
 * Handles fetching and managing community prompts from Supabase
 */

import { supabase } from './supabase/client.js'

export class CommunityPromptsAPI {
  
  /**
   * Fetch all active community prompts
   * @param {Object} options - Query options
   * @param {string} options.category - Filter by category
   * @param {number} options.limit - Limit number of results
   * @param {string} options.sortBy - Sort field (likes, created_at)
   * @param {string} options.sortOrder - Sort order (asc, desc)
   * @returns {Promise<Array>} Array of community prompts
   */
  static async getPrompts({ category = null, limit = 50, sortBy = 'likes', sortOrder = 'desc' } = {}) {
    try {
      let query = supabase
        .from('community_prompts')
        .select('*')
        .eq('is_active', true)
      
      // Apply category filter
      if (category && category !== 'All') {
        query = query.eq('category', category)
      }
      
      // Apply sorting
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })
      
      // Apply limit
      if (limit > 0) {
        query = query.limit(limit)
      }
      
      const { data, error } = await query
      
      if (error) {
        console.error('Error fetching community prompts:', error)
        throw error
      }
      
      return data || []
      
    } catch (error) {
      console.error('API Error in getPrompts:', error)
      return []
    }
  }
  
  /**
   * Get available categories
   * @returns {Promise<Array>} Array of unique categories
   */
  static async getCategories() {
    try {
      const { data, error } = await supabase
        .from('community_prompts')
        .select('category')
        .eq('is_active', true)
      
      if (error) {
        console.error('Error fetching categories:', error)
        throw error
      }
      
      // Extract unique categories
      const categories = [...new Set(data.map(item => item.category))]
      return ['All', ...categories.sort()]
      
    } catch (error) {
      console.error('API Error in getCategories:', error)
      return ['All']
    }
  }
  
  /**
   * Get prompt by ID
   * @param {string} id - Prompt ID
   * @returns {Promise<Object|null>} Prompt object or null
   */
  static async getPromptById(id) {
    try {
      const { data, error } = await supabase
        .from('community_prompts')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single()
      
      if (error) {
        console.error('Error fetching prompt by ID:', error)
        return null
      }
      
      return data
      
    } catch (error) {
      console.error('API Error in getPromptById:', error)
      return null
    }
  }
  
  /**
   * Search prompts by text
   * @param {string} searchTerm - Search term
   * @param {Object} options - Additional options
   * @returns {Promise<Array>} Array of matching prompts
   */
  static async searchPrompts(searchTerm, { category = null, limit = 20 } = {}) {
    try {
      let query = supabase
        .from('community_prompts')
        .select('*')
        .eq('is_active', true)
        .or(`title.ilike.%${searchTerm}%,prompt.ilike.%${searchTerm}%`)
      
      if (category && category !== 'All') {
        query = query.eq('category', category)
      }
      
      query = query.order('likes', { ascending: false }).limit(limit)
      
      const { data, error } = await query
      
      if (error) {
        console.error('Error searching prompts:', error)
        throw error
      }
      
      return data || []
      
    } catch (error) {
      console.error('API Error in searchPrompts:', error)
      return []
    }
  }
  
  /**
   * Get popular prompts
   * @param {number} limit - Number of prompts to fetch
   * @returns {Promise<Array>} Array of popular prompts
   */
  static async getPopularPrompts(limit = 10) {
    return this.getPrompts({ 
      sortBy: 'likes', 
      sortOrder: 'desc', 
      limit 
    })
  }
  
  /**
   * Get recent prompts
   * @param {number} limit - Number of prompts to fetch
   * @returns {Promise<Array>} Array of recent prompts
   */
  static async getRecentPrompts(limit = 10) {
    return this.getPrompts({ 
      sortBy: 'created_at', 
      sortOrder: 'desc', 
      limit 
    })
  }
  
  /**
   * Get statistics about community prompts
   * @returns {Promise<Object>} Statistics object
   */
  static async getStats() {
    try {
      const { data, error } = await supabase
        .from('community_prompts')
        .select('category, likes')
        .eq('is_active', true)
      
      if (error) {
        console.error('Error fetching stats:', error)
        return {
          totalPrompts: 0,
          categories: 0,
          totalLikes: 0,
          averageLikes: 0
        }
      }
      
      const totalPrompts = data.length
      const categories = new Set(data.map(item => item.category)).size
      const totalLikes = data.reduce((sum, item) => sum + (item.likes || 0), 0)
      const averageLikes = totalPrompts > 0 ? Math.round(totalLikes / totalPrompts) : 0
      
      return {
        totalPrompts,
        categories,
        totalLikes,
        averageLikes
      }
      
    } catch (error) {
      console.error('API Error in getStats:', error)
      return {
        totalPrompts: 0,
        categories: 0,
        totalLikes: 0,
        averageLikes: 0
      }
    }
  }
  
  /**
   * Increment likes for a prompt (if user interaction is implemented later)
   * @param {string} id - Prompt ID
   * @returns {Promise<boolean>} Success status
   */
  static async likePrompt(id) {
    try {
      // First get current likes
      const { data: currentData, error: fetchError } = await supabase
        .from('community_prompts')
        .select('likes')
        .eq('id', id)
        .single()
      
      if (fetchError) {
        console.error('Error fetching current likes:', fetchError)
        return false
      }
      
      // Increment likes
      const newLikes = (currentData.likes || 0) + 1
      
      const { error: updateError } = await supabase
        .from('community_prompts')
        .update({ likes: newLikes })
        .eq('id', id)
      
      if (updateError) {
        console.error('Error updating likes:', updateError)
        return false
      }
      
      return true
      
    } catch (error) {
      console.error('API Error in likePrompt:', error)
      return false
    }
  }
}

export default CommunityPromptsAPI