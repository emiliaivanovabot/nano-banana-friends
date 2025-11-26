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
        background: 'hsl(var(--background))',
        color: 'hsl(var(--foreground))'
      }}>
        <div style={{
          fontSize: '18px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontFamily: "'Space Grotesk', sans-serif"
        }}>
          <div style={{
            width: '20px',
            height: '20px',
            border: '2px solid hsl(var(--muted))',
            borderTop: '2px solid hsl(var(--foreground))',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          Loading your profile...
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'hsl(var(--background))',
      color: 'hsl(var(--foreground))',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '640px',
        margin: '0 auto',
        paddingTop: '40px'
      }}>
        <div style={{
          background: 'hsl(var(--card))',
          borderRadius: '24px',
          padding: '40px',
          boxShadow: '0 25px 50px -12px hsl(var(--background) / 0.4)',
          border: '1px solid hsl(var(--border))',
          backdropFilter: 'blur(20px)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '35px' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '12px',
              marginBottom: '16px'
            }}>
              <div style={{ 
                fontSize: '48px', 
                filter: 'drop-shadow(0 4px 8px rgba(251, 191, 36, 0.3))'
              }}>🍌</div>
              <h1 style={{
                margin: '0',
                fontSize: '30px',
                fontWeight: '700',
                color: 'hsl(var(--foreground))',
                fontFamily: "'Space Grotesk', sans-serif",
                background: 'linear-gradient(135deg, hsl(47 100% 65%), hsl(280 70% 60%))',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.5px'
              }}>
                Willkommen {user?.username?.split('.')[0]?.charAt(0)?.toUpperCase() + user?.username?.split('.')[0]?.slice(1)}!
              </h1>
            </div>
            <p style={{
              margin: '0 0 15px 0',
              color: 'hsl(var(--muted-foreground))',
              fontSize: '18px',
              fontWeight: '500',
              lineHeight: '1.5',
              fontFamily: "'Space Grotesk', sans-serif"
            }}>
              Vervollständige dein Profil um AI-Bildgenerierung freizuschalten
            </p>
            <div style={{
              fontSize: '14px',
              color: 'hsl(var(--muted-foreground) / 0.8)',
              fontWeight: '500',
              fontFamily: "'Space Grotesk', sans-serif",
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}>
              <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
              Erforderliche Felder sind markiert
            </div>
          </div>

          {error && (
            <div style={{
              marginBottom: '24px',
              padding: '16px',
              background: 'hsl(var(--destructive) / 0.1)',
              border: '1px solid hsl(var(--destructive) / 0.2)',
              borderRadius: '12px',
              color: 'hsl(var(--destructive))',
              fontSize: '14px',
              fontWeight: '500',
              fontFamily: "'Space Grotesk', sans-serif",
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ fontSize: '16px' }}>⚠️</span>
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
        {/* Erste Card - API Key & Face Upload */}
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
            🚀 Profil einrichten
          </h2>
          
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                marginBottom: '12px',
                fontSize: '14px',
                fontWeight: '600',
                color: 'hsl(var(--foreground))',
                letterSpacing: '0.5px',
                fontFamily: "'Space Grotesk', sans-serif"
              }}>
                Gemini API Key <span style={{ color: 'hsl(var(--destructive))', fontWeight: 'bold' }}>*</span>
              </label>
              <input
                type="text"
                name="gemini_api_key"
                value={formData.gemini_api_key}
                onChange={handleInputChange}
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '16px',
                  border: formErrors.gemini_api_key ? '2px solid hsl(var(--destructive))' : '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  fontSize: '16px',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box',
                  background: isSubmitting ? 'hsl(var(--muted))' : 'hsl(var(--background))',
                  color: 'hsl(var(--foreground))',
                  fontFamily: "'Space Grotesk', sans-serif"
                }}
                placeholder="AIza... (get from Google AI Studio)"
                onFocus={(e) => {
                  if (!formErrors.gemini_api_key && !isSubmitting) {
                    e.target.style.borderColor = 'hsl(var(--primary))'
                    e.target.style.boxShadow = '0 0 0 3px hsl(var(--primary) / 0.1)'
                  }
                }}
                onBlur={(e) => {
                  if (!formErrors.gemini_api_key) {
                    e.target.style.borderColor = 'hsl(var(--border))'
                    e.target.style.boxShadow = 'none'
                  }
                }}
              />
              {formErrors.gemini_api_key && (
                <div style={{ 
                  color: 'hsl(var(--destructive))', 
                  fontSize: '12px', 
                  marginTop: '8px',
                  fontWeight: '500',
                  fontFamily: "'Space Grotesk', sans-serif",
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span>⚠️</span> {formErrors.gemini_api_key}
                </div>
              )}
              <p style={{ 
                margin: '8px 0 0 0', 
                fontSize: '12px', 
                color: 'hsl(var(--muted-foreground))',
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: '500'
              }}>
                Get your free API key from{' '}
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" 
                   style={{ 
                     color: 'hsl(var(--primary))', 
                     textDecoration: 'underline',
                     fontWeight: '600'
                   }}>
                  Google AI Studio
                </a>
              </p>
            </div>

            <div style={{ marginBottom: '32px' }}>
              <label style={{
                display: 'block',
                marginBottom: '12px',
                fontSize: '14px',
                fontWeight: '600',
                color: 'hsl(var(--foreground))',
                letterSpacing: '0.5px',
                fontFamily: "'Space Grotesk', sans-serif"
              }}>
                Face Image <span style={{ color: 'hsl(var(--destructive))', fontWeight: 'bold' }}>*</span>
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
                      padding: '48px 20px',
                      border: formErrors.main_face_image_url ? 
                        '2px dashed hsl(var(--destructive))' : 
                        '2px dashed hsl(var(--border))',
                      borderRadius: '16px',
                      textAlign: 'center',
                      cursor: isUploading ? 'not-allowed' : 'pointer',
                      backgroundColor: isUploading ? 
                        'hsl(var(--muted))' : 
                        'hsl(var(--muted) / 0.3)',
                      transition: 'all 0.3s ease',
                      boxSizing: 'border-box',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    onMouseEnter={(e) => {
                      if (!isUploading && !isSubmitting) {
                        e.target.style.backgroundColor = 'hsl(var(--muted) / 0.5)'
                        e.target.style.borderColor = 'hsl(var(--primary))'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isUploading && !isSubmitting) {
                        e.target.style.backgroundColor = 'hsl(var(--muted) / 0.3)'
                        e.target.style.borderColor = 'hsl(var(--border))'
                      }
                    }}
                  >
                    {isUploading ? (
                      <div>
                        <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
                        <div style={{ 
                          fontSize: '16px', 
                          color: 'hsl(var(--foreground))',
                          fontWeight: '600',
                          fontFamily: "'Space Grotesk', sans-serif",
                          marginBottom: '8px'
                        }}>
                          Uploading...
                        </div>
                        <div style={{
                          width: '100%',
                          maxWidth: '200px',
                          height: '6px',
                          backgroundColor: 'hsl(var(--muted))',
                          borderRadius: '3px',
                          margin: '0 auto 8px auto',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${uploadProgress}%`,
                            height: '100%',
                            backgroundColor: 'hsl(var(--primary))',
                            borderRadius: '3px',
                            transition: 'width 0.3s ease'
                          }}></div>
                        </div>
                        <div style={{ 
                          fontSize: '14px', 
                          color: 'hsl(var(--muted-foreground))',
                          fontWeight: '500'
                        }}>
                          {uploadProgress}%
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div style={{ 
                          fontSize: '40px', 
                          marginBottom: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--foreground))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
                            <circle cx="12" cy="13" r="3"/>
                          </svg>
                        </div>
                        <div style={{ 
                          fontSize: '16px', 
                          color: 'hsl(var(--foreground))', 
                          marginBottom: '8px',
                          fontWeight: '600',
                          fontFamily: "'Space Grotesk', sans-serif"
                        }}>
                          Click to select your face image
                        </div>
                        <div style={{ 
                          fontSize: '14px', 
                          color: 'hsl(var(--muted-foreground))',
                          fontWeight: '500'
                        }}>
                          JPG, PNG, GIF or WebP • Max 5MB
                        </div>
                      </div>
                    )}
                  </label>
                </div>
              ) : (
                <div style={{
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  backgroundColor: 'hsl(var(--card))',
                  boxShadow: '0 2px 8px hsl(var(--background) / 0.1)'
                }}>
                  <img 
                    src={formData.main_face_image_url} 
                    alt="Your face" 
                    style={{
                      width: '48px',
                      height: '48px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      border: '2px solid hsl(var(--border))'
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontSize: '14px', 
                      color: 'hsl(var(--foreground))', 
                      fontWeight: '600',
                      fontFamily: "'Space Grotesk', sans-serif",
                      marginBottom: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <span style={{ color: '#10B981' }}>✅</span> Image uploaded successfully
                    </div>
                    <div style={{ 
                      fontSize: '12px', 
                      color: 'hsl(var(--muted-foreground))',
                      fontWeight: '500'
                    }}>
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

            {/* Ende der ersten Card */}
          
        {/* Zweite Card für Eigenschaften */}
        <div style={{
          background: 'hsl(var(--card))',
          borderRadius: '20px',
          padding: '30px',
          marginBottom: '30px',
          boxShadow: '0 10px 30px hsl(var(--background) / 0.3)',
          border: '1px solid hsl(var(--border))'
        }}>
          {/* Physische Eigenschaften - exakt wie SettingsPage */}
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
            Physische Eigenschaften <br/><span style={{ fontSize: '16px', color: 'hsl(var(--muted-foreground))', fontWeight: 'normal' }}>(für AI-Prompts)</span>
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
                Haarfarbe <span style={{ color: 'hsl(var(--destructive))', fontWeight: 'bold' }}>*</span>
              </label>
              <select
                name="hair_color"
                value={formData.hair_color}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  fontSize: '14px',
                  backgroundColor: formData.hair_color ? 'hsl(47 100% 65%)' : 'hsl(var(--background))',
                  color: 'hsl(var(--foreground))',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  fontWeight: '500',
                  transition: 'all 0.3s ease',
                  outline: 'none'
                }}
              >
                {!formData.hair_color && <option value="">Wählen...</option>}
                <option value="black">Schwarz</option>
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
                Augenfarbe <span style={{ color: 'hsl(var(--destructive))', fontWeight: 'bold' }}>*</span>
              </label>
              <select
                name="eye_color"
                value={formData.eye_color}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  fontSize: '14px',
                  backgroundColor: formData.eye_color ? 'hsl(280 70% 60%)' : 'hsl(var(--background))',
                  color: 'hsl(var(--foreground))',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  fontWeight: '500',
                  transition: 'all 0.3s ease',
                  outline: 'none'
                }}
              >
                {!formData.eye_color && <option value="">Wählen...</option>}
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
                Hautton <span style={{ color: 'hsl(var(--destructive))', fontWeight: 'bold' }}>*</span>
              </label>
              <select
                name="skin_tone"
                value={formData.skin_tone}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  fontSize: '14px',
                  backgroundColor: formData.skin_tone ? 'hsl(47 100% 65%)' : 'hsl(var(--background))',
                  color: 'hsl(var(--foreground))',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  fontWeight: '500',
                  transition: 'all 0.3s ease',
                  outline: 'none'
                }}
              >
                {!formData.skin_tone && <option value="">Wählen...</option>}
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
                Altersbereich <span style={{ color: 'hsl(var(--destructive))', fontWeight: 'bold' }}>*</span>
              </label>
              <select
                name="age_range"
                value={formData.age_range}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  fontSize: '14px',
                  backgroundColor: formData.age_range ? 'hsl(280 70% 60%)' : 'hsl(var(--background))',
                  color: 'hsl(var(--foreground))',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  fontWeight: '500',
                  transition: 'all 0.3s ease',
                  outline: 'none'
                }}
              >
                {!formData.age_range && <option value="">Wählen...</option>}
                <option value="under-20">unter 20</option>
                <option value="young-adult">23-27</option>
                <option value="adult">28-35</option>
                <option value="over-40">über 40</option>
              </select>
            </div>
          </div>
        </div>

        {/* Generation Einstellungen - exakt wie SettingsPage */}
        <div style={{
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
            Generation Einstellungen
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
                name="default_resolution"
                value={formData.default_resolution}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  fontSize: '14px',
                  backgroundColor: formData.default_resolution ? 'hsl(47 100% 65%)' : 'hsl(var(--background))',
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
                name="default_aspect_ratio"
                value={formData.default_aspect_ratio}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  fontSize: '14px',
                  backgroundColor: formData.default_aspect_ratio ? 'hsl(280 70% 60%)' : 'hsl(var(--background))',
                  color: 'hsl(var(--foreground))',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  fontWeight: '500',
                  transition: 'all 0.3s ease',
                  outline: 'none'
                }}
              >
                <option value="1:1">1:1 (Quadrat)</option>
                <option value="9:16">9:16 (Portrait)</option>
                <option value="16:9">16:9 (Landscape)</option>
              </select>
            </div>
          </div>
        </div>

        {/* E-Mail Field */}
        <div style={{
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
            Kontakt <span style={{ fontSize: '16px', color: 'hsl(var(--muted-foreground))', fontWeight: 'normal' }}>(optional)</span>
          </h2>
          
          <div>
            <label style={{
              display: 'block',
              marginBottom: '12px',
              fontSize: '14px',
              fontWeight: '600',
              color: 'hsl(var(--foreground))',
              letterSpacing: '0.5px',
              fontFamily: "'Space Grotesk', sans-serif"
            }}>
              E-Mail
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '16px',
                border: '1px solid hsl(var(--border))',
                borderRadius: '12px',
                fontSize: '16px',
                outline: 'none',
                transition: 'all 0.2s ease',
                boxSizing: 'border-box',
                background: isSubmitting ? 'hsl(var(--muted))' : 'hsl(var(--background))',
                color: 'hsl(var(--foreground))',
                fontFamily: "'Space Grotesk', sans-serif"
              }}
              placeholder="deine@email.de"
              onFocus={(e) => {
                if (!isSubmitting) {
                  e.target.style.borderColor = 'hsl(var(--primary))'
                  e.target.style.boxShadow = '0 0 0 3px hsl(var(--primary) / 0.1)'
                }
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'hsl(var(--border))'
                e.target.style.boxShadow = 'none'
              }}
            />
            <p style={{ 
              margin: '8px 0 0 0', 
              fontSize: '12px', 
              color: 'hsl(var(--muted-foreground))',
              fontWeight: '500',
              fontFamily: "'Space Grotesk', sans-serif"
            }}>
              Optional - wird nur für wichtige Updates verwendet, keine Werbung
            </p>
          </div>
        </div>

        {/* Submit Buttons */}
        <div style={{ 
          display: 'flex', 
          gap: '15px', 
          marginTop: '20px',
          flexDirection: 'column'
        }}>
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: '100%',
              padding: '18px',
              background: isSubmitting ? 
                'hsl(var(--muted))' : 
                '#8B4B9F',
              color: 'white',
              border: 'none',
              borderRadius: '14px',
              fontSize: '16px',
              fontWeight: '700',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: isSubmitting ? 
                'none' : 
                '0 8px 16px rgba(139, 75, 159, 0.3)',
              fontFamily: "'Space Grotesk', sans-serif",
              letterSpacing: '0.5px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              if (!isSubmitting) {
                e.target.style.transform = 'translateY(-2px)'
                e.target.style.boxShadow = '0 12px 24px rgba(139, 75, 159, 0.4)'
              }
            }}
            onMouseLeave={(e) => {
              if (!isSubmitting) {
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = '0 8px 16px rgba(139, 75, 159, 0.3)'
              }
            }}
          >
            {isSubmitting ? (
              <>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                Profil wird erstellt...
              </>
            ) : (
              <>
                Profil vervollständigen
              </>
            )}
          </button>
          
          <button
            type="button"
            onClick={handleLogout}
            disabled={isSubmitting}
            style={{
              padding: '12px 24px',
              background: 'transparent',
              color: 'hsl(var(--muted-foreground))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontFamily: "'Space Grotesk', sans-serif",
              alignSelf: 'center'
            }}
            onMouseEnter={(e) => {
              e.target.style.color = 'hsl(var(--foreground))'
              e.target.style.borderColor = 'hsl(var(--primary))'
            }}
            onMouseLeave={(e) => {
              e.target.style.color = 'hsl(var(--muted-foreground))'
              e.target.style.borderColor = 'hsl(var(--border))'
            }}
          >
            Abmelden
          </button>
        </div>
          </form>
        </div>
      </div>
      
      {/* CSS Animations */}
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          /* Responsive adjustments */
          @media (max-width: 768px) {
            .onboarding-container {
              padding: 16px;
            }
          }
        `}
      </style>
    </div>
  )
}