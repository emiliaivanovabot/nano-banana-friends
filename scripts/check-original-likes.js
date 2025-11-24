#!/usr/bin/env node

/**
 * Check if original likes data exists in bananaprompts.db
 */

import Database from 'better-sqlite3'

const db = new Database('/Users/bertanyalcintepe/Desktop/bananaprompts/data/prompts.db', { readonly: true })

console.log('🔍 Checking original likes data...')

// Check table structure
const tableInfo = db.prepare("PRAGMA table_info(prompts)").all()
console.log('\n📊 Original table columns:')
tableInfo.forEach(col => {
  console.log(`  - ${col.name}: ${col.type}`)
})

// Sample some data
const samples = db.prepare("SELECT * FROM prompts LIMIT 5").all()
console.log('\n📋 Sample original data:')
samples.forEach((row, i) => {
  console.log(`${i + 1}. ${row.title}`)
  if (row.likes !== undefined) {
    console.log(`   Likes: ${row.likes}`)
  }
  if (row.views !== undefined) {
    console.log(`   Views: ${row.views}`)
  }
  if (row.downloads !== undefined) {
    console.log(`   Downloads: ${row.downloads}`)
  }
  console.log()
})

// Check if likes column exists and what values look like
const likesCheck = db.prepare("SELECT title, likes FROM prompts WHERE likes IS NOT NULL LIMIT 10").all()
console.log('\n👍 Original likes data:')
if (likesCheck.length > 0) {
  likesCheck.forEach(row => {
    console.log(`  ${row.title}: ${row.likes} likes`)
  })
} else {
  console.log('  ❌ No likes data found in original database')
}

db.close()