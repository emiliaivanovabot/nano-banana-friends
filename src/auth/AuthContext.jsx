// Authentication Context for global auth state management
// Created by api-builder specialist

import React, { createContext, useContext, useState, useEffect } from 'react'
import { SessionManager, authenticateUser, logout as authLogout } from './auth-utils.js'
import { SecureLogger } from '../utils/secure-logger.js'
import { setMonitoringUser, clearMonitoringUser, trackUserJourney } from '../lib/monitoring/index.js'

const AuthContext = createContext(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [requiresOnboarding, setRequiresOnboarding] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Initialize auth state from session on app start
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const session = SessionManager.getSession()
        
        if (session && session.user) {
          setUser(session.user)
          setIsAuthenticated(true)
          setRequiresOnboarding(session.requiresOnboarding || false)
          
          // Set user context in monitoring systems
          setMonitoringUser(session.user)
          trackUserJourney('session_restored', {
            user_id: session.user.id,
            subscription_type: session.user.subscription_type || 'free'
          })
        } else {
          setUser(null)
          setIsAuthenticated(false)
          setRequiresOnboarding(false)
          
          // Clear user context from monitoring systems
          clearMonitoringUser()
        }
      } catch (error) {
        SecureLogger.error('Error initializing auth', error)
        setUser(null)
        setIsAuthenticated(false)
        setRequiresOnboarding(false)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [])

  /**
   * Login function with smart routing logic
   * @param {string} username - Username
   * @param {string} password - Password
   * @returns {Promise<{success: boolean, requiresOnboarding: boolean, error: string|null}>}
   */
  const login = async (username, password) => {
    setError(null)
    setIsLoading(true)

    try {
      const result = await authenticateUser(username, password)

      if (result.success) {
        // Set auth state
        setUser(result.user)
        setIsAuthenticated(true)
        setRequiresOnboarding(result.requiresOnboarding)

        // Store session
        SessionManager.setSession(result.user, result.requiresOnboarding)

        // Set user context in monitoring systems
        setMonitoringUser(result.user)
        trackUserJourney('user_login', {
          user_id: result.user.id,
          subscription_type: result.user.subscription_type || 'free',
          requires_onboarding: result.requiresOnboarding
        })

        return {
          success: true,
          requiresOnboarding: result.requiresOnboarding,
          error: null
        }
      } else {
        setError(result.error)
        return {
          success: false,
          requiresOnboarding: false,
          error: result.error
        }
      }
    } catch (error) {
      const errorMessage = 'Login failed due to network error'
      setError(errorMessage)
      return {
        success: false,
        requiresOnboarding: false,
        error: errorMessage
      }
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Logout function
   */
  const logout = () => {
    try {
      // Track logout before clearing user context
      trackUserJourney('user_logout', {
        user_id: user?.id
      })
      
      authLogout()
      setUser(null)
      setIsAuthenticated(false)
      setRequiresOnboarding(false)
      setError(null)
      
      // Clear user context from monitoring systems
      clearMonitoringUser()
      
      return true
    } catch (error) {
      SecureLogger.error('Logout error', error)
      setError('Logout failed')
      return false
    }
  }

  /**
   * Mark onboarding as completed
   */
  const completeOnboarding = () => {
    try {
      SessionManager.markOnboardingComplete()
      setRequiresOnboarding(false)
      
      // Track onboarding completion
      trackUserJourney('onboarding_completed', {
        user_id: user?.id,
        subscription_type: user?.subscription_type || 'free'
      })
      
      return true
    } catch (error) {
      SecureLogger.error('Error completing onboarding', error)
      setError('Failed to complete onboarding')
      return false
    }
  }

  /**
   * Clear any auth errors
   */
  const clearError = () => {
    setError(null)
  }

  /**
   * Check if user is authenticated and profile is complete
   * @returns {boolean}
   */
  const isReadyForApp = () => {
    return isAuthenticated && !requiresOnboarding
  }

  const contextValue = {
    // Auth state
    user,
    isAuthenticated,
    requiresOnboarding,
    isLoading,
    error,

    // Auth actions
    login,
    logout,
    completeOnboarding,
    clearError,

    // Helper functions
    isReadyForApp
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}