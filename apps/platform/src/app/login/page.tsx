'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@repo/auth-config'
import { Button } from '@repo/ui'

export default function LoginPage() {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({})
  
  const { login, isAuthenticated, requiresOnboarding, error, clearError, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isAuthenticated) {
      if (requiresOnboarding) {
        router.push('/onboarding')
      } else {
        router.push('/dashboard')
      }
    }
  }, [isAuthenticated, requiresOnboarding, router])

  useEffect(() => {
    if (error) {
      clearError()
    }
    setFormErrors({})
  }, [formData, clearError])

  const validateForm = () => {
    const errors: {[key: string]: string} = {}
    
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

  const handleSubmit = async (e: React.FormEvent) => {
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-lg">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span>Wird geladen...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            neuronalworks
          </h1>
          <p className="text-muted-foreground">
            Melde dich in deinem Konto an
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-foreground mb-2">
              Benutzername
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-border rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
              placeholder="Dein Benutzername"
              disabled={isSubmitting}
            />
            {formErrors.username && (
              <p className="mt-1 text-sm text-destructive">{formErrors.username}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
              Passwort
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-border rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
              placeholder="Dein Passwort"
              disabled={isSubmitting}
            />
            {formErrors.password && (
              <p className="mt-1 text-sm text-destructive">{formErrors.password}</p>
            )}
          </div>

          {error && (
            <div className="p-3 text-sm text-destructive-foreground bg-destructive/10 border border-destructive/20 rounded-md">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            variant="gradient"
            size="lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Anmeldung läuft...</span>
              </div>
            ) : (
              'Anmelden'
            )}
          </Button>
        </form>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Powered by neuronalworks AI Platform
          </p>
        </div>
      </div>
    </div>
  )
}