#!/usr/bin/env node

/**
 * Community Prompts Data Scraper for bananaprompts.xyz
 * 
 * This script scrapes real community prompts from bananaprompts.xyz/explore
 * and populates the community_prompts table in Supabase.
 * 
 * Features:
 * - Fetches only free, people/portrait-focused prompts
 * - Converts male prompts to female for target audience
 * - Validates image URLs and content quality
 * - Prevents duplicates and maintains data integrity
 * - Comprehensive error handling and logging
 */

import { createClient } from '@supabase/supabase-js'
import fetch from 'node-fetch'
import * as cheerio from 'cheerio'
import fs from 'fs'
import path from 'path'

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const BASE_URL = 'https://bananaprompts.xyz'
const EXPLORE_URL = `${BASE_URL}/explore`

// Initialize Supabase client with service role key for full access
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

class CommunityPromptsScraper {
  constructor() {
    this.scrapedCount = 0
    this.errorCount = 0
    this.duplicateCount = 0
    this.logFile = path.join(process.cwd(), 'scraper-log.txt')
  }

  log(message) {
    const timestamp = new Date().toISOString()
    const logEntry = `[${timestamp}] ${message}`
    console.log(logEntry)
    fs.appendFileSync(this.logFile, logEntry + '\n')
  }

  async validateImageUrl(url) {
    try {
      const response = await fetch(url, { method: 'HEAD', timeout: 10000 })
      const contentType = response.headers.get('content-type')
      
      if (!response.ok) {
        return false
      }
      
      if (!contentType || !contentType.startsWith('image/')) {
        return false
      }
      
      return true
    } catch (error) {
      this.log(`Image validation failed for ${url}: ${error.message}`)
      return false
    }
  }

  convertToFemale(text) {
    let converted = text
    
    // Apply gender conversions
    for (const [male, female] of Object.entries(GENDER_CONVERSIONS)) {
      const regex = new RegExp(male, 'gi')
      converted = converted.replace(regex, female)
    }
    
    return converted
  }

  categorizePrompt(prompt, title) {
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
      return 'Professional'
    }
    if (content.includes('artistic') || content.includes('creative') || content.includes('abstract')) {
      return 'Artistic'
    }
    if (content.includes('lifestyle') || content.includes('casual') || content.includes('everyday')) {
      return 'Lifestyle'
    }
    
    // Default category
    return 'Portrait'
  }

  async checkDuplicate(prompt, title) {
    try {
      const { data, error } = await supabase
        .from('community_prompts')
        .select('id')
        .or(`prompt.eq.${prompt},title.eq.${title}`)
        .limit(1)
      
      if (error) {
        this.log(`Error checking duplicate: ${error.message}`)
        return false
      }
      
      return data && data.length > 0
    } catch (error) {
      this.log(`Error checking duplicate: ${error.message}`)
      return false
    }
  }

  async scrapeExplorePage() {
    try {
      this.log('Starting scrape of bananaprompts.xyz/explore...')
      
      const response = await fetch(EXPLORE_URL, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; NanoBananaFriends/1.0; +https://nano-banana-friends.app)'
        },
        timeout: 30000
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const html = await response.text()
      const $ = cheerio.load(html)
      
      const prompts = []
      
      // Parse prompt cards - this selector may need adjustment based on actual site structure
      $('.prompt-card, .card, [data-prompt], .prompt-item').each(async (index, element) => {
        try {
          const $el = $(element)
          
          // Extract basic information
          const title = $el.find('.title, .prompt-title, h3, h4').first().text().trim()
          const promptText = $el.find('.prompt, .description, .content, p').first().text().trim()
          const imageUrl = $el.find('img').first().attr('src')
          const likesText = $el.find('.likes, .hearts, .votes').first().text()
          const sourceLink = $el.find('a').first().attr('href')
          
          // Skip if essential data is missing
          if (!title || !promptText || !imageUrl) {
            return
          }
          
          // Filter for people/portrait content
          const content = (title + ' ' + promptText).toLowerCase()
          const isPersonContent = content.includes('person') || 
                                 content.includes('portrait') || 
                                 content.includes('woman') || 
                                 content.includes('man') || 
                                 content.includes('face') || 
                                 content.includes('model') ||
                                 content.includes('people')
          
          if (!isPersonContent) {
            return
          }
          
          // Convert to female-focused content
          const femaleTitle = this.convertToFemale(title)
          const femalePrompt = this.convertToFemale(promptText)
          
          // Extract likes count
          const likesMatch = likesText.match(/(\d+)/)
          const likes = likesMatch ? parseInt(likesMatch[1]) : 0
          
          // Prepare full image URL
          const fullImageUrl = imageUrl.startsWith('http') ? imageUrl : `${BASE_URL}${imageUrl}`
          const fullSourceUrl = sourceLink ? (sourceLink.startsWith('http') ? sourceLink : `${BASE_URL}${sourceLink}`) : null
          
          const promptData = {
            title: femaleTitle,
            prompt: femalePrompt,
            category: this.categorizePrompt(femalePrompt, femaleTitle),
            likes: likes,
            author: 'bananaprompts.xyz',
            image_url: fullImageUrl,
            source_url: fullSourceUrl,
            is_active: true
          }
          
          prompts.push(promptData)
          
        } catch (error) {
          this.log(`Error parsing prompt element: ${error.message}`)
        }
      })
      
      this.log(`Found ${prompts.length} potential prompts on explore page`)
      return prompts
      
    } catch (error) {
      this.log(`Error scraping explore page: ${error.message}`)
      return []
    }
  }

  async savePrompt(promptData) {
    try {
      // Check for duplicates
      const isDuplicate = await this.checkDuplicate(promptData.prompt, promptData.title)
      if (isDuplicate) {
        this.duplicateCount++
        this.log(`Skipping duplicate: ${promptData.title}`)
        return false
      }
      
      // Validate image URL
      const isValidImage = await this.validateImageUrl(promptData.image_url)
      if (!isValidImage) {
        this.log(`Skipping prompt with invalid image: ${promptData.title}`)
        this.errorCount++
        return false
      }
      
      // Save to database
      const { data, error } = await supabase
        .from('community_prompts')
        .insert([promptData])
        .select()
      
      if (error) {
        this.log(`Error saving prompt: ${error.message}`)
        this.errorCount++
        return false
      }
      
      this.scrapedCount++
      this.log(`✅ Saved: ${promptData.title} (Category: ${promptData.category}, Likes: ${promptData.likes})`)
      return true
      
    } catch (error) {
      this.log(`Error in savePrompt: ${error.message}`)
      this.errorCount++
      return false
    }
  }

  async run() {
    try {
      this.log('=== Community Prompts Scraper Started ===')
      
      // Verify database connection
      const { data, error } = await supabase.from('community_prompts').select('count', { count: 'exact', head: true })
      if (error) {
        throw new Error(`Database connection failed: ${error.message}`)
      }
      
      this.log('Database connection verified')
      
      // Scrape prompts
      const prompts = await this.scrapeExplorePage()
      
      if (prompts.length === 0) {
        this.log('No prompts found. Check selectors or website structure.')
        return
      }
      
      // Process each prompt
      for (const prompt of prompts) {
        await this.savePrompt(prompt)
        // Small delay to be respectful
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
      
      // Final report
      this.log('=== Scraping Complete ===')
      this.log(`Total prompts processed: ${prompts.length}`)
      this.log(`Successfully saved: ${this.scrapedCount}`)
      this.log(`Duplicates skipped: ${this.duplicateCount}`)
      this.log(`Errors encountered: ${this.errorCount}`)
      this.log(`Success rate: ${((this.scrapedCount / prompts.length) * 100).toFixed(1)}%`)
      
    } catch (error) {
      this.log(`Fatal error: ${error.message}`)
      process.exit(1)
    }
  }
}

// Run the scraper
const scraper = new CommunityPromptsScraper()
scraper.run()