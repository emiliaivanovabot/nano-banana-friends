import React, { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { 
  generateSeedreamImage, 
  getSeedreamAccountInfo, 
  validateSeedreamOptions,
  validateImageFiles,
  SEEDREAM_STYLES, 
  SEEDREAM_SIZES 
} from '../services/seedreamService.js'
import { uploadAndSaveImage } from '../utils/imageUpload.js'
import RecentImagesHistory from '../components/RecentImagesHistory.jsx'
import UserInspoGallery from '../components/UserInspoGallery.jsx'

function SeedreamPage() {
  const { user } = useAuth()
  const [prompt, setPrompt] = useState('black bikini and an other camera angle, from above')
  const [size, setSize] = useState('1K')
  const [aspectRatio, setAspectRatio] = useState('9:16')
  const [style, setStyle] = useState('photographic')
  const [numImages, setNumImages] = useState(1)
  const [watermark, setWatermark] = useState(false)
  const [promptOptimization, setPromptOptimization] = useState(true) // true = enable optimization, false = disable
  const [showOptimizationInfo, setShowOptimizationInfo] = useState(false)
  const [showStyleInfo, setShowStyleInfo] = useState(false)
  const [showSequentialInfo, setShowSequentialInfo] = useState(false)
  const [optionsExpanded, setOptionsExpanded] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImages, setGeneratedImages] = useState([])
  const [error, setError] = useState('')
  const [usageInfo, setUsageInfo] = useState(null)
  const [generationTime, setGenerationTime] = useState(null)
  const [startTime, setStartTime] = useState(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [accountInfo, setAccountInfo] = useState(null)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

  // Image Upload states
  const [uploadedImages, setUploadedImages] = useState([])
  const [sequentialGeneration, setSequentialGeneration] = useState(false)
  const [maxImages, setMaxImages] = useState(15)
  
  // Calculate correct max images based on uploaded images
  const getMaxOutputImages = () => {
    return Math.max(1, 15 - uploadedImages.length)
  }
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef(null)


  // Auto-scroll to top on page load
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  // Mobile detection
  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Timer useEffect - runs every second when generating
  React.useEffect(() => {
    let interval
    if (isGenerating && startTime) {
      interval = setInterval(() => {
        setElapsedTime(Date.now() - startTime)
      }, 100) // Update every 100ms for smooth counting
    } else {
      setElapsedTime(0)
    }
    
    return () => clearInterval(interval)
  }, [isGenerating, startTime])

  // Timer formatting helper
  const formatTime = (milliseconds) => {
    const seconds = Math.floor(milliseconds / 1000)
    const ms = Math.floor((milliseconds % 1000) / 100)
    return `${seconds}.${ms}s`
  }

  // Image Upload Handlers
  const handleFileSelect = (files) => {
    const fileArray = Array.from(files)
    const validation = validateImageFiles(fileArray)
    
    if (!validation.isValid) {
      setError(validation.errors.join(', '))
      return
    }

    // Limit to 14 images total
    const newImages = [...uploadedImages, ...fileArray].slice(0, 14)
    setUploadedImages(newImages)
    setError('')
    
    // Calculate and show total file size
    const totalBytes = newImages.reduce((sum, file) => sum + file.size, 0)
    const totalMB = (totalBytes / (1024 * 1024)).toFixed(2)
    console.log(`📊 Total uploaded images: ${newImages.length} files, ${totalMB} MB`)
    
    if (totalBytes > 10 * 1024 * 1024) { // 10MB limit
      setError(`⚠️ Gesamtgröße zu hoch: ${totalMB} MB (Max: 10 MB)`)
    }
    
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = e.dataTransfer.files
    handleFileSelect(files)
  }

  const removeImage = (index) => {
    const newImages = uploadedImages.filter((_, i) => i !== index)
    setUploadedImages(newImages)
  }

  const moveImage = (fromIndex, toIndex) => {
    const newImages = [...uploadedImages]
    const [movedImage] = newImages.splice(fromIndex, 1)
    newImages.splice(toIndex, 0, movedImage)
    setUploadedImages(newImages)
  }

  const clearAllImages = () => {
    setUploadedImages([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleGenerate = async () => {
    try {
      setIsGenerating(true)
      setError('')
      setGeneratedImages([])

      // Enhanced validation including images
      const validationOptions = { 
        prompt, 
        size, 
        images: uploadedImages,
        sequential_image_generation: sequentialGeneration ? 'auto' : 'disabled',
        max_images: getMaxOutputImages()
      }
      
      const validation = validateSeedreamOptions(validationOptions)
      
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '))
      }

      console.log('🌱 Starting Seedream generation...')
      console.log('📝 ORIGINAL PROMPT:', prompt)
      console.log('⚡ Prompt Optimization:', promptOptimization ? 'ENABLED' : 'DISABLED')
      console.log('Images:', uploadedImages.length)

      const startTime = Date.now()
      setStartTime(startTime) // Start the live timer
      
      // Multiple API calls approach (like Nano Banana)
      let allImages = []
      let totalDuration = 0
      
      if (sequentialGeneration) {
        // Sequential generation - single call with auto
        const result = await generateSeedreamImage({
          prompt,
          size,
          aspectRatio,
          style,
          watermark,
          images: uploadedImages,
          sequential_image_generation: 'auto',
          max_images: getMaxOutputImages(),
          promptOptimization
        })
        
        const endTime = Date.now()
        totalDuration = ((endTime - startTime) / 1000).toFixed(1)
        
        if (result.success) {
          allImages = result.images
          setGeneratedImages(allImages)
          showUsageFromResponse(result)
        }
      } else {
        // Multiple separate calls for exact control (like Nano Banana)
        for (let i = 0; i < numImages; i++) {
          console.log(`🌱 Generating image ${i + 1}/${numImages}...`)
          
          const result = await generateSeedreamImage({
            prompt,
            size,
            aspectRatio,
            style,
            watermark,
            images: uploadedImages,
            sequential_image_generation: 'disabled', // Always single image per call
            promptOptimization
          })
          
          if (result.success && result.images.length > 0) {
            allImages.push(...result.images)
            
            // Log optimized prompt for comparison
            result.images.forEach((image, idx) => {
              if (image.revisedPrompt && image.revisedPrompt !== prompt) {
                console.log(`📝 OPTIMIZED PROMPT (Bild ${allImages.length - result.images.length + idx + 1}):`, image.revisedPrompt)
                console.log(`🔄 VERGLEICH:`)
                console.log(`   Original: "${prompt}"`)
                console.log(`   Optimiert: "${image.revisedPrompt}"`)
              }
            })
            
            // Update display immediately as each image comes in (sukzessive Anzeige)
            setGeneratedImages([...allImages])
            showUsageFromResponse(result)
          } else {
            console.error(`❌ Failed to generate image ${i + 1}:`, result.error)
          }
        }
        
        const endTime = Date.now()
        totalDuration = ((endTime - startTime) / 1000).toFixed(1)
      }

      setGenerationTime(totalDuration)
      console.log(`✅ Total images generated: ${allImages.length} in ${totalDuration}s`)
        
        // Auto-save images to FTP server and gallery (non-blocking)
        if (allImages && allImages.length > 0 && user?.username) {
          allImages.forEach((imageUrl, index) => {
            // Convert Seedream image URL to base64 and upload to FTP
            fetch(imageUrl)
              .then(response => response.blob())
              .then(blob => {
                return new Promise((resolve) => {
                  const reader = new FileReader()
                  reader.onload = () => resolve(reader.result)
                  reader.readAsDataURL(blob)
                })
              })
              .then(base64Image => {
                // Prepare generation metadata similar to Nano-Banana
                const estimatedTokens = Math.round(prompt.length * 1.2) // Rough estimation for Seedream
                const estimatedUsageMetadata = {
                  promptTokenCount: Math.round(estimatedTokens * 0.3), // Estimated prompt tokens
                  candidatesTokenCount: Math.round(estimatedTokens * 0.7), // Estimated output tokens
                  totalTokenCount: estimatedTokens
                }
                
                return uploadAndSaveImage(
                  base64Image,
                  user.username,
                  'seedream-single',
                  prompt,
                  index,
                  size,
                  index === 0 ? parseFloat(duration) : null, // Generation time only for first image
                  estimatedUsageMetadata,
                  aspectRatio
                )
              })
              .then(uploadResult => {
                if (uploadResult.success) {
                  console.log(`✅ Seedream image ${index + 1} uploaded to gallery:`, uploadResult.imageUrl)
                } else {
                  console.error(`❌ Failed to upload image ${index + 1}:`, uploadResult.error)
                }
              })
              .catch(error => {
                console.error(`❌ Error processing image ${index + 1} for upload:`, error)
              })
          })
        }
      
      if (allImages.length === 0) {
        throw new Error('Keine Bilder generiert')
      }

    } catch (error) {
      console.error('❌ Generation error:', error)
      setError(error.message)
    } finally {
      setIsGenerating(false)
      setStartTime(null) // Stop the live timer
    }
  }

  // Show usage info from generation response
  const showUsageFromResponse = (result) => {
    if (result.usage) {
      setUsageInfo({
        success: true,
        generated_images: result.usage.generated_images || generatedImages.length,
        total_tokens: result.usage.total_tokens || 'Unknown',
        message: 'Credits werden über BytePlus Console verwaltet'
      })
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'hsl(var(--background))',
      color: 'hsl(var(--foreground))'
    }}>
      {/* Header */}
      <div style={{
        padding: isMobile ? '15px' : '20px',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'hsl(var(--card))',
          backdropFilter: 'blur(20px)',
          padding: isMobile ? '10px 14px' : '12px 16px',
          borderRadius: '16px',
          border: '1px solid hsl(var(--border))',
          marginBottom: '20px'
        }}>
          <Link 
            to="/dashboard" 
            style={{ 
              color: 'hsl(var(--foreground))',
              textDecoration: 'none',
              fontSize: isMobile ? '12px' : '13px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.3s ease',
              padding: '6px 10px',
              borderRadius: '8px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'hsl(var(--muted) / 0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
            }}
          >
            ← Zurück zum Dashboard
          </Link>
          
          <a
            href="https://console.byteplus.com/modelark/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: 'hsl(var(--primary) / 0.1)',
              color: 'hsl(var(--primary))',
              borderRadius: '20px',
              padding: '4px 12px',
              fontSize: '12px',
              fontWeight: '500',
              border: '1px solid hsl(var(--primary) / 0.3)',
              textDecoration: 'none',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'hsl(var(--primary) / 0.2)'
              e.currentTarget.style.transform = 'scale(1.05)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'hsl(var(--primary) / 0.1)'
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            💎 BytePlus Console
          </a>
        </div>

        {/* Title Section */}
        <div style={{
          textAlign: 'center',
          marginBottom: isMobile ? '25px' : '30px'
        }}>
          <h1 style={{
            margin: '0 0 8px 0',
            fontSize: isMobile ? '28px' : '36px',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontFamily: "'Space Grotesk', sans-serif"
          }}>
            Seedream 4.5 Pro
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        maxWidth: '1000px',
        margin: '0 auto',
        padding: isMobile ? '0 15px 30px' : '0 20px 40px'
      }}>
        
        {/* Usage Info */}
        {usageInfo && (
          <div style={{
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '20px',
            padding: '20px',
            marginBottom: '25px',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <p style={{
                  margin: '0 0 4px 0',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: 'hsl(var(--primary))'
                }}>
                  📊 Letzte Generation: {usageInfo.generated_images} Bilder{generationTime && ` in ${generationTime}s`}
                </p>
                <p style={{
                  margin: 0,
                  fontSize: '12px',
                  color: 'hsl(var(--muted-foreground))'
                }}>
                  Tokens: {usageInfo.total_tokens} | {usageInfo.message}
                  {generationTime && (
                    <span style={{ marginLeft: '10px', color: 'hsl(var(--primary))' }}>
                      ⏱️ {generationTime}s
                    </span>
                  )}
                  <br />
                  💰 Kosten: ~${(usageInfo.generated_images * 0.04).toFixed(2)} ({usageInfo.generated_images} × $0.04)
                </p>
              </div>
              <a
                href="https://console.byteplus.com/modelark/billing"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: 'hsl(var(--primary))',
                  fontSize: '12px',
                  textDecoration: 'underline',
                  transition: 'opacity 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.8'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1'
                }}
              >
                Billing →
              </a>
            </div>
          </div>
        )}

        {/* Generation Form */}
        <div style={{
          background: 'hsl(var(--card))',
          borderRadius: '20px',
          padding: isMobile ? '20px' : '30px',
          border: '1px solid hsl(var(--border))',
          marginBottom: isMobile ? '25px' : '30px'
        }}>
          

          
          {/* Image Upload Area */}
          <div style={{ marginBottom: '30px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                <label style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: 'hsl(var(--foreground))',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  📸 Bilder hochladen
                  <span style={{
                    fontSize: '12px',
                    color: 'hsl(var(--muted-foreground))',
                    background: 'hsl(var(--muted) / 0.3)',
                    padding: '2px 8px',
                    borderRadius: '12px'
                  }}>
                    1-14 Bilder • Max 10MB
                  </span>
                </label>
                {uploadedImages.length > 0 && (
                  <button
                    onClick={clearAllImages}
                    style={{
                      background: 'hsl(var(--destructive) / 0.1)',
                      color: 'hsl(var(--destructive))',
                      border: '1px solid hsl(var(--destructive) / 0.3)',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'hsl(var(--destructive) / 0.2)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'hsl(var(--destructive) / 0.1)'
                    }}
                  >
                    🗑️ Alle löschen
                  </button>
                )}
              </div>

              {/* Kompakter Upload Button */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap'
              }}>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: isDragOver 
                      ? 'hsl(var(--primary) / 0.15)' 
                      : uploadedImages.length > 0 
                        ? 'linear-gradient(135deg, hsl(142, 76%, 36%), hsl(142, 76%, 40%))'
                        : 'hsl(var(--primary) / 0.1)',
                    color: uploadedImages.length > 0 ? 'white' : 'hsl(var(--primary))',
                    border: uploadedImages.length > 0 
                      ? 'none' 
                      : `1px solid hsl(var(--primary) / 0.3)`,
                    borderRadius: '8px',
                    padding: '10px 14px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: uploadedImages.length > 0 
                      ? '0 2px 8px hsl(142, 76%, 36%, 0.3)'
                      : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (uploadedImages.length === 0) {
                      e.currentTarget.style.background = 'hsl(var(--primary) / 0.15)'
                    } else {
                      e.currentTarget.style.transform = 'translateY(-1px)'
                      e.currentTarget.style.boxShadow = '0 4px 12px hsl(142, 76%, 36%, 0.4)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (uploadedImages.length === 0) {
                      e.currentTarget.style.background = 'hsl(var(--primary) / 0.1)'
                    } else {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 2px 8px hsl(142, 76%, 36%, 0.3)'
                    }
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/bmp,image/tiff,image/gif"
                    multiple={true}
                    onChange={(e) => handleFileSelect(e.target.files)}
                    style={{ display: 'none' }}
                  />
                  
                  {uploadedImages.length === 0 ? (
                    <>
                      📁 Bilder auswählen
                    </>
                  ) : (
                    <>
                      📷 {uploadedImages.length} Bild{uploadedImages.length !== 1 ? 'er' : ''}
                    </>
                  )}
                </button>
                
                {/* Infos */}
                <div style={{
                  fontSize: '11px',
                  color: 'hsl(var(--muted-foreground))',
                  lineHeight: '1.3'
                }}>
                  Max. 14 • Je 10MB • JPEG, PNG, WebP, GIF
                  <br />
                  <span style={{ opacity: 0.7 }}>Drag & Drop unterstützt</span>
                </div>
              </div>

              {/* Upload Progress Info */}
              {uploadedImages.length > 0 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '8px',
                  fontSize: '12px',
                  color: 'hsl(var(--muted-foreground))'
                }}>
                  <span>
                    {uploadedImages.length} / 14 Bilder
                  </span>
                  <span>
                    Gesamt: {(uploadedImages.reduce((acc, file) => acc + file.size, 0) / (1024 * 1024)).toFixed(1)} MB
                  </span>
                </div>
              )}

              {/* Image Preview Grid */}
              {uploadedImages.length > 0 && (
                <div style={{
                  marginTop: '20px',
                  background: 'hsl(var(--muted) / 0.1)',
                  borderRadius: '12px',
                  padding: '20px',
                  border: '1px solid hsl(var(--border) / 0.5)'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '15px'
                  }}>
                    <h4 style={{
                      margin: 0,
                      fontSize: '14px',
                      fontWeight: '600',
                      color: 'hsl(var(--foreground))'
                    }}>
                      🖼️ Hochgeladene Bilder
                    </h4>
                    <span style={{
                      fontSize: '12px',
                      color: 'hsl(var(--muted-foreground))',
                      background: 'hsl(var(--primary) / 0.1)',
                      padding: '2px 8px',
                      borderRadius: '10px'
                    }}>
                      Reihenfolge ändern per Drag & Drop bei mehreren Bildern
                    </span>
                  </div>
                  
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(120px, 1fr))',
                    gap: isMobile ? '8px' : '12px'
                  }}>
                    {uploadedImages.map((file, index) => (
                      <div
                        key={`${file.name}-${index}`}
                        style={{
                          position: 'relative',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          background: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          transition: 'all 0.3s ease',
                          cursor: uploadedImages.length > 1 ? 'grab' : 'default'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.02)'
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)'
                          e.currentTarget.style.boxShadow = 'none'
                        }}
                        draggable={uploadedImages.length > 1}
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', index.toString())
                        }}
                        onDragOver={(e) => {
                          e.preventDefault()
                        }}
                        onDrop={(e) => {
                          e.preventDefault()
                          const dragIndex = parseInt(e.dataTransfer.getData('text/plain'))
                          const hoverIndex = index
                          if (dragIndex !== hoverIndex) {
                            moveImage(dragIndex, hoverIndex)
                          }
                        }}
                      >
                        {/* Image Preview */}
                        <div style={{
                          width: '100%',
                          height: '100px',
                          background: `url(${URL.createObjectURL(file)}) center/cover`,
                          position: 'relative'
                        }}>
                          {/* Order Badge */}
                          {uploadedImages.length > 1 && (
                            <div style={{
                              position: 'absolute',
                              top: '6px',
                              left: '6px',
                              background: 'linear-gradient(135deg, #667eea, #764ba2)',
                              color: 'white',
                              fontSize: '11px',
                              fontWeight: '600',
                              padding: '2px 6px',
                              borderRadius: '10px',
                              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                            }}>
                              #{index + 1}
                            </div>
                          )}
                          
                          {/* Remove Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              removeImage(index)
                            }}
                            style={{
                              position: 'absolute',
                              top: '6px',
                              right: '6px',
                              background: 'rgba(0, 0, 0, 0.7)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '50%',
                              width: '24px',
                              height: '24px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.3s ease',
                              opacity: 0.8
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'hsl(var(--destructive))'
                              e.currentTarget.style.opacity = '1'
                              e.currentTarget.style.transform = 'scale(1.1)'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.7)'
                              e.currentTarget.style.opacity = '0.8'
                              e.currentTarget.style.transform = 'scale(1)'
                            }}
                          >
                            ×
                          </button>
                        </div>
                        
                        {/* File Info */}
                        <div style={{
                          padding: '8px',
                          background: 'hsl(var(--background))'
                        }}>
                          <p style={{
                            margin: '0 0 2px 0',
                            fontSize: '11px',
                            fontWeight: '500',
                            color: 'hsl(var(--foreground))',
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap'
                          }}>
                            {file.name}
                          </p>
                          <p style={{
                            margin: 0,
                            fontSize: '10px',
                            color: 'hsl(var(--muted-foreground))'
                          }}>
                            {(file.size / (1024 * 1024)).toFixed(1)} MB
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Blending Info for Multi Mode */}
                  {uploadedImages.length > 1 && (
                    <div style={{
                      marginTop: '15px',
                      padding: '12px',
                      background: 'hsl(var(--primary) / 0.05)',
                      borderRadius: '8px',
                      border: '1px solid hsl(var(--primary) / 0.2)'
                    }}>
                      <p style={{
                        margin: '0 0 4px 0',
                        fontSize: '12px',
                        fontWeight: '500',
                        color: 'hsl(var(--primary))'
                      }}>
                        ✨ Multi-Image Blending aktiviert
                      </p>
                      <p style={{
                        margin: 0,
                        fontSize: '11px',
                        color: 'hsl(var(--muted-foreground))'
                      }}>
                        Seedream 4.5 wird die Stile und Elemente aller {uploadedImages.length} Bilder intelligent kombinieren. Die Reihenfolge beeinflusst die Gewichtung.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

          {/* Prompt Input */}
          <div style={{ marginBottom: '25px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px'
            }}>
              <label style={{
                fontSize: '14px',
                fontWeight: '500',
                color: 'hsl(var(--foreground))',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                🎨 Prompt
                <span style={{
                  fontSize: '12px',
                  color: 'hsl(var(--muted-foreground))',
                  background: 'hsl(var(--muted) / 0.3)',
                  padding: '2px 8px',
                  borderRadius: '12px'
                }}>
                  Max 600 Wörter empfohlen
                </span>
              </label>
            </div>

            {/* Quick Prompt Buttons */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '8px',
              marginBottom: '12px'
            }}>
              <button
                onClick={() => setPrompt('an other camera angle, from above')}
                style={{
                  background: 'hsl(var(--muted) / 0.3)',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  fontSize: '11px',
                  fontWeight: '500',
                  color: 'hsl(var(--foreground))',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'hsl(var(--primary) / 0.1)'
                  e.currentTarget.style.borderColor = 'hsl(var(--primary) / 0.3)'
                  e.currentTarget.style.color = 'hsl(var(--primary))'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'hsl(var(--muted) / 0.3)'
                  e.currentTarget.style.borderColor = 'hsl(var(--border))'
                  e.currentTarget.style.color = 'hsl(var(--foreground))'
                }}
              >
                Von oben
              </button>

              <button
                onClick={() => setPrompt('an other camera angle, from below')}
                style={{
                  background: 'hsl(var(--muted) / 0.3)',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  fontSize: '11px',
                  fontWeight: '500',
                  color: 'hsl(var(--foreground))',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'hsl(var(--primary) / 0.1)'
                  e.currentTarget.style.borderColor = 'hsl(var(--primary) / 0.3)'
                  e.currentTarget.style.color = 'hsl(var(--primary))'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'hsl(var(--muted) / 0.3)'
                  e.currentTarget.style.borderColor = 'hsl(var(--border))'
                  e.currentTarget.style.color = 'hsl(var(--foreground))'
                }}
              >
                Von unten
              </button>

              <button
                onClick={() => setPrompt('professional photoshoot, studio lighting, high quality')}
                style={{
                  background: 'hsl(var(--muted) / 0.3)',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  fontSize: '11px',
                  fontWeight: '500',
                  color: 'hsl(var(--foreground))',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'hsl(var(--primary) / 0.1)'
                  e.currentTarget.style.borderColor = 'hsl(var(--primary) / 0.3)'
                  e.currentTarget.style.color = 'hsl(var(--primary))'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'hsl(var(--muted) / 0.3)'
                  e.currentTarget.style.borderColor = 'hsl(var(--border))'
                  e.currentTarget.style.color = 'hsl(var(--foreground))'
                }}
              >
                Studio
              </button>

              <button
                onClick={() => setPrompt('natural lighting, outdoor setting, candid moment')}
                style={{
                  background: 'hsl(var(--muted) / 0.3)',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  fontSize: '11px',
                  fontWeight: '500',
                  color: 'hsl(var(--foreground))',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'hsl(var(--primary) / 0.1)'
                  e.currentTarget.style.borderColor = 'hsl(var(--primary) / 0.3)'
                  e.currentTarget.style.color = 'hsl(var(--primary))'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'hsl(var(--muted) / 0.3)'
                  e.currentTarget.style.borderColor = 'hsl(var(--border))'
                  e.currentTarget.style.color = 'hsl(var(--foreground))'
                }}
              >
                Natürlich
              </button>
            </div>

            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Beschreibe das Bild, das du generieren möchtest..."
              style={{
                width: '100%',
                minHeight: '100px',
                padding: '12px',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '14px',
                resize: 'vertical',
                background: 'hsl(var(--background))',
                color: 'hsl(var(--foreground))',
                fontFamily: 'inherit',
                transition: 'border-color 0.3s ease'
              }}
              maxLength={1000}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#667eea'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'hsl(var(--border))'
              }}
            />
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '6px'
            }}>
              <span style={{
                fontSize: '12px',
                color: 'hsl(var(--muted-foreground))'
              }}>
                {prompt.length}/1000 Zeichen
              </span>
              {prompt.length > 600 && (
                <span style={{
                  fontSize: '11px',
                  color: '#ffa726',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: 'hsl(var(--warning) / 0.1)'
                }}>
                  ⚠️ Sehr lang - könnte Details verlieren
                </span>
              )}
            </div>
          </div>

          {/* Settings Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: isMobile ? '15px' : '20px'
          }}>
            
            {/* Image Quality Settings */}
            <div style={{ marginBottom: '0px' }}>
              
              <div style={{ 
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: isMobile ? '15px' : '20px',
                alignItems: 'start'
              }}>
                {/* Resolution Button */}
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column'
                }}>
                  <label style={{
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: 'hsl(var(--foreground))'
                  }}>
                    Bildqualität
                  </label>
                  <button
                    onClick={() => {
                      if (size === '1K') setSize('2K')
                      else if (size === '2K') setSize('4K')
                      else setSize('1K')
                    }}
                    style={{
                      padding: '8px 12px',
                      background: 'hsl(47 100% 65%)',
                      color: 'hsl(30 10% 20%)',
                      border: '2px solid hsl(47 100% 55%)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '13px',
                      transition: 'all 0.2s ease',
                      width: '100%',
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-1px)'
                      e.target.style.boxShadow = '0 2px 8px hsl(47 100% 65% / 0.3)'
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)'
                      e.target.style.boxShadow = 'none'
                    }}
                  >
                    <span style={{ fontSize: '15px', fontWeight: '700' }}>{size}</span>
                    <span style={{ fontSize: '11px', opacity: 0.8 }}>•</span>
                    <span style={{ fontSize: '11px', opacity: 0.8 }}>
                      {size === '1K' ? 'Schnell' : size === '2K' ? 'Optimal' : 'Maximal'}
                    </span>
                  </button>
                  <p style={{
                    margin: '6px 0 0 0',
                    fontSize: '11px',
                    color: 'hsl(var(--muted-foreground))',
                    textAlign: 'center'
                  }}>
                    {(() => {
                      const baseSizes = {
                        '1K': 1024,
                        '2K': 2048,  
                        '4K': 4096
                      }
                      
                      const calculateCorrectSize = (baseSize, aspectRatio) => {
                        const [w, h] = aspectRatio.split(':').map(Number)
                        
                        if (w > h) {
                          // Landscape: width ist die längste Seite
                          const width = baseSize
                          const height = Math.round(baseSize * (h / w))
                          return { width, height }
                        } else {
                          // Portrait: height ist die längste Seite  
                          const height = baseSize
                          const width = Math.round(baseSize * (w / h))
                          return { width, height }
                        }
                      }
                      
                      const baseSize = baseSizes[size] || 1024
                      const result = calculateCorrectSize(baseSize, aspectRatio)
                      
                      const description = size === '1K' ? 'Schnelle Generation' : 
                                        size === '2K' ? 'Beste Balance' : 
                                        'Höchste Qualität'
                      
                      return `${result.width}×${result.height}px • ${description}`
                    })()}
                  </p>
              </div>

                {/* Aspect Ratio Button */}
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column'
                }}>
                  <label style={{
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: 'hsl(var(--foreground))'
                  }}>
                    Seitenverhältnis
                  </label>
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
                      padding: '8px 12px',
                      background: 'hsl(280 70% 60%)',
                      color: 'white',
                      border: '2px solid hsl(280 70% 50%)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '13px',
                      transition: 'all 0.2s ease',
                      width: '100%',
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-1px)'
                      e.target.style.boxShadow = '0 2px 8px hsl(280 70% 60% / 0.3)'
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)'
                      e.target.style.boxShadow = 'none'
                    }}
                  >
                    <span style={{ fontSize: '15px', fontWeight: '700' }}>{aspectRatio}</span>
                    <span style={{ fontSize: '11px', opacity: 0.9 }}>•</span>
                    <span style={{ fontSize: '11px', opacity: 0.9 }}>
                      {aspectRatio === '9:16' ? 'Portrait' : 
                       aspectRatio === '16:9' ? 'Landscape' :
                       aspectRatio === '4:3' ? 'Klassisch' :
                       aspectRatio === '3:4' ? 'Hoch' :
                       aspectRatio === '2:3' ? 'Foto' : 'Breit'}
                    </span>
                  </button>
                  <p style={{
                    margin: '6px 0 0 0',
                    fontSize: '11px',
                    color: 'hsl(var(--muted-foreground))',
                    textAlign: 'center'
                  }}>
                    {aspectRatio === '9:16' ? 'Perfekt für Mobile & Stories' : 
                     aspectRatio === '16:9' ? 'Ideal für Desktop & Video' :
                     aspectRatio === '4:3' ? 'Standard Format' :
                     aspectRatio === '3:4' ? 'Portrait Format' :
                     aspectRatio === '2:3' ? 'Foto Proportionen' : 'Panorama Format'}
                  </p>
                </div>
              </div>
            </div>



            {/* Sequential Generation Toggle - Above the slider */}
            <div style={{ 
              marginTop: isMobile ? '15px' : '0',
              marginBottom: '15px'
            }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                background: 'hsl(var(--muted) / 0.1)',
                borderRadius: '8px',
                border: '1px solid hsl(var(--border))',
                cursor: 'pointer',
                opacity: uploadedImages.length === 0 ? 0.5 : 1
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: 'hsl(var(--foreground))'
                  }}>
                    ⚡ Sequential Generation
                  </span>
                  <div 
                    style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      border: '1px solid hsl(var(--muted-foreground))',
                      color: 'hsl(var(--muted-foreground))',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={(e) => {
                      e.preventDefault()
                      setShowSequentialInfo(true)
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'hsl(var(--muted))'
                      e.currentTarget.style.borderColor = 'hsl(var(--primary))'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.borderColor = 'hsl(var(--muted-foreground))'
                    }}
                  >
                    ?
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={sequentialGeneration}
                  onChange={(e) => setSequentialGeneration(e.target.checked)}
                  disabled={uploadedImages.length === 0}
                  style={{
                    transform: 'scale(1.3)',
                    accentColor: '#667eea'
                  }}
                />
              </label>
              {uploadedImages.length === 0 && (
                <div style={{
                  fontSize: '12px',
                  color: 'hsl(var(--muted-foreground))',
                  marginTop: '6px',
                  textAlign: 'center'
                }}>
                  📸 Lade erst Bilder hoch
                </div>
              )}
            </div>

            {/* Number of Images - Only show when Sequential is disabled */}
            {!sequentialGeneration && (
              <div style={{ marginTop: '0px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '12px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: 'hsl(var(--foreground))'
                }}>
                  📷 Anzahl Bilder
                  <span style={{
                    fontSize: '12px',
                    color: 'hsl(var(--muted-foreground))',
                    marginLeft: '6px'
                  }}>
                    {numImages === 1 ? 'Einzelbild' : `${numImages}x Batch`}
                  </span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={numImages}
                    onChange={(e) => setNumImages(Number(e.target.value))}
                    style={{
                      width: '100%',
                      height: '6px',
                      borderRadius: '3px',
                      background: `linear-gradient(to right, #667eea 0%, #667eea ${((numImages - 1) / 9) * 100}%, hsl(var(--border)) ${((numImages - 1) / 9) * 100}%, hsl(var(--border)) 100%)`,
                      outline: 'none',
                      appearance: 'none',
                      cursor: 'pointer'
                    }}
                  />
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: '8px',
                    fontSize: '12px',
                    color: 'hsl(var(--muted-foreground))'
                  }}>
                    <span>1</span>
                    <span>2</span>
                    <span>3</span>
                    <span>4</span>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Options Container - Collapsible */}
          <div style={{ marginTop: '25px' }}>
            <div style={{
              background: 'hsl(var(--muted) / 0.1)',
              borderRadius: '12px',
              border: '1px solid hsl(var(--border))',
              overflow: 'hidden'
            }}>
              
              {/* Options Header - Clickable */}
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease'
                }}
                onClick={() => setOptionsExpanded(!optionsExpanded)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'hsl(var(--muted) / 0.2)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                <h4 style={{
                  margin: 0,
                  fontSize: '16px',
                  fontWeight: '600',
                  color: 'hsl(var(--foreground))'
                }}>
                  ⚙️ Optionen
                </h4>
                
                {/* Expand/Collapse Icon */}
                <div style={{
                  transform: optionsExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s ease',
                  color: 'hsl(var(--muted-foreground))',
                  fontSize: '18px'
                }}>
                  ▼
                </div>
              </div>

              {/* Options Content - Collapsible */}
              {optionsExpanded && (
                <div style={{
                  padding: '0 16px 16px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                
                {/* Wasserzeichen */}
              <label style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px',
                background: 'hsl(var(--background))',
                borderRadius: '8px',
                border: '1px solid hsl(var(--border))',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'hsl(var(--muted) / 0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'hsl(var(--background))'
              }}>
                <div>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: 'hsl(var(--foreground))',
                    display: 'block'
                  }}>
                    Wasserzeichen hinzufügen
                  </span>
                  <span style={{
                    fontSize: '12px',
                    color: 'hsl(var(--muted-foreground))'
                  }}>
                    "AI generated" unten rechts
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={watermark}
                  onChange={(e) => setWatermark(e.target.checked)}
                  style={{
                    transform: 'scale(1.2)',
                    accentColor: '#667eea'
                  }}
                />
              </label>
              
              {/* Prompt Optimierung */}
              <label style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px',
                background: 'hsl(var(--background))',
                borderRadius: '8px',
                border: '1px solid hsl(var(--border))',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'hsl(var(--muted) / 0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'hsl(var(--background))'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      color: 'hsl(var(--foreground))',
                      display: 'block'
                    }}>
                      Prompt Optimierung aktivieren
                    </span>
                    <div 
                      style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        border: '1px solid hsl(var(--muted-foreground))',
                        color: 'hsl(var(--muted-foreground))',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowOptimizationInfo(!showOptimizationInfo)
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'hsl(var(--muted) / 0.2)'
                        e.currentTarget.style.borderColor = 'hsl(var(--foreground))'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                        e.currentTarget.style.borderColor = 'hsl(var(--muted-foreground))'
                      }}
                    >
                      ?
                    </div>
                  </div>
                  <span style={{
                    fontSize: '12px',
                    color: 'hsl(var(--muted-foreground))'
                  }}>
                    {promptOptimization ? 'Seedream erweitert automatisch deinen Prompt für bessere Qualität' : 'Dein Prompt wird unverändert verwendet'}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={promptOptimization}
                  onChange={(e) => setPromptOptimization(e.target.checked)}
                  style={{
                    transform: 'scale(1.2)',
                    accentColor: '#667eea'
                  }}
                />
              </label>
                </div>
              )}
            </div>
          </div>

          {/* Optimization Info Modal */}
          {showOptimizationInfo && (
            <div 
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000
              }}
              onClick={() => setShowOptimizationInfo(false)}
            >
              <div 
                style={{
                  background: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '16px',
                  padding: '24px',
                  maxWidth: '500px',
                  margin: '20px',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <h3 style={{
                  margin: '0 0 16px 0',
                  fontSize: '18px',
                  fontWeight: '600',
                  color: 'hsl(var(--foreground))'
                }}>
                  💡 Prompt Optimierung
                </h3>
                
                <div style={{ 
                  marginBottom: '16px',
                  lineHeight: '1.6',
                  color: 'hsl(var(--foreground))',
                  fontSize: '14px'
                }}>
                  <p style={{ margin: '0 0 12px 0' }}>
                    Seedream erweitert automatisch deinen Prompt für bessere Ergebnisse:
                  </p>
                  
                  <div style={{
                    background: 'hsl(var(--muted) / 0.2)',
                    padding: '12px',
                    borderRadius: '8px',
                    marginBottom: '12px',
                    border: '1px solid hsl(var(--border))'
                  }}>
                    <p style={{ margin: '0 0 8px 0', fontWeight: '500' }}>
                      <span style={{ color: '#667eea' }}>Beispiel:</span> "Frau mit Sonnenschirm"
                    </p>
                    <p style={{ margin: '0 0 8px 0', fontSize: '12px' }}>
                      <strong>Standard:</strong> "A beautiful woman holding a colorful umbrella, standing in a sunny garden, natural lighting, high quality photography, detailed skin texture, vibrant colors, professional portrait"
                    </p>
                    <p style={{ margin: '0', fontSize: '12px' }}>
                      <strong>Schnell:</strong> Weniger Erweiterung, schnellere Generation
                    </p>
                  </div>

                  <div style={{ fontSize: '13px', color: 'hsl(var(--muted-foreground))' }}>
                    ✅ Bessere Bildqualität durch technische Keywords<br/>
                    ✅ Konsistentere Ergebnisse<br/>
                    ⚡ <strong>Schnell:</strong> Weniger Details, schnelle Generation<br/>
                    🎯 <strong>Standard:</strong> Maximale Qualität, längere Wartezeit
                  </div>
                </div>
                
                <button
                  onClick={() => setShowOptimizationInfo(false)}
                  style={{
                    background: 'hsl(var(--primary))',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Verstanden
                </button>
              </div>
            </div>
          )}


          {/* Sequential Generation Info Modal */}
          {showSequentialInfo && (
            <div 
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000
              }}
              onClick={() => setShowSequentialInfo(false)}
            >
              <div 
                style={{
                  background: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '16px',
                  padding: '24px',
                  maxWidth: '550px',
                  margin: '20px',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <h3 style={{
                  margin: '0 0 16px 0',
                  fontSize: '18px',
                  fontWeight: '600',
                  color: 'hsl(var(--foreground))'
                }}>
                  ⚡ Sequential Generation
                </h3>
                
                <div style={{ 
                  lineHeight: '1.6',
                  color: 'hsl(var(--foreground))',
                  fontSize: '14px'
                }}>
                  <p style={{ margin: '0 0 16px 0' }}>
                    Sequential Generation erstellt automatisch mehrere thematisch verwandte Bilder in einer Serie:
                  </p>
                  
                  <div style={{
                    display: 'grid',
                    gap: '12px',
                    marginBottom: '16px'
                  }}>
                    <div style={{
                      background: 'hsl(var(--muted) / 0.2)',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '2px solid #667eea'
                    }}>
                      <p style={{ margin: '0 0 6px 0', fontWeight: '600' }}>🎯 Normal (Deaktiviert)</p>
                      <p style={{ margin: '0', fontSize: '13px', color: 'hsl(var(--muted-foreground))' }}>
                        DU entscheidest: 1-4 Bilder mit dem Regler
                      </p>
                    </div>

                    <div style={{
                      background: 'hsl(var(--muted) / 0.2)',
                      padding: '12px',
                      borderRadius: '8px'
                    }}>
                      <p style={{ margin: '0 0 6px 0', fontWeight: '600' }}>🚀 Sequential (Aktiviert)</p>
                      <p style={{ margin: '0', fontSize: '13px', color: 'hsl(var(--muted-foreground))' }}>
                        KI entscheidet: Automatisch 1-15 Bilder je nach Kreativität
                      </p>
                    </div>
                  </div>

                  <div style={{
                    background: 'hsl(var(--muted) / 0.1)',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid hsl(var(--border))',
                    marginBottom: '16px'
                  }}>
                    <p style={{ margin: '0 0 8px 0', fontWeight: '600', fontSize: '13px' }}>
                      📝 Beispiel:
                    </p>
                    <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: 'hsl(var(--muted-foreground))' }}>
                      <strong>Prompt:</strong> "Katze im Garten"
                    </p>
                    <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: 'hsl(var(--muted-foreground))' }}>
                      <strong>Normal:</strong> Du stellst "3 Bilder" ein → genau 3 ähnliche Katzen
                    </p>
                    <p style={{ margin: '0', fontSize: '13px', color: 'hsl(var(--muted-foreground))' }}>
                      <strong>Sequential:</strong> Du stellst "max 8" ein → KI macht 5-8 verschiedene Katzen-Variationen
                    </p>
                  </div>

                  <div style={{
                    padding: '12px',
                    background: 'hsl(var(--primary) / 0.1)',
                    borderRadius: '8px',
                    border: '1px solid hsl(var(--primary) / 0.2)'
                  }}>
                    <p style={{ margin: '0', fontSize: '12px', color: 'hsl(var(--primary))', fontWeight: '500' }}>
                      💡 Tipp: Perfekt für kreative Exploration und um verschiedene Varianten deines Konzepts zu entdecken! 
                      Die KI variiert automatisch Details wie Perspektive, Beleuchtung und Komposition.
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => setShowSequentialInfo(false)}
                  style={{
                    background: 'hsl(var(--primary))',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    marginTop: '16px'
                  }}
                >
                  Verstanden
                </button>
              </div>
            </div>
          )}

          {/* OLD SECTION REMOVED - Now handled above */}
          {false && uploadedImages.length > 0 && (
            <div style={{
              background: 'hsl(var(--muted) / 0.2)',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '25px',
              border: '1px solid hsl(var(--border) / 0.5)'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '15px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h4 style={{
                    margin: 0,
                    fontSize: '16px',
                    fontWeight: '600',
                    color: 'hsl(var(--foreground))'
                  }}>
                    ⚡ Sequential Generation
                  </h4>
                  <div 
                    style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      border: '1px solid hsl(var(--muted-foreground))',
                      color: 'hsl(var(--muted-foreground))',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={(e) => {
                      e.preventDefault()
                      setShowSequentialInfo(true)
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'hsl(var(--muted))'
                      e.currentTarget.style.borderColor = 'hsl(var(--primary))'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.borderColor = 'hsl(var(--muted-foreground))'
                    }}
                  >
                    ?
                  </div>
                </div>
                <span style={{
                  fontSize: '12px',
                  color: 'hsl(var(--muted-foreground))',
                  background: sequentialGeneration 
                    ? 'hsl(var(--primary) / 0.1)' 
                    : 'hsl(var(--muted) / 0.3)',
                  padding: '2px 8px',
                  borderRadius: '10px'
                }}>
                  {sequentialGeneration ? 'Aktiviert' : 'Deaktiviert'}
                </span>
              </div>

              {/* Sequential Generation Toggle */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '15px',
                  background: sequentialGeneration 
                    ? 'hsl(var(--primary) / 0.05)' 
                    : 'hsl(var(--background))',
                  borderRadius: '8px',
                  border: sequentialGeneration 
                    ? '1px solid hsl(var(--primary) / 0.2)' 
                    : '1px solid hsl(var(--border))',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  if (!sequentialGeneration) {
                    e.currentTarget.style.background = 'hsl(var(--muted) / 0.3)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!sequentialGeneration) {
                    e.currentTarget.style.background = 'hsl(var(--background))'
                  }
                }}>
                  <div>
                    <span style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      color: 'hsl(var(--foreground))',
                      display: 'block',
                      marginBottom: '4px'
                    }}>
                      🔄 Auto Batch Generation
                    </span>
                    <span style={{
                      fontSize: '12px',
                      color: 'hsl(var(--muted-foreground))'
                    }}>
                      Generiere automatisch mehrere Variationen nacheinander
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={sequentialGeneration}
                    onChange={(e) => setSequentialGeneration(e.target.checked)}
                    style={{
                      transform: 'scale(1.3)',
                      accentColor: '#667eea'
                    }}
                  />
                </label>
              </div>

              {/* Max Images Slider - only shown when sequential is enabled */}
              {sequentialGeneration && (
                <div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px'
                  }}>
                    <label style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      color: 'hsl(var(--foreground))'
                    }}>
                      🎯 Maximale Bilder
                    </label>
                    <span style={{
                      fontSize: '13px',
                      fontWeight: '600',
                      color: 'hsl(var(--primary))',
                      background: 'hsl(var(--primary) / 0.1)',
                      padding: '4px 8px',
                      borderRadius: '6px'
                    }}>
                      {maxImages} Bilder
                    </span>
                  </div>
                  
                  <div style={{
                    background: 'hsl(var(--background))',
                    borderRadius: '8px',
                    padding: '15px',
                    border: '1px solid hsl(var(--border))'
                  }}>
                    <input
                      type="range"
                      min="1"
                      max="15"
                      value={maxImages}
                      onChange={(e) => setMaxImages(Number(e.target.value))}
                      style={{
                        width: '100%',
                        height: '6px',
                        background: `linear-gradient(to right, #667eea 0%, #667eea ${(maxImages-1)/14*100}%, hsl(var(--muted)) ${(maxImages-1)/14*100}%, hsl(var(--muted)) 100%)`,
                        borderRadius: '3px',
                        outline: 'none',
                        cursor: 'pointer',
                        accentColor: '#667eea'
                      }}
                    />
                    
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginTop: '8px',
                      fontSize: '11px',
                      color: 'hsl(var(--muted-foreground))'
                    }}>
                      <span>1</span>
                      <span>15 (Max)</span>
                    </div>
                  </div>

                  {/* Sequential Info */}
                  <div style={{
                    marginTop: '15px',
                    padding: '12px',
                    background: 'hsl(var(--primary) / 0.05)',
                    borderRadius: '8px',
                    border: '1px solid hsl(var(--primary) / 0.2)'
                  }}>
                    <p style={{
                      margin: '0 0 4px 0',
                      fontSize: '12px',
                      fontWeight: '500',
                      color: 'hsl(var(--primary))'
                    }}>
                      💡 Sequential Generation Details
                    </p>
                    <p style={{
                      margin: 0,
                      fontSize: '11px',
                      color: 'hsl(var(--muted-foreground))',
                      lineHeight: '1.4'
                    }}>
                      Seedream 4.5 wird bis zu {getMaxOutputImages()} Bilder generieren, basierend auf deinen {uploadedImages.length} hochgeladenen Bildern. 
                      Jede Generation variiert leicht für mehr Vielfalt. Perfekt für kreative Exploration!
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div style={{
              background: 'hsl(0 100% 97%)',
              border: '1px solid hsl(0 100% 85%)',
              color: 'hsl(0 100% 45%)',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}
        </div>
      </div>
      
      {/* Generate Button - Outside container */}
      <div style={{ 
        marginTop: isMobile ? '-25px' : '-35px',
        paddingLeft: isMobile ? '20px' : '0',
        paddingRight: isMobile ? '20px' : '0'
      }}>
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
          style={{
            width: '100%',
            padding: '14px 24px',
            border: 'none',
            borderRadius: '10px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: isGenerating || !prompt.trim() ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease',
            background: isGenerating || !prompt.trim() 
              ? 'hsl(var(--muted))' 
              : 'linear-gradient(135deg, #667eea, #764ba2)',
            color: 'white',
            opacity: isGenerating || !prompt.trim() ? 0.6 : 1,
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={(e) => {
            if (!isGenerating && prompt.trim()) {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.4)'
            }
          }}
          onMouseLeave={(e) => {
            if (!isGenerating && prompt.trim()) {
              e.currentTarget.style.transform = 'translateY(0px)'
              e.currentTarget.style.boxShadow = 'none'
            }
          }}
        >
          {isGenerating ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}>
              <div style={{
                width: '16px',
                height: '16px',
                border: '2px solid rgba(255,255,255,0.3)',
                borderTop: '2px solid white',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              <span>Generiere Bilder... {elapsedTime > 0 ? formatTime(elapsedTime) : ''}</span>
            </div>
          ) : (
            'Bilder generieren'
          )}
        </button>
      </div>

        {/* Generated Images */}
        {generatedImages.length > 0 && (
          <div style={{
            background: 'hsl(var(--card))',
            borderRadius: '20px',
            padding: '30px',
            border: '1px solid hsl(var(--border))',
            marginBottom: '30px'
          }}>
            <h3 style={{
              margin: '0 0 20px 0',
              fontSize: '20px',
              fontWeight: '600',
              color: '#764ba2'
            }}>
              Generierte Bilder ({generatedImages.length}){generationTime && ` • ${generationTime}s`}
            </h3>
            
            <div style={{
              display: 'grid',
              gap: '25px',
              gridTemplateColumns: 
                generatedImages.length === 1 ? '1fr' :
                generatedImages.length === 2 ? 'repeat(2, 1fr)' :
                generatedImages.length <= 4 ? 'repeat(2, 1fr)' :
                generatedImages.length <= 6 ? 'repeat(3, 1fr)' :
                'repeat(4, 1fr)', // 7+ Bilder in 4 Spalten
              maxWidth: generatedImages.length === 1 ? '600px' : '800px', // Kleinere Bilder
              margin: '0 auto'
            }}>
              {generatedImages.map((image, index) => (
                <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{
                    position: 'relative',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    transition: 'transform 0.3s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.02)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)'
                  }}>
                    <img
                      src={image.url}
                      alt={`Generated ${index + 1}`}
                      style={{
                        width: '100%',
                        borderRadius: '12px',
                        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)'
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none'
                        e.target.nextSibling.style.display = 'block'
                      }}
                    />
                    <div style={{
                      display: 'none',
                      background: 'hsl(var(--muted))',
                      padding: '20px',
                      borderRadius: '12px',
                      textAlign: 'center'
                    }}>
                      <p style={{
                        margin: 0,
                        fontSize: '14px',
                        color: 'hsl(var(--foreground))'
                      }}>
                        Bild konnte nicht geladen werden
                      </p>
                    </div>
                    
                    {/* Download Button Overlay */}
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(0, 0, 0, 0)',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: 0,
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(0, 0, 0, 0.3)'
                      e.currentTarget.style.opacity = '1'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(0, 0, 0, 0)'
                      e.currentTarget.style.opacity = '0'
                    }}>
                      <a
                        href={image.url}
                        download={`seedream-${Date.now()}-${index + 1}.png`}
                        style={{
                          background: 'white',
                          color: 'black',
                          padding: '10px 20px',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: '500',
                          textDecoration: 'none',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#f0f0f0'
                          e.currentTarget.style.transform = 'scale(1.05)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'white'
                          e.currentTarget.style.transform = 'scale(1)'
                        }}
                      >
                        ⬇ Download
                      </a>
                    </div>
                  </div>
                  
                  {image.revisedPrompt && image.revisedPrompt !== prompt && (
                    <div style={{
                      background: 'hsl(var(--muted) / 0.3)',
                      borderRadius: '8px',
                      padding: '12px'
                    }}>
                      <p style={{
                        margin: '0 0 4px 0',
                        fontSize: '12px',
                        fontWeight: '500',
                        color: 'hsl(var(--muted-foreground))'
                      }}>
                        Revised Prompt:
                      </p>
                      <p style={{
                        margin: 0,
                        fontSize: '13px',
                        color: 'hsl(var(--foreground))',
                        lineHeight: '1.4'
                      }}>
                        {image.revisedPrompt}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Community Inspiration Gallery */}
        {user && (
          <UserInspoGallery currentUser={user} />
        )}

        {/* Personal Gallery - Recent Images */}
        {user && (
          <div style={{
            background: 'hsl(var(--card))',
            borderRadius: '20px',
            padding: '30px',
            border: '1px solid hsl(var(--border))',
            marginBottom: '30px'
          }}>
            <h3 style={{
              margin: '0 0 20px 0',
              fontSize: '20px',
              fontWeight: '600',
              color: '#764ba2',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>🖼️</span>
              Meine Seedream Galerie
            </h3>
            <RecentImagesHistory currentUser={user} />
          </div>
        )}

        {/* Cost & Preview Info */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: isMobile ? '15px' : '20px',
          marginTop: '25px',
          marginBottom: '40px'
        }}>
          <div style={{
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: isMobile ? '12px' : '20px',
            padding: isMobile ? '12px' : '20px',
            textAlign: 'center'
          }}>
            <p style={{
              margin: '0 0 6px 0',
              fontSize: isMobile ? '13px' : '14px',
              fontWeight: '600',
              color: 'hsl(var(--primary))'
            }}>
              💰 Preismodell
            </p>
            <p style={{
              margin: 0,
              fontSize: isMobile ? '11px' : '12px',
              color: 'hsl(var(--muted-foreground))',
              lineHeight: '1.4'
            }}>
              ~$0.04 pro Bild • 200 kostenlose Bilder für neue Nutzer
            </p>
          </div>
          <div style={{
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: isMobile ? '12px' : '20px',
            padding: isMobile ? '12px' : '20px',
            textAlign: 'center'
          }}>
            <p style={{
              margin: '0 0 6px 0',
              fontSize: isMobile ? '13px' : '14px',
              fontWeight: '600',
              color: '#ffa726'
            }}>
              ⚠️ Preview Phase
            </p>
            <p style={{
              margin: 0,
              fontSize: isMobile ? '11px' : '12px',
              color: 'hsl(var(--muted-foreground))',
              lineHeight: '1.4'
            }}>
              3.-9. Dezember 2025 • Max 50 Bilder/Minute
            </p>
          </div>
        </div>
        
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/bmp,image/tiff,image/gif"
          multiple
          onChange={(e) => {
            if (e.target.files) {
              handleFileSelect(e.target.files)
            }
          }}
          style={{ display: 'none' }}
        />
      </div>
    )
  }

export default SeedreamPage