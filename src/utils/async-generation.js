// ==============================================
// ASYNC GENERATION UTILITIES
// ==============================================
// React hooks and utilities for mobile-friendly async image generation
// Handles polling, sleep/wake cycles, and generation status tracking

import { useState, useEffect, useRef, useCallback } from 'react'

// API Configuration
const API_BASE_URL = import.meta.env.VITE_ASYNC_API_URL || 'http://localhost:3001'

// ==============================================
// API CLIENT FUNCTIONS
// ==============================================

class AsyncGenerationAPI {
  static async startGeneration(generationData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/generations/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(generationData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to start generation')
      }

      return await response.json()
    } catch (error) {
      console.error('Start generation error:', error)
      throw error
    }
  }

  static async checkStatus(generationId, userId) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/generations/${generationId}/status?user_id=${userId}`
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to check status')
      }

      return await response.json()
    } catch (error) {
      console.error('Status check error:', error)
      throw error
    }
  }

  static async getUserGenerations(userId, limit = 10, status = null) {
    try {
      const params = new URLSearchParams({ limit: limit.toString() })
      if (status) params.append('status', status)

      const response = await fetch(
        `${API_BASE_URL}/api/generations/user/${userId}?${params}`
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch generations')
      }

      return await response.json()
    } catch (error) {
      console.error('Get generations error:', error)
      throw error
    }
  }

  static async retryGeneration(generationId, userId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/generations/${generationId}/retry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userId })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to retry generation')
      }

      return await response.json()
    } catch (error) {
      console.error('Retry generation error:', error)
      throw error
    }
  }
}

// ==============================================
// MOBILE VISIBILITY & SLEEP DETECTION
// ==============================================

// Hook to detect when page/tab becomes visible (user returns from sleep/background)
export const usePageVisibility = () => {
  const [isVisible, setIsVisible] = useState(!document.hidden)

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleVisibilityChange)
    window.addEventListener('blur', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleVisibilityChange)
      window.removeEventListener('blur', handleVisibilityChange)
    }
  }, [])

  return isVisible
}

// ==============================================
// ASYNC GENERATION HOOK
// ==============================================

export const useAsyncGeneration = (userId) => {
  const [currentGeneration, setCurrentGeneration] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationHistory, setGenerationHistory] = useState([])
  const [error, setError] = useState(null)
  const [pollingActive, setPollingActive] = useState(false)
  
  const pollingIntervalRef = useRef(null)
  const generationStartTimeRef = useRef(null)
  const isPageVisible = usePageVisibility()
  
  // ==============================================
  // POLLING LOGIC
  // ==============================================
  
  const startPolling = useCallback((generationId) => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
    }
    
    setPollingActive(true)
    
    const poll = async () => {
      try {
        const status = await AsyncGenerationAPI.checkStatus(generationId, userId)
        setCurrentGeneration(status)
        
        // Stop polling when generation is complete or failed
        if (status.status === 'completed' || status.status === 'failed') {
          clearInterval(pollingIntervalRef.current)
          pollingIntervalRef.current = null
          setPollingActive(false)
          setIsGenerating(false)
          
          // Refresh generation history
          loadGenerationHistory()
          
          // Show completion notification if page is visible
          if (isPageVisible && status.status === 'completed') {
            showCompletionNotification()
          }
        }
      } catch (error) {
        console.error('Polling error:', error)
        setError(error.message)
      }
    }
    
    // Poll immediately then every 10 seconds
    poll()
    pollingIntervalRef.current = setInterval(poll, 10000) // 10 second interval
  }, [userId, isPageVisible])
  
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
    setPollingActive(false)
  }, [])
  
  // ==============================================
  // PAGE VISIBILITY HANDLING
  // ==============================================
  
  useEffect(() => {
    // When page becomes visible and we have an active generation, resume polling
    if (isPageVisible && currentGeneration && currentGeneration.status === 'processing') {
      if (!pollingIntervalRef.current) {
        console.log('Page became visible, resuming polling...')
        startPolling(currentGeneration.id)
      }
    }
    // When page becomes hidden, we keep polling but at a slower rate
    else if (!isPageVisible && pollingIntervalRef.current) {
      // Keep polling but we could reduce frequency if needed
      console.log('Page became hidden, continuing polling...')
    }
  }, [isPageVisible, currentGeneration, startPolling])
  
  // ==============================================
  // GENERATION FUNCTIONS
  // ==============================================
  
  const startAsyncGeneration = async (generationData) => {
    try {
      setError(null)
      setIsGenerating(true)
      generationStartTimeRef.current = Date.now()
      
      const response = await AsyncGenerationAPI.startGeneration({
        user_id: userId,
        ...generationData
      })
      
      setCurrentGeneration({
        id: response.generation_id,
        status: 'processing',
        created_at: response.created_at
      })
      
      // Start polling for this generation
      startPolling(response.generation_id)
      
      return response
    } catch (error) {
      setError(error.message)
      setIsGenerating(false)
      throw error
    }
  }
  
  const retryGeneration = async (generationId) => {
    try {
      setError(null)
      
      await AsyncGenerationAPI.retryGeneration(generationId, userId)
      
      setIsGenerating(true)
      setCurrentGeneration(prev => ({
        ...prev,
        status: 'processing'
      }))
      
      // Start polling for the retried generation
      startPolling(generationId)
    } catch (error) {
      setError(error.message)
      throw error
    }
  }
  
  const loadGenerationHistory = useCallback(async () => {
    try {
      const response = await AsyncGenerationAPI.getUserGenerations(userId, 10)
      setGenerationHistory(response.generations)
    } catch (error) {
      console.error('Failed to load generation history:', error)
    }
  }, [userId])
  
  // ==============================================
  // NOTIFICATIONS
  // ==============================================
  
  const showCompletionNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('🍌 Image Generation Complete!', {
        body: 'Your Nano Banana image is ready to view.',
        icon: '/favicon.ico'
      })
    }
  }
  
  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      return await Notification.requestPermission()
    }
    return Notification.permission
  }
  
  // ==============================================
  // LIFECYCLE & CLEANUP
  // ==============================================
  
  useEffect(() => {
    // Load initial generation history
    loadGenerationHistory()
    
    // Check for any active generation from localStorage (resume after refresh)
    const savedGeneration = localStorage.getItem('nano_banana_active_generation')
    if (savedGeneration) {
      try {
        const generation = JSON.parse(savedGeneration)
        if (generation.status === 'processing') {
          setCurrentGeneration(generation)
          setIsGenerating(true)
          startPolling(generation.id)
        }
      } catch (error) {
        console.error('Failed to restore saved generation:', error)
        localStorage.removeItem('nano_banana_active_generation')
      }
    }
    
    return () => {
      stopPolling()
    }
  }, [userId, loadGenerationHistory, startPolling, stopPolling])
  
  // Save current generation to localStorage for persistence
  useEffect(() => {
    if (currentGeneration) {
      if (currentGeneration.status === 'processing') {
        localStorage.setItem('nano_banana_active_generation', JSON.stringify(currentGeneration))
      } else {
        localStorage.removeItem('nano_banana_active_generation')
      }
    }
  }, [currentGeneration])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling()
    }
  }, [stopPolling])
  
  // ==============================================
  // COMPUTED PROPERTIES
  // ==============================================
  
  const generationDuration = currentGeneration?.created_at 
    ? Math.floor((Date.now() - new Date(currentGeneration.created_at).getTime()) / 1000)
    : 0
  
  const hasActiveGeneration = currentGeneration?.status === 'processing'
  
  return {
    // State
    currentGeneration,
    isGenerating,
    generationHistory,
    error,
    pollingActive,
    hasActiveGeneration,
    generationDuration,
    
    // Actions
    startAsyncGeneration,
    retryGeneration,
    loadGenerationHistory,
    stopPolling,
    requestNotificationPermission,
    
    // Utils
    clearError: () => setError(null),
    setCurrentGeneration
  }
}

// ==============================================
// GENERATION STATUS COMPONENT HOOK
// ==============================================

export const useGenerationStatus = (generation) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'processing': return '⏳'
      case 'completed': return '✅'
      case 'failed': return '❌'
      default: return '⏳'
    }
  }
  
  const getStatusText = (status) => {
    switch (status) {
      case 'processing': return 'Processing...'
      case 'completed': return 'Complete'
      case 'failed': return 'Failed'
      default: return 'Unknown'
    }
  }
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'processing': return '#F59E0B'
      case 'completed': return '#10B981'
      case 'failed': return '#EF4444'
      default: return '#6B7280'
    }
  }
  
  return {
    icon: getStatusIcon(generation?.status),
    text: getStatusText(generation?.status),
    color: getStatusColor(generation?.status)
  }
}

export default AsyncGenerationAPI