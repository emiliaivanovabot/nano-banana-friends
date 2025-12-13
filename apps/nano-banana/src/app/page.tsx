'use client'

import Link from 'next/link'
import { Button } from '@repo/ui'
import { Card } from '@repo/ui'
import { useAuth } from '@repo/auth-config'
import { CreditSystem } from '@repo/business-logic'

export default function NanoBananaHome() {
  const { user } = useAuth()

  const modules = [
    {
      id: 'classic',
      title: '🍌 Classic',
      description: 'Standard Gemini image generation with prompts',
      href: '/classic',
      gradient: 'from-yellow-400 to-orange-400'
    },
    {
      id: 'img2img',
      title: '🖼️ Image to Image',
      description: 'Transform and enhance existing images',
      href: '/img2img',
      gradient: 'from-blue-400 to-purple-400'
    },
    {
      id: 'grok',
      title: '🧠 Grok Prompt Generator',
      description: 'AI-powered prompt creation and analysis',
      href: '/grok',
      gradient: 'from-green-400 to-cyan-400'
    },
    {
      id: 'collab',
      title: '🤝 Collaboration',
      description: 'Collaborative image generation workspace',
      href: '/collab',
      gradient: 'from-pink-400 to-rose-400'
    },
    {
      id: 'multi-prompt',
      title: '⚡ Multi-Prompt',
      description: 'Generate multiple images simultaneously',
      href: '/multi-prompt',
      gradient: 'from-purple-400 to-indigo-400'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            🍌 Nano Banana
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            AI Image Generation Suite powered by Google Gemini
          </p>
          <CreditSystem userId={user?.id} service="gemini" />
        </div>

        {/* Module Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module) => (
            <Link key={module.id} href={module.href}>
              <Card className="group hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer">
                <div className={`p-6 bg-gradient-to-br ${module.gradient} rounded-lg mb-4`}>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {module.title}
                  </h3>
                </div>
                <div className="p-6 pt-0">
                  <p className="text-gray-600 mb-4">
                    {module.description}
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full group-hover:bg-gradient-to-r group-hover:from-yellow-400 group-hover:to-orange-400 group-hover:text-white group-hover:border-transparent transition-all duration-300"
                  >
                    Launch Module
                  </Button>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-500">5</div>
            <div className="text-sm text-gray-600">Generation Modules</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-500">∞</div>
            <div className="text-sm text-gray-600">Possibilities</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-red-500">🚀</div>
            <div className="text-sm text-gray-600">Powered by Gemini</div>
          </Card>
        </div>
      </div>
    </div>
  )
}