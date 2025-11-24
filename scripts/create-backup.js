#!/usr/bin/env node

/**
 * BACKUP: Create backup of community_prompts before cleanup
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
dotenv.config()

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing environment variables!')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function createBackup() {
  console.log('🔒 Creating backup of community_prompts...')
  
  const { data: prompts, error } = await supabase
    .from('community_prompts')
    .select('*')
    .order('id')
  
  if (error) {
    console.error('❌ Backup failed:', error.message)
    process.exit(1)
  }
  
  const backup = {
    timestamp: new Date().toISOString(),
    totalPrompts: prompts?.length || 0,
    prompts: prompts || []
  }
  
  const filename = `backup-community-prompts-${new Date().toISOString().split('T')[0]}.json`
  fs.writeFileSync(filename, JSON.stringify(backup, null, 2))
  
  console.log(`✅ Backup created: ${filename}`)
  console.log(`📊 Backed up prompts: ${backup.totalPrompts}`)
  
  return filename
}

createBackup()
  .then(filename => console.log(`🎉 Backup complete: ${filename}`))
  .catch(error => console.error('❌ Backup failed:', error))