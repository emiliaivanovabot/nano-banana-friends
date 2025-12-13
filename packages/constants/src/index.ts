// Main exports for @repo/constants package
// Shared constants and configuration across the monorepo

export {
  PRODUCTION_URLS,
  DEVELOPMENT_URLS,
  getAppUrls,
  getPlatformUrl,
  getGeminiUrl,
  getSeedreamUrl,
  navigateToApp,
  getApiEndpoint
} from './app-urls'

export type { AppUrls } from './app-urls'

export {
  getEnvironment,
  getEnvironmentConfig,
  isDevelopment,
  isProduction,
  isPreview,
  isDebugEnabled,
  getFeatureFlags,
  getDatabaseConfig
} from './environment'

export type { Environment, EnvironmentConfig } from './environment'