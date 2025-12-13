'use client'

import { useAuth } from '@repo/auth-config'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LoginPage from './login/page'
import OnboardingPage from './onboarding/page'
import DashboardPage from './dashboard/page'

export default function Home() {
  const { isAuthenticated, requiresOnboarding, isLoading, isReadyForApp } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated && !requiresOnboarding) {
        router.push('/dashboard')
      } else if (isAuthenticated && requiresOnboarding) {
        router.push('/onboarding')
      }
    }
  }, [isAuthenticated, requiresOnboarding, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LoginPage />
  }

  if (requiresOnboarding) {
    return <OnboardingPage />
  }

  if (isReadyForApp()) {
    return <DashboardPage />
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Welcome to neuronalworks</h1>
        <p className="text-muted-foreground">Loading your experience...</p>
      </div>
    </div>
  )
}