import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { generatePromptsFromIdea, testGrokService } from '../services/grokService.js'
import { createClient } from '@supabase/supabase-js'

// Kopie der createSystemPrompt Funktion für Debug
function createSystemPrompt(count, photoStyle, consistencyMode) {
  let styleInstructions = ''
  
  switch (photoStyle) {
    case 'fashion-editorial':
      styleInstructions = 'Verwende High-Fashion Editorial Style: dramatic lighting, Vogue-ähnlich, künstlerische Posen, professionelle Studio-Ästhetik.'
      break
    case 'natural-light':
      styleInstructions = 'Verwende natürliches Tageslicht: soft natural lighting, authentische Stimmung, organic feels, minimale Schatten.'
      break
    case 'studio-professional':
      styleInstructions = 'Verwende Studio-Professional Style: controlled lighting, clean backgrounds, commercial quality, perfekte Beleuchtung.'
      break
    case 'cinematic':
      styleInstructions = 'Verwende Cinematic Style: dramatic shadows, moody lighting, film-like quality, emotionale Stimmung.'
      break
    case 'clean-beauty':
      styleInstructions = 'Verwende Clean Beauty Style: soft lighting, natural beauty, commercial appeal, fresh und clean.'
      break
    case 'instagram-casual':
      styleInstructions = 'Verwende Instagram Casual Style: lifestyle photography, relatable poses, social media optimiert.'
      break
    default:
      styleInstructions = 'Sei flexibel mit dem Fotografie-Stil - wähle was am besten zur Idee passt.'
  }

  let consistencyInstructions = ''
  
  switch (consistencyMode) {
    case 'same-shooting':
      consistencyInstructions = 'WICHTIG: Alle Prompts sollen aus demselben Shooting sein - gleiche Person, gleiche Kleidung, gleiche Location, gleiche Beleuchtung. Ändere NUR Posen, Gesichtsausdrücke und Kamerawinkel (Vogelperspektive, Nahaufnahme, etc.).'
      break
    case 'same-person':
      consistencyInstructions = 'WICHTIG: Gleiche Person und ähnliche Kleidung, aber Location und Setup können variieren. Halte den Look konsistent.'
      break
    default:
      consistencyInstructions = 'Sei kreativ mit verschiedenen Locations, Outfits und Setups.'
  }

  return `Du bist ein Weltklasse Model-Fotograf und Experte für professionelle Bildprompts.

AUFGABE: Erstelle basierend auf der User-Eingabe genau ${count} verschiedene, detaillierte und professionelle Bildprompts.

STIL-VORGABEN:
${styleInstructions}

KONSISTENZ-VORGABEN:
${consistencyInstructions}

ALLGEMEINE REGELN:
- Jeder Prompt soll 30-60 Wörter haben für maximale Details
- Verwende spezifische Fotografie-Begriffe (camera angles, lighting terms, etc.)
- Beschreibe konkrete Posen und Gesichtsausdrücke
- Erwähne immer Kamerawinkel/Perspektive (close-up, wide shot, bird's eye view, etc.)
- Mache jeden Prompt einzigartig aber thematisch passend
- Sei so detailliert wie möglich bei Aussehen, Kleidung und Location
- Verwende keine expliziten oder unpassenden Inhalte

FORMAT: Antworte NUR mit einem JSON-Array im folgenden Format:
[
${Array.from({length: count}, (_, i) => `  {"prompt": "Prompt ${i + 1} hier"}`).join(',\n')}
]

WICHTIG: Keine zusätzlichen Texte, Erklärungen oder Formatierungen - nur das JSON-Array!`
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
  
  // Neue Settings
  const [promptCount, setPromptCount] = useState(6)
  const [photoStyle, setPhotoStyle] = useState('flexible')
  const [consistencyMode, setConsistencyMode] = useState('same-shooting')
  

  // Mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
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
          {/* Left - Back Link */}
          <Link 
            to="/generation-modes" 
            style={{ 
              color: 'hsl(var(--muted-foreground))',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            ← Generation Modes
          </Link>
          
          {/* Right - Test Buttons (Development) */}
          {import.meta.env.DEV && (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={showGrokInput}
                disabled={!userIdea.trim()}
                style={{
                  background: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  opacity: !userIdea.trim() ? 0.5 : 1
                }}
              >
                🔍 Debug Input
              </button>
              <button
                onClick={runTest}
                disabled={isLoading}
                style={{
                  background: '#059669',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  opacity: isLoading ? 0.5 : 1
                }}
              >
                🧪 Test
              </button>
            </div>
          )}
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
        marginBottom: '40px'
      }}>
        <p style={{
          margin: '0 0 10px 0',
          fontSize: isMobile ? '18px' : '22px',
          color: 'hsl(var(--foreground))',
          fontWeight: '500'
        }}>
          Beschreibe deine Idee - Grok erstellt professionelle Prompts
        </p>
        <p style={{
          margin: '0',
          fontSize: '14px',
          color: 'hsl(var(--muted-foreground))',
          fontStyle: 'italic'
        }}>
          z.B. "am strand mit leder outfit" oder "fitness im gym"
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
          padding: '30px',
          marginBottom: '30px',
          border: '1px solid hsl(var(--border))'
        }}>
          <h3 style={{
            margin: '0 0 20px 0',
            fontSize: '18px',
            fontWeight: '600',
            color: 'hsl(var(--foreground))'
          }}>
            Deine Idee
          </h3>
          
          <textarea
            value={userIdea}
            onChange={(e) => setUserIdea(e.target.value)}
            placeholder="Beschreibe deine Idee oder füge einen Beispiel-Prompt ein..."
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
              fontFamily: 'inherit'
            }}
          />

          {/* Einstellungen */}
          <div style={{
            marginTop: '20px',
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr',
            gap: '15px'
          }}>
            {/* Anzahl Prompts */}
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
                <option value={4}>4 Prompts</option>
                <option value={6}>6 Prompts</option>
                <option value={8}>8 Prompts</option>
                <option value={10}>10 Prompts</option>
              </select>
            </div>

            {/* Fotografie Stil */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: 'hsl(var(--foreground))'
              }}>
                Fotografie-Stil
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
                  fontSize: '14px'
                }}
              >
                <option value="flexible">Flexibel</option>
                <option value="fashion-editorial">Fashion/Editorial (Vogue)</option>
                <option value="natural-light">Natürliches Tageslicht</option>
                <option value="studio-professional">Studio Professional</option>
                <option value="cinematic">Cinematic/Dramatisch</option>
                <option value="clean-beauty">Clean Beauty/Kommerziell</option>
                <option value="instagram-casual">Instagram Casual</option>
              </select>
            </div>

            {/* Konsistenz Modus */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: 'hsl(var(--foreground))'
              }}>
                Konsistenz
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
                  fontSize: '14px'
                }}
              >
                <option value="same-shooting">Gleiches Shooting (nur Pose/Winkel)</option>
                <option value="same-person">Gleiche Person (Location variiert)</option>
                <option value="flexible">Komplett flexibel</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleGeneratePrompts}
            disabled={isLoading || !userIdea.trim()}
            style={{
              width: '100%',
              marginTop: '20px',
              padding: '15px',
              background: isLoading ? '#6b7280' : 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: isLoading || !userIdea.trim() ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            {isLoading ? '🤖 Grok arbeitet...' : '✨ Prompts generieren'}
          </button>
        </div>


        {/* Error Display */}
        {error && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '12px',
            padding: '15px',
            marginBottom: '20px',
            color: '#dc2626'
          }}>
            <strong>Fehler:</strong> {error}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: 'hsl(var(--muted-foreground))'
          }}>
            <div style={{
              fontSize: '24px',
              marginBottom: '10px'
            }}>
              🤖
            </div>
            <p>Grok erstellt deine Prompts...</p>
          </div>
        )}

        {/* Generated Prompts */}
        {generatedPrompts.length > 0 && (
          <div style={{
            background: 'hsl(var(--card))',
            borderRadius: '20px',
            padding: '30px',
            border: '1px solid hsl(var(--border))'
          }}>
            <h3 style={{
              margin: '0 0 20px 0',
              fontSize: '18px',
              fontWeight: '600',
              color: 'hsl(var(--foreground))'
            }}>
              ✨ Generierte Prompts
            </h3>

            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '15px' 
            }}>
              {generatedPrompts.map((prompt, index) => (
                <div
                  key={index}
                  style={{
                    background: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    padding: '15px'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '10px'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '12px',
                        color: 'hsl(var(--muted-foreground))',
                        marginBottom: '5px'
                      }}>
                        Prompt {index + 1}
                      </div>
                      <div style={{
                        fontSize: '14px',
                        color: 'hsl(var(--foreground))',
                        lineHeight: '1.4'
                      }}>
                        {prompt}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(prompt)
                        // Hier könntest du auch ein Toast zeigen
                      }}
                      style={{
                        background: 'none',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        padding: '5px 10px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        color: 'hsl(var(--muted-foreground))'
                      }}
                    >
                      📋
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '10px',
              marginTop: '20px',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={goToMultiPrompts}
                style={{
                  flex: 1,
                  minWidth: '200px',
                  padding: '12px 20px',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  textAlign: 'center',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                ⚡ Multi-Prompts verwenden
              </button>
              <button
                onClick={() => {
                  const allPrompts = generatedPrompts.join('\n\n')
                  navigator.clipboard.writeText(allPrompts)
                }}
                style={{
                  padding: '12px 20px',
                  background: 'none',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  color: 'hsl(var(--foreground))',
                  cursor: 'pointer'
                }}
              >
                📋 Alle kopieren
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PromptCreatorPage