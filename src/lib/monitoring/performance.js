import * as Sentry from '@sentry/react';

/**
 * Performance monitoring configuration and utilities
 */
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.initialized = false;
    this.vitalsCollected = false;
  }

  /**
   * Initialize performance monitoring
   */
  async init() {
    if (this.initialized) return;
    
    // console.log('🚀 Initializing Performance Monitor');
    
    // Initialize Web Vitals collection
    await this.initWebVitals();
    
    // Initialize custom performance tracking
    this.initCustomMetrics();
    
    // Track navigation timing
    this.trackNavigationTiming();
    
    // Track resource timing
    this.trackResourceTiming();
    
    this.initialized = true;
  }

  /**
   * Initialize Core Web Vitals tracking
   */
  async initWebVitals() {
    if (this.vitalsCollected) return;

    try {
      // Dynamic import to avoid build issues and prevent double imports
      const { onCLS, onINP, onFCP, onLCP, onTTFB } = await import('web-vitals');

      // Largest Contentful Paint (LCP)
      onLCP((metric) => {
        this.reportVital('LCP', metric);
        this.sendToAnalytics('web_vital_lcp', metric.value);
      });

      // Interaction to Next Paint (INP) - replaces FID in modern web-vitals
      onINP((metric) => {
        this.reportVital('INP', metric);
        this.sendToAnalytics('web_vital_inp', metric.value);
      });

      // Cumulative Layout Shift (CLS)
      onCLS((metric) => {
        this.reportVital('CLS', metric);
        this.sendToAnalytics('web_vital_cls', metric.value);
      });

      // First Contentful Paint (FCP)
      onFCP((metric) => {
        this.reportVital('FCP', metric);
        this.sendToAnalytics('web_vital_fcp', metric.value);
      });

      // Time to First Byte (TTFB)
      onTTFB((metric) => {
        this.reportVital('TTFB', metric);
        this.sendToAnalytics('web_vital_ttfb', metric.value);
      });

      this.vitalsCollected = true;
    } catch (error) {
      console.warn('Failed to initialize Web Vitals:', error);
    }
  }

  /**
   * Report Web Vital to Sentry
   */
  reportVital(name, metric) {
    // Determine if the metric is good, needs improvement, or poor
    const rating = this.getVitalRating(name, metric.value);
    
    // console.log(`📊 Web Vital - ${name}: ${metric.value}ms (${rating})`);

    // Send to Sentry as custom metric
    Sentry.addBreadcrumb({
      message: `Web Vital: ${name}`,
      category: 'performance',
      data: {
        value: metric.value,
        rating: rating,
        id: metric.id,
        delta: metric.delta
      },
      level: rating === 'poor' ? 'warning' : 'info'
    });

    // Store metric for later analysis
    this.metrics.set(name, {
      value: metric.value,
      rating: rating,
      timestamp: Date.now()
    });

    // Alert on poor performance
    if (rating === 'poor') {
      this.alertPoorPerformance(name, metric.value);
    }
  }

  /**
   * Get performance rating based on Web Vitals thresholds
   */
  getVitalRating(name, value) {
    const thresholds = {
      LCP: { good: 2500, poor: 4000 },
      INP: { good: 200, poor: 500 },
      CLS: { good: 0.1, poor: 0.25 },
      FCP: { good: 1800, poor: 3000 },
      TTFB: { good: 800, poor: 1800 }
    };

    const threshold = thresholds[name];
    if (!threshold) return 'unknown';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }

  /**
   * Initialize custom performance metrics
   */
  initCustomMetrics() {
    // Track component mount times
    this.trackComponentMounts();
    
    // Track API response times
    this.trackApiPerformance();
    
    // Track memory usage
    this.trackMemoryUsage();
    
    // Track bundle size impact
    this.trackBundleMetrics();
  }

  /**
   * Track component mount performance
   */
  trackComponentMounts() {
    if (!window.performance || !window.performance.mark) return;

    // Environment-based thresholds
    const isDevelopment = import.meta.env.DEV;
    const threshold = isDevelopment ? 1000 : 100; // 1s in dev, 100ms in prod
    
    // Rate limiting for console logs
    let lastLogTime = 0;
    const logCooldown = 5000; // 5 seconds between console logs

    // Create a global hook for React DevTools (if available)
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
      
      // Track fiber mounts (React internal structure)
      const originalOnCommitFiberRoot = hook.onCommitFiberRoot;
      hook.onCommitFiberRoot = (id, root, ...args) => {
        const mountTime = performance.now();
        
        // Only log truly slow mounts with rate limiting
        if (mountTime > threshold) {
          const now = Date.now();
          
          // Send to analytics regardless of console logging
          this.sendToAnalytics('slow_component_mount', mountTime);
          
          // Disable console logs in production and for development spam reduction
          // if (now - lastLogTime > logCooldown) {
          //   console.warn(`🐌 Slow component mount: ${mountTime.toFixed(2)}ms (threshold: ${threshold}ms)`);
          //   lastLogTime = now;
          // }
        }
        
        return originalOnCommitFiberRoot?.(id, root, ...args);
      };
    }
  }

  /**
   * Track API response times and failures
   */
  trackApiPerformance() {
    // Intercept fetch calls
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const startTime = performance.now();
      const url = args[0];
      
      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        // Log only slow API calls to reduce spam
        if (duration > 2000) {
          console.log(`🌐 Slow API ${response.status}: ${url} (${duration.toFixed(2)}ms)`);
        }
        
        this.sendToAnalytics('api_response_time', duration, {
          url: this.cleanUrl(url),
          status: response.status,
          method: args[1]?.method || 'GET'
        });

        // Alert on slow APIs
        if (duration > 5000) {
          this.alertSlowApi(url, duration);
        }

        return response;
      } catch (error) {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        console.error(`❌ API Error: ${url} (${duration.toFixed(2)}ms)`, error);
        
        this.sendToAnalytics('api_error', duration, {
          url: this.cleanUrl(url),
          error: error.message
        });

        throw error;
      }
    };
  }

  /**
   * Track memory usage patterns
   */
  trackMemoryUsage() {
    if (!performance.memory) return;

    const checkMemory = () => {
      const memory = performance.memory;
      const memoryMB = {
        used: Math.round(memory.usedJSHeapSize / 1048576),
        total: Math.round(memory.totalJSHeapSize / 1048576),
        limit: Math.round(memory.jsHeapSizeLimit / 1048576)
      };

      // Only log memory when usage is high to reduce spam
      if (memoryMB.used / memoryMB.limit > 0.5) {
        console.log(`💾 Memory: ${memoryMB.used}/${memoryMB.total}MB (limit: ${memoryMB.limit}MB)`);
      }

      this.sendToAnalytics('memory_usage', memoryMB.used, {
        total: memoryMB.total,
        limit: memoryMB.limit,
        usage_ratio: memoryMB.used / memoryMB.total
      });

      // Alert on high memory usage
      if (memoryMB.used / memoryMB.limit > 0.8) {
        this.alertHighMemory(memoryMB);
      }
    };

    // Check memory every 30 seconds
    setInterval(checkMemory, 30000);
    
    // Initial check
    checkMemory();
  }

  /**
   * Track bundle size and loading metrics
   */
  trackBundleMetrics() {
    window.addEventListener('load', () => {
      // Calculate total bundle size from resource timing
      const resources = performance.getEntriesByType('resource');
      
      let totalBundleSize = 0;
      let jsSize = 0;
      let cssSize = 0;
      
      resources.forEach(resource => {
        if (resource.transferSize) {
          totalBundleSize += resource.transferSize;
          
          if (resource.name.endsWith('.js')) {
            jsSize += resource.transferSize;
          } else if (resource.name.endsWith('.css')) {
            cssSize += resource.transferSize;
          }
        }
      });

      const bundleMetrics = {
        total: Math.round(totalBundleSize / 1024), // KB
        javascript: Math.round(jsSize / 1024),
        css: Math.round(cssSize / 1024)
      };

      // Only log bundle metrics in development
      if (import.meta.env.DEV) {
        console.log(`📦 Bundle Size: ${bundleMetrics.total}KB (JS: ${bundleMetrics.javascript}KB, CSS: ${bundleMetrics.css}KB)`);
      }

      this.sendToAnalytics('bundle_size', bundleMetrics.total, bundleMetrics);
    });
  }

  /**
   * Track navigation timing
   */
  trackNavigationTiming() {
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0];
      
      if (navigation) {
        const metrics = {
          domContentLoaded: Math.round(navigation.domContentLoadedEventEnd - navigation.navigationStart),
          fullyLoaded: Math.round(navigation.loadEventEnd - navigation.navigationStart),
          domInteractive: Math.round(navigation.domInteractive - navigation.navigationStart),
          requestStart: Math.round(navigation.requestStart - navigation.navigationStart)
        };

        // Only log navigation timing in development
        if (import.meta.env.DEV) {
          console.log('⏱️ Navigation Timing:', metrics);
        }
        
        Object.entries(metrics).forEach(([key, value]) => {
          this.sendToAnalytics(`navigation_${key}`, value);
        });
      }
    });
  }

  /**
   * Track resource timing for critical assets
   */
  trackResourceTiming() {
    window.addEventListener('load', () => {
      const resources = performance.getEntriesByType('resource');
      
      resources.forEach(resource => {
        // Focus on critical resources
        if (resource.name.includes('chunk') || resource.name.includes('main') || 
            resource.name.endsWith('.js') || resource.name.endsWith('.css')) {
          
          const timing = {
            duration: Math.round(resource.duration),
            size: resource.transferSize || 0,
            type: this.getResourceType(resource.name)
          };

          if (timing.duration > 1000) { // Log slow resources
            console.warn(`🐌 Slow Resource: ${resource.name} (${timing.duration}ms)`);
          }

          this.sendToAnalytics('resource_timing', timing.duration, {
            resource: this.cleanUrl(resource.name),
            ...timing
          });
        }
      });
    });
  }

  /**
   * Alert on poor performance metrics
   */
  alertPoorPerformance(metric, value) {
    console.warn(`⚠️ Poor Performance Alert: ${metric} = ${value}`);
    
    Sentry.captureMessage(`Poor Web Vital: ${metric}`, 'warning', scope => {
      scope.setTag('performance_issue', true);
      scope.setContext('metric', { name: metric, value, rating: 'poor' });
    });
  }

  /**
   * Alert on slow API calls
   */
  alertSlowApi(url, duration) {
    console.warn(`⚠️ Slow API Alert: ${url} took ${duration.toFixed(2)}ms`);
    
    Sentry.captureMessage('Slow API Response', 'warning', scope => {
      scope.setTag('api_performance', true);
      scope.setContext('api_call', { url: this.cleanUrl(url), duration });
    });
  }

  /**
   * Alert on high memory usage
   */
  alertHighMemory(memoryInfo) {
    console.warn(`⚠️ High Memory Usage: ${memoryInfo.used}MB / ${memoryInfo.limit}MB`);
    
    Sentry.captureMessage('High Memory Usage', 'warning', scope => {
      scope.setTag('memory_issue', true);
      scope.setContext('memory', memoryInfo);
    });
  }

  /**
   * Send metrics to analytics services
   */
  sendToAnalytics(eventName, value, additionalData = {}) {
    // Google Analytics 4
    if (window.gtag) {
      window.gtag('event', eventName, {
        value: value,
        ...additionalData
      });
    }

    // Custom analytics endpoint (if available)
    if (import.meta.env.VITE_ANALYTICS_ENDPOINT) {
      fetch(import.meta.env.VITE_ANALYTICS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: eventName,
          value: value,
          timestamp: Date.now(),
          url: window.location.pathname,
          userAgent: navigator.userAgent,
          ...additionalData
        })
      }).catch(err => console.warn('Analytics send failed:', err));
    }
  }

  /**
   * Utility functions
   */
  cleanUrl(url) {
    try {
      const urlObj = new URL(url, window.location.origin);
      return urlObj.pathname;
    } catch {
      return url.split('?')[0]; // Remove query params
    }
  }

  getResourceType(url) {
    if (url.endsWith('.js')) return 'javascript';
    if (url.endsWith('.css')) return 'stylesheet';
    if (url.includes('chunk')) return 'chunk';
    if (url.includes('font')) return 'font';
    if (url.match(/\.(png|jpg|jpeg|gif|svg|webp|avif)$/)) return 'image';
    return 'other';
  }

  /**
   * Get current performance summary
   */
  getPerformanceSummary() {
    return {
      webVitals: Object.fromEntries(this.metrics),
      memory: performance.memory ? {
        used: Math.round(performance.memory.usedJSHeapSize / 1048576),
        total: Math.round(performance.memory.totalJSHeapSize / 1048576)
      } : null,
      connection: navigator.connection ? {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink
      } : null
    };
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Auto-initialize when imported
if (typeof window !== 'undefined') {
  // Delay initialization until after app loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      performanceMonitor.init().catch(console.error);
    });
  } else {
    performanceMonitor.init().catch(console.error);
  }
}