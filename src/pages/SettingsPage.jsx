import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { createClient } from '@supabase/supabase-js'

// Server client for user data operations (bypasses RLS)
const supabase = createClient(
  'https://qoxznbwvyomyyijokkgk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFveHpuYnd2eW9teXlpam9ra2drIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mzg5MDMyNSwiZXhwIjoyMDc5NDY2MzI1fQ.G_9gc7Yp-GHyvWKvhAb1t6rAo_BpJ7DZFJymOVDKm2Q',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export default function SettingsPage() {
  const [userData, setUserData] = useState({
    username: '',
    email: '',
    gemini_api_key: '',
    main_face_image_url: '',
    face_2_image_url: '',
    face_2_name: '',
    face_3_image_url: '',
    face_3_name: '',
    hair_color: '',
    eye_color: '',
    skin_tone: '',
    age_range: '',
    default_resolution: '',
    default_aspect_ratio: ''
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isAutoSaving, setIsAutoSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState(null)
  const [message, setMessage] = useState(null)
  const [uploadingSection, setUploadingSection] = useState(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [canNavigateAway, setCanNavigateAway] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false) // Toggle für API Key Sichtbarkeit
  const autoSaveTimeoutRef = useRef(null)

  const { user, isAuthenticated, logout, isLoading: authLoading } = useAuth()
  const navigate = useNavigate()

  // Check if user can navigate away (has API key)
  useEffect(() => {
    // Safely check for API key only when userData is loaded
    if (userData && typeof userData.gemini_api_key === 'string') {
      const hasApiKey = userData.gemini_api_key.trim().length > 0
      setCanNavigateAway(hasApiKey)
    } else {
      setCanNavigateAway(false)
    }
  }, [userData?.gemini_api_key])

  // Prevent navigation without API key
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!canNavigateAway && hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = 'Du hast noch nicht alle erforderlichen Einstellungen gespeichert. Möchtest du wirklich die Seite verlassen?'
        return e.returnValue
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [canNavigateAway, hasUnsavedChanges])

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    // Only load data if we have a valid user and userData hasn't been loaded yet
    if (user?.id && (!userData || !userData.username)) {
      loadUserData()
    }
  }, [isAuthenticated, navigate, user?.id])

  // Cleanup auto-save timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [])

  const loadUserData = async () => {
    if (!user?.id) return

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error

      if (data) {
        setUserData({
          username: data.username || '',
          email: data.email || '',
          gemini_api_key: data.gemini_api_key || '',
          main_face_image_url: data.main_face_image_url || '',
          face_2_image_url: data.face_2_image_url || '',
          face_2_name: data.face_2_name || '',
          face_3_image_url: data.face_3_image_url || '',
          face_3_name: data.face_3_name || '',
          hair_color: data.hair_color || '',
          eye_color: data.eye_color || '',
          skin_tone: data.skin_tone || '',
          age_range: data.age_range || '',
          default_resolution: data.default_resolution || '',
          default_aspect_ratio: data.default_aspect_ratio || ''
        })
      }
    } catch (error) {
      console.error('Error loading user data:', error)
      setMessage({ type: 'error', text: 'Fehler beim Laden der Daten' })
    } finally {
      setIsLoading(false)
    }
  }

  // Debounced auto-save function
  const autoSaveSettings = useCallback(async (dataToSave) => {
    if (!user?.id) return

    setIsAutoSaving(true)
    try {
      const { error } = await supabase
        .from('users')
        .update({
          ...dataToSave,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error

      setLastSaved(new Date())
      setHasUnsavedChanges(false)
      setMessage({ type: 'success', text: 'Automatisch gespeichert ✓', isAutoSave: true })
      
      // Clear auto-save message after 3 seconds
      setTimeout(() => {
        setMessage(null)
      }, 3000)

    } catch (error) {
      console.error('Auto-save failed:', error)
      setMessage({ type: 'error', text: 'Auto-Speichern fehlgeschlagen', isAutoSave: true })
    } finally {
      setIsAutoSaving(false)
    }
  }, [user?.id])

  const handleInputChange = (field, value) => {
    setUserData(prev => {
      // Safety check: only proceed if prev is valid
      if (!prev || typeof prev !== 'object') {
        console.warn('handleInputChange called with invalid userData state')
        return prev
      }
      
      const updatedData = { ...prev, [field]: value }
      
      // Clear any existing auto-save timeout
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }

      // Only set auto-save timeout if user is authenticated and data is valid
      if (user?.id && updatedData) {
        autoSaveTimeoutRef.current = setTimeout(() => {
          autoSaveSettings({
            email: updatedData.email || '',
            gemini_api_key: updatedData.gemini_api_key || '',
            main_face_image_url: updatedData.main_face_image_url || '',
            face_2_image_url: updatedData.face_2_image_url || '',
            face_2_name: updatedData.face_2_name || '',
            face_3_image_url: updatedData.face_3_image_url || '',
            face_3_name: updatedData.face_3_name || '',
            hair_color: updatedData.hair_color || '',
            eye_color: updatedData.eye_color || '',
            skin_tone: updatedData.skin_tone || '',
            age_range: updatedData.age_range || '',
            default_resolution: updatedData.default_resolution || '',
            default_aspect_ratio: updatedData.default_aspect_ratio || ''
          })
        }, 1500) // 1.5 second debounce
      }
      
      return updatedData
    })
    setHasUnsavedChanges(true)
  }

  const handleFileUpload = async (file, section) => {
    if (!file || !user?.id) return

    setUploadingSection(section)

    try {
      const fileName = `${user.id}_${section}_${Date.now()}_${file.name}`
      const filePath = `${user.id}/${fileName}`

      const { data, error } = await supabase.storage
        .from('face-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('face-images')
        .getPublicUrl(filePath)

      setUserData(prev => {
        // Safety check: ensure prev is valid before updating
        if (!prev || typeof prev !== 'object') {
          console.error('Invalid userData state during file upload')
          return prev
        }
        
        const updatedData = { ...prev, [`${section}_image_url`]: publicUrl }
        
        // Trigger immediate auto-save for image uploads
        autoSaveSettings({
          email: updatedData.email || '',
          gemini_api_key: updatedData.gemini_api_key || '',
          main_face_image_url: updatedData.main_face_image_url || '',
          face_2_image_url: updatedData.face_2_image_url || '',
          face_2_name: updatedData.face_2_name || '',
          face_3_image_url: updatedData.face_3_image_url || '',
          face_3_name: updatedData.face_3_name || '',
          hair_color: updatedData.hair_color || '',
          eye_color: updatedData.eye_color || '',
          skin_tone: updatedData.skin_tone || '',
          age_range: updatedData.age_range || '',
          default_resolution: updatedData.default_resolution || '',
          default_aspect_ratio: updatedData.default_aspect_ratio || ''
        })
        
        return updatedData
      })
      setMessage({ type: 'success', text: 'Bild erfolgreich hochgeladen!' })

    } catch (error) {
      console.error('Upload failed:', error)
      setMessage({ type: 'error', text: 'Upload fehlgeschlagen' })
    } finally {
      setUploadingSection(null)
    }
  }

  const saveSettings = async () => {
    setIsSaving(true)
    setMessage(null)

    try {
      const { error } = await supabase
        .from('users')
        .update({
          email: userData.email,
          gemini_api_key: userData.gemini_api_key,
          main_face_image_url: userData.main_face_image_url,
          face_2_image_url: userData.face_2_image_url,
          face_2_name: userData.face_2_name,
          face_3_image_url: userData.face_3_image_url,
          face_3_name: userData.face_3_name,
          hair_color: userData.hair_color,
          eye_color: userData.eye_color,
          skin_tone: userData.skin_tone,
          age_range: userData.age_range,
          default_resolution: userData.default_resolution,
          default_aspect_ratio: userData.default_aspect_ratio,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error

      setMessage({ type: 'success', text: 'Einstellungen erfolgreich gespeichert!' })
    } catch (error) {
      console.error('Save failed:', error)
      setMessage({ type: 'error', text: 'Fehler beim Speichern' })
    } finally {
      setIsSaving(false)
    }
  }

  // Show loading state if auth is loading or data is loading
  if (authLoading || isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'hsl(var(--background))',
        color: 'hsl(var(--foreground))'
      }}>
        <div style={{
          background: 'hsl(var(--card))',
          padding: '30px',
          borderRadius: '20px',
          border: '1px solid hsl(var(--border))',
          display: 'flex',
          alignItems: 'center',
          gap: '15px',
          boxShadow: '0 10px 30px hsl(var(--background) / 0.3)'
        }}>
          <div style={{
            width: '24px',
            height: '24px',
            border: '2px solid hsl(var(--primary))',
            borderTop: '2px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <div style={{ fontSize: '18px', fontWeight: '500' }}>
            {authLoading ? 'Lade Authentifizierung...' : 'Lade Einstellungen...'}
          </div>
        </div>
      </div>
    )
  }

  // Additional safety check: Don't render if userData is not yet initialized
  if (!userData || typeof userData !== 'object') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'hsl(var(--background))',
        color: 'hsl(var(--foreground))'
      }}>
        <div style={{
          background: 'hsl(var(--card))',
          padding: '30px',
          borderRadius: '20px',
          border: '1px solid hsl(var(--border))',
          display: 'flex',
          alignItems: 'center',
          gap: '15px',
          boxShadow: '0 10px 30px hsl(var(--background) / 0.3)'
        }}>
          <div style={{
            width: '24px',
            height: '24px',
            border: '2px solid hsl(var(--primary))',
            borderTop: '2px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <div style={{ fontSize: '18px', fontWeight: '500' }}>Initialisiere Daten...</div>
        </div>
      </div>
    )
  }

  return (
    <>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .settings-section {
          animation: slideUp 0.6s ease-out;
        }
        .settings-section:nth-child(1) { animation-delay: 0.1s; }
        .settings-section:nth-child(2) { animation-delay: 0.2s; }
        .settings-section:nth-child(3) { animation-delay: 0.3s; }
        .settings-section:nth-child(4) { animation-delay: 0.4s; }
        .settings-section:nth-child(5) { animation-delay: 0.5s; }
        .settings-section:nth-child(6) { animation-delay: 0.6s; }
      `}</style>
      <div style={{
        minHeight: '100vh',
        background: 'hsl(var(--background))',
        color: 'hsl(var(--foreground))',
        padding: '20px'
      }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        paddingTop: '20px'
      }}>
        
        {/* Header */}
        <div className="settings-section" style={{
          background: 'hsl(var(--card))',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          padding: '30px',
          marginBottom: '30px',
          boxShadow: '0 10px 30px hsl(var(--background) / 0.3)',
          border: '1px solid hsl(var(--border))',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',  // Mobile-optimiert: flex-start für bessere Alignment
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          {/* Title Row with Back Button */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            marginBottom: '8px'
          }}>
            <h1 style={{
              margin: '0',
              fontSize: window.innerWidth <= 768 ? '28px' : '36px', // Mobile: 28px, Desktop: 36px
              fontWeight: '700',
              color: 'hsl(47 100% 65%)',
              background: 'linear-gradient(135deg, hsl(47 100% 65%), hsl(280 70% 60%))',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontFamily: "'Space Grotesk', sans-serif"
            }}>
              Einstellungen
            </h1>
            <Link 
              to="/dashboard"
              style={{
                background: 'hsl(var(--secondary) / 0.3)',
                border: '1px solid hsl(var(--border))',
                borderRadius: '12px',
                padding: window.innerWidth <= 768 ? '12px 15px' : '12px 18px',
                color: 'hsl(var(--foreground))',
                textDecoration: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s',
                minWidth: window.innerWidth <= 768 ? '100px' : 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ← Zurück
            </Link>
          </div>
          
          {/* Subtitle Row */}
          <p style={{
            margin: '0',
            color: 'hsl(var(--muted-foreground))',
            fontSize: '16px',
            fontWeight: '400'
          }}>
            Verwalte dein Profil und deine AI-Einstellungen
          </p>
        </div>


        {/* Message */}
        {message && (
          <div className="settings-section" style={{
            background: message.type === 'error' ? 
              'hsl(var(--destructive) / 0.1)' : 
              'hsl(10 100% 95%)',
            border: `1px solid ${message.type === 'error' ? 'hsl(var(--destructive) / 0.3)' : '#10b981'}`,
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '30px',
            color: message.type === 'error' ? 'hsl(var(--destructive))' : '#059669',
            fontSize: '14px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: message.type === 'error' ?
              '0 4px 12px hsl(var(--destructive) / 0.1)' :
              '0 4px 12px rgba(16, 185, 129, 0.1)'
          }}>
            {message.isAutoSave && (
              <span style={{ fontSize: '16px', opacity: 0.8 }}>🤖</span>
            )}
            {message.text}
          </div>
        )}

        {/* Konto Bereich */}
        <div className="settings-section" style={{
          background: 'hsl(var(--card))',
          borderRadius: '20px',
          padding: '30px',
          marginBottom: '30px',
          boxShadow: '0 10px 30px hsl(var(--background) / 0.3)',
          border: '1px solid hsl(var(--border))'
        }}>
          <h2 style={{
            margin: '0 0 25px 0',
            fontSize: '24px',
            fontWeight: '700',
            color: 'hsl(47 100% 65%)',
            background: 'linear-gradient(135deg, hsl(47 100% 65%), hsl(280 70% 60%))',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontFamily: "'Space Grotesk', sans-serif"
          }}>
            🔐 Konto
          </h2>
          
          <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
            <div>
              <label style={{
                display: 'block',
                marginBottom: '10px',
                fontSize: '14px',
                fontWeight: '600',
                color: 'hsl(var(--foreground))',
                letterSpacing: '0.5px'
              }}>
                Username
              </label>
              <input
                type="text"
                value={userData?.username || ''}
                disabled
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  fontSize: '14px',
                  backgroundColor: 'hsl(var(--muted) / 0.5)',
                  color: 'hsl(var(--muted-foreground))',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  transition: 'all 0.3s ease'
                }}
              />
            </div>
            
            <div>
              <label style={{
                display: 'block',
                marginBottom: '10px',
                fontSize: '14px',
                fontWeight: '600',
                color: 'hsl(var(--foreground))',
                letterSpacing: '0.5px'
              }}>
                E-Mail <span style={{ fontSize: '12px', color: 'hsl(var(--muted-foreground))', fontWeight: 'normal' }}>(optional)</span>
              </label>
              <input
                type="email"
                value={userData?.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  fontSize: '14px',
                  backgroundColor: 'hsl(var(--background))',
                  color: 'hsl(var(--foreground))',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  transition: 'all 0.3s ease',
                  outline: 'none'
                }}
                placeholder="deine@email.de"
                onFocus={(e) => {
                  e.target.style.borderColor = 'hsl(var(--primary))'
                  e.target.style.boxShadow = '0 0 0 3px hsl(var(--primary) / 0.1)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'hsl(var(--border))'
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>
            
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{
                display: 'block',
                marginBottom: '10px',
                fontSize: '14px',
                fontWeight: '600',
                color: 'hsl(var(--foreground))',
                letterSpacing: '0.5px'
              }}>
                Gemini API Key 
                <span style={{ color: 'hsl(var(--destructive))', fontWeight: 'bold' }}>*</span>
                <span style={{ fontSize: '12px', color: 'hsl(var(--muted-foreground))', fontWeight: 'normal' }}> (erforderlich für App-Navigation)</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={userData?.gemini_api_key || ''}
                  onChange={(e) => handleInputChange('gemini_api_key', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '14px 50px 14px 16px', // Extra padding rechts für Button
                    border: !canNavigateAway ? '2px solid hsl(var(--destructive))' : '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    backgroundColor: !canNavigateAway ? 'hsl(var(--destructive) / 0.05)' : 'hsl(var(--background))',
                    color: 'hsl(var(--foreground))',
                    fontFamily: 'inherit',
                    transition: 'all 0.3s ease',
                    outline: 'none'
                  }}
                  placeholder="AIza... (API Key erforderlich)"
                  onFocus={(e) => {
                    if (canNavigateAway) {
                      e.target.style.borderColor = 'hsl(var(--primary))'
                      e.target.style.boxShadow = '0 0 0 3px hsl(var(--primary) / 0.1)'
                    }
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = !canNavigateAway ? 'hsl(var(--destructive))' : 'hsl(var(--border))'
                    e.target.style.boxShadow = 'none'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '16px',
                    color: 'hsl(var(--muted-foreground))',
                    padding: '4px',
                    borderRadius: '4px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.color = 'hsl(var(--foreground))'
                    e.target.style.background = 'hsl(var(--muted) / 0.3)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.color = 'hsl(var(--muted-foreground))'
                    e.target.style.background = 'none'
                  }}
                >
                  {showApiKey ? '🙈' : '👁️'}
                </button>
              </div>
              {!canNavigateAway && (!userData?.gemini_api_key || userData.gemini_api_key.length === 0) && (
                <div style={{
                  color: 'hsl(var(--destructive))',
                  fontSize: '12px',
                  marginTop: '8px',
                  padding: '8px 12px',
                  backgroundColor: 'hsl(var(--destructive) / 0.1)',
                  borderRadius: '8px',
                  border: '1px solid hsl(var(--destructive) / 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: '500'
                }}>
                  ⚠️ Du musst einen API Key eingeben, um die App verwenden zu können
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Gesichts Management */}
        <div className="settings-section" style={{
          background: 'hsl(var(--card))',
          borderRadius: '20px',
          padding: '30px',
          marginBottom: '30px',
          boxShadow: '0 10px 30px hsl(var(--background) / 0.3)',
          border: '1px solid hsl(var(--border))'
        }}>
          <h2 style={{
            margin: '0 0 25px 0',
            fontSize: '24px',
            fontWeight: '700',
            color: 'hsl(47 100% 65%)',
            background: 'linear-gradient(135deg, hsl(47 100% 65%), hsl(280 70% 60%))',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontFamily: "'Space Grotesk', sans-serif"
          }}>
            🖼️ Gesichts-Verwaltung
          </h2>
          
          <div style={{ display: 'grid', gap: '20px' }}>
            {/* Hauptgesicht */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '12px',
                fontSize: '14px',
                fontWeight: '600',
                color: 'hsl(var(--foreground))',
                letterSpacing: '0.5px'
              }}>
                Hauptgesicht
              </label>
              {userData?.main_face_image_url ? (
                <div style={{
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  padding: '16px',
                  backgroundColor: 'hsl(var(--card))',
                  boxShadow: '0 4px 12px hsl(var(--background) / 0.2)',
                  textAlign: 'center'
                }}>
                  <img src={userData?.main_face_image_url} alt="Hauptgesicht" style={{
                    width: '80px',
                    height: '80px',
                    objectFit: 'cover',
                    borderRadius: '12px',
                    marginBottom: '12px',
                    border: '2px solid hsl(var(--border))'
                  }} />
                  <button
                    onClick={() => document.getElementById('main_face').click()}
                    disabled={uploadingSection === 'main_face'}
                    style={{
                      width: '100%',
                      padding: '10px 16px',
                      background: 'linear-gradient(135deg, hsl(47 100% 65%), hsl(280 70% 60%))',
                      color: 'hsl(var(--primary-foreground))',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (uploadingSection !== 'main_face') {
                        e.target.style.transform = 'scale(1.02)'
                        e.target.style.boxShadow = '0 4px 12px hsl(var(--primary) / 0.3)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (uploadingSection !== 'main_face') {
                        e.target.style.transform = 'scale(1)'
                        e.target.style.boxShadow = 'none'
                      }
                    }}
                  >
                    {uploadingSection === 'main_face' ? 'Lädt...' : 'Ersetzen'}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => document.getElementById('main_face').click()}
                  disabled={uploadingSection === 'main_face'}
                  style={{
                    width: '100%',
                    padding: '50px 16px',
                    border: '2px dashed hsl(var(--border))',
                    borderRadius: '12px',
                    backgroundColor: 'hsl(var(--muted) / 0.2)',
                    cursor: 'pointer',
                    textAlign: 'center',
                    color: 'hsl(var(--muted-foreground))',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (uploadingSection !== 'main_face') {
                      e.target.style.borderColor = 'hsl(var(--primary))'
                      e.target.style.backgroundColor = 'hsl(var(--primary) / 0.05)'
                      e.target.style.color = 'hsl(var(--primary))'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (uploadingSection !== 'main_face') {
                      e.target.style.borderColor = 'hsl(var(--border))'
                      e.target.style.backgroundColor = 'hsl(var(--muted) / 0.2)'
                      e.target.style.color = 'hsl(var(--muted-foreground))'
                    }
                  }}
                >
                  {uploadingSection === 'main_face' ? '⏳ Lädt...' : '📷 Hauptgesicht hochladen'}
                </button>
              )}
              <input
                id="main_face"
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0], 'main_face')}
              />
            </div>

            
            {/* Erklärung für beide Zusatzbilder */}
            {/* Zusätzliche Bilder Titel */}
            <h3 style={{
              margin: '0 0 4px 0',
              fontSize: '24px',
              fontWeight: '700',
              color: 'hsl(47 100% 65%)',
              background: 'linear-gradient(135deg, hsl(47 100% 65%), hsl(280 70% 60%))',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontFamily: "'Space Grotesk', sans-serif"
            }}>
              Zusätzliche Bilder
            </h3>
            
            <div style={{
              marginBottom: '6px',
              padding: '6px 10px',
              backgroundColor: 'hsl(var(--secondary) / 0.1)',
              borderRadius: '8px',
              fontSize: '12px',
              color: 'hsl(var(--secondary))',
              border: '1px solid hsl(var(--secondary) / 0.3)',
              fontWeight: '500'
            }}>
              💡 Diese Bilder werden beim Generieren als Alternativen zur Auswahl verfügbar sein
            </div>
            
            {/* Zusätzliche Gesichtsbilder - 50%/50% Layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              {/* Zusätzliches Gesichtsbild 1 */}
              <div>
              
              
              {/* Kategorie Dropdown */}
              <select
                value={userData?.face_2_name || ''}
                onChange={(e) => {
                  const newValue = e.target.value
                  handleInputChange('face_2_name', newValue)
                  
                  // Sofort speichern wenn Kategorie gewählt wird
                  if (newValue && userData?.face_2_image_url) {
                    setMessage({ type: 'success', text: 'Kategorie gespeichert!' })
                  }
                }}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  border: (userData?.face_2_image_url && !userData?.face_2_name)
                    ? '2px solid hsl(var(--destructive))' 
                    : '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '13px',
                  marginBottom: '12px',
                  boxSizing: 'border-box',
                  backgroundColor: (userData?.face_2_image_url && !userData?.face_2_name)
                    ? 'hsl(var(--destructive) / 0.05)' 
                    : 'hsl(var(--background))',
                  color: 'hsl(var(--foreground))',
                  fontFamily: 'inherit',
                  fontWeight: '500',
                  transition: 'all 0.3s ease',
                  outline: 'none'
                }}
                required={!!userData?.face_2_image_url}
              >
                <option value="">
                  {userData?.face_2_image_url 
                    ? "⚠️ Kategorie wählen (Pflicht)" 
                    : "Bildkategorie wählen..."
                  }
                </option>
                <option value="Testbild">Testbild</option>
                <option value="College Partner">College Partner</option>
                <option value="Hintergrund">Hintergrund</option>
                <option value="Location">Location</option>
                <option value="Outfit">Outfit</option>
                <option value="Pose">Pose</option>
                <option value="Sonstiges">Sonstiges</option>
              </select>
              
              {/* Warnung bei fehlendem Namen */}
              {userData?.face_2_image_url && !userData?.face_2_name && (
                <div style={{
                  marginBottom: '12px',
                  padding: '10px 12px',
                  backgroundColor: 'hsl(var(--destructive) / 0.1)',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: 'hsl(var(--destructive))',
                  border: '1px solid hsl(var(--destructive) / 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: '500'
                }}>
                  <span>⚠️</span>
                  <strong>Kategorie ist Pflicht!</strong> Wähle eine Kategorie für dein hochgeladenes Bild.
                </div>
              )}
              {userData?.face_2_image_url ? (
                <div style={{
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  padding: '16px',
                  backgroundColor: 'hsl(var(--card))',
                  boxShadow: '0 4px 12px hsl(var(--background) / 0.2)',
                  textAlign: 'center'
                }}>
                  <img src={userData?.face_2_image_url} alt="Schnellauswahl 1" style={{
                    width: '80px',
                    height: '80px',
                    objectFit: 'cover',
                    borderRadius: '12px',
                    marginBottom: '12px',
                    border: '2px solid hsl(var(--border))'
                  }} />
                  <button
                    onClick={() => document.getElementById('face_2').click()}
                    disabled={uploadingSection === 'face_2'}
                    style={{
                      width: '100%',
                      padding: '10px 16px',
                      background: 'hsl(47 100% 65%)',
                      color: 'hsl(var(--primary-foreground))',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (uploadingSection !== 'face_2') {
                        e.target.style.transform = 'scale(1.02)'
                        e.target.style.boxShadow = '0 4px 12px hsl(var(--primary) / 0.3)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (uploadingSection !== 'face_2') {
                        e.target.style.transform = 'scale(1)'
                        e.target.style.boxShadow = 'none'
                      }
                    }}
                  >
                    {uploadingSection === 'face_2' ? 'Lädt...' : 'Ersetzen'}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => document.getElementById('face_2').click()}
                  disabled={uploadingSection === 'face_2'}
                  style={{
                    width: '100%',
                    padding: '40px 16px',
                    border: '2px dashed hsl(47 100% 65%)',
                    borderRadius: '12px',
                    backgroundColor: 'hsl(47 100% 65% / 0.1)',
                    cursor: 'pointer',
                    textAlign: 'center',
                    color: 'hsl(47 100% 65%)',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (uploadingSection !== 'face_2') {
                      e.target.style.borderColor = 'hsl(47 100% 65%)'
                      e.target.style.backgroundColor = 'hsl(47 100% 65% / 0.2)'
                      e.target.style.color = 'hsl(47 100% 65%)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (uploadingSection !== 'face_2') {
                      e.target.style.borderColor = 'hsl(47 100% 65%)'
                      e.target.style.backgroundColor = 'hsl(47 100% 65% / 0.1)'
                      e.target.style.color = 'hsl(47 100% 65%)'
                    }
                  }}
                >
                  {uploadingSection === 'face_2' ? '⏳ Lädt...' : '📷 Bild hochladen'}
                </button>
              )}
              <input
                id="face_2"
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0], 'face_2')}
              />
            </div>

            {/* Zusätzliches Gesichtsbild 2 */}
            <div>
              
              
              {/* Kategorie Dropdown */}
              <select
                value={userData?.face_3_name || ''}
                onChange={(e) => {
                  const newValue = e.target.value
                  handleInputChange('face_3_name', newValue)
                  
                  // Sofort speichern wenn Kategorie gewählt wird
                  if (newValue && userData?.face_3_image_url) {
                    setMessage({ type: 'success', text: 'Kategorie gespeichert!' })
                  }
                }}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  border: (userData?.face_3_image_url && !userData?.face_3_name)
                    ? '2px solid hsl(var(--destructive))' 
                    : '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '13px',
                  marginBottom: '12px',
                  boxSizing: 'border-box',
                  backgroundColor: (userData?.face_3_image_url && !userData?.face_3_name)
                    ? 'hsl(var(--destructive) / 0.05)' 
                    : 'hsl(var(--background))',
                  color: 'hsl(var(--foreground))',
                  fontFamily: 'inherit',
                  fontWeight: '500',
                  transition: 'all 0.3s ease',
                  outline: 'none'
                }}
                required={!!userData?.face_3_image_url}
              >
                <option value="">
                  {userData?.face_3_image_url 
                    ? "⚠️ Kategorie wählen (Pflicht)" 
                    : "Bildkategorie wählen..."
                  }
                </option>
                <option value="Testbild">Testbild</option>
                <option value="College Partner">College Partner</option>
                <option value="Hintergrund">Hintergrund</option>
                <option value="Location">Location</option>
                <option value="Outfit">Outfit</option>
                <option value="Pose">Pose</option>
                <option value="Sonstiges">Sonstiges</option>
              </select>
              
              {/* Warnung bei fehlendem Namen */}
              {userData?.face_3_image_url && !userData?.face_3_name && (
                <div style={{
                  marginBottom: '12px',
                  padding: '10px 12px',
                  backgroundColor: 'hsl(var(--destructive) / 0.1)',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: 'hsl(var(--destructive))',
                  border: '1px solid hsl(var(--destructive) / 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: '500'
                }}>
                  <span>⚠️</span>
                  <strong>Kategorie ist Pflicht!</strong> Wähle eine Kategorie für dein hochgeladenes Bild.
                </div>
              )}
              {userData?.face_3_image_url ? (
                <div style={{
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  padding: '16px',
                  backgroundColor: 'hsl(var(--card))',
                  boxShadow: '0 4px 12px hsl(var(--background) / 0.2)',
                  textAlign: 'center'
                }}>
                  <img src={userData?.face_3_image_url} alt="Schnellauswahl 2" style={{
                    width: '80px',
                    height: '80px',
                    objectFit: 'cover',
                    borderRadius: '12px',
                    marginBottom: '12px',
                    border: '2px solid hsl(var(--border))'
                  }} />
                  <button
                    onClick={() => document.getElementById('face_3').click()}
                    disabled={uploadingSection === 'face_3'}
                    style={{
                      width: '100%',
                      padding: '10px 16px',
                      background: 'hsl(280 70% 60%)',
                      color: 'hsl(var(--primary-foreground))',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (uploadingSection !== 'face_3') {
                        e.target.style.transform = 'scale(1.02)'
                        e.target.style.boxShadow = '0 4px 12px hsl(var(--primary) / 0.3)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (uploadingSection !== 'face_3') {
                        e.target.style.transform = 'scale(1)'
                        e.target.style.boxShadow = 'none'
                      }
                    }}
                  >
                    {uploadingSection === 'face_3' ? 'Lädt...' : 'Ersetzen'}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => document.getElementById('face_3').click()}
                  disabled={uploadingSection === 'face_3'}
                  style={{
                    width: '100%',
                    padding: '40px 16px',
                    border: '2px dashed hsl(280 70% 60%)',
                    borderRadius: '12px',
                    backgroundColor: 'hsl(280 70% 60% / 0.1)',
                    cursor: 'pointer',
                    textAlign: 'center',
                    color: 'hsl(280 70% 60%)',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (uploadingSection !== 'face_3') {
                      e.target.style.borderColor = 'hsl(280 70% 60%)'
                      e.target.style.backgroundColor = 'hsl(280 70% 60% / 0.2)'
                      e.target.style.color = 'hsl(280 70% 60%)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (uploadingSection !== 'face_3') {
                      e.target.style.borderColor = 'hsl(280 70% 60%)'
                      e.target.style.backgroundColor = 'hsl(280 70% 60% / 0.1)'
                      e.target.style.color = 'hsl(280 70% 60%)'
                    }
                  }}
                >
                  {uploadingSection === 'face_3' ? '⏳ Lädt...' : '📷 Bild hochladen'}
                </button>
              )}
              <input
                id="face_3"
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0], 'face_3')}
              />
              </div>
            </div>
          </div>
        </div>

        {/* Physische Eigenschaften */}
        <div className="settings-section" style={{
          background: 'hsl(var(--card))',
          borderRadius: '20px',
          padding: '30px',
          marginBottom: '30px',
          boxShadow: '0 10px 30px hsl(var(--background) / 0.3)',
          border: '1px solid hsl(var(--border))'
        }}>
          <h2 style={{
            margin: '0 0 25px 0',
            fontSize: '24px',
            fontWeight: '700',
            color: 'hsl(47 100% 65%)',
            background: 'linear-gradient(135deg, hsl(47 100% 65%), hsl(280 70% 60%))',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontFamily: "'Space Grotesk', sans-serif"
          }}>
            Physische Eigenschaften <span style={{ fontSize: '16px', color: 'hsl(var(--muted-foreground))', fontWeight: 'normal' }}>(für AI-Prompts)</span>
          </h2>
          
          <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <div>
              <label style={{
                display: 'block',
                marginBottom: '10px',
                fontSize: '14px',
                fontWeight: '600',
                color: 'hsl(var(--foreground))',
                letterSpacing: '0.5px'
              }}>
                Haarfarbe
              </label>
              <select
                value={userData?.hair_color || ''}
                onChange={(e) => handleInputChange('hair_color', e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  fontSize: '14px',
                  backgroundColor: userData?.hair_color ? 'hsl(47 100% 65%)' : 'hsl(var(--background))', // Gelb nur wenn ausgewählt
                  color: 'hsl(var(--foreground))',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  fontWeight: '500',
                  transition: 'all 0.3s ease',
                  outline: 'none'
                }}
              >
                {!userData?.hair_color && <option value="">Wählen...</option>}
                <option value="black">Schwarz</option>
                <option value="darkbrown">Dunkelbraun</option>
                <option value="brunette">Brunette</option>
                <option value="blonde">Blond</option>
                <option value="red">Rot</option>
              </select>
            </div>
            
            <div>
              <label style={{
                display: 'block',
                marginBottom: '10px',
                fontSize: '14px',
                fontWeight: '600',
                color: 'hsl(var(--foreground))',
                letterSpacing: '0.5px'
              }}>
                Augenfarbe
              </label>
              <select
                value={userData?.eye_color || ''}
                onChange={(e) => handleInputChange('eye_color', e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  fontSize: '14px',
                  backgroundColor: userData?.eye_color ? 'hsl(280 70% 60%)' : 'hsl(var(--background))', // Lila nur wenn ausgewählt
                  color: 'hsl(var(--foreground))',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  fontWeight: '500',
                  transition: 'all 0.3s ease',
                  outline: 'none'
                }}
              >
                {!userData?.eye_color && <option value="">Wählen...</option>}
                <option value="brown">Braun</option>
                <option value="blue">Blau</option>
                <option value="green">Grün</option>
                <option value="gray">Grau</option>
                <option value="hazel">Haselnuss</option>
              </select>
            </div>
            
            <div>
              <label style={{
                display: 'block',
                marginBottom: '10px',
                fontSize: '14px',
                fontWeight: '600',
                color: 'hsl(var(--foreground))',
                letterSpacing: '0.5px'
              }}>
                Hautton
              </label>
              <select
                value={userData?.skin_tone || ''}
                onChange={(e) => handleInputChange('skin_tone', e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  fontSize: '14px',
                  backgroundColor: userData?.skin_tone ? 'hsl(47 100% 65%)' : 'hsl(var(--background))', // Gelb nur wenn ausgewählt
                  color: 'hsl(var(--foreground))',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  fontWeight: '500',
                  transition: 'all 0.3s ease',
                  outline: 'none'
                }}
              >
                {!userData?.skin_tone && <option value="">Wählen...</option>}
                <option value="european">Europäisch</option>
                <option value="latin">Lateinamerikanisch</option>
                <option value="asian">Asiatisch</option>
                <option value="african">Afrikanisch</option>
                <option value="arabic">Arabisch</option>
              </select>
            </div>
            
            <div>
              <label style={{
                display: 'block',
                marginBottom: '10px',
                fontSize: '14px',
                fontWeight: '600',
                color: 'hsl(var(--foreground))',
                letterSpacing: '0.5px'
              }}>
                Altersbereich
              </label>
              <select
                value={userData?.age_range || ''}
                onChange={(e) => handleInputChange('age_range', e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  fontSize: '14px',
                  backgroundColor: userData?.age_range ? 'hsl(280 70% 60%)' : 'hsl(var(--background))', // Lila nur wenn ausgewählt
                  color: 'hsl(var(--foreground))',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  fontWeight: '500',
                  transition: 'all 0.3s ease',
                  outline: 'none'
                }}
              >
                {!userData?.age_range && <option value="">Wählen...</option>}
                <option value="under-20">unter 20</option>
                <option value="young-adult">23-27</option>
                <option value="adult">28-35</option>
                <option value="over-40">über 40</option>
              </select>
            </div>
          </div>
        </div>

        {/* Generierungs-Einstellungen */}
        <div className="settings-section" style={{
          background: 'hsl(var(--card))',
          borderRadius: '20px',
          padding: '30px',
          marginBottom: '30px',
          boxShadow: '0 10px 30px hsl(var(--background) / 0.3)',
          border: '1px solid hsl(var(--border))'
        }}>
          <h2 style={{
            margin: '0 0 25px 0',
            fontSize: '24px',
            fontWeight: '700',
            color: 'hsl(47 100% 65%)',
            background: 'linear-gradient(135deg, hsl(47 100% 65%), hsl(280 70% 60%))',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontFamily: "'Space Grotesk', sans-serif"
          }}>
            Generierungs-Einstellungen
          </h2>
          
          <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <div>
              <label style={{
                display: 'block',
                marginBottom: '10px',
                fontSize: '14px',
                fontWeight: '600',
                color: 'hsl(var(--foreground))',
                letterSpacing: '0.5px'
              }}>
                Standard Auflösung
              </label>
              <select
                value={userData?.default_resolution || ''}
                onChange={(e) => handleInputChange('default_resolution', e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  fontSize: '14px',
                  backgroundColor: userData?.default_resolution ? 'hsl(47 100% 65%)' : 'hsl(var(--background))', // Gelb (links)
                  color: 'hsl(var(--foreground))',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  fontWeight: '500',
                  transition: 'all 0.3s ease',
                  outline: 'none'
                }}
              >
                <option value="1K">1K</option>
                <option value="2K">2K</option>
                <option value="4K">4K</option>
              </select>
            </div>
            
            <div>
              <label style={{
                display: 'block',
                marginBottom: '10px',
                fontSize: '14px',
                fontWeight: '600',
                color: 'hsl(var(--foreground))',
                letterSpacing: '0.5px'
              }}>
                Standard Seitenverhältnis
              </label>
              <select
                value={userData?.default_aspect_ratio || ''}
                onChange={(e) => handleInputChange('default_aspect_ratio', e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  fontSize: '14px',
                  backgroundColor: userData?.default_aspect_ratio ? 'hsl(280 70% 60%)' : 'hsl(var(--background))', // Lila (rechts)
                  color: 'hsl(var(--foreground))',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  fontWeight: '500',
                  transition: 'all 0.3s ease',
                  outline: 'none'
                }}
              >
                <option value="1:1">1:1 (Quadrat)</option>
                <option value="9:16">9:16 (Hochformat/Story)</option>
                <option value="16:9">16:9 (Querformat/Widescreen)</option>
                <option value="4:3">4:3 (Post)</option>
                <option value="3:4">3:4 (Portrait)</option>
                <option value="2:3">2:3 (Portrait)</option>
                <option value="3:2">3:2 (Landscape)</option>
              </select>
            </div>
          </div>
        </div>

      </div>
    </div>
    </>
  )
}