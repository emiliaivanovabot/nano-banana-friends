// Authentication utilities with password hashing and session management
// Created by api-builder specialist

import bcrypt from 'bcryptjs'
import { getUserByUsername, updateLastLogin, checkProfileCompletion, initializeUserStats } from './database-utils.js'

/**
 * Hash password with bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Hashed password
 */
export async function hashPassword(password) {
  try {
    const saltRounds = 12 // High security for production
    return await bcrypt.hash(password, saltRounds)
  } catch (error) {
    console.error('Error hashing password:', error)
    throw new Error('Password hashing failed')
  }
}

/**
 * Verify password against hash
 * @param {string} password - Plain text password
 * @param {string} hash - Stored password hash
 * @returns {Promise<boolean>} - Password match result
 */
export async function verifyPassword(password, hash) {
  try {
    return await bcrypt.compare(password, hash)
  } catch (error) {
    console.error('Error verifying password:', error)
    return false
  }
}

/**
 * Authenticate user with username and password
 * @param {string} username - Username
 * @param {string} password - Plain text password
 * @returns {Promise<{success: boolean, user: object|null, error: string|null, requiresOnboarding: boolean}>}
 */
export async function authenticateUser(username, password) {
  try {
    // Input validation
    if (!username || !password) {
      return {
        success: false,
        user: null,
        error: 'Username and password are required',
        requiresOnboarding: false
      }
    }

    if (username.length < 3 || username.length > 50) {
      return {
        success: false,
        user: null,
        error: 'Username must be between 3 and 50 characters',
        requiresOnboarding: false
      }
    }

    if (password.length < 3) {
      return {
        success: false,
        user: null,
        error: 'Password must be at least 3 characters',
        requiresOnboarding: false
      }
    }

    // Try database first, fallback to local users if DB fails
    let user = null
    let dbError = null
    
    try {
      const result = await getUserByUsername(username)
      user = result.user
      dbError = result.error
    } catch (err) {
      dbError = err
      console.warn('Database unavailable, using local fallback:', err.message)
    }
    
    // Fallback to local users if database fails
    if (dbError || !user) {
      console.log('Using local user fallback for:', username)
      const localUsers = JSON.parse(import.meta.env.VITE_LOGIN_USERS || '[]')
      const localUser = localUsers.find(u => u.username === username && u.password === password)
      
      if (localUser) {
        return {
          success: true,
          user: {
            id: localUser.username,
            username: localUser.username,
            model_id: localUser.modelId,
            subscription_type: 'free',
            is_active: true
          },
          error: null,
          requiresOnboarding: false
        }
      }
      
      return {
        success: false,
        user: null,
        error: 'Invalid username or password',
        requiresOnboarding: false
      }
    }

    // Verify password with bcrypt
    const isValidPassword = await verifyPassword(password, user.password_hash)
    
    if (!isValidPassword) {
      return {
        success: false,
        user: null,
        error: 'Invalid username or password',
        requiresOnboarding: false
      }
    }

    // Update last login
    await updateLastLogin(user.id)

    // Check profile completion for smart routing
    const { isComplete, missingFields } = await checkProfileCompletion(user.id)
    
    // Initialize user stats if profile is complete but stats don't exist
    if (isComplete) {
      await initializeUserStats(user.id)
    }

    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        lastLogin: user.last_login
      },
      error: null,
      requiresOnboarding: !isComplete,
      missingFields: missingFields || []
    }
  } catch (error) {
    console.error('Authentication error:', error)
    return {
      success: false,
      user: null,
      error: 'Authentication failed due to server error',
      requiresOnboarding: false
    }
  }
}

/**
 * Session management utilities
 */
export const SessionManager = {
  /**
   * Store user session in localStorage
   * @param {object} user - User object
   * @param {boolean} requiresOnboarding - Whether user needs onboarding
   */
  setSession(user, requiresOnboarding = false) {
    try {
      const sessionData = {
        user,
        requiresOnboarding,
        loginTime: Date.now(),
        expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
      }
      
      localStorage.setItem('nano_banana_session', JSON.stringify(sessionData))
      return true
    } catch (error) {
      console.error('Error setting session:', error)
      return false
    }
  },

  /**
   * Get user session from localStorage
   * @returns {object|null} - Session data or null if invalid
   */
  getSession() {
    try {
      const sessionData = localStorage.getItem('nano_banana_session')
      
      if (!sessionData) {
        return null
      }

      const session = JSON.parse(sessionData)
      
      // Check if session is expired
      if (session.expiresAt && Date.now() > session.expiresAt) {
        this.clearSession()
        return null
      }

      return session
    } catch (error) {
      console.error('Error getting session:', error)
      this.clearSession()
      return null
    }
  },

  /**
   * Clear user session
   */
  clearSession() {
    try {
      localStorage.removeItem('nano_banana_session')
      return true
    } catch (error) {
      console.error('Error clearing session:', error)
      return false
    }
  },

  /**
   * Check if user is authenticated
   * @returns {boolean}
   */
  isAuthenticated() {
    const session = this.getSession()
    return session !== null && session.user !== null
  },

  /**
   * Get current user from session
   * @returns {object|null}
   */
  getCurrentUser() {
    const session = this.getSession()
    return session ? session.user : null
  },

  /**
   * Check if user requires onboarding
   * @returns {boolean}
   */
  requiresOnboarding() {
    const session = this.getSession()
    return session ? session.requiresOnboarding : false
  },

  /**
   * Update session to mark onboarding as completed
   */
  markOnboardingComplete() {
    const session = this.getSession()
    if (session) {
      session.requiresOnboarding = false
      localStorage.setItem('nano_banana_session', JSON.stringify(session))
    }
  }
}

/**
 * Logout utility
 * @returns {boolean} - Success status
 */
export function logout() {
  try {
    SessionManager.clearSession()
    // Could add server-side logout logic here if needed
    return true
  } catch (error) {
    console.error('Logout error:', error)
    return false
  }
}