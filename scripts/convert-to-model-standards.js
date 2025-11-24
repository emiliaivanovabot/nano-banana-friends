#!/usr/bin/env node

/**
 * Convert Community Prompts to Female Professional Model Standards
 * 
 * - Convert male references to female
 * - Convert body types to professional model standards (slim, tall)
 * - Maintain the artistic style and setting
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing environment variables!')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Comprehensive conversion mappings
const GENDER_CONVERSIONS = {
  // Pronouns
  'he ': 'she ',
  'him ': 'her ',
  'his ': 'her ',
  'himself': 'herself',
  
  // Nouns - exact word matches to avoid false positives
  ' man ': ' woman ',
  ' men ': ' women ',
  ' guy ': ' woman ',
  ' male ': ' female ',
  ' gentleman': ' lady',
  ' king': ' queen',
  ' prince': ' princess',
  ' father': ' mother',
  ' dad': ' mom',
  ' son': ' daughter',
  ' brother': ' sister',
  ' uncle': ' aunt',
  ' grandfather': ' grandmother',
  ' boy ': ' girl ',
  ' boys ': ' girls ',
  
  // Titles
  ' mr.': ' ms.',
  ' mister': ' miss',
  
  // Common descriptors
  ' handsome': ' beautiful',
  ' rugged': ' elegant',
  ' masculine': ' feminine',
  ' manly': ' graceful'
}

const MODEL_STANDARD_CONVERSIONS = {
  // Body types to model standards
  ' curvy ': ' slim ',
  ' thick ': ' slim ',
  ' chubby ': ' slim ',
  ' plus-size ': ' model-figure ',
  ' overweight ': ' slim ',
  ' heavy ': ' elegant ',
  ' chunky ': ' statuesque ',
  ' stocky ': ' tall and slim ',
  ' short ': ' tall ',
  ' petite ': ' statuesque ',
  ' small ': ' tall ',
  
  // Enhanced model descriptors
  ' woman ': ' professional model ',
  ' girl ': ' young model ',
  ' female ': ' female model ',
  
  // Professional model qualities
  ' beautiful': ' stunning model-like',
  ' pretty': ' model-beautiful',
  ' attractive': ' striking model',
  
  // Posture and presence
  ' sitting': ' posing elegantly',
  ' standing': ' modeling professionally',
  ' relaxed': ' confident and poised'
}

// Language-specific conversions for international prompts
const LANGUAGE_CONVERSIONS = {
  // Portuguese
  ' homem ': ' mulher ',
  ' ele ': ' ela ',
  ' gordo ': ' magro ',
  ' baixo ': ' alto ',
  
  // Spanish  
  ' hombre ': ' mujer ',
  ' él ': ' ella ',
  ' gordo ': ' delgado ',
  ' bajo ': ' alto ',
  
  // French
  ' homme ': ' femme ',
  ' il ': ' elle ',
  ' gros ': ' mince ',
  ' petit ': ' grand ',
  
  // German
  ' mann ': ' frau ',
  ' er ': ' sie ',
  ' dick ': ' schlank ',
  ' klein ': ' groß '
}

function convertPromptToModelStandard(prompt) {
  let converted = prompt.toLowerCase()
  
  // Apply gender conversions
  for (const [male, female] of Object.entries(GENDER_CONVERSIONS)) {
    const regex = new RegExp(male, 'gi')
    converted = converted.replace(regex, female)
  }
  
  // Apply model standard conversions
  for (const [original, modelStandard] of Object.entries(MODEL_STANDARD_CONVERSIONS)) {
    const regex = new RegExp(original, 'gi')
    converted = converted.replace(regex, modelStandard)
  }
  
  // Apply language-specific conversions
  for (const [original, converted_term] of Object.entries(LANGUAGE_CONVERSIONS)) {
    const regex = new RegExp(original, 'gi')
    converted = converted.replace(regex, converted_term)
  }
  
  // Restore proper capitalization for the first word
  converted = converted.charAt(0).toUpperCase() + converted.slice(1)
  
  // Clean up extra spaces
  converted = converted.replace(/\s+/g, ' ').trim()
  
  return converted
}

async function convertToModelStandards() {
  console.log('👗 Converting community prompts to female professional model standards...')
  
  // Get total count first
  const { count } = await supabase
    .from('community_prompts')
    .select('id', { count: 'exact' })
  
  console.log(`📊 Total prompts to process: ${count}`)
  
  let allProcessed = 0
  let totalConverted = 0
  const pageSize = 200 // Smaller batches for model conversion
  
  // Process in chunks
  for (let offset = 0; offset < count; offset += pageSize) {
    console.log(`\n📋 Processing batch ${Math.floor(offset/pageSize) + 1}/${Math.ceil(count/pageSize)} (${offset + 1}-${Math.min(offset + pageSize, count)})...`)
    
    const { data: batchPrompts, error: fetchError } = await supabase
      .from('community_prompts')
      .select('id, prompt, title')
      .range(offset, offset + pageSize - 1)
    
    if (fetchError) {
      console.error('❌ Error fetching batch:', fetchError.message)
      continue
    }
    
    let batchConverted = 0
    
    for (const promptData of batchPrompts) {
      const originalPrompt = promptData.prompt
      const originalTitle = promptData.title
      
      // Convert both prompt and title
      const convertedPrompt = convertPromptToModelStandard(originalPrompt)
      const convertedTitle = convertPromptToModelStandard(originalTitle)
      
      // Check if any changes were made
      if (convertedPrompt !== originalPrompt || convertedTitle !== originalTitle) {
        // Update the prompt in database
        const { error: updateError } = await supabase
          .from('community_prompts')
          .update({ 
            prompt: convertedPrompt,
            title: convertedTitle 
          })
          .eq('id', promptData.id)
        
        if (updateError) {
          console.error(`❌ Failed to update prompt ${promptData.id}:`, updateError.message)
        } else {
          batchConverted++
          totalConverted++
          
          // Show examples from first batch only
          if (totalConverted <= 5) {
            console.log(`📝 Example ${totalConverted}:`)
            if (convertedPrompt !== originalPrompt) {
              console.log(`   PROMPT BEFORE: ${originalPrompt.substring(0, 120)}...`)
              console.log(`   PROMPT AFTER:  ${convertedPrompt.substring(0, 120)}...`)
            }
            if (convertedTitle !== originalTitle) {
              console.log(`   TITLE BEFORE: ${originalTitle}`)
              console.log(`   TITLE AFTER:  ${convertedTitle}`)
            }
            console.log('')
          }
        }
      }
    }
    
    allProcessed += batchPrompts.length
    console.log(`   ✅ Batch complete: ${batchConverted} converted out of ${batchPrompts.length} prompts`)
    console.log(`   📊 Overall progress: ${allProcessed}/${count} processed, ${totalConverted} total converted`)
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  console.log(`\n🎉 Model conversion complete!`)
  console.log(`📊 Total prompts processed: ${allProcessed}`)
  console.log(`👗 Prompts converted to model standards: ${totalConverted}`)
  
  // Verification - count prompts that still contain male references
  const maleKeywords = ['man ', 'he ', 'his ', 'him ', 'handsome', 'male ', 'guy ']
  let remainingMaleRefs = 0
  
  for (const keyword of maleKeywords) {
    const { count: keywordCount } = await supabase
      .from('community_prompts')
      .select('id', { count: 'exact' })
      .ilike('prompt', `%${keyword}%`)
    
    if (keywordCount > 0) {
      console.log(`🔍 Still found ${keywordCount} prompts containing "${keyword.trim()}"`)
      remainingMaleRefs += keywordCount
    }
  }
  
  console.log(`📈 Conversion success rate: ${Math.round((1 - remainingMaleRefs/count) * 100)}%`)
}

convertToModelStandards()
  .then(() => console.log('✅ Model standard conversion complete!'))
  .catch(error => console.error('❌ Conversion failed:', error))