'use client'

import { useAuth } from '@repo/auth-config'
import { Button } from '@repo/ui'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const { user } = useAuth()
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Zurück
          </Button>
          <h1 className="text-3xl font-bold">Einstellungen</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Profile Information */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">Profil Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Benutzername
                </label>
                <div className="text-foreground font-medium">
                  {user?.username || 'Nicht verfügbar'}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Benutzer ID
                </label>
                <div className="text-foreground font-mono text-sm">
                  {user?.id || 'Nicht verfügbar'}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Letzter Login
                </label>
                <div className="text-foreground text-sm">
                  {user?.lastLogin ? new Date(user.lastLogin).toLocaleString('de-DE') : 'Nicht verfügbar'}
                </div>
              </div>
            </div>
          </div>

          {/* Platform Access */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">Platform Zugang</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <div className="font-medium">Nano Banana Pro</div>
                  <div className="text-sm text-muted-foreground">AI Image Generator</div>
                </div>
                <div className="text-green-500 font-semibold">Aktiv</div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <div className="font-medium">Seedream 4.5</div>
                  <div className="text-sm text-muted-foreground">High-Fidelity Images</div>
                </div>
                <div className="text-green-500 font-semibold">Aktiv</div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <div className="font-medium">Usage Analytics</div>
                  <div className="text-sm text-muted-foreground">Nutzungsstatistiken</div>
                </div>
                <div className="text-green-500 font-semibold">Aktiv</div>
              </div>
            </div>
          </div>

          {/* Platform Information */}
          <div className="bg-card border border-border rounded-xl p-6 lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4">Platform Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">v1.0.0</div>
                <div className="text-sm text-muted-foreground">Platform Version</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-secondary">Aktiv</div>
                <div className="text-sm text-muted-foreground">Service Status</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">99.9%</div>
                <div className="text-sm text-muted-foreground">Verfügbarkeit</div>
              </div>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-muted/30 border border-border rounded-xl p-6 text-center">
          <h3 className="text-lg font-semibold mb-2">Benötigst du Hilfe?</h3>
          <p className="text-muted-foreground mb-4">
            Kontaktiere unser Support-Team für weitere Unterstützung.
          </p>
          <Button variant="outline">
            Support kontaktieren
          </Button>
        </div>
      </div>
    </div>
  )
}