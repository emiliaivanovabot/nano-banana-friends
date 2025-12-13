// Main exports for @repo/database package
// Extracted Supabase configuration from monolith

export { getSupabaseClient, supabase } from './client'
export { getSupabaseAdmin, supabaseAdmin } from './server'

// Re-export types from Supabase for convenience
export type { SupabaseClient } from '@supabase/supabase-js'