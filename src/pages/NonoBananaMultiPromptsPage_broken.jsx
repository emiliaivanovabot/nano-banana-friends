import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { SecureLogger, ApiLogger } from '../utils/secure-logger.js'
import { createClient } from '@supabase/supabase-js'
import RecentImagesHistory from '../components/RecentImagesHistory.jsx'
import UserInspoGallery from '../components/UserInspoGallery.jsx'
import { uploadAndSaveImage } from '../utils/imageUpload.js'
import SwipeHandler from '../utils/SwipeHandler.js'

// Premium Dropdown Component - Bulletproof Portal-based
function PremiumDropdown({ label, value, onChange, options }) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedOption, setSelectedOption] = useState(
    options.find(opt => opt.value === value) || options[0]
  )
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })
  
  const triggerRef = useRef(null)
  const menuRef = useRef(null)

  // Update selectedOption when value prop changes
  useEffect(() => {
    const newOption = options.find(opt => opt.value === value)
    if (newOption && newOption !== selectedOption) {
      setSelectedOption(newOption)
    }
  }, [value, options, selectedOption])

  // Calculate dropdown position when opening
  const updatePosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const scrollY = window.scrollY || document.documentElement.scrollTop
      const scrollX = window.scrollX || document.documentElement.scrollLeft
      
      setDropdownPosition({
        top: rect.bottom + scrollY + 8,
        left: rect.left + scrollX,
        width: rect.width
      })
    }
  }

  const handleSelect = (option) => {
    setSelectedOption(option)
    onChange(option.value)
    setIsOpen(false)
  }

  const toggleDropdown = () => {
    if (!isOpen) {
      updatePosition()
    }
    setIsOpen(!isOpen)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (triggerRef.current && !triggerRef.current.contains(event.target) &&
          menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    const handleScroll = () => {
      if (isOpen) {
        updatePosition()
      }
    }

    const handleResize = () => {
      if (isOpen) {
        updatePosition()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
      document.addEventListener('scroll', handleScroll, true)
      window.addEventListener('resize', handleResize)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
        document.removeEventListener('touchstart', handleClickOutside)
        document.removeEventListener('scroll', handleScroll, true)
        window.removeEventListener('resize', handleResize)
      }
    }
  }, [isOpen])

  // Render dropdown menu as portal
  const renderDropdownMenu = () => {
    if (!isOpen) return null

    return createPortal(
      <div
        ref={menuRef}
        className="premium-dropdown-menu"
        style={{
          position: 'absolute',
          top: `${dropdownPosition.top}px`,
          left: `${dropdownPosition.left}px`,
          width: `${dropdownPosition.width}px`,
          zIndex: 999999999
        }}
      >
        {options.map((option) => (
          <div
            key={option.value}
            onClick={() => handleSelect(option)}
            className={`dropdown-option ${
              option.value === selectedOption.value ? 'selected' : ''
            }`}
          >
            <div className="option-content">
              <div className="option-label">{option.label}</div>
              <div className="option-description">{option.description}</div>
            </div>
            {option.value === selectedOption.value && (
              <div className="option-check">✓</div>
            )}
          </div>
        ))}
      </div>,
      document.body
    )
  }

  return (
    <div className="premium-dropdown-wrapper">
      {label && (
        <label className="premium-dropdown-label">
          <span className="label-icon">⚙️</span>
          {label}
        </label>
      )}
      
      <div 
        ref={triggerRef}
        className={`premium-dropdown-container ${isOpen ? 'open' : ''}`}
        style={{ 
          position: 'relative',
          zIndex: isOpen ? 1000 : 999
        }}
      >
        <button
          type="button"
          onClick={toggleDropdown}
          className="premium-dropdown-trigger"
          aria-expanded={isOpen}
        >
          <div className="dropdown-value-section">
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span className="dropdown-main-value">
                {selectedOption.label}
              </span>
              {selectedOption.description && (
                <span className="dropdown-description" style={{ fontSize: '0.8rem', color: '#6B7280', fontWeight: '400' }}>
                  {selectedOption.description}
                </span>
              )}
            </div>
          </div>
          <div className={`dropdown-chevron ${isOpen ? 'rotated' : ''}`}>
            ⌄
          </div>
        </button>
      </div>

      {renderDropdownMenu()}
    </div>
  )
}

function NonoBananaMultiPromptsPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [prompt, setPrompt] = useState('')
  const [images, setImages] = useState([])
  const [userGender, setUserGender] = useState('female') // Default to female (90% of users)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [resolution, setResolution] = useState('2K')
  const [aspectRatio, setAspectRatio] = useState('9:16')
  const [userSettings, setUserSettings] = useState(null)
  const [showMainFaceImage, setShowMainFaceImage] = useState(true)
  const [generationTime, setGenerationTime] = useState(null)
  const [liveTimer, setLiveTimer] = useState(0)
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [templatesCollapsed, setTemplatesCollapsed] = useState(true)
  const [showPersonalization, setShowPersonalization] = useState(true)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [multiResults, setMultiResults] = useState([])
  const [multiLoading, setMultiLoading] = useState(false)
  const [multiTimer, setMultiTimer] = useState(0)
  const [multiResults10, setMultiResults10] = useState([])
  const [multiLoading10, setMultiLoading10] = useState(false)
  const [multiTimer10, setMultiTimer10] = useState(0)
  const [personalAppearanceText, setPersonalAppearanceText] = useState('')
  const [isEditingPersonalText, setIsEditingPersonalText] = useState(false)
  const [usePersonalization, setUsePersonalization] = useState(true)
  
  const fileRef = useRef(null)

  // Generate natural personalization text from user settings
  const generatePersonalizationText = () => {
    if (!userSettings) return ""
    
    const parts = []
    
    // Age - convert to natural description
    if (userSettings.age_range) {
      switch(userSettings.age_range) {
        case 'under-20': parts.push("A teenage woman"); break;
        case 'young-adult': parts.push("A young adult woman"); break;
        case 'adult': parts.push("A confident woman"); break;
        case 'over-40': parts.push("A mature woman"); break;
        default: parts.push("A woman"); break;
      }
    }
    
    const details = []
    
    // Hair
    if (userSettings.hair_color) {
      details.push(`${userSettings.hair_color.toLowerCase()} hair`)
    }
    
    // Eyes  
    if (userSettings.eye_color) {
      details.push(`${userSettings.eye_color.toLowerCase()} eyes`)
    }
    
    // Skin
    if (userSettings.skin_tone) {
      details.push(`${userSettings.skin_tone.toLowerCase()} skin tone`)
    }
    
    // Build the base sentence
    let baseText = ""
    if (parts.length === 0) parts.push("A woman")
    
    if (details.length > 0) {
      baseText = `${parts[0]} with ${details.join(", ")}`
    } else {
      baseText = parts[0]
    }
    
    // Add personal appearance text if available AND toggle is enabled
    if (usePersonalization && personalAppearanceText.trim()) {
      return `${baseText}, ${personalAppearanceText.trim()}`
    }
    
    return baseText
  }

  // Load user settings on component mount
  useEffect(() => {
    const loadUserSettings = async () => {
      if (!user?.id) return

      try {
        // Use service role for user data access (RLS bypass)
        const supabase = createClient(
          import.meta.env.VITE_SUPABASE_URL,
          import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
        )

        const { data, error } = await supabase
          .from('users')
          .select('default_resolution, default_aspect_ratio, main_face_image_url, gemini_api_key, hair_color, eye_color, skin_tone, age_range, personal_appearance_text, use_personalization, use_personal_appearance_text')
          .eq('id', user.id)
          .single()

        if (error) throw error

        if (data) {
          // Secure logging - never log API keys
          console.log('Loaded user settings:', {
            default_resolution: data.default_resolution,
            default_aspect_ratio: data.default_aspect_ratio, 
            has_face_image: !!data.main_face_image_url,
            has_api_key: !!data.gemini_api_key,
            hair_color: data.hair_color,
            eye_color: data.eye_color,
            skin_tone: data.skin_tone,
            age_range: data.age_range,
            use_personalization: data.use_personalization,
            use_personal_appearance_text: data.use_personal_appearance_text,
            showMainFaceImage: showMainFaceImage
          })
          setUserSettings(data)
          setResolution(data.default_resolution || '2K')
          setAspectRatio(data.default_aspect_ratio || '9:16')
          setPersonalAppearanceText(data.personal_appearance_text || '')
          setShowPersonalization(data.use_personalization !== false) // Set from database
          setUsePersonalization(data.use_personal_appearance_text !== false) // Set text toggle from database
          
        } else {
          console.log('No user settings data found')
        }
      } catch (error) {
        console.error('Error loading user settings:', error)
      }
    }

    loadUserSettings()
  }, [user?.id])

  // Save personal appearance text to database
  const savePersonalAppearanceText = async (newText) => {
    if (!user?.id) return

    try {
      const supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
      )

      const { error } = await supabase
        .from('users')
        .update({ personal_appearance_text: newText })
        .eq('id', user.id)

      if (error) throw error

      console.log('Personal appearance text saved successfully')
    } catch (error) {
      console.error('Error saving personal appearance text:', error)
    }
  }

  // Handle imported prompts from URL parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    const importedPrompt = searchParams.get('prompt')
    if (importedPrompt) {
      // Safe decoding with try/catch to prevent crashes
      let decodedPrompt = importedPrompt
      try {
        decodedPrompt = decodeURIComponent(importedPrompt)
      } catch (error) {
        console.warn('Failed to decode prompt, using as-is:', error)
        // Use the prompt as-is if decoding fails
      }
      
      // If user has uploaded images OR has saved face image AND it's visible, automatically add face instructions
      if (images.length > 0 || (userSettings?.main_face_image_url && showMainFaceImage)) {
        const faceInstruction = userGender === 'female' 
          ? "Use my uploaded photo to maintain my exact facial features, skin tone, eye color, and hair as a woman."
          : "Use my uploaded photo to maintain my exact facial features, skin tone, eye color, and hair as a man."
        
        setPrompt(`${faceInstruction} ${decodedPrompt}`)
      } else {
        setPrompt(decodedPrompt)
      }
      
      // Clear the URL parameter after import
      window.history.replaceState({}, '', '/nono-banana')
    }
  }, [location, images.length, userGender, userSettings?.main_face_image_url, showMainFaceImage])

  // Handle prompt from Inspiration page navigation
  useEffect(() => {
    if (location.state?.fromInspiration && location.state?.promptText) {
      console.log('🎨 Prompt from Inspiration page:', location.state.promptText.substring(0, 50) + '...');
      
      // Check if we should add face instruction
      if (images.length > 0 || (userSettings?.main_face_image_url && showMainFaceImage)) {
        const faceInstruction = userGender === 'female' 
          ? "Use my uploaded photo to maintain my exact facial features, skin tone, eye color, and hair as a woman. "
          : "Use my uploaded photo to maintain my exact facial features, skin tone, eye color, and hair as a man. ";
        
        setPrompt(`${faceInstruction}${location.state.promptText}`);
      } else {
        setPrompt(location.state.promptText);
      }
      
      // Clear the navigation state
      window.history.replaceState({}, '', '/nono-banana');
    }
  }, [location.state, userSettings, images, userGender, showMainFaceImage]);

  // Mobile resize detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Optimized touch gesture handling for mobile swipe navigation
  useEffect(() => {
    if (!isMobile) return

    const swipeHandler = new SwipeHandler({
      minSwipeDistance: 180, // Increased from 120px - requires longer swipe distance
      maxVerticalMovement: 60, // Reduced from 80px - more strict vertical tolerance
      maxSwipeTime: 1000,
      minVelocity: 0.5, // Increased from 0.3 - requires faster/more deliberate swipe
      edgeThreshold: 30,
      maxTransform: 15,
      maxOpacity: 0.15,
      transformThreshold: 40, // Increased from 25px - visual feedback starts later
      feedbackDuration: 300,
      navigationDelay: 180,
      debug: false, // Set to true for debugging
      
      onSwipeRight: () => {
        navigate('/')
      },
      
      onSwipeStart: () => {
        // Optional: Add any start feedback
        console.log('Swipe gesture started')
      },
      
      onSwipeCancel: () => {
        // Optional: Handle cancelled swipes
        console.log('Swipe gesture cancelled')
      }
    })

    swipeHandler.attach()

    return () => {
      swipeHandler.detach()
    }
  }, [isMobile, navigate])

  // Prompt-Vorlagen für AI Model Shootings
  const promptTemplates = [
    {
      category: "Beauty & Close-ups",
      prompts: [
        "Using the provided image as reference, recreate this woman's face with extremely high fidelity. Create a high-end beauty portrait with flawless makeup, focus on eyes and lips, soft studio lighting, clean background, luxury beauty campaign style. Keep every facial feature exactly the same — eyes, nose, lips, eyebrows, bone structure. Enhance micro-details only: visible skin pores, natural skin texture, realistic highlights, soft shadows and depth. Maintain the original look, identity and proportions. Ultra-high resolution details.",
        "Using the provided image, recreate this woman's face with perfect accuracy. Create a glamour headshot with dramatic makeup and smoky eyes, professional beauty lighting, focus on facial features, magazine beauty editorial style. Keep all original facial features unchanged, enhance clarity and detail only.",
        "Using the provided image as base, recreate this woman's natural beauty with minimal makeup, glowing skin, soft natural lighting, clean simple background, fresh and organic beauty aesthetic. Maintain exact facial features, enhance skin texture and natural glow only."
      ]
    },
    {
      category: "Realistic",
      prompts: [
        "Take the provided image and recreate it with increased realism while keeping the woman's identity, pose, facial features, expression, lighting, and composition fully intact. Enhance natural skin texture, pores, micro-details, subtle facial hairs, light reflections, shadows, and depth. Improve fabric realism, color accuracy, contrast, and photographic clarity. Do not change her face, makeup, proportions, hairstyle, or clothing design — only make everything more realistic and true-to-life.",
        "Using the provided image as reference, enhance photorealistic details while preserving the exact identity and composition. Add natural skin imperfections, realistic hair texture, authentic fabric details, improved lighting depth, and enhanced shadows. Maintain all original facial features, expressions, and poses unchanged. Focus on making the image look like a high-quality professional photograph with natural authenticity.",
        "Transform the provided image into ultra-realistic photography while maintaining complete fidelity to the original subject. Enhance surface textures, add realistic environmental lighting, improve material properties, and increase photographic authenticity. Preserve every aspect of the woman's appearance, pose, and setting exactly as shown. Only enhance realism, depth, and photographic quality without altering any visual elements."
      ]
    }
  ]

  const insertPromptTemplate = (template, categoryIndex, promptIndex) => {
    setPrompt(template)
    setSelectedTemplate(`${categoryIndex}-${promptIndex}`)
  }

  const handleImageUpload = (e, gender = 'female') => {
    const files = Array.from(e.target.files)
    if (files.length > 14) {
      alert('Maximal 14 Bilder erlaubt')
      return
    }

    // Set gender based on which upload button was used
    setUserGender(gender)
    
    // Store gender and upload status in localStorage for Community Prompts
    localStorage.setItem('userGender', gender)
    localStorage.setItem('hasUploadedImages', 'true')

    Promise.all(
      files.map(file => {
        return new Promise((resolve) => {
          const reader = new FileReader()
          reader.onload = (e) => resolve({
            file: file,
            base64: e.target.result,
            name: file.name
          })
          reader.readAsDataURL(file)
        })
      })
    ).then(newImages => {
      setImages(prev => [...prev, ...newImages].slice(0, 14))
    })
  }

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  const clearAllImages = () => {
    setImages([])
  }

  const downloadImage = () => {
    if (!result?.image) return
    
    try {
      // Convert base64 to blob for proper download
      const base64Data = result.image.split(',')[1] // Remove data:image/png;base64, prefix
      const mimeType = result.image.split(',')[0].split(':')[1].split(';')[0] // Extract MIME type
      
      // Convert base64 to binary
      const binaryData = atob(base64Data)
      const bytes = new Uint8Array(binaryData.length)
      for (let i = 0; i < binaryData.length; i++) {
        bytes[i] = binaryData.charCodeAt(i)
      }
      
      // Create blob and download
      const blob = new Blob([bytes], { type: mimeType })
      const url = URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `nano-banana-${Date.now()}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Clean up
      URL.revokeObjectURL(url)
    } catch (error) {
      SecureLogger.error('Download failed', error)
      // Fallback to simple download
      const link = document.createElement('a')
      link.href = result.image
      link.download = `nano-banana-${Date.now()}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const generateImage = async () => {
    if (!prompt.trim()) {
      alert('Bitte gib einen Prompt ein')
      return
    }

    setLoading(true)
    
    // Prevent mobile sleep during generation
    let wakeLock = null
    try {
      if ('wakeLock' in navigator) {
        wakeLock = await navigator.wakeLock.request('screen')
        console.log('📱 Wake Lock activated - phone will stay awake')
      }
    } catch (err) {
      console.log('Wake Lock not supported or failed:', err)
    }
    setResult(null)
    setGenerationTime(null)
    setLiveTimer(0)
    const startTime = Date.now()

    // Live Timer während Generierung
    const timerInterval = setInterval(() => {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
      setLiveTimer(elapsed)
    }, 100) // Update alle 100ms

    // Retry-Funktion mit exponential backoff
    const makeApiCall = async (retryCount = 0) => {
      const maxRetries = 3
      
      try {
        // Gemini API Call aufbauen - INDIVIDUELLER USER API KEY
        const apiKey = userSettings?.gemini_api_key
        const model = import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.5-flash-image'
        
        if (!apiKey) {
          const error = 'Dein Gemini API Key fehlt. Bitte gehe zu Settings und trage ihn ein.'
          ApiLogger.logError('Gemini', 'User API Key Missing', { hasUserKey: false, userId: user?.id })
          throw new Error(error)
        }
        
        SecureLogger.debug('Gemini API initialized', { model, hasUserApiKey: true, userId: user?.id })

        // Build final prompt with personalization if enabled and face image is visible
        let finalPrompt = prompt
        if (showPersonalization && userSettings?.main_face_image_url && showMainFaceImage && userSettings) {
          const personalizationText = generatePersonalizationText()
          if (personalizationText) {
            finalPrompt = `${personalizationText}. ${prompt}`
          }
        }
        
        // Nano Banana Pro API Format (echte Dokumentation)
        const parts = [
          { text: finalPrompt }
        ]
        
        // Hauptgesichtsbild hinzufügen (falls sichtbar)
        if (userSettings?.main_face_image_url && showMainFaceImage) {
          try {
            const response = await fetch(userSettings.main_face_image_url)
            const blob = await response.blob()
            const base64Data = await new Promise((resolve) => {
              const reader = new FileReader()
              reader.onload = () => resolve(reader.result)
              reader.readAsDataURL(blob)
            })
            
            const base64String = base64Data.split(',')[1] // Remove "data:image/...;base64," prefix
            const mimeType = base64Data.split(';')[0].split(':')[1] // Extract MIME type
            
            parts.push({
              inline_data: {
                mime_type: mimeType,
                data: base64String
              }
            })
            console.log('Main face image added to generation') // Debug
          } catch (error) {
            console.warn('Failed to load main face image for generation:', error)
          }
        }
        
        // Zusätzliche Bilder hinzufügen (base64 ohne data: prefix)
        images.forEach(img => {
          const base64Data = img.base64.split(',')[1] // Remove "data:image/...;base64," prefix
          const mimeType = img.base64.split(';')[0].split(':')[1] // Extract MIME type
          
          parts.push({
            inline_data: {
              mime_type: mimeType,
              data: base64Data
            }
          })
        })

        // Gemini API Request Body (basierend auf Error Message)
        const requestBody = {
          contents: [{
            role: "user",
            parts: parts
          }],
          generationConfig: {
            response_modalities: ['TEXT', 'IMAGE'],
            image_config: {
              aspect_ratio: aspectRatio,
              image_size: resolution
            }
          }
        }

        // Nur unterstützte generation_config Felder verwenden
        // (Die Error Message zeigt, dass responseModal, aspect_ratio, quality nicht unterstützt sind)

        ApiLogger.logRequest('Gemini', 'generateContent', {
          model,
          attempt: retryCount + 1,
          imageCount: images.length,
          resolution,
          aspectRatio
        })

        // Nano Banana Pro API Call (echte Dokumentation)
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': apiKey  // lowercase per Dokumentation
            },
            body: JSON.stringify(requestBody)
          }
        )

        if (!response.ok) {
          const errorText = await response.text()
          ApiLogger.logError('Gemini', 'API Request Failed', {
            status: response.status,
            statusText: response.statusText
          })
          
          // Bei Rate Limit (429) oder Server Overload (503) retry mit exponential backoff
          if ((response.status === 429 || response.status === 503) && retryCount < maxRetries) {
            const waitTime = 1000 * Math.pow(2, retryCount) // 1s, 2s, 4s
            const statusMessage = response.status === 503 ? 'Server überlastet' : 'Rate Limited'
            SecureLogger.info(`${statusMessage}. Retrying in ${waitTime}ms`)
            await new Promise(resolve => setTimeout(resolve, waitTime))
            return makeApiCall(retryCount + 1)
          }
          
          // Spezielle Behandlung für 503 Server Overload
          if (response.status === 503) {
            throw new Error(`Das Gemini-Modell ist momentan überlastet. Bitte versuche es in 1-2 Minuten nochmal. 🤖`)
          }
          
          try {
            const errorJson = JSON.parse(errorText)
            throw new Error(`Gemini API Error: ${response.status} - ${errorJson.error?.message || errorText}`)
          } catch {
            throw new Error(`Gemini API Error: ${response.status} ${response.statusText} - ${errorText}`)
          }
        }

        return response
      } catch (error) {
        if (retryCount < maxRetries && (error.message.includes('429') || error.message.includes('rate') || error.message.includes('503') || error.message.includes('überlastet'))) {
          const waitTime = 1000 * Math.pow(2, retryCount)
          SecureLogger.info(`API error occurred, retrying in ${waitTime}ms`)
          await new Promise(resolve => setTimeout(resolve, waitTime))
          return makeApiCall(retryCount + 1)
        }
        throw error
      }
    }

    try {
      const response = await makeApiCall()

      const data = await response.json()
      ApiLogger.logResponse('Gemini', true, {
        candidatesCount: data.candidates?.length || 0,
        hasContent: !!(data.candidates?.[0]?.content)
      })

      // Response verarbeiten - detailliertes Debugging
      if (data.candidates && data.candidates[0]) {
        SecureLogger.debug('Candidate found in response')
        
        // Enhanced finishReason Check
        const finishReason = data.candidates[0].finishReason
        if (finishReason && finishReason !== 'STOP') {
          const endTime = Date.now()
          const duration = ((endTime - startTime) / 1000).toFixed(1)
          setGenerationTime(`${duration}s`)
          
          let messages = []
          
          if (finishReason === 'IMAGE_SAFETY' || finishReason === 'SAFETY') {
            messages = [
              "Du bist zu hot! 🔥",
              "Wow, zu heiß für Gemini! 🌶️",
              "Das ist zu spicy! 🌶️🔥",
              "Gemini kann nicht mit dieser Hitze! 😅",
              "Zu hot to handle! 🔥💥",
              "Das brennt zu sehr! 🔥",
              "Gemini braucht kaltes Wasser! 💧🔥",
              "Safety first, aber du bist fire! 🔥🛡️",
              "Gemini ist heute schüchtern! 😳🔥",
              "Too spicy for Google! 🌶️💨"
            ]
          } else if (finishReason === 'LENGTH' || finishReason === 'MAX_TOKENS') {
            messages = [
              "Gemini ist aus der Puste! 😵‍💫",
              "Token-Limit erreicht! 🏃‍♂️💨",
              "Gemini braucht eine Pause! ☕",
              "Zu viele Wörter für Gemini! 📚💤",
              "Gemini ist müde geworden! 😴",
              "Das war zu viel Text! 📄💥",
              "Gemini hat einen Krampf! 🤖⚡",
              "Token-Tank ist leer! ⛽😵"
            ]
          } else if (finishReason === 'RECITATION') {
            messages = [
              "Dein Prompt ist urheberrechtlich geschützt! 📝⚖️",
              "Das erinnert Gemini an bekannte Werke! 🎭📚",
              "Copyright-Warnung: Zu ähnlich zu existierenden Inhalten! ⚠️",
              "Gemini erkennt geschützte Inhalte in deinem Prompt! 🛡️",
              "Deine Idee klingt nach einem bekannten Werk! 🎨📖",
              "Urheberrecht sagt nein - versuch's anders! 🚫✍️",
              "Zu nah an copyrighted Material! Umformulieren! 🔄"
            ]
          } else {
            // Fallback für unbekannte finishReasons
            messages = [
              "Unbekannter Gemini-Fehler! Probier's nochmal! 🤖❓",
              "Technisches Problem bei der Generierung! 🔧💫",
              "Gemini hatte einen Schluckauf! Neuer Versuch? 🔄",
              "Unerwarteter Server-Fehler! Retry empfohlen! ⚠️",
              "API-Problem: Versuch es in einem Moment nochmal! ⏰",
              "Gemini-Service temporär gestört! 🚨⚡"
            ]
          }
          
          const randomMessage = messages[Math.floor(Math.random() * messages.length)]
          
          setResult({
            text: randomMessage,
            image: null,
            style: { color: 'rgb(177, 82, 224)' }
          })
          return
        }
        
        if (data.candidates[0].content && data.candidates[0].content.parts) {
          const parts = data.candidates[0].content.parts
          SecureLogger.debug('Response parts found', { partsCount: parts.length })
          
          let resultText = ''
          let resultImage = null

          parts.forEach((part, index) => {
            SecureLogger.debug(`Processing part ${index}`, { hasText: !!part.text, hasInlineData: !!part.inline_data })
            
            if (part.text) {
              resultText += part.text + ' '
            } else if (part.inline_data && part.inline_data.mime_type && part.inline_data.mime_type.startsWith('image/')) {
              resultImage = `data:${part.inline_data.mime_type};base64,${part.inline_data.data}`
              SecureLogger.debug(`Image found in part ${index}`)
            } else if (part.inlineData && part.inlineData.mimeType && part.inlineData.mimeType.startsWith('image/')) {
              // Alternative naming format
              resultImage = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`
              SecureLogger.debug(`Image found in part ${index} (alternative format)`)
            }
          })

          SecureLogger.debug('Processing complete', { hasText: !!resultText.trim(), hasImage: !!resultImage })

          // Extract token usage data from Gemini response
          SecureLogger.debug('🔍 DEBUG: Full Gemini data structure:', data)
          const usageMetadata = data.usageMetadata || {}  // ← FIXED: usageMetadata not usage_metadata!
          SecureLogger.debug('🔍 DEBUG: usageMetadata extracted:', usageMetadata)
          SecureLogger.debug('Token usage extracted', {
            promptTokens: usageMetadata.promptTokenCount || 0,
            outputTokens: usageMetadata.candidatesTokenCount || 0,
            totalTokens: usageMetadata.totalTokenCount || 0
          })

          if (resultImage || resultText.trim()) {
            const endTime = Date.now()
            const duration = ((endTime - startTime) / 1000).toFixed(1)
            setGenerationTime(`${duration}s`)
            
            setResult({
              text: resultText.trim() || 'Bild erfolgreich generiert!',
              image: resultImage
            })
            
            // Auto-save image to database and FTP (non-blocking)
            if (resultImage && user?.username) {
              uploadAndSaveImage(
                resultImage, 
                user.username, 
                'single', 
                prompt, 
                0, 
                resolution, 
                parseFloat(duration), // Pass raw seconds as number
                usageMetadata, // Pass token data to upload function
                aspectRatio // Pass actual aspect ratio
              )
                .then(result => {
                  if (result.success) {
                    console.log('✅ Image automatically saved:', result.filename)
                  } else {
                    console.error('❌ Auto-save failed:', result.error)
                  }
                })
                .catch(error => {
                  console.error('❌ Auto-save error:', error)
                })
            }
          } else {
            SecureLogger.warn('No valid image or text found in response parts')
            throw new Error('Keine gültigen Daten in der Antwort erhalten')
          }
        } else {
          SecureLogger.warn('No content.parts found in candidate')
          const endTime = Date.now()
          const duration = ((endTime - startTime) / 1000).toFixed(1)
          setGenerationTime(`${duration}s`)
          
          const messages = [
            "Du bist zu hot! 🔥",
            "Wow, zu heiß für Gemini! 🌶️",
            "Das ist zu spicy! 🌶️🔥",
            "Gemini kann nicht mit dieser Hitze! 😅",
            "Zu hot to handle! 🔥💥",
            "Das brennt zu sehr! 🔥",
            "Gemini braucht kaltes Wasser! 💧🔥",
            "Safety first, aber du bist fire! 🔥🛡️",
            "Gemini ist heute schüchtern! 😳🔥",
            "Too spicy for Google! 🌶️💨"
          ]
          
          const randomMessage = messages[Math.floor(Math.random() * messages.length)]
          
          setResult({
            text: randomMessage,
            image: null,
            style: { color: 'rgb(177, 82, 224)' }
          })
          return
        }
      } else {
        SecureLogger.warn('No candidates found in response')
        throw new Error('Keine candidates in der API-Antwort gefunden')
      }

    } catch (error) {
      const endTime = Date.now()
      const duration = ((endTime - startTime) / 1000).toFixed(1)
      setGenerationTime(`${duration}s`)
      
      ApiLogger.logError('Gemini', error, { operation: 'Image Generation' })
      alert(`Fehler: ${error.message}`)
    } finally {
      clearInterval(timerInterval)
      setLoading(false)
      
      // Release wake lock
      if (wakeLock) {
        try {
          await wakeLock.release()
          console.log('📱 Wake Lock released - phone can sleep again')
        } catch (err) {
          console.log('Wake Lock release failed:', err)
        }
      }
    }
  }

  // 4x Parallel Generation Function - CORRECT VERSION
  const generate4Images = async () => {
    if (!prompt.trim()) {
      alert('Bitte gib einen Prompt ein')
      return
    }

    setMultiLoading(true)
    setMultiResults([])
    setMultiTimer(0)
    const startTime = Date.now()

    // Live Timer für 4x Generierung
    const timerInterval = setInterval(() => {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
      setMultiTimer(elapsed)
    }, 100)

    // Wake Lock für mobile
    let wakeLock = null
    try {
      if ('wakeLock' in navigator) {
        wakeLock = await navigator.wakeLock.request('screen')
      }
    } catch (err) {
      console.log('Wake Lock failed:', err)
    }

    // Funktion für einzelne API-Call (EXAKTE KOPIE der echten generateImage Logik)
    const makeSingleCall = async (index) => {
      try {
        const apiKey = userSettings?.gemini_api_key
        const model = import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.5-flash-image'
        
        if (!apiKey) {
          throw new Error('API Key fehlt')
        }

        // Build final prompt with personalization (EXAKT wie in generateImage)
        let finalPrompt = prompt
        if (showPersonalization && userSettings?.main_face_image_url && showMainFaceImage && userSettings) {
          const personalizationText = generatePersonalizationText()
          if (personalizationText) {
            finalPrompt = `${personalizationText}. ${prompt}`
          }
        }
        
        // ECHTE Nano Banana Pro API Format (wie in generateImage)
        const parts = [
          { text: finalPrompt }
        ]
        
        // Hauptgesichtsbild hinzufügen (EXAKT wie in generateImage)
        if (userSettings?.main_face_image_url && showMainFaceImage) {
          try {
            const response = await fetch(userSettings.main_face_image_url)
            const blob = await response.blob()
            const base64Data = await new Promise((resolve) => {
              const reader = new FileReader()
              reader.onload = () => resolve(reader.result)
              reader.readAsDataURL(blob)
            })
            
            const base64String = base64Data.split(',')[1]
            const mimeType = base64Data.split(';')[0].split(':')[1]
            
            parts.push({
              inline_data: {
                mime_type: mimeType,
                data: base64String
              }
            })
          } catch (error) {
            console.warn('Failed to load main face image for generation:', error)
          }
        }
        
        // Zusätzliche Bilder hinzufügen (EXAKT wie in generateImage)
        images.forEach(img => {
          const base64Data = img.base64.split(',')[1]
          const mimeType = img.base64.split(';')[0].split(':')[1]
          
          parts.push({
            inline_data: {
              mime_type: mimeType,
              data: base64Data
            }
          })
        })

        // ECHTE Gemini API Request Body (wie in generateImage)
        const requestBody = {
          contents: [{
            role: "user",
            parts: parts
          }],
          generationConfig: {
            response_modalities: ['TEXT', 'IMAGE'],
            image_config: {
              aspect_ratio: aspectRatio,
              image_size: resolution
            }
          }
        }

        // ECHTE Nano Banana Pro API Call (wie in generateImage)
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': apiKey
            },
            body: JSON.stringify(requestBody)
          }
        )

        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`)
        }

        const data = await response.json()

        if (data.candidates && data.candidates[0]) {
          // Safety Filter Check (EXAKT wie in generateImage)
          if (data.candidates[0].finishReason === 'IMAGE_SAFETY') {
            return {
              success: false,
              error: 'Safety Filter blockiert',
              index
            }
          }
          
          // ECHTE Response Processing (wie in generateImage)
          if (data.candidates[0].content && data.candidates[0].content.parts) {
            const parts = data.candidates[0].content.parts
            
            let resultText = ''
            let resultImage = null

            parts.forEach((part, partIndex) => {
              if (part.text) {
                resultText += part.text + ' '
              } else if (part.inline_data && part.inline_data.mime_type && part.inline_data.mime_type.startsWith('image/')) {
                resultImage = `data:${part.inline_data.mime_type};base64,${part.inline_data.data}`
                console.log(`🖼️ Image found in part ${partIndex} (inline_data format)`)
              } else if (part.inlineData && part.inlineData.mimeType && part.inlineData.mimeType.startsWith('image/')) {
                // Alternative naming format (EXAKT wie im einzelnen!)
                resultImage = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`
                console.log(`🖼️ Image found in part ${partIndex} (inlineData format)`)
              }
            })

            console.log(`🍌 Index ${index}: resultText="${resultText.trim()}", hasImage=${!!resultImage}`)

            return {
              success: true,
              text: resultText.trim(),
              image: resultImage,
              index
            }
          }
        }

        throw new Error('Keine gültige Antwort erhalten')

      } catch (error) {
        return {
          success: false,
          error: error.message,
          index
        }
      }
    }

    try {
      // 4 parallele API-Calls
      const promises = [0, 1, 2, 3].map(index => makeSingleCall(index))
      const results = await Promise.all(promises)
      
      const endTime = Date.now()
      const duration = ((endTime - startTime) / 1000).toFixed(1)

      const finalResults = results.map(result => ({
        ...result,
        generationTime: duration
      }))
      
      console.log('🍌🍌🍌🍌 4x Generation Results:', finalResults)
      setMultiResults(finalResults)
      
      // Auto-save all successful images (non-blocking)
      if (user?.username) {
        finalResults.forEach((result, index) => {
          if (result.success && result.image) {
            // Create estimated token metadata based on live test data
            // 4K single generation = 2686 tokens (350 prompt + 2336 output from live test)
            const estimatedTokens = resolution === '4K' ? 2686 : 
                                   resolution === '2K' ? 1800 : 1200 // Estimates for 2K/1K
            const estimatedUsageMetadata = {
              promptTokenCount: Math.round(estimatedTokens * 0.13), // 13% prompt tokens from live data
              candidatesTokenCount: Math.round(estimatedTokens * 0.87), // 87% output tokens from live data  
              totalTokenCount: estimatedTokens
            }
            
            uploadAndSaveImage(
              result.image, 
              user.username, 
              '4x', 
              prompt, 
              index, 
              resolution, 
              index === 0 ? generationTime : null, 
              estimatedUsageMetadata,
              aspectRatio // Pass actual aspect ratio
            )
              .then(uploadResult => {
                if (uploadResult.success) {
                  console.log(`✅ 4x Image ${index + 1} automatically saved:`, uploadResult.filename)
                } else {
                  console.error(`❌ 4x Auto-save failed for image ${index + 1}:`, uploadResult.error)
                }
              })
              .catch(error => {
                console.error(`❌ 4x Auto-save error for image ${index + 1}:`, error)
              })
          }
        })
      }

    } catch (error) {
      console.error('4x Generation Error:', error)
      alert('Fehler bei 4x Generierung: ' + error.message)
    } finally {
      setMultiLoading(false)
      clearInterval(timerInterval)
      
      // Wake Lock freigeben
      if (wakeLock) {
        try {
          await wakeLock.release()
        } catch (err) {
          console.log('Wake Lock release failed:', err)
        }
      }
    }
  }

  // 10x Parallel Generation Function - EXAKTE KOPIE von 4x
  const generate10Images = async () => {
    if (!prompt.trim()) {
      alert('Bitte gib einen Prompt ein')
      return
    }

    setMultiLoading10(true)
    setMultiResults10([])
    setMultiTimer10(0)
    const startTime = Date.now()

    // Live Timer für 10x Generierung
    const timerInterval = setInterval(() => {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
      setMultiTimer10(elapsed)
    }, 100)

    // Wake Lock für mobile
    let wakeLock = null
    try {
      if ('wakeLock' in navigator) {
        wakeLock = await navigator.wakeLock.request('screen')
      }
    } catch (err) {
      console.log('Wake Lock failed:', err)
    }

    // Funktion für einzelne API-Call (EXAKTE KOPIE der echten generateImage Logik)
    const makeSingleCall = async (index) => {
      try {
        const apiKey = userSettings?.gemini_api_key
        const model = import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.5-flash-image'
        
        if (!apiKey) {
          throw new Error('API Key fehlt')
        }

        // Build final prompt with personalization (EXAKT wie in generateImage)
        let finalPrompt = prompt
        if (showPersonalization && userSettings?.main_face_image_url && showMainFaceImage && userSettings) {
          const personalizationText = generatePersonalizationText()
          if (personalizationText) {
            finalPrompt = `${personalizationText}. ${prompt}`
          }
        }
        
        // ECHTE Nano Banana Pro API Format (wie in generateImage)
        const parts = [
          { text: finalPrompt }
        ]
        
        // Hauptgesichtsbild hinzufügen (EXAKT wie in generateImage)
        if (userSettings?.main_face_image_url && showMainFaceImage) {
          try {
            const response = await fetch(userSettings.main_face_image_url)
            const blob = await response.blob()
            const base64Data = await new Promise((resolve) => {
              const reader = new FileReader()
              reader.onload = () => resolve(reader.result)
              reader.readAsDataURL(blob)
            })
            
            const base64String = base64Data.split(',')[1]
            const mimeType = base64Data.split(';')[0].split(':')[1]
            
            parts.push({
              inline_data: {
                mime_type: mimeType,
                data: base64String
              }
            })
          } catch (error) {
            console.warn('Failed to load main face image for generation:', error)
          }
        }
        
        // Zusätzliche Bilder hinzufügen (EXAKT wie in generateImage)
        images.forEach(img => {
          const base64Data = img.base64.split(',')[1]
          const mimeType = img.base64.split(';')[0].split(':')[1]
          
          parts.push({
            inline_data: {
              mime_type: mimeType,
              data: base64Data
            }
          })
        })

        // ECHTE Gemini API Request Body (wie in generateImage)
        const requestBody = {
          contents: [{
            role: "user",
            parts: parts
          }],
          generationConfig: {
            response_modalities: ['TEXT', 'IMAGE'],
            image_config: {
              aspect_ratio: aspectRatio,
              image_size: resolution
            }
          }
        }

        // ECHTE Nano Banana Pro API Call (wie in generateImage)
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': apiKey
            },
            body: JSON.stringify(requestBody)
          }
        )

        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`)
        }

        const data = await response.json()

        if (data.candidates && data.candidates[0]) {
          // Safety Filter Check (EXAKT wie in generateImage)
          if (data.candidates[0].finishReason === 'IMAGE_SAFETY') {
            return {
              success: false,
              error: 'Safety Filter blockiert',
              index
            }
          }
          
          // ECHTE Response Processing (wie in generateImage)
          if (data.candidates[0].content && data.candidates[0].content.parts) {
            const parts = data.candidates[0].content.parts
            
            let resultText = ''
            let resultImage = null

            parts.forEach((part, partIndex) => {
              if (part.text) {
                resultText += part.text + ' '
              } else if (part.inline_data && part.inline_data.mime_type && part.inline_data.mime_type.startsWith('image/')) {
                resultImage = `data:${part.inline_data.mime_type};base64,${part.inline_data.data}`
                console.log(`🖼️ Image found in part ${partIndex} (inline_data format)`)
              } else if (part.inlineData && part.inlineData.mimeType && part.inlineData.mimeType.startsWith('image/')) {
                // Alternative naming format (EXAKT wie im einzelnen!)
                resultImage = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`
                console.log(`🖼️ Image found in part ${partIndex} (inlineData format)`)
              }
            })

            console.log(`🍌 Index ${index}: resultText="${resultText.trim()}", hasImage=${!!resultImage}`)

            return {
              success: true,
              text: resultText.trim(),
              image: resultImage,
              index
            }
          }
        }

        throw new Error('Keine gültige Antwort erhalten')

      } catch (error) {
        return {
          success: false,
          error: error.message,
          index
        }
      }
    }

    try {
      // 10 parallele API-Calls
      const promises = Array.from({length: 10}, (_, i) => makeSingleCall(i))
      const results = await Promise.all(promises)
      
      const endTime = Date.now()
      const duration = ((endTime - startTime) / 1000).toFixed(1)

      const finalResults = results.map(result => ({
        ...result,
        generationTime: duration
      }))
      
      console.log('🍌🍌🍌🍌🍌🍌🍌🍌🍌🍌 10x Generation Results:', finalResults)
      setMultiResults10(finalResults)
      
      // Auto-save all successful images (non-blocking)
      if (user?.username) {
        finalResults.forEach((result, index) => {
          if (result.success && result.image) {
            // Create estimated token metadata based on live test data
            // 4K single generation = 2686 tokens (350 prompt + 2336 output from live test)
            const estimatedTokens = resolution === '4K' ? 2686 : 
                                   resolution === '2K' ? 1800 : 1200 // Estimates for 2K/1K
            const estimatedUsageMetadata = {
              promptTokenCount: Math.round(estimatedTokens * 0.13), // 13% prompt tokens from live data
              candidatesTokenCount: Math.round(estimatedTokens * 0.87), // 87% output tokens from live data  
              totalTokenCount: estimatedTokens
            }
            
            uploadAndSaveImage(
              result.image, 
              user.username, 
              '10x', 
              prompt, 
              index, 
              resolution, 
              index === 0 ? generationTime : null, 
              estimatedUsageMetadata,
              aspectRatio // Pass actual aspect ratio
            )
              .then(uploadResult => {
                if (uploadResult.success) {
                  console.log(`✅ 10x Image ${index + 1} automatically saved:`, uploadResult.filename)
                } else {
                  console.error(`❌ 10x Auto-save failed for image ${index + 1}:`, uploadResult.error)
                }
              })
              .catch(error => {
                console.error(`❌ 10x Auto-save error for image ${index + 1}:`, error)
              })
          }
        })
      }

    } catch (error) {
      console.error('10x Generation Error:', error)
      alert('Fehler bei 10x Generierung: ' + error.message)
    } finally {
      setMultiLoading10(false)
      clearInterval(timerInterval)
      
      // Wake Lock freigeben
      if (wakeLock) {
        try {
          await wakeLock.release()
        } catch (err) {
          console.log('Wake Lock release failed:', err)
        }
      }
    }
  }

  // Download function for multi images
  const downloadMultiImage = (imageUrl, index) => {
    if (imageUrl) {
      const link = document.createElement('a')
      link.href = imageUrl
      link.download = `nano-banana-4x-${index + 1}-${Date.now()}.png`
      link.click()
    }
  }

  // Download all 4 images at once
  const downloadAllImages = () => {
    multiResults.forEach((result, index) => {
      if (result.success && result.image) {
        setTimeout(() => {
          downloadMultiImage(result.image, index)
        }, index * 100) // Kleine Verzögerung zwischen Downloads
      }
    })
  }

  // Download all 10 images at once
  const downloadAll10Images = () => {
    multiResults10.forEach((result, index) => {
      if (result.success && result.image) {
        setTimeout(() => {
          downloadMultiImage(result.image, index)
        }, index * 100) // Kleine Verzögerung zwischen Downloads
      }
    })
  }

  return (
    <div className="nano-banana-container" style={{
      background: 'hsl(var(--background))',
      color: 'hsl(var(--foreground))',
      minHeight: '100vh',
      padding: '20px'
    }}>
      
      {/* Header with user info and navigation */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '30px',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%'
        }}>
          {/* Left - Back to Generation Modes */}
          <Link 
            to="/generation-modes" 
            style={{ 
              color: 'hsl(var(--muted-foreground))',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            ← Zurück zur Auswahl
          </Link>
          
          {/* Right - Community Link */}
          <Link 
            to="/community-prompts" 
            style={{ 
              color: 'hsl(var(--muted-foreground))',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Community →
          </Link>
        </div>
        
      </div>
      
      <h1 className="nano-banana-title">
        ⚡ nano banana multi prompts
      </h1>

      {/* Username Display */}
      {user && (
        <div style={{
          textAlign: 'center',
          marginBottom: '16px',
          fontSize: '1.1rem',
          fontWeight: '600',
          color: 'hsl(var(--foreground))',
          fontFamily: "'Space Grotesk', sans-serif"
        }}>
          👋 {user.username}
        </div>
      )}

      {/* Compact Settings - No White Box */}
      <div style={{ 
        marginBottom: '16px',
        fontSize: '0.9rem'
      }}>
        <h3 className="mobile-templates-title" style={{ marginBottom: '8px', textAlign: 'left', fontSize: '1rem' }}>
          Einstellungen
        </h3>
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: '1fr 80px',
          gap: '12px',
          alignItems: 'start'
        }}>
          {/* Left Column: Stacked Buttons */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            height: '80px'
          }}>
            <button
              onClick={() => {
                if (resolution === '1K') setResolution('2K')
                else if (resolution === '2K') setResolution('4K')
                else setResolution('1K')
              }}
              style={{
                padding: '6px 10px',
                background: 'hsl(47 100% 65%)',
                color: 'hsl(var(--primary-foreground))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '0.8rem',
                transition: 'all 0.2s ease',
                height: '36px',
                flex: '1'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'scale(1.02)'
                e.target.style.boxShadow = '0 2px 8px rgba(251, 113, 133, 0.15)'
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)'
                e.target.style.boxShadow = 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span style={{ fontWeight: '600', color: 'hsl(var(--primary-foreground))' }}>{resolution}</span>
                <span style={{ fontSize: '0.7rem', color: 'hsl(var(--primary-foreground))' }}>
                  {resolution === '1K' ? 'Fast' : resolution === '2K' ? 'Optimal' : 'Max'}
                </span>
              </div>
            </button>
            
            <button
              onClick={() => {
                if (aspectRatio === '9:16') setAspectRatio('16:9')
                else if (aspectRatio === '16:9') setAspectRatio('4:3')
                else if (aspectRatio === '4:3') setAspectRatio('3:4')
                else if (aspectRatio === '3:4') setAspectRatio('2:3')
                else if (aspectRatio === '2:3') setAspectRatio('3:2')
                else setAspectRatio('9:16')
              }}
              style={{
                padding: '6px 10px',
                background: 'hsl(280 70% 60%)',
                color: 'hsl(var(--secondary-foreground))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '0.8rem',
                transition: 'all 0.2s ease',
                height: '36px',
                flex: '1'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'scale(1.02)'
                e.target.style.boxShadow = '0 2px 8px rgba(251, 113, 133, 0.15)'
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)'
                e.target.style.boxShadow = 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span style={{ fontWeight: '600', color: 'hsl(var(--secondary-foreground))' }}>{aspectRatio}</span>
                <span style={{ fontSize: '0.7rem', color: 'hsl(var(--secondary-foreground))' }}>
                  {aspectRatio === '9:16' ? 'Story' : 
                   aspectRatio === '16:9' ? 'Widescreen' :
                   aspectRatio === '4:3' ? 'Post' :
                   aspectRatio === '3:4' ? 'Portrait' :
                   aspectRatio === '2:3' ? 'Portrait' : 'Landscape'}
                </span>
              </div>
            </button>
          </div>

          {/* Right Column: Main Face Image Display */}
          <div style={{
            position: 'relative',
            width: '80px',
            height: '80px',
            borderRadius: '8px',
            overflow: 'hidden',
            border: '1px solid rgba(251, 191, 36, 0.3)',
            background: 'hsl(var(--card))'
          }}>
            {userSettings?.main_face_image_url && showMainFaceImage ? (
              <>
                <img 
                  src={userSettings.main_face_image_url}
                  alt="Gesichtsbild"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                  onError={(e) => {
                    console.log('Face image failed to load:', userSettings.main_face_image_url)
                    e.target.style.display = 'none'
                  }}
                />
                <button
                  onClick={() => setShowMainFaceImage(false)}
                  style={{
                    position: 'absolute',
                    top: '2px',
                    right: '2px',
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: 'rgba(0, 0, 0, 0.7)',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    lineHeight: '1'
                  }}
                  title="Gesichtsbild entfernen"
                >
                  ×
                </button>
              </>
            ) : (
              <div style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                color: '#9CA3AF',
                cursor: showMainFaceImage === false ? 'pointer' : 'default'
              }}
              onClick={() => {
                if (showMainFaceImage === false) {
                  setShowMainFaceImage(true) // Wiederherstellen
                }
              }}
              title={showMainFaceImage === false ? "Gesichtsbild wiederherstellen" : "Kein Gesichtsbild verfügbar"}
              >
                👤
                {showMainFaceImage === false && (
                  <div style={{ fontSize: '8px', marginTop: '2px', textAlign: 'center' }}>
                    Klicken zum<br/>Wiederherstellen
                  </div>
                )}
              </div>
            )}
            <div style={{
              position: 'absolute',
              bottom: '2px',
              right: '2px',
              fontSize: '8px',
              background: 'rgba(0,0,0,0.6)',
              color: 'white',
              padding: '1px 3px',
              borderRadius: '3px',
              fontWeight: '500'
            }}>
              Face
            </div>
          </div>
        </div>
      </div>


              <div key={index} style={{ position: 'relative' }}>
                <img 
                  src={img.base64} 
                  alt={img.name}
                  style={{ 
                    width: '100%', 
                    height: '100px', 
                    objectFit: 'cover',
                    borderRadius: '4px',
                    border: '1px solid #D1D5DB'
                  }} 
                />
                <button
                  onClick={() => removeImage(index)}
                  style={{
                    position: 'absolute',
                    top: '2px',
                    right: '2px',
                    background: '#EF4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Collapsible Prompt Templates Section */}
      <div className="mobile-prompt-templates-section">
        <div 
          className="mobile-templates-header" 
          onClick={() => setTemplatesCollapsed(!templatesCollapsed)} 
          style={{ 
            cursor: 'pointer', 
            padding: '8px 16px',
            background: 'hsl(var(--card))',
            borderRadius: '8px',
            border: '1px solid hsl(var(--border))',
            marginBottom: templatesCollapsed ? '8px' : '16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 className="mobile-templates-title" style={{ margin: 0, fontSize: '1rem' }}>
              Prompt Vorlagen
            </h3>
            <span style={{ 
              fontSize: '0.8rem', 
              color: 'hsl(var(--muted-foreground))', 
              transition: 'transform 0.3s ease', 
              transform: templatesCollapsed ? 'rotate(0deg)' : 'rotate(180deg)' 
            }}>
              ▼
            </span>
          </div>
        </div>
        
        {!templatesCollapsed && promptTemplates.map((category, categoryIndex) => (
          <div key={categoryIndex} className="mobile-template-category">
            <div className="mobile-category-header">
              <span className="mobile-category-title">{category.category}</span>
            </div>
            
            <div className="mobile-template-grid">
              {category.prompts.map((template, promptIndex) => {
                const templateId = `${categoryIndex}-${promptIndex}`
                const isSelected = selectedTemplate === templateId
                
                return (
                  <button
                    key={promptIndex}
                    onClick={() => insertPromptTemplate(template, categoryIndex, promptIndex)}
                    className={`mobile-template-button ${isSelected ? 'selected' : ''}`}
                  >
                    <div className="template-button-content">
                      <div className="template-button-title">
                        {/* Studio Business - 3 prompts */}
                        {template.includes('banco alto de madeira') ? 'Wood Bench' :
                         template.includes('black pantsuit') ? 'Office Chair' :
                         template.includes('navy blazer') ? 'Standing Pose' :
                         /* Luxury Chair Poses - 3 prompts */
                         template.includes('white chair') && template.includes('coffee cup') ? 'White Chair' :
                         template.includes('velvet armchair') ? 'Velvet Chair' :
                         template.includes('vintage leather') ? 'Leather Chair' :
                         /* Fashion Editorial - 3 prompts */
                         template.includes('avant-garde') ? 'Avant-garde' :
                         template.includes('oversized blazer') || template.includes('fitted jeans') ? 'Street Style' :
                         template.includes('monochrome outfit') || template.includes('clean lines') ? 'Minimalist' :
                         /* Outdoor Locations - 3 prompts */
                         template.includes('Paris') || template.includes('tower') ? 'Paris Tower' :
                         template.includes('rooftop') || template.includes('flowing dress') ? 'Rooftop' :
                         template.includes('beach') || template.includes('shoreline') ? 'Beach' :
                         /* Beauty & Close-ups - 3 prompts */
                         template.includes('flawless makeup') || template.includes('luxury beauty campaign') ? 'Luxury Beauty' :
                         template.includes('dramatic makeup') || template.includes('smoky eyes') ? 'Glamour Shot' :
                         template.includes('minimal makeup') || template.includes('glowing skin') ? 'Natural Look' :
                         /* Pose Variations - 3 prompts */
                         template.includes('hands on hips') || template.includes('confident stance') ? 'Power Pose' :
                         template.includes('crossed legs') || template.includes('hands placed gracefully') ? 'Elegant Sit' :
                         template.includes('mid-step movement') || template.includes('flowing outfit') ? 'Walking' :
                         /* Realistic - 3 prompts */
                         template.includes('increased realism') || template.includes('natural skin texture') ? 'Enhanced Reality' :
                         template.includes('photorealistic details') || template.includes('natural authenticity') ? 'Photo Details' :
                         template.includes('ultra-realistic photography') || template.includes('photographic quality') ? 'Ultra Realistic' :
                         `Option ${promptIndex + 1}`}
                      </div>
                      {isSelected && <div className="selection-indicator">✓</div>}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Mobile Optimized Prompt Input */}
      <div style={{ 
        marginBottom: '20px',
        padding: '16px',
        background: 'hsl(var(--card))',
        borderRadius: '12px',
        border: '1px solid hsl(var(--border))'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h3 className="mobile-templates-title" style={{ 
            margin: 0, 
            textAlign: 'left',
            fontWeight: '600',
            fontSize: '1.1rem',
            fontFamily: "'Space Grotesk', sans-serif",
            background: 'linear-gradient(135deg, #ec4899 0%, #f59e0b 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Prompt
          </h3>
          {(prompt || selectedTemplate) && (
            <button
              onClick={() => {
                setPrompt('')
                setSelectedTemplate(null)
              }}
              style={{
                background: 'linear-gradient(135deg, #f472b6 0%, #fb7185 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '0.85rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 4px rgba(244, 114, 182, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'scale(1.05)'
                e.target.style.boxShadow = '0 4px 8px rgba(244, 114, 182, 0.4)'
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)'
                e.target.style.boxShadow = '0 2px 4px rgba(244, 114, 182, 0.3)'
              }}
            >
              ✕ Reset
            </button>
          )}
        </div>
        
        {/* Personalization Block - Show when face image is visible */}
        {userSettings?.main_face_image_url && showMainFaceImage && userSettings && (userSettings.hair_color || userSettings.eye_color || userSettings.skin_tone || userSettings.age) && (
          <div style={{
            marginBottom: '15px',
            border: '1px solid rgba(251, 191, 36, 0.3)',
            borderRadius: '8px',
            overflow: 'hidden',
            background: 'hsl(var(--card))'
          }}>
            <button
              onClick={async () => {
                const newValue = !showPersonalization
                setShowPersonalization(newValue)
                
                // Save to database
                try {
                  const supabase = createClient(
                    import.meta.env.VITE_SUPABASE_URL,
                    import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
                  )
                  
                  const { error } = await supabase
                    .from('users')
                    .update({ use_personalization: newValue })
                    .eq('id', user?.id)
                  
                  if (error) {
                    console.error('❌ Database error:', error)
                  } else {
                    console.log('✅ Saved to database:', newValue)
                  }
                } catch (error) {
                  console.error('❌ Exception:', error)
                }
              }}
              style={{
                width: '100%',
                padding: '10px 15px',
                background: showPersonalization ? 'rgba(251, 191, 36, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                border: 'none',
                borderBottom: showPersonalization ? '1px solid rgba(251, 191, 36, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)',
                fontSize: '16px',
                fontWeight: '600',
                color: 'hsl(var(--muted-foreground))',
                fontFamily: "'Space Grotesk', sans-serif",
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <span>Mein Aussehen verwenden</span>
              <div style={{
                marginLeft: 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  color: showPersonalization ? '#00ff41' : '#ff073a',
                  textShadow: showPersonalization ? '0 0 6px #00ff41' : '0 0 6px #ff073a'
                }}>
                  {showPersonalization ? 'Ein' : 'Aus'}
                </span>
                <div style={{
                  fontSize: '16px',
                  color: showPersonalization ? '#00ff41' : '#ff073a',
                  textShadow: showPersonalization ? '0 0 8px #00ff41' : '0 0 8px #ff073a',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  transform: showPersonalization ? 'scale(1.1)' : 'scale(1.0)'
                }}>
                  ⏻
                </div>
              </div>
            </button>
            
            {showPersonalization && (
              <div style={{
                padding: '15px',
                background: 'rgba(251, 191, 36, 0.05)'
              }}>
                {/* Endresultat-Feld */}
                {personalAppearanceText.trim() && (
                  <div style={{
                    marginTop: '10px',
                    padding: '8px',
                    background: 'rgba(34, 197, 94, 0.1)',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: '#059669',
                    fontWeight: '500'
                  }}>
                    <div style={{ marginBottom: '4px', fontWeight: '600' }}>Alles in diesem grünen Feld wird zusätzlich zum Prompt gesendet:</div>
                    {/* Reihe 1: Grauer Text (IMMER angezeigt) */}
                    <div style={{ width: '100%', marginBottom: '4px' }}>
                      <span style={{
                        fontStyle: 'italic',
                        color: '#6B7280',
                        fontWeight: '400',
                        fontSize: '14px'
                      }}>
                        {(() => {
                          // Automatischer Text aus Einstellungen
                          if (!userSettings) return ""
                          
                          const parts = []
                          if (userSettings.age_range) {
                            switch(userSettings.age_range) {
                              case 'under-20': parts.push("A teenage woman"); break;
                              case 'young-adult': parts.push("A young adult woman"); break;
                              case 'adult': parts.push("A confident woman"); break;
                              case 'over-40': parts.push("A mature woman"); break;
                              default: parts.push("A woman"); break;
                            }
                          }
                          
                          const details = []
                          if (userSettings.hair_color) details.push(`${userSettings.hair_color.toLowerCase()} hair`)
                          if (userSettings.eye_color) details.push(`${userSettings.eye_color.toLowerCase()} eyes`)
                          if (userSettings.skin_tone) details.push(`${userSettings.skin_tone.toLowerCase()} skin tone`)
                          
                          if (parts.length === 0) parts.push("A woman")
                          
                          if (details.length > 0) {
                            return `${parts[0]} with ${details.join(", ")}`
                          }
                          return parts[0]
                        })()}
                      </span>
                    </div>
                    
                    {/* Reihe 2: Grüner Text + Toggle */}
                    <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      <div style={{ flex: '1' }}>
                        {usePersonalization && personalAppearanceText.trim() && (
                          <span style={{
                            color: '#D1D5DB',
                            fontWeight: '500',
                            fontSize: '13px'
                          }}>
                            {personalAppearanceText.trim()}
                          </span>
                        )}
                      </div>
                      <div
                        onClick={async () => {
                          const newValue = !usePersonalization
                          setUsePersonalization(newValue)
                          
                          // Save to database
                          try {
                            const supabase = createClient(
                              import.meta.env.VITE_SUPABASE_URL,
                              import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
                            )
                            
                            const { error } = await supabase
                              .from('users')
                              .update({ use_personal_appearance_text: newValue })
                              .eq('id', user?.id)
                            
                            if (error) {
                              console.error('❌ Database error (text toggle):', error)
                            } else {
                              console.log('✅ Saved text toggle to database:', newValue)
                            }
                          } catch (error) {
                            console.error('❌ Exception (text toggle):', error)
                          }
                        }}
                        style={{
                          cursor: 'pointer',
                          width: '28px',
                          height: '14px',
                          backgroundColor: usePersonalization ? '#22c55e' : '#ccc',
                          borderRadius: '7px',
                          position: 'relative',
                          transition: 'all 0.3s ease',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <div style={{
                          width: '10px',
                          height: '10px',
                          backgroundColor: 'white',
                          borderRadius: '50%',
                          position: 'absolute',
                          left: usePersonalization ? '16px' : '2px',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
                        }} />
                      </div>
                    </div>
                  </div>
                )}
            
                {/* Editierfeld nach dem Endresultat */}
                {showPersonalization && (
                  <div style={{
                    marginTop: '10px',
                    padding: isEditingPersonalText ? '0 15px 15px 15px' : '0 15px'
                  }}>
                    <div 
                      style={{
                        fontSize: '12px',
                        color: '#f59e0b',
                        fontWeight: '500',
                        marginBottom: '6px',
                        cursor: 'pointer',
                        padding: '4px 0'
                      }}
                      onClick={() => setIsEditingPersonalText(!isEditingPersonalText)}
                    >
                      + Persönliche Details ändern <span style={{ fontSize: '10px', color: '#6B7280' }}>← klicken</span>
                    </div>
                    {isEditingPersonalText && (
                      <textarea
                        value={personalAppearanceText}
                        onChange={(e) => {
                          setPersonalAppearanceText(e.target.value)
                          savePersonalAppearanceText(e.target.value)
                        }}
                        placeholder="z.B. wearing elegant jewelry, confident posture, professional makeup..."
                        style={{
                          width: '100%',
                          minHeight: '60px',
                          padding: '8px',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '6px',
                          background: 'hsl(var(--background))',
                          color: 'hsl(var(--foreground))',
                          fontSize: '13px',
                          resize: 'vertical',
                          fontFamily: 'inherit'
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            setIsEditingPersonalText(false)
                          }
                        }}
                        onBlur={() => {
                          setIsEditingPersonalText(false)
                        }}
                      />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        <textarea 
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Beschreibe was du generieren möchtest..."
          className="mobile-prompt-textarea"
        />
      </div>



      {/* Generate Buttons Container */}
      <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
        {/* Single Generate Button */}
        <button 
          onClick={generateImage}
          disabled={!prompt.trim() || loading || multiLoading || multiLoading10}
          className={`mobile-generate-button ${loading ? 'loading' : ''} ${!prompt.trim() ? 'disabled' : ''}`}
          style={{ 
            background: loading ? 
              'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 
              'linear-gradient(135deg, hsl(47 100% 65%) 0%, #f59e0b 100%)'
          }}
        >
          <span className="generate-icon">🍌</span>
          <span className="generate-text">
            {loading ? 'Generiere...' : 'Bild generieren'}
          </span>
        </button>

        {/* 4x Generate Button */}
        <button 
          onClick={generate4Images}
          disabled={!prompt.trim() || loading || multiLoading || multiLoading10}
          className={`mobile-generate-button ${multiLoading ? 'loading' : ''} ${!prompt.trim() ? 'disabled' : ''}`}
          style={{ 
            background: multiLoading ? 
              'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 
              'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)'
          }}
        >
          <span className="generate-icon">🍌🍌🍌🍌</span>
          <span className="generate-text">
            {multiLoading ? '4x Generiere...' : '4x Generierung'}
          </span>
        </button>

        {/* 10x Generate Button */}
        <button 
          onClick={generate10Images}
          disabled={!prompt.trim() || loading || multiLoading || multiLoading10}
          className={`mobile-generate-button ${multiLoading10 ? 'loading' : ''} ${!prompt.trim() ? 'disabled' : ''}`}
          style={{ 
            background: multiLoading10 ? 
              'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 
              'linear-gradient(135deg, hsl(280 70% 60%) 0%, #7c3aed 100%)'
          }}
        >
          <span className="generate-icon">🍌🍌🍌🍌🍌🍌🍌🍌🍌🍌</span>
          <span className="generate-text">
            {multiLoading10 ? '10x Generiere...' : '10x Generierung'}
          </span>
        </button>
      </div>


      {/* Loading State mit Live Timer */}
      {loading && (
        <div style={{ 
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#FEF3C7',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🍌</div>
          <div style={{ color: '#92400E', marginBottom: '8px' }}>
            Gemini generiert dein Bild...
          </div>
          <div style={{ 
            fontSize: '1.2rem', 
            fontFamily: 'monospace',
            color: '#D97706',
            fontWeight: 'bold'
          }}>
            ⏱️ {liveTimer}s
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div style={{ 
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#F3F4F6',
          borderRadius: '8px',
          width: '100%',
          maxWidth: '100%',
          overflow: 'hidden',
          boxSizing: 'border-box'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h3 style={{ margin: '0', color: '#1F2937' }}>Ergebnis:</h3>
              {generationTime && (
                <span style={{
                  backgroundColor: '#E5E7EB',
                  color: 'hsl(var(--muted-foreground))',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontFamily: 'monospace'
                }}>
                  ⏱️ {generationTime}
                </span>
              )}
            </div>
            {result.image && (
              <button
                onClick={downloadImage}
                style={{
                  padding: '8px 15px',
                  backgroundColor: '#10B981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                📥 Download
              </button>
            )}
          </div>
          
          <p style={{ marginBottom: '15px', color: result.style?.color || 'hsl(var(--foreground))' }}>{result.text}</p>
          
          {result.image && (
            <img 
              src={result.image} 
              alt="Generated" 
              style={{ 
                width: '100%', 
                maxWidth: 'min(400px, 100%)',
                borderRadius: '8px',
                border: '1px solid #D1D5DB',
                cursor: 'pointer',
                height: 'auto',
                boxSizing: 'border-box'
              }}
              onClick={downloadImage}
              title="Klicken zum Download"
            />
          )}
        </div>
      )}

      {/* Multi Loading State */}
      {multiLoading && (
        <div style={{ 
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#FEF3C7',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🍌🍌🍌🍌</div>
          <div style={{ color: '#D97706', fontWeight: '600' }}>
            4x Generierung läuft...
          </div>
          <div style={{ color: '#92400E', fontSize: '14px', marginTop: '5px' }}>
            Bitte warten, alle 4 Bilder werden parallel erstellt
          </div>
          <div style={{ 
            color: '#92400E', 
            fontSize: '16px', 
            marginTop: '10px',
            fontFamily: 'monospace',
            fontWeight: 'bold'
          }}>
            ⏱️ {multiTimer}s
          </div>
        </div>
      )}

      {/* 10x Multi Loading State */}
      {multiLoading10 && (
        <div style={{ 
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#EDE9FE',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.8rem', marginBottom: '10px' }}>🍌🍌🍌🍌🍌🍌🍌🍌🍌🍌</div>
          <div style={{ color: '#7c3aed', fontWeight: '600' }}>
            10x Generierung läuft...
          </div>
          <div style={{ color: '#5b21b6', fontSize: '14px', marginTop: '5px' }}>
            Bitte warten, alle 10 Bilder werden parallel erstellt
          </div>
          <div style={{ 
            color: '#5b21b6', 
            fontSize: '16px', 
            marginTop: '10px',
            fontFamily: 'monospace',
            fontWeight: 'bold'
          }}>
            ⏱️ {multiTimer10}s
          </div>
        </div>
      )}

      {/* 4x Results - EXAKT wie einzelne Generierung */}
      {multiResults.length > 0 && (
        <div style={{ 
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#F3F4F6',
          borderRadius: '8px',
          width: '100%',
          maxWidth: '100%',
          overflow: 'hidden',
          boxSizing: 'border-box'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h3 style={{ margin: '0', color: '#1F2937' }}>4x Ergebnis:</h3>
              {multiResults[0]?.generationTime && (
                <span style={{
                  backgroundColor: '#E5E7EB',
                  color: 'hsl(var(--muted-foreground))',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontFamily: 'monospace'
                }}>
                  ⏱️ {multiResults[0].generationTime}
                </span>
              )}
            </div>
            <button
              onClick={downloadAllImages}
              style={{
                padding: '8px 15px',
                backgroundColor: '#10B981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              📥 Alle downloaden
            </button>
          </div>
          
          <p style={{ marginBottom: '15px', color: 'hsl(var(--foreground))' }}>Bilder erfolgreich generiert!</p>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(2, 1fr)',
            gap: '10px'
          }}>
            {multiResults.map((result, index) => (
              result.success && result.image ? (
                <img 
                  key={index}
                  src={result.image} 
                  alt={`Generated ${index + 1}`} 
                  style={{ 
                    width: '100%', 
                    borderRadius: '8px',
                    border: '1px solid #D1D5DB',
                    cursor: 'pointer',
                    height: 'auto',
                    boxSizing: 'border-box'
                  }}
                  onClick={() => downloadMultiImage(result.image, index)}
                  title="Klicken zum Download"
                />
              ) : null
            ))}
          </div>
        </div>
      )}

      {/* 10x Results - EXAKT wie 4x Generierung */}
      {multiResults10.length > 0 && (
        <div style={{ 
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#F3F4F6',
          borderRadius: '8px',
          width: '100%',
          maxWidth: '100%',
          overflow: 'hidden',
          boxSizing: 'border-box'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h3 style={{ margin: '0', color: '#1F2937' }}>10x Ergebnis:</h3>
              {multiResults10[0]?.generationTime && (
                <span style={{
                  backgroundColor: '#E5E7EB',
                  color: 'hsl(var(--muted-foreground))',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontFamily: 'monospace'
                }}>
                  ⏱️ {multiResults10[0].generationTime}
                </span>
              )}
            </div>
            <button
              onClick={downloadAll10Images}
              style={{
                padding: '8px 15px',
                backgroundColor: '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              📥 Alle downloaden
            </button>
          </div>
          
          <p style={{ marginBottom: '15px', color: 'hsl(var(--foreground))' }}>Bilder erfolgreich generiert!</p>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(5, 1fr)',
            gap: '10px'
          }}>
            {multiResults10.map((result, index) => (
              result.success && result.image ? (
                <img 
                  key={index}
                  src={result.image} 
                  alt={`Generated ${index + 1}`} 
                  style={{ 
                    width: '100%', 
                    borderRadius: '8px',
                    border: '1px solid #D1D5DB',
                    cursor: 'pointer',
                    height: 'auto',
                    boxSizing: 'border-box'
                  }}
                  onClick={() => downloadMultiImage(result.image, index)}
                  title="Klicken zum Download"
                />
              ) : null
            ))}
          </div>
        </div>
      )}

      {/* User Inspo Gallery - Community inspiration above personal gallery */}
      <UserInspoGallery currentUser={user} />
      {/* Recent Images History - ganz unten nach allen Generation Results */}
      <RecentImagesHistory currentUser={user} />

    </div>
  )
}

export default NonoBananaMultiPromptsPage