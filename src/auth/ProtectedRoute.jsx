// Protected Route component for authentication-required pages
// Created by api-builder specialist

import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext.jsx'

export function ProtectedRoute({ children, requireCompleteProfile = false }) {
  const { isAuthenticated, requiresOnboarding, isLoading } = useAuth()
  const location = useLocation()

  // Show loading state while auth is being determined
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // If this route requires a complete profile and user needs onboarding
  if (requireCompleteProfile && requiresOnboarding) {
    return <Navigate to="/onboarding" replace />
  }

  // User is authenticated and meets requirements
  return children
}

export function PublicRoute({ children }) {
  const { isAuthenticated, requiresOnboarding, isLoading } = useAuth()

  // Show loading state while auth is being determined
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  // If user is authenticated, redirect appropriately
  if (isAuthenticated) {
    if (requiresOnboarding) {
      return <Navigate to="/onboarding" replace />
    } else {
      return <Navigate to="/dashboard" replace />
    }
  }

  // User is not authenticated, show public content
  return children
}

export default ProtectedRoute