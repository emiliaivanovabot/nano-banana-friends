import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { createPortal } from 'react-dom'

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
  const [prompt, setPrompt] = useState('')
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [resolution, setResolution] = useState('2K')
  const [aspectRatio, setAspectRatio] = useState('9:16')
  const [generationTime, setGenerationTime] = useState(null)
  const [liveTimer, setLiveTimer] = useState(0)
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [templatesCollapsed, setTemplatesCollapsed] = useState(true)
  
  const fileRef = useRef(null)

  // Prompt-Vorlagen für AI Model Shootings
  const promptTemplates = [
    {
      category: "Studio Business",
      prompts: [
        "Recrie essa cena utilizando minha foto enviada como base, mantendo o mesmo enquadramento, pose, iluminação e atmosfera da imagem de referência. A composição deve mostrar uma mulher sentada sobre um banco alto de madeira com estrutura metálica preta, em um estúdio minimalista de fundo neutro em tons de cinza. A modelo deve estar com a perna direita dobrada e apoiada no degrau do banco, enquanto a esquerda toca o chão com elegância, calçando sapatos de salto preto. O figurino é totalmente preto e elegante: blazer estruturado sobre os ombros, calça de alfaiataria justa e blusa preta por baixo. O cabelo solto deve cair suavemente sobre os ombros, expressão confiante com olhar direcionado levemente para o lado. Iluminação de estúdio, luz suave e direcional, fundo liso com degradê sutil em cinza. Estilo editorial corporativo moderno, formato vertical (1080x1920), qualidade fotográfica premium.",
        "Using the provided image, recreate this woman as a professional businesswoman in elegant black pantsuit, sitting confidently on modern office chair, minimalist white background, studio lighting, editorial style, high-end fashion photography. Keep facial features identical to the original image.",
        "Using the provided image as reference, recreate this woman in a corporate portrait wearing tailored navy blazer, standing pose with hands on hips, clean studio background, professional lighting, confident expression, business magazine style. Maintain exact facial features from the uploaded image."
      ]
    },
    {
      category: "Luxury Chair Poses",
      prompts: [
        "A beautiful, confident woman wearing a black suit sits elegantly on a luxurious white chair that highlights her slim, graceful figure. Her right hand rests gently beneath her chin, with her chin slightly raised in a pose of self-assurance. Her head tilts subtly to the right, eyes steady and looking forward with confidence. The background is pure white, featuring soft, cinematic illumination. Beside the chair stands a unique white table topped with a black coffee cup and stylish lamp decor, creating a refined and elegant atmosphere.",
        "Sophisticated woman in cream-colored designer outfit, sitting gracefully on velvet armchair, legs crossed elegantly, one hand on armrest, luxurious interior background with soft ambient lighting",
        "Model in flowing midi dress, seated on vintage leather chair, relaxed pose with one leg tucked under, natural window lighting, bohemian-chic atmosphere, warm earth tones"
      ]
    },
    {
      category: "Fashion Editorial",
      prompts: [
        "High-fashion editorial shoot: model in avant-garde designer dress, dramatic pose against geometric backdrop, bold fashion photography lighting, magazine cover style, artistic composition",
        "Street fashion portrait: woman in trendy oversized blazer and fitted jeans, urban background, natural lighting, confident street style pose, contemporary fashion photography",
        "Minimalist fashion: model in monochrome outfit, clean lines, neutral background, soft even lighting, focus on clothing texture and silhouette, Scandinavian aesthetic"
      ]
    },
    {
      category: "Outdoor Locations",
      prompts: [
        "A hyper-realistic cinematic image of a young woman, standing at the very top of a famous tower in Paris. From this high vantage point, the entire Paris skyline is visible: the Eiffel Tower in the distance, classic Parisian rooftops, and winding streets below. White blouse, elegant accessories. Golden daylight shines across the city, with soft atmospheric haze adding depth. The camera angle is wide, slightly low, making the person look majestic and free while embracing the panoramic view. Mood: liberating, cinematic, awe-inspiring. Aspect ratio: 16:9, ultra-realistic, cinematic detail.",
        "Rooftop fashion shoot: model in flowing dress, city skyline background, golden hour lighting, wind-blown hair, urban glamour aesthetic, cinematic photography",
        "Beach editorial: woman in elegant white linen outfit, walking along shoreline, natural beach lighting, relaxed coastal vibe, Mediterranean aesthetic, professional photography"
      ]
    },
    {
      category: "Beauty & Close-ups",
      prompts: [
        "Using the provided image as reference, recreate this woman's face with extremely high fidelity. Create a high-end beauty portrait with flawless makeup, focus on eyes and lips, soft studio lighting, clean background, luxury beauty campaign style. Keep every facial feature exactly the same — eyes, nose, lips, eyebrows, bone structure. Enhance micro-details only: visible skin pores, natural skin texture, realistic highlights, soft shadows and depth. Maintain the original look, identity and proportions. Ultra-high resolution details.",
        "Using the provided image, recreate this woman's face with perfect accuracy. Create a glamour headshot with dramatic makeup and smoky eyes, professional beauty lighting, focus on facial features, magazine beauty editorial style. Keep all original facial features unchanged, enhance clarity and detail only.",
        "Using the provided image as base, recreate this woman's natural beauty with minimal makeup, glowing skin, soft natural lighting, clean simple background, fresh and organic beauty aesthetic. Maintain exact facial features, enhance skin texture and natural glow only."
      ]
    },
    {
      category: "Pose Variations",
      prompts: [
        "Standing power pose: woman with hands on hips, confident stance, professional attire, strong lighting, empowering business portrait style",
        "Sitting elegantly: crossed legs, hands placed gracefully, maintaining posture, sophisticated indoor setting, refined portrait photography",
        "Walking pose: mid-step movement, flowing outfit, dynamic composition, natural movement captured, editorial fashion photography style"
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

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files)
    if (files.length > 14) {
      alert('Maximal 14 Bilder erlaubt')
      return
    }

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
      console.error('Download error:', error)
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
        // Gemini API Call aufbauen
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY
        const model = import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.5-flash-image'
        
        if (!apiKey) {
          throw new Error('Gemini API Key fehlt')
        }

        // Nano Banana Pro API Format (echte Dokumentation)
        const parts = [
          { text: prompt }
        ]
        
        // Bilder hinzufügen (base64 ohne data: prefix)
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

        console.log(`Sending to Gemini (Attempt ${retryCount + 1}):`, {
          model,
          prompt,
          images: images.length,
          resolution,
          aspectRatio,
          requestBody: requestBody
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
          console.error('Gemini API Error Response:', errorText)
          
          // Bei Rate Limit (429) oder Server Overload (503) retry mit exponential backoff
          if ((response.status === 429 || response.status === 503) && retryCount < maxRetries) {
            const waitTime = 1000 * Math.pow(2, retryCount) // 1s, 2s, 4s
            const statusMessage = response.status === 503 ? 'Server überlastet' : 'Rate Limited'
            console.log(`${statusMessage}. Retrying in ${waitTime}ms...`)
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
          console.log(`Error occurred, retrying in ${waitTime}ms...`)
          await new Promise(resolve => setTimeout(resolve, waitTime))
          return makeApiCall(retryCount + 1)
        }
        throw error
      }
    }

    try {
      const response = await makeApiCall()

      const data = await response.json()
      console.log('Gemini Response Full:', JSON.stringify(data, null, 2))

      // Response verarbeiten - detailliertes Debugging
      if (data.candidates && data.candidates[0]) {
        console.log('Candidate found:', data.candidates[0])
        
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
          console.log('Parts found:', parts)
          
          let resultText = ''
          let resultImage = null

          parts.forEach((part, index) => {
            console.log(`Part ${index}:`, part)
            
            if (part.text) {
              resultText += part.text + ' '
            } else if (part.inline_data && part.inline_data.mime_type && part.inline_data.mime_type.startsWith('image/')) {
              resultImage = `data:${part.inline_data.mime_type};base64,${part.inline_data.data}`
              console.log('Image found in part', index)
            } else if (part.inlineData && part.inlineData.mimeType && part.inlineData.mimeType.startsWith('image/')) {
              // Alternative naming format
              resultImage = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`
              console.log('Image found in part', index, '(alternative format)')
            }
          })

          console.log('Result Text:', resultText)
          console.log('Result Image found:', !!resultImage)

          if (resultImage || resultText.trim()) {
            const endTime = Date.now()
            const duration = ((endTime - startTime) / 1000).toFixed(1)
            setGenerationTime(`${duration}s`)
            
            setResult({
              text: resultText.trim() || 'Bild erfolgreich generiert!',
              image: resultImage
            })
          } else {
            console.log('No valid image or text found in parts')
            throw new Error('Keine gültigen Daten in der Antwort erhalten')
          }
        } else {
          console.log('No content.parts found in candidate')
          throw new Error('Keine content.parts in der Antwort gefunden')
        }
      } else {
        console.log('No candidates found in response')
        throw new Error('Keine candidates in der API-Antwort gefunden')
      }

    } catch (error) {
      const endTime = Date.now()
      const duration = ((endTime - startTime) / 1000).toFixed(1)
      setGenerationTime(`${duration}s`)
      
      console.error('Fehler bei Bildgenerierung:', error)
      alert(`Fehler: ${error.message}`)
    } finally {
      clearInterval(timerInterval)
      setLoading(false)
    }
  }

  return (
    <div className="nano-banana-container">
      
      <Link 
        to="/" 
        style={{ 
          display: 'inline-block',
          marginBottom: '20px',
          color: '#6B7280',
          textDecoration: 'none',
          fontSize: '14px'
        }}
      >
        ← Zurück zur Startseite
      </Link>
      
      <h1 className="nano-banana-title">
        🍌 nano banana pro
      </h1>

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


      {/* Image Upload */}
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
        
        <input 
          ref={fileRef}
          type="file" 
          multiple
          accept="image/*" 
          onChange={handleImageUpload}
          style={{ display: 'none' }}
        />
        
        <button 
          onClick={() => fileRef.current.click()}
          style={{
            padding: '10px 15px',
            backgroundColor: '#F59E0B',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          📎 Bilder hinzufügen
        </button>

        {images.length > 0 && (
          <button 
            onClick={clearAllImages}
            style={{
              padding: '10px 15px',
              backgroundColor: '#EF4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            🗑️ Alle löschen
          </button>
        )}
        
        <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>
          {images.length}/14 Bilder • Text-to-Image wenn keine Bilder, Image-Edit wenn Bilder vorhanden
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

      {/* Compact Toggle Settings at Bottom */}
      <div style={{ 
        marginTop: '20px',
        padding: '6px',
        background: 'rgba(255, 255, 255, 0.4)',
        borderRadius: '6px',
        border: '1px solid rgba(251, 191, 36, 0.1)',
        fontSize: '0.85rem'
      }}>
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '6px'
        }}>
          <button
            onClick={() => setResolution(resolution === '2K' ? '4K' : '2K')}
            style={{
              padding: '8px 12px',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(249, 250, 251, 0.9) 100%)',
              border: '1px solid rgba(251, 191, 36, 0.3)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '0.85rem',
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
              <span style={{ fontSize: '0.7rem', color: '#6B7280' }}>
                {resolution === '2K' ? 'Optimal' : 'Max'}
              </span>
            </div>
          </button>
          
          <button
            onClick={() => setAspectRatio(aspectRatio === '9:16' ? '4:3' : '9:16')}
            style={{
              padding: '8px 12px',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(249, 250, 251, 0.9) 100%)',
              border: '1px solid rgba(251, 191, 36, 0.3)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '0.85rem',
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
              <span style={{ fontSize: '0.7rem', color: '#6B7280' }}>
                {aspectRatio === '9:16' ? 'Story' : 'Post'}
              </span>
            </div>
          </button>
        </div>
      </div>

    </div>
  )
}

export default NonoBananaPage