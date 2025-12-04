import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";
import React from "react";

/**
 * Initialize Sentry error tracking and performance monitoring
 * This should be called once at the application startup
 */
export function initSentry() {
  // Only initialize in production or when explicitly enabled
  if (import.meta.env.PROD || import.meta.env.VITE_ENABLE_SENTRY === 'true') {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      integrations: [
        new BrowserTracing({
          // Auto-instrument navigation and page loads
        }),
      ],
      
      // Performance monitoring
      tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0, // 10% in prod, 100% in dev
      
      // Session replay for debugging (be mindful of privacy)
      replaysSessionSampleRate: 0.1, // 10% of sessions
      replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
      
      // Environment configuration
      environment: import.meta.env.MODE,
      
      // Release tracking
      release: import.meta.env.VITE_APP_VERSION || '1.0.0',
      
      // Filter out common non-critical errors
      beforeSend(event, hint) {
        // Filter out network errors that aren't actionable
        if (event.exception) {
          const error = hint.originalException;
          if (error && error.name === 'ChunkLoadError') {
            // These typically happen during deployments
            return null;
          }
          
          // Filter out ResizeObserver errors (common browser quirk)
          if (error && error.message && error.message.includes('ResizeObserver')) {
            return null;
          }
          
          // Filter out non-actionable script loading errors
          if (error && error.message && error.message.includes('Loading chunk')) {
            return null;
          }
        }
        
        return event;
      },
      
      // Add user context and additional tags
      beforeSendTransaction(event) {
        // Add custom tags for better filtering
        event.tags = {
          ...event.tags,
          component: 'nano-banana-friends',
        };
        
        return event;
      }
    });

    // Set initial user context if available
    const userId = localStorage.getItem('user_id');
    if (userId) {
      Sentry.setUser({
        id: userId,
        segment: 'authenticated'
      });
    }
  }
}

/**
 * Capture custom error with additional context
 */
export function captureError(error, context = {}) {
  console.error('Error captured:', error, context);
  
  Sentry.withScope((scope) => {
    // Add context information
    Object.keys(context).forEach(key => {
      scope.setTag(key, context[key]);
    });
    
    // Add breadcrumb for debugging
    scope.addBreadcrumb({
      message: 'Error context captured',
      level: 'error',
      data: context
    });
    
    Sentry.captureException(error);
  });
}

/**
 * Set user context for error tracking
 */
export function setUserContext(user) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username || user.display_name,
    segment: user.subscription_type || 'free'
  });
}

/**
 * Clear user context on logout
 */
export function clearUserContext() {
  Sentry.setUser(null);
}

/**
 * Add navigation breadcrumb
 */
export function addNavigationBreadcrumb(from, to) {
  Sentry.addBreadcrumb({
    message: 'Navigation',
    category: 'navigation',
    data: { from, to },
    level: 'info'
  });
}

/**
 * Add API call breadcrumb
 */
export function addApiBreadcrumb(url, method, status) {
  Sentry.addBreadcrumb({
    message: 'API Call',
    category: 'api',
    data: { url, method, status },
    level: status >= 400 ? 'error' : 'info'
  });
}

/**
 * Performance measurement utilities
 * Note: Modern Sentry versions use different transaction APIs
 */
export function startTransaction(name, operation = 'navigation') {
  // Modern Sentry versions handle transactions automatically
  console.log(`📊 Starting transaction: ${name} (${operation})`);
  return {
    name,
    operation,
    startTime: performance.now(),
    setStatus: (status) => console.log(`📊 Transaction status: ${status}`),
    finish: () => console.log(`📊 Transaction finished: ${name}`)
  };
}

export function finishTransaction(transaction, status = 'ok') {
  if (transaction) {
    transaction.setStatus(status);
    transaction.finish();
  }
}

/**
 * Higher-order component for automatic error boundary integration
 * Note: This creates a React component factory - JSX should be handled by the consumer
 */
export function withSentryErrorBoundary(Component, options = {}) {
  const fallbackComponent = ({ error, resetError }) => {
    // Return React.createElement to avoid JSX in .js file
    return React.createElement('div', {
      className: "min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center p-4"
    },
      React.createElement('div', {
        className: "bg-white/10 backdrop-blur-sm rounded-2xl p-6 max-w-md w-full text-center"
      },
        React.createElement('div', { className: "text-6xl mb-4" }, '⚠️'),
        React.createElement('h2', { 
          className: "text-2xl font-bold text-white mb-4" 
        }, 'Something went wrong'),
        React.createElement('p', { 
          className: "text-white/80 mb-6" 
        }, "We've been notified about this error and are working to fix it."),
        React.createElement('button', {
          onClick: resetError,
          className: "bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        }, 'Try Again')
      )
    );
  };

  return Sentry.withErrorBoundary(Component, {
    fallback: fallbackComponent,
    beforeCapture: (scope, error, errorInfo) => {
      scope.setTag('errorBoundary', true);
      scope.setContext('errorInfo', errorInfo);
    },
    ...options
  });
}