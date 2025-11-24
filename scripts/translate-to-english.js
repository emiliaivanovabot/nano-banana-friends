#!/usr/bin/env node

/**
 * AI Translation Script - Convert ALL non-English prompts to English
 * Uses Gemini AI to intelligently translate prompts for better generation results
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
dotenv.config()

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !GEMINI_API_KEY) {
  console.error('❌ Missing environment variables!')
  console.error('Need: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, VITE_GEMINI_API_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const TRANSLATION_PROMPT = `You are an expert translator specialized in image generation prompts. Your task is to intelligently translate prompts to perfect English while preserving ALL creative details.

RULES:
1. Translate ONLY if the prompt is NOT in English
2. If prompt is already in English, return "NO_CHANGE"
3. Preserve ALL artistic details: lighting, composition, style, clothing, poses
4. Maintain technical terms: "4K", "9:16", "bokeh", "editorial", etc.
5. Keep the artistic vision and mood identical
6. For photography prompts, use professional English terminology
7. Translate titles to English as well

EXAMPLES:
- Portuguese: "Crie um retrato luxuoso..." → English: "Create a luxurious portrait..."
- German: "Erstelle ein Foto mit..." → English: "Create a photo with..."
- Already English: "Create a stunning portrait..." → "NO_CHANGE"

Respond with ONLY the English translation or "NO_CHANGE".`

async function callGeminiAPI(prompt, title) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${TRANSLATION_PROMPT}

TITLE: ${title}
PROMPT: ${prompt}

Translate both TITLE and PROMPT to English (or return "NO_CHANGE" if already English):`
          }]
        }]
      })
    }
  )

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`)
  }

  const data = await response.json()
  const result = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
  
  if (!result) {
    throw new Error('No response from Gemini API')
  }

  return result
}

function parseTranslationResult(result) {
  if (result === "NO_CHANGE") {
    return { needsTranslation: false }
  }

  // Try to extract title and prompt from response
  const titleMatch = result.match(/TITLE:\s*(.+?)(?:\n|PROMPT:|$)/i)
  const promptMatch = result.match(/PROMPT:\s*(.+?)$/s)

  if (titleMatch && promptMatch) {
    return {
      needsTranslation: true,
      translatedTitle: titleMatch[1].trim(),
      translatedPrompt: promptMatch[1].trim()
    }
  }

  // Fallback: assume entire response is the translated prompt
  return {
    needsTranslation: true,
    translatedTitle: null,
    translatedPrompt: result
  }
}

async function translatePrompts() {
  console.log('🌍 AI Translation: Converting all non-English prompts to English...')
  
  const { count } = await supabase
    .from('community_prompts')
    .select('id', { count: 'exact' })
  
  console.log(`📊 Total prompts to check: ${count}`)
  
  let processed = 0
  let translated = 0
  let errors = 0
  const pageSize = 50
  
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
    
    let batchTranslated = 0
    
    for (const item of batch) {
      try {
        const result = await callGeminiAPI(item.prompt, item.title)
        const translation = parseTranslationResult(result)
        
        if (translation.needsTranslation) {
          const updateData = {
            prompt: translation.translatedPrompt
          }
          
          if (translation.translatedTitle) {
            updateData.title = translation.translatedTitle
          }
          
          const { error: updateError } = await supabase
            .from('community_prompts')
            .update(updateData)
            .eq('id', item.id)
          
          if (updateError) {
            console.error(`❌ Update failed for ${item.id}:`, updateError.message)
            errors++
          } else {
            translated++
            batchTranslated++
            
            if (translated <= 5) {
              console.log(`🌍 Translation ${translated}:`)
              console.log(`   ID: ${item.id}`)
              if (translation.translatedTitle) {
                console.log(`   TITLE: ${item.title} → ${translation.translatedTitle}`)
              }
              console.log(`   BEFORE: ${item.prompt.substring(0, 80)}...`)
              console.log(`   AFTER:  ${translation.translatedPrompt.substring(0, 80)}...`)
            }
          }
        }
        
        processed++
        
        // Small delay to be nice to the API
        await new Promise(resolve => setTimeout(resolve, 100))
        
      } catch (error) {
        console.error(`❌ Translation failed for ${item.id}:`, error.message)
        errors++
        processed++
        
        // Longer delay on error
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    
    console.log(`   ✅ ${batchTranslated} translated in this batch`)
    console.log(`   📊 Overall: ${processed}/${count} processed, ${translated} translated, ${errors} errors`)
    
    // Delay between batches
    if (offset + pageSize < count) {
      console.log(`   ⏸️  Waiting 2s before next batch...`)
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }
  
  console.log(`\n🎉 AI Translation complete!`)
  console.log(`📊 Prompts processed: ${processed}`)
  console.log(`🌍 Prompts translated: ${translated}`)
  console.log(`❌ Errors: ${errors}`)
  console.log(`📈 Success rate: ${Math.round((processed - errors) / processed * 100)}%`)
  
  // Final check for remaining non-English prompts
  const { count: remainingNonEnglish } = await supabase
    .from('community_prompts')
    .select('id', { count: 'exact' })
    .or('prompt.ilike.%foto%,prompt.ilike.%imagem%,prompt.ilike.%retrato%,title.ilike.%foto%,title.ilike.%imagem%')
  
  console.log(`\n🔍 Estimated non-English prompts remaining: ${remainingNonEnglish}`)
  
  if (remainingNonEnglish === 0) {
    console.log(`🎉 🌍 🎉 ALL PROMPTS APPEAR TO BE IN ENGLISH! 🎉 🌍 🎉`)
  }
}

translatePrompts()
  .then(() => console.log('✅ Translation process complete!'))
  .catch(error => console.error('❌ Translation failed:', error))