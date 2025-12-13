'use client'

import { useAuth } from '@repo/auth-config'
import { Button } from '@repo/ui'
import { useRouter } from 'next/navigation'

export default function OnboardingPage() {
  const { completeOnboarding } = useAuth()
  const router = useRouter()

  const handleComplete = () => {
    const success = completeOnboarding()
    if (success) {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-2xl text-center space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Willkommen bei neuronalworks! 🎉
          </h1>
          <p className="text-xl text-muted-foreground">
            Dein AI-powered Platform für Kreativität und Innovation
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8">
          <h2 className="text-2xl font-semibold mb-6">Was dich erwartet:</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            <div className="flex items-start gap-3">
              <div className="text-2xl">🍌</div>
              <div>
                <h3 className="font-semibold mb-1">Nano Banana Pro</h3>
                <p className="text-sm text-muted-foreground">
                  Fortschrittliche AI-Bildgenerierung mit Gemini
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="text-2xl">🌟</div>
              <div>
                <h3 className="font-semibold mb-1">Seedream 4.5</h3>
                <p className="text-sm text-muted-foreground">
                  Hochauflösende, realistische Bilder
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="text-2xl">📊</div>
              <div>
                <h3 className="font-semibold mb-1">Usage Analytics</h3>
                <p className="text-sm text-muted-foreground">
                  Verfolge deine Nutzung und Kosten
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="text-2xl">🛡️</div>
              <div>
                <h3 className="font-semibold mb-1">Sichere Platform</h3>
                <p className="text-sm text-muted-foreground">
                  Deine Daten sind sicher und geschützt
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-muted-foreground">
            Bereit, deine Kreativität zu entfesseln?
          </p>
          <Button
            onClick={handleComplete}
            size="lg"
            variant="gradient"
            className="px-8"
          >
            Zur Platform 🚀
          </Button>
        </div>
      </div>
    </div>
  )
}