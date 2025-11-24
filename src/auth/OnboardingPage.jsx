// Onboarding Page for completing required profile fields
// Created by api-builder specialist

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext.jsx'
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

export default function OnboardingPage() {
  const [formData, setFormData] = useState({
    gemini_api_key: '',
    email: '',
    main_face_image_url: '',
    hair_color: '',
    eye_color: '',
    skin_tone: '',
    age_range: '',
    default_resolution: '2K',
    default_aspect_ratio: '9:16'
  })
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formErrors, setFormErrors] = useState({})
  const [error, setError] = useState(null)
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  const { user, isAuthenticated, completeOnboarding, logout } = useAuth()
  const navigate = useNavigate()

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
    }
  }, [isAuthenticated, navigate])

  // Load existing user data
  useEffect(() => {
    const loadUserData = async () => {
      if (!user?.id) return

      try {
        const { data: userData, error } = await supabase
          .from('users')
          .select('gemini_api_key, main_face_image_url, hair_color, eye_color, skin_tone, age_range')
          .eq('id', user.id)
          .single()

        if (error) {
          console.error('Error loading user data:', error)
          setError('Failed to load existing profile data')
        } else if (userData) {
          setFormData({
            gemini_api_key: userData.gemini_api_key || '',
            email: userData.email || '',
            main_face_image_url: userData.main_face_image_url || '',
            hair_color: userData.hair_color || '',
            eye_color: userData.eye_color || '',
            skin_tone: userData.skin_tone || '',
            age_range: userData.age_range || '',
            default_resolution: userData.default_resolution || '2K',
            default_aspect_ratio: userData.default_aspect_ratio || '9:16'
          })
        }
      } catch (error) {
        console.error('Unexpected error loading user data:', error)
        setError('Failed to load profile data')
      } finally {
        setIsLoading(false)
      }
    }

    loadUserData()
  }, [user])

  // File upload handler
  const handleFileSelect = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setFormErrors(prev => ({
        ...prev,
        main_face_image_url: 'Please select a valid image file (JPG, PNG, GIF, or WebP)'
      }))
      return
    }

    if (file.size > 5242880) { // 5MB
      setFormErrors(prev => ({
        ...prev,
        main_face_image_url: 'File size must be less than 5MB'
      }))
      return
    }

    setSelectedFile(file)
    
    // Clear previous errors
    setFormErrors(prev => ({
      ...prev,
      main_face_image_url: ''
    }))

    // Upload file immediately
    await uploadFile(file)
  }

  const uploadFile = async (file) => {
    if (!user?.id) return

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const fileName = `${user.id}_${Date.now()}_${file.name}`
      const filePath = `${user.id}/${fileName}`

      const { data, error } = await supabase.storage
        .from('face-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (error) throw error

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('face-images')
        .getPublicUrl(filePath)

      // Update form data with the uploaded URL
      setFormData(prev => ({
        ...prev,
        main_face_image_url: publicUrl
      }))

      setUploadProgress(100)
      console.log('✅ Image uploaded successfully:', publicUrl)

    } catch (error) {
      console.error('❌ Upload failed:', error)
      setFormErrors(prev => ({
        ...prev,
        main_face_image_url: 'Upload failed. Please try again.'
      }))
    } finally {
      setIsUploading(false)
    }
  }

  const validateForm = () => {
    const errors = {}
    
    // Required fields validation
    if (!formData.gemini_api_key.trim()) {
      errors.gemini_api_key = 'Gemini API key is required'
    } else if (!formData.gemini_api_key.startsWith('AI')) {
      errors.gemini_api_key = 'Invalid Gemini API key format (should start with "AI")'
    }

    if (!formData.main_face_image_url.trim()) {
      errors.main_face_image_url = 'Please upload your face image'
    }

    // Physical attributes - required for good AI prompts
    if (!formData.hair_color.trim()) {
      errors.hair_color = 'Haarfarbe ist erforderlich'
    }

    if (!formData.eye_color.trim()) {
      errors.eye_color = 'Augenfarbe ist erforderlich'
    }

    if (!formData.skin_tone.trim()) {
      errors.skin_tone = 'Hautton ist erforderlich'
    }

    if (!formData.age_range.trim()) {
      errors.age_range = 'Altersbereich ist erforderlich'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const isValidUrl = (url) => {
    try {
      new URL(url)
      return url.match(/\.(jpg|jpeg|png|gif|webp)$/i) !== null
    } catch {
      return false
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    console.log('🔥 ONBOARDING SUBMIT:', formData)
    
    if (!validateForm()) {
      console.log('❌ VALIDATION FAILED')
      // Zeige Error Pop-up für 3 Sekunden
      setError('Bitte fülle alle Pflichtfelder aus: Gemini API Schlüssel, Gesichtsbild und physische Eigenschaften (Haarfarbe, Augenfarbe, Hautton, Alter) sind erforderlich!')
      setTimeout(() => setError(null), 5000)
      return
    }

    setIsSubmitting(true)
    setError(null)
    
    try {
      console.log('💾 UPDATING USER PROFILE...')
      // Update user profile in database
      const { error: updateError } = await supabase
        .from('users')
        .update({
          gemini_api_key: formData.gemini_api_key.trim(),
          email: formData.email.trim() || null,
          main_face_image_url: formData.main_face_image_url.trim(),
          hair_color: formData.hair_color.trim() || null,
          eye_color: formData.eye_color.trim() || null,
          skin_tone: formData.skin_tone.trim() || null,
          age_range: formData.age_range.trim() || null,
          default_resolution: formData.default_resolution,
          default_aspect_ratio: formData.default_aspect_ratio,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (updateError) {
        console.error('❌ UPDATE ERROR:', updateError)
        setError('Failed to update profile. Please try again.')
        return
      }

      console.log('✅ USER PROFILE UPDATED!')
      
      // Zeige Success Pop-up für 4 Sekunden, dann weiterleiten
      console.log('🎉 SHOWING SUCCESS POPUP...')
      setShowSuccessPopup(true)
      
      setTimeout(() => {
        console.log('🕐 SUCCESS POPUP TIMEOUT - STARTING NAVIGATION...')
        // Mark onboarding as completed
        completeOnboarding()
        
        console.log('🚀 NAVIGATING TO DASHBOARD...')
        // Navigate to dashboard
        navigate('/dashboard')
      }, 4000)  // 4 Sekunden warten
    } catch (error) {
      console.error('Onboarding submission error:', error)
      setError('Failed to complete onboarding. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear field-specific error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (!isAuthenticated) {
    return null
  }

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ color: 'white', fontSize: '18px' }}>Loading your profile...</div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        paddingTop: '40px'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '16px',
          padding: '40px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>🍌</div>
            <h1 style={{
              margin: '0 0 10px 0',
              fontSize: '28px',
              fontWeight: '600',
              color: '#333'
            }}>
              Willkommen {user?.username?.split('.')[0]?.charAt(0)?.toUpperCase() + user?.username?.split('.')[0]?.slice(1)}!
            </h1>
            <p style={{
              margin: '0 0 15px 0',
              color: '#666',
              fontSize: '16px',
              lineHeight: '1.5'
            }}>
              Vervollständige dein Profil um AI-Bildgenerierung freizuschalten
            </p>
            <div style={{
              fontSize: '14px',
              color: '#888',
              fontWeight: '500'
            }}>
              Erforderliche Felder sind mit * markiert
            </div>
          </div>

          {error && (
            <div style={{
              marginBottom: '20px',
              padding: '12px',
              background: '#fee',
              border: '1px solid #fcc',
              borderRadius: '8px',
              color: '#c33',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}
          

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#333'
              }}>
                Gemini API Key *
              </label>
              <input
                type="text"
                name="gemini_api_key"
                value={formData.gemini_api_key}
                onChange={handleInputChange}
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: formErrors.gemini_api_key ? '2px solid #f56565' : '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box',
                  backgroundColor: isSubmitting ? '#f5f5f5' : 'white'
                }}
                placeholder="AIza... (get from Google AI Studio)"
              />
              {formErrors.gemini_api_key && (
                <div style={{ color: '#f56565', fontSize: '12px', marginTop: '4px' }}>
                  {formErrors.gemini_api_key}
                </div>
              )}
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#888' }}>
                Get your free API key from{' '}
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" 
                   style={{ color: '#667eea', textDecoration: 'underline' }}>
                  Google AI Studio
                </a>
              </p>
            </div>

            <div style={{ marginBottom: '30px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#333'
              }}>
                Face Image *
              </label>
              
              {!formData.main_face_image_url ? (
                <div>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleFileSelect}
                    disabled={isUploading || isSubmitting}
                    style={{ display: 'none' }}
                    id="face-image-input"
                  />
                  <label 
                    htmlFor="face-image-input"
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '40px 12px',
                      border: formErrors.main_face_image_url ? '2px dashed #f56565' : '2px dashed #ddd',
                      borderRadius: '8px',
                      textAlign: 'center',
                      cursor: isUploading ? 'not-allowed' : 'pointer',
                      backgroundColor: isUploading ? '#f5f5f5' : '#fafafa',
                      transition: 'all 0.2s',
                      boxSizing: 'border-box'
                    }}
                  >
                    {isUploading ? (
                      <div>
                        <div style={{ fontSize: '24px', marginBottom: '8px' }}>⏳</div>
                        <div style={{ fontSize: '14px', color: '#666' }}>
                          Uploading... {uploadProgress}%
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize: '24px', marginBottom: '8px' }}>📷</div>
                        <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
                          Click to select your face image
                        </div>
                        <div style={{ fontSize: '12px', color: '#888' }}>
                          JPG, PNG, GIF or WebP • Max 5MB
                        </div>
                      </div>
                    )}
                  </label>
                </div>
              ) : (
                <div style={{
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  backgroundColor: '#f9f9f9'
                }}>
                  <img 
                    src={formData.main_face_image_url} 
                    alt="Your face" 
                    style={{
                      width: '40px',
                      height: '40px',
                      objectFit: 'cover',
                      borderRadius: '4px'
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', color: '#333', fontWeight: '500' }}>
                      ✅ Image uploaded successfully
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {selectedFile?.name || 'Face image ready'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, main_face_image_url: '' }))
                      setSelectedFile(null)
                    }}
                    style={{
                      padding: '4px 8px',
                      background: '#f56565',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    Entfernen
                  </button>
                </div>
              )}
              
              {formErrors.main_face_image_url && (
                <div style={{ color: '#f56565', fontSize: '12px', marginTop: '4px' }}>
                  {formErrors.main_face_image_url}
                </div>
              )}
            </div>

            {/* Physische Eigenschaften */}
            <div style={{
              borderTop: '1px solid #eee',
              paddingTop: '30px',
              marginTop: '30px'
            }}>
              <h3 style={{
                margin: '0 0 20px 0',
                fontSize: '18px',
                fontWeight: '600',
                color: '#333'
              }}>
                👤 Deine Eigenschaften (für bessere AI-Ergebnisse)
              </h3>
              
              <div style={{
                display: 'grid',
                gap: '20px',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#333'
                  }}>
                    Haarfarbe *
                  </label>
                  <select
                    name="hair_color"
                    value={formData.hair_color}
                    onChange={handleInputChange}
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
                    <option value="brunette">Brunette</option>
                    <option value="blonde">Blond</option>
                    <option value="red">Rot</option>
                  </select>
                </div>
                
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#333'
                  }}>
                    Augenfarbe *
                  </label>
                  <select
                    name="eye_color"
                    value={formData.eye_color}
                    onChange={handleInputChange}
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
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#333'
                  }}>
                    Hautton *
                  </label>
                  <select
                    name="skin_tone"
                    value={formData.skin_tone}
                    onChange={handleInputChange}
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
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#333'
                  }}>
                    Altersbereich *
                  </label>
                  <select
                    name="age_range"
                    value={formData.age_range}
                    onChange={handleInputChange}
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
              borderTop: '1px solid #eee',
              paddingTop: '30px',
              marginTop: '30px'
            }}>
              <h3 style={{
                margin: '0 0 20px 0',
                fontSize: '18px',
                fontWeight: '600',
                color: '#333'
              }}>
                ⚙️ Deine Standard-Einstellungen
              </h3>
              
              <div style={{
                display: 'grid',
                gap: '20px',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#333'
                  }}>
                    Auflösung
                  </label>
                  <select
                    name="default_resolution"
                    value={formData.default_resolution}
                    onChange={handleInputChange}
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
                    <option value="2K">2K (Standard)</option>
                    <option value="4K">4K</option>
                  </select>
                </div>
                
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#333'
                  }}>
                    Seitenverhältnis
                  </label>
                  <select
                    name="default_aspect_ratio"
                    value={formData.default_aspect_ratio}
                    onChange={handleInputChange}
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
                    <option value="9:16">9:16 (Handy)</option>
                    <option value="16:9">16:9 (Querformat)</option>
                    <option value="3:4">3:4 (Portrait)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* E-Mail ganz zum Schluss */}
            <div style={{
              borderTop: '1px solid #eee',
              paddingTop: '20px',
              marginTop: '30px',
              marginBottom: '30px'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#333'
                }}>
                  📧 E-Mail (optional)
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box',
                    backgroundColor: isSubmitting ? '#f5f5f5' : 'white'
                  }}
                  placeholder="deine@email.de"
                />
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#888' }}>
                  Optional - wird nur für wichtige Updates verwendet, keine Werbung
                </p>
              </div>
            </div>

            {/* Error Message direkt vor den Buttons für Mobile */}
            {error && (
              <div style={{
                marginBottom: '20px',
                padding: '12px',
                background: '#fee',
                border: '2px solid #f56565',
                borderRadius: '8px',
                color: '#c33',
                fontSize: '14px',
                fontWeight: '600',
                textAlign: 'center'
              }}>
                ⚠️ {error}
              </div>
            )}

            {/* Success Popup direkt vor den Buttons für Mobile */}
            {showSuccessPopup && (
              <div style={{
                marginBottom: '20px',
                padding: '20px',
                background: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)',
                border: '2px solid #16a34a',
                borderRadius: '12px',
                color: 'white',
                fontSize: '16px',
                fontWeight: '600',
                textAlign: 'center',
                boxShadow: '0 8px 25px rgba(34, 197, 94, 0.3)',
                animation: 'popup-bounce 0.5s ease-out'
              }}>
                🎉 ERFOLG! Profil wurde erstellt!<br/>
                <span style={{ fontSize: '14px', opacity: 0.9 }}>
                  Du wirst in wenigen Sekunden zum Dashboard weitergeleitet...
                </span>
              </div>
            )}

            <div style={{ 
              display: 'flex', 
              gap: '15px', 
              marginTop: '20px',
              flexDirection: window.innerWidth < 640 ? 'column' : 'row'
            }}>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  flex: '1',
                  padding: '12px',
                  background: isSubmitting ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {isSubmitting ? 'Speichere...' : 'Profil vervollständigen'}
              </button>
              
              <button
                type="button"
                onClick={handleLogout}
                disabled={isSubmitting}
                style={{
                  padding: '12px 24px',
                  background: 'transparent',
                  color: '#666',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Abmelden
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}