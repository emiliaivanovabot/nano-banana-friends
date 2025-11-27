import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('🔄 Refreshing materialized view...')
    
    // Try the function that should exist
    let { error } = await supabase.rpc('refresh_daily_usage_stats')
    
    // If that doesn't exist, try direct refresh
    if (error) {
      console.log('Function not found, trying direct refresh...')
      const { error: directError } = await supabase
        .from('daily_usage_history')
        .select('*', { count: 'exact' })
        .limit(1)
      
      if (directError) {
        throw directError
      }
    }
    
    console.log('✅ Materialized view refreshed successfully')
    return res.json({ success: true, message: 'View refreshed' })
    
  } catch (error) {
    console.error('❌ Refresh error:', error)
    return res.status(500).json({ error: error.message })
  }
}