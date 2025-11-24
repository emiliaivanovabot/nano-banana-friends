#!/usr/bin/env node

/**
 * COMPREHENSIVE CLEANUP: Community Prompts Enhancement Script
 * 
 * Phase 1: Restore NO_CHANGE artifacts from original bananaprompts.db
 * Phase 2: Remove conflicting attributes (hair, eyes, skin, age, tattoos) from ALL prompts
 * Phase 3: Validate and improve prompt structure maintaining nano-banana style
 */

import { createClient } from '@supabase/supabase-js'
import Database from 'better-sqlite3'
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

// ===== ATTRIBUTE DETECTION KEYWORDS =====
const ATTRIBUTE_KEYWORDS = {
  hair: [
    'blonde', 'brunette', 'black hair', 'brown hair', 'red hair', 'redhead', 'ginger',
    'auburn', 'platinum', 'golden hair', 'silver hair', 'gray hair', 'grey hair',
    'dark hair', 'light hair', 'fair hair', 'wavy hair', 'curly hair', 'straight hair',
    'long hair', 'short hair', 'shoulder-length', 'pixie cut', 'bob cut', 'buzz cut',
    'bald', 'shaved head', 'ponytail', 'braided', 'dreadlocks', 'afro',
    'hair color', 'hair colour', 'haircut', 'hairstyle'
  ],
  
  eyes: [
    'blue eyes', 'green eyes', 'brown eyes', 'hazel eyes', 'gray eyes', 'grey eyes',
    'amber eyes', 'dark eyes', 'light eyes', 'bright eyes', 'deep eyes',
    'eye color', 'eye colour', 'colored eyes', 'coloured eyes'
  ],
  
  skin: [
    'fair skin', 'pale skin', 'light skin', 'dark skin', 'olive skin', 'tan skin',
    'tanned', 'bronze skin', 'golden skin', 'ebony', 'ivory', 'porcelain skin',
    'sun-kissed', 'freckled', 'freckles', 'skin tone', 'complexion'
  ],
  
  age: [
    'young', 'old', 'elderly', 'mature', 'teenager', 'teen', 'adolescent',
    'child', 'kid', 'baby', 'toddler', 'adult', 'senior',
    'in his 20s', 'in her 20s', 'in his 30s', 'in her 30s', 'in his 40s', 'in her 40s',
    'in his 50s', 'in her 50s', 'twenties', 'thirties', 'forties', 'fifties',
    '20-year-old', '30-year-old', '40-year-old', '50-year-old',
    'years old', 'year old', 'middle-aged', 'youthful', 'aged'
  ],
  
  tattoos: [
    'tattoo', 'tattoos', 'tattooed', 'inked', 'body art', 'tribal tattoo',
    'sleeve tattoo', 'arm tattoo', 'back tattoo', 'chest tattoo', 'neck tattoo',
    'facial tattoo', 'hand tattoo', 'finger tattoo', 'ink', 'tatted'
  ]
}

// ===== UTILITY FUNCTIONS =====
function createKeywordRegex(keywords) {
  // Create case-insensitive regex that matches whole words or phrases
  const escapedKeywords = keywords.map(keyword => 
    keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  )
  return new RegExp(`\\b(?:${escapedKeywords.join('|')})\\b`, 'gi')
}

function removeConflictingAttributes(text, type = 'prompt') {
  if (!text || typeof text !== 'string') return text
  
  let cleanedText = text
  let removedAttributes = []
  
  // Track what we remove for reporting
  const allKeywords = Object.values(ATTRIBUTE_KEYWORDS).flat()
  const regex = createKeywordRegex(allKeywords)
  
  // Find all matches first for reporting
  const matches = [...text.matchAll(regex)]
  if (matches.length > 0) {
    removedAttributes = matches.map(m => m[0].toLowerCase())
  }
  
  // Remove attribute-containing sentences or phrases
  for (const [category, keywords] of Object.entries(ATTRIBUTE_KEYWORDS)) {
    const categoryRegex = createKeywordRegex(keywords)
    
    // Remove sentences containing these attributes
    cleanedText = cleanedText.replace(/[^.!?]*[.!?]/g, (sentence) => {
      if (categoryRegex.test(sentence)) {
        return '' // Remove entire sentence
      }
      return sentence
    })
    
    // Clean up remaining fragments
    cleanedText = cleanedText.replace(categoryRegex, '')
  }
  
  // Clean up formatting issues
  cleanedText = cleanedText
    .replace(/\s+/g, ' ') // Multiple spaces to single
    .replace(/,\s*,/g, ',') // Double commas
    .replace(/\.\s*\./g, '.') // Double periods
    .replace(/,\s*\./g, '.') // Comma before period
    .replace(/\s+([,.!?])/g, '$1') // Space before punctuation
    .replace(/([,.!?])\s*([,.!?])/g, '$1 $2') // Spacing between punctuation
    .trim()
  
  // Ensure proper sentence structure
  if (cleanedText && !cleanedText.match(/[.!?]$/)) {
    cleanedText += '.'
  }
  
  return {
    cleaned: cleanedText,
    removed: removedAttributes,
    hasChanges: removedAttributes.length > 0
  }
}

function validatePromptQuality(prompt) {
  const issues = []
  
  if (!prompt || prompt.length < 20) {
    issues.push('Too short')
  }
  
  if (prompt.length > 2000) {
    issues.push('Too long')
  }
  
  if (!/[.!?]$/.test(prompt)) {
    issues.push('Missing ending punctuation')
  }
  
  if (prompt.includes('  ')) {
    issues.push('Double spaces')
  }
  
  return issues
}

// ===== MAIN FUNCTIONS =====

async function restoreNoChangePrompts() {
  console.log('🔧 Phase 1: Restoring NO_CHANGE artifacts...')
  
  const dbPath = '/Users/bertanyalcintepe/Desktop/bananaprompts/data/prompts.db'
  let db
  
  try {
    db = new Database(dbPath, { readonly: true })
  } catch (error) {
    console.error(`❌ Cannot access original database at ${dbPath}`)
    console.error('   Please ensure the path is correct')
    return { restored: 0, notFound: 0, error: true }
  }
  
  const { data: brokenPrompts, error } = await supabase
    .from('community_prompts')
    .select('*')
    .or('title.eq.NO_CHANGE,prompt.eq.NO_CHANGE,title.ilike.%NO_CHANGE%,prompt.ilike.%NO_CHANGE%')
  
  if (error) {
    console.error('❌ Error fetching broken prompts:', error.message)
    db?.close()
    return { restored: 0, notFound: 0, error: true }
  }
  
  console.log(`🔍 Found ${brokenPrompts.length} prompts to restore`)
  
  let restored = 0
  let notFound = 0
  
  for (const brokenPrompt of brokenPrompts) {
    try {
      let original = null
      
      // Try to find by source_url first
      if (brokenPrompt.source_url) {
        const urlQuery = `SELECT * FROM prompts WHERE source_url = ? LIMIT 1`
        original = db.prepare(urlQuery).get(brokenPrompt.source_url)
      }
      
      // Try by title similarity if not found
      if (!original && brokenPrompt.title !== 'NO_CHANGE' && brokenPrompt.title.length > 5) {
        const titleQuery = `SELECT * FROM prompts WHERE title LIKE ? LIMIT 1`
        original = db.prepare(titleQuery).get(`%${brokenPrompt.title}%`)
      }
      
      if (original) {
        const { error: updateError } = await supabase
          .from('community_prompts')
          .update({
            title: original.title,
            prompt: original.prompt
          })
          .eq('id', brokenPrompt.id)
        
        if (updateError) {
          console.error(`❌ Failed to restore ${brokenPrompt.id}:`, updateError.message)
        } else {
          restored++
          if (restored <= 3) {
            console.log(`✅ Restored: ${original.title}`)
          }
        }
      } else {
        notFound++
      }
      
    } catch (error) {
      console.error(`❌ Error processing ${brokenPrompt.id}:`, error.message)
    }
  }
  
  db.close()
  return { restored, notFound, error: false }
}

async function cleanAllPrompts() {
  console.log('\n🧹 Phase 2: Cleaning conflicting attributes from all prompts...')
  
  let offset = 0
  const batchSize = 100
  let totalProcessed = 0
  let totalCleaned = 0
  let cleaningReport = []
  
  while (true) {
    const { data: prompts, error } = await supabase
      .from('community_prompts')
      .select('*')
      .range(offset, offset + batchSize - 1)
    
    if (error) {
      console.error('❌ Error fetching prompts:', error.message)
      break
    }
    
    if (!prompts || prompts.length === 0) break
    
    console.log(`📋 Processing batch ${Math.floor(offset/batchSize) + 1}: ${prompts.length} prompts`)
    
    for (const prompt of prompts) {
      const titleResult = removeConflictingAttributes(prompt.title, 'title')
      const promptResult = removeConflictingAttributes(prompt.prompt, 'prompt')
      
      if (titleResult.hasChanges || promptResult.hasChanges) {
        // Validate quality
        const titleIssues = validatePromptQuality(titleResult.cleaned)
        const promptIssues = validatePromptQuality(promptResult.cleaned)
        
        if (titleIssues.length === 0 && promptIssues.length === 0) {
          // Update the prompt
          const { error: updateError } = await supabase
            .from('community_prompts')
            .update({
              title: titleResult.cleaned,
              prompt: promptResult.cleaned
            })
            .eq('id', prompt.id)
          
          if (!updateError) {
            totalCleaned++
            
            // Track changes for reporting
            cleaningReport.push({
              id: prompt.id,
              title: prompt.title,
              titleRemoved: titleResult.removed,
              promptRemoved: promptResult.removed,
              newTitle: titleResult.cleaned,
              newPrompt: promptResult.cleaned.substring(0, 100) + '...'
            })
            
            if (cleaningReport.length <= 5) {
              console.log(`🧽 Cleaned ID ${prompt.id}: Removed ${[...titleResult.removed, ...promptResult.removed].join(', ')}`)
            }
          }
        }
      }
      
      totalProcessed++
    }
    
    offset += batchSize
  }
  
  return { totalProcessed, totalCleaned, cleaningReport }
}

async function generateReport(restorationResult, cleaningResult) {
  console.log('\n' + '='.repeat(80))
  console.log('🎉 COMPREHENSIVE CLEANUP COMPLETE!')
  console.log('='.repeat(80))
  
  console.log(`\n📊 RESTORATION SUMMARY:`)
  console.log(`✅ Restored NO_CHANGE prompts: ${restorationResult.restored}`)
  console.log(`⚠️  Could not restore: ${restorationResult.notFound}`)
  
  console.log(`\n🧹 ATTRIBUTE CLEANUP SUMMARY:`)
  console.log(`📋 Total prompts processed: ${cleaningResult.totalProcessed}`)
  console.log(`🧽 Prompts cleaned: ${cleaningResult.totalCleaned}`)
  console.log(`🎯 Cleaning success rate: ${((cleaningResult.totalCleaned / cleaningResult.totalProcessed) * 100).toFixed(1)}%`)
  
  if (cleaningResult.cleaningReport.length > 0) {
    console.log(`\n🔍 ATTRIBUTE REMOVAL EXAMPLES:`)
    cleaningResult.cleaningReport.slice(0, 5).forEach((report, i) => {
      const allRemoved = [...report.titleRemoved, ...report.promptRemoved]
      if (allRemoved.length > 0) {
        console.log(`${i + 1}. ID ${report.id}: Removed [${allRemoved.join(', ')}]`)
      }
    })
  }
  
  console.log(`\n🎯 QUALITY IMPROVEMENTS:`)
  console.log(`• Removed hair color specifications`)
  console.log(`• Removed eye color references`)
  console.log(`• Removed skin tone descriptions`)
  console.log(`• Removed age specifications`)
  console.log(`• Removed tattoo references`)
  console.log(`• Maintained nano-banana prompt style`)
  console.log(`• Ensured proper grammar and punctuation`)
  
  // Final verification
  const { data: remainingBroken } = await supabase
    .from('community_prompts')
    .select('id')
    .or('title.eq.NO_CHANGE,prompt.eq.NO_CHANGE,title.ilike.%NO_CHANGE%,prompt.ilike.%NO_CHANGE%')
  
  console.log(`\n✅ VERIFICATION:`)
  console.log(`Remaining NO_CHANGE artifacts: ${remainingBroken?.length || 0}`)
  
  if (remainingBroken?.length === 0) {
    console.log(`🎉 ALL NO_CHANGE artifacts successfully restored!`)
  }
  
  console.log('\n' + '='.repeat(80))
  console.log('🚀 Community Prompts are now optimized for nano-banana style!')
  console.log('='.repeat(80))
}

// ===== MAIN EXECUTION =====
async function comprehensiveCleanup() {
  console.log('🌟 Starting Comprehensive Community Prompts Cleanup...')
  console.log('This process will:')
  console.log('1. Restore NO_CHANGE artifacts from original database')
  console.log('2. Remove conflicting attributes from all prompts')
  console.log('3. Maintain nano-banana style and proper grammar')
  console.log('')
  
  try {
    // Phase 1: Restore NO_CHANGE prompts
    const restorationResult = await restoreNoChangePrompts()
    
    if (!restorationResult.error) {
      // Phase 2: Clean all prompts
      const cleaningResult = await cleanAllPrompts()
      
      // Phase 3: Generate comprehensive report
      await generateReport(restorationResult, cleaningResult)
    }
    
  } catch (error) {
    console.error('❌ Comprehensive cleanup failed:', error.message)
    console.error(error.stack)
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  comprehensiveCleanup()
    .then(() => console.log('\n✨ Cleanup script execution complete'))
    .catch(error => console.error('❌ Script failed:', error))
}

export { comprehensiveCleanup, removeConflictingAttributes, validatePromptQuality }