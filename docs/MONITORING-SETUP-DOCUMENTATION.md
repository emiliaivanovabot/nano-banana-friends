# 🚀 Nano Banana Friends - Monitoring Infrastructure Documentation

## Overview

This document provides comprehensive information about the monitoring and error tracking infrastructure implemented for the nano-banana-friends application. The system provides real-time monitoring, error tracking, performance analysis, and user behavior analytics.

## 📊 Monitoring Stack

### Core Components

1. **Sentry** - Error tracking and performance monitoring
2. **Web Vitals** - Core Web Vitals performance tracking (LCP, INP, CLS, FCP, TTFB)
3. **Google Analytics 4** - User behavior and conversion tracking
4. **Custom Analytics** - Application-specific metrics and events
5. **Alerting System** - Real-time alerts for critical issues

### Performance Metrics

- **LCP (Largest Contentful Paint)** - Loading performance
- **INP (Interaction to Next Paint)** - Interactivity performance (replaces FID)
- **CLS (Cumulative Layout Shift)** - Visual stability
- **FCP (First Contentful Paint)** - Loading perception
- **TTFB (Time to First Byte)** - Server response time

## 🔧 Implementation Details

### File Structure

```
src/lib/monitoring/
├── index.js           # Main monitoring entry point
├── sentry.js          # Sentry error tracking configuration
├── performance.js     # Web Vitals and performance monitoring
├── analytics.js       # User behavior analytics
└── alerting.js        # Real-time alerting system
```

### Key Features

#### Error Tracking
- **Automatic error capture** with Sentry integration
- **Enhanced error boundaries** with user feedback
- **Context-rich error reports** including user agent, viewport, memory usage
- **Error rate monitoring** with automatic alerts
- **Source map support** for debugging production errors

#### Performance Monitoring
- **Real-time Web Vitals tracking** with performance ratings
- **API response time monitoring** with slow request alerts
- **Memory usage tracking** with leak detection
- **Resource timing analysis** for optimization insights
- **Navigation performance** tracking

#### User Analytics
- **Page view tracking** with engagement metrics
- **Feature usage analytics** for product insights
- **User journey mapping** with conversion funnels
- **Scroll depth tracking** for content engagement
- **Form interaction monitoring** for UX optimization

#### Alerting System
- **Configurable thresholds** for performance and error rates
- **Multi-channel alerts** (console, Sentry, webhooks)
- **Alert cooldowns** to prevent notification spam
- **Health checks** for core application functionality
- **Browser notifications** for critical issues

## 🔑 Environment Configuration

### Required Environment Variables

```bash
# Error Tracking & Performance
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
VITE_ENABLE_SENTRY=false  # Set to true for development testing
VITE_APP_VERSION=1.0.0

# Analytics
VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_ANALYTICS_ENDPOINT=https://analytics.yourdomain.com/events  # Optional

# Alerting
VITE_ALERT_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK  # Optional

# Monitoring Control
VITE_DEBUG_MONITORING=false
VITE_DISABLE_MONITORING=false
```

### Performance Thresholds (Optional)

```bash
# Error rate alerts (errors per minute)
VITE_ERROR_RATE_WARNING=5
VITE_ERROR_RATE_CRITICAL=10

# Performance thresholds (milliseconds)
VITE_LCP_WARNING=2500
VITE_LCP_CRITICAL=4000
VITE_INP_WARNING=200
VITE_INP_CRITICAL=500

# Memory usage thresholds (MB)
VITE_MEMORY_WARNING=100
VITE_MEMORY_CRITICAL=200

# API failure rate thresholds (percentage)
VITE_API_FAILURE_WARNING=10
VITE_API_FAILURE_CRITICAL=25
```

## 🚀 Setup Instructions

### 1. Install Dependencies

Dependencies are already installed:
- `@sentry/react` - Error tracking
- `@sentry/tracing` - Performance monitoring
- `web-vitals` - Core Web Vitals measurement

### 2. Configure Services

#### Sentry Setup
1. Create account at [sentry.io](https://sentry.io)
2. Create new React project
3. Copy DSN to `VITE_SENTRY_DSN` environment variable
4. Configure source maps for production debugging

#### Google Analytics Setup
1. Create GA4 property at [analytics.google.com](https://analytics.google.com)
2. Copy Measurement ID to `VITE_GA4_MEASUREMENT_ID`
3. Configure custom events in GA4 dashboard

#### Webhook Alerts (Optional)
1. Set up Slack/Discord webhook
2. Add URL to `VITE_ALERT_WEBHOOK_URL`
3. Configure alert channels and routing

### 3. Enable Monitoring

Monitoring is automatically initialized when the app starts. The system:
- Initializes all monitoring services in `App.jsx`
- Sets user context on login/logout
- Tracks user journeys and feature usage
- Monitors performance metrics continuously

## 📈 Monitoring Usage

### Basic Tracking

```javascript
import { trackEvent, trackFeature, trackUserJourney } from '../lib/monitoring/index.js';

// Track custom events
trackEvent('user_action', { action: 'button_click', component: 'header' });

// Track feature usage
trackFeature('image_generation', 'started', { model: 'nono-banana' });

// Track user journey milestones
trackUserJourney('onboarding_step_completed', { step: 2 });
```

### Error Tracking

```javascript
import { trackError } from '../lib/monitoring/index.js';

try {
  // Some operation that might fail
  await generateImage();
} catch (error) {
  trackError(error, { 
    context: 'image_generation',
    model: 'nono-banana',
    user_action: 'generate_button_click'
  });
}
```

### Performance Measurement

```javascript
import { performanceMonitor } from '../lib/monitoring/index.js';

// Performance data is automatically collected
// Access current metrics:
const summary = performanceMonitor.getPerformanceSummary();
console.log('Current performance metrics:', summary);
```

## 🔍 Monitoring Dashboard

A development monitoring dashboard is available at `src/components/MonitoringDashboard.jsx` that provides:

- **Real-time system status** for all monitoring services
- **Performance metrics display** with Web Vitals ratings
- **Recent alerts history** with severity levels
- **Testing utilities** to validate monitoring functionality
- **Environment information** for debugging

### Using the Dashboard

```javascript
import MonitoringDashboard from '../components/MonitoringDashboard.jsx';

// Add to any page for development debugging
<MonitoringDashboard isOpen={showDashboard} onClose={() => setShowDashboard(false)} />
```

## 🚨 Alert Thresholds

### Default Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| Error Rate | 5/min | 10/min |
| LCP | 2500ms | 4000ms |
| INP | 200ms | 500ms |
| CLS | 0.1 | 0.25 |
| Memory Usage | 100MB | 200MB |
| API Failure Rate | 10% | 25% |

### Customizing Thresholds

Thresholds can be customized via environment variables or by modifying the alerting system configuration in `src/lib/monitoring/alerting.js`.

## 📊 Data Collection

### What We Track

**Performance Data:**
- Core Web Vitals (LCP, INP, CLS, FCP, TTFB)
- API response times and failure rates
- Memory usage patterns
- Navigation timing
- Resource loading performance

**Error Data:**
- JavaScript errors with stack traces
- Unhandled promise rejections
- Component error boundaries
- API failures and network errors

**User Behavior:**
- Page views and navigation patterns
- Feature usage and interaction events
- User journey milestones
- Conversion funnel progression
- Engagement metrics (scroll depth, time on page)

### Privacy Considerations

- **IP anonymization** enabled in GA4
- **No personally identifiable information** collected automatically
- **User consent** should be implemented for analytics
- **Data retention policies** follow platform defaults (Sentry 90 days, GA4 2 months for user-level data)

## 🛠️ Troubleshooting

### Common Issues

#### Monitoring Not Initializing
- Check console for initialization errors
- Verify environment variables are set correctly
- Ensure `VITE_DISABLE_MONITORING` is not set to `true`

#### Sentry Not Reporting Errors
- Verify DSN is correct and project is active
- Check if error rate limits are exceeded
- Ensure production build includes source maps

#### Performance Metrics Missing
- Web Vitals require user interaction to trigger
- Some metrics only fire once per page load
- Check browser compatibility for modern APIs

#### Alerts Not Firing
- Verify webhook URLs are accessible
- Check alert cooldown periods
- Confirm threshold configurations

### Debug Mode

Enable debug mode with:
```bash
VITE_DEBUG_MONITORING=true
```

This will:
- Log all monitoring events to console
- Enable verbose error reporting
- Show performance measurement details
- Display alert trigger information

## 🔄 Continuous Monitoring

### Production Setup Checklist

- [ ] Sentry project configured with proper DSN
- [ ] Google Analytics 4 property set up
- [ ] Source maps uploaded for error debugging
- [ ] Alert webhooks tested and functional
- [ ] Performance thresholds tuned for your application
- [ ] Privacy policy updated to include analytics
- [ ] User consent mechanism implemented (if required)
- [ ] Monitoring dashboard access secured

### Maintenance Tasks

**Weekly:**
- Review error rates and new error types
- Check performance metric trends
- Validate alert configurations

**Monthly:**
- Analyze user behavior patterns
- Review and adjust performance thresholds
- Clean up old alerts and metrics

**Quarterly:**
- Update monitoring dependencies
- Review data retention policies
- Assess new monitoring features

## 📚 Additional Resources

- [Sentry React Documentation](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Web Vitals Guide](https://web.dev/vitals/)
- [Google Analytics 4 Implementation](https://developers.google.com/analytics/devguides/collection/ga4)
- [Performance Optimization Best Practices](https://web.dev/fast/)

---

**Last Updated:** November 29, 2024  
**Version:** 1.0.0  
**Maintainer:** Claude Integration Master