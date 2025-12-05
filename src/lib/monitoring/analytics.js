/**
 * Analytics Integration Module
 * Handles user behavior tracking, conversion funnel monitoring, and custom events
 */

class AnalyticsManager {
  constructor() {
    this.initialized = false;
    this.queue = [];
    this.userId = null;
    this.sessionId = this.generateSessionId();
    this.pageStartTime = Date.now();
  }

  /**
   * Initialize analytics services
   */
  init() {
    if (this.initialized) return;

    // console.log('📊 Initializing Analytics Manager');

    // Initialize Google Analytics 4
    this.initGA4();

    // Initialize custom analytics
    this.initCustomAnalytics();

    // Set up automatic event tracking
    this.setupAutoTracking();

    // Process queued events
    this.processQueue();

    this.initialized = true;
  }

  /**
   * Initialize Google Analytics 4
   */
  initGA4() {
    const gaId = import.meta.env.VITE_GA4_MEASUREMENT_ID;
    
    if (!gaId) {
      // console.warn('⚠️ Google Analytics ID not found in environment variables');
      return;
    }

    // Load gtag script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    document.head.appendChild(script);

    // Initialize gtag
    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    window.gtag = gtag;

    gtag('js', new Date());
    gtag('config', gaId, {
      // Enhanced measurement
      send_page_view: true,
      
      // Performance monitoring
      custom_map: {
        'custom_parameter_1': 'performance_metric',
        'custom_parameter_2': 'user_journey'
      },

      // Privacy settings
      anonymize_ip: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false
    });

    // console.log('✅ Google Analytics 4 initialized');
  }

  /**
   * Initialize custom analytics endpoint
   */
  initCustomAnalytics() {
    const endpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT;
    
    if (endpoint) {
      // console.log('✅ Custom analytics endpoint configured');
    }
  }

  /**
   * Set up automatic event tracking
   */
  setupAutoTracking() {
    // Page visibility tracking
    this.trackPageVisibility();
    
    // User engagement tracking
    this.trackUserEngagement();
    
    // Performance milestone tracking
    this.trackPerformanceMilestones();
    
    // Error rate tracking
    this.trackErrorRates();
    
    // Navigation tracking
    this.trackNavigation();
  }

  /**
   * Track page visibility changes
   */
  trackPageVisibility() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        const timeOnPage = Date.now() - this.pageStartTime;
        this.track('page_hide', {
          time_on_page: timeOnPage,
          page: window.location.pathname
        });
      } else {
        this.pageStartTime = Date.now();
        this.track('page_show', {
          page: window.location.pathname
        });
      }
    });
  }

  /**
   * Track user engagement metrics
   */
  trackUserEngagement() {
    let engagementScore = 0;
    let lastActivity = Date.now();

    // Track clicks
    document.addEventListener('click', (event) => {
      engagementScore += 1;
      lastActivity = Date.now();
      
      // Track specific UI elements
      const target = event.target.closest('[data-track]');
      if (target) {
        this.track('element_click', {
          element: target.dataset.track,
          element_type: target.tagName.toLowerCase(),
          page: window.location.pathname
        });
      }
    });

    // Track scroll depth
    let maxScroll = 0;
    let scrollMilestones = [25, 50, 75, 90, 100];
    let reportedMilestones = new Set();

    window.addEventListener('scroll', () => {
      const scrollPercent = Math.round(
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
      );
      
      if (scrollPercent > maxScroll) {
        maxScroll = scrollPercent;
        
        scrollMilestones.forEach(milestone => {
          if (scrollPercent >= milestone && !reportedMilestones.has(milestone)) {
            reportedMilestones.add(milestone);
            this.track('scroll_milestone', {
              milestone: milestone,
              page: window.location.pathname
            });
          }
        });
      }
      
      engagementScore += 0.1;
      lastActivity = Date.now();
    });

    // Track form interactions
    document.addEventListener('focus', (event) => {
      if (event.target.matches('input, textarea, select')) {
        this.track('form_interaction', {
          field_type: event.target.type || event.target.tagName.toLowerCase(),
          field_name: event.target.name || event.target.id,
          page: window.location.pathname
        });
        engagementScore += 2;
      }
    });

    // Report engagement score periodically
    setInterval(() => {
      if (Date.now() - lastActivity < 30000) { // Active in last 30 seconds
        this.track('user_engagement', {
          engagement_score: Math.round(engagementScore),
          session_id: this.sessionId
        });
      }
    }, 30000);
  }

  /**
   * Track performance milestones
   */
  trackPerformanceMilestones() {
    // Track when app becomes interactive
    window.addEventListener('load', () => {
      const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
      
      this.track('app_load_complete', {
        load_time: loadTime,
        dom_interactive: performance.timing.domInteractive - performance.timing.navigationStart,
        dom_content_loaded: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart
      });
    });

    // Track first meaningful interaction
    let firstInteraction = true;
    ['click', 'keydown', 'scroll', 'touchstart'].forEach(eventType => {
      document.addEventListener(eventType, () => {
        if (firstInteraction) {
          firstInteraction = false;
          const timeToFirstInteraction = Date.now() - this.pageStartTime;
          
          this.track('first_interaction', {
            time_to_interaction: timeToFirstInteraction,
            interaction_type: eventType
          });
        }
      }, { once: true });
    });
  }

  /**
   * Track error rates and types
   */
  trackErrorRates() {
    let errorCount = 0;
    let sessionErrorTypes = new Set();

    // Track JavaScript errors
    window.addEventListener('error', (event) => {
      errorCount++;
      const errorType = event.error?.name || 'Unknown';
      sessionErrorTypes.add(errorType);

      this.track('javascript_error', {
        error_message: event.message,
        error_type: errorType,
        file: event.filename,
        line: event.lineno,
        column: event.colno,
        session_error_count: errorCount
      });
    });

    // Track unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      errorCount++;
      sessionErrorTypes.add('PromiseRejection');

      this.track('promise_rejection', {
        reason: event.reason?.toString() || 'Unknown',
        session_error_count: errorCount
      });
    });

    // Report error summary periodically
    setInterval(() => {
      if (errorCount > 0) {
        this.track('session_error_summary', {
          total_errors: errorCount,
          error_types: Array.from(sessionErrorTypes),
          session_id: this.sessionId
        });
      }
    }, 60000); // Every minute
  }

  /**
   * Track navigation patterns
   */
  trackNavigation() {
    let navigationStart = Date.now();
    let currentPage = window.location.pathname;

    // Listen for navigation changes (works with React Router)
    const trackNavigation = () => {
      const newPage = window.location.pathname;
      if (newPage !== currentPage) {
        const timeOnPreviousPage = Date.now() - navigationStart;
        
        this.track('page_navigation', {
          from_page: currentPage,
          to_page: newPage,
          time_on_previous_page: timeOnPreviousPage,
          navigation_type: this.getNavigationType()
        });

        currentPage = newPage;
        navigationStart = Date.now();
        this.pageStartTime = Date.now();
      }
    };

    // Use MutationObserver to detect URL changes (for SPA)
    let lastUrl = window.location.href;
    new MutationObserver(() => {
      const url = window.location.href;
      if (url !== lastUrl) {
        lastUrl = url;
        trackNavigation();
      }
    }).observe(document, { subtree: true, childList: true });

    // Also listen for popstate (back/forward navigation)
    window.addEventListener('popstate', trackNavigation);
  }

  /**
   * Get navigation type
   */
  getNavigationType() {
    if (performance.navigation) {
      switch (performance.navigation.type) {
        case performance.navigation.TYPE_NAVIGATE:
          return 'navigate';
        case performance.navigation.TYPE_RELOAD:
          return 'reload';
        case performance.navigation.TYPE_BACK_FORWARD:
          return 'back_forward';
        default:
          return 'unknown';
      }
    }
    return 'spa_navigation';
  }

  /**
   * Track custom event
   */
  track(eventName, properties = {}) {
    const eventData = {
      event: eventName,
      properties: {
        ...properties,
        timestamp: Date.now(),
        session_id: this.sessionId,
        user_id: this.userId,
        page: window.location.pathname,
        referrer: document.referrer,
        user_agent: navigator.userAgent,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        connection: this.getConnectionInfo()
      }
    };

    if (!this.initialized) {
      this.queue.push(eventData);
      return;
    }

    // Send to Google Analytics
    this.sendToGA4(eventName, eventData.properties);

    // Send to custom endpoint
    this.sendToCustomEndpoint(eventData);

    // Disable console log spam
    // if (import.meta.env.DEV) {
    //   console.log('📊 Analytics Event:', eventName, eventData.properties);
    // }
  }

  /**
   * Send event to Google Analytics 4
   */
  sendToGA4(eventName, properties) {
    if (window.gtag) {
      // Convert properties to GA4 format
      const gaProperties = {};
      Object.keys(properties).forEach(key => {
        // GA4 has restrictions on parameter names and values
        const cleanKey = key.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
        const value = properties[key];
        
        // GA4 only accepts strings, numbers, and booleans
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          gaProperties[cleanKey] = value;
        } else if (value !== null && value !== undefined) {
          gaProperties[cleanKey] = String(value);
        }
      });

      window.gtag('event', eventName, gaProperties);
    }
  }

  /**
   * Send event to custom analytics endpoint
   */
  sendToCustomEndpoint(eventData) {
    const endpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT;
    
    if (endpoint) {
      fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
        keepalive: true // Ensure event is sent even if page unloads
      }).catch(error => {
        console.warn('Failed to send analytics event:', error);
      });
    }
  }

  /**
   * Set user context
   */
  setUser(userId, properties = {}) {
    this.userId = userId;
    
    // Set user properties in GA4
    if (window.gtag) {
      window.gtag('config', import.meta.env.VITE_GA4_MEASUREMENT_ID, {
        user_id: userId,
        custom_map: properties
      });
    }

    this.track('user_identified', {
      user_id: userId,
      ...properties
    });
  }

  /**
   * Track conversion funnel step
   */
  trackFunnelStep(funnelName, stepName, stepNumber, properties = {}) {
    this.track('funnel_step', {
      funnel_name: funnelName,
      step_name: stepName,
      step_number: stepNumber,
      ...properties
    });
  }

  /**
   * Track feature usage
   */
  trackFeatureUsage(featureName, action, properties = {}) {
    this.track('feature_usage', {
      feature_name: featureName,
      action: action,
      ...properties
    });
  }

  /**
   * Track user journey milestone
   */
  trackJourneyMilestone(milestone, properties = {}) {
    this.track('journey_milestone', {
      milestone: milestone,
      ...properties
    });
  }

  /**
   * Utility functions
   */
  generateSessionId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  getConnectionInfo() {
    if (!navigator.connection) return null;
    
    return {
      effective_type: navigator.connection.effectiveType,
      downlink: navigator.connection.downlink,
      save_data: navigator.connection.saveData
    };
  }

  processQueue() {
    this.queue.forEach(eventData => {
      this.sendToGA4(eventData.event, eventData.properties);
      this.sendToCustomEndpoint(eventData);
    });
    this.queue = [];
  }

  /**
   * Clean up before page unload
   */
  cleanup() {
    const timeOnPage = Date.now() - this.pageStartTime;
    
    this.track('session_end', {
      session_duration: timeOnPage,
      page: window.location.pathname
    });
  }
}

// Create singleton instance
export const analytics = new AnalyticsManager();

// Initialize when imported in browser
if (typeof window !== 'undefined') {
  // Initialize after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      analytics.init();
    });
  } else {
    analytics.init();
  }

  // Clean up on page unload
  window.addEventListener('beforeunload', () => {
    analytics.cleanup();
  });
}

// Export convenience functions
export const trackEvent = (eventName, properties) => analytics.track(eventName, properties);
export const setUser = (userId, properties) => analytics.setUser(userId, properties);
export const trackFunnelStep = (funnelName, stepName, stepNumber, properties) => 
  analytics.trackFunnelStep(funnelName, stepName, stepNumber, properties);
export const trackFeature = (featureName, action, properties) => 
  analytics.trackFeatureUsage(featureName, action, properties);
export const trackJourney = (milestone, properties) => 
  analytics.trackJourneyMilestone(milestone, properties);