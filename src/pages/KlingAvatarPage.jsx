import React, { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { generateKlingAvatar, waitForKlingCompletion, getKlingCredits, validateKlingFiles } from '../services/klingService.js'

function KlingAvatarPage() {
  const { user } = useAuth()
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [audioFile, setAudioFile] = useState(null)
  const [audioPreview, setAudioPreview] = useState(null)
  const [textInput, setTextInput] = useState('')
  const [useTextMode, setUseTextMode] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedVideo, setGeneratedVideo] = useState(null)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState(0)
  const [currentStatus, setCurrentStatus] = useState('')
  const [taskId, setTaskId] = useState(null)
  const [credits, setCredits] = useState(null)

  const imageInputRef = useRef(null)
  const audioInputRef = useRef(null)

  // Handle image upload
  const handleImageUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onload = (e) => setImagePreview(e.target.result)
      reader.readAsDataURL(file)
      setError('')
    }
  }

  // Handle audio upload
  const handleAudioUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      setAudioFile(file)
      const reader = new FileReader()
      reader.onload = (e) => setAudioPreview(e.target.result)
      reader.readAsDataURL(file)
      setError('')
    }
  }

  // Manual credit loading (disabled auto-load to prevent API spam)
  const manualLoadCredits = async () => {
    console.log('🔍 Manual credit check requested...')
    const creditsResult = await getKlingCredits()
    if (creditsResult.success) {
      setCredits(creditsResult.credits)
    } else {
      setError('Konnte Credits nicht laden: ' + creditsResult.error)
    }
  }

  // Generate avatar video with real API
  const generateAvatar = async () => {
    if (!selectedImage) {
      setError('Bitte lade ein Bild hoch')
      return
    }

    if (useTextMode && !textInput.trim()) {
      setError('Bitte gib einen Text ein')
      return
    }

    if (!useTextMode && !audioFile) {
      setError('Bitte lade eine Audio-Datei hoch')
      return
    }

    // Validate files
    const validation = validateKlingFiles(selectedImage, !useTextMode ? audioFile : null)
    if (!validation.isValid) {
      setError(validation.errors.join(', '))
      return
    }

    setIsGenerating(true)
    setError('')
    setProgress(0)
    setCurrentStatus('Verbinde mit Kling AI...')
    setTaskId(null)

    try {
      console.log('🎬 Starting Kling Avatar generation...')
      
      // Step 1: Submit generation request
      setCurrentStatus('Sende Avatar-Anfrage...')
      setProgress(10)

      const generateResult = await generateKlingAvatar({
        imageFile: selectedImage,
        textInput: useTextMode ? textInput : '',
        audioFile: !useTextMode ? audioFile : null,
        mode: useTextMode ? 'text' : 'audio',
        duration: Math.min(textInput.length * 200, 30000), // Realistic duration based on text length
        quality: 'HD',
        aspectRatio: '16:9'
      })

      if (!generateResult.success) {
        throw new Error(generateResult.error)
      }

      setTaskId(generateResult.taskId)
      setCurrentStatus('Avatar wird generiert... Das kann 2-5 Minuten dauern')
      setProgress(20)

      console.log('✅ Generation request submitted, Task ID:', generateResult.taskId)

      // Step 2: Wait for completion with real-time updates
      setCurrentStatus('KI analysiert dein Bild...')
      setProgress(30)

      // Simulate realistic progress updates
      const progressSteps = [
        { progress: 40, status: 'Lipsync wird berechnet...' },
        { progress: 50, status: 'Gesichtsausdrücke werden generiert...' },
        { progress: 60, status: 'Körperbewegungen werden erstellt...' },
        { progress: 70, status: 'Audio wird synchronisiert...' },
        { progress: 80, status: 'HD-Rendering läuft...' },
        { progress: 90, status: 'Video wird finalisiert...' }
      ]

      // Update progress realistically over 2-4 minutes
      let currentStep = 0
      const progressInterval = setInterval(() => {
        if (currentStep < progressSteps.length) {
          const step = progressSteps[currentStep]
          setProgress(step.progress)
          setCurrentStatus(step.status)
          currentStep++
        }
      }, 20000) // Update every 20 seconds

      // Wait for actual completion (or timeout after 5 minutes)
      const completionResult = await waitForKlingCompletion(
        generateResult.taskId, 
        300000, // 5 minute timeout
        10000   // Check every 10 seconds
      )

      clearInterval(progressInterval)

      if (!completionResult.success) {
        throw new Error(completionResult.error || 'Generation failed')
      }

      // Success!
      setGeneratedVideo({
        url: completionResult.videoUrl,
        thumbnail: completionResult.thumbnailUrl || imagePreview,
        text: useTextMode ? textInput : 'Audio-generated content',
        timestamp: new Date().toISOString(),
        taskId: generateResult.taskId
      })

      setProgress(100)
      setCurrentStatus('Avatar erfolgreich erstellt! 🎉')
      console.log('✅ Avatar generation completed!')

      // Refresh credits
      const creditsResult = await getKlingCredits()
      if (creditsResult.success) {
        setCredits(creditsResult.credits)
      }

    } catch (err) {
      console.error('❌ Avatar generation failed:', err)
      setError(`Fehler: ${err.message}`)
      setCurrentStatus('')
      
      // Check if it's a credits issue
      if (err.message.includes('Credits') || err.message.includes('402')) {
        setError('Nicht genügend Credits. Bitte lade dein Kling AI Konto auf.')
      }
    } finally {
      setIsGenerating(false)
    }
  }

  // Reset form
  const resetForm = () => {
    setSelectedImage(null)
    setImagePreview(null)
    setAudioFile(null)
    setAudioPreview(null)
    setTextInput('')
    setGeneratedVideo(null)
    setError('')
    setProgress(0)
    if (imageInputRef.current) imageInputRef.current.value = ''
    if (audioInputRef.current) audioInputRef.current.value = ''
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'hsl(var(--background))',
      color: 'hsl(var(--foreground))'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'flex-start',
          alignItems: 'center',
          background: 'hsl(var(--card))',
          backdropFilter: 'blur(20px)',
          padding: '12px 16px',
          borderRadius: '16px',
          border: '1px solid hsl(var(--border))',
        }}>
          <Link 
            to="/dashboard" 
            style={{ 
              color: 'hsl(var(--foreground))',
              textDecoration: 'none',
              fontSize: '13px',
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
        </div>

        {/* Title Section */}
        <div style={{
          textAlign: 'center',
          marginTop: '20px'
        }}>
          <h1 style={{
            margin: '0 0 8px 0',
            fontSize: '36px',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #ff6b6b, #ffa726)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontFamily: "'Space Grotesk', sans-serif"
          }}>
            Kling Avatar 2.0 Pro
          </h1>
          <p style={{
            margin: 0,
            fontSize: '16px',
            color: 'hsl(var(--muted-foreground))',
            fontFamily: 'Georgia, serif',
            fontStyle: 'italic'
          }}>
            Erstelle sprechende KI-Avatare mit 1080p HD + 48fps
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '0 20px 40px'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: generatedVideo ? '1fr 1fr' : '1fr',
          gap: '30px'
        }}>
          
          {/* Input Section */}
          <div style={{
            background: 'hsl(var(--card))',
            borderRadius: '20px',
            padding: '30px',
            border: '1px solid hsl(var(--border))'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h3 style={{
                margin: '0',
                fontSize: '20px',
                fontWeight: '600',
                color: '#ff6b6b'
              }}>
                Avatar erstellen
              </h3>
              
              <button
                onClick={manualLoadCredits}
                style={{
                  background: credits !== null ? 'hsl(var(--muted) / 0.3)' : 'transparent',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '500',
                  color: credits !== null ? (credits > 10 ? '#4caf50' : '#ff6b6b') : 'hsl(var(--foreground))',
                  border: credits !== null ? `1px solid ${credits > 10 ? '#4caf50' : '#ff6b6b'}` : '1px solid hsl(var(--border))',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)'
                }}
              >
                💎 {credits !== null ? `${credits} Credits` : 'Credits laden'}
              </button>
            </div>

            {/* Image Upload */}
            <div style={{ marginBottom: '25px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: 'hsl(var(--foreground))'
              }}>
                Bild hochladen
              </label>
              <div style={{
                border: '2px dashed hsl(var(--border))',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                background: imagePreview ? 'transparent' : 'hsl(var(--muted) / 0.3)'
              }}
              onClick={() => imageInputRef.current?.click()}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#ff6b6b'
                e.currentTarget.style.background = 'hsl(var(--muted) / 0.5)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'hsl(var(--border))'
                e.currentTarget.style.background = imagePreview ? 'transparent' : 'hsl(var(--muted) / 0.3)'
              }}>
                {imagePreview ? (
                  <img 
                    src={imagePreview} 
                    alt="Ausgewähltes Bild" 
                    style={{
                      maxWidth: '100%',
                      maxHeight: '200px',
                      borderRadius: '8px'
                    }}
                  />
                ) : (
                  <div>
                    <div style={{ fontSize: '48px', marginBottom: '10px' }}>📷</div>
                    <p style={{ margin: 0, color: 'hsl(var(--muted-foreground))' }}>
                      Klicke um ein Bild hochzuladen
                    </p>
                    <p style={{ margin: 0, fontSize: '12px', color: 'hsl(var(--muted-foreground))' }}>
                      Menschen, Tiere, Cartoons - alle Avatare möglich
                    </p>
                  </div>
                )}
              </div>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
            </div>

            {/* Mode Toggle */}
            <div style={{ marginBottom: '25px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                Input Modus
              </label>
              <div style={{
                display: 'flex',
                background: 'hsl(var(--muted))',
                borderRadius: '8px',
                padding: '4px'
              }}>
                <button
                  onClick={() => setUseTextMode(true)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: useTextMode ? '#ff6b6b' : 'transparent',
                    color: useTextMode ? 'white' : 'hsl(var(--muted-foreground))'
                  }}
                >
                  📝 Text
                </button>
                <button
                  onClick={() => setUseTextMode(false)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: !useTextMode ? '#ff6b6b' : 'transparent',
                    color: !useTextMode ? 'white' : 'hsl(var(--muted-foreground))'
                  }}
                >
                  🎵 Audio
                </button>
              </div>
            </div>

            {/* Text Input */}
            {useTextMode ? (
              <div style={{ marginBottom: '25px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  Text eingeben
                </label>
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Gib hier den Text ein, den dein Avatar sprechen soll..."
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
                    fontFamily: 'inherit'
                  }}
                  maxLength={500}
                />
                <div style={{
                  fontSize: '12px',
                  color: 'hsl(var(--muted-foreground))',
                  marginTop: '4px'
                }}>
                  {textInput.length}/500 Zeichen
                </div>
              </div>
            ) : (
              /* Audio Upload */
              <div style={{ marginBottom: '25px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  Audio hochladen
                </label>
                <div style={{
                  border: '2px dashed hsl(var(--border))',
                  borderRadius: '12px',
                  padding: '20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onClick={() => audioInputRef.current?.click()}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#ff6b6b'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'hsl(var(--border))'
                }}>
                  {audioFile ? (
                    <div>
                      <div style={{ fontSize: '24px', marginBottom: '8px' }}>🎵</div>
                      <p style={{ margin: 0, fontWeight: '500' }}>{audioFile.name}</p>
                      <p style={{ margin: 0, fontSize: '12px', color: 'hsl(var(--muted-foreground))' }}>
                        {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: '48px', marginBottom: '10px' }}>🎵</div>
                      <p style={{ margin: 0 }}>Klicke um Audio hochzuladen</p>
                      <p style={{ margin: 0, fontSize: '12px', color: 'hsl(var(--muted-foreground))' }}>
                        MP3, WAV oder M4A
                      </p>
                    </div>
                  )}
                </div>
                <input
                  ref={audioInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleAudioUpload}
                  style={{ display: 'none' }}
                />
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

            {/* Progress Bar */}
            {isGenerating && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <span style={{ 
                    fontSize: '14px', 
                    fontWeight: '500',
                    color: '#ff6b6b'
                  }}>
                    {currentStatus || 'Generiere Avatar...'}
                  </span>
                  <span style={{ fontSize: '14px', color: 'hsl(var(--muted-foreground))' }}>
                    {progress}%
                  </span>
                </div>
                <div style={{
                  width: '100%',
                  height: '8px',
                  background: 'hsl(var(--muted))',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${progress}%`,
                    height: '100%',
                    background: 'linear-gradient(135deg, #ff6b6b, #ffa726)',
                    transition: 'width 0.5s ease'
                  }} />
                </div>
                {taskId && (
                  <div style={{
                    fontSize: '12px',
                    color: 'hsl(var(--muted-foreground))',
                    marginTop: '4px'
                  }}>
                    Task ID: {taskId}
                  </div>
                )}
                <div style={{
                  fontSize: '12px',
                  color: 'hsl(var(--muted-foreground))',
                  marginTop: '4px',
                  fontStyle: 'italic'
                }}>
                  ⏱️ Avatar-Generierung dauert normalerweise 2-5 Minuten
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '12px'
            }}>
              <button
                onClick={generateAvatar}
                disabled={isGenerating}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: isGenerating ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  background: isGenerating 
                    ? 'hsl(var(--muted))' 
                    : 'linear-gradient(135deg, #ff6b6b, #ffa726)',
                  color: 'white',
                  opacity: isGenerating ? 0.6 : 1
                }}
                onMouseEnter={(e) => {
                  if (!isGenerating) {
                    e.currentTarget.style.transform = 'translateY(-1px)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 107, 107, 0.3)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isGenerating) {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }
                }}
              >
                {isGenerating ? '🎬 Generiere...' : '🚀 Avatar erstellen'}
              </button>

              {(selectedImage || audioFile || textInput || generatedVideo) && (
                <button
                  onClick={resetForm}
                  disabled={isGenerating}
                  style={{
                    padding: '12px 20px',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: isGenerating ? 'not-allowed' : 'pointer',
                    background: 'hsl(var(--card))',
                    color: 'hsl(var(--foreground))',
                    opacity: isGenerating ? 0.6 : 1,
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isGenerating) {
                      e.currentTarget.style.background = 'hsl(var(--muted))'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isGenerating) {
                      e.currentTarget.style.background = 'hsl(var(--card))'
                    }
                  }}
                >
                  🗑️ Reset
                </button>
              )}
            </div>
          </div>

          {/* Result Section */}
          {generatedVideo && (
            <div style={{
              background: 'hsl(var(--card))',
              borderRadius: '20px',
              padding: '30px',
              border: '1px solid hsl(var(--border))'
            }}>
              <h3 style={{
                margin: '0 0 20px 0',
                fontSize: '20px',
                fontWeight: '600',
                color: '#ffa726'
              }}>
                Dein Avatar
              </h3>

              {/* Video Preview */}
              <div style={{
                background: 'hsl(var(--muted) / 0.3)',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center',
                marginBottom: '20px'
              }}>
                <img 
                  src={generatedVideo.thumbnail} 
                  alt="Generated Avatar" 
                  style={{
                    maxWidth: '100%',
                    maxHeight: '300px',
                    borderRadius: '8px',
                    marginBottom: '15px'
                  }}
                />
                <div style={{
                  fontSize: '48px',
                  marginBottom: '10px'
                }}>
                  ▶️
                </div>
                <p style={{
                  margin: 0,
                  fontSize: '14px',
                  color: 'hsl(var(--muted-foreground))'
                }}>
                  Avatar Video bereit!
                </p>
              </div>

              {/* Video Info */}
              <div style={{
                background: 'hsl(var(--muted) / 0.2)',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '20px'
              }}>
                <div style={{
                  fontSize: '14px',
                  color: 'hsl(var(--muted-foreground))',
                  marginBottom: '4px'
                }}>
                  Text:
                </div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  "{generatedVideo.text}"
                </div>
              </div>

              {/* Download Buttons */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <button style={{
                  width: '100%',
                  padding: '12px',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  background: 'linear-gradient(135deg, #4caf50, #66bb6a)',
                  color: 'white',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(76, 175, 80, 0.3)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}>
                  💾 Video herunterladen (1080p HD)
                </button>

                <button style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  background: 'hsl(var(--card))',
                  color: 'hsl(var(--foreground))',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'hsl(var(--muted))'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'hsl(var(--card))'
                }}>
                  🔗 Link kopieren
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Features Info */}
        <div style={{
          marginTop: '40px',
          background: 'hsl(var(--card))',
          borderRadius: '20px',
          padding: '30px',
          border: '1px solid hsl(var(--border))'
        }}>
          <h3 style={{
            margin: '0 0 20px 0',
            fontSize: '18px',
            fontWeight: '600',
            textAlign: 'center'
          }}>
            ✨ Kling Avatar 2.0 Pro Features
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px'
          }}>
            {[
              { icon: '🎬', title: '1080p HD + 48fps', desc: 'Ultra smooth videos' },
              { icon: '💋', title: 'Perfect Lipsync', desc: 'Mouth follows speech exactly' },
              { icon: '😊', title: 'Natural Emotions', desc: 'Eyebrows, smiles, gestures' },
              { icon: '🌍', title: 'Multilingual', desc: 'German, English, Japanese' },
              { icon: '🎭', title: 'All Avatar Types', desc: 'Humans, animals, cartoons' },
              { icon: '⚡', title: 'Fast Generation', desc: 'Parallel processing' }
            ].map((feature, index) => (
              <div key={index} style={{
                textAlign: 'center',
                padding: '15px'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>
                  {feature.icon}
                </div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '4px'
                }}>
                  {feature.title}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: 'hsl(var(--muted-foreground))'
                }}>
                  {feature.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default KlingAvatarPage