#!/usr/bin/env node

/**
 * Simple Gender Conversion - Safe Word Boundaries
 * Convert male prompts to female with precise word matching
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

// Safe conversions with word boundaries
const CONVERSIONS = [
  // Pronouns
  { from: /\bhe\b/gi, to: 'she', type: 'pronoun' },
  { from: /\bHe\b/g, to: 'She', type: 'pronoun' },
  { from: /\bhim\b/gi, to: 'her', type: 'pronoun' },
  { from: /\bHim\b/g, to: 'Her', type: 'pronoun' },
  { from: /\bhis\b/gi, to: 'her', type: 'pronoun' },
  { from: /\bHis\b/g, to: 'Her', type: 'pronoun' },
  { from: /\bhimself\b/gi, to: 'herself', type: 'pronoun' },
  
  // Main nouns
  { from: /\bman\b/gi, to: 'woman', type: 'noun' },
  { from: /\bMan\b/g, to: 'Woman', type: 'noun' },
  { from: /\bmen\b/gi, to: 'women', type: 'noun' },
  { from: /\bMen\b/g, to: 'Women', type: 'noun' },
  { from: /\bguy\b/gi, to: 'woman', type: 'noun' },
  { from: /\bGuy\b/g, to: 'Woman', type: 'noun' },
  { from: /\bmale\b/gi, to: 'female', type: 'noun' },
  { from: /\bMale\b/g, to: 'Female', type: 'noun' },
  
  // Age descriptors
  { from: /\bboy\b/gi, to: 'girl', type: 'age' },
  { from: /\bBoy\b/g, to: 'Girl', type: 'age' },
  
  // Descriptors
  { from: /\bhandsome\b/gi, to: 'beautiful', type: 'descriptor' },
  { from: /\bHandsome\b/g, to: 'Beautiful', type: 'descriptor' },
  { from: /\brugged\b/gi, to: 'elegant', type: 'descriptor' },
  { from: /\bRugged\b/g, to: 'Elegant', type: 'descriptor' }
]

function simpleGenderConversion(text) {
  let converted = text
  let totalChanges = 0
  let changeLog = []
  
  for (const conv of CONVERSIONS) {
    const matches = converted.match(conv.from) || []
    if (matches.length > 0) {
      converted = converted.replace(conv.from, conv.to)
      totalChanges += matches.length
      changeLog.push({
        type: conv.type,
        from: matches[0],
        to: conv.to,
        count: matches.length
      })
    }
  }
  
  return { 
    converted, 
    hasChanges: totalChanges > 0, 
    changeCount: totalChanges,
    changes: changeLog
  }
}

async function processGenderConversion() {
  console.log('👩 Starting simple gender conversion...')
  
  const { count } = await supabase
    .from('community_prompts')
    .select('id', { count: 'exact' })
  
  console.log(`📊 Total prompts: ${count}`)
  
  let processed = 0
  let converted = 0
  let totalChanges = 0
  const pageSize = 100
  
  for (let offset = 0; offset < count; offset += pageSize) {
    console.log(`\n📋 Processing batch ${Math.floor(offset/pageSize) + 1}/${Math.ceil(count/pageSize)}...`)
    
    const { data: batch, error } = await supabase
      .from('community_prompts')
      .select('id, prompt, title')
      .range(offset, offset + pageSize - 1)
    
    if (error) {
      console.error('❌ Error fetching batch:', error.message)
      continue
    }
    
    let batchConverted = 0
    
    for (const item of batch) {
      const promptResult = simpleGenderConversion(item.prompt)
      const titleResult = simpleGenderConversion(item.title)
      
      if (promptResult.hasChanges || titleResult.hasChanges) {
        const { error: updateError } = await supabase
          .from('community_prompts')
          .update({
            prompt: promptResult.converted,
            title: titleResult.converted
          })
          .eq('id', item.id)
        
        if (updateError) {
          console.error(`❌ Update failed for ${item.id}:`, updateError.message)
        } else {
          converted++
          batchConverted++
          totalChanges += promptResult.changeCount + titleResult.changeCount
          
          if (converted <= 5) {
            console.log(`📝 Example ${converted}:`)
            if (promptResult.hasChanges) {
              console.log(`   PROMPT: ${promptResult.changeCount} changes`)
              promptResult.changes.forEach(c => console.log(`     ${c.from} → ${c.to} (${c.count}x)`))
            }
            if (titleResult.hasChanges) {
              console.log(`   TITLE: ${titleResult.changeCount} changes`)
            }
          }
        }
      }
      
      processed++
    }
    
    console.log(`   ✅ ${batchConverted} converted in this batch`)
    console.log(`   📊 Overall: ${processed}/${count} processed, ${converted} converted`)
  }
  
  console.log(`\n🎉 Conversion complete!`)
  console.log(`📊 Prompts processed: ${processed}`)
  console.log(`👩 Prompts converted: ${converted}`)
  console.log(`🔄 Total word changes: ${totalChanges}`)
  
  // Quick verification
  const { count: remainingMale } = await supabase
    .from('community_prompts')
    .select('id', { count: 'exact' })
    .or('prompt.ilike.%man%,prompt.ilike.%male%,prompt.ilike.%handsome%')
  
  console.log(`🔍 Prompts still containing male words: ${remainingMale || 0}`)
}

processGenderConversion()
  .then(() => console.log('✅ Simple gender conversion complete!'))
  .catch(error => console.error('❌ Conversion failed:', error))