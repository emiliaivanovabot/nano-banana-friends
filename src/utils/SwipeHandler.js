/**
 * Optimized SwipeHandler for mobile navigation with performance and UX improvements
 * 
 * Features:
 * - Hardware-accelerated animations using transform3d
 * - Velocity-based gesture recognition
 * - Haptic feedback support
 * - Edge swipe protection
 * - RAF-based smooth animations
 * - Memory leak prevention
 * - Touch event optimization
 */

class SwipeHandler {
  constructor(options = {}) {
    this.options = {
      // Gesture recognition
      minSwipeDistance: 120,        // Increased for fewer false positives
      maxVerticalMovement: 80,      // Allow some vertical drift
      maxSwipeTime: 1000,          // Max duration for valid swipe
      minVelocity: 0.3,            // Minimum pixels per ms
      edgeThreshold: 30,           // Pixels from edge to start gesture
      
      // Visual feedback
      maxTransform: 15,            // Max transform distance in pixels
      maxOpacity: 0.15,            // Max opacity change
      transformThreshold: 25,      // Start visual feedback after this distance
      
      // Animation timing
      feedbackDuration: 300,       // Reset animation duration
      navigationDelay: 180,        // Delay before navigation
      
      // Callbacks
      onSwipeRight: null,
      onSwipeLeft: null,
      onSwipeStart: null,
      onSwipeCancel: null,
      
      // Debug
      debug: false,
      
      ...options
    }
    
    // State tracking
    this.isSwipeInProgress = false
    this.touchStartX = 0
    this.touchStartY = 0
    this.touchEndX = 0
    this.touchEndY = 0
    this.touchStartTime = 0
    this.lastMoveTime = 0
    this.animationId = null
    this.isNavigating = false
    
    // Create visual feedback container
    this.createFeedbackContainer()
    
    // Bind methods
    this.handleTouchStart = this.handleTouchStart.bind(this)
    this.handleTouchMove = this.handleTouchMove.bind(this)
    this.handleTouchEnd = this.handleTouchEnd.bind(this)
    this.handleTouchCancel = this.handleTouchCancel.bind(this)
  }
  
  createFeedbackContainer() {
    // Create a dedicated container for visual feedback instead of manipulating body
    this.feedbackContainer = document.createElement('div')
    this.feedbackContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      z-index: 9999;
      background: linear-gradient(90deg, transparent 0%, rgba(59, 130, 246, 0.1) 100%);
      transform: translateX(-100%);
      transition: none;
      will-change: transform, opacity;
    `
    document.body.appendChild(this.feedbackContainer)
  }
  
  log(message, data = {}) {
    if (this.options.debug) {
      console.log(`[SwipeHandler] ${message}`, data)
    }
  }
  
  // Check if touch started near screen edge (for edge swipe protection)
  isEdgeSwipe(x) {
    const screenWidth = window.innerWidth
    return x < this.options.edgeThreshold || x > (screenWidth - this.options.edgeThreshold)
  }
  
  // Haptic feedback for supported devices
  triggerHaptic(intensity = 'light') {
    try {
      if ('vibrate' in navigator) {
        // Subtle vibration patterns
        const patterns = {
          light: [10],
          medium: [20],
          strong: [30, 10, 30]
        }
        navigator.vibrate(patterns[intensity] || patterns.light)
      }
    } catch (error) {
      this.log('Haptic feedback not supported', error)
    }
  }
  
  handleTouchStart(e) {
    // Ignore if already navigating or multiple touches
    if (this.isNavigating || e.touches.length > 1) return
    
    const touch = e.touches[0]
    this.touchStartX = touch.clientX
    this.touchStartY = touch.clientY
    this.touchStartTime = Date.now()
    this.lastMoveTime = this.touchStartTime
    this.isSwipeInProgress = true
    
    this.log('Touch start', {
      x: this.touchStartX,
      y: this.touchStartY,
      isEdge: this.isEdgeSwipe(this.touchStartX)
    })
    
    // Reset feedback container
    this.feedbackContainer.style.transition = 'none'
    this.feedbackContainer.style.transform = 'translateX(-100%)'
    this.feedbackContainer.style.opacity = '0'
    
    // Callback
    if (this.options.onSwipeStart) {
      this.options.onSwipeStart()
    }
  }
  
  handleTouchMove(e) {
    if (!this.isSwipeInProgress || this.isNavigating) return
    
    const touch = e.touches[0]
    const currentX = touch.clientX
    const currentY = touch.clientY
    const currentTime = Date.now()
    
    const deltaX = currentX - this.touchStartX
    const deltaY = Math.abs(currentY - this.touchStartY)
    
    // Cancel if too much vertical movement
    if (deltaY > this.options.maxVerticalMovement) {
      this.log('Cancelled due to vertical movement', { deltaY })
      this.cancelSwipe()
      return
    }
    
    // Only show feedback for rightward swipes and after threshold
    if (deltaX > this.options.transformThreshold) {
      this.updateVisualFeedback(deltaX)
      
      // Prevent page scrolling during swipe
      e.preventDefault()
    }
    
    this.lastMoveTime = currentTime
    this.touchEndX = currentX
    this.touchEndY = currentY
  }
  
  updateVisualFeedback(deltaX) {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
    }
    
    this.animationId = requestAnimationFrame(() => {
      const progress = Math.min(deltaX / 200, 1) // 200px for full effect
      const transform = progress * this.options.maxTransform
      const opacity = progress * this.options.maxOpacity
      
      // Use transform3d for hardware acceleration
      this.feedbackContainer.style.transform = `translate3d(${transform - 100}%, 0, 0)`
      this.feedbackContainer.style.opacity = opacity.toString()
    })
  }
  
  handleTouchEnd(e) {
    if (!this.isSwipeInProgress) return
    
    const touch = e.changedTouches[0]
    this.touchEndX = touch.clientX
    this.touchEndY = touch.clientY
    
    const endTime = Date.now()
    const duration = endTime - this.touchStartTime
    const distance = this.touchEndX - this.touchStartX
    const velocity = Math.abs(distance) / duration // pixels per ms
    const verticalDistance = Math.abs(this.touchEndY - this.touchStartY)
    
    this.log('Touch end', {
      distance,
      duration,
      velocity,
      verticalDistance
    })
    
    // Reset visual feedback with smooth animation
    this.resetVisualFeedback()
    
    // Check if it's a valid swipe
    const isValidSwipe = this.validateSwipe(distance, duration, velocity, verticalDistance)
    
    if (isValidSwipe && distance > 0) {
      this.executeRightSwipe()
    } else if (isValidSwipe && distance < 0) {
      this.executeLeftSwipe()
    } else {
      this.cancelSwipe()
    }
    
    this.isSwipeInProgress = false
  }
  
  validateSwipe(distance, duration, velocity, verticalDistance) {
    return (
      verticalDistance < this.options.maxVerticalMovement &&
      Math.abs(distance) > this.options.minSwipeDistance &&
      duration < this.options.maxSwipeTime &&
      velocity > this.options.minVelocity
    )
  }
  
  resetVisualFeedback() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
    
    this.feedbackContainer.style.transition = `transform ${this.options.feedbackDuration}ms ease-out, opacity ${this.options.feedbackDuration}ms ease-out`
    this.feedbackContainer.style.transform = 'translate3d(-100%, 0, 0)'
    this.feedbackContainer.style.opacity = '0'
  }
  
  executeRightSwipe() {
    this.log('Executing right swipe')
    this.triggerHaptic('medium')
    
    if (this.options.onSwipeRight) {
      this.isNavigating = true
      
      // Enhanced transition animation
      this.feedbackContainer.style.transition = `transform ${this.options.navigationDelay * 2}ms ease-out, opacity ${this.options.navigationDelay}ms ease-out`
      this.feedbackContainer.style.transform = 'translate3d(0%, 0, 0)'
      this.feedbackContainer.style.opacity = '0.3'
      
      setTimeout(() => {
        this.options.onSwipeRight()
      }, this.options.navigationDelay)
    }
  }
  
  executeLeftSwipe() {
    this.log('Executing left swipe')
    this.triggerHaptic('medium')
    
    if (this.options.onSwipeLeft) {
      this.isNavigating = true
      setTimeout(() => {
        this.options.onSwipeLeft()
      }, this.options.navigationDelay)
    }
  }
  
  cancelSwipe() {
    this.log('Swipe cancelled')
    this.triggerHaptic('light')
    
    if (this.options.onSwipeCancel) {
      this.options.onSwipeCancel()
    }
  }
  
  handleTouchCancel(e) {
    this.log('Touch cancelled')
    this.resetVisualFeedback()
    this.cancelSwipe()
    this.isSwipeInProgress = false
  }
  
  // Attach event listeners
  attach(element = document) {
    this.log('Attaching swipe handlers')
    
    element.addEventListener('touchstart', this.handleTouchStart, { 
      passive: true,
      capture: false 
    })
    element.addEventListener('touchmove', this.handleTouchMove, { 
      passive: false, // Need to prevent default for horizontal swipes
      capture: false 
    })
    element.addEventListener('touchend', this.handleTouchEnd, { 
      passive: true,
      capture: false 
    })
    element.addEventListener('touchcancel', this.handleTouchCancel, { 
      passive: true,
      capture: false 
    })
  }
  
  // Detach event listeners and cleanup
  detach(element = document) {
    this.log('Detaching swipe handlers')
    
    element.removeEventListener('touchstart', this.handleTouchStart)
    element.removeEventListener('touchmove', this.handleTouchMove)
    element.removeEventListener('touchend', this.handleTouchEnd)
    element.removeEventListener('touchcancel', this.handleTouchCancel)
    
    // Enhanced cleanup to prevent memory leaks
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
    
    if (this.feedbackContainer) {
      if (this.feedbackContainer.parentNode) {
        this.feedbackContainer.parentNode.removeChild(this.feedbackContainer)
      }
      this.feedbackContainer = null
    }
    
    // Reset all state
    this.isSwipeInProgress = false
    this.isNavigating = false
    this.touchStartX = 0
    this.touchStartY = 0
    this.touchEndX = 0
    this.touchEndY = 0
    this.touchStartTime = 0
    this.lastMoveTime = 0
  }
  
  // Update options dynamically
  updateOptions(newOptions) {
    this.options = { ...this.options, ...newOptions }
    this.log('Options updated', this.options)
  }
  
  // Manual trigger methods for testing
  simulateRightSwipe() {
    this.log('Simulating right swipe')
    this.executeRightSwipe()
  }
  
  simulateLeftSwipe() {
    this.log('Simulating left swipe')
    this.executeLeftSwipe()
  }
}

export default SwipeHandler