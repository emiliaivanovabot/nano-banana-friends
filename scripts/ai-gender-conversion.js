#!/usr/bin/env node

/**
 * AI-Powered Gender Conversion for Community Prompts
 * 
 * Uses Gemini AI to intelligently convert male-focused prompts to female-focused prompts
 * while maintaining context, style, and artistic integrity.
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load both .env and .env.local files
dotenv.config({ path: '.env.local' })
dotenv.config() // This loads .env as fallback

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
// Use environment variable for API key
const TEMP_GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !TEMP_GEMINI_API_KEY) {
  console.error('❌ Missing environment variables!')
  console.error('Required: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, TEMP_GEMINI_API_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Conversion prompt for Gemini AI
const CONVERSION_PROMPT = `You are an expert at converting image generation prompts. Your task is to convert male-focused prompts to female-focused prompts while maintaining the artistic style, setting, and quality.

RULES:
1. Convert male subjects (man, guy, boy, he, his, him) to female (woman, girl, she, her)
2. Convert male descriptors (handsome, rugged, masculine) to female equivalents (beautiful, elegant, feminine)  
3. Maintain ALL artistic style, lighting, composition, and setting details
4. Keep technical photography terms unchanged
5. If prompt is already female-focused or gender-neutral, return "NO_CHANGE"
6. If prompt is about objects/landscapes/no people, return "NO_CHANGE"
7. Keep the same tone and quality level
8. Convert body types to professional model standards (tall, slim, elegant)
9. Preserve exact clothing, pose, and scene descriptions

Examples:
INPUT: "Portrait of a handsome man in a black suit, professional lighting"
OUTPUT: "Portrait of a beautiful woman in a black suit, professional lighting"

INPUT: "Landscape photography of mountains at sunset"  
OUTPUT: "NO_CHANGE"

INPUT: "Beautiful woman in elegant dress"
OUTPUT: "NO_CHANGE"

Convert this prompt (respond ONLY with the converted prompt or "NO_CHANGE"):`

async function convertPromptWithAI(prompt, title) {
  const fullPrompt = `${CONVERSION_PROMPT}\n\nTITLE: ${title}\nPROMPT: ${prompt}`
  
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': TEMP_GEMINI_API_KEY
        },
        body: JSON.stringify({
          contents: [{
            role: "user", 
            parts: [{ text: fullPrompt }]
          }],
          generationConfig: {
            temperature: 0.1, // Low temperature for consistent results
            maxOutputTokens: 1000
          }
        })
      }
    )
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`)
    }
    
    const data = await response.json()
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
    
    if (!aiResponse) {
      throw new Error('No response from AI')
    }
    
    // Clean up AI response
    const cleaned = aiResponse.replace(/^["']|["']$/g, '').trim()
    
    if (cleaned === 'NO_CHANGE') {
      return { shouldConvert: false, convertedPrompt: prompt, convertedTitle: title }
    }
    
    // Split response if it contains both title and prompt
    const lines = cleaned.split('\n').filter(line => line.trim())
    let convertedTitle = title
    let convertedPrompt = prompt
    
    if (lines.length >= 2 && lines[0].toLowerCase().includes('title')) {
      convertedTitle = lines[0].replace(/^title:\s*/i, '').trim()
      convertedPrompt = lines.slice(1).join('\n').replace(/^prompt:\s*/i, '').trim()
    } else {
      convertedPrompt = cleaned
    }
    
    return { shouldConvert: true, convertedPrompt, convertedTitle }
    
  } catch (error) {
    console.error('AI conversion error:', error.message)
    return { shouldConvert: false, convertedPrompt: prompt, convertedTitle: title, error: error.message }
  }
}

async function aiGenderConversion() {
  console.log('🤖 Starting AI-powered gender conversion...')
  console.log('🔑 Using temporary API key for one-time cleanup (will be deleted afterwards)')
  
  // Get total count
  const { count } = await supabase
    .from('community_prompts')
    .select('id', { count: 'exact' })
  
  console.log(`📊 Total prompts to analyze: ${count}`)
  
  let processed = 0
  let converted = 0
  let skipped = 0
  let errors = 0
  const batchSize = 50 // Process in smaller batches to manage API rate limits
  
  for (let offset = 0; offset < count; offset += batchSize) {
    console.log(`\n📋 Processing batch ${Math.floor(offset/batchSize) + 1}/${Math.ceil(count/batchSize)} (${offset + 1}-${Math.min(offset + batchSize, count)})...`)
    
    const { data: batchPrompts, error: fetchError } = await supabase
      .from('community_prompts')
      .select('id, prompt, title')
      .range(offset, offset + batchSize - 1)
    
    if (fetchError) {
      console.error('❌ Error fetching batch:', fetchError.message)
      continue
    }
    
    let batchConverted = 0
    let batchSkipped = 0
    let batchErrors = 0
    
    for (const promptData of batchPrompts) {
      try {
        const result = await convertPromptWithAI(promptData.prompt, promptData.title)
        
        if (result.error) {
          batchErrors++
          errors++
          console.error(`❌ AI Error for prompt ${promptData.id}: ${result.error}`)
          
        } else if (result.shouldConvert) {
          // Update in database
          const { error: updateError } = await supabase
            .from('community_prompts')
            .update({
              prompt: result.convertedPrompt,
              title: result.convertedTitle
            })
            .eq('id', promptData.id)
          
          if (updateError) {
            console.error(`❌ Database update failed for prompt ${promptData.id}:`, updateError.message)
            batchErrors++
            errors++
          } else {
            batchConverted++
            converted++
            
            // Show examples
            if (converted <= 5) {
              console.log(`\n📝 AI Conversion Example ${converted}:`)
              console.log(`   TITLE BEFORE: ${promptData.title}`)
              console.log(`   TITLE AFTER:  ${result.convertedTitle}`)
              console.log(`   PROMPT BEFORE: ${promptData.prompt.substring(0, 120)}...`)
              console.log(`   PROMPT AFTER:  ${result.convertedPrompt.substring(0, 120)}...`)
            }
          }
        } else {
          batchSkipped++
          skipped++
        }
        
        processed++
        
        // Rate limiting - small delay between AI calls
        await new Promise(resolve => setTimeout(resolve, 200))
        
      } catch (error) {
        batchErrors++
        errors++
        console.error(`❌ Processing error for prompt ${promptData.id}:`, error.message)
      }
    }
    
    console.log(`   ✅ Batch complete: ${batchConverted} converted, ${batchSkipped} skipped, ${batchErrors} errors`)
    console.log(`   📊 Overall progress: ${processed}/${count} processed`)
    
    // Longer pause between batches to respect API limits
    if (offset + batchSize < count) {
      console.log('   ⏸️  Waiting 2s before next batch...')
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }
  
  console.log(`\n🎉 AI gender conversion complete!`)
  console.log(`📊 Total prompts processed: ${processed}`)
  console.log(`👩 Prompts converted: ${converted}`)
  console.log(`⏭️  Prompts skipped (no change needed): ${skipped}`)
  console.log(`❌ Errors: ${errors}`)
  console.log(`📈 Success rate: ${Math.round((converted + skipped)/(processed) * 100)}%`)
  
  // Sample verification
  const { data: samplePrompts } = await supabase
    .from('community_prompts')
    .select('prompt')
    .ilike('prompt', '%man %')
    .limit(5)
  
  if (samplePrompts?.length > 0) {
    console.log(`\n🔍 Sample prompts still containing 'man ':`)
    samplePrompts.forEach((p, i) => {
      console.log(`   ${i+1}. ${p.prompt.substring(0, 100)}...`)
    })
  }
}

aiGenderConversion()
  .then(() => console.log('✅ AI-powered gender conversion complete!'))
  .catch(error => console.error('❌ AI conversion failed:', error))