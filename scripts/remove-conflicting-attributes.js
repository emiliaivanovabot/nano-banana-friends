#!/usr/bin/env node

/**
 * REMOVE CONFLICTING USER ATTRIBUTES
 * 
 * Scans community prompts and removes hardcoded user attributes that conflict 
 * with dynamic user data (hair color, eye color, skin color, age, physical specs)
 */

import { createClient } from '@supabase/supabase-js'
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

// Comprehensive attribute removal patterns
const ATTRIBUTE_PATTERNS = [
  // Hair color and style
  {
    pattern: /natural hair color and hair texture/gi,
    replacement: '',
    description: 'Remove natural hair color references'
  },
  {
    pattern: /hair color and hairstyle remain the same as in the uploaded image/gi,
    replacement: '',
    description: 'Remove hair color/style preservation instructions'
  },
  {
    pattern: /Hair color and hairstyle remain the same as in the uploaded image\./gi,
    replacement: '',
    description: 'Remove hair color/style preservation with period'
  },
  {
    pattern: /, hair color and hairstyle remain the same as in the uploaded image/gi,
    replacement: '',
    description: 'Remove hair color/style preservation with comma'
  },
  {
    pattern: /\bhairstyle\b[^.]*?(?=[\.,\n])/gi,
    replacement: (match) => {
      // Only remove if it's about preserving/specifying hairstyle
      if (match.toLowerCase().includes('same') || match.toLowerCase().includes('exact') || match.toLowerCase().includes('no changes')) {
        return ''
      }
      return match
    },
    description: 'Remove hairstyle preservation references'
  },
  {
    pattern: /Tousled tall wavy hair/gi,
    replacement: '',
    description: 'Remove specific hair descriptions'
  },

  // Physical specifications (height, weight, build)
  {
    pattern: /He stands at a height of 6 feet with a (?:muscular physique|good physique)\./gi,
    replacement: '',
    description: 'Remove height and physique specifications'
  },
  {
    pattern: /He stands at a height of 6 feet with a (?:muscular physique|good physique)/gi,
    replacement: '',
    description: 'Remove height and physique specifications (no period)'
  },
  {
    pattern: /(?:man|woman) with a broad chest and solid build/gi,
    replacement: '$1',
    description: 'Remove broad chest and solid build descriptions'
  },
  {
    pattern: /\(\d+ft,\s*\d+kg\)/gi,
    replacement: '',
    description: 'Remove height/weight specifications in parentheses'
  },
  {
    pattern: /looking fit at \d+\s*kg with the physique of someone who trains \d+-\d+ times a week at the gym/gi,
    replacement: '',
    description: 'Remove fitness and weight descriptions'
  },
  {
    pattern: /, looking fit at \d+\s*kg with the physique of someone who trains \d+-\d+ times a week at the gym/gi,
    replacement: '',
    description: 'Remove fitness and weight descriptions with comma'
  },

  // Age references
  {
    pattern: /\byoung (?:man|woman)\b/gi,
    replacement: '$1',
    description: 'Remove age qualifiers from man/woman'
  },

  // Size references
  {
    pattern: /XXL body size/gi,
    replacement: '',
    description: 'Remove body size specifications'
  },

  // Skin tone references (when explicitly mentioned)
  {
    pattern: /skin tone,?\s*/gi,
    replacement: '',
    description: 'Remove skin tone references'
  },

  // Clean up extra spaces and punctuation
  {
    pattern: /\s{2,}/g,
    replacement: ' ',
    description: 'Clean up multiple spaces'
  },
  {
    pattern: /,\s*,/g,
    replacement: ',',
    description: 'Clean up double commas'
  },
  {
    pattern: /\.\s*\./g,
    replacement: '.',
    description: 'Clean up double periods'
  },
  {
    pattern: /,\s*\./g,
    replacement: '.',
    description: 'Clean up comma before period'
  },
  {
    pattern: /\s+\./g,
    replacement: '.',
    description: 'Clean up spaces before periods'
  },
  {
    pattern: /\s+,/g,
    replacement: ',',
    description: 'Clean up spaces before commas'
  }
]

function removeConflictingAttributes(text) {
  let cleanText = text
  const appliedChanges = []

  for (const pattern of ATTRIBUTE_PATTERNS) {
    const before = cleanText
    if (typeof pattern.replacement === 'function') {
      cleanText = cleanText.replace(pattern.pattern, pattern.replacement)
    } else {
      cleanText = cleanText.replace(pattern.pattern, pattern.replacement)
    }
    
    if (before !== cleanText) {
      appliedChanges.push(pattern.description)
    }
  }

  // Final cleanup
  cleanText = cleanText.trim()
  
  return {
    cleanText,
    appliedChanges,
    hasChanges: appliedChanges.length > 0
  }
}

async function processNoChangePrompts() {
  console.log('🧹 Removing conflicting user attributes from NO_CHANGE prompts...')
  
  // Get all NO_CHANGE prompts that have been restored
  const { data: prompts, error } = await supabase
    .from('community_prompts')
    .select('*')
    .or('title.eq.NO_CHANGE,prompt.eq.NO_CHANGE,title.ilike.%NO_CHANGE%,prompt.ilike.%NO_CHANGE%')
  
  if (error) {
    console.error('❌ Error fetching prompts:', error.message)
    return
  }
  
  console.log(`🔍 Found ${prompts.length} NO_CHANGE prompts to process`)
  
  if (prompts.length === 0) {
    console.log('✅ No prompts to process!')
    return
  }

  let processedCount = 0
  let changedCount = 0
  const processResults = []

  for (const prompt of prompts) {
    try {
      console.log(`\n📝 Processing ID ${prompt.id}: "${prompt.title}"`)
      
      // Skip if prompt is literally "NO_CHANGE"
      if (prompt.prompt === 'NO_CHANGE') {
        console.log('⏭️  Skipping - prompt is literally "NO_CHANGE"')
        processResults.push({
          id: prompt.id,
          title: prompt.title,
          status: 'skipped',
          reason: 'Literal NO_CHANGE content'
        })
        continue
      }

      // Process the prompt text
      const result = removeConflictingAttributes(prompt.prompt)
      
      processResults.push({
        id: prompt.id,
        title: prompt.title,
        originalLength: prompt.prompt.length,
        cleanedLength: result.cleanText.length,
        appliedChanges: result.appliedChanges,
        hasChanges: result.hasChanges,
        status: result.hasChanges ? 'modified' : 'no_changes'
      })

      if (result.hasChanges) {
        console.log(`🔧 Changes applied: ${result.appliedChanges.length} patterns`)
        result.appliedChanges.forEach(change => {
          console.log(`   - ${change}`)
        })

        // Update the prompt in database
        const { error: updateError } = await supabase
          .from('community_prompts')
          .update({
            prompt: result.cleanText
          })
          .eq('id', prompt.id)

        if (updateError) {
          console.error(`❌ Failed to update ID ${prompt.id}:`, updateError.message)
          processResults[processResults.length - 1].status = 'error'
          processResults[processResults.length - 1].error = updateError.message
        } else {
          changedCount++
          console.log(`✅ Updated prompt successfully`)
        }
      } else {
        console.log('ℹ️  No conflicting attributes found')
      }

      processedCount++
      
    } catch (error) {
      console.error(`❌ Error processing prompt ${prompt.id}:`, error.message)
      processResults.push({
        id: prompt.id,
        title: prompt.title,
        status: 'error',
        error: error.message
      })
    }
  }

  // Summary report
  console.log('\n' + '='.repeat(60))
  console.log('📊 ATTRIBUTE REMOVAL SUMMARY')
  console.log('='.repeat(60))
  console.log(`📋 Total prompts processed: ${processedCount}`)
  console.log(`✅ Prompts modified: ${changedCount}`)
  console.log(`ℹ️  No changes needed: ${processResults.filter(r => r.status === 'no_changes').length}`)
  console.log(`⏭️  Skipped: ${processResults.filter(r => r.status === 'skipped').length}`)
  console.log(`❌ Errors: ${processResults.filter(r => r.status === 'error').length}`)

  // Detailed results
  console.log('\n🔍 DETAILED RESULTS:')
  processResults.forEach(result => {
    console.log(`\n${result.id} | ${result.title} | ${result.status.toUpperCase()}`)
    if (result.appliedChanges && result.appliedChanges.length > 0) {
      console.log(`   Changes: ${result.appliedChanges.join(', ')}`)
      console.log(`   Length: ${result.originalLength} → ${result.cleanedLength} chars`)
    }
    if (result.error) {
      console.log(`   Error: ${result.error}`)
    }
  })

  console.log('\n🎉 Attribute removal process complete!')
}

// Test function to preview changes without applying them
async function previewChanges() {
  console.log('👀 PREVIEW MODE: Showing what would be changed...\n')
  
  const { data: prompts, error } = await supabase
    .from('community_prompts')
    .select('*')
    .or('title.eq.NO_CHANGE,prompt.eq.NO_CHANGE,title.ilike.%NO_CHANGE%,prompt.ilike.%NO_CHANGE%')
  
  if (error) {
    console.error('❌ Error:', error.message)
    return
  }

  prompts.forEach(prompt => {
    if (prompt.prompt === 'NO_CHANGE') return
    
    const result = removeConflictingAttributes(prompt.prompt)
    
    if (result.hasChanges) {
      console.log(`🔍 ID ${prompt.id}: "${prompt.title}"`)
      console.log(`📝 Changes: ${result.appliedChanges.join(', ')}`)
      console.log(`📏 Length: ${prompt.prompt.length} → ${result.cleanText.length} chars`)
      console.log('---')
    }
  })
}

// Command line handling
const args = process.argv.slice(2)
const command = args[0]

if (command === 'preview') {
  previewChanges()
    .then(() => console.log('✅ Preview complete'))
    .catch(error => console.error('❌ Preview failed:', error))
} else {
  processNoChangePrompts()
    .then(() => console.log('✅ Attribute removal complete'))
    .catch(error => console.error('❌ Process failed:', error))
}