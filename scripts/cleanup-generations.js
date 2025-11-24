#!/usr/bin/env node

// ==============================================
// GENERATION CLEANUP SCRIPT
// ==============================================
// Automated cleanup for old generations (30-day retention)
// Can be run as cron job or scheduled task

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
)

const cleanup = async () => {
  try {
    console.log('🧹 Starting generation cleanup...')
    
    // Calculate cutoff date (30 days ago)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - 30)
    
    console.log(`📅 Removing generations older than ${cutoffDate.toISOString()}`)
    
    // Get count of generations to be deleted
    const { count: totalCount, error: countError } = await supabase
      .from('generations')
      .select('*', { count: 'exact', head: true })
      .lt('created_at', cutoffDate.toISOString())
    
    if (countError) {
      console.error('❌ Error counting generations:', countError)
      return
    }
    
    if (totalCount === 0) {
      console.log('✅ No generations to clean up')
      return
    }
    
    console.log(`🗑️ Found ${totalCount} generations to clean up`)
    
    // Delete old generations
    const { error: deleteError } = await supabase
      .from('generations')
      .delete()
      .lt('created_at', cutoffDate.toISOString())
    
    if (deleteError) {
      console.error('❌ Error deleting generations:', deleteError)
      return
    }
    
    console.log(`✅ Successfully cleaned up ${totalCount} old generations`)
    
    // Get current stats
    const { count: remainingCount, error: statsError } = await supabase
      .from('generations')
      .select('*', { count: 'exact', head: true })
    
    if (!statsError) {
      console.log(`📊 ${remainingCount} generations remaining in database`)
    }
    
  } catch (error) {
    console.error('❌ Cleanup script error:', error)
    process.exit(1)
  }
}

const getGenerationStats = async () => {
  try {
    console.log('\n📊 Generation Statistics:')
    
    // Overall stats
    const { data: stats, error: statsError } = await supabase
      .from('generations')
      .select('status')
    
    if (statsError) {
      console.error('Error getting stats:', statsError)
      return
    }
    
    const statusCounts = stats.reduce((acc, gen) => {
      acc[gen.status] = (acc[gen.status] || 0) + 1
      return acc
    }, {})
    
    console.log('  Total generations:', stats.length)
    console.log('  Processing:', statusCounts.processing || 0)
    console.log('  Completed:', statusCounts.completed || 0)
    console.log('  Failed:', statusCounts.failed || 0)
    
    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const { count: recentCount, error: recentError } = await supabase
      .from('generations')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString())
    
    if (!recentError) {
      console.log('  Last 7 days:', recentCount)
    }
    
    // Stuck processing (over 1 hour old)
    const oneHourAgo = new Date()
    oneHourAgo.setHours(oneHourAgo.getHours() - 1)
    
    const { count: stuckCount, error: stuckError } = await supabase
      .from('generations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'processing')
      .lt('created_at', oneHourAgo.toISOString())
    
    if (!stuckError && stuckCount > 0) {
      console.log(`⚠️  Potentially stuck generations: ${stuckCount}`)
    }
    
  } catch (error) {
    console.error('Error getting stats:', error)
  }
}

const fixStuckGenerations = async () => {
  try {
    console.log('\n🔧 Checking for stuck generations...')
    
    // Find generations that have been processing for over 1 hour
    const oneHourAgo = new Date()
    oneHourAgo.setHours(oneHourAgo.getHours() - 1)
    
    const { data: stuckGenerations, error: findError } = await supabase
      .from('generations')
      .select('*')
      .eq('status', 'processing')
      .lt('created_at', oneHourAgo.toISOString())
    
    if (findError) {
      console.error('Error finding stuck generations:', findError)
      return
    }
    
    if (stuckGenerations.length === 0) {
      console.log('✅ No stuck generations found')
      return
    }
    
    console.log(`🔧 Found ${stuckGenerations.length} stuck generations`)
    
    // Mark them as failed
    const { error: updateError } = await supabase
      .from('generations')
      .update({
        status: 'failed',
        error_message: 'Generation timed out (over 1 hour)',
        completed_at: new Date().toISOString()
      })
      .eq('status', 'processing')
      .lt('created_at', oneHourAgo.toISOString())
    
    if (updateError) {
      console.error('Error updating stuck generations:', updateError)
      return
    }
    
    console.log(`✅ Marked ${stuckGenerations.length} stuck generations as failed`)
    
  } catch (error) {
    console.error('Error fixing stuck generations:', error)
  }
}

const main = async () => {
  console.log('🍌 Nano Banana Generation Cleanup Utility')
  console.log('==========================================')
  
  const action = process.argv[2] || 'cleanup'
  
  switch (action) {
    case 'cleanup':
      await cleanup()
      break
    case 'stats':
      await getGenerationStats()
      break
    case 'fix-stuck':
      await fixStuckGenerations()
      break
    case 'all':
      await getGenerationStats()
      await fixStuckGenerations()
      await cleanup()
      break
    default:
      console.log('Usage: node cleanup-generations.js [cleanup|stats|fix-stuck|all]')
      console.log('  cleanup    - Remove generations older than 30 days (default)')
      console.log('  stats      - Show generation statistics')
      console.log('  fix-stuck  - Mark stuck processing generations as failed')
      console.log('  all        - Run stats, fix stuck, then cleanup')
      process.exit(1)
  }
}

// Run the script
main().catch(error => {
  console.error('Script error:', error)
  process.exit(1)
})