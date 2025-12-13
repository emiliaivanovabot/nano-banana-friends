'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@repo/ui'
import { Card } from '@repo/ui'
import { useAuth } from '@repo/auth-config'
import { CreditSystem, deductCredits } from '@repo/business-logic'
import { ArrowLeft, Plus, Download, Zap, X, RotateCcw } from 'lucide-react'

export default function MultiPromptPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [prompts, setPrompts] = useState<string[]>(['', '', ''])
  const [isGenerating, setIsGenerating] = useState(false)
  const [results, setResults] = useState<Array<{image: string, prompt: string, index: number}>>([])
  const [error, setError] = useState<string | null>(null)
  const [generationProgress, setGenerationProgress] = useState(0)

  const addPrompt = () => {
    if (prompts.length < 10) {
      setPrompts([...prompts, ''])
    }
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

  const clearAllPrompts = () => {
    setPrompts([''])
    setResults([])
    setError(null)
  }

  const generateBatch = async () => {
    const validPrompts = prompts.filter(p => p.trim())
    if (validPrompts.length === 0) {
      alert('Bitte füge mindestens einen Prompt hinzu')
      return
    }

    setIsGenerating(true)
    setError(null)
    setResults([])
    setGenerationProgress(0)
    
    try {
      // Deduct credits for batch generation
      const creditResult = await deductCredits({
        userId: user?.id || '',
        service: 'gemini',
        amount: validPrompts.length * 0.10 // 10 cents per prompt
      })
      
      if (!creditResult.success) {
        throw new Error('Insufficient credits')
      }

      // Call API route for batch processing
      const response = await fetch('/api/multi-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompts: validPrompts,
          userId: user?.id
        }),
      })

      if (!response.ok) {
        throw new Error('Batch generation failed')
      }

      // Stream results as they come in
      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response stream')

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.type === 'progress') {
                setGenerationProgress(data.progress)
              } else if (data.type === 'result') {
                setResults(prev => [...prev, data.result])
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', e)
            }
          }
        }
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setIsGenerating(false)
      setGenerationProgress(0)
    }
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
        link.download = `multi-prompt-${index + 1}-${Date.now()}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        URL.revokeObjectURL(url)
      } catch (error) {
        console.error('Download failed', error)
      }
    })
  }

  // Template prompts for quick start
  const templateSets = [
    {
      name: "Portrait Variations",
      prompts: [
        "Professional headshot with business attire",
        "Casual outdoor portrait with natural lighting", 
        "Artistic black and white studio portrait"
      ]
    },
    {
      name: "Style Experiments",
      prompts: [
        "Oil painting style artwork",
        "Watercolor illustration",
        "Digital art with vibrant colors"
      ]
    },
    {
      name: "Scene Variations",
      prompts: [
        "Peaceful mountain landscape at sunset",
        "Bustling city street at night",
        "Serene beach with crystal clear water"
      ]
    }
  ]

  const useTemplate = (templatePrompts: string[]) => {
    setPrompts(templatePrompts)
    setResults([])
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
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
            ⚡ Multi-Prompt Generator
          </h1>
        </div>

        <CreditSystem userId={user?.id} service="gemini" />

        {/* Main Interface */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left: Prompts */}
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Batch Prompts</h3>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={clearAllPrompts}>
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                  <Button size="sm" onClick={addPrompt} disabled={prompts.length >= 10}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
              </div>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {prompts.map((prompt, index) => (
                  <div key={index} className="flex gap-2">
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-sm font-medium text-purple-600">
                      {index + 1}
                    </div>
                    <textarea
                      value={prompt}
                      onChange={(e) => updatePrompt(index, e.target.value)}
                      placeholder={`Prompt ${index + 1}...`}
                      className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                      rows={2}
                    />
                    {prompts.length > 1 && (
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        onClick={() => removePrompt(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {/* Progress Bar */}
              {isGenerating && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Generating batch...</span>
                    <span>{Math.round(generationProgress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${generationProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </Card>

            {/* Generate Button */}
            <Button 
              onClick={generateBatch}
              disabled={prompts.every(p => !p.trim()) || isGenerating}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <div className="flex items-center justify-center">
                  <Zap className="h-5 w-5 mr-2 animate-pulse" />
                  Generating {prompts.filter(p => p.trim()).length} prompts...
                </div>
              ) : (
                <>
                  <Zap className="h-5 w-5 mr-2" />
                  Generate All ({prompts.filter(p => p.trim()).length}) ⚡
                </>
              )}
            </Button>

            {/* Templates */}
            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">Quick Templates</h3>
              <div className="space-y-2">
                {templateSets.map((template, index) => (
                  <button
                    key={index}
                    onClick={() => useTemplate(template.prompts)}
                    className="w-full text-left p-3 bg-gray-50 hover:bg-purple-50 rounded-lg border transition-colors"
                  >
                    <div className="font-medium text-purple-600">{template.name}</div>
                    <div className="text-sm text-gray-500">
                      {template.prompts.length} prompts ready
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Middle: Instructions */}
          <div className="space-y-6">
            {/* Error Display */}
            {error && (
              <Card className="p-4 bg-red-50 border-red-200">
                <p className="text-red-600">{error}</p>
              </Card>
            )}

            {/* Instructions */}
            <Card className="p-6 bg-purple-50">
              <h3 className="text-lg font-medium mb-2">Batch Generation</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Add multiple prompts (up to 10)</li>
                <li>• Generate all simultaneously</li>
                <li>• Compare different ideas quickly</li>
                <li>• Download the best results</li>
                <li>• Perfect for A/B testing prompts</li>
              </ul>
              
              <div className="mt-4 p-3 bg-yellow-50 rounded">
                <p className="text-sm text-yellow-800">
                  <strong>Pro Tip:</strong> Use variations of the same concept 
                  to find the perfect prompt for your needs!
                </p>
              </div>
            </Card>

            {/* Stats */}
            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">Batch Stats</h3>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-purple-500">
                    {prompts.filter(p => p.trim()).length}
                  </div>
                  <div className="text-sm text-gray-600">Active Prompts</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-indigo-500">
                    {results.length}
                  </div>
                  <div className="text-sm text-gray-600">Generated</div>
                </div>
              </div>
            </Card>
          </div>

          {/* Right: Results */}
          <div className="space-y-6">
            {results.length > 0 && (
              <Card className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Batch Results</h3>
                  <Button size="sm" onClick={downloadAll}>
                    <Download className="h-4 w-4 mr-1" />
                    Download All
                  </Button>
                </div>
                
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {results.map((result, index) => (
                    <div key={index} className="border rounded-lg overflow-hidden">
                      <img 
                        src={result.image}
                        alt={`Result ${result.index + 1}`}
                        className="w-full h-40 object-cover"
                      />
                      <div className="p-3 bg-gray-50">
                        <p className="text-sm font-medium text-purple-600 mb-1">
                          Prompt {result.index + 1}
                        </p>
                        <p className="text-xs text-gray-500">
                          {result.prompt.substring(0, 80)}...
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}