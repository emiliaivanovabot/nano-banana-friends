#!/usr/bin/env node

/**
 * Precise Gender Conversion - Word Boundary Safe
 * Convert male prompts to female prompts with exact word matching
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing environment variables!')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// EXACT word conversions with word boundaries
const CONVERSIONS = [
  // Pronouns - exact word matches
  { from: '\\bhe\\b', to: 'she', type: 'pronoun' },
  { from: '\\bHe\\b', to: 'She', type: 'pronoun' },
  { from: '\\bhim\\b', to: 'her', type: 'pronoun' },
  { from: '\\bHim\\b', to: 'Her', type: 'pronoun' },
  { from: '\\bhis\\b', to: 'her', type: 'pronoun' },
  { from: '\\bHis\\b', to: 'Her', type: 'pronoun' },
  { from: '\\bhimself\\b', to: 'herself', type: 'pronoun' },
  { from: '\\bHimself\\b', to: 'Herself', type: 'pronoun' },
  
  // Main nouns
  { from: '\\bman\\b', to: 'woman', type: 'noun' },
  { from: '\\bMan\\b', to: 'Woman', type: 'noun' },
  { from: '\\bmen\\b', to: 'women', type: 'noun' },
  { from: '\\bMen\\b', to: 'Women', type: 'noun' },
  { from: '\\bguy\\b', to: 'woman', type: 'noun' },
  { from: '\\bGuy\\b', to: 'Woman', type: 'noun' },
  { from: '\\bguys\\b', to: 'women', type: 'noun' },
  { from: '\\bGuys\\b', to: 'Women', type: 'noun' },
  { from: '\\bmale\\b', to: 'female', type: 'noun' },
  { from: '\\bMale\\b', to: 'Female', type: 'noun' },
  
  // Age descriptors
  { from: '\\bboy\\b', to: 'girl', type: 'age' },
  { from: '\\bBoy\\b', to: 'Girl', type: 'age' },
  { from: '\\bboys\\b', to: 'girls', type: 'age' },
  { from: '\\bBoys\\b', to: 'Girls', type: 'age' },
  
  // Descriptors
  { from: '\\bhandsome\\b', to: 'beautiful', type: 'descriptor' },
  { from: '\\bHandsome\\b', to: 'Beautiful', type: 'descriptor' },
  { from: '\\brugged\\b', to: 'elegant', type: 'descriptor' },
  { from: '\\bRugged\\b', to: 'Elegant', type: 'descriptor' },
  { from: '\\bmasculine\\b', to: 'feminine', type: 'descriptor' },
  { from: '\\bMasculine\\b', to: 'Feminine', type: 'descriptor' },
  
  // Family terms
  { from: '\\bfather\\b', to: 'mother', type: 'family' },
  { from: '\\bFather\\b', to: 'Mother', type: 'family' },
  { from: '\\bdad\\b', to: 'mom', type: 'family' },
  { from: '\\bDad\\b', to: 'Mom', type: 'family' },
  { from: '\\bson\\b', to: 'daughter', type: 'family' },
  { from: '\\bSon\\b', to: 'Daughter', type: 'family' },
  { from: '\\bbrother\\b', to: 'sister', type: 'family' },
  { from: '\\bBrother\\b', to: 'Sister', type: 'family' }
]

function convertGender(text) {
  let converted = text
  let changes = []
  
  for (const conv of CONVERSIONS) {
    const regex = new RegExp(conv.from, 'g')
    const matches = converted.match(regex)
    
    if (matches) {
      converted = converted.replace(regex, conv.to)
      changes.push({
        type: conv.type,
        count: matches.length,
        from: conv.from.replace(/\\b/g, ''),
        to: conv.to
      })
    }
  }
  
  return { converted, changes, hasChanges: changes.length > 0 }
}

async function preciseGenderConversion() {
  console.log('👩 Starting precise gender conversion...')
  
  // Get all prompts that likely contain male references
  const { data: allPrompts, error } = await supabase
    .from('community_prompts')
    .select('id, prompt, title')
  
  if (error) {
    console.error('❌ Error fetching prompts:', error.message)
    return
  }
  
  console.log(`📊 Checking ${allPrompts.length} prompts for gender conversion...`)
  
  let processed = 0
  let converted = 0
  let totalChanges = 0
  
  for (const promptData of allPrompts) {
    const promptResult = convertGender(promptData.prompt)
    const titleResult = convertGender(promptData.title)
    
    if (promptResult.hasChanges || titleResult.hasChanges) {
      // Update database
      const { error: updateError } = await supabase
        .from('community_prompts')
        .update({
          prompt: promptResult.converted,
          title: titleResult.converted
        })
        .eq('id', promptData.id)
      
      if (updateError) {
        console.error(`❌ Failed to update prompt ${promptData.id}:`, updateError.message)
      } else {
        converted++
        const promptChanges = promptResult.changes.reduce((sum, c) => sum + c.count, 0)
        const titleChanges = titleResult.changes.reduce((sum, c) => sum + c.count, 0)
        totalChanges += promptChanges + titleChanges
        
        // Show first few examples
        if (converted <= 5) {
          console.log(`\n📝 Example ${converted}:`)
          
          if (promptResult.hasChanges) {
            console.log(`   PROMPT BEFORE: ${promptData.prompt.substring(0, 100)}...`)
            console.log(`   PROMPT AFTER:  ${promptResult.converted.substring(0, 100)}...`)
            promptResult.changes.forEach(change => {
              console.log(`   Changed: ${change.from} → ${change.to} (${change.count}x)`)
            })
          }
          
          if (titleResult.hasChanges) {
            console.log(`   TITLE: ${promptData.title} → ${titleResult.converted}`)
            titleResult.changes.forEach(change => {
              console.log(`   Changed: ${change.from} → ${change.to} (${change.count}x)`)
            })
          }
        }
        
        if (converted % 100 === 0) {
          console.log(`✅ Converted ${converted} prompts so far...`)
        }
      }
    }
    
    processed++
    if (processed % 200 === 0) {
      console.log(`📊 Progress: ${processed}/${allPrompts.length} checked`)
    }
  }
  
  console.log(`\n🎉 Gender conversion complete!`)
  console.log(`📊 Total prompts checked: ${processed}`)
  console.log(`👩 Prompts converted: ${converted}`)
  console.log(`🔄 Total word changes: ${totalChanges}`)
  
  // Verification
  const maleWords = ['\\bman\\b', '\\bmale\\b', '\\bhe\\b', '\\bhim\\b', '\\bhis\\b', '\\bhandsome\\b']
  let remainingMale = 0
  
  for (const word of maleWords) {
    const { count } = await supabase
      .from('community_prompts')
      .select('id', { count: 'exact' })
      .or(`prompt.ilike.%${word.replace(/\\b/g, '')}%,title.ilike.%${word.replace(/\\b/g, '')}%`)
    
    remainingMale += count || 0
  }
  
  console.log(`🔍 Remaining male references: ~${remainingMale} (approximate)`)
  console.log(`📈 Estimated conversion rate: ${Math.round((1 - remainingMale/allPrompts.length) * 100)}%`)
}

preciseGenderConversion()
  .then(() => console.log('✅ Precise gender conversion complete!'))
  .catch(error => console.error('❌ Conversion failed:', error))