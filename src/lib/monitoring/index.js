/**
 * Monitoring System Entry Point
 * Initializes all monitoring, analytics, and alerting systems
 */

import { initSentry, setUserContext, clearUserContext, captureError } from './sentry.js';
import { performanceMonitor } from './performance.js';
import { analytics, trackEvent, setUser, trackFeature, trackJourney } from './analytics.js';
import { alertingSystem } from './alerting.js';

/**
 * Initialize all monitoring systems
 */
export function initMonitoring() {
  // console.log('🚀 Initializing Nano Banana Friends Monitoring Suite');

  try {
    // Initialize error tracking
    initSentry();
    
    // Initialize performance monitoring
    performanceMonitor.init();
    
    // Initialize analytics
    analytics.init();
    
    // Initialize alerting
    alertingSystem.init();

    // console.log('✅ All monitoring systems initialized successfully');

    // Track initialization success
    trackEvent('monitoring_initialized', {
      systems: ['sentry', 'performance', 'analytics', 'alerting'],
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('❌ Failed to initialize monitoring systems:', error);
    
    // Still report this error if Sentry managed to initialize
    if (window.Sentry) {
      captureError(error, { context: 'monitoring_initialization' });
    }
  }
}

/**
 * Set user context across all monitoring systems
 */
export function setMonitoringUser(user) {
  try {
    // Set user in Sentry
    setUserContext(user);
    
    // Set user in analytics
    setUser(user.id, {
      email: user.email,
      username: user.username || user.display_name,
      subscription: user.subscription_type || 'free',
      created_at: user.created_at
    });

    // console.log('👤 User context set in all monitoring systems');
    
    trackEvent('user_context_set', {
      user_id: user.id,
      subscription_type: user.subscription_type || 'free'
    });

  } catch (error) {
    console.error('Failed to set user context:', error);
    captureError(error, { context: 'set_user_context', user_id: user?.id });
  }
}

/**
 * Clear user context from all monitoring systems
 */
export function clearMonitoringUser() {
  try {
    clearUserContext();
    
    console.log('👤 User context cleared from all monitoring systems');
    
    trackEvent('user_context_cleared', {
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('Failed to clear user context:', error);
    captureError(error, { context: 'clear_user_context' });
  }
}

/**
 * Track feature usage with comprehensive context
 */
export function trackFeatureUsage(featureName, action, additionalContext = {}) {
  try {
    trackFeature(featureName, action, {
      ...additionalContext,
      timestamp: Date.now(),
      page: window.location.pathname,
      session_id: getSessionId()
    });
  } catch (error) {
    console.error('Failed to track feature usage:', error);
  }
}

/**
 * Track user journey milestones
 */
export function trackUserJourney(milestone, additionalContext = {}) {
  try {
    trackJourney(milestone, {
      ...additionalContext,
      timestamp: Date.now(),
      page: window.location.pathname,
      session_id: getSessionId()
    });
  } catch (error) {
    console.error('Failed to track user journey:', error);
  }
}

/**
 * Track generation events with enhanced context
 */
export function trackGeneration(type, model, success, context = {}) {
  const eventName = success ? 'generation_success' : 'generation_failure';
  
  trackEvent(eventName, {
    generation_type: type,
    model: model,
    success: success,
    ...context,
    timestamp: Date.now()
  });

  // Track in journey if successful
  if (success) {
    trackUserJourney('generation_completed', {
      generation_type: type,
      model: model
    });
  }
}

/**
 * Track API usage patterns
 */
export function trackApiUsage(endpoint, method, status, duration, context = {}) {
  trackEvent('api_usage', {
    endpoint: endpoint,
    method: method,
    status: status,
    duration: duration,
    success: status >= 200 && status < 400,
    ...context,
    timestamp: Date.now()
  });
}

/**
 * Track errors with enhanced context
 */
export function trackError(error, context = {}) {
  try {
    captureError(error, {
      ...context,
      timestamp: Date.now(),
      page: window.location.pathname,
      user_agent: navigator.userAgent
    });

    trackEvent('error_occurred', {
      error_message: error.message || error.toString(),
      error_type: error.name || 'Unknown',
      context: context,
      timestamp: Date.now()
    });

  } catch (trackingError) {
    console.error('Failed to track error:', trackingError);
  }
}

/**
 * Get comprehensive monitoring status
 */
export function getMonitoringStatus() {
  return {
    sentry: {
      initialized: window.Sentry ? true : false,
      dsn: import.meta.env.VITE_SENTRY_DSN ? 'configured' : 'not configured'
    },
    performance: {
      initialized: performanceMonitor.initialized,
      metrics: performanceMonitor.getPerformanceSummary()
    },
    analytics: {
      initialized: analytics.initialized,
      ga4: window.gtag ? 'loaded' : 'not loaded'
    },
    alerting: {
      initialized: alertingSystem.initialized,
      status: alertingSystem.getStatus()
    }
  };
}

/**
 * Emergency monitoring disable (for debugging)
 */
export function disableMonitoring() {
  console.warn('⚠️ Disabling monitoring systems for debugging');
  
  // This is a nuclear option - only use for debugging
  window.MONITORING_DISABLED = true;
  
  trackEvent('monitoring_disabled', {
    reason: 'manual_override',
    timestamp: Date.now()
  });
}

/**
 * Utility functions
 */
function getSessionId() {
  let sessionId = sessionStorage.getItem('monitoring_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('monitoring_session_id', sessionId);
  }
  return sessionId;
}

// Re-export key functions for convenience
export {
  trackEvent,
  setUser,
  trackFeature,
  trackJourney,
  captureError,
  performanceMonitor,
  analytics,
  alertingSystem
};

// Auto-initialize monitoring when this module is imported
if (typeof window !== 'undefined' && !window.MONITORING_DISABLED) {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMonitoring);
  } else {
    // DOM is already ready
    initMonitoring();
  }
}