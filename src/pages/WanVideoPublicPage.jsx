import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'

function WanVideoPublicPage() {
  const { user } = useAuth()
  const [image, setImage] = useState(null)
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
  const [enableSafetyChecker, setEnableSafetyChecker] = useState(true)
  const [showInfoPopup, setShowInfoPopup] = useState(null)
  const [size, setSize] = useState('854*480')
  const [duration, setDuration] = useState(5)
  
  // Wake Lock for mobile
  const wakeLockRef = useRef(null)
  
  const fileRef = useRef(null)

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
    if (!image || !prompt || loading) return
    
    setLoading(true)
    setVideo(null)
    setStartTime(Date.now())
    setProgress('Job wird an öffentlichen WAN 2.5 gesendet...')
    
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
      // Convert base64 to blob and create URL for public WAN 2.5
      const base64 = image.split(',')[1]
      const base64Data = `data:image/jpeg;base64,${base64}`
      
      const requestPayload = {
        input: {
          prompt: prompt,
          image: base64Data,
          negative_prompt: negativePrompt,
          size: size,
          duration: duration,
          seed: seed,
          enable_prompt_expansion: enablePromptExpansion,
          enable_safety_checker: enableSafetyChecker
        }
      }
      
      console.log('🚀 Sending to PUBLIC WAN 2.5:', JSON.stringify(requestPayload, null, 2))
      
      const response = await fetch('https://api.runpod.ai/v2/wan-2-5/run', {
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
        
        const statusResponse = await fetch(`https://api.runpod.ai/v2/wan-2-5/status/${job.id}`, {
          headers: { 'Authorization': `Bearer ${import.meta.env.VITE_RUNPOD_API_KEY}` }
        })
        result = await statusResponse.json()
        
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
        // Try different possible output formats for public WAN 2.5
        let videoUrl = null
        
        if (result.output?.video_url) {
          videoUrl = result.output.video_url
        } else if (result.output?.result) {
          videoUrl = result.output.result
        } else if (result.output?.video) {
          videoUrl = result.output.video
        }
        
        if (videoUrl) {
          setProgress('Video erfolgreich generiert!')
          setVideo(videoUrl)
        } else {
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
        background: 'linear-gradient(135deg, hsl(47 100% 65%), hsl(280 70% 60%))',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        fontFamily: "'Space Grotesk', sans-serif"
      }}>
        🎬 WAN 2.5 Public Generator
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
          Öffentlicher WAN 2.5 Endpoint, {user?.username}!
        </p>
        <p style={{
          margin: 0,
          fontSize: '14px',
          color: 'hsl(var(--muted-foreground))'
        }}>
          Nutzt den offiziellen RunPod WAN 2.5 Service
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
              {/* Negative Prompt */}
              <div style={{ gridColumn: isMobile ? '1' : '1 / -1' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>
                  🚫 Negative Prompt
                </label>
                <input 
                  type="text"
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  placeholder="z.B. blurry, distorted, low quality"
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
              
              {/* Video Size */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>
                  📐 Auflösung ({size})
                </label>
                <select
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid hsl(var(--border))',
                    background: 'hsl(var(--background))',
                    color: 'hsl(var(--foreground))'
                  }}
                >
                  <option value="854*480">SD (854×480)</option>
                  <option value="1280*720">HD (1280×720)</option>
                  <option value="1920*1080">Full HD (1920×1080)</option>
                </select>
              </div>

              {/* Duration */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>
                  ⏱️ Dauer ({duration} Sek.)
                </label>
                <input 
                  type="number"
                  min="3"
                  max="10"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
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

              {/* Seed */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>
                  🎲 Seed ({seed === -1 ? 'Random' : seed})
                </label>
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
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input 
                    type="checkbox"
                    checked={enablePromptExpansion}
                    onChange={(e) => setEnablePromptExpansion(e.target.checked)}
                  />
                  <span>✨ Auto Prompt Enhancement</span>
                </label>
              </div>
              
              {/* Safety Checker */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input 
                    type="checkbox"
                    checked={enableSafetyChecker}
                    onChange={(e) => setEnableSafetyChecker(e.target.checked)}
                  />
                  <span>🛡️ Safety Check</span>
                </label>
              </div>
            </div>
          )}
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
            background: loading ? 'hsl(var(--muted))' : 'hsl(47 100% 65%)',
            border: 'none',
            borderRadius: '20px',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease',
            marginBottom: '30px'
          }}
        >
          {loading ? 'Generiere mit öffentlichem WAN 2.5...' : 'Video mit öffentlichem WAN 2.5 generieren'}
        </button>
      
        {loading && (
          <div style={{ 
            background: 'hsl(var(--card))',
            borderRadius: '20px',
            padding: '30px',
            marginBottom: '30px',
            border: '2px solid hsl(47 100% 65%)',
            boxShadow: '0 10px 25px rgba(245, 158, 11, 0.2)'
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
                borderTop: '3px solid hsl(47 100% 65%)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                marginRight: '12px'
              }}></div>
              <strong>{progress}</strong>
            </div>
            
            <div style={{
              background: 'hsl(var(--background))',
              borderRadius: '10px',
              padding: '15px 20px'
            }}>
              <div style={{ 
                fontSize: '16px', 
                color: 'hsl(var(--foreground))',
                marginBottom: '8px'
              }}>
                ⏱️ <strong>Vergangene Zeit: {formatTime(elapsedTime)}</strong>
              </div>
            </div>
            
            <style>{`
              @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
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
            border: '2px solid hsl(47 100% 65%)',
            boxShadow: '0 10px 25px rgba(245, 158, 11, 0.2)'
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
              🎉 Dein öffentliches WAN 2.5 Video ist fertig!
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
          </div>
        )}
        
      </div>
    </div>
  )
}

export default WanVideoPublicPage