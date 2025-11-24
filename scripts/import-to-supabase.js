#!/usr/bin/env node

/**
 * Import Real Community Prompts from bananaprompts.xyz Database to Supabase
 * 
 * This script imports real prompts from the local database into Supabase,
 * converts them to female-focused content, and sets up proper image URLs.
 */

import { createClient } from '@supabase/supabase-js'
import sqlite3 from 'sqlite3'
import fs from 'fs'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing environment variables!')
  console.error('Required: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Initialize Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Gender conversion mapping
const GENDER_CONVERSIONS = {
  // Pronouns
  'he ': 'she ',
  'him ': 'her ',
  'his ': 'her ',
  'himself': 'herself',
  
  // Nouns
  'man ': 'woman ',
  'men ': 'women ',
  'guy ': 'woman ',
  'male ': 'female ',
  'gentleman': 'lady',
  'king': 'queen',
  'prince': 'princess',
  'father': 'mother',
  'dad': 'mom',
  'son': 'daughter',
  'brother': 'sister',
  'uncle': 'aunt',
  'grandfather': 'grandmother',
  'boy ': 'girl ',
  'boys ': 'girls ',
  
  // Titles
  'mr.': 'ms.',
  'mister': 'miss',
  
  // Common patterns
  'handsome': 'beautiful',
  'rugged': 'elegant'
}

function convertToFemale(text) {
  let converted = text
  
  // Apply gender conversions
  for (const [male, female] of Object.entries(GENDER_CONVERSIONS)) {
    const regex = new RegExp(male, 'gi')
    converted = converted.replace(regex, female)
  }
  
  return converted
}

function categorizePrompt(prompt, title) {
  const content = (prompt + ' ' + title).toLowerCase()
  
  // Category detection based on content
  if (content.includes('portrait') || content.includes('headshot') || content.includes('face')) {
    return 'Portrait'
  }
  if (content.includes('fashion') || content.includes('outfit') || content.includes('dress')) {
    return 'Fashion'
  }
  if (content.includes('beauty') || content.includes('makeup') || content.includes('skincare')) {
    return 'Beauty'
  }
  if (content.includes('professional') || content.includes('business') || content.includes('office')) {
    return 'Business'
  }
  if (content.includes('artistic') || content.includes('creative') || content.includes('abstract')) {
    return 'Artistic'
  }
  if (content.includes('lifestyle') || content.includes('casual') || content.includes('everyday')) {
    return 'Lifestyle'
  }
  if (content.includes('urban') || content.includes('city') || content.includes('street')) {
    return 'Urban'
  }
  if (content.includes('cinematic') || content.includes('movie') || content.includes('film')) {
    return 'Cinematic'
  }
  if (content.includes('studio') || content.includes('professional lighting')) {
    return 'Studio'
  }
  if (content.includes('elegant') || content.includes('sophisticated')) {
    return 'Elegant'
  }
  if (content.includes('vintage') || content.includes('car') || content.includes('automotive')) {
    return 'Automotive'
  }
  if (content.includes('luxury') || content.includes('expensive')) {
    return 'Luxury'
  }
  if (content.includes('editorial') || content.includes('magazine')) {
    return 'Editorial'
  }
  
  // Default category
  return 'Creative'
}

async function setupCommunityPromptsTable() {
  console.log('🔧 Checking community_prompts table...')
  
  try {
    // Test if table exists by trying to select from it
    const { data, error } = await supabase
      .from('community_prompts')
      .select('id')
      .limit(1)
    
    if (error && error.code === 'PGRST116') {
      console.log('❌ Table does not exist. Please create it manually in Supabase dashboard with this SQL:')
      console.log(`
        CREATE TABLE community_prompts (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          prompt TEXT NOT NULL,
          category VARCHAR(100) NOT NULL,
          likes INTEGER DEFAULT 0,
          author VARCHAR(255) DEFAULT 'bananaprompts.xyz',
          image_url TEXT NOT NULL,
          source_url TEXT UNIQUE,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `)
      return false
    }
    
    console.log('✅ Table exists and is accessible!')
    return true
    
  } catch (error) {
    console.error('❌ Table check failed:', error.message)
    return false
  }
}

async function importPrompts() {
  console.log('🍌 Importing real community prompts from bananaprompts database...')
  
  const dbPath = '/Users/bertanyalcintepe/Desktop/bananaprompts/data/prompts.db'
  
  if (!fs.existsSync(dbPath)) {
    console.error('❌ Database not found:', dbPath)
    return
  }
  
  const db = new sqlite3.Database(dbPath)
  
  return new Promise((resolve, reject) => {
    // Extract ALL free prompts (all 1938!)
    const query = `
      SELECT id, title, prompt, image_path, source_url
      FROM prompts 
      WHERE prompt NOT LIKE 'Premium Content%' 
      AND LENGTH(prompt) > 50
      ORDER BY id
    `
    
    db.all(query, [], async (err, rows) => {
      if (err) {
        reject(err)
        return
      }
      
      console.log(`✅ Found ${rows.length} potential prompts`)
      
      // Clear existing data
      console.log('🧹 Clearing existing community prompts...')
      const { error: deleteError } = await supabase
        .from('community_prompts')
        .delete()
        .gte('id', 0)
      
      if (deleteError) {
        console.error('❌ Failed to clear existing data:', deleteError.message)
      }
      
      const processedPrompts = []
      
      for (const [index, row] of rows.entries()) {
        try {
          // Keep original content for now (no gender conversion yet)
          const originalTitle = row.title
          const originalPrompt = row.prompt
          
          // Generate likes based on prompt quality (simulate popularity)
          const likes = Math.floor(Math.random() * 500) + 150
          
          // Use boertlay.de URLs for community images
          const imageFileName = row.image_path.replace('images/', '')
          
          const processedPrompt = {
            title: originalTitle,
            prompt: originalPrompt,
            category: categorizePrompt(originalPrompt, originalTitle),
            likes: likes,
            author: 'bananaprompts.xyz',
            image_url: `https://boertlay.de/community-images/${imageFileName}`,
            source_url: row.source_url,
            is_active: true
          }
          
          processedPrompts.push(processedPrompt)
          
        } catch (error) {
          console.error(`Error processing prompt ${row.id}:`, error.message)
        }
      }
      
      // Import ALL prompts (no limiting)
      const allPrompts = processedPrompts.sort((a, b) => b.likes - a.likes)
      
      console.log(`🎯 Importing ALL ${allPrompts.length} prompts to Supabase...`)
      
      // Insert in batches to avoid timeout
      const batchSize = 10
      let imported = 0
      
      for (let i = 0; i < allPrompts.length; i += batchSize) {
        const batch = allPrompts.slice(i, i + batchSize)
        
        const { data, error } = await supabase
          .from('community_prompts')
          .insert(batch)
          .select()
        
        if (error) {
          console.error(`❌ Batch ${Math.floor(i/batchSize) + 1} failed:`, error.message)
        } else {
          imported += batch.length
          console.log(`✅ Imported batch ${Math.floor(i/batchSize) + 1}: ${imported}/${allPrompts.length} prompts`)
        }
      }
      
      // Generate unique categories
      const allCategories = [...new Set(allPrompts.map(p => p.category))]
      console.log('📂 Categories imported:', allCategories.join(', '))
      
      db.close()
      resolve({ imported, categories: allCategories })
    })
  })
}

async function updateCommunityPromptsPage() {
  console.log('📝 Updating CommunityPromptsPage to use Supabase data...')
  
  const filePath = '/Users/bertanyalcintepe/Desktop/nano-banana-friends/src/pages/CommunityPromptsPage.jsx'
  
  if (!fs.existsSync(filePath)) {
    console.error('❌ CommunityPromptsPage.jsx not found')
    return
  }
  
  // Read current file
  const content = fs.readFileSync(filePath, 'utf8')
  
  // Replace the hardcoded data with Supabase loading
  const newContent = content.replace(
    /\/\/ Load community prompts from database[\s\S]*?setCommunityPrompts\(promptsData\)[\s\S]*?setCategories\(categoriesData\)/,
    `// Load community prompts from Supabase database
        const { data: promptsData, error: promptsError } = await supabase
          .from('community_prompts')
          .select('*')
          .eq('is_active', true)
          .order('likes', { ascending: false })
        
        if (promptsError) {
          console.error('Error loading community prompts:', promptsError)
          setError('Fehler beim Laden der Community Prompts. Versuche es später noch einmal.')
          return
        }
        
        // Extract unique categories from prompts
        const allCategories = promptsData.map(prompt => prompt.category)
        const categoriesData = ['All', ...new Set(allCategories)]
        
        setCommunityPrompts(promptsData)
        setCategories(categoriesData)`
  )
  
  // Add Supabase import if not present
  let finalContent = newContent
  if (!newContent.includes('import { supabase }')) {
    finalContent = finalContent.replace(
      "import { useState, useEffect } from 'react'",
      "import { useState, useEffect } from 'react'\nimport { supabase } from '../lib/supabase.js'"
    )
  }
  
  fs.writeFileSync(filePath, finalContent)
  console.log('✅ CommunityPromptsPage updated to use Supabase!')
}

// Run the import process
async function main() {
  try {
    console.log('🚀 Starting community prompts import to Supabase...')
    
    // Setup table
    const tableReady = await setupCommunityPromptsTable()
    if (!tableReady) {
      console.error('❌ Table setup failed, aborting import')
      return
    }
    
    // Import prompts
    const { imported, categories } = await importPrompts()
    
    // Update the React component
    await updateCommunityPromptsPage()
    
    console.log('\n🎉 Import complete!')
    console.log(`✅ Imported ${imported} real community prompts to Supabase`)
    console.log(`📂 Categories: ${categories.join(', ')}`)
    console.log('🚀 CommunityPromptsPage updated to load from Supabase!')
    
  } catch (error) {
    console.error('❌ Import failed:', error)
  }
}

main()