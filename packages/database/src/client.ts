// Client-side Supabase client for browser operations
// Extracted from monolith to @repo/database package

import { createClient } from '@supabase/supabase-js'

// Environment configuration for client-side
const getClientConfig = () => {
  // Support both Vite and Next.js environment variables
  const supabaseUrl = 
    (typeof window !== 'undefined' && (window as any).ENV?.VITE_SUPABASE_URL) ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL

  const supabaseAnonKey = 
    (typeof window !== 'undefined' && (window as any).ENV?.VITE_SUPABASE_ANON_KEY) ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Please check your .env file.')
  }

  return { supabaseUrl, supabaseAnonKey }
}

// Create Supabase client for client-side operations
let supabaseInstance: ReturnType<typeof createClient> | null = null

export const getSupabaseClient = () => {
  if (!supabaseInstance) {
    const { supabaseUrl, supabaseAnonKey } = getClientConfig()
    
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false, // We handle our own session management
        autoRefreshToken: false
      }
    })
  }
  
  return supabaseInstance
}

// Export instance for backward compatibility
export const supabase = getSupabaseClient()

export default supabase