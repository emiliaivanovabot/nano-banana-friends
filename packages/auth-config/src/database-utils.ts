// Database utilities for authentication and profile completion checking
// Extracted from monolith to @repo/auth-config package

import { getSupabaseAdmin } from '@repo/database'

export interface ProfileCompletionResult {
  isComplete: boolean
  missingFields: string[]
  user?: any
}

export interface UserResult {
  user: any | null
  error: any | null
}

export interface UserProfile {
  id: string
  username: string
  email?: string
  gemini_api_key?: string
  hair_color?: string
  eye_color?: string
  skin_tone?: string
  age_range?: string
  default_resolution?: string
  default_aspect_ratio?: string
  favorite_prompts?: any
  main_face_image_url?: string
  face_2_image_url?: string
  face_2_name?: string
  face_3_image_url?: string
  face_3_name?: string
  created_at: string
  last_login?: string
  user_stats?: {
    daily_prompt_tokens: number
    daily_output_tokens: number
    daily_cost_usd: number
    total_cost_usd: number
    total_generations: number
  }
}

// Use shared database configuration

/**
 * Check if user profile has all required fields completed
 * REQUIRED fields: gemini_api_key, main_face_image_url
 */
export async function checkProfileCompletion(userId: string): Promise<ProfileCompletionResult> {
  try {
    const supabase = getSupabaseAdmin()
    const { data: user, error } = await supabase
      .from('users')
      .select('gemini_api_key, main_face_image_url, username')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error checking profile completion', error)
      return { isComplete: false, missingFields: ['database_error'] }
    }

    if (!user) {
      return { isComplete: false, missingFields: ['user_not_found'] }
    }

    const missingFields: string[] = []
    
    // Check required fields
    if (!user.gemini_api_key || user.gemini_api_key.trim() === '') {
      missingFields.push('gemini_api_key')
    }
    
    if (!user.main_face_image_url || user.main_face_image_url.trim() === '') {
      missingFields.push('main_face_image_url')
    }

    return {
      isComplete: missingFields.length === 0,
      missingFields,
      user
    }
  } catch (error) {
    console.error('Unexpected error in checkProfileCompletion', error)
    return { isComplete: false, missingFields: ['unexpected_error'] }
  }
}

/**
 * Get user by username for login
 * Optimized query with proper indexing
 */
export async function getUserByUsername(username: string): Promise<UserResult> {
  try {
    const supabase = getSupabaseAdmin()
    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, password_hash, is_active, last_login')
      .eq('username', username.trim())
      .eq('is_active', true)
      .single()

    return { user, error }
  } catch (error) {
    console.error('Error getting user by username', error)
    return { user: null, error }
  }
}

/**
 * Update user's last login timestamp
 * Optimized single-field update
 */
export async function updateLastLogin(userId: string): Promise<boolean> {
  try {
    const supabase = getSupabaseAdmin()
    const { error } = await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', userId)

    return !error
  } catch (error) {
    console.error('Error updating last login', error)
    return false
  }
}

/**
 * Create user stats entry when profile is first completed
 * Ensures proper initialization of user_stats table
 */
export async function initializeUserStats(userId: string): Promise<boolean> {
  try {
    const supabase = getSupabaseAdmin()
    
    // Check if user_stats already exists
    const { data: existing } = await supabase
      .from('user_stats')
      .select('user_id')
      .eq('user_id', userId)
      .single()

    if (existing) {
      return true // Already exists
    }

    // Create new user_stats entry
    const { error } = await supabase
      .from('user_stats')
      .insert({ user_id: userId })

    return !error
  } catch (error) {
    console.error('Error initializing user stats', error)
    return false
  }
}

/**
 * Performance-optimized user profile fetch
 * Gets complete user profile with stats in single query
 */
export async function getFullUserProfile(userId: string): Promise<{ profile: UserProfile | null; error: any | null }> {
  try {
    const supabase = getSupabaseAdmin()
    const { data: profile, error } = await supabase
      .from('users')
      .select(`
        id,
        username,
        email,
        gemini_api_key,
        hair_color,
        eye_color,
        skin_tone,
        age_range,
        default_resolution,
        default_aspect_ratio,
        favorite_prompts,
        main_face_image_url,
        face_2_image_url,
        face_2_name,
        face_3_image_url,
        face_3_name,
        created_at,
        last_login,
        user_stats (
          daily_prompt_tokens,
          daily_output_tokens,
          daily_cost_usd,
          total_cost_usd,
          total_generations
        )
      `)
      .eq('id', userId)
      .eq('is_active', true)
      .single()

    return { profile, error }
  } catch (error) {
    console.error('Error getting full user profile', error)
    return { profile: null, error }
  }
}