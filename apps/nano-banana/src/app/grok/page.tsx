'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@repo/ui'
import { Card } from '@repo/ui'
import { useAuth } from '@repo/auth-config'
import { CreditSystem, deductCredits } from '@repo/business-logic'
import { ArrowLeft, Upload, Brain, Copy, RotateCcw } from 'lucide-react'

export default function GrokPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [image, setImage] = useState<string | null>(null)
  const [prompt, setPrompt] = useState('Describe what\'s in this image in detail.')
  const [analysis, setAnalysis] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Preset prompts for different use cases
  const promptPresets = [
    {
      category: "Image Description",
      prompts: [
        "Describe what's in this image in detail.",
        "What is the main subject of this image?",
        "Describe the setting and atmosphere of this image.",
        "What emotions does this image convey?"
      ]
    },
    {
      category: "Creative Prompts",
      prompts: [
        "Create a detailed prompt for generating a similar image using AI.",
        "Write a photography prompt that would recreate this image.",
        "Describe this image in a way that could be used for AI image generation.",
        "What artistic techniques and styles are visible in this image?"
      ]
    },
    {
      category: "Technical Analysis", 
      prompts: [
        "Analyze the lighting, composition and technical aspects of this image.",
        "What camera settings and techniques might have been used?",
        "Describe the color palette and visual elements.",
        "What photography style or genre does this represent?"
      ]
    },
    {
      category: "Content Analysis",
      prompts: [
        "What story does this image tell?",
        "Identify all objects and people in this image.",
        "What is happening in this scene?",
        "Describe the relationships between elements in this image."
      ]
    }
  ]

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => setImage(e.target?.result as string)
      reader.readAsDataURL(file)
      setError(null)
      setAnalysis('')
    }
  }

  const clearImage = () => {
    setImage(null)
    setAnalysis('')
    setError(null)
  }

  const analyzeImage = async () => {
    if (!image || !prompt || isAnalyzing) return
    
    setIsAnalyzing(true)
    setAnalysis('')
    setError(null)
    
    try {
      // Deduct credits first
      const creditResult = await deductCredits({
        userId: user?.id || '',
        service: 'grok',
        amount: 0.05 // 5 cents per analysis
      })
      
      if (!creditResult.success) {
        throw new Error('Insufficient credits')
      }

      // Call Grok API
      const response = await fetch('/api/grok', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image,
          prompt,
          userId: user?.id
        }),
      })

      if (!response.ok) {
        throw new Error('Analysis failed')
      }

      const data = await response.json()
      setAnalysis(data.analysis)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(analysis)
  }

  const useAsPrompt = () => {
    setPrompt(analysis)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-cyan-100 p-4">
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
            🧠 Grok Prompt Generator
          </h1>
        </div>

        <CreditSystem userId={user?.id} service="grok" />

        {/* Main Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Input */}
          <div className="space-y-6">
            {/* Image Upload */}
            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">Image Upload</h3>
              <div className="space-y-4">
                {!image ? (
                  <label className="block">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-green-500 transition-colors">
                      <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-600">Click to upload an image</p>
                      <p className="text-sm text-gray-400">PNG, JPG, GIF up to 10MB</p>
                    </div>
                  </label>
                ) : (
                  <div className="relative">
                    <img 
                      src={image} 
                      alt="Uploaded"
                      className="w-full h-64 object-cover rounded-lg"
                    />
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={clearImage}
                      className="absolute top-2 right-2"
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Clear
                    </Button>
                  </div>
                )}
              </div>
            </Card>

            {/* Analysis Prompt */}
            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">Analysis Question</h3>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="What would you like to know about this image?"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                rows={4}
              />
            </Card>

            {/* Analyze Button */}
            <Button 
              onClick={analyzeImage}
              disabled={!image || !prompt.trim() || isAnalyzing}
              className="w-full"
              size="lg"
            >
              {isAnalyzing ? (
                <div className="flex items-center justify-center">
                  <Brain className="h-5 w-5 mr-2 animate-pulse" />
                  Analyzing with Grok...
                </div>
              ) : (
                <>
                  <Brain className="h-5 w-5 mr-2" />
                  Analyze Image 🧠
                </>
              )}
            </Button>

            {/* Preset Prompts */}
            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">Quick Prompts</h3>
              <div className="space-y-4 max-h-64 overflow-y-auto">
                {promptPresets.map((category, catIndex) => (
                  <div key={catIndex}>
                    <h4 className="font-medium text-gray-800 mb-2">{category.category}</h4>
                    <div className="space-y-1">
                      {category.prompts.map((preset, promptIndex) => (
                        <button
                          key={promptIndex}
                          onClick={() => setPrompt(preset)}
                          className="w-full text-left p-2 text-sm bg-gray-50 hover:bg-green-50 rounded border transition-colors"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Right: Output */}
          <div className="space-y-6">
            {/* Error Display */}
            {error && (
              <Card className="p-4 bg-red-50 border-red-200">
                <p className="text-red-600">{error}</p>
              </Card>
            )}

            {/* Analysis Results */}
            {analysis && (
              <Card className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Analysis Results</h3>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={copyToClipboard}>
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                    <Button size="sm" onClick={useAsPrompt}>
                      Use as Prompt
                    </Button>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700">
                    {analysis}
                  </pre>
                </div>
              </Card>
            )}

            {/* Instructions */}
            {!analysis && !error && (
              <Card className="p-6 bg-green-50">
                <h3 className="text-lg font-medium mb-2">How Grok Works</h3>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Upload any image to analyze</li>
                  <li>• Choose a preset question or write your own</li>
                  <li>• Grok AI will analyze and describe the image</li>
                  <li>• Perfect for creating AI prompts from existing images</li>
                  <li>• Use the analysis to generate similar images</li>
                </ul>
                
                <div className="mt-4 p-3 bg-yellow-50 rounded">
                  <p className="text-sm text-yellow-800">
                    <strong>Pro Tip:</strong> Use "Create a detailed prompt for generating a similar image using AI" 
                    to get prompts you can use in the Classic or Img2Img modules!
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}