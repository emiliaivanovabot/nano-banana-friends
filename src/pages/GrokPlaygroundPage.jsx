import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'

function GrokPlaygroundPage() {
  const { user } = useAuth()
  const [image, setImage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState('')
  const [prompt, setPrompt] = useState('Describe what\'s in this image in detail.')
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  
  const fileRef = useRef(null)

  const uploadImage = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => setImage(e.target.result)
      reader.readAsDataURL(file)
    }
  }

  const analyzeImage = async () => {
    if (!image || !prompt || loading) return
    
    setLoading(true)
    setAnalysis('')
    
    try {
      // Convert image to base64 format
      const base64 = image.split(',')[1]
      const base64Data = `data:image/jpeg;base64,${base64}`
      
      const requestPayload = {
        model: "grok-2-vision-1212",  // Neueste Version verwenden
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: base64Data,
                  detail: "high"
                }
              },
              {
                type: "text",
                text: prompt
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.5
      }
      
      console.log('🧠 Sending to Grok Vision API:', JSON.stringify(requestPayload, null, 2))
      console.log('🔑 API Key (first 10 chars):', import.meta.env.VITE_GROK_API_KEY?.substring(0, 10))
      
      // Try xAI's correct endpoint
      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_GROK_API_KEY}`
        },
        body: JSON.stringify(requestPayload)
      })

      if (!response.ok) {
        console.error('🚨 API Response Error:', response.status, response.statusText)
        const errorText = await response.text()
        console.error('🚨 Error Details:', errorText)
        
        if (response.status === 404) {
          setAnalysis(`❌ Grok API 404 Error
          
Mögliche Ursachen:
• Model name falsch: versuche "grok-vision-beta" statt "grok-2-vision-1212"
• API Key hat keinen Zugang zu Vision Models
• Account braucht Vision API Berechtigung

API Key Status: ${import.meta.env.VITE_GROK_API_KEY ? '✅ Vorhanden' : '❌ Fehlt'}`)
        } else {
          setAnalysis(`API Error: ${response.status} - ${response.statusText}`)
        }
        return
      }

      const result = await response.json()
      console.log('🧠 Grok Response:', result)
      
      if (result.choices && result.choices[0] && result.choices[0].message) {
        setAnalysis(result.choices[0].message.content)
      } else if (result.error) {
        console.error('🚨 API Error Response:', result.error)
        setAnalysis(`API Error: ${result.error.message || JSON.stringify(result.error)}`)
      } else {
        console.error('🚨 Unexpected Response Format:', result)
        setAnalysis('Fehler: Keine Analyse erhalten. Überprüfe Console für Details.')
      }
      
    } catch (err) {
      console.error('Grok Analysis Error:', err)
      
      setAnalysis(`❌ Grok API Fehler: ${err.message}

🔧 Debugging Info:
• Model: grok-2-vision-1212
• Endpoint: https://api.x.ai/v1/chat/completions  
• API Key: ${import.meta.env.VITE_GROK_API_KEY ? '✅ Vorhanden' : '❌ Fehlt'}

📋 Nächste Schritte:
1. Überprüfe xAI Console: console.x.ai
2. Verifiziere API Key Berechtigung für Vision Models
3. Versuche anderen Model: "grok-vision-beta"

💡 Deine Frage: "${prompt}"`)
    }
    
    setLoading(false)
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
      <h1 style={{
        textAlign: 'center',
        margin: '0 0 20px 0',
        fontSize: '2.5rem',
        fontWeight: '700',
        color: 'hsl(280 70% 60%)',
        background: 'linear-gradient(135deg, hsl(280 70% 60%), hsl(220 70% 60%))',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        fontFamily: "'Space Grotesk', sans-serif"
      }}>
        🧠 Grok Playground
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
          Bildanalyse mit xAI's Grok Vision, {user?.username}!
        </p>
        <p style={{
          margin: 0,
          fontSize: '14px',
          color: 'hsl(var(--muted-foreground))'
        }}>
          Lade ein Bild hoch und lass Grok es für dich analysieren
        </p>
      </div>

      {/* Main Container */}
      <div style={{
        maxWidth: '1000px',
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
              onClick={() => fileRef.current.click()}
              style={{
                width: '100%',
                padding: '20px',
                fontSize: '16px',
                fontWeight: '600',
                color: 'hsl(var(--primary-foreground))',
                background: 'linear-gradient(135deg, hsl(280 70% 60%), hsl(220 70% 60%))',
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
              {image ? '🖼️ Bild ändern' : '📸 Bild hochladen'}
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
                🤔 Was möchtest du wissen?
              </h3>
              
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="z.B. 'Describe what's in this image' oder 'What emotions can you see?'"
                style={{ 
                  width: '100%',
                  height: '100px',
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
                  'Describe this image in detail',
                  'What objects can you see?',
                  'What emotions or mood does this convey?',
                  'Read any text in this image'
                ].map((quickPrompt, index) => (
                  <button
                    key={index}
                    onClick={() => setPrompt(quickPrompt)}
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
            </div>

            {/* Analyze Button */}
            <button 
              onClick={analyzeImage}
              disabled={!image || !prompt || loading}
              style={{ 
                width: '100%',
                padding: '20px',
                fontSize: '18px',
                fontWeight: '700',
                color: loading ? 'hsl(var(--muted-foreground))' : 'white',
                background: loading ? 'hsl(var(--muted))' : 'linear-gradient(135deg, hsl(280 70% 60%), hsl(220 70% 60%))',
                border: 'none',
                borderRadius: '15px',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                marginBottom: '20px'
              }}
              onMouseEnter={(e) => {
                if (!loading && image && prompt) {
                  e.target.style.transform = 'translateY(-3px)'
                  e.target.style.boxShadow = '0 15px 35px rgba(139, 92, 246, 0.4)'
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = 'none'
              }}
            >
              {loading ? '🧠 Analysiere...' : '🔍 Mit Grok analysieren'}
            </button>
          </div>

          {/* Right Column - Analysis Output */}
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
                🤖 Grok's Analyse
              </h3>
              
              {loading && (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '15px',
                  marginBottom: '20px',
                  padding: '20px',
                  background: 'hsl(var(--muted) / 0.3)',
                  borderRadius: '15px'
                }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    border: '3px solid hsl(var(--muted))',
                    borderTop: '3px solid hsl(280 70% 60%)',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  <span style={{ 
                    fontSize: '16px', 
                    color: 'hsl(var(--foreground))',
                    fontWeight: '500'
                  }}>
                    Grok analysiert dein Bild...
                  </span>
                </div>
              )}
              
              {!loading && !analysis && (
                <div style={{
                  textAlign: 'center',
                  color: 'hsl(var(--muted-foreground))',
                  fontSize: '16px',
                  padding: '40px 20px',
                  fontStyle: 'italic'
                }}>
                  Lade ein Bild hoch und klicke auf "Analysieren" um zu starten
                </div>
              )}
              
              {analysis && (
                <div style={{
                  background: 'hsl(var(--background))',
                  borderRadius: '12px',
                  padding: '20px',
                  fontSize: '15px',
                  lineHeight: '1.6',
                  color: 'hsl(var(--foreground))',
                  whiteSpace: 'pre-wrap',
                  border: '1px solid hsl(var(--border))'
                }}>
                  {analysis}
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
    </div>
  )
}

export default GrokPlaygroundPage