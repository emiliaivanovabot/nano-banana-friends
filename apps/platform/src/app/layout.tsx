import type { Metadata } from 'next'
import { AuthProvider } from '@repo/auth-config'
import './globals.css'

export const metadata: Metadata = {
  title: 'neuronalworks Platform',
  description: 'AI-powered platform for image generation and creative tools',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}