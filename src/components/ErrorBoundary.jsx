import React from 'react';
import * as Sentry from '@sentry/react';
import { captureError, addNavigationBreadcrumb } from '../lib/monitoring/sentry.js';

/**
 * Enhanced Error Boundary with Sentry integration and user feedback
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null,
      feedbackSent: false
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Create comprehensive error context
    const errorContext = {
      component: this.props.name || 'ErrorBoundary',
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      connection: this.getConnectionInfo(),
      memory: this.getMemoryInfo(),
      componentStack: errorInfo.componentStack,
      isMobile: this.isMobileDevice(),
      props: this.sanitizeProps(this.props),
      state: this.sanitizeState(),
      route: window.location.pathname,
      userTiming: this.getUserTiming()
    };

    // Capture error with context
    const eventId = captureError(error, errorContext);
    
    this.setState({
      error: error,
      errorInfo: errorInfo,
      eventId: eventId
    });

    // Track error recovery attempts
    addNavigationBreadcrumb('error_boundary', 'error_occurred');

    // Analytics tracking
    this.trackErrorEvent(error, errorContext);
  }

  getConnectionInfo() {
    if (!navigator.connection) return null;
    
    return {
      effectiveType: navigator.connection.effectiveType,
      downlink: navigator.connection.downlink,
      rtt: navigator.connection.rtt,
      saveData: navigator.connection.saveData
    };
  }

  getMemoryInfo() {
    if (!performance.memory) return null;
    
    return {
      used: Math.round(performance.memory.usedJSHeapSize / 1048576),
      total: Math.round(performance.memory.totalJSHeapSize / 1048576),
      limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576)
    };
  }

  isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  sanitizeProps(props) {
    // Remove sensitive data from props
    const sanitized = { ...props };
    delete sanitized.children;
    delete sanitized.token;
    delete sanitized.apiKey;
    delete sanitized.password;
    return sanitized;
  }

  sanitizeState() {
    // Get parent component state if available
    try {
      const parentComponent = this._reactInternalInstance?.return?.stateNode;
      if (parentComponent && parentComponent.state) {
        const sanitized = { ...parentComponent.state };
        delete sanitized.password;
        delete sanitized.token;
        delete sanitized.apiKey;
        return sanitized;
      }
    } catch (e) {
      // Ignore errors in state extraction
    }
    return null;
  }

  getUserTiming() {
    if (!performance.getEntriesByType) return null;
    
    const marks = performance.getEntriesByType('mark').slice(-5);
    const measures = performance.getEntriesByType('measure').slice(-5);
    
    return {
      recentMarks: marks.map(mark => ({ name: mark.name, time: mark.startTime })),
      recentMeasures: measures.map(measure => ({ 
        name: measure.name, 
        duration: measure.duration,
        time: measure.startTime 
      }))
    };
  }

  trackErrorEvent(error, context) {
    // Google Analytics
    if (window.gtag) {
      window.gtag('event', 'exception', {
        description: error.toString(),
        fatal: false,
        custom_map: {
          component: context.component,
          route: context.route,
          isMobile: context.isMobile
        }
      });
    }

    // Custom analytics
    if (window.analytics && window.analytics.track) {
      window.analytics.track('Error Occurred', {
        error: error.message,
        component: context.component,
        route: context.route,
        isMobile: context.isMobile,
        userAgent: context.userAgent
      });
    }
  }

  handleRetry = () => {
    console.log('🔄 Error boundary retry attempted');
    
    // Track retry attempt
    addNavigationBreadcrumb('error_boundary', 'retry_attempted');
    
    if (window.gtag) {
      window.gtag('event', 'error_boundary_retry', {
        event_category: 'error_recovery',
        event_label: this.props.name || 'unnamed'
      });
    }

    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null, 
      eventId: null,
      feedbackSent: false 
    });
  };

  handleReload = () => {
    console.log('🔄 Error boundary reload requested');
    
    addNavigationBreadcrumb('error_boundary', 'reload_requested');
    
    if (window.gtag) {
      window.gtag('event', 'error_boundary_reload', {
        event_category: 'error_recovery',
        event_label: this.props.name || 'unnamed'
      });
    }

    window.location.reload();
  };

  handleGoHome = () => {
    console.log('🏠 Error boundary home navigation');
    
    addNavigationBreadcrumb('error_boundary', 'home_navigation');
    
    if (window.gtag) {
      window.gtag('event', 'error_boundary_home', {
        event_category: 'error_recovery',
        event_label: this.props.name || 'unnamed'
      });
    }

    window.location.href = '/dashboard';
  };

  handleSendFeedback = () => {
    if (this.state.eventId) {
      // Show Sentry user feedback dialog
      Sentry.showReportDialog({ eventId: this.state.eventId });
      this.setState({ feedbackSent: true });
    }
  };

  renderFallback() {
    const { hasError, error, eventId, feedbackSent } = this.state;
    const { fallback, name = 'Component' } = this.props;

    // Use custom fallback if provided
    if (fallback) {
      return fallback(error, this.handleRetry, this.handleReload);
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-orange-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 max-w-2xl w-full text-center shadow-2xl border border-white/20">
          {/* Error Icon */}
          <div className="text-8xl mb-6 animate-pulse">⚠️</div>
          
          {/* Error Title */}
          <h1 className="text-3xl font-bold text-white mb-4">
            Something went wrong
          </h1>
          
          {/* Error Description */}
          <p className="text-white/90 mb-6 text-lg">
            {name} encountered an unexpected error. Our team has been notified and is working on a fix.
          </p>

          {/* Error Details (Development only) */}
          {process.env.NODE_ENV === 'development' && error && (
            <div className="bg-black/30 rounded-xl p-4 mb-6 text-left">
              <h3 className="text-white font-semibold mb-2">Error Details (Dev Mode):</h3>
              <code className="text-red-300 text-sm break-all">
                {error.toString()}
              </code>
            </div>
          )}

          {/* Event ID Display */}
          {eventId && (
            <div className="bg-blue-500/20 rounded-lg p-3 mb-6">
              <p className="text-blue-200 text-sm">
                Event ID: <code className="bg-blue-500/30 px-2 py-1 rounded">{eventId}</code>
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={this.handleRetry}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors shadow-lg"
            >
              Try Again
            </button>
            
            <button
              onClick={this.handleReload}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors shadow-lg"
            >
              Reload Page
            </button>
            
            <button
              onClick={this.handleGoHome}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors shadow-lg"
            >
              Go Home
            </button>
          </div>

          {/* Feedback Button */}
          {eventId && !feedbackSent && (
            <div className="mt-6">
              <button
                onClick={this.handleSendFeedback}
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Send Feedback
              </button>
            </div>
          )}

          {feedbackSent && (
            <div className="mt-4 text-green-300 text-sm">
              ✅ Feedback sent. Thank you for helping us improve!
            </div>
          )}

          {/* Recovery Tips */}
          <div className="mt-8 text-left bg-white/5 rounded-xl p-4">
            <h4 className="text-white font-semibold mb-2">💡 Recovery Tips:</h4>
            <ul className="text-white/80 text-sm space-y-1">
              <li>• Check your internet connection</li>
              <li>• Clear browser cache and cookies</li>
              <li>• Try refreshing the page</li>
              <li>• Use a different browser or device</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  render() {
    if (this.state.hasError) {
      return this.renderFallback();
    }

    return this.props.children;
  }
}

// Higher-Order Component wrapper
export const withErrorBoundary = (Component, options = {}) => {
  const WrappedComponent = (props) => (
    <ErrorBoundary name={options.name || Component.displayName || Component.name} {...options}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

export default ErrorBoundary;