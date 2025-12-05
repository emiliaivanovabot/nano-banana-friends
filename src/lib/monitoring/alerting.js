/**
 * Alerting System for Error Rates and Performance Degradation
 * Monitors application health and sends alerts when thresholds are exceeded
 */

class AlertingSystem {
  constructor() {
    this.initialized = false;
    this.metrics = new Map();
    this.alerts = new Map();
    this.thresholds = this.getDefaultThresholds();
    this.alertHistory = [];
    this.lastAlertTime = new Map();
    this.alertCooldown = 300000; // 5 minutes
  }

  /**
   * Initialize the alerting system
   */
  init() {
    if (this.initialized) return;

    // console.log('🚨 Initializing Alerting System');

    // Start monitoring loops
    this.startErrorRateMonitoring();
    this.startPerformanceMonitoring();
    this.startHealthChecks();
    this.startMemoryMonitoring();
    this.startApiMonitoring();

    // Set up periodic cleanup
    this.startCleanupTimer();

    this.initialized = true;
  }

  /**
   * Default alerting thresholds
   */
  getDefaultThresholds() {
    return {
      // Error rates (errors per minute)
      errorRate: {
        warning: 5,
        critical: 10
      },
      
      // Performance metrics (milliseconds)
      performance: {
        lcp: { warning: 2500, critical: 4000 },
        inp: { warning: 200, critical: 500 },
        cls: { warning: 0.1, critical: 0.25 },
        apiResponse: { warning: 2000, critical: 5000 }
      },

      // Memory usage (MB)
      memory: {
        warning: 100,
        critical: 200
      },

      // API failure rate (%)
      apiFailureRate: {
        warning: 10,
        critical: 25
      },

      // Network error rate (%)
      networkErrorRate: {
        warning: 15,
        critical: 30
      }
    };
  }

  /**
   * Monitor error rates
   */
  startErrorRateMonitoring() {
    let errorCount = 0;
    let errorWindow = [];
    const windowSize = 60000; // 1 minute

    // Track errors
    const trackError = (error, source) => {
      const timestamp = Date.now();
      errorCount++;
      errorWindow.push({ timestamp, error, source });

      // Clean old errors from window
      errorWindow = errorWindow.filter(e => timestamp - e.timestamp < windowSize);

      // Check thresholds
      const errorsPerMinute = errorWindow.length;
      this.checkThreshold('errorRate', errorsPerMinute, {
        details: `${errorsPerMinute} errors in the last minute`,
        recentErrors: errorWindow.slice(-3).map(e => ({
          message: e.error.message || e.error,
          source: e.source
        }))
      });
    };

    // Listen for JavaScript errors
    window.addEventListener('error', (event) => {
      trackError(event.error || event.message, 'javascript');
    });

    // Listen for promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      trackError(event.reason, 'promise');
    });

    // Periodic error rate check
    setInterval(() => {
      const now = Date.now();
      errorWindow = errorWindow.filter(e => now - e.timestamp < windowSize);
      const currentRate = errorWindow.length;
      
      this.updateMetric('errorRate', currentRate);
    }, 10000); // Check every 10 seconds
  }

  /**
   * Monitor performance metrics
   */
  startPerformanceMonitoring() {
    // Monitor Web Vitals - import dynamically to avoid build issues
    import('web-vitals').then(({ onCLS, onINP, onLCP }) => {
      onLCP((metric) => {
        this.checkThreshold('performance.lcp', metric.value, {
          details: `LCP: ${metric.value}ms`,
          rating: this.getPerformanceRating('lcp', metric.value)
        });
      });

      onINP((metric) => {
        this.checkThreshold('performance.inp', metric.value, {
          details: `INP: ${metric.value}ms`,
          rating: this.getPerformanceRating('inp', metric.value)
        });
      });

      onCLS((metric) => {
        this.checkThreshold('performance.cls', metric.value, {
          details: `CLS: ${metric.value}`,
          rating: this.getPerformanceRating('cls', metric.value)
        });
      });
    });

    // Monitor custom performance metrics
    const monitorResourceTiming = () => {
      if (!performance.getEntriesByType) return;

      const resources = performance.getEntriesByType('resource');
      const slowResources = resources.filter(resource => resource.duration > 3000);

      if (slowResources.length > 0) {
        this.createAlert('performance', 'warning', {
          message: `${slowResources.length} slow resources detected`,
          details: slowResources.map(r => ({
            url: r.name.split('?')[0],
            duration: Math.round(r.duration)
          })).slice(0, 5)
        });
      }
    };

    // Check resource performance every 30 seconds
    setInterval(monitorResourceTiming, 30000);
  }

  /**
   * Monitor API health
   */
  startApiMonitoring() {
    let apiCalls = [];
    let failedCalls = [];
    const windowSize = 300000; // 5 minutes

    // Intercept fetch calls
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      const url = args[0];

      try {
        const response = await originalFetch(...args);
        const duration = performance.now() - startTime;
        
        apiCalls.push({ 
          timestamp: Date.now(), 
          duration, 
          url: this.cleanUrl(url), 
          status: response.status,
          success: response.ok
        });

        if (!response.ok) {
          failedCalls.push({ 
            timestamp: Date.now(), 
            url: this.cleanUrl(url), 
            status: response.status 
          });
        }

        // Check API response time threshold
        this.checkThreshold('performance.apiResponse', duration, {
          details: `API ${response.status}: ${this.cleanUrl(url)} (${Math.round(duration)}ms)`
        });

        return response;
      } catch (error) {
        const duration = performance.now() - startTime;
        
        apiCalls.push({ 
          timestamp: Date.now(), 
          duration, 
          url: this.cleanUrl(url), 
          success: false 
        });
        failedCalls.push({ 
          timestamp: Date.now(), 
          url: this.cleanUrl(url), 
          error: error.message 
        });

        throw error;
      }
    };

    // Periodic API health check
    setInterval(() => {
      const now = Date.now();
      
      // Clean old data
      apiCalls = apiCalls.filter(call => now - call.timestamp < windowSize);
      failedCalls = failedCalls.filter(call => now - call.timestamp < windowSize);

      // Calculate failure rate
      const totalCalls = apiCalls.length;
      const failureRate = totalCalls > 0 ? (failedCalls.length / totalCalls) * 100 : 0;

      this.checkThreshold('apiFailureRate', failureRate, {
        details: `${failedCalls.length}/${totalCalls} API calls failed (${failureRate.toFixed(1)}%)`,
        recentFailures: failedCalls.slice(-3)
      });

      this.updateMetric('apiFailureRate', failureRate);
    }, 30000);
  }

  /**
   * Monitor memory usage
   */
  startMemoryMonitoring() {
    if (!performance.memory) return;

    const checkMemory = () => {
      const memory = performance.memory;
      const usedMB = Math.round(memory.usedJSHeapSize / 1048576);
      const totalMB = Math.round(memory.totalJSHeapSize / 1048576);
      const limitMB = Math.round(memory.jsHeapSizeLimit / 1048576);

      this.checkThreshold('memory', usedMB, {
        details: `Memory usage: ${usedMB}/${totalMB}MB (limit: ${limitMB}MB)`,
        usage: { used: usedMB, total: totalMB, limit: limitMB }
      });

      this.updateMetric('memoryUsage', usedMB);
    };

    // Check memory every 30 seconds
    setInterval(checkMemory, 30000);
    checkMemory(); // Initial check
  }

  /**
   * Monitor general application health
   */
  startHealthChecks() {
    const checkHealth = () => {
      const checks = [];

      // Check if main features are working
      checks.push(this.checkDOMHealth());
      checks.push(this.checkNetworkHealth());
      checks.push(this.checkLocalStorageHealth());

      const failedChecks = checks.filter(check => !check.passed);

      if (failedChecks.length > 0) {
        this.createAlert('health', 'warning', {
          message: `${failedChecks.length} health checks failed`,
          details: failedChecks.map(check => check.name)
        });
      }
    };

    // Run health checks every 2 minutes
    setInterval(checkHealth, 120000);
    
    // Initial health check after 10 seconds
    setTimeout(checkHealth, 10000);
  }

  /**
   * Check specific thresholds
   */
  checkThreshold(metricName, value, context = {}) {
    const threshold = this.getThreshold(metricName);
    if (!threshold) return;

    let alertLevel = null;
    
    if (value >= threshold.critical) {
      alertLevel = 'critical';
    } else if (value >= threshold.warning) {
      alertLevel = 'warning';
    }

    if (alertLevel) {
      this.createAlert(metricName, alertLevel, {
        message: `${metricName} threshold exceeded: ${value}`,
        threshold: threshold,
        value: value,
        ...context
      });
    }
  }

  /**
   * Create and send alert
   */
  createAlert(type, level, data) {
    const alertKey = `${type}_${level}`;
    const lastAlert = this.lastAlertTime.get(alertKey);
    const now = Date.now();

    // Check cooldown to avoid spam
    if (lastAlert && (now - lastAlert) < this.alertCooldown) {
      return;
    }

    const alert = {
      id: this.generateAlertId(),
      type: type,
      level: level,
      timestamp: now,
      message: data.message,
      details: data.details || {},
      context: {
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        sessionId: this.getSessionId()
      }
    };

    this.alertHistory.push(alert);
    this.lastAlertTime.set(alertKey, now);

    // Send alert to various channels
    this.sendAlert(alert);

    console.warn(`🚨 ${level.toUpperCase()} ALERT:`, alert.message, alert.details);
  }

  /**
   * Send alert to configured channels
   */
  sendAlert(alert) {
    // Send to Sentry
    if (window.Sentry) {
      window.Sentry.addBreadcrumb({
        message: alert.message,
        category: 'alert',
        level: alert.level === 'critical' ? 'error' : 'warning',
        data: alert.details
      });

      if (alert.level === 'critical') {
        window.Sentry.captureMessage(`Critical Alert: ${alert.message}`, 'error');
      }
    }

    // Send to analytics
    if (window.gtag) {
      window.gtag('event', 'alert_triggered', {
        alert_type: alert.type,
        alert_level: alert.level,
        alert_message: alert.message
      });
    }

    // Send to webhook (if configured)
    const webhookUrl = import.meta.env.VITE_ALERT_WEBHOOK_URL;
    if (webhookUrl) {
      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alert)
      }).catch(err => console.warn('Failed to send webhook alert:', err));
    }

    // Browser notification for critical alerts (if permission granted)
    if (alert.level === 'critical' && Notification.permission === 'granted') {
      new Notification(`Critical Alert: ${alert.type}`, {
        body: alert.message,
        icon: '/favicon.ico',
        tag: alert.type
      });
    }
  }

  /**
   * Health check functions
   */
  checkDOMHealth() {
    try {
      const elements = document.querySelectorAll('*');
      return {
        name: 'DOM Health',
        passed: elements.length > 0,
        details: `${elements.length} DOM elements`
      };
    } catch (error) {
      return {
        name: 'DOM Health',
        passed: false,
        details: `DOM access failed: ${error.message}`
      };
    }
  }

  checkNetworkHealth() {
    try {
      const online = navigator.onLine;
      const connection = navigator.connection;
      
      return {
        name: 'Network Health',
        passed: online,
        details: {
          online,
          effectiveType: connection?.effectiveType,
          downlink: connection?.downlink
        }
      };
    } catch (error) {
      return {
        name: 'Network Health',
        passed: false,
        details: `Network check failed: ${error.message}`
      };
    }
  }

  checkLocalStorageHealth() {
    try {
      const testKey = '_health_check_test';
      localStorage.setItem(testKey, 'test');
      const value = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      
      return {
        name: 'LocalStorage Health',
        passed: value === 'test',
        details: 'LocalStorage read/write test'
      };
    } catch (error) {
      return {
        name: 'LocalStorage Health',
        passed: false,
        details: `LocalStorage failed: ${error.message}`
      };
    }
  }

  /**
   * Utility functions
   */
  getThreshold(metricName) {
    const path = metricName.split('.');
    let current = this.thresholds;
    
    for (const key of path) {
      if (current[key] === undefined) return null;
      current = current[key];
    }
    
    return current;
  }

  updateMetric(name, value) {
    this.metrics.set(name, {
      value,
      timestamp: Date.now()
    });
  }

  getPerformanceRating(metric, value) {
    const thresholds = this.thresholds.performance[metric];
    if (!thresholds) return 'unknown';
    
    if (value <= thresholds.warning) return 'good';
    if (value <= thresholds.critical) return 'needs-improvement';
    return 'poor';
  }

  cleanUrl(url) {
    try {
      const urlObj = new URL(url, window.location.origin);
      return urlObj.pathname;
    } catch {
      return url.split('?')[0];
    }
  }

  generateAlertId() {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getSessionId() {
    let sessionId = sessionStorage.getItem('monitoring_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('monitoring_session_id', sessionId);
    }
    return sessionId;
  }

  startCleanupTimer() {
    // Clean old data every 10 minutes
    setInterval(() => {
      const oneHourAgo = Date.now() - 3600000;
      
      // Clean alert history
      this.alertHistory = this.alertHistory.filter(alert => alert.timestamp > oneHourAgo);
      
      // Clean metrics
      for (const [key, metric] of this.metrics.entries()) {
        if (metric.timestamp < oneHourAgo) {
          this.metrics.delete(key);
        }
      }
    }, 600000);
  }

  /**
   * Get current system status
   */
  getStatus() {
    return {
      alerts: this.alertHistory.slice(-10),
      metrics: Object.fromEntries(this.metrics),
      thresholds: this.thresholds,
      lastCheck: Date.now()
    };
  }

  /**
   * Set custom thresholds
   */
  setThresholds(customThresholds) {
    this.thresholds = { ...this.thresholds, ...customThresholds };
  }
}

// Create singleton instance
export const alertingSystem = new AlertingSystem();

// Auto-initialize
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      alertingSystem.init();
    });
  } else {
    alertingSystem.init();
  }
}