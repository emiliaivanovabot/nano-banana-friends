'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@repo/ui'
import { Card } from '@repo/ui'
import { useAuth } from '@repo/auth-config'
import { CreditSystem, deductCredits } from '@repo/business-logic'
import { ArrowLeft, Users, Share2, Download, RefreshCw } from 'lucide-react'

export default function CollabPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [sessionId, setSessionId] = useState('')
  const [prompts, setPrompts] = useState<string[]>([''])
  const [isGenerating, setIsGenerating] = useState(false)
  const [results, setResults] = useState<Array<{image: string, prompt: string, user: string}>>([])
  const [error, setError] = useState<string | null>(null)
  const [shareLink, setShareLink] = useState('')

  // Generate a random session ID for collaboration
  useEffect(() => {
    const id = Math.random().toString(36).substring(7)
    setSessionId(id)
    setShareLink(`${window.location.origin}/collab?session=${id}`)
  }, [])

  const addPrompt = () => {
    setPrompts([...prompts, ''])
  }

  const updatePrompt = (index: number, value: string) => {
    const newPrompts = [...prompts]
    newPrompts[index] = value
    setPrompts(newPrompts)
  }

  const removePrompt = (index: number) => {
    if (prompts.length > 1) {
      setPrompts(prompts.filter((_, i) => i !== index))
    }
  }

  const generateCollaborative = async () => {
    const validPrompts = prompts.filter(p => p.trim())
    if (validPrompts.length === 0) {
      alert('Bitte füge mindestens einen Prompt hinzu')
      return
    }

    setIsGenerating(true)
    setError(null)
    
    try {
      // Deduct credits for collaborative generation
      const creditResult = await deductCredits({
        userId: user?.id || '',
        service: 'gemini',
        amount: validPrompts.length * 0.12 // 12 cents per prompt in collaboration
      })
      
      if (!creditResult.success) {
        throw new Error('Insufficient credits')
      }

      // Call API route
      const response = await fetch('/api/collab', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompts: validPrompts,
          sessionId,
          userId: user?.id,
          username: user?.username || 'Anonymous'
        }),
      })

      if (!response.ok) {
        throw new Error('Collaborative generation failed')
      }

      const data = await response.json()
      setResults(data.results)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setIsGenerating(false)
    }
  }

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink)
    alert('Share link copied to clipboard!')
  }

  const downloadAll = () => {
    results.forEach((result, index) => {
      try {
        const base64Data = result.image.split(',')[1]
        const mimeType = result.image.split(',')[0].split(':')[1].split(';')[0]
        
        const binaryData = atob(base64Data)
        const bytes = new Uint8Array(binaryData.length)
        for (let i = 0; i < binaryData.length; i++) {
          bytes[i] = binaryData.charCodeAt(i)
        }
        
        const blob = new Blob([bytes], { type: mimeType })
        const url = URL.createObjectURL(blob)
        
        const link = document.createElement('a')
        link.href = url
        link.download = `collab-${sessionId}-${index + 1}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        URL.revokeObjectURL(url)
      } catch (error) {
        console.error('Download failed', error)
      }
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.push('/')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Modules
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">
            🤝 Collaboration Workspace
          </h1>
        </div>

        <CreditSystem userId={user?.id} service="gemini" />

        {/* Share Section */}
        <Card className="p-6 mb-6 bg-gradient-to-r from-pink-500 to-rose-500 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium mb-2">Session: {sessionId}</h3>
              <p className="text-pink-100">Share this link with collaborators to work together</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={copyShareLink} className="text-pink-500">
                <Share2 className="h-4 w-4 mr-2" />
                Copy Link
              </Button>
            </div>
          </div>
        </Card>

        {/* Main Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Collaborative Prompts */}
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Team Prompts</h3>
                <Button size="sm" onClick={addPrompt}>
                  <Users className="h-4 w-4 mr-1" />
                  Add Prompt
                </Button>
              </div>
              
              <div className="space-y-3">
                {prompts.map((prompt, index) => (
                  <div key={index} className="flex gap-2">
                    <textarea
                      value={prompt}
                      onChange={(e) => updatePrompt(index, e.target.value)}
                      placeholder={`Team member ${index + 1}'s idea...`}
                      className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      rows={3}
                    />
                    {prompts.length > 1 && (
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        onClick={() => removePrompt(index)}
                      >
                        ×
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* Generate Button */}
            <Button 
              onClick={generateCollaborative}
              disabled={prompts.every(p => !p.trim()) || isGenerating}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <div className="flex items-center justify-center">
                  <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                  Generating for team...
                </div>
              ) : (
                <>
                  <Users className="h-5 w-5 mr-2" />
                  Generate All Ideas ✨
                </>
              )}
            </Button>

            {/* Error Display */}
            {error && (
              <Card className="p-4 bg-red-50 border-red-200">
                <p className="text-red-600">{error}</p>
              </Card>
            )}

            {/* Instructions */}
            <Card className="p-6 bg-pink-50">
              <h3 className="text-lg font-medium mb-2">How Collaboration Works</h3>
              <ol className="text-sm text-gray-600 space-y-2">
                <li>1. Share the session link with your team</li>
                <li>2. Each person adds their prompt ideas</li>
                <li>3. Generate all prompts simultaneously</li>
                <li>4. Compare and discuss results together</li>
                <li>5. Download the best collaborative creations</li>
              </ol>
            </Card>
          </div>

          {/* Right: Results */}
          <div className="space-y-6">
            {results.length > 0 && (
              <Card className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Collaborative Results</h3>
                  <Button size="sm" onClick={downloadAll}>
                    <Download className="h-4 w-4 mr-1" />
                    Download All
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {results.map((result, index) => (
                    <div key={index} className="border rounded-lg overflow-hidden">
                      <img 
                        src={result.image}
                        alt={`Result ${index + 1}`}
                        className="w-full h-48 object-cover"
                      />
                      <div className="p-3 bg-gray-50">
                        <p className="text-sm text-gray-600 mb-1">
                          <strong>{result.user}:</strong>
                        </p>
                        <p className="text-xs text-gray-500">
                          {result.prompt.substring(0, 100)}...
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Collaboration Stats */}
            {!results.length && (
              <Card className="p-6">
                <h3 className="text-lg font-medium mb-4">Session Stats</h3>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-pink-500">{prompts.length}</div>
                    <div className="text-sm text-gray-600">Active Prompts</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-rose-500">1</div>
                    <div className="text-sm text-gray-600">Team Members</div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}