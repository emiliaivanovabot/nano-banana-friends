#!/usr/bin/env node

/**
 * BACKUP NO_CHANGE PROMPTS
 * 
 * Creates a backup of the current state before attribute removal
 */

import { createClient } from '@supabase/supabase-js'
import { writeFileSync } from 'fs'
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

async function backupNoChangePrompts() {
  console.log('💾 Creating backup of NO_CHANGE prompts...')
  
  const { data: prompts, error } = await supabase
    .from('community_prompts')
    .select('*')
    .or('title.eq.NO_CHANGE,prompt.eq.NO_CHANGE,title.ilike.%NO_CHANGE%,prompt.ilike.%NO_CHANGE%')
  
  if (error) {
    console.error('❌ Error:', error.message)
    return
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupFile = `backup/no-change-prompts-${timestamp}.json`
  
  const backup = {
    timestamp: new Date().toISOString(),
    description: 'Backup before attribute removal',
    promptCount: prompts.length,
    prompts: prompts
  }
  
  try {
    writeFileSync(backupFile, JSON.stringify(backup, null, 2))
    console.log(`✅ Backup created: ${backupFile}`)
    console.log(`📊 Backed up ${prompts.length} prompts`)
    
    // Also create a quick reference file
    const summaryFile = `backup/no-change-summary-${timestamp}.txt`
    let summary = `NO_CHANGE PROMPTS BACKUP SUMMARY\n`
    summary += `Created: ${new Date().toISOString()}\n`
    summary += `Total prompts: ${prompts.length}\n\n`
    
    prompts.forEach(prompt => {
      summary += `ID ${prompt.id}: ${prompt.title}\n`
      summary += `Prompt length: ${prompt.prompt.length} chars\n`
      summary += `Created: ${prompt.created_at}\n`
      summary += '---\n'
    })
    
    writeFileSync(summaryFile, summary)
    console.log(`📋 Summary created: ${summaryFile}`)
    
    return backupFile
  } catch (error) {
    console.error('❌ Backup failed:', error.message)
    throw error
  }
}

// Restore function
async function restoreFromBackup(backupFile) {
  console.log(`🔄 Restoring from backup: ${backupFile}`)
  
  try {
    const backupData = JSON.parse(readFileSync(backupFile, 'utf8'))
    
    console.log(`📋 Backup contains ${backupData.prompts.length} prompts`)
    console.log(`📅 Created: ${backupData.timestamp}`)
    
    let restored = 0
    
    for (const prompt of backupData.prompts) {
      const { error } = await supabase
        .from('community_prompts')
        .update({
          title: prompt.title,
          prompt: prompt.prompt
        })
        .eq('id', prompt.id)
      
      if (error) {
        console.error(`❌ Failed to restore ID ${prompt.id}:`, error.message)
      } else {
        restored++
      }
    }
    
    console.log(`✅ Restored ${restored}/${backupData.prompts.length} prompts`)
    
  } catch (error) {
    console.error('❌ Restore failed:', error.message)
    throw error
  }
}

// Command line handling
const args = process.argv.slice(2)
const command = args[0]
const backupFile = args[1]

if (command === 'restore' && backupFile) {
  restoreFromBackup(backupFile)
    .then(() => console.log('✅ Restore complete'))
    .catch(error => console.error('❌ Restore failed:', error))
} else {
  backupNoChangePrompts()
    .then(() => console.log('✅ Backup complete'))
    .catch(error => console.error('❌ Backup failed:', error))
}