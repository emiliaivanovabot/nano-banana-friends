import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { SecureLogger, ApiLogger } from '../utils/secure-logger.js'
import { createClient } from '@supabase/supabase-js'
import { useAsyncGeneration, useGenerationStatus } from '../utils/async-generation.js'

// Premium Dropdown Component - Bulletproof Portal-based (same as before)
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

// ==============================================
// ASYNC GENERATION STATUS COMPONENT
// ==============================================

function GenerationStatusCard({ generation, onRetry, onCancel }) {
  const status = useGenerationStatus(generation)
  
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    if (mins > 0) {
      return `${mins}m ${secs}s`
    }
    return `${secs}s`
  }
  
  const formatCreatedAt = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  
  if (!generation) return null
  
  return (
    <div style={{
      margin: '20px 0',
      padding: '16px',
      background: generation.status === 'processing' ? 
        'linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(249, 250, 251, 0.9) 100%)' : 
        generation.status === 'completed' ? 
        'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(249, 250, 251, 0.9) 100%)' :
        'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(249, 250, 251, 0.9) 100%)',
      borderRadius: '12px',
      border: `1px solid ${status.color}30`,
      position: 'relative'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.2rem' }}>{status.icon}</span>
          <span style={{ fontWeight: '600', color: status.color }}>
            {status.text}
          </span>
          {generation.created_at && (
            <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>
              {formatCreatedAt(generation.created_at)}
            </span>
          )}
        </div>
        
        {generation.status === 'processing' && onCancel && (
          <button
            onClick={onCancel}
            style={{
              background: 'transparent',
              border: '1px solid #EF4444',
              color: '#EF4444',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
        )}
      </div>
      
      {/* Processing status with live duration */}
      {generation.status === 'processing' && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ 
            fontSize: '0.9rem', 
            color: '#D97706',
            marginBottom: '8px',
            fontFamily: 'monospace',
            fontWeight: '500'
          }}>
            ⏱️ {formatDuration(Math.floor((Date.now() - new Date(generation.created_at).getTime()) / 1000))}
          </div>
          <div style={{
            width: '100%',
            height: '4px',
            background: '#E5E7EB',
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, #F59E0B, #D97706)',
              animation: 'pulse 2s infinite'
            }} />
          </div>
          <div style={{ fontSize: '0.8rem', color: '#6B7280', marginTop: '4px' }}>
            Generation continues even if you close the app or phone sleeps 📱
          </div>
        </div>
      )}
      
      {/* Completed status with result */}
      {generation.status === 'completed' && generation.result && (
        <div>
          {generation.result.generation_time_seconds && (
            <div style={{ fontSize: '0.8rem', color: '#10B981', marginBottom: '8px' }}>
              Completed in {formatDuration(generation.result.generation_time_seconds)}
            </div>
          )}
          {generation.result.image && (
            <img 
              src={generation.result.image} 
              alt="Generated"
              style={{ 
                width: '100%', 
                maxWidth: '300px',
                borderRadius: '8px',
                border: '1px solid #D1D5DB'
              }}
            />
          )}
        </div>
      )}
      
      {/* Failed status with retry option */}
      {generation.status === 'failed' && (
        <div>
          <div style={{ fontSize: '0.9rem', color: '#EF4444', marginBottom: '12px' }}>
            {generation.error || 'Generation failed'}
          </div>
          {onRetry && (
            <button
              onClick={() => onRetry(generation.id)}
              style={{
                background: '#F59E0B',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 16px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '500'
              }}
            >
              🔄 Retry Generation
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ==============================================
// MAIN COMPONENT
// ==============================================

function NonoBananaPageAsync() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [prompt, setPrompt] = useState('')
  const [images, setImages] = useState([])
  const [userGender, setUserGender] = useState('female')
  const [resolution, setResolution] = useState('2K')
  const [aspectRatio, setAspectRatio] = useState('9:16')
  const [userSettings, setUserSettings] = useState(null)
  const [showMainFaceImage, setShowMainFaceImage] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [templatesCollapsed, setTemplatesCollapsed] = useState(true)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  
  const fileRef = useRef(null)
  
  // Async generation hook
  const {
    currentGeneration,
    isGenerating,
    generationHistory,
    error: generationError,
    hasActiveGeneration,
    startAsyncGeneration,
    retryGeneration,
    requestNotificationPermission,
    clearError,
    stopPolling
  } = useAsyncGeneration(user?.id)

  // Load user settings on component mount
  useEffect(() => {
    const loadUserSettings = async () => {
      if (!user?.id) return

      try {
        console.log('🔍 DEBUG ENV VARS:')
        console.log('URL:', import.meta.env.VITE_SUPABASE_URL)
        console.log('KEY:', import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY?.slice(0, 20) + '...')
        
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
      
      if (images.length > 0) {
        const faceInstruction = userGender === 'female' 
          ? "Use my uploaded photo to maintain my exact facial features, skin tone, eye color, and hair as a woman."
          : "Use my uploaded photo to maintain my exact facial features, skin tone, eye color, and hair as a man."
        
        setPrompt(`${faceInstruction} ${decodedPrompt}`)
      } else {
        setPrompt(decodedPrompt)
      }
      
      window.history.replaceState({}, '', '/nono-banana')
    }
  }, [location, images.length, userGender])

  // Request notification permission on mount
  useEffect(() => {
    requestNotificationPermission()
  }, [requestNotificationPermission])

  // Mobile resize detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Touch gesture handling for mobile swipe navigation
  useEffect(() => {
    let touchStartX = 0
    let touchStartY = 0
    let touchEndX = 0
    let touchEndY = 0

    const handleTouchStart = (e) => {
      touchStartX = e.changedTouches[0].screenX
      touchStartY = e.changedTouches[0].screenY
    }

    const handleTouchEnd = (e) => {
      touchEndX = e.changedTouches[0].screenX
      touchEndY = e.changedTouches[0].screenY
      handleSwipeGesture()
    }

    const handleSwipeGesture = () => {
      const swipeThreshold = 30
      const maxVerticalThreshold = 40
      const swipeDistance = touchEndX - touchStartX
      const verticalDistance = Math.abs(touchEndY - touchStartY)
      
      // Check if it's a horizontal swipe (not vertical scroll)
      if (verticalDistance < maxVerticalThreshold && Math.abs(swipeDistance) > swipeThreshold) {
        // Right swipe detected
        if (swipeDistance > 0) {
          navigate('/')
        }
      }
    }

    if (isMobile) {
      document.addEventListener('touchstart', handleTouchStart, { passive: true })
      document.addEventListener('touchend', handleTouchEnd, { passive: true })
    }

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isMobile, navigate])

  // Prompt templates (same as before)
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

    setUserGender(gender)
    localStorage.setItem('userGender', gender)
    localStorage.setItem('hasUploadedImages', 'true')

    Promise.all(
      files.map(file => {
        return new Promise((resolve) => {
          const reader = new FileReader()
          reader.onload = (e) => resolve({
            file: file,
            base64: e.target.result,
            name: file.name,
            mime_type: file.type
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

  const downloadImage = (imageData) => {
    if (!imageData) return
    
    try {
      const base64Data = imageData.split(',')[1]
      const mimeType = imageData.split(',')[0].split(':')[1].split(';')[0]
      
      const binaryData = atob(base64Data)
      const bytes = new Uint8Array(binaryData.length)
      for (let i = 0; i < binaryData.length; i++) {
        bytes[i] = binaryData.charCodeAt(i)
      }
      
      const blob = new Blob([bytes], { type: mimeType })
      const url = URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `nano-banana-async-${Date.now()}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      URL.revokeObjectURL(url)
    } catch (error) {
      SecureLogger.error('Download failed', error)
    }
  }

  const generateImageAsync = async () => {
    if (!prompt.trim()) {
      alert('Bitte gib einen Prompt ein')
      return
    }

    if (!userSettings?.gemini_api_key) {
      alert('Dein Gemini API Key fehlt. Bitte gehe zu Settings und trage ihn ein.')
      return
    }

    try {
      clearError()
      
      // Prepare additional images data
      const additionalImages = images.map(img => ({
        base64: img.base64,
        mime_type: img.mime_type || 'image/jpeg',
        name: img.name
      }))

      const generationData = {
        prompt,
        resolution,
        aspect_ratio: aspectRatio,
        main_face_image_url: showMainFaceImage ? userSettings.main_face_image_url : null,
        additional_images: additionalImages
      }

      await startAsyncGeneration(generationData)
      
      // Show success message
      console.log('Async generation started successfully!')
      
    } catch (error) {
      console.error('Generation start error:', error)
      alert(`Fehler beim Starten der Generierung: ${error.message}`)
    }
  }

  const handleRetry = async (generationId) => {
    try {
      await retryGeneration(generationId)
    } catch (error) {
      alert(`Retry failed: ${error.message}`)
    }
  }

  const handleCancel = () => {
    stopPolling()
    // Could also call API to cancel generation if implemented
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
        🍌 nano banana pro (async)
      </h1>

      {/* Error display */}
      {generationError && (
        <div style={{
          margin: '20px 0',
          padding: '12px',
          background: '#FEF2F2',
          color: '#DC2626',
          borderRadius: '8px',
          border: '1px solid #FECACA',
          fontSize: '0.9rem'
        }}>
          <strong>Error:</strong> {generationError}
          <button
            onClick={clearError}
            style={{
              background: 'none',
              border: 'none',
              color: '#DC2626',
              cursor: 'pointer',
              marginLeft: '10px',
              fontWeight: 'bold'
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Generation Status Card */}
      <GenerationStatusCard 
        generation={currentGeneration}
        onRetry={handleRetry}
        onCancel={hasActiveGeneration ? handleCancel : null}
      />

      {/* Compact Settings */}
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
            disabled={isGenerating}
            style={{
              padding: '10px 14px',
              background: isGenerating ? '#E5E7EB' : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(249, 250, 251, 0.9) 100%)',
              border: '1px solid rgba(251, 191, 36, 0.3)',
              borderRadius: '8px',
              cursor: isGenerating ? 'not-allowed' : 'pointer',
              fontWeight: '500',
              fontSize: '0.9rem',
              transition: 'all 0.2s ease',
              opacity: isGenerating ? 0.6 : 1
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
              if (aspectRatio === '9:16') setAspectRatio('16:9')
              else if (aspectRatio === '16:9') setAspectRatio('4:3')
              else if (aspectRatio === '4:3') setAspectRatio('3:4')
              else if (aspectRatio === '3:4') setAspectRatio('2:3')
              else if (aspectRatio === '2:3') setAspectRatio('3:2')
              else setAspectRatio('9:16')
            }
            disabled={isGenerating}
            style={{
              padding: '10px 14px',
              background: isGenerating ? '#E5E7EB' : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(249, 250, 251, 0.9) 100%)',
              border: '1px solid rgba(251, 191, 36, 0.3)',
              borderRadius: '8px',
              cursor: isGenerating ? 'not-allowed' : 'pointer',
              fontWeight: '500',
              fontSize: '0.9rem',
              transition: 'all 0.2s ease',
              opacity: isGenerating ? 0.6 : 1
            }}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ fontWeight: '600' }}>{aspectRatio}</span>
              <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                {aspectRatio === '9:16' ? 'Story' : 
                 aspectRatio === '16:9' ? 'Widescreen' :
                 aspectRatio === '4:3' ? 'Post' :
                 aspectRatio === '3:4' ? 'Portrait' :
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
                  disabled={isGenerating}
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
                    cursor: isGenerating ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    lineHeight: '1',
                    opacity: isGenerating ? 0.6 : 1
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
                cursor: showMainFaceImage === false && !isGenerating ? 'pointer' : 'default'
              }}
              onClick={() => {
                if (showMainFaceImage === false && !isGenerating) {
                  setShowMainFaceImage(true)
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
          disabled={isGenerating}
        />
        
        <input 
          id="male-upload"
          type="file" 
          multiple
          accept="image/*" 
          onChange={(e) => handleImageUpload(e, 'male')}
          style={{ display: 'none' }}
          disabled={isGenerating}
        />
        
        <input 
          id="neutral-upload"
          type="file" 
          multiple
          accept="image/*" 
          onChange={(e) => handleImageUpload(e, userGender)}
          style={{ display: 'none' }}
          disabled={isGenerating}
        />
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {!showMainFaceImage && images.length === 0 ? (
            <>
              <button 
                onClick={() => fileRef.current.click()}
                disabled={isGenerating}
                style={{
                  padding: '10px 15px',
                  backgroundColor: isGenerating ? '#E5E7EB' : '#F59E0B',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: isGenerating ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  opacity: isGenerating ? 0.6 : 1
                }}
              >
                👩 Frauengesicht
              </button>
              
              <button 
                onClick={() => document.getElementById('male-upload').click()}
                disabled={isGenerating}
                style={{
                  padding: '6px 12px',
                  backgroundColor: isGenerating ? '#E5E7EB' : '#3B82F6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: isGenerating ? 'not-allowed' : 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  opacity: isGenerating ? 0.6 : 1
                }}
                title="Spezial-Upload für männliche Fotos - optimiert für Mann-zu-Frau Generierung"
              >
                👨 Manngesicht
              </button>
            </>
          ) : (
            <button 
              onClick={() => document.getElementById('neutral-upload').click()}
              disabled={isGenerating}
              style={{
                padding: '10px 15px',
                backgroundColor: isGenerating ? '#E5E7EB' : '#6B7280',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: isGenerating ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                opacity: isGenerating ? 0.6 : 1
              }}
            >
              📎 Weitere Bilder hinzufügen
            </button>
          )}
          
          {images.length > 0 && (
            <button 
              onClick={clearAllImages}
              disabled={isGenerating}
              style={{
                padding: '8px 12px',
                backgroundColor: isGenerating ? '#E5E7EB' : '#EF4444',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isGenerating ? 'not-allowed' : 'pointer',
                fontSize: '0.8rem',
                opacity: isGenerating ? 0.6 : 1
              }}
            >
              🗑️ Alle löschen
            </button>
          )}
        </div>

        <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>
          {images.length}/14 Bilder • Async generation prevents mobile sleep interruptions 📱
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
                  disabled={isGenerating}
                  style={{
                    position: 'absolute',
                    top: '2px',
                    right: '2px',
                    background: isGenerating ? '#E5E7EB' : '#EF4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    cursor: isGenerating ? 'not-allowed' : 'pointer',
                    fontSize: '12px',
                    opacity: isGenerating ? 0.6 : 1
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
                    disabled={isGenerating}
                    className={`mobile-template-button ${isSelected ? 'selected' : ''}`}
                    style={{ 
                      opacity: isGenerating ? 0.6 : 1,
                      cursor: isGenerating ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <div className="template-button-content">
                      <div className="template-button-title">
                        {template.includes('flawless makeup') || template.includes('luxury beauty campaign') ? 'Luxury Beauty' :
                         template.includes('dramatic makeup') || template.includes('smoky eyes') ? 'Glamour Shot' :
                         template.includes('minimal makeup') || template.includes('glowing skin') ? 'Natural Look' :
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
              disabled={isGenerating}
              style={{
                background: isGenerating ? '#E5E7EB' : 'linear-gradient(135deg, #f472b6 0%, #fb7185 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '0.85rem',
                fontWeight: '500',
                cursor: isGenerating ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isGenerating ? 'none' : '0 2px 4px rgba(244, 114, 182, 0.3)',
                opacity: isGenerating ? 0.6 : 1
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
          disabled={isGenerating}
          style={{
            opacity: isGenerating ? 0.6 : 1,
            cursor: isGenerating ? 'not-allowed' : 'text'
          }}
        />
      </div>

      {/* Mobile Optimized Generate Button */}
      <button 
        onClick={generateImageAsync}
        disabled={!prompt.trim() || isGenerating || !userSettings?.gemini_api_key}
        className={`mobile-generate-button ${isGenerating ? 'loading' : ''} ${!prompt.trim() || !userSettings?.gemini_api_key ? 'disabled' : ''}`}
      >
        <span className="generate-icon">🍌</span>
        <span className="generate-text">
          {isGenerating ? 'Startet Generation...' : 'Async Generierung starten'}
        </span>
      </button>

      {/* Generation History */}
      {generationHistory && generationHistory.length > 0 && (
        <div style={{ 
          marginTop: '30px',
          padding: '16px',
          background: 'rgba(255, 255, 255, 0.5)',
          borderRadius: '12px',
          border: '1px solid rgba(251, 191, 36, 0.2)'
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: '#374151' }}>
            Letzte Generierungen
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {generationHistory.slice(0, 5).map((generation) => (
              <div key={generation.id} style={{
                padding: '12px',
                background: 'rgba(255, 255, 255, 0.8)',
                borderRadius: '8px',
                border: '1px solid rgba(229, 231, 235, 0.8)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{generation.status === 'completed' ? '✅' : generation.status === 'failed' ? '❌' : '⏳'}</span>
                    <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>
                      {new Date(generation.created_at).toLocaleDateString()} {new Date(generation.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {generation.status === 'completed' && generation.result?.image && (
                    <button
                      onClick={() => downloadImage(generation.result.image)}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: '#10B981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.75rem'
                      }}
                    >
                      📥
                    </button>
                  )}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#4B5563', marginBottom: '8px' }}>
                  {generation.prompt.length > 100 ? `${generation.prompt.substring(0, 100)}...` : generation.prompt}
                </div>
                {generation.status === 'completed' && generation.result?.image && (
                  <img 
                    src={generation.result.image}
                    alt="Generated"
                    style={{
                      width: '100%',
                      maxWidth: '200px',
                      borderRadius: '4px',
                      border: '1px solid #D1D5DB',
                      cursor: 'pointer'
                    }}
                    onClick={() => downloadImage(generation.result.image)}
                  />
                )}
                {generation.status === 'failed' && (
                  <div style={{ fontSize: '0.8rem', color: '#EF4444' }}>
                    Error: {generation.error}
                    <button
                      onClick={() => handleRetry(generation.id)}
                      style={{
                        marginLeft: '8px',
                        padding: '2px 6px',
                        backgroundColor: '#F59E0B',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontSize: '0.7rem'
                      }}
                    >
                      🔄 Retry
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default NonoBananaPageAsync