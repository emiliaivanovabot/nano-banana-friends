// Environment configuration constants
// Shared environment detection and configuration

export type Environment = 'development' | 'production' | 'preview'

export interface EnvironmentConfig {
  NODE_ENV: string
  VERCEL_ENV?: string
  VERCEL_URL?: string
  isDevelopment: boolean
  isProduction: boolean
  isPreview: boolean
  appName: string
  version: string
}

// Get current environment
export const getEnvironment = (): Environment => {
  if (typeof window !== 'undefined') {
    // Browser environment
    const hostname = window.location.hostname
    if (hostname === 'localhost' || hostname.startsWith('127.')) {
      return 'development'
    }
    if (hostname.includes('vercel.app') && !hostname.includes('preview')) {
      return 'production'
    }
    return 'preview'
  }

  // Server environment
  const vercelEnv = process.env.VERCEL_ENV
  if (vercelEnv === 'production') return 'production'
  if (vercelEnv === 'preview') return 'preview'
  
  const nodeEnv = process.env.NODE_ENV
  if (nodeEnv === 'production') return 'production'
  
  return 'development'
}

// Get environment configuration
export const getEnvironmentConfig = (): EnvironmentConfig => {
  const env = getEnvironment()
  
  return {
    NODE_ENV: process.env.NODE_ENV || 'development',
    VERCEL_ENV: process.env.VERCEL_ENV,
    VERCEL_URL: process.env.VERCEL_URL,
    isDevelopment: env === 'development',
    isProduction: env === 'production',
    isPreview: env === 'preview',
    appName: process.env.npm_package_name || 'nano-banana-friends',
    version: process.env.npm_package_version || '1.0.0'
  }
}

// Common environment checks
export const isDevelopment = (): boolean => getEnvironment() === 'development'
export const isProduction = (): boolean => getEnvironment() === 'production'
export const isPreview = (): boolean => getEnvironment() === 'preview'

// Debug helpers
export const isDebugEnabled = (): boolean => {
  return isDevelopment() || process.env.DEBUG === 'true'
}

// Feature flags based on environment
export const getFeatureFlags = () => ({
  enableLogging: isDevelopment() || process.env.ENABLE_LOGGING === 'true',
  enableAnalytics: isProduction(),
  enableErrorReporting: isProduction() || isPreview(),
  enableDevTools: isDevelopment(),
  strictMode: isProduction()
})

// Database environment configuration
export const getDatabaseConfig = () => {
  const config = getEnvironmentConfig()
  
  return {
    supabaseUrl: process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    isDevelopment: config.isDevelopment,
    isProduction: config.isProduction
  }
}