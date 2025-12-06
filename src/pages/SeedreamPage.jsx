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

function SeedreamPage() {
  const { user } = useAuth()
  const [prompt, setPrompt] = useState('black bikini and an other camera angle, from above')
  const [size, setSize] = useState('1K')
  const [aspectRatio, setAspectRatio] = useState('9:16')
  const [style, setStyle] = useState('auto')
  const [numImages, setNumImages] = useState(1)
  const [watermark, setWatermark] = useState(false)
  const [promptOptimization, setPromptOptimization] = useState('standard') // 'standard' or 'fast'
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImages, setGeneratedImages] = useState([])
  const [error, setError] = useState('')
  const [usageInfo, setUsageInfo] = useState(null)
  const [generationTime, setGenerationTime] = useState(null)
  const [accountInfo, setAccountInfo] = useState(null)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

  // Image Upload states
  const [uploadedImages, setUploadedImages] = useState([])
  const [sequentialGeneration, setSequentialGeneration] = useState(false)
  const [maxImages, setMaxImages] = useState(15)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef(null)


  // Mobile detection
  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

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
        num_images: numImages,
        images: uploadedImages,
        sequential_image_generation: sequentialGeneration ? 'auto' : 'disabled',
        max_images: maxImages
      }
      
      const validation = validateSeedreamOptions(validationOptions)
      
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '))
      }

      console.log('🌱 Starting Seedream generation...')
      console.log('Images:', uploadedImages.length)

      const startTime = Date.now()
      
      const result = await generateSeedreamImage({
        prompt,
        size,
        aspectRatio,
        style,
        num_images: numImages,
        watermark,
        images: uploadedImages, // Add reference images
        sequential_image_generation: sequentialGeneration ? 'auto' : 'disabled',
        max_images: maxImages,
        promptOptimization // Add prompt optimization
      })

      const endTime = Date.now()
      const duration = ((endTime - startTime) / 1000).toFixed(1)
      setGenerationTime(duration)

      if (result.success) {
        setGeneratedImages(result.images)
        showUsageFromResponse(result)
        console.log(`✅ Images generated: ${result.images.length} in ${duration}s`)
      } else {
        throw new Error(result.error)
      }

    } catch (error) {
      console.error('❌ Generation error:', error)
      setError(error.message)
    } finally {
      setIsGenerating(false)
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
          <p style={{
            margin: '0 0 15px 0',
            fontSize: '16px',
            color: 'hsl(var(--muted-foreground))',
            fontFamily: 'Georgia, serif',
            fontStyle: 'italic'
          }}>
            High-fidelity 4K AI Image Generation
          </p>
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
          
          {/* Form Header */}
          <h3 style={{
            margin: '0 0 25px 0',
            fontSize: '20px',
            fontWeight: '600',
            color: '#667eea'
          }}>
            Bild generieren
          </h3>

          
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
                  📸 Referenz-Bilder
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

              {/* Drag & Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${isDragOver ? '#667eea' : 'hsl(var(--border))'}`,
                  borderRadius: '12px',
                  padding: isMobile ? '30px 20px' : '40px 30px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  background: isDragOver 
                    ? 'hsl(var(--primary) / 0.05)' 
                    : uploadedImages.length > 0 
                      ? 'hsl(var(--muted) / 0.1)'
                      : 'hsl(var(--background))',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  if (uploadedImages.length === 0) {
                    e.currentTarget.style.borderColor = '#667eea'
                    e.currentTarget.style.background = 'hsl(var(--primary) / 0.03)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isDragOver && uploadedImages.length === 0) {
                    e.currentTarget.style.borderColor = 'hsl(var(--border))'
                    e.currentTarget.style.background = 'hsl(var(--background))'
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
                  <div>
                    <div style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '16px',
                      background: 'linear-gradient(135deg, hsl(var(--primary) / 0.1), hsl(var(--primary) / 0.05))',
                      border: '2px solid hsl(var(--primary) / 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '20px',
                      transition: 'all 0.3s ease',
                      margin: '0 auto 20px auto'
                    }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7,10 12,15 17,10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                    </div>
                    <h3 style={{
                      margin: '0 0 8px 0',
                      fontSize: '18px',
                      fontWeight: '600',
                      color: 'hsl(var(--foreground))',
                      textAlign: 'center'
                    }}>
                      Referenzbilder hinzufügen
                    </h3>
                    <p style={{
                      margin: '0 0 20px 0',
                      fontSize: '14px',
                      color: 'hsl(var(--muted-foreground))',
                      textAlign: 'center',
                      lineHeight: '1.5'
                    }}>
                      Ziehe Dateien hierher oder klicke zum Durchsuchen
                    </p>
                    <div style={{
                      display: 'flex',
                      gap: '8px',
                      flexWrap: 'wrap',
                      justifyContent: 'center',
                      marginBottom: '16px'
                    }}>
                      {['JPEG', 'PNG', 'WebP', 'GIF', 'BMP', 'TIFF'].map(format => (
                        <span
                          key={format}
                          style={{
                            background: 'hsl(var(--muted) / 0.4)',
                            color: 'hsl(var(--muted-foreground))',
                            fontSize: '11px',
                            fontWeight: '500',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            border: '1px solid hsl(var(--border))'
                          }}
                        >
                          {format}
                        </span>
                      ))}
                    </div>
                    
                    <div style={{
                      fontSize: '12px',
                      color: 'hsl(var(--muted-foreground))',
                      textAlign: 'center',
                      opacity: 0.8
                    }}>
                      Max. 14 Bilder • Je 10MB • Bis 6000×6000px
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, hsl(142, 76%, 36%), hsl(142, 76%, 40%))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '16px',
                      boxShadow: '0 4px 12px hsl(142, 76%, 36%, 0.3)',
                      margin: '0 auto 16px auto'
                    }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20,6 9,17 4,12"/>
                      </svg>
                    </div>
                    <p style={{
                      margin: '0 0 8px 0',
                      fontSize: '16px',
                      fontWeight: '600',
                      color: 'hsl(var(--foreground))',
                      textAlign: 'center'
                    }}>
                      {uploadedImages.length} {uploadedImages.length === 1 ? 'Bild' : 'Bilder'} bereit
                    </p>
                    <p style={{
                      margin: 0,
                      fontSize: '14px',
                      color: 'hsl(var(--muted-foreground))',
                      textAlign: 'center'
                    }}>
                      Weitere hinzufügen oder weiter zu den Einstellungen
                    </p>
                    
                    {uploadedImages.length < 14 && (
                      <div style={{
                        marginTop: '12px',
                        fontSize: '12px',
                        color: 'hsl(var(--primary))',
                        background: 'hsl(var(--primary) / 0.1)',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: '1px solid hsl(var(--primary) / 0.2)',
                        display: 'inline-block'
                      }}>
                        Noch {14 - uploadedImages.length} weitere möglich
                      </div>
                    )}
                  </div>
                )}
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

          {/* Settings Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: isMobile ? '15px' : '20px'
          }}>
            
            {/* Image Quality Settings */}
            <div style={{ marginBottom: '30px' }}>
              
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



            {/* Number of Images */}
            <div style={{ marginTop: isMobile ? '20px' : '0' }}>
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
                  max="4"
                  step="1"
                  value={numImages}
                  onChange={(e) => setNumImages(Number(e.target.value))}
                  style={{
                    width: '100%',
                    height: '6px',
                    borderRadius: '3px',
                    background: `linear-gradient(to right, #667eea 0%, #667eea ${((numImages - 1) / 3) * 100}%, hsl(var(--border)) ${((numImages - 1) / 3) * 100}%, hsl(var(--border)) 100%)`,
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

          </div>

          {/* Options Container - Outside Settings Grid */}
          <div style={{ marginTop: '25px' }}>
            <div style={{
              background: 'hsl(var(--muted) / 0.1)',
              borderRadius: '12px',
              border: '1px solid hsl(var(--border))',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              
              <h4 style={{
                margin: '0 0 8px 0',
                fontSize: '16px',
                fontWeight: '600',
                color: 'hsl(var(--foreground))'
              }}>
                ⚙️ Optionen
              </h4>
              
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
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px',
                background: 'hsl(var(--background))',
                borderRadius: '8px',
                border: '1px solid hsl(var(--border))'
              }}>
                <div>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: 'hsl(var(--foreground))',
                    display: 'block'
                  }}>
                    Prompt Optimierung
                  </span>
                  <span style={{
                    fontSize: '12px',
                    color: 'hsl(var(--muted-foreground))'
                  }}>
                    {promptOptimization === 'standard' ? 'Höhere Qualität, längere Generation' : 'Schneller, durchschnittliche Qualität'}
                  </span>
                </div>
                <select
                  value={promptOptimization}
                  onChange={(e) => setPromptOptimization(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                    background: 'hsl(var(--background))',
                    color: 'hsl(var(--foreground))',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    minWidth: '100px'
                  }}
                >
                  <option value="standard">Standard</option>
                  <option value="fast">Schnell</option>
                </select>
              </div>
              
              {/* Stil */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px',
                background: 'hsl(var(--background))',
                borderRadius: '8px',
                border: '1px solid hsl(var(--border))'
              }}>
                <div>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: 'hsl(var(--foreground))',
                    display: 'block'
                  }}>
                    🎨 Stil
                  </span>
                  <span style={{
                    fontSize: '12px',
                    color: 'hsl(var(--muted-foreground))'
                  }}>
                    {style === 'auto' ? 'KI wählt automatisch' : 'Manuell gewählt'}
                  </span>
                </div>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                    background: 'hsl(var(--background))',
                    color: 'hsl(var(--foreground))',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    minWidth: '120px'
                  }}
                >
                  {SEEDREAM_STYLES.map(styleOption => (
                    <option key={styleOption.value} value={styleOption.value}>
                      {styleOption.label}
                    </option>
                  ))}
                </select>
              </div>
              
            </div>
          </div>

          {/* Sequential Generation Options */}
          {uploadedImages.length > 0 && (
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
                <h4 style={{
                  margin: 0,
                  fontSize: '16px',
                  fontWeight: '600',
                  color: 'hsl(var(--foreground))'
                }}>
                  ⚡ Sequential Generation
                </h4>
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
                      Seedream 4.5 wird bis zu {maxImages} Bilder generieren, basierend auf deinen {uploadedImages.length} Referenzbildern. 
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

          {/* Generate Button */}
          <div style={{ marginTop: '30px' }}>
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
                e.currentTarget.style.transform = 'translateY(0)'
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
                  width: '20px',
                  height: '20px',
                  border: '2px solid transparent',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                <span>Generiere Bilder...</span>
              </div>
            ) : (
              (() => {
                const baseText = `${numImages} ${numImages === 1 ? 'Bild' : 'Bilder'} generieren`
                const modeEmoji = uploadedImages.length === 0 ? '🌱' : 
                                  uploadedImages.length === 1 ? '🖼️' : '🎨'
                const modeText = uploadedImages.length === 0 ? '' : 
                                 uploadedImages.length === 1 ? ' (Image-to-Image)' : 
                                 ' (Multi-Blending)'
                const sequentialText = sequentialGeneration && uploadedImages.length > 0 ? 
                                       ` → bis zu ${maxImages}` : ''
                return `${modeEmoji} ${baseText}${modeText}${sequentialText}`
              })()
            )}
          </button>
          </div>
        </div>
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
              Generierte Bilder ({generatedImages.length})
            </h3>
            
            <div style={{
              display: 'grid',
              gap: '25px',
              gridTemplateColumns: generatedImages.length === 1 ? '1fr' :
                generatedImages.length === 2 ? 'repeat(auto-fit, minmax(300px, 1fr))' :
                'repeat(auto-fit, minmax(250px, 1fr))'
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

        {/* Cost & Preview Info */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: isMobile ? '15px' : '20px',
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