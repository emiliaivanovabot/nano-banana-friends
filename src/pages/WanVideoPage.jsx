import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'

function WanVideoPage() {
  const { user } = useAuth()
  const [image, setImage] = useState(null)
  const [audio, setAudio] = useState(null)
  const [prompt, setPrompt] = useState('')
  const [negativePrompt, setNegativePrompt] = useState('blurry, low quality, distorted, pixelated, grainy, poor lighting, bad anatomy, deformed limbs, extra fingers, extra toes, missing fingers, unrealistic proportions, awkward poses, unnatural movements, choppy animation, robotic motion, lifeless expressions, dead eyes, bad facial features, asymmetrical face, clothing glitches, fabric clipping, texture artifacts, compression artifacts, watermark, logo, text overlay, amateur quality, static pose, frozen movement')
  const [video, setVideo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState('')
  const [elapsedTime, setElapsedTime] = useState(0)
  const [startTime, setStartTime] = useState(null)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  
  // Advanced settings
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [seed, setSeed] = useState(-1)
  const [enablePromptExpansion, setEnablePromptExpansion] = useState(false)
  const [enableSafetyChecker, setEnableSafetyChecker] = useState(false)
  const [showInfoPopup, setShowInfoPopup] = useState(null)
  const [size, setSize] = useState('1280x720')
  const [seconds, setSeconds] = useState(5)
  
  // Wake Lock for mobile
  const wakeLockRef = useRef(null)
  
  const fileRef = useRef(null)
  const audioRef = useRef(null)

  // Mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const uploadImage = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => setImage(e.target.result)
      reader.readAsDataURL(file)
    }
  }

  const uploadAudio = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => setAudio(e.target.result)
      reader.readAsDataURL(file)
    }
  }

  // Timer effect to track elapsed time
  useEffect(() => {
    let interval = null
    if (loading && startTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000))
      }, 1000)
    } else {
      setElapsedTime(0)
    }
    return () => clearInterval(interval)
  }, [loading, startTime])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const generateVideo = async () => {
    console.log('🎬 GENERATE VIDEO CLICKED!')
    console.log('📸 Image:', !!image)
    console.log('✍️ Prompt:', prompt)
    console.log('⏳ Loading:', loading)
    
    if (!image || !prompt || loading) {
      console.log('❌ BLOCKED: Missing image, prompt, or already loading')
      return
    }
    
    console.log('✅ STARTING GENERATION...')
    
    setLoading(true)
    setVideo(null)
    setStartTime(Date.now())
    setProgress('Job wird an RunPod gesendet...')
    
    // Activate wake lock for mobile
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request('screen')
        console.log('📱 Wake Lock activated - phone will stay awake')
      }
    } catch (error) {
      console.log('Wake Lock not available:', error)
    }
    
    try {
      const base64 = image.split(',')[1]
      
      const requestPayload = {
        input: {
          prompt: prompt,
          image_base64: base64,
          seed: 42,
          cfg: 2.0,
          width: 480,
          height: 832,
          length: 162,
          steps: 10
        }
      }
      
      console.log('🚀 Endpoint ID:', import.meta.env.VITE_RUNPOD_ENDPOINT_ID)
      console.log('🚀 API Key (first 10 chars):', import.meta.env.VITE_RUNPOD_API_KEY?.substring(0, 10))
      console.log('🚀 Sending to RunPod:', JSON.stringify(requestPayload, null, 2))
      
      const response = await fetch(`https://api.runpod.ai/v2/${import.meta.env.VITE_RUNPOD_ENDPOINT_ID}/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_RUNPOD_API_KEY}`
        },
        body: JSON.stringify(requestPayload)
      })

      const job = await response.json()
      setProgress('Job übermittelt! Warte auf GPU-Zuteilung...')
      
      // Poll for result
      let result
      let pollCount = 0
      do {
        await new Promise(r => setTimeout(r, 5000))
        pollCount++
        
        const statusResponse = await fetch(`https://api.runpod.ai/v2/${import.meta.env.VITE_RUNPOD_ENDPOINT_ID}/status/${job.id}`, {
          headers: { 'Authorization': `Bearer ${import.meta.env.VITE_RUNPOD_API_KEY}` }
        })
        result = await statusResponse.json()
        
        console.log(`🔄 Poll ${pollCount}: Status = ${result.status}`, result)
        
        // If completed, wait longer and try multiple times for the output to be ready
        if (result.status === 'COMPLETED' && !result.output?.result) {
          console.log('📚 Video completed but no output yet, waiting and retrying...')
          
          // Try multiple times with increasing delays
          for (let retry = 1; retry <= 5; retry++) {
            console.log(`📚 Retry ${retry}/5: Waiting ${retry * 2} seconds...`)
            await new Promise(r => setTimeout(r, retry * 2000))
            
            const finalResponse = await fetch(`https://api.runpod.ai/v2/${import.meta.env.VITE_RUNPOD_ENDPOINT_ID}/status/${job.id}`, {
              headers: { 'Authorization': `Bearer ${import.meta.env.VITE_RUNPOD_API_KEY}` }
            })
            result = await finalResponse.json()
            console.log(`📚 RETRY ${retry} RESULT:`, result)
            
            // Check if we now have output
            if (result.output?.result || result.output?.video || result.output?.video_url) {
              console.log('📚 Found video output on retry', retry)
              break
            }
          }
          
          // If still no output, log the full result for debugging
          if (!result.output?.result && !result.output?.video && !result.output?.video_url) {
            console.log('📚 STILL NO OUTPUT AFTER 5 RETRIES - FULL RESULT:', JSON.stringify(result, null, 2))
            alert('⚠️ Video fertig aber kein Download-Link gefunden. Siehe Console für Details.')
          }
        }
        
        // Intelligent progress tracking based on timing analysis
        const getSmartProgress = (status, elapsed) => {
          if (status === 'IN_QUEUE') {
            return 'Warte in der Warteschlange...'
          }
          
          if (status === 'IN_PROGRESS' || status === 'RUNNING') {
            if (elapsed < 60) {
              return '🚀 Starte GPU Worker... Initialisiere CUDA'
            } else if (elapsed < 180) {
              return '⚙️ Lade ComfyUI... Setze Pfade und Registry'
            } else if (elapsed < 300) {
              return '📦 Lade ComfyUI Registry... Initialisiere Komponenten'
            } else if (elapsed < 480) {
              return '🤖 Lade WAN 2.5 Model... Transformer Parameter'
            } else if (elapsed < 540) {
              return '🎬 Generiere Video... Erstelle Frames'
            } else {
              return '✨ Finalisiere Video... Gleich fertig!'
            }
          }
          
          return 'Verarbeitung läuft...'
        }
        
        // Update progress based on intelligent phase tracking
        const currentElapsed = Math.floor((Date.now() - startTime) / 1000)
        setProgress(getSmartProgress(result.status, currentElapsed))
        
      } while (result.status !== 'COMPLETED' && result.status !== 'FAILED')
      
      if (result.status === 'COMPLETED') {
        // Try different possible output formats - check all possible fields
        let videoUrl = null
        
        console.log('📚 CHECKING ALL OUTPUT FIELDS:', {
          'result.output': result.output,
          'result.output?.result': result.output?.result,
          'result.output?.video': result.output?.video,
          'result.output?.video_url': result.output?.video_url,
          'result.output?.output': result.output?.output,
          'result.output?.videos': result.output?.videos,
          'result.output?.files': result.output?.files,
          'result.delayTime': result.delayTime,
          'result.executionTime': result.executionTime
        })
        
        if (result.output?.result) {
          videoUrl = result.output.result
          console.log('📚 Using result.output.result')
        } else if (result.output?.video) {
          videoUrl = result.output.video  
          console.log('📚 Using result.output.video')
        } else if (result.output?.video_url) {
          videoUrl = result.output.video_url
          console.log('📚 Using result.output.video_url')
        } else if (result.output?.output) {
          videoUrl = result.output.output
          console.log('📚 Using result.output.output')
        } else if (result.output?.videos && Array.isArray(result.output.videos) && result.output.videos.length > 0) {
          videoUrl = result.output.videos[0]
          console.log('📚 Using result.output.videos[0]')
        } else if (result.output?.files && Array.isArray(result.output.files) && result.output.files.length > 0) {
          videoUrl = result.output.files[0]
          console.log('📚 Using result.output.files[0]')
        }
        
        if (videoUrl) {
          console.log('🎬 VIDEO URL LENGTH:', videoUrl.length)
          console.log('🎬 VIDEO URL START:', videoUrl.substring(0, 100))
          
          alert(`🎬 VIDEO EMPFANGEN! Länge: ${videoUrl.length} Zeichen`)
          
          // For private endpoint, always convert large responses to blob URL
          if (videoUrl.length > 1000) {
            alert('🔄 Video ist groß (base64), konvertiere zu Blob URL...')
            try {
              // Extract base64 data - handle both data: URLs and raw base64
              const base64Data = videoUrl.includes(',') ? videoUrl.split(',')[1] : videoUrl
              const binaryData = atob(base64Data)
              const bytes = new Uint8Array(binaryData.length)
              for (let i = 0; i < binaryData.length; i++) {
                bytes[i] = binaryData.charCodeAt(i)
              }
              
              // Create blob and URL
              const blob = new Blob([bytes], { type: 'video/mp4' })
              const blobUrl = URL.createObjectURL(blob)
              console.log('🎬 CONVERTED TO BLOB URL:', blobUrl)
              
              alert(`✅ Blob URL erfolgreich erstellt: ${blobUrl}`)
              setProgress('Video erfolgreich generiert!')
              setVideo(blobUrl)
            } catch (error) {
              console.error('Base64 conversion failed:', error)
              alert(`❌ BLOB CONVERSION FEHLER: ${error.message}`)
              setProgress('Video konvertierung fehlgeschlagen!')
            }
          } else {
            alert('📹 Video ist normale URL, setze direkt...')
            setProgress('Video erfolgreich generiert!')
            setVideo(videoUrl)
          }
        } else {
          alert('❌ KEIN VIDEO URL IN RESPONSE GEFUNDEN!')
          setProgress('Video generiert, aber kein Download-Link gefunden!')
        }
      } else if (result.status === 'FAILED') {
        setProgress('Generierung fehlgeschlagen. Bitte versuche es erneut.')
        console.error('Job failed:', result)
      }
      
    } catch (err) {
      console.error(err)
      setProgress('Ein Fehler ist aufgetreten. Bitte versuche es erneut.')
    }
    
    setLoading(false)
    setStartTime(null)
    
    // Release wake lock
    try {
      if (wakeLockRef.current) {
        await wakeLockRef.current.release()
        wakeLockRef.current = null
        console.log('📱 Wake Lock released')
      }
    } catch (error) {
      console.log('Wake Lock release error:', error)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'hsl(var(--background))',
      padding: '20px',
      color: 'hsl(var(--foreground))'
    }}>
      {/* Header - Same style as other pages */}
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
          <Link 
            to="/dashboard" 
            style={{ 
              color: 'hsl(var(--muted-foreground))',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            ← Dashboard
          </Link>
        </div>
      </div>

      {/* Title */}
      <h1 className="wan-video-title" style={{
        textAlign: 'center',
        margin: '0 0 20px 0',
        fontSize: '2.5rem',
        fontWeight: '700',
        color: 'hsl(280 70% 60%)',
        background: 'linear-gradient(135deg, hsl(280 70% 60%), hsl(47 100% 65%))',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        fontFamily: "'Space Grotesk', sans-serif"
      }}>
        🎬 WAN 2.5 Video Generator
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
          Verwandle deine Bilder in Videos, {user?.username}!
        </p>
        <p style={{
          margin: 0,
          fontSize: '14px',
          color: 'hsl(var(--muted-foreground))'
        }}>
          Lade ein Bild hoch und beschreibe deine Video-Vision
        </p>
      </div>

      {/* Main Container */}
      <div style={{
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        <input 
          ref={fileRef}
          type="file" 
          accept="image/*" 
          onChange={uploadImage}
          style={{ display: 'none' }}
        />
        
        <input 
          ref={audioRef}
          type="file" 
          accept="audio/*" 
          onChange={uploadAudio}
          style={{ display: 'none' }}
        />
        
        <button 
          onClick={() => fileRef.current.click()}
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
            e.target.style.boxShadow = '0 10px 25px rgba(245, 158, 11, 0.4)'
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)'
            e.target.style.boxShadow = 'none'
          }}
        >
          {image ? 'Bild ändern' : 'Bild hochladen'}
        </button>

        <button 
          onClick={() => audioRef.current.click()}
          style={{
            width: '100%',
            padding: '15px',
            fontSize: '16px',
            fontWeight: '600',
            color: 'hsl(var(--secondary-foreground))',
            background: audio ? 'hsl(280 70% 60%)' : 'hsl(var(--muted))',
            border: 'none',
            borderRadius: '15px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            marginBottom: '20px'
          }}
          onMouseEnter={(e) => {
            if (!audio) {
              e.target.style.backgroundColor = 'hsl(280 70% 70%)'
            }
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = audio ? 'hsl(280 70% 60%)' : 'hsl(var(--muted))'
          }}
        >
          {audio ? '🔊 Audio ändern' : '🔊 Audio für Lip-Sync (optional)'}
        </button>
        
        {image && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '30px'
          }}>
            <img 
              src={image} 
              style={{ 
                maxWidth: '100%',
                maxHeight: '300px',
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
          padding: '30px',
          marginBottom: '30px',
          border: '1px solid hsl(var(--border))'
        }}>
          <h3 style={{
            margin: '0 0 20px 0',
            fontSize: '20px',
            fontWeight: '600',
            color: 'hsl(var(--foreground))'
          }}>
            ✨ Video Prompt
          </h3>
          
          <textarea 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Beschreibe wie sich dein Bild bewegen soll... z.B. 'Eine sanfte Kamerabewegung von links nach rechts, während Blätter im Wind tanzen'"
            style={{ 
              width: '100%',
              height: '120px',
              padding: '15px',
              fontSize: '16px',
              background: 'hsl(var(--background))',
              border: '2px solid hsl(var(--border))',
              borderRadius: '15px',
              color: 'hsl(var(--foreground))',
              resize: 'vertical',
              fontFamily: 'inherit'
            }}
          />
        </div>

        {/* Negative Prompt */}
        <div style={{
          background: 'hsla(0, 30%, 20%, 0.3)',
          borderRadius: '15px',
          padding: '20px',
          marginBottom: '20px',
          border: '1px solid hsla(0, 35%, 30%, 0.5)'
        }}>
          <h3 style={{
            margin: '0 0 20px 0',
            fontSize: '20px',
            fontWeight: '600',
            color: 'hsl(var(--foreground))'
          }}>
            🚫 Negative Prompt
          </h3>
          
          <textarea 
            value={negativePrompt}
            onChange={(e) => setNegativePrompt(e.target.value)}
            placeholder="Was NICHT im Video sein soll... z.B. 'blurry, distorted, low quality'"
            style={{ 
              width: '100%',
              height: '80px',
              padding: '15px',
              fontSize: '16px',
              background: 'hsl(var(--background))',
              border: '2px solid hsl(var(--border))',
              borderRadius: '15px',
              color: 'hsl(var(--foreground))',
              resize: 'vertical',
              fontFamily: 'inherit'
            }}
          />
        </div>

        {/* Video Resolution */}
        <div style={{
          background: 'hsl(var(--card))',
          borderRadius: '15px',
          padding: '20px',
          marginBottom: '20px',
          border: '1px solid hsl(var(--border))'
        }}>
          <h3 style={{
            margin: '0 0 15px 0',
            fontSize: '16px',
            fontWeight: '600',
            color: 'hsl(var(--foreground))'
          }}>
            📐 Video Auflösung <span style={{fontSize: '14px', fontWeight: '500'}}>({size})</span>
          </h3>
          <select
            value={size}
            onChange={(e) => setSize(e.target.value)}
            style={{
              width: '100%',
              padding: '15px',
              borderRadius: '12px',
              border: '2px solid hsl(var(--border))',
              background: 'hsl(var(--background))',
              color: 'hsl(var(--foreground))',
              fontSize: '16px',
              fontWeight: '500'
            }}
          >
            <option value="854x480">SD (854×480) - Schnell</option>
            <option value="1280x720">HD (1280×720) - Standard</option>
            <option value="1920x1080">Full HD (1920×1080) - Beste Qualität</option>
          </select>
        </div>

        {/* Advanced Settings */}
        <div style={{
          background: 'hsl(var(--card))',
          borderRadius: '15px',
          padding: '20px',
          marginBottom: '20px',
          border: '1px solid hsl(var(--border))'
        }}>
          <button 
            onClick={() => setShowAdvanced(!showAdvanced)}
            style={{
              background: 'none',
              border: 'none',
              color: 'hsl(var(--foreground))',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: showAdvanced ? '15px' : '0'
            }}
          >
            Erweiterte Einstellungen {showAdvanced ? '▼' : '▶'}
          </button>
          
          {showAdvanced && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
              gap: '20px'
            }}>

              {/* Seed */}
              <div style={{ position: 'relative' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>
                  🎲 Seed ({seed === -1 ? 'Random' : seed})
                  <button
                    onClick={() => setShowInfoPopup(showInfoPopup === 'seed' ? null : 'seed')}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      backgroundColor: 'hsl(var(--muted))',
                      color: 'hsl(var(--muted-foreground))',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '700'
                    }}
                  >
                    ?
                  </button>
                </label>
                {showInfoPopup === 'seed' && (
                  <div style={{
                    position: 'absolute',
                    zIndex: 10,
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    padding: '12px',
                    marginTop: '5px',
                    fontSize: '13px',
                    lineHeight: '1.4',
                    color: 'hsl(var(--foreground))',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                    maxWidth: '280px'
                  }}>
                    <strong>Seed</strong><br/>
                    -1 für zufällige Ergebnisse, oder eine Zahl für reproduzierbare Ergebnisse
                  </div>
                )}
                <input 
                  type="number"
                  value={seed}
                  onChange={(e) => setSeed(parseInt(e.target.value))}
                  placeholder="-1 für random"
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid hsl(var(--border))',
                    background: 'hsl(var(--background))',
                    color: 'hsl(var(--foreground))'
                  }}
                />
              </div>

              {/* Prompt Expansion */}
              <div style={{ position: 'relative' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', fontSize: '14px', fontWeight: '500' }}>
                  ✨ Auto Prompt Enhancement
                  <button
                    onClick={() => setShowInfoPopup(showInfoPopup === 'expansion' ? null : 'expansion')}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      backgroundColor: 'hsl(var(--muted))',
                      color: 'hsl(var(--muted-foreground))',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '700'
                    }}
                  >
                    ?
                  </button>
                </label>
                {showInfoPopup === 'expansion' && (
                  <div style={{
                    position: 'absolute',
                    zIndex: 10,
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    padding: '12px',
                    marginTop: '5px',
                    fontSize: '13px',
                    lineHeight: '1.4',
                    color: 'hsl(var(--foreground))',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                    maxWidth: '280px'
                  }}>
                    <strong>Auto Prompt Enhancement</strong><br/>
                    Erweitert deine Prompts automatisch für bessere Ergebnisse
                  </div>
                )}
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input 
                    type="checkbox"
                    checked={enablePromptExpansion}
                    onChange={(e) => setEnablePromptExpansion(e.target.checked)}
                  />
                  <span>Prompt automatisch verbessern</span>
                </label>
              </div>
              
              {/* Safety Checker */}
              <div style={{ position: 'relative' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', fontSize: '14px', fontWeight: '500' }}>
                  🛡️ Safety Check
                  <button
                    onClick={() => setShowInfoPopup(showInfoPopup === 'safety' ? null : 'safety')}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      backgroundColor: 'hsl(var(--muted))',
                      color: 'hsl(var(--muted-foreground))',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '700'
                    }}
                  >
                    ?
                  </button>
                </label>
                {showInfoPopup === 'safety' && (
                  <div style={{
                    position: 'absolute',
                    zIndex: 10,
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    padding: '12px',
                    marginTop: '5px',
                    fontSize: '13px',
                    lineHeight: '1.4',
                    color: 'hsl(var(--foreground))',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                    maxWidth: '280px'
                  }}>
                    <strong>Safety Checker</strong><br/>
                    Filtert unangemessene Inhalte. Empfohlen: An lassen
                  </div>
                )}
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input 
                    type="checkbox"
                    checked={enableSafetyChecker}
                    onChange={(e) => setEnableSafetyChecker(e.target.checked)}
                  />
                  <span>Inhalts-Filter aktiviert</span>
                </label>
              </div>
            </div>
          )}
        </div>


        {/* Video Length Section */}
        <div style={{
          background: 'hsl(var(--card))',
          borderRadius: '15px',
          padding: '20px',
          marginBottom: '20px',
          border: '1px solid hsl(var(--border))'
        }}>
          <h3 style={{
            margin: '0 0 15px 0',
            fontSize: '16px',
            fontWeight: '600',
            color: 'hsl(var(--foreground))'
          }}>
            ⏱️ Video Länge <span style={{fontSize: '14px', fontWeight: '500'}}>({seconds} Sekunden)</span>
          </h3>
          <div style={{ position: 'relative', padding: '5px 0' }}>
            {/* Markierungen */}
            <div style={{ position: 'absolute', top: '0', left: '0', right: '0', height: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '8px', height: '8px', backgroundColor: seconds === 3 ? 'hsl(280 70% 60%)' : 'hsl(var(--muted-foreground))', borderRadius: '50%' }}></div>
                <span style={{ fontSize: '10px', color: 'hsl(var(--muted-foreground))', marginTop: '2px' }}>3s</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '8px', height: '8px', backgroundColor: seconds === 5 ? 'hsl(280 70% 60%)' : 'hsl(var(--muted-foreground))', borderRadius: '50%' }}></div>
                <span style={{ fontSize: '10px', color: 'hsl(var(--muted-foreground))', marginTop: '2px' }}>5s</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '8px', height: '8px', backgroundColor: seconds === 10 ? 'hsl(280 70% 60%)' : 'hsl(var(--muted-foreground))', borderRadius: '50%' }}></div>
                <span style={{ fontSize: '10px', color: 'hsl(var(--muted-foreground))', marginTop: '2px' }}>10s</span>
              </div>
            </div>
            <input 
              type="range" 
              min="1" 
              max="10" 
              value={seconds} 
              onChange={(e) => {
                const value = parseInt(e.target.value);
                setSeconds(value);
              }}
              onMouseUp={(e) => {
                const value = parseInt(e.target.value);
                const snapTargets = [3, 5, 10];
                let closest = snapTargets[0];
                let minDistance = Math.abs(value - closest);
                
                snapTargets.forEach(target => {
                  const distance = Math.abs(value - target);
                  if (distance < minDistance && distance <= 1) {
                    closest = target;
                    minDistance = distance;
                  }
                });
                
                if (minDistance <= 1) {
                  setSeconds(closest);
                }
              }}
              style={{ 
                width: '100%',
                marginTop: '25px',
                appearance: 'none',
                height: '6px',
                background: 'linear-gradient(to right, hsl(47 100% 65%) 0%, hsl(280 70% 60%) 100%)',
                borderRadius: '3px',
                outline: 'none',
                cursor: 'pointer'
              }}
            />
            <style>{`
              input[type="range"]::-webkit-slider-thumb {
                appearance: none;
                width: 20px;
                height: 20px;
                background: hsl(280 70% 60%);
                border-radius: 50%;
                cursor: pointer;
                box-shadow: 0 4px 12px rgba(0,0,0,0.4);
              }
              input[type="range"]::-moz-range-thumb {
                width: 20px;
                height: 20px;
                background: hsl(280 70% 60%);
                border-radius: 50%;
                border: none;
                cursor: pointer;
                box-shadow: 0 4px 12px rgba(0,0,0,0.4);
              }
            `}</style>
          </div>
        </div>

        {/* Generate Button */}
        <button 
          onClick={generateVideo}
          disabled={!image || !prompt || loading}
          style={{ 
            width: '100%',
            padding: '20px',
            fontSize: '18px',
            fontWeight: '700',
            color: loading ? 'hsl(var(--muted-foreground))' : 'hsl(var(--secondary-foreground))',
            background: loading ? 'hsl(var(--muted))' : 'hsl(280 70% 60%)',
            border: 'none',
            borderRadius: '20px',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease',
            marginBottom: '30px'
          }}
          onMouseEnter={(e) => {
            if (!loading && image && prompt) {
              e.target.style.transform = 'translateY(-3px)'
              e.target.style.boxShadow = '0 15px 35px rgba(168, 85, 247, 0.4)'
            }
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)'
            e.target.style.boxShadow = 'none'
          }}
        >
          {loading ? 'Generiere Video...' : 'Video generieren'}
        </button>
      
        {loading && (
          <div style={{ 
            background: 'hsl(var(--card))',
            borderRadius: '20px',
            padding: '30px',
            marginBottom: '30px',
            border: '2px solid hsl(280 70% 60%)',
            boxShadow: '0 10px 25px rgba(168, 85, 247, 0.2)'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: '20px',
              fontSize: '18px',
              color: 'hsl(var(--foreground))',
              fontWeight: '600'
            }}>
              <div style={{
                width: '24px',
                height: '24px',
                border: '3px solid hsl(var(--muted))',
                borderTop: '3px solid hsl(280 70% 60%)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                marginRight: '12px',
                willChange: 'transform',
                backfaceVisibility: 'hidden'
              }}></div>
              <strong>{progress}</strong>
            </div>
            
            <div style={{
              background: 'hsl(var(--background))',
              borderRadius: '10px',
              padding: '15px 20px',
              marginBottom: '15px'
            }}>
              <div style={{ 
                fontSize: '16px', 
                color: 'hsl(var(--foreground))',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <span>⏱️</span>
                <strong>Vergangene Zeit: {formatTime(elapsedTime)}</strong>
              </div>
              
              <div style={{ 
                fontSize: '14px', 
                color: 'hsl(var(--muted-foreground))',
                lineHeight: '1.5'
              }}>
                {elapsedTime < 60 
                  ? "Kalte GPU-Initialisierung kann 1-2 Minuten dauern"
                  : elapsedTime < 120
                  ? "GPU erwärmt sich... Worker startet ComfyUI"
                  : elapsedTime < 180
                  ? "Lade ComfyUI Registry... Registriere Custom Nodes"
                  : elapsedTime < 300
                  ? "Initialisiere WAN 2.5 Komponenten... Lade Model Registry"
                  : elapsedTime < 480
                  ? "Lade Transformer Parameter... 1095 Komponenten"
                  : "Generiere Video Frames... 162 Frames = 10 Sekunden"
                }
              </div>
            </div>
            
            {/* Progress Bar */}
            <div style={{
              background: 'hsl(var(--background))',
              borderRadius: '10px',
              padding: '5px',
              marginBottom: '10px'
            }}>
              <div style={{
                height: '8px',
                background: 'linear-gradient(135deg, hsl(280 70% 60%), hsl(47 100% 65%))',
                borderRadius: '5px',
                width: elapsedTime < 60 ? '15%' 
                     : elapsedTime < 120 ? '25%'
                     : elapsedTime < 180 ? '40%'
                     : elapsedTime < 300 ? '60%'
                     : elapsedTime < 480 ? '80%'
                     : elapsedTime < 540 ? '95%'
                     : '100%',
                transition: 'width 1s ease',
                animation: 'pulse 2s infinite'
              }}></div>
            </div>
            
            <style>{`
              @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
              @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.7; }
              }
            `}</style>
          </div>
        )}
      
        {video && (
          <div style={{
            background: 'hsl(var(--card))',
            borderRadius: '20px',
            padding: '30px',
            marginBottom: '30px',
            border: '2px solid hsl(280 70% 60%)',
            boxShadow: '0 10px 25px rgba(168, 85, 247, 0.2)'
          }}>
            <h3 style={{
              margin: '0 0 20px 0',
              fontSize: '20px',
              fontWeight: '600',
              color: 'hsl(var(--foreground))',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              🎉 Dein Video ist fertig!
            </h3>
            
            <video 
              controls 
              style={{ 
                width: '100%',
                borderRadius: '15px',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
              }}
            >
              <source src={video} type="video/mp4" />
              Dein Browser unterstützt keine Video-Wiedergabe.
            </video>
            
            <div style={{
              marginTop: '20px',
              display: 'flex',
              gap: '15px',
              flexDirection: isMobile ? 'column' : 'row'
            }}>
              <button
                onClick={async () => {
                  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
                  const isAndroid = /Android/.test(navigator.userAgent);
                  
                  if (isIOS) {
                    // iOS: Try Safari's enhanced video saving
                    try {
                      // First try to fetch and create blob for iOS
                      const response = await fetch(video);
                      const blob = await response.blob();
                      const url = URL.createObjectURL(blob);
                      
                      // Create a temporary video element for iOS
                      const tempVideo = document.createElement('video');
                      tempVideo.src = url;
                      tempVideo.style.position = 'fixed';
                      tempVideo.style.top = '50%';
                      tempVideo.style.left = '50%';
                      tempVideo.style.transform = 'translate(-50%, -50%)';
                      tempVideo.style.width = '90vw';
                      tempVideo.style.maxWidth = '400px';
                      tempVideo.style.zIndex = '10000';
                      tempVideo.style.border = '3px solid #8B5CF6';
                      tempVideo.style.borderRadius = '15px';
                      tempVideo.style.backgroundColor = 'black';
                      tempVideo.controls = true;
                      tempVideo.playsInline = true;
                      
                      // Add overlay instructions
                      const overlay = document.createElement('div');
                      overlay.style.position = 'fixed';
                      overlay.style.top = '0';
                      overlay.style.left = '0';
                      overlay.style.width = '100%';
                      overlay.style.height = '100%';
                      overlay.style.backgroundColor = 'rgba(0,0,0,0.8)';
                      overlay.style.zIndex = '9999';
                      overlay.style.display = 'flex';
                      overlay.style.flexDirection = 'column';
                      overlay.style.justifyContent = 'center';
                      overlay.style.alignItems = 'center';
                      overlay.style.color = 'white';
                      overlay.style.fontSize = '16px';
                      overlay.style.textAlign = 'center';
                      overlay.style.padding = '20px';
                      
                      overlay.innerHTML = `
                        <div style="margin-bottom: 20px; font-size: 18px; font-weight: bold;">
                          📱 iOS Video Speichern
                        </div>
                        <div style="margin-bottom: 15px;">
                          1. Halte das Video gedrückt<br/>
                          2. Wähle "Video speichern"<br/>
                          3. Video wird in Fotos-App gespeichert
                        </div>
                        <button onclick="this.parentElement.parentElement.remove(); document.body.removeChild(document.querySelector('video[style*=\"position: fixed\"]'))" 
                                style="padding: 12px 24px; background: #8B5CF6; color: white; border: none; border-radius: 8px; font-size: 16px; margin-top: 10px; cursor: pointer;">
                          ❌ Schließen
                        </button>
                      `;
                      
                      document.body.appendChild(overlay);
                      document.body.appendChild(tempVideo);
                      
                      // Clean up blob URL after a while
                      setTimeout(() => URL.revokeObjectURL(url), 300000); // 5 minutes
                      
                    } catch (error) {
                      console.error('iOS video save error:', error);
                      // Fallback: Open in new tab
                      window.open(video, '_blank');
                      alert('📱 Video öffnet sich in neuem Tab. Halte das Video gedrückt und wähle "Video speichern"');
                    }
                    
                  } else if (isAndroid) {
                    // Android: Try to trigger download
                    try {
                      const response = await fetch(video);
                      const blob = await response.blob();
                      const url = URL.createObjectURL(blob);
                      
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `wan-video-${Date.now()}.mp4`;
                      
                      // Android sometimes needs user interaction
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      
                      // Show success message
                      alert('📥 Video Download gestartet! Überprüfe deine Downloads oder Benachrichtigungen.');
                      
                      setTimeout(() => URL.revokeObjectURL(url), 10000);
                      
                    } catch (error) {
                      console.error('Android download error:', error);
                      // Fallback
                      window.open(video, '_blank');
                      alert('📱 Video öffnet sich in neuem Tab. Nutze den "Download" Button des Browsers.');
                    }
                    
                  } else {
                    // Desktop: Normal download
                    try {
                      const link = document.createElement('a');
                      link.href = video;
                      link.download = `wan-video-${Date.now()}.mp4`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    } catch (error) {
                      window.open(video, '_blank');
                    }
                  }
                }}
                style={{
                  flex: 1,
                  padding: '15px 20px',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: 'white',
                  background: 'linear-gradient(135deg, hsl(280 70% 60%), hsl(280 70% 70%))',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)'
                  e.target.style.boxShadow = '0 8px 20px rgba(168, 85, 247, 0.4)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)'
                  e.target.style.boxShadow = 'none'
                }}
              >
                📥 Video speichern
              </button>
              
              <div style={{
                flex: 1,
                padding: '15px',
                background: 'hsl(var(--background))',
                borderRadius: '10px',
                fontSize: '14px',
                color: 'hsl(var(--muted-foreground))',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                💡 <span><strong>iPhone:</strong> Video-Overlay erscheint → Video gedrückt halten → "Video speichern"<br/>
                <strong>Android:</strong> Download startet automatisch</span>
              </div>
            </div>
          </div>
        )}
        
      </div>
    </div>
  )
}

export default WanVideoPage