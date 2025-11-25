import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
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
    default_resolution: '2K',
    default_aspect_ratio: '9:16'
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isAutoSaving, setIsAutoSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState(null)
  const [message, setMessage] = useState(null)
  const [uploadingSection, setUploadingSection] = useState(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [canNavigateAway, setCanNavigateAway] = useState(false)
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
          default_resolution: data.default_resolution || '2K',
          default_aspect_ratio: data.default_aspect_ratio || '9:16'
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
            default_resolution: updatedData.default_resolution || '2K',
            default_aspect_ratio: updatedData.default_aspect_ratio || '9:16'
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
          default_resolution: updatedData.default_resolution || '2K',
          default_aspect_ratio: updatedData.default_aspect_ratio || '9:16'
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
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ color: 'white', fontSize: '18px' }}>
          {authLoading ? 'Lade Authentifizierung...' : 'Lade Einstellungen...'}
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
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ color: 'white', fontSize: '18px' }}>Initialisiere Daten...</div>
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
      `}</style>
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px'
      }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        paddingTop: '20px'
      }}>
        
        {/* Header */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '16px',
          padding: '30px',
          marginBottom: '20px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{ margin: '0 0 5px 0', fontSize: '28px', fontWeight: '600', color: '#333' }}>
              ⚙️ Einstellungen
            </h1>
            <p style={{ margin: '0', color: '#666', fontSize: '16px' }}>
              Verwalte dein Profil und deine AI-Einstellungen
            </p>
          </div>
          <button
            onClick={() => {
              if (!canNavigateAway) {
                setMessage({ type: 'error', text: 'Bitte gib zuerst deinen API Key ein!' })
                return
              }
              navigate('/dashboard')
            }}
            style={{
              padding: '12px 24px',
              background: canNavigateAway ? 
                'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 
                'linear-gradient(135deg, #bbb 0%, #999 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: canNavigateAway ? 'pointer' : 'not-allowed',
              opacity: canNavigateAway ? 1 : 0.7
            }}
          >
            {canNavigateAway ? '← Zurück zum Dashboard' : '🔒 API Key erforderlich'}
          </button>
        </div>

        {/* Auto-save Status */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '12px',
          padding: '15px 20px',
          marginBottom: '20px',
          boxShadow: '0 10px 20px rgba(0,0,0,0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {isAutoSaving ? (
              <>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid #667eea',
                  borderTop: '2px solid transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                <span style={{ color: '#667eea', fontSize: '14px', fontWeight: '500' }}>Speichere automatisch...</span>
              </>
            ) : hasUnsavedChanges ? (
              <>
                <div style={{ width: '8px', height: '8px', backgroundColor: '#ff9800', borderRadius: '50%' }} />
                <span style={{ color: '#ff9800', fontSize: '14px', fontWeight: '500' }}>Ungespeicherte Änderungen</span>
              </>
            ) : lastSaved ? (
              <>
                <div style={{ width: '8px', height: '8px', backgroundColor: '#4caf50', borderRadius: '50%' }} />
                <span style={{ color: '#4caf50', fontSize: '14px', fontWeight: '500' }}>
                  Zuletzt gespeichert: {lastSaved.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </>
            ) : (
              <>
                <div style={{ width: '8px', height: '8px', backgroundColor: '#9e9e9e', borderRadius: '50%' }} />
                <span style={{ color: '#666', fontSize: '14px', fontWeight: '500' }}>Bereit zum Speichern</span>
              </>
            )}
          </div>
          
          {!canNavigateAway && (
            <div style={{
              background: 'linear-gradient(135deg, #ff5722 0%, #ff9800 100%)',
              color: 'white',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '500'
            }}>
              API Key erforderlich!
            </div>
          )}
        </div>

        {/* Message */}
        {message && (
          <div style={{
            background: message.type === 'error' ? '#fee' : '#efe',
            border: `1px solid ${message.type === 'error' ? '#fcc' : '#cfc'}`,
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '20px',
            color: message.type === 'error' ? '#c33' : '#363',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {message.isAutoSave && (
              <span style={{ fontSize: '12px', opacity: 0.8 }}>🤖</span>
            )}
            {message.text}
          </div>
        )}

        {/* Konto Bereich */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '16px',
          padding: '30px',
          marginBottom: '20px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '600', color: '#333' }}>
            🔐 Konto
          </h2>
          
          <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#333' }}>
                Username
              </label>
              <input
                type="text"
                value={userData?.username || ''}
                disabled
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: '#f5f5f5',
                  color: '#888',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#333' }}>
                E-Mail
              </label>
              <input
                type="email"
                value={userData?.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
                placeholder="deine@email.de"
              />
            </div>
            
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#333' }}>
                Gemini API Key 
                <span style={{ color: '#ff5722', fontWeight: 'bold' }}>*</span>
                <span style={{ fontSize: '12px', color: '#666', fontWeight: 'normal' }}> (erforderlich für App-Navigation)</span>
              </label>
              <input
                type="password"
                value={userData?.gemini_api_key || ''}
                onChange={(e) => handleInputChange('gemini_api_key', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: !canNavigateAway ? '2px solid #ff5722' : '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  backgroundColor: !canNavigateAway ? '#fff5f5' : 'white'
                }}
                placeholder="AIza... (API Key erforderlich)"
              />
              {!canNavigateAway && (!userData?.gemini_api_key || userData.gemini_api_key.length === 0) && (
                <div style={{ color: '#ff5722', fontSize: '12px', marginTop: '4px' }}>
                  ⚠️ Du musst einen API Key eingeben, um die App verwenden zu können
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Gesichts Management */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '16px',
          padding: '30px',
          marginBottom: '20px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '600', color: '#333' }}>
            🖼️ Gesichts-Verwaltung
          </h2>
          
          <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
            {/* Hauptgesicht */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#333' }}>
                Hauptgesicht
              </label>
              {userData?.main_face_image_url ? (
                <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '12px', backgroundColor: '#f9f9f9' }}>
                  <img src={userData?.main_face_image_url} alt="Hauptgesicht" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', marginBottom: '8px' }} />
                  <button
                    onClick={() => document.getElementById('main_face').click()}
                    disabled={uploadingSection === 'main_face'}
                    style={{
                      width: '100%',
                      padding: '8px',
                      background: '#667eea',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: 'pointer'
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
                    padding: '40px 12px',
                    border: '2px dashed #ddd',
                    borderRadius: '8px',
                    backgroundColor: '#fafafa',
                    cursor: 'pointer',
                    textAlign: 'center'
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

            {/* Zusätzliches Gesichtsbild 1 */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#333' }}>
                Zusätzliches Bild 1
              </label>
              
              {/* Erklärung */}
              <div style={{
                marginBottom: '10px',
                padding: '8px 10px',
                backgroundColor: '#FEF3E2',
                borderRadius: '6px',
                fontSize: '12px',
                color: '#92400E',
                border: '1px solid #FBBF24'
              }}>
                💡 Dieses Bild wird beim Generieren als Alternative zur Auswahl verfügbar sein
              </div>
              
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
                  padding: '8px',
                  border: (userData?.face_2_image_url && !userData?.face_2_name)
                    ? '2px solid #EF4444' 
                    : '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '12px',
                  marginBottom: '8px',
                  boxSizing: 'border-box',
                  backgroundColor: (userData?.face_2_image_url && !userData?.face_2_name)
                    ? '#FEF2F2' 
                    : 'white'
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
                  marginBottom: '8px',
                  padding: '8px 10px',
                  backgroundColor: '#FEF2F2',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: '#DC2626',
                  border: '1px solid #EF4444',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span>⚠️</span>
                  <strong>Kategorie ist Pflicht!</strong> Wähle eine Kategorie für dein hochgeladenes Bild.
                </div>
              )}
              {userData?.face_2_image_url ? (
                <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '12px', backgroundColor: '#f9f9f9' }}>
                  <img src={userData?.face_2_image_url} alt="Schnellauswahl 1" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', marginBottom: '8px' }} />
                  <button
                    onClick={() => document.getElementById('face_2').click()}
                    disabled={uploadingSection === 'face_2'}
                    style={{
                      width: '100%',
                      padding: '8px',
                      background: '#667eea',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: 'pointer'
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
                    padding: '30px 12px',
                    border: '2px dashed #ddd',
                    borderRadius: '8px',
                    backgroundColor: '#fafafa',
                    cursor: 'pointer',
                    textAlign: 'center'
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
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#333' }}>
                Zusätzliches Bild 2
              </label>
              
              {/* Erklärung */}
              <div style={{
                marginBottom: '10px',
                padding: '8px 10px',
                backgroundColor: '#FEF3E2',
                borderRadius: '6px',
                fontSize: '12px',
                color: '#92400E',
                border: '1px solid #FBBF24'
              }}>
                💡 Dieses Bild wird beim Generieren als Alternative zur Auswahl verfügbar sein
              </div>
              
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
                  padding: '8px',
                  border: (userData?.face_3_image_url && !userData?.face_3_name)
                    ? '2px solid #EF4444' 
                    : '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '12px',
                  marginBottom: '8px',
                  boxSizing: 'border-box',
                  backgroundColor: (userData?.face_3_image_url && !userData?.face_3_name)
                    ? '#FEF2F2' 
                    : 'white'
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
                  marginBottom: '8px',
                  padding: '8px 10px',
                  backgroundColor: '#FEF2F2',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: '#DC2626',
                  border: '1px solid #EF4444',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span>⚠️</span>
                  <strong>Kategorie ist Pflicht!</strong> Wähle eine Kategorie für dein hochgeladenes Bild.
                </div>
              )}
              {userData?.face_3_image_url ? (
                <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '12px', backgroundColor: '#f9f9f9' }}>
                  <img src={userData?.face_3_image_url} alt="Schnellauswahl 2" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', marginBottom: '8px' }} />
                  <button
                    onClick={() => document.getElementById('face_3').click()}
                    disabled={uploadingSection === 'face_3'}
                    style={{
                      width: '100%',
                      padding: '8px',
                      background: '#667eea',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: 'pointer'
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
                    padding: '30px 12px',
                    border: '2px dashed #ddd',
                    borderRadius: '8px',
                    backgroundColor: '#fafafa',
                    cursor: 'pointer',
                    textAlign: 'center'
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

        {/* Physische Eigenschaften */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '16px',
          padding: '30px',
          marginBottom: '20px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '600', color: '#333' }}>
            👤 Physische Eigenschaften (für AI-Prompts)
          </h2>
          
          <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#333' }}>
                Haarfarbe
              </label>
              <select
                value={userData?.hair_color || ''}
                onChange={(e) => handleInputChange('hair_color', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              >
                <option value="">Wählen...</option>
                <option value="black">Schwarz</option>
                <option value="darkbrown">Dunkelbraun</option>
                <option value="brunette">Brunette</option>
                <option value="blonde">Blond</option>
                <option value="red">Rot</option>
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#333' }}>
                Augenfarbe
              </label>
              <select
                value={userData?.eye_color || ''}
                onChange={(e) => handleInputChange('eye_color', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              >
                <option value="">Wählen...</option>
                <option value="brown">Braun</option>
                <option value="blue">Blau</option>
                <option value="green">Grün</option>
                <option value="gray">Grau</option>
                <option value="hazel">Haselnuss</option>
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#333' }}>
                Hautton
              </label>
              <select
                value={userData?.skin_tone || ''}
                onChange={(e) => handleInputChange('skin_tone', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              >
                <option value="">Wählen...</option>
                <option value="european">Europäisch</option>
                <option value="latin">Lateinamerikanisch</option>
                <option value="asian">Asiatisch</option>
                <option value="african">Afrikanisch</option>
                <option value="arabic">Arabisch</option>
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#333' }}>
                Altersbereich
              </label>
              <select
                value={userData?.age_range || ''}
                onChange={(e) => handleInputChange('age_range', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              >
                <option value="">Wählen...</option>
                <option value="under-20">unter 20</option>
                <option value="young-adult">23-27</option>
                <option value="adult">28-35</option>
                <option value="over-40">über 40</option>
              </select>
            </div>
          </div>
        </div>

        {/* Generierungs-Einstellungen */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '16px',
          padding: '30px',
          marginBottom: '20px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '600', color: '#333' }}>
            ⚙️ Generierungs-Einstellungen
          </h2>
          
          <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#333' }}>
                Standard Auflösung
              </label>
              <select
                value={userData?.default_resolution || '2K'}
                onChange={(e) => handleInputChange('default_resolution', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              >
                <option value="1K">1K</option>
                <option value="2K">2K</option>
                <option value="4K">4K</option>
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#333' }}>
                Standard Seitenverhältnis
              </label>
              <select
                value={userData?.default_aspect_ratio || '9:16'}
                onChange={(e) => handleInputChange('default_aspect_ratio', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
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

        {/* Save Button */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '16px',
          padding: '30px',
          marginBottom: '40px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <button
            onClick={saveSettings}
            disabled={isSaving}
            style={{
              padding: '15px 40px',
              background: isSaving ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              marginRight: '15px',
              position: 'relative'
            }}
          >
            {isSaving ? 'Speichere...' : '💾 Manuell Speichern'}
            <span style={{
              position: 'absolute',
              top: '-8px',
              right: '-8px',
              background: '#ff9800',
              color: 'white',
              borderRadius: '10px',
              padding: '2px 6px',
              fontSize: '10px',
              fontWeight: 'bold'
            }}>
              Optional
            </span>
          </button>
          
        </div>
      </div>
    </div>
    </>
  )
}