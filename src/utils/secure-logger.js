// Secure Logging Utility - Production Safe
// Created by backend-team-leader for security compliance

const isDevelopment = import.meta.env.MODE === 'development'

/**
 * Secure console logger that respects environment
 * Only logs in development mode, never in production
 */
export const SecureLogger = {
  /**
   * Safe debug logging - only in development
   * @param {string} message - Log message
   * @param {object} data - Data to log (will be sanitized)
   */
  debug(message, data = {}) {
    if (isDevelopment) {
      console.log(`[DEBUG] ${message}`, this.sanitizeData(data))
    }
  },

  /**
   * Safe info logging - only in development
   * @param {string} message - Log message
   * @param {object} data - Data to log (will be sanitized)
   */
  info(message, data = {}) {
    if (isDevelopment) {
      console.info(`[INFO] ${message}`, this.sanitizeData(data))
    }
  },

  /**
   * Safe warning logging - only in development
   * @param {string} message - Warning message
   * @param {object} data - Data to log (will be sanitized)
   */
  warn(message, data = {}) {
    if (isDevelopment) {
      console.warn(`[WARN] ${message}`, this.sanitizeData(data))
    }
  },

  /**
   * Critical error logging - logs in all environments but sanitizes data
   * @param {string} message - Error message
   * @param {Error|object} error - Error object or data
   */
  error(message, error = {}) {
    // Always log errors but sanitize sensitive data
    const sanitizedError = this.sanitizeError(error)
    console.error(`[ERROR] ${message}`, sanitizedError)
  },

  /**
   * Sanitize data object to remove sensitive information
   * @param {object} data - Data to sanitize
   * @returns {object} - Sanitized data
   */
  sanitizeData(data) {
    if (!data || typeof data !== 'object') {
      return data
    }

    const sanitized = { ...data }
    const sensitiveKeys = [
      'password', 'password_hash', 'token', 'apiKey', 'api_key', 
      'secret', 'key', 'auth', 'authorization', 'user', 'session'
    ]

    // Recursively sanitize object
    const sanitizeObject = (obj) => {
      if (!obj || typeof obj !== 'object') {
        return obj
      }

      const result = Array.isArray(obj) ? [] : {}
      
      for (const [key, value] of Object.entries(obj)) {
        const lowerKey = key.toLowerCase()
        
        if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
          result[key] = '[REDACTED]'
        } else if (typeof value === 'object' && value !== null) {
          result[key] = sanitizeObject(value)
        } else {
          result[key] = value
        }
      }
      
      return result
    }

    return sanitizeObject(sanitized)
  },

  /**
   * Sanitize error objects for safe logging
   * @param {Error|object} error - Error to sanitize
   * @returns {object} - Sanitized error
   */
  sanitizeError(error) {
    if (error instanceof Error) {
      return {
        message: error.message,
        name: error.name,
        stack: isDevelopment ? error.stack : undefined
      }
    }
    
    return this.sanitizeData(error)
  },

  /**
   * Performance timing logger - development only
   * @param {string} operation - Operation name
   * @param {function} fn - Function to time
   * @returns {any} - Function result
   */
  async timeOperation(operation, fn) {
    if (!isDevelopment) {
      return await fn()
    }

    const start = performance.now()
    try {
      const result = await fn()
      const duration = (performance.now() - start).toFixed(2)
      this.debug(`Performance: ${operation}`, { duration: `${duration}ms` })
      return result
    } catch (error) {
      const duration = (performance.now() - start).toFixed(2)
      this.error(`Performance Error in ${operation}`, { 
        duration: `${duration}ms`, 
        error: error.message 
      })
      throw error
    }
  }
}

/**
 * API Response Logger - Safely logs API responses without exposing keys
 */
export const ApiLogger = {
  /**
   * Log API request safely
   * @param {string} service - Service name (e.g., 'Gemini', 'Supabase')
   * @param {string} endpoint - Endpoint called
   * @param {object} metadata - Safe metadata to log
   */
  logRequest(service, endpoint, metadata = {}) {
    SecureLogger.debug(`API Request: ${service}`, {
      endpoint,
      timestamp: new Date().toISOString(),
      ...metadata
    })
  },

  /**
   * Log API response safely
   * @param {string} service - Service name
   * @param {boolean} success - Request success status
   * @param {object} metadata - Safe metadata to log
   */
  logResponse(service, success, metadata = {}) {
    const level = success ? 'info' : 'warn'
    SecureLogger[level](`API Response: ${service}`, {
      success,
      timestamp: new Date().toISOString(),
      ...metadata
    })
  },

  /**
   * Log API error safely
   * @param {string} service - Service name
   * @param {Error|string} error - Error object or message
   * @param {object} context - Additional context
   */
  logError(service, error, context = {}) {
    SecureLogger.error(`API Error: ${service}`, {
      error: typeof error === 'string' ? error : error.message,
      timestamp: new Date().toISOString(),
      ...context
    })
  }
}

// Export default for backwards compatibility
export default SecureLogger