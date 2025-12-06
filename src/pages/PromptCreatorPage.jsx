import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { generatePromptsFromIdea } from '../services/grokService.js'
import { createClient } from '@supabase/supabase-js'


// 🤖 Mechanischer Progress Indicator mit leuchtenden lila Zahlen
function ProgressIndicator({ totalPrompts, isLoading, completed, onComplete }) {
  const [visibleNumbers, setVisibleNumbers] = useState([])
  const [flickeringNumbers, setFlickeringNumbers] = useState([])
  const [glowingNumbers, setGlowingNumbers] = useState([])
  const [buttonReady, setButtonReady] = useState(false)

  // Zahlen Array basierend auf ausgewählter Anzahl
  const numbers = Array.from({ length: totalPrompts }, (_, i) => i + 1)

  useEffect(() => {
    if (isLoading) {
      // Reset bei neuem Loading
      setVisibleNumbers([])
      setFlickeringNumbers([])
      setGlowingNumbers([])
      setButtonReady(false)

      // Nach 4-6 Sekunden anfangen zu flackern
      setTimeout(() => {
        setFlickeringNumbers(numbers)
      }, 4000)
    }

    if (completed && !isLoading) {
      // Zahlen versetzt aufleuchten lassen
      numbers.forEach((num, index) => {
        setTimeout(() => {
          setGlowingNumbers(prev => [...prev, num])
        }, index * 300) // 300ms Verzögerung zwischen den Zahlen
      })

      // Button nach allen Zahlen aktivieren
      setTimeout(() => {
        setButtonReady(true)
      }, numbers.length * 300 + 500)
    }
  }, [isLoading, completed, totalPrompts])

  // Zahlen während Loading sichtbar machen
  useEffect(() => {
    if (isLoading) {
      setTimeout(() => {
        setVisibleNumbers(numbers)
      }, 1000)
    }
  }, [isLoading])

  return (
    <div style={{
      background: 'hsl(var(--card))',
      borderRadius: '20px',
      padding: '30px',
      border: '1px solid hsl(var(--border))',
      textAlign: 'center'
    }}>
      <h3 style={{
        margin: '0 0 30px 0',
        fontSize: '18px',
        fontWeight: '600',
        color: '#a855f7'
      }}>
        {isLoading ? 'Prompts werden geladen' : 'Prompts bereit'}
      </h3>

      {/* Leuchtende Zahlen Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${Math.min(totalPrompts, 5)}, 1fr)`,
        gap: '20px',
        marginBottom: '30px',
        justifyItems: 'center'
      }}>
        {numbers.map((num) => {
          const isVisible = visibleNumbers.includes(num)
          const isFlickering = flickeringNumbers.includes(num)
          const isGlowing = glowingNumbers.includes(num)

          return (
            <div
              key={num}
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '12px',
                border: '2px solid',
                borderColor: isGlowing ? '#a855f7' : '#374151',
                background: 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                fontWeight: '700',
                color: isGlowing ? '#a855f7' : isVisible ? '#6b7280' : 'transparent',
                opacity: isVisible ? 1 : 0.3,
                boxShadow: isGlowing ? 'inset 0 0 10px rgba(168, 85, 247, 0.4), inset 0 0 20px rgba(168, 85, 247, 0.2), 0 0 15px rgba(168, 85, 247, 0.6), 0 0 30px rgba(168, 85, 247, 0.3)' : 'none',
                animation: isFlickering && !isGlowing ? 'flicker 0.5s infinite alternate' : 
                          isGlowing ? `glow 1s ease-in, pulse ${1.5 + (num * 0.3)}s infinite ease-in-out ${1}s` : 
                          isVisible ? 'fadeIn 0.5s ease-out' : 'none',
                transition: 'all 0.3s ease'
              }}
            >
              {num}
            </div>
          )
        })}
      </div>

      {/* Mechanischer Button */}
      <button
        onClick={onComplete}
        disabled={!buttonReady}
        style={{
          padding: '15px 30px',
          background: buttonReady ? 
            'linear-gradient(135deg, #a855f7, #7c3aed)' : 
            'linear-gradient(135deg, #6b7280, #4b5563)',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          fontSize: '16px',
          fontWeight: '600',
          cursor: buttonReady ? 'pointer' : 'not-allowed',
          opacity: buttonReady ? 1 : 0.6,
          boxShadow: buttonReady ? '0 0 20px rgba(168, 85, 247, 0.4)' : 'none',
          animation: buttonReady ? 'buttonPowerUp 1s ease-in' : 'none',
          transition: 'all 0.3s ease'
        }}
      >
        {buttonReady ? '⚡ Multi-Prompts verwenden' : '🔄 Lädt hoch...'}
      </button>
    </div>
  )
}

function PromptCreatorPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  
  // State für die Prompt-Generierung
  const [userIdea, setUserIdea] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [generatedPrompts, setGeneratedPrompts] = useState([])
  const [error, setError] = useState('')
  
  // Neue Settings - Mechanischer AI-Workflow
  const [promptCount, setPromptCount] = useState('')
  const [photoStyle, setPhotoStyle] = useState('')
  const [consistencyMode, setConsistencyMode] = useState('')
  
  // Track ob User nach Generation editiert hat
  const [editedAfterGeneration, setEditedAfterGeneration] = useState(false)
  

  // Mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Load saved settings on component mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('promptCreator_lastSettings')
      if (savedSettings) {
        const settings = JSON.parse(savedSettings)
        console.log('🔄 Loading saved user settings:', settings)
        
        // Nur laden wenn nicht älter als 24 Stunden
        const isRecent = Date.now() - settings.timestamp < 24 * 60 * 60 * 1000
        if (isRecent) {
          setUserIdea(settings.userIdea || '')
          setPromptCount(settings.promptCount || '')
          setPhotoStyle(settings.photoStyle || '')
          setConsistencyMode(settings.consistencyMode || '')
          console.log('✅ Restored user settings from last session')
        } else {
          console.log('⏰ Saved settings too old, starting fresh')
          localStorage.removeItem('promptCreator_lastSettings')
        }
      }
    } catch (error) {
      console.error('❌ Error loading saved settings:', error)
    }
  }, [])

  // Test-Funktion - kopiert einfach das was an Grok gesendet würde
  const showGrokInput = async () => {
    if (!userIdea.trim()) {
      setError('Bitte gib erst eine Idea ein!')
      return
    }

    // GENAU das was handleGeneratePrompts macht, aber nur kopieren
    const finalInput = userIdea.trim()
    const systemPrompt = createSystemPrompt(promptCount, photoStyle, consistencyMode)
    
    const grokRequest = `=== WAS AN GROK GESENDET WIRD ===

SYSTEM PROMPT:
${systemPrompt}

USER INPUT:
"${finalInput}"

=== ENDE ===`

    // Direkt in die Zwischenablage
    await navigator.clipboard.writeText(grokRequest)
    setError('✅ In Zwischenablage kopiert!')
  }

  // Test-Funktion für Development
  const runTest = async () => {
    setError('')
    setIsLoading(true)
    try {
      const result = await testGrokService()
      if (result.success) {
        setGeneratedPrompts(result.prompts)
      } else {
        setError(result.error || 'Test fehlgeschlagen')
      }
    } catch (err) {
      setError('Test-Fehler: ' + err.message)
    }
    setIsLoading(false)
  }

  // Navigation zur Multi-Prompts Seite mit generierten Prompts
  const goToMultiPrompts = async () => {
    if (generatedPrompts.length === 0) {
      setError('Erst Prompts generieren!')
      return
    }

    try {
      // User Settings und Gesichtsbilder aus Supabase laden
      const supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY
      )

      // User Settings laden für "Mein Aussehen"
      const { data: userSettings, error: settingsError } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user?.username)
        .single()

      // User Face Images laden
      const { data: faceImages, error: facesError } = await supabase
        .from('user_face_images')
        .select('*')
        .eq('user_id', user?.username)

      console.log('🔍 Loaded user data for transfer:', {
        userSettings: userSettings,
        faceImages: faceImages?.length || 0
      })

      // User-Einstellungen für Rückkehr speichern
      const lastUserSettings = {
        userIdea: userIdea.trim(),
        promptCount,
        photoStyle,
        consistencyMode,
        timestamp: Date.now()
      }
      localStorage.setItem('promptCreator_lastSettings', JSON.stringify(lastUserSettings))
      console.log('💾 Saved user settings for return:', lastUserSettings)

      // Prompts und User-Daten an die Multi-Prompts Seite übergeben
      navigate('/nono-banana-multi-prompts', {
        state: {
          generatedPrompts: generatedPrompts,
          originalIdea: userIdea.trim(),
          promptCount: promptCount,
          photoStyle: photoStyle,
          // User-spezifische Daten übertragen
          userSettings: userSettings,
          userFaceImages: faceImages || [],
          transferredFromPromptCreator: true
        }
      })
    } catch (error) {
      console.error('❌ Error loading user data:', error)
      
      // Auch im Fallback speichern
      const lastUserSettings = {
        userIdea: userIdea.trim(),
        promptCount,
        photoStyle,
        consistencyMode,
        timestamp: Date.now()
      }
      localStorage.setItem('promptCreator_lastSettings', JSON.stringify(lastUserSettings))
      
      // Fallback: ohne User-Daten navigieren
      navigate('/nono-banana-multi-prompts', {
        state: {
          generatedPrompts: generatedPrompts,
          originalIdea: userIdea.trim(),
          promptCount: promptCount,
          photoStyle: photoStyle,
          transferredFromPromptCreator: true
        }
      })
    }
  }

  // Haupt-Funktion für Prompt-Generierung
  const handleGeneratePrompts = async () => {
    if (!userIdea.trim()) {
      setError('Bitte gib eine Idee ein!')
      return
    }

    setError('')
    setIsLoading(true)
    setGeneratedPrompts([])
    setEditedAfterGeneration(false) // Reset edit flag

    try {
      const result = await generatePromptsFromIdea(userIdea.trim(), {
        count: promptCount,
        photoStyle,
        consistencyMode
      })
      
      if (result.success) {
        setGeneratedPrompts(result.prompts)
        setError('')
      } else {
        setError(result.error || 'Unbekannter Fehler')
        setGeneratedPrompts([])
      }
    } catch (err) {
      setError('Fehler beim Generieren: ' + err.message)
      setGeneratedPrompts([])
    }

    setIsLoading(false)
  }

  return (
    <>
      {/* CSS Animation Styles */}
      <style>
        {`
          @keyframes slideInFromBottom {
            from {
              opacity: 0;
              transform: translateY(30px) scale(0.95);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
          
          @keyframes flicker {
            0% { opacity: 0.3; }
            50% { opacity: 0.7; }
            100% { opacity: 0.4; }
          }
          
          @keyframes glow {
            from {
              box-shadow: inset 0 0 5px rgba(168, 85, 247, 0.2), 0 0 5px rgba(168, 85, 247, 0.3);
              transform: scale(0.9);
            }
            to {
              box-shadow: inset 0 0 10px rgba(168, 85, 247, 0.4), inset 0 0 20px rgba(168, 85, 247, 0.2), 0 0 15px rgba(168, 85, 247, 0.6), 0 0 30px rgba(168, 85, 247, 0.3);
              transform: scale(1);
            }
          }
          
          @keyframes pulse {
            0%, 100% {
              box-shadow: inset 0 0 10px rgba(168, 85, 247, 0.4), inset 0 0 20px rgba(168, 85, 247, 0.2), 0 0 15px rgba(168, 85, 247, 0.6), 0 0 30px rgba(168, 85, 247, 0.3);
              opacity: 1;
            }
            50% {
              box-shadow: inset 0 0 15px rgba(168, 85, 247, 0.6), inset 0 0 30px rgba(168, 85, 247, 0.3), 0 0 25px rgba(168, 85, 247, 0.8), 0 0 50px rgba(168, 85, 247, 0.5);
              opacity: 0.8;
            }
          }
          
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: scale(0.8);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          
          @keyframes buttonPowerUp {
            0% {
              opacity: 0.6;
              transform: scale(0.95);
              box-shadow: none;
            }
            50% {
              opacity: 0.8;
              transform: scale(0.98);
              box-shadow: 0 0 10px rgba(168, 85, 247, 0.3);
            }
            100% {
              opacity: 1;
              transform: scale(1);
              box-shadow: 0 0 20px rgba(168, 85, 247, 0.4);
            }
          }
        `}
      </style>
      
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
            to="/generation-modes" 
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
            ← Generation Modes
          </Link>
        </div>
      </div>

      {/* Title */}
      <h1 style={{
        textAlign: 'center',
        margin: '0 0 20px 0',
        fontSize: '2.5rem',
        fontWeight: '700',
        color: 'hsl(47 100% 65%)',
        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        fontFamily: "'Space Grotesk', sans-serif"
      }}>
        🤖 AI Prompt Creator
      </h1>

      {/* Subtitle */}
      <div style={{
        textAlign: 'center',
        marginBottom: '20px'
      }}>
        <p style={{
          margin: '0 0 10px 0',
          fontSize: isMobile ? '18px' : '22px',
          color: 'hsl(var(--foreground))',
          fontWeight: '500'
        }}>
          Beschreibe deine Idee - Grok erstellt professionelle Prompts
        </p>
      </div>

      {/* Main Content */}
      <div style={{
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        {/* Input Section */}
        <div style={{
          background: 'hsl(var(--card))',
          borderRadius: '20px',
          padding: (isLoading || generatedPrompts.length > 0) ? '15px' : (isMobile ? '20px' : '25px'),
          marginBottom: '20px',
          border: '1px solid hsl(var(--border))',
          transition: 'all 0.5s ease'
        }}>

          {/* Kompakte Anzeige wenn generiert wird oder fertig */}
          {(isLoading || generatedPrompts.length > 0) ? (
            <div>
              {/* Kompakte Einstellungen als Dropdowns */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
                marginBottom: '15px'
              }}>
                {/* Anzahl Dropdown */}
                <select
                  value={promptCount}
                  onChange={(e) => {
                    setPromptCount(Number(e.target.value))
                    // Reset generated prompts wenn Anzahl geändert wird
                    if (generatedPrompts.length > 0) {
                      setGeneratedPrompts([])
                      setEditedAfterGeneration(false)
                    }
                  }}
                  disabled={isLoading}
                  style={{
                    padding: '8px 10px',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                    background: 'hsl(var(--background))',
                    color: 'hsl(var(--foreground))',
                    fontSize: '12px',
                    opacity: isLoading ? 0.6 : 1
                  }}
                >
                  <option value={4}>4 Prompts</option>
                  <option value={6}>6 Prompts</option>
                  <option value={8}>8 Prompts</option>
                  <option value={10}>10 Prompts</option>
                </select>

                {/* Style Dropdown */}
                <select
                  value={photoStyle}
                  onChange={(e) => {
                    setPhotoStyle(e.target.value)
                    // Reset generated prompts wenn Style geändert wird
                    if (generatedPrompts.length > 0) {
                      setGeneratedPrompts([])
                      setEditedAfterGeneration(false)
                    }
                  }}
                  disabled={isLoading}
                  style={{
                    padding: '8px 10px',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                    background: 'hsl(var(--background))',
                    color: 'hsl(var(--foreground))',
                    fontSize: '12px',
                    opacity: isLoading ? 0.6 : 1
                  }}
                >
                  <option value="flexible">Flexibel</option>
                  <option value="fashion-editorial">Fashion/Editorial</option>
                  <option value="natural-light">Natural Light</option>
                  <option value="studio-professional">Studio Professional</option>
                  <option value="cinematic">Cinematic</option>
                  <option value="clean-beauty">Clean Beauty</option>
                  <option value="instagram-casual">Instagram Casual</option>
                </select>

                {/* Konsistenz Dropdown */}
                <select
                  value={consistencyMode}
                  onChange={(e) => {
                    setConsistencyMode(e.target.value)
                    // Reset generated prompts wenn Konsistenz geändert wird
                    if (generatedPrompts.length > 0) {
                      setGeneratedPrompts([])
                      setEditedAfterGeneration(false)
                    }
                  }}
                  disabled={isLoading}
                  style={{
                    padding: '8px 10px',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                    background: 'hsl(var(--background))',
                    color: 'hsl(var(--foreground))',
                    fontSize: '12px',
                    opacity: isLoading ? 0.6 : 1
                  }}
                >
                  <option value="same-shooting">Gleiches Shooting</option>
                  <option value="same-person">Gleiche Person</option>
                  <option value="flexible">Flexibel</option>
                </select>
              </div>
              
              {/* Nur das Prompt-Textfeld */}
              <textarea
                value={userIdea}
                onChange={(e) => {
                  setUserIdea(e.target.value)
                  // Reset generated prompts wenn Prompt geändert wird
                  if (generatedPrompts.length > 0) {
                    setGeneratedPrompts([])
                    setEditedAfterGeneration(false)
                  }
                }}
                placeholder="Deine Idee..."
                disabled={isLoading}
                style={{
                  width: '100%',
                  minHeight: '60px',
                  padding: '12px',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  background: 'hsl(var(--background))',
                  color: 'hsl(var(--foreground))',
                  fontSize: '14px',
                  resize: 'none',
                  fontFamily: 'inherit',
                  opacity: isLoading ? 0.7 : 1
                }}
              />
            </div>
          ) : (
            <>
              {/* Einstellungen - Schritt für Schritt */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '15px'
              }}>
                {/* Anzahl Prompts - Immer sichtbar */}
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: 'hsl(var(--foreground))'
                  }}>
                    Anzahl Prompts
                  </label>
                  <select
                    value={promptCount}
                    onChange={(e) => setPromptCount(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      background: 'hsl(var(--background))',
                      color: 'hsl(var(--foreground))',
                      fontSize: '14px'
                    }}
                  >
                    <option value="" disabled>Bitte wählen</option>
                    <option value={4}>4 Prompts</option>
                    <option value={6}>6 Prompts</option>
                    <option value={8}>8 Prompts</option>
                    <option value={10}>10 Prompts</option>
                  </select>
                </div>

                {/* Fotografie Stil - Fliegt mechanisch ein */}
                {promptCount && (
                  <div style={{
                    animation: 'slideInFromBottom 0.5s ease-out',
                    transformOrigin: 'bottom'
                  }}>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: 'hsl(var(--foreground))'
                    }}>
                      🤖 Fotografie-Stil
                    </label>
                    <select
                      value={photoStyle}
                      onChange={(e) => setPhotoStyle(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        background: 'hsl(var(--background))',
                        color: 'hsl(var(--foreground))',
                        fontSize: '14px',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                      }}
                    >
                      <option value="" disabled>Bitte wählen</option>
                      <option value="flexible">Flexibel</option>
                      <option value="fashion-editorial">Fashion/Editorial (Vogue)</option>
                      <option value="natural-light">Natürliches Tageslicht</option>
                      <option value="studio-professional">Studio Professional</option>
                      <option value="cinematic">Cinematic/Dramatisch</option>
                      <option value="clean-beauty">Clean Beauty/Kommerziell</option>
                      <option value="instagram-casual">Instagram Casual</option>
                    </select>
                  </div>
                )}

                {/* Konsistenz Modus - Fliegt mechanisch ein */}
                {photoStyle && (
                  <div style={{
                    animation: 'slideInFromBottom 0.5s ease-out',
                    transformOrigin: 'bottom'
                  }}>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: 'hsl(var(--foreground))'
                    }}>
                      ⚙️ Konsistenz
                    </label>
                    <select
                      value={consistencyMode}
                      onChange={(e) => setConsistencyMode(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        background: 'hsl(var(--background))',
                        color: 'hsl(var(--foreground))',
                        fontSize: '14px',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                      }}
                    >
                      <option value="" disabled>Bitte wählen</option>
                      <option value="same-shooting">Gleiches Shooting (nur Pose/Winkel)</option>
                      <option value="same-person">Gleiche Person (Location variiert)</option>
                      <option value="flexible">Komplett flexibel</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Textfeld - Fliegt mechanisch ein wenn alles ausgefüllt */}
              {promptCount && photoStyle && consistencyMode && (
                <div style={{ 
                  marginTop: '20px',
                  animation: 'slideInFromBottom 0.6s ease-out',
                  transformOrigin: 'bottom'
                }}>
                  <h3 style={{
                    margin: '0 0 15px 0',
                    fontSize: '18px',
                    fontWeight: '600',
                    color: 'hsl(var(--foreground))'
                  }}>
                    🚀 Fast geschafft! Deine kreative Idee eingeben
                  </h3>
                  
                  <textarea
                    value={userIdea}
                    onChange={(e) => setUserIdea(e.target.value)}
                    placeholder="🔥 Perfekt! Jetzt deine Idee... z.B. 'am strand mit leder outfit' oder 'fitness training'"
                    style={{
                      width: '100%',
                      minHeight: '100px',
                      padding: '15px',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                      background: 'hsl(var(--background))',
                      color: 'hsl(var(--foreground))',
                      fontSize: '16px',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                    }}
                  />
                </div>
              )}
            </>
          )}

          <button
            onClick={handleGeneratePrompts}
            disabled={isLoading || !userIdea.trim() || !promptCount || !photoStyle || !consistencyMode}
            style={{
              width: '100%',
              marginTop: '20px',
              padding: '15px',
              background: isLoading ? '#6b7280' : 
                         (!promptCount || !photoStyle || !consistencyMode || !userIdea.trim()) ? '#9ca3af' :
                         (generatedPrompts.length > 0 && !editedAfterGeneration) ? 'linear-gradient(135deg, #6b7280, #4b5563)' : // Abgedunkelt nach Generation
                         'linear-gradient(135deg, #f59e0b, #d97706)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: isLoading || !userIdea.trim() || !promptCount || !photoStyle || !consistencyMode ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              opacity: (generatedPrompts.length > 0 && !editedAfterGeneration) ? 0.7 : 1
            }}
          >
            {isLoading ? '🤖 Grok arbeitet...' : 
             (!promptCount || !photoStyle || !consistencyMode || !userIdea.trim()) ? '⚙️ Konfiguration unvollständig' :
             (generatedPrompts.length > 0 && !editedAfterGeneration) ? '🔒 Konfiguration gesperrt' :
             editedAfterGeneration ? '🔄 Neu generieren' :
             '✨ Prompts generieren'}
          </button>

          {/* Mechanischer Progress Indicator mit leuchtenden Zahlen - DIREKT nach Button */}
          {(isLoading || generatedPrompts.length > 0) && (
            <div style={{ marginTop: '30px' }}>
              <ProgressIndicator 
                totalPrompts={promptCount}
                isLoading={isLoading}
                completed={generatedPrompts.length > 0}
                onComplete={goToMultiPrompts}
              />
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '12px',
              padding: '15px',
              marginTop: '20px',
              color: '#dc2626'
            }}>
              <strong>Fehler:</strong> {error}
            </div>
          )}
        </div>
      </div>
      </div>
    </>
  )
}

export default PromptCreatorPage