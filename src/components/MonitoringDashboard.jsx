import React, { useState, useEffect } from 'react';
import { getMonitoringStatus, trackEvent, trackFeatureUsage } from '../lib/monitoring/index.js';
import { performanceMonitor } from '../lib/monitoring/performance.js';
import { alertingSystem } from '../lib/monitoring/alerting.js';

/**
 * Monitoring Dashboard for development and debugging
 * Shows real-time monitoring status and metrics
 */
const MonitoringDashboard = ({ isOpen, onClose }) => {
  const [status, setStatus] = useState(null);
  const [metrics, setMetrics] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [testResults, setTestResults] = useState({});

  useEffect(() => {
    if (isOpen) {
      loadMonitoringData();
      const interval = setInterval(loadMonitoringData, 5000); // Update every 5 seconds
      
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const loadMonitoringData = () => {
    try {
      const monitoringStatus = getMonitoringStatus();
      setStatus(monitoringStatus);
      
      const performanceData = performanceMonitor.getPerformanceSummary();
      setMetrics(performanceData);
      
      const alertData = alertingSystem.getStatus();
      setAlerts(alertData.alerts || []);
      
    } catch (error) {
      console.error('Failed to load monitoring data:', error);
    }
  };

  const runTests = () => {
    console.log('🧪 Running monitoring system tests...');
    
    const results = {};

    // Test 1: Analytics Event
    try {
      trackEvent('test_event', { source: 'monitoring_dashboard', timestamp: Date.now() });
      results.analytics = '✅ Analytics tracking working';
    } catch (error) {
      results.analytics = `❌ Analytics failed: ${error.message}`;
    }

    // Test 2: Feature Usage Tracking
    try {
      trackFeatureUsage('monitoring_dashboard', 'test_run', { test_id: Date.now() });
      results.featureTracking = '✅ Feature tracking working';
    } catch (error) {
      results.featureTracking = `❌ Feature tracking failed: ${error.message}`;
    }

    // Test 3: Error Tracking (simulate an error)
    try {
      const testError = new Error('Test error for monitoring validation');
      testError.name = 'MonitoringTestError';
      throw testError;
    } catch (error) {
      try {
        window.Sentry?.captureException(error);
        results.errorTracking = '✅ Error tracking working';
      } catch (sentryError) {
        results.errorTracking = `❌ Error tracking failed: ${sentryError.message}`;
      }
    }

    // Test 4: Performance Monitoring
    try {
      if (performanceMonitor.initialized) {
        results.performance = '✅ Performance monitoring initialized';
      } else {
        results.performance = '⚠️ Performance monitoring not initialized';
      }
    } catch (error) {
      results.performance = `❌ Performance monitoring failed: ${error.message}`;
    }

    // Test 5: Alerting System
    try {
      if (alertingSystem.initialized) {
        results.alerting = '✅ Alerting system initialized';
      } else {
        results.alerting = '⚠️ Alerting system not initialized';
      }
    } catch (error) {
      results.alerting = `❌ Alerting system failed: ${error.message}`;
    }

    setTestResults(results);
    console.log('🧪 Test results:', results);
  };

  const generateTestError = () => {
    console.log('🧨 Generating test error...');
    throw new Error('This is a test error to validate error tracking');
  };

  const simulateSlowPerformance = () => {
    console.log('🐌 Simulating slow performance...');
    
    // Simulate slow operation
    const start = Date.now();
    while (Date.now() - start < 2000) {
      // Busy wait for 2 seconds
    }
    
    trackEvent('slow_operation_simulated', {
      duration: Date.now() - start,
      source: 'monitoring_dashboard'
    });
  };

  const simulateMemoryUsage = () => {
    console.log('💾 Simulating high memory usage...');
    
    // Create large array to consume memory
    const largeArray = new Array(1000000).fill('memory_test_data');
    
    setTimeout(() => {
      // Clear the array after 5 seconds
      largeArray.length = 0;
      console.log('💾 Memory test data cleared');
    }, 5000);

    trackEvent('memory_test_simulated', {
      array_size: 1000000,
      source: 'monitoring_dashboard'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 rounded-t-xl flex justify-between items-center">
          <h2 className="text-xl font-bold">🚀 Monitoring Dashboard</h2>
          <button 
            onClick={onClose}
            className="text-white hover:text-gray-200 text-xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          
          {/* System Status */}
          <section>
            <h3 className="text-lg font-semibold mb-3 text-gray-800">System Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {status && (
                <>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-700">Sentry</h4>
                    <p className={`text-sm ${status.sentry.initialized ? 'text-green-600' : 'text-red-600'}`}>
                      {status.sentry.initialized ? '✅ Active' : '❌ Inactive'}
                    </p>
                    <p className="text-xs text-gray-500">
                      DSN: {status.sentry.dsn}
                    </p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-700">Performance</h4>
                    <p className={`text-sm ${status.performance.initialized ? 'text-green-600' : 'text-red-600'}`}>
                      {status.performance.initialized ? '✅ Active' : '❌ Inactive'}
                    </p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-700">Analytics</h4>
                    <p className={`text-sm ${status.analytics.initialized ? 'text-green-600' : 'text-red-600'}`}>
                      {status.analytics.initialized ? '✅ Active' : '❌ Inactive'}
                    </p>
                    <p className="text-xs text-gray-500">
                      GA4: {status.analytics.ga4}
                    </p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-700">Alerting</h4>
                    <p className={`text-sm ${status.alerting.initialized ? 'text-green-600' : 'text-red-600'}`}>
                      {status.alerting.initialized ? '✅ Active' : '❌ Inactive'}
                    </p>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* Performance Metrics */}
          {metrics && Object.keys(metrics).length > 0 && (
            <section>
              <h3 className="text-lg font-semibold mb-3 text-gray-800">Performance Metrics</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                
                {/* Web Vitals */}
                {metrics.webVitals && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-700 mb-2">Web Vitals</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      {Object.entries(metrics.webVitals).map(([metric, data]) => (
                        <div key={metric} className="flex justify-between">
                          <span className="font-medium">{metric}:</span>
                          <span className={`
                            ${data.rating === 'good' ? 'text-green-600' : 
                              data.rating === 'needs-improvement' ? 'text-yellow-600' : 
                              'text-red-600'}
                          `}>
                            {data.value}ms ({data.rating})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Memory Usage */}
                {metrics.memory && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-700 mb-2">Memory Usage</h4>
                    <div className="text-sm">
                      <span>{metrics.memory.used}MB / {metrics.memory.total}MB</span>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className={`h-2 rounded-full ${
                            metrics.memory.used / metrics.memory.total > 0.8 ? 'bg-red-500' :
                            metrics.memory.used / metrics.memory.total > 0.6 ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}
                          style={{ width: `${(metrics.memory.used / metrics.memory.total) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Connection Info */}
                {metrics.connection && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Connection</h4>
                    <div className="text-sm space-y-1">
                      <div>Type: <span className="font-medium">{metrics.connection.effective_type}</span></div>
                      <div>Downlink: <span className="font-medium">{metrics.connection.downlink} Mbps</span></div>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Recent Alerts */}
          {alerts.length > 0 && (
            <section>
              <h3 className="text-lg font-semibold mb-3 text-gray-800">Recent Alerts</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {alerts.slice(0, 10).map((alert, index) => (
                  <div 
                    key={alert.id || index} 
                    className={`p-3 rounded-lg border-l-4 ${
                      alert.level === 'critical' ? 'border-red-500 bg-red-50' :
                      alert.level === 'warning' ? 'border-yellow-500 bg-yellow-50' :
                      'border-blue-500 bg-blue-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-800">{alert.message}</p>
                        <p className="text-sm text-gray-600">{alert.type}</p>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Test Controls */}
          <section>
            <h3 className="text-lg font-semibold mb-3 text-gray-800">Testing & Validation</h3>
            
            <div className="flex flex-wrap gap-2 mb-4">
              <button 
                onClick={runTests}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                Run All Tests
              </button>
              
              <button 
                onClick={generateTestError}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                Generate Test Error
              </button>
              
              <button 
                onClick={simulateSlowPerformance}
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                Simulate Slow Performance
              </button>
              
              <button 
                onClick={simulateMemoryUsage}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                Simulate High Memory Usage
              </button>
            </div>

            {/* Test Results */}
            {Object.keys(testResults).length > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-700 mb-2">Test Results</h4>
                <div className="space-y-1 text-sm">
                  {Object.entries(testResults).map(([test, result]) => (
                    <div key={test} className="flex justify-between">
                      <span className="font-medium">{test}:</span>
                      <span>{result}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Environment Information */}
          <section>
            <h3 className="text-lg font-semibold mb-3 text-gray-800">Environment</h3>
            <div className="bg-gray-50 p-4 rounded-lg text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-medium">Mode:</span> {import.meta.env.MODE}
                </div>
                <div>
                  <span className="font-medium">Environment:</span> {import.meta.env.DEV ? 'Development' : 'Production'}
                </div>
                <div>
                  <span className="font-medium">User Agent:</span> {navigator.userAgent.slice(0, 50)}...
                </div>
                <div>
                  <span className="font-medium">Viewport:</span> {window.innerWidth}x{window.innerHeight}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default MonitoringDashboard;