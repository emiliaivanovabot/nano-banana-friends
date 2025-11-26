import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext.jsx'

export default function LoginPage() {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formErrors, setFormErrors] = useState({})
  
  const { login, isAuthenticated, requiresOnboarding, error, clearError, isLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) {
      if (requiresOnboarding) {
        navigate('/onboarding')
      } else {
        navigate('/dashboard')
      }
    }
  }, [isAuthenticated, requiresOnboarding, navigate])

  useEffect(() => {
    if (error) {
      clearError()
    }
    setFormErrors({})
  }, [formData, clearError])

  const validateForm = () => {
    const errors = {}
    
    if (!formData.username.trim()) {
      errors.username = 'Benutzername ist erforderlich'
    } else if (formData.username.length < 3) {
      errors.username = 'Benutzername muss mindestens 3 Zeichen haben'
    }

    if (!formData.password) {
      errors.password = 'Passwort ist erforderlich'
    } else if (formData.password.length < 3) {
      errors.password = 'Passwort muss mindestens 3 Zeichen haben'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    
    try {
      console.log('🔥 LOGIN ATTEMPT:', formData.username)
      const result = await login(formData.username.trim(), formData.password)
      console.log('🔥 LOGIN RESULT:', result)
      
      if (result.success) {
        console.log('✅ Login successful, redirecting...')
      } else {
        console.log('❌ Login failed:', result.error)
      }
    } catch (error) {
      console.error('Login submission error:', error)
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
          gap: '10px'
        }}>
          <div style={{
            width: '20px',
            height: '20px',
            border: '2px solid hsl(var(--muted))',
            borderTop: '2px solid hsl(var(--foreground))',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          Loading...
        </div>
      </div>
    )
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'hsl(var(--background))',
      color: 'hsl(var(--foreground))',
      padding: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        background: 'hsl(var(--card))',
        borderRadius: '24px',
        padding: '40px',
        boxShadow: '0 25px 50px -12px hsl(var(--background) / 0.4)',
        border: '1px solid hsl(var(--border))',
        width: '100%',
        maxWidth: '420px',
        backdropFilter: 'blur(20px)'
      }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '35px' }}>
          <div style={{ 
            fontSize: '48px', 
            marginBottom: '16px',
            filter: 'drop-shadow(0 4px 8px rgba(251, 191, 36, 0.3))'
          }}>🍌</div>
          <h1 style={{ 
            margin: '0 0 12px 0', 
            fontSize: '28px', 
            fontWeight: '700',
            color: 'hsl(var(--foreground))',
            fontFamily: "'Space Grotesk', sans-serif",
            background: 'linear-gradient(135deg, hsl(47 100% 65%), hsl(280 70% 60%))',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.5px'
          }}>
            neuronalworks Alpha
          </h1>
          <p style={{ 
            margin: '0', 
            color: 'hsl(var(--muted-foreground))', 
            fontSize: '16px',
            fontWeight: '500',
            lineHeight: '1.5'
          }}>
            Anmelden um auf deine KI-Tools zuzugreifen
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            background: 'hsl(var(--destructive) / 0.1)',
            border: '1px solid hsl(var(--destructive) / 0.2)',
            padding: '16px',
            borderRadius: '12px',
            marginBottom: '24px',
            color: 'hsl(var(--destructive))',
            fontSize: '14px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ fontSize: '16px' }}>⚠️</span>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          
          {/* Username */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '12px', 
              fontSize: '14px',
              fontWeight: '600',
              color: 'hsl(var(--foreground))',
              letterSpacing: '0.5px'
            }}>
              👤 Benutzername
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: '16px',
                border: formErrors.username ? '2px solid hsl(var(--destructive))' : '1px solid hsl(var(--border))',
                borderRadius: '12px',
                fontSize: '16px',
                outline: 'none',
                transition: 'all 0.2s ease',
                boxSizing: 'border-box',
                background: 'hsl(var(--background))',
                color: 'hsl(var(--foreground))',
                fontFamily: 'inherit'
              }}
              placeholder="Gib deinen Benutzernamen ein"
              onFocus={(e) => {
                if (!formErrors.username) {
                  e.target.style.borderColor = 'hsl(47 100% 65%)'
                  e.target.style.boxShadow = '0 0 0 3px hsl(47 100% 65% / 0.1)'
                }
              }}
              onBlur={(e) => {
                if (!formErrors.username) {
                  e.target.style.borderColor = 'hsl(var(--border))'
                  e.target.style.boxShadow = 'none'
                }
              }}
            />
            {formErrors.username && (
              <div style={{ 
                color: 'hsl(var(--destructive))', 
                fontSize: '12px', 
                marginTop: '8px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <span>⚠️</span> {formErrors.username}
              </div>
            )}
          </div>

          {/* Password */}
          <div style={{ marginBottom: '32px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '12px', 
              fontSize: '14px',
              fontWeight: '600',
              color: 'hsl(var(--foreground))',
              letterSpacing: '0.5px'
            }}>
              🔒 Passwort
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: '16px',
                border: formErrors.password ? '2px solid hsl(var(--destructive))' : '1px solid hsl(var(--border))',
                borderRadius: '12px',
                fontSize: '16px',
                outline: 'none',
                transition: 'all 0.2s ease',
                boxSizing: 'border-box',
                background: 'hsl(var(--background))',
                color: 'hsl(var(--foreground))',
                fontFamily: 'inherit'
              }}
              placeholder="••••••••"
              onFocus={(e) => {
                if (!formErrors.password) {
                  e.target.style.borderColor = 'hsl(280 70% 60%)'
                  e.target.style.boxShadow = '0 0 0 3px hsl(280 70% 60% / 0.1)'
                }
              }}
              onBlur={(e) => {
                if (!formErrors.password) {
                  e.target.style.borderColor = 'hsl(var(--border))'
                  e.target.style.boxShadow = 'none'
                }
              }}
            />
            {formErrors.password && (
              <div style={{ 
                color: 'hsl(var(--destructive))', 
                fontSize: '12px', 
                marginTop: '8px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <span>⚠️</span> {formErrors.password}
              </div>
            )}
          </div>

          {/* Submit Button */}
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
              gap: '8px',
              position: 'relative',
              overflow: 'hidden'
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
                Anmeldung läuft...
              </>
            ) : (
              <>
                Anmelden
              </>
            )}
          </button>
        </form>
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
            .login-container {
              padding: 16px;
            }
          }
        `}
      </style>
    </div>
  )
}