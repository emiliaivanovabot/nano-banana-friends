import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { SecureLogger, ApiLogger } from '../utils/secure-logger.js'
import { createClient } from '@supabase/supabase-js'

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

function NonoBananaPage() {
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
  
  const fileRef = useRef(null)

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
          .select('default_resolution, default_aspect_ratio, main_face_image_url, gemini_api_key')
          .eq('id', user.id)
          .single()

        if (error) throw error

        if (data) {
          // Secure logging - never log API keys
          console.log('Loaded user settings:', {
            default_resolution: data.default_resolution,
            default_aspect_ratio: data.default_aspect_ratio, 
            has_face_image: !!data.main_face_image_url,
            has_api_key: !!data.gemini_api_key
          })
          setUserSettings(data)
          setResolution(data.default_resolution || '2K')
          setAspectRatio(data.default_aspect_ratio || '9:16')
          
        } else {
          console.log('No user settings data found')
        }
      } catch (error) {
        console.error('Error loading user settings:', error)
      }
    }

    loadUserSettings()
  }, [user?.id])

  // Handle imported prompts from URL parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    const importedPrompt = searchParams.get('prompt')
    if (importedPrompt) {
      const decodedPrompt = decodeURIComponent(importedPrompt)
      
      // If user has uploaded images, automatically add face instructions
      if (images.length > 0) {
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
  }, [location, images.length, userGender])

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

        // Nano Banana Pro API Format (echte Dokumentation)
        const parts = [
          { text: prompt }
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
        
        // Safety Filter Check
        if (data.candidates[0].finishReason === 'IMAGE_SAFETY') {
          const endTime = Date.now()
          const duration = ((endTime - startTime) / 1000).toFixed(1)
          setGenerationTime(`${duration}s`)
          
          const safetyMessage = data.candidates[0].finishMessage || 
            'Bild wurde von Google Safety Filter blockiert. Versuche einen anderen Prompt.'
          
          setResult({
            text: `🛡️ Safety Filter: ${safetyMessage}`,
            image: null
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

          if (resultImage || resultText.trim()) {
            const endTime = Date.now()
            const duration = ((endTime - startTime) / 1000).toFixed(1)
            setGenerationTime(`${duration}s`)
            
            setResult({
              text: resultText.trim() || 'Bild erfolgreich generiert!',
              image: resultImage
            })
          } else {
            SecureLogger.warn('No valid image or text found in response parts')
            throw new Error('Keine gültigen Daten in der Antwort erhalten')
          }
        } else {
          SecureLogger.warn('No content.parts found in candidate')
          throw new Error('Keine content.parts in der Antwort gefunden')
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
    }
  }

  return (
    <div className="nano-banana-container">
      
      {/* Header with user info and navigation */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <Link 
            to="/" 
            style={{ 
              color: '#6B7280',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            ← Home
          </Link>
          
          {/* User info */}
          {user && (
            <div style={{
              padding: '6px 12px',
              backgroundColor: '#F3F4F6',
              borderRadius: '20px',
              fontSize: '14px',
              color: '#374151',
              fontWeight: '500'
            }}>
              👋 {user.username}
            </div>
          )}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <Link 
            to="/community-prompts" 
            style={{ 
              color: '#6B7280',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            🌟 Community →
          </Link>
          
        </div>
      </div>
      
      <h1 className="nano-banana-title">
        🍌 nano banana pro
      </h1>

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
          gridTemplateColumns: '1fr 1fr 80px',
          gap: '8px'
        }}>
          <button
            onClick={() => {
              if (resolution === '1K') setResolution('2K')
              else if (resolution === '2K') setResolution('4K')
              else setResolution('1K')
            }}
            style={{
              padding: '10px 14px',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(249, 250, 251, 0.9) 100%)',
              border: '1px solid rgba(251, 191, 36, 0.3)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '0.9rem',
              transition: 'all 0.2s ease'
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
              <span style={{ fontWeight: '600' }}>{resolution}</span>
              <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                {resolution === '1K' ? 'Fast' : resolution === '2K' ? 'Optimal' : 'Max'}
              </span>
            </div>
          </button>
          
          <button
            onClick={() => {
              if (aspectRatio === '9:16') setAspectRatio('4:3')
              else if (aspectRatio === '4:3') setAspectRatio('2:3')
              else if (aspectRatio === '2:3') setAspectRatio('3:2')
              else setAspectRatio('9:16')
            }}
            style={{
              padding: '10px 14px',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(249, 250, 251, 0.9) 100%)',
              border: '1px solid rgba(251, 191, 36, 0.3)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '0.9rem',
              transition: 'all 0.2s ease'
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
              <span style={{ fontWeight: '600' }}>{aspectRatio}</span>
              <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                {aspectRatio === '9:16' ? 'Story' : 
                 aspectRatio === '4:3' ? 'Post' :
                 aspectRatio === '2:3' ? 'Portrait' : 'Landscape'}
              </span>
            </div>
          </button>
          
          {/* Main Face Image Display */}
          <div style={{
            position: 'relative',
            width: '80px',
            height: '80px',
            borderRadius: '8px',
            overflow: 'hidden',
            border: '1px solid rgba(251, 191, 36, 0.3)',
            background: 'rgba(249, 250, 251, 0.9)'
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

      {/* Image Upload Section */}
      <div style={{ 
        marginBottom: '20px',
        padding: '16px',
        background: 'rgba(255, 255, 255, 0.7)',
        borderRadius: '12px',
        border: '1px solid rgba(251, 191, 36, 0.2)'
      }}>
        <label style={{ 
          display: 'flex', 
          alignItems: 'center',
          gap: '8px',
          marginBottom: '12px', 
          fontWeight: '600',
          fontSize: '0.95rem',
          background: 'linear-gradient(135deg, #ec4899 0%, #f59e0b 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          <span>📷</span>
          Bilder hochladen (optional, max 14):
        </label>
        
        {/* Hidden file inputs for different genders */}
        <input 
          ref={fileRef}
          type="file" 
          multiple
          accept="image/*" 
          onChange={(e) => handleImageUpload(e, 'female')}
          style={{ display: 'none' }}
        />
        
        <input 
          id="male-upload"
          type="file" 
          multiple
          accept="image/*" 
          onChange={(e) => handleImageUpload(e, 'male')}
          style={{ display: 'none' }}
        />
        
        <input 
          id="neutral-upload"
          type="file" 
          multiple
          accept="image/*" 
          onChange={(e) => handleImageUpload(e, userGender)}
          style={{ display: 'none' }}
        />
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Show gender-specific buttons only when main face is removed AND no additional images */}
          {!showMainFaceImage && images.length === 0 ? (
            <>
              <button 
                onClick={() => fileRef.current.click()}
                style={{
                  padding: '10px 15px',
                  backgroundColor: '#F59E0B',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                👩 Frauengesicht
              </button>
              
              <button 
                onClick={() => document.getElementById('male-upload').click()}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#3B82F6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="Spezial-Upload für männliche Fotos - optimiert für Mann-zu-Frau Generierung"
              >
                👨 Manngesicht
              </button>
            </>
          ) : (
            /* Show neutral upload button when images already exist */
            <button 
              onClick={() => document.getElementById('neutral-upload').click()}
              style={{
                padding: '10px 15px',
                backgroundColor: '#6B7280',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              📎 Weitere Bilder hinzufügen
            </button>
          )}
          
          {/* Clear all button inside the flex container when images exist */}
          {images.length > 0 && (
            <button 
              onClick={clearAllImages}
              style={{
                padding: '8px 12px',
                backgroundColor: '#EF4444',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.8rem'
              }}
            >
              🗑️ Alle löschen
            </button>
          )}
        </div>

        <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>
          {images.length}/14 Bilder • Text-to-Image wenn keine Bilder, Image-Edit wenn Bilder vorhanden
        </div>
        
        <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px', fontStyle: 'italic' }}>
          {!showMainFaceImage && images.length === 0 ? (
            <>💡 Wähle den passenden Button: "Frauengesicht" (90% der Nutzer) oder "Manngesicht" für männliche Fotos</>
          ) : (
            <>📎 {showMainFaceImage ? 'Gesichtsbild geladen' : 'Gender festgelegt'} - du kannst bis zu {14 - images.length} weitere Bilder hinzufügen</>
          )}
        </div>
      </div>

      {/* Image Preview */}
      {images.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', 
            gap: '10px',
            width: '100%',
            maxWidth: '100%',
            overflow: 'hidden',
            boxSizing: 'border-box'
          }}>
            {images.map((img, index) => (
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
            backgroundColor: 'rgba(255, 255, 255, 0.6)',
            borderRadius: '8px',
            border: '1px solid rgba(251, 191, 36, 0.2)',
            marginBottom: templatesCollapsed ? '8px' : '16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 className="mobile-templates-title" style={{ margin: 0, fontSize: '1rem' }}>
              Prompt Vorlagen
            </h3>
            <span style={{ 
              fontSize: '0.8rem', 
              color: '#6B7280', 
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
        background: 'rgba(255, 255, 255, 0.7)',
        borderRadius: '12px',
        border: '1px solid rgba(251, 191, 36, 0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h3 className="mobile-templates-title" style={{ margin: 0, textAlign: 'left' }}>
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
        <textarea 
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Beschreibe was du generieren möchtest..."
          className="mobile-prompt-textarea"
        />
      </div>



      {/* Mobile Optimized Generate Button */}
      <button 
        onClick={generateImage}
        disabled={!prompt.trim() || loading}
        className={`mobile-generate-button ${loading ? 'loading' : ''} ${!prompt.trim() ? 'disabled' : ''}`}
      >
        <span className="generate-icon">🍌</span>
        <span className="generate-text">
          {loading ? 'Generiere...' : 'Bild generieren'}
        </span>
      </button>


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
                  color: '#6B7280',
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
          
          <p style={{ marginBottom: '15px', color: '#374151' }}>{result.text}</p>
          
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


    </div>
  )
}

export default NonoBananaPage