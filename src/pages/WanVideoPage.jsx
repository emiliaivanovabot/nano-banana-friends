import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'

function WanVideoPage() {
  const [image, setImage] = useState(null)
  const [prompt, setPrompt] = useState('')
  const [video, setVideo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState('')
  const [elapsedTime, setElapsedTime] = useState(0)
  const [startTime, setStartTime] = useState(null)
  
  const fileRef = useRef(null)

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
    if (!image || !prompt) return
    
    setLoading(true)
    setVideo(null)
    setStartTime(Date.now())
    setProgress('Job wird an RunPod gesendet...')
    
    try {
      const base64 = image.split(',')[1]
      
      const response = await fetch(`https://api.runpod.ai/v2/${import.meta.env.VITE_RUNPOD_ENDPOINT_ID}/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_RUNPOD_API_KEY}`
        },
        body: JSON.stringify({
          input: {
            prompt: prompt,
            image_base64: base64,
            seed: 42,
            cfg: 2.0,
            width: 480,
            height: 832,
            length: 162,            // 162 frames = ~10 seconds (was 81 = 5 seconds)
            steps: 10
          }
        })
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
        
        // Update progress based on status and time
        if (result.status === 'IN_QUEUE') {
          setProgress('Warte in der Warteschlange...')
        } else if (result.status === 'IN_PROGRESS') {
          setProgress('Generiere Video... Dauert normalerweise 4-6 Minuten.')
        } else if (result.status === 'RUNNING') {
          setProgress('Verarbeitung auf GPU... Gleich fertig!')
        }
        
      } while (result.status !== 'COMPLETED' && result.status !== 'FAILED')
      
      if (result.status === 'COMPLETED' && result.output?.video) {
        setProgress('Video erfolgreich generiert!')
        setVideo(`data:video/mp4;base64,${result.output.video}`)
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
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      
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
      
      <h1 style={{ 
        fontSize: '1.8rem', 
        marginBottom: '20px', 
        color: '#1F2937',
        textAlign: 'center'
      }}>
        🎬 WAN 2.2 Video Generator
      </h1>
      
      <input 
        ref={fileRef}
        type="file" 
        accept="image/*" 
        onChange={uploadImage}
        style={{ display: 'none' }}
      />
      
      <button onClick={() => fileRef.current.click()}>
        {image ? 'Bild ändern' : 'Bild hochladen'}
      </button>
      
      {image && <img src={image} style={{ width: '300px', display: 'block', margin: '20px 0' }} />}
      
      <textarea 
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Prompt eingeben..."
        style={{ width: '100%', height: '100px', margin: '20px 0' }}
      />
      
      <button 
        onClick={generateVideo}
        disabled={!image || !prompt || loading}
        style={{ 
          padding: '10px 20px', 
          fontSize: '16px',
          backgroundColor: loading ? '#6B7280' : '#3B82F6',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Generiere...' : 'Video generieren'}
      </button>
      
      {loading && (
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          backgroundColor: '#F3F4F6', 
          borderRadius: '8px',
          border: '1px solid #E5E7EB'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginBottom: '10px',
            fontSize: '14px',
            color: '#374151'
          }}>
            <div style={{
              width: '16px',
              height: '16px',
              border: '2px solid #3B82F6',
              borderTop: '2px solid transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              marginRight: '8px'
            }}></div>
            <strong>{progress}</strong>
          </div>
          
          <div style={{ 
            fontSize: '14px', 
            color: '#6B7280',
            marginBottom: '8px'
          }}>
            Vergangene Zeit: {formatTime(elapsedTime)}
          </div>
          
          <div style={{ 
            fontSize: '12px', 
            color: '#9CA3AF'
          }}>
            {elapsedTime < 60 
              ? "Startet... Kalte GPU-Initialisierung kann 1-2 Minuten dauern"
              : elapsedTime < 180
              ? "GPU erwärmt sich... Generierung beginnt bald"
              : "Verarbeite Video-Frames... Normalerweise fertig in 4-6 Minuten insgesamt"
            }
          </div>
          
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}
      
      {video && (
        <video controls style={{ width: '100%', marginTop: '20px' }}>
          <source src={video} type="video/mp4" />
        </video>
      )}
      
    </div>
  )
}

export default WanVideoPage