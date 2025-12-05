import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { uploadAndSaveImage } from '../utils/imageUpload.js'
import { optimizePromptForQwen, optimizePromptSimple } from '../services/grokService.js'

function QwenPage() {
  const { user } = useAuth()
  const [sourceImage, setSourceImage] = useState(null)
  const [editedImage, setEditedImage] = useState(null)
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState('')
  const [error, setError] = useState('')
  const [generationTime, setGenerationTime] = useState(0)
  const [fullscreenImage, setFullscreenImage] = useState(null)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [savedImageUrl, setSavedImageUrl] = useState(null)
  const [saveProgress, setSaveProgress] = useState('')
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [optimizingPrompt, setOptimizingPrompt] = useState(false)
  const [optimizingSimple, setOptimizingSimple] = useState(false)
  
  const fileRef = useRef(null)

  const uploadImage = (e) => {
    console.log('📁 FILE UPLOAD: User selected file')
    const file = e.target.files[0]
    
    if (!file) {
      console.log('❌ FILE UPLOAD: No file selected')
      return
    }
    
    console.log('📁 FILE UPLOAD DETAILS:', {
      fileName: file.name,
      fileSize: Math.round(file.size / 1024) + ' KB',
      fileType: file.type,
      lastModified: new Date(file.lastModified).toLocaleString()
    })
    
    if (file.size > 10 * 1024 * 1024) {
      console.log('❌ FILE UPLOAD: File too large (' + Math.round(file.size / 1024 / 1024) + 'MB > 10MB)')
      setError('File too large. Please select an image under 10MB.')
      return
    }
    
    console.log('📁 FILE UPLOAD: Starting Base64 conversion...')
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const base64Result = e.target.result
      console.log('✅ FILE UPLOAD: Base64 conversion complete', {
        base64Length: base64Result.length,
        base64Preview: base64Result.substring(0, 50) + '...',
        hasDataPrefix: base64Result.includes('data:')
      })
      setSourceImage(base64Result)
      setEditedImage(null)
      setError('')
    }
    
    reader.onerror = () => {
      console.log('❌ FILE UPLOAD: Base64 conversion failed')
      setError('Failed to read image file')
    }
    
    reader.readAsDataURL(file)
  }

  const uploadToSupabase = async (imageBlob, fileName) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/upload-to-supabase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageData: imageBlob,
          fileName: fileName,
          bucket: 'generated-images'
        })
      })
      
      if (!response.ok) throw new Error('Supabase upload failed')
      const data = await response.json()
      return data.publicUrl
    } catch (err) {
      console.error('Upload error:', err)
      throw new Error('Failed to save image')
    }
  }

  const optimizePromptWithGrok = async () => {
    if (!prompt.trim() || optimizingPrompt) {
      setError('Bitte gib einen Prompt ein bevor du ihn optimierst.')
      return
    }

    setOptimizingPrompt(true)
    setError('')
    
    try {
      console.log('🧠 GROK EXTREME OPTIMIZATION: Starting prompt optimization')
      const result = await optimizePromptForQwen(prompt)
      
      if (result.success) {
        console.log('✅ GROK EXTREME OPTIMIZATION SUCCESS:', result.optimizedPrompt)
        setPrompt(result.optimizedPrompt)
        setProgress('🔥 Extrem-Prompt wurde von Grok optimiert!')
        setTimeout(() => setProgress(''), 3000)
      } else {
        console.error('❌ GROK EXTREME OPTIMIZATION FAILED:', result.error)
        setError('Extrem-Optimierung fehlgeschlagen: ' + result.error)
      }
      
    } catch (err) {
      console.error('❌ GROK EXTREME OPTIMIZATION ERROR:', err)
      setError('Verbindung zu Grok fehlgeschlagen. Versuche es später erneut.')
    }
    
    setOptimizingPrompt(false)
  }

  const optimizePromptSimpleGrok = async () => {
    if (!prompt.trim() || optimizingSimple) {
      setError('Bitte gib einen Prompt ein bevor du ihn optimierst.')
      return
    }

    setOptimizingSimple(true)
    setError('')
    
    try {
      console.log('🎨 GROK SIMPLE OPTIMIZATION: Starting simple optimization')
      const result = await optimizePromptSimple(prompt)
      
      if (result.success) {
        console.log('✅ GROK SIMPLE OPTIMIZATION SUCCESS:', result.optimizedPrompt)
        setPrompt(result.optimizedPrompt)
        setProgress('✅ Einfacher Prompt optimiert!')
        setTimeout(() => setProgress(''), 2000)
      } else {
        console.error('❌ GROK SIMPLE OPTIMIZATION FAILED:', result.error)
        setError('Einfache Optimierung fehlgeschlagen: ' + result.error)
      }
      
    } catch (err) {
      console.error('❌ GROK SIMPLE OPTIMIZATION ERROR:', err)
      setError('Verbindung zu Grok fehlgeschlagen. Versuche es später erneut.')
    }
    
    setOptimizingSimple(false)
  }

  const editImage = async () => {
    console.log('🔥 EDIT BUTTON CLICKED! Function called!')
    console.log('🔥 DEBUG VALUES:', {
      sourceImage: !!sourceImage,
      prompt: prompt,
      loading: loading,
      promptLength: prompt.trim().length
    })
    
    if (!sourceImage || !prompt.trim() || loading) {
      console.log('🔥 VALIDATION FAILED - showing error')
      setError('Please upload an image and enter a prompt before editing.')
      return
    }
    
    console.log('🔥 VALIDATION PASSED - starting API call')

    // Check if environment variables are properly configured
    console.log('🔥 CHECKING ENV VARS:', {
      hasApiKey: !!import.meta.env.VITE_RUNPOD_API_KEY,
      apiKeyStart: import.meta.env.VITE_RUNPOD_API_KEY?.substring(0, 10),
      hasEndpoint: !!import.meta.env.VITE_RUNPOD_ENDPOINT_ID_QWEN,
      endpoint: import.meta.env.VITE_RUNPOD_ENDPOINT_ID_QWEN
    })
    
    if (!import.meta.env.VITE_RUNPOD_API_KEY || !import.meta.env.VITE_RUNPOD_ENDPOINT_ID_QWEN) {
      console.log('🔥 ENV VARS MISSING!')
      setError('RunPod API configuration missing. Please check environment variables.')
      return
    }

    setLoading(true)
    setProgress('Preparing image edit...')
    setError('')
    setEditedImage(null)
    setGenerationTime(0)

    const startTime = Date.now()

    try {
      setProgress('Starting image edit process...')
      
      // Clean Base64 data - remove data URL prefix if present
      const cleanBase64 = sourceImage.includes(',') 
        ? sourceImage.split(',')[1] 
        : sourceImage

      // Get original image dimensions
      const img = new Image()
      img.src = `data:image/png;base64,${cleanBase64}`
      await new Promise(resolve => img.onload = resolve)
      
      console.log('🖼️ Original Image Dimensions:', {
        width: img.width,
        height: img.height,
        aspectRatio: (img.width / img.height).toFixed(2)
      })
      
      const requestPayload = {
        input: {
          image_base64: cleanBase64,
          prompt: prompt.trim(),
          seed: Math.floor(Math.random() * 1000000),
          width: img.width,
          height: img.height,
          enable_safety_checker: false
        }
      }

      console.log('🚀 QWEN API REQUEST:', {
        endpoint: `https://api.runpod.ai/v2/${import.meta.env.VITE_RUNPOD_ENDPOINT_ID_QWEN}/run`,
        payload: {
          ...requestPayload,
          input: {
            ...requestPayload.input,
            image_base64: cleanBase64?.substring(0, 50) + '... (length: ' + cleanBase64?.length + ')'
          }
        }
      })

      const response = await fetch(`https://api.runpod.ai/v2/${import.meta.env.VITE_RUNPOD_ENDPOINT_ID_QWEN}/run`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_RUNPOD_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestPayload)
      })

      console.log('📡 QWEN API RESPONSE:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ QWEN API ERROR DETAILS:', {
          status: response.status,
          statusText: response.statusText,
          errorBody: errorText,
          endpoint: import.meta.env.VITE_RUNPOD_ENDPOINT_ID_QWEN,
          apiKey: import.meta.env.VITE_RUNPOD_API_KEY?.substring(0, 10) + '...'
        })
        throw new Error(`RunPod API error: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ''}`)
      }

      const result = await response.json()
      console.log('📥 RunPod Response:', result)

      if (!result.id) {
        throw new Error('No job ID received from RunPod')
      }

      const jobId = result.id
      setProgress('Image edit in progress...')

      // Poll for completion
      let attempts = 0
      const maxAttempts = 60 // 5 minutes max
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 5000)) // 5 second intervals
        attempts++
        
        try {
          const statusResponse = await fetch(
            `https://api.runpod.ai/v2/${import.meta.env.VITE_RUNPOD_ENDPOINT_ID_QWEN}/status/${jobId}`,
            {
              headers: {
                'Authorization': `Bearer ${import.meta.env.VITE_RUNPOD_API_KEY}`
              }
            }
          )
          
          if (!statusResponse.ok) {
            throw new Error(`Status check failed: ${statusResponse.status}`)
          }
          
          const statusData = await statusResponse.json()
          console.log(`📊 Status Check ${attempts}:`, statusData)
          
          if (statusData.status === 'COMPLETED') {
            if (statusData.output && statusData.output.image) {
              const endTime = Date.now()
              setGenerationTime(Math.round((endTime - startTime) / 1000))
              
              // Process and validate the image data URL
              let imageDataUrl = statusData.output.image
              
              // Ensure proper data URL format
              if (!imageDataUrl.startsWith('data:image/')) {
                // If it's raw base64, add the proper data URL prefix
                imageDataUrl = `data:image/png;base64,${imageDataUrl}`
              }
              
              // Validate that the data URL is properly formatted
              const dataUrlRegex = /^data:image\/(png|jpg|jpeg|gif|webp);base64,([A-Za-z0-9+/=]+)$/
              if (!dataUrlRegex.test(imageDataUrl)) {
                throw new Error('Invalid image data format received')
              }
              
              setEditedImage(imageDataUrl)
              setProgress('Image edit completed!')
              
              console.log('✅ Qwen Edit Success:', {
                imageDataUrl: imageDataUrl.substring(0, 50) + '...',
                imageFormat: imageDataUrl.split(';')[0].split('/')[1],
                base64Length: imageDataUrl.split(',')[1]?.length,
                generationTime: statusData.output.generation_time,
                seed: statusData.output.seed
              })
              
              // Auto-save image to database and FTP (non-blocking, like Nano Banana)
              if (imageDataUrl && user?.username) {
                uploadAndSaveImage(
                  imageDataUrl,
                  user.username,
                  'qwen-edit',
                  prompt,
                  0, // imageIndex
                  '1K', // resolution - Qwen keeps original size
                  generationTime,
                  null, // usageMetadata - Qwen doesn't use tokens
                  '1:1' // aspectRatio - will be detected automatically
                )
                  .then(result => {
                    if (result.success) {
                      console.log('✅ Image automatically saved:', result.filename)
                      setSavedImageUrl(result.imageUrl)
                    } else {
                      console.error('❌ Auto-save failed:', result.error)
                    }
                  })
                  .catch(error => {
                    console.error('❌ Auto-save error:', error)
                  })
              }
              break
            } else {
              throw new Error('Completed but no image data received')
            }
          } else if (statusData.status === 'FAILED') {
            throw new Error(statusData.error || 'Image edit failed')
          }
          
          setProgress(`Processing... (${attempts * 5}s elapsed)`)
          
        } catch (pollError) {
          console.error('Poll error:', pollError)
          if (attempts >= 5) {
            throw new Error(`Status polling failed: ${pollError.message}`)
          }
          // Continue polling despite occasional errors
        }
      }
      
      if (attempts >= maxAttempts) {
        throw new Error('Image edit timed out after 5 minutes')
      }
      
    } catch (err) {
      console.error('Qwen edit error:', err)
      let errorMessage = 'Image edit failed. Please try again.'
      
      if (err.message.includes('401') || err.message.includes('Unauthorized')) {
        errorMessage = 'Authentication failed. Please check your API key.'
      } else if (err.message.includes('404')) {
        errorMessage = 'Endpoint not found. Please check the endpoint configuration.'
      } else if (err.message.includes('429')) {
        errorMessage = 'Rate limit exceeded. Please wait a moment and try again.'
      } else if (err.message.includes('timeout')) {
        errorMessage = 'Request timed out. The image might be too large or complex.'
      } else if (err.message.includes('network') || err.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your internet connection.'
      }
      
      setError(errorMessage)
      setProgress('')
    }
    
    setLoading(false)
  }

  const downloadImage = async (imageDataUrl, filename) => {
    console.log('💾 DOWNLOAD: Starting download process', { filename, imageType: imageDataUrl.substring(0, 30) })
    try {
      // Handle data URL directly
      if (imageDataUrl.startsWith('data:image/')) {
        // Convert data URL to blob
        const response = await fetch(imageDataUrl)
        const blob = await response.blob()
        
        console.log('💾 DOWNLOAD: Blob created from data URL', { 
          size: Math.round(blob.size / 1024) + ' KB', 
          type: blob.type 
        })
        
        const url = URL.createObjectURL(blob)
        
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        
        console.log('✅ DOWNLOAD: Download completed successfully')
      } else {
        // Handle regular URL
        const response = await fetch(imageDataUrl)
        console.log('💾 DOWNLOAD: Fetch response', { status: response.status, size: response.headers.get('content-length') })
        
        const blob = await response.blob()
        console.log('💾 DOWNLOAD: Blob created', { size: Math.round(blob.size / 1024) + ' KB', type: blob.type })
        
        const url = URL.createObjectURL(blob)
        
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        
        console.log('✅ DOWNLOAD: Download completed successfully')
      }
    } catch (err) {
      console.error('❌ DOWNLOAD: Download failed:', err)
      setError('Download failed: ' + err.message)
    }
  }

  const saveToGallery = async () => {
    if (!editedImage || !user?.username) {
      setError('No image to save or user not logged in')
      return
    }

    try {
      setSaveProgress('Speichere in Gallerie...')
      console.log('💾 SAVE: Starting gallery save for user:', user.username)

      const uploadResult = await uploadAndSaveImage(
        editedImage,
        user.username,
        'qwen-edit',
        prompt,
        0, // imageIndex
        '1K', // resolution - Qwen keeps original size
        generationTime,
        null, // usageMetadata - Qwen doesn't use tokens
        '1:1' // aspectRatio - will be detected automatically
      )

      if (uploadResult.success) {
        setSavedImageUrl(uploadResult.imageUrl)
        setSaveProgress('✅ In Gallerie gespeichert!')
        console.log('✅ SAVE: Image saved to gallery:', uploadResult.imageUrl)
        
        setTimeout(() => setSaveProgress(''), 3000)
      } else {
        throw new Error(uploadResult.error)
      }
      
    } catch (err) {
      console.error('❌ SAVE: Gallery save failed:', err)
      setError('Speichern fehlgeschlagen: ' + err.message)
      setSaveProgress('')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'hsl(var(--background))',
      padding: '20px',
      color: 'hsl(var(--foreground))'
    }}>
      {/* Header */}
      <div style={{
        marginBottom: '24px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
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
            ← Dashboard
          </Link>
        </div>
      </div>

      {/* Title */}
      <h1 style={{
        textAlign: 'center',
        margin: '0 0 20px 0',
        fontSize: '2.5rem',
        fontWeight: '700',
        background: 'linear-gradient(135deg, hsl(280 70% 60%), hsl(47 100% 65%))',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        fontFamily: "'Space Grotesk', sans-serif"
      }}>
        ✨ Qwen Bild-Editor
      </h1>

      {/* Subtitle */}
      <div style={{
        textAlign: 'center',
        marginBottom: '40px'
      }}>
        <p style={{
          margin: '0 0 10px 0',
          fontSize: isMobile ? '18px' : '22px',
          color: 'hsl(var(--foreground))',
          fontWeight: '500'
        }}>
          Bearbeite Bilder mit Text-Anweisungen, {user?.username}!
        </p>
        <p style={{
          margin: 0,
          fontSize: '14px',
          color: 'hsl(var(--muted-foreground))'
        }}>
          Lade ein Bild hoch und beschreibe die gewünschten Änderungen
        </p>
      </div>

      {/* Main Container */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: '30px',
          alignItems: 'start'
        }}>
          
          {/* Left Column - Upload & Controls */}
          <div>
            <input 
              ref={fileRef}
              type="file" 
              accept="image/*" 
              onChange={uploadImage}
              style={{ display: 'none' }}
            />
            
            <button 
              onClick={() => {
                console.log('📸 UPLOAD BUTTON: User clicked upload button')
                fileRef.current.click()
              }}
              style={{
                width: '100%',
                padding: '20px',
                fontSize: '16px',
                fontWeight: '600',
                color: 'hsl(var(--primary-foreground))',
                background: 'hsl(47 100% 65%)',
                border: 'none',
                borderRadius: '15px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                marginBottom: '30px'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)'
                e.target.style.boxShadow = '0 10px 25px rgba(139, 92, 246, 0.4)'
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = 'none'
              }}
            >
              {sourceImage ? '🖼️ Bild ändern' : '📸 Bild hochladen'}
            </button>
            
            {sourceImage && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '30px'
              }}>
                <img 
                  src={sourceImage} 
                  style={{ 
                    maxWidth: '100%',
                    maxHeight: '400px',
                    borderRadius: '15px',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                  }} 
                />
              </div>
            )}

            {/* Prompt Section */}
            <div style={{
              background: 'hsl(var(--card))',
              borderRadius: '20px',
              padding: '25px',
              marginBottom: '20px',
              border: '1px solid hsl(var(--border))'
            }}>
              <h3 style={{
                margin: '0 0 15px 0',
                fontSize: '18px',
                fontWeight: '600',
                color: 'hsl(var(--foreground))'
              }}>
                ✏️ Beschreibe deine Änderung
              </h3>
              
              <textarea 
                value={prompt}
                onChange={(e) => {
                  const newPrompt = e.target.value
                  console.log('✏️ PROMPT CHANGE:', {
                    oldLength: prompt.length,
                    newLength: newPrompt.length,
                    newPrompt: newPrompt.substring(0, 100) + (newPrompt.length > 100 ? '...' : '')
                  })
                  setPrompt(newPrompt)
                }}
                placeholder="z.B. 'Shirt-Farbe zu blau ändern' oder 'Sonnenbrille hinzufügen' oder 'Hintergrund entfernen und weiß machen'"
                style={{ 
                  width: '100%',
                  height: '120px',
                  padding: '15px',
                  fontSize: '16px',
                  background: 'hsl(var(--background))',
                  border: '2px solid hsl(var(--border))',
                  borderRadius: '12px',
                  color: 'hsl(var(--foreground))',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
              />
              
              {/* Quick Prompt Buttons */}
              <div style={{
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap',
                marginTop: '15px'
              }}>
                {[
                  'Change shirt color to blue',
                  'Remove background to white',
                  'Add warm sunset lighting',
                  'Change hair color to blonde'
                ].map((quickPrompt, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      console.log('🎯 QUICK PROMPT: Selected "' + quickPrompt + '"')
                      setPrompt(quickPrompt)
                    }}
                    style={{
                      background: 'hsl(var(--secondary))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '20px',
                      padding: '6px 12px',
                      fontSize: '12px',
                      color: 'hsl(var(--secondary-foreground))',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'hsl(var(--secondary) / 0.8)'
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'hsl(var(--secondary))'
                    }}
                  >
                    {quickPrompt}
                  </button>
                ))}
              </div>

              {/* Grok Prompt Enhancement Buttons */}
              <div style={{
                display: 'flex',
                gap: '10px',
                marginTop: '20px',
                flexWrap: 'wrap'
              }}>
                <button
                  onClick={optimizePromptSimpleGrok}
                  disabled={!prompt.trim() || optimizingSimple}
                  style={{
                    flex: '1',
                    padding: '12px 16px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: optimizingSimple || !prompt.trim() ? 'hsl(var(--muted-foreground))' : 'white',
                    background: optimizingSimple || !prompt.trim() ? 'hsl(var(--muted))' : 'linear-gradient(135deg, hsl(150 60% 50%), hsl(180 60% 50%))',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: optimizingSimple || !prompt.trim() ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                    minWidth: '140px'
                  }}
                  onMouseEnter={(e) => {
                    if (!optimizingSimple && prompt.trim()) {
                      e.target.style.transform = 'translateY(-1px)'
                      e.target.style.boxShadow = '0 6px 20px rgba(34, 197, 94, 0.3)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)'
                    e.target.style.boxShadow = 'none'
                  }}
                >
                  {optimizingSimple ? '🎨 Optimiert...' : '✅ Einfach optimieren'}
                </button>

                <button
                  onClick={optimizePromptWithGrok}
                  disabled={!prompt.trim() || optimizingPrompt}
                  style={{
                    flex: '1',
                    padding: '12px 16px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: optimizingPrompt || !prompt.trim() ? 'hsl(var(--muted-foreground))' : 'white',
                    background: optimizingPrompt || !prompt.trim() ? 'hsl(var(--muted))' : 'linear-gradient(135deg, hsl(350 70% 60%), hsl(320 70% 60%))',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: optimizingPrompt || !prompt.trim() ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                    minWidth: '140px'
                  }}
                  onMouseEnter={(e) => {
                    if (!optimizingPrompt && prompt.trim()) {
                      e.target.style.transform = 'translateY(-1px)'
                      e.target.style.boxShadow = '0 6px 20px rgba(239, 68, 68, 0.3)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)'
                    e.target.style.boxShadow = 'none'
                  }}
                >
                  {optimizingPrompt ? '🔥 Optimiert...' : '🔥 EXTREM optimieren'}
                </button>
              </div>
            </div>

            {/* Edit Button */}
            <button 
              onClick={editImage}
              disabled={!sourceImage || !prompt.trim() || loading}
              style={{ 
                width: '100%',
                padding: '20px',
                fontSize: '18px',
                fontWeight: '700',
                color: loading ? 'hsl(var(--muted-foreground))' : 'white',
                background: loading ? 'hsl(var(--muted))' : 'hsl(280 70% 60%)',
                border: 'none',
                borderRadius: '15px',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                marginBottom: '20px'
              }}
              onMouseEnter={(e) => {
                if (!loading && sourceImage && prompt.trim()) {
                  e.target.style.transform = 'translateY(-3px)'
                  e.target.style.boxShadow = '0 15px 35px rgba(139, 92, 246, 0.4)'
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = 'none'
              }}
            >
              {loading ? '🎨 Bearbeitung läuft...' : '✨ Bild bearbeiten'}
            </button>

            {/* Progress */}
            {progress && (
              <div style={{
                background: 'hsl(var(--muted) / 0.3)',
                padding: '15px',
                borderRadius: '12px',
                marginBottom: '20px',
                textAlign: 'center',
                color: 'hsl(var(--foreground))'
              }}>
                {progress}
                {loading && generationTime === 0 && (
                  <div style={{
                    width: '20px',
                    height: '20px',
                    border: '3px solid hsl(var(--muted))',
                    borderTop: '3px solid hsl(280 70% 60%)',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '10px auto'
                  }}></div>
                )}
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{
                background: 'hsl(0 70% 50% / 0.1)',
                border: '1px solid hsl(0 70% 50%)',
                padding: '15px',
                borderRadius: '12px',
                marginBottom: '20px',
                color: 'hsl(0 70% 50%)'
              }}>
                {error}
              </div>
            )}
          </div>

          {/* Right Column - Result */}
          <div>
            <div style={{
              background: 'hsl(var(--card))',
              borderRadius: '20px',
              padding: '25px',
              border: '1px solid hsl(var(--border))',
              minHeight: '400px'
            }}>
              <h3 style={{
                margin: '0 0 20px 0',
                fontSize: '18px',
                fontWeight: '600',
                color: 'hsl(var(--foreground))',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                🖼️ Bearbeitetes Bild
                {generationTime > 0 && (
                  <span style={{ 
                    fontSize: '12px', 
                    color: 'hsl(var(--muted-foreground))',
                    fontWeight: '400'
                  }}>
                    ({generationTime}s)
                  </span>
                )}
              </h3>
              
              {!editedImage && !loading && (
                <div style={{
                  textAlign: 'center',
                  color: 'hsl(var(--muted-foreground))',
                  fontSize: '16px',
                  padding: '40px 20px',
                  fontStyle: 'italic'
                }}>
                  Your edited image will appear here
                </div>
              )}
              
              {editedImage && (
                <div style={{ textAlign: 'center' }}>
                  <img 
                    src={editedImage}
                    onClick={() => setFullscreenImage(editedImage)}
                    style={{ 
                      maxWidth: '100%',
                      height: 'auto',
                      borderRadius: '15px',
                      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                      marginBottom: '20px',
                      objectFit: 'contain',
                      cursor: 'zoom-in'
                    }}
                    onError={(e) => {
                      console.error('❌ IMAGE LOAD ERROR: Failed to load edited image')
                      setError('Failed to display edited image. The image data may be corrupted.')
                      setEditedImage(null)
                    }}
                    onLoad={(e) => {
                      console.log('✅ IMAGE LOADED: Edited image displayed successfully', {
                        naturalWidth: e.target.naturalWidth,
                        naturalHeight: e.target.naturalHeight,
                        displayedWidth: e.target.width,
                        displayedHeight: e.target.height
                      })
                    }}
                  />
                  
                  <button
                    onClick={() => {
                      const fileName = `qwen-edited-${Date.now()}.png`
                      console.log('💾 DOWNLOAD: Starting download of ' + fileName)
                      downloadImage(editedImage, fileName)
                    }}
                    style={{
                      width: '100%',
                      padding: '15px',
                      fontSize: '16px',
                      fontWeight: '600',
                      color: 'hsl(var(--primary-foreground))',
                      background: 'linear-gradient(135deg, hsl(280 70% 60%), hsl(47 100% 65%))',
                      border: 'none',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-2px)'
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)'
                    }}
                  >
                    💾 Herunterladen
                  </button>
                  
                  {savedImageUrl && (
                    <div style={{
                      marginTop: '10px',
                      padding: '10px',
                      background: 'hsl(var(--muted) / 0.3)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: 'hsl(var(--muted-foreground))',
                      textAlign: 'center'
                    }}>
                      ✅ Automatisch in Gallerie gespeichert
                    </div>
                  )}
                </div>
              )}
              
              <style>{`
                @keyframes spin {
                  from { transform: rotate(0deg); }
                  to { transform: rotate(360deg); }
                }
              `}</style>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Image Modal */}
      {fullscreenImage && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            zIndex: 9999,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            cursor: 'zoom-out'
          }}
          onClick={() => {
            setFullscreenImage(null)
            setZoomLevel(1)
          }}
          onWheel={(e) => {
            e.preventDefault()
            const delta = e.deltaY > 0 ? -0.1 : 0.1
            setZoomLevel(prev => Math.max(0.5, Math.min(3, prev + delta)))
          }}
        >
          <img 
            src={fullscreenImage}
            style={{
              maxWidth: zoomLevel > 1 ? 'none' : '90vw',
              maxHeight: zoomLevel > 1 ? 'none' : '90vh',
              transform: `scale(${zoomLevel})`,
              transition: 'transform 0.2s ease',
              objectFit: 'contain'
            }}
            onClick={(e) => e.stopPropagation()}
          />
          <div style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            color: 'white',
            fontSize: '24px',
            cursor: 'pointer',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            borderRadius: '50%',
            width: '50px',
            height: '50px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            ✕
          </div>
        </div>
      )}
    </div>
  )
}

export default QwenPage