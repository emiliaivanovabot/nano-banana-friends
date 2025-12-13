'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@repo/ui'
import { Card } from '@repo/ui'
import { useAuth } from '@repo/auth-config'
import { CreditSystem, deductCredits } from '@repo/business-logic'
import { ArrowLeft, Download, Upload, X, Camera } from 'lucide-react'

export default function ClassicPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [prompt, setPrompt] = useState('')
  const [images, setImages] = useState<Array<{file: File, base64: string, name: string}>>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<{image: string, cost: number} | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [liveTimer, setLiveTimer] = useState(0)
  const [generationTime, setGenerationTime] = useState<number | null>(null)

  // Prompt templates from V1
  const promptTemplates = [
    {
      category: "Beauty & Close-ups",
      prompts: [
        "Using the provided image as reference, recreate this woman's face with extremely high fidelity. Create a high-end beauty portrait with flawless makeup, focus on eyes and lips, soft studio lighting, clean background, luxury beauty campaign style. Keep every facial feature exactly the same — eyes, nose, lips, eyebrows, bone structure. Enhance micro-details only: visible skin pores, natural skin texture, realistic highlights, soft shadows and depth. Maintain the original look, identity and proportions. Ultra-high resolution details.",
        "Using the provided image, recreate this woman's face with perfect accuracy. Create a glamour headshot with dramatic makeup and smoky eyes, professional beauty lighting, focus on facial features, magazine beauty editorial style. Keep all original facial features unchanged, enhance clarity and detail only.",
        "Using the provided image as base, recreate this woman's natural beauty with minimal makeup, glowing skin, soft natural lighting, clean simple background, fresh and organic beauty aesthetic. Maintain exact facial features, enhance skin texture and natural glow only."
      ]
    },
    {
      category: "Realistic",
      prompts: [
        "Take the provided image and recreate it with increased realism while keeping the woman's identity, pose, facial features, expression, lighting, and composition fully intact. Enhance natural skin texture, pores, micro-details, subtle facial hairs, light reflections, shadows, and depth. Improve fabric realism, color accuracy, contrast, and photographic clarity. Do not change her face, makeup, proportions, hairstyle, or clothing design — only make everything more realistic and true-to-life.",
        "Using the provided image as reference, enhance photorealistic details while preserving the exact identity and composition. Add natural skin imperfections, realistic hair texture, authentic fabric details, improved lighting depth, and enhanced shadows. Maintain all original facial features, expressions, and poses unchanged. Focus on making the image look like a high-quality professional photograph with natural authenticity.",
        "Transform the provided image into ultra-realistic photography while maintaining complete fidelity to the original subject. Enhance surface textures, add realistic environmental lighting, improve material properties, and increase photographic authenticity. Preserve every aspect of the woman's appearance, pose, and setting exactly as shown. Only enhance realism, depth, and photographic quality without altering any visual elements."
      ]
    }
  ]

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 14) {
      alert('Maximal 14 Bilder erlaubt')
      return
    }

    Promise.all(
      files.map(file => {
        return new Promise<{file: File, base64: string, name: string}>((resolve) => {
          const reader = new FileReader()
          reader.onload = (e) => resolve({
            file: file,
            base64: e.target?.result as string,
            name: file.name
          })
          reader.readAsDataURL(file)
        })
      })
    ).then(newImages => {
      setImages(prev => [...prev, ...newImages].slice(0, 14))
    })
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  const insertPromptTemplate = (template: string) => {
    setPrompt(template)
  }

  const downloadImage = () => {
    if (!result?.image) return
    
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
      link.download = `nano-banana-classic-${Date.now()}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed', error)
    }
  }

  const generateImage = async () => {
    if (!prompt.trim()) {
      alert('Bitte gib einen Prompt ein')
      return
    }

    setIsGenerating(true)
    setResult(null)
    setGenerationTime(null)
    setLiveTimer(0)
    setError(null)
    
    const startTime = Date.now()

    // Live Timer
    const timerInterval = setInterval(() => {
      const elapsed = ((Date.now() - startTime) / 1000)
      setLiveTimer(elapsed)
    }, 100)

    try {
      // Deduct credits first
      const creditResult = await deductCredits({
        userId: user?.id || '',
        service: 'gemini',
        amount: 0.10 // 10 cents per generation
      })
      
      if (!creditResult.success) {
        throw new Error('Insufficient credits')
      }

      // Call API route
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          images: images.map(img => img.base64),
          userId: user?.id
        }),
      })

      if (!response.ok) {
        throw new Error('Generation failed')
      }

      const data = await response.json()
      const endTime = Date.now()
      
      setResult({
        image: data.imageUrl,
        cost: 0.10
      })
      setGenerationTime((endTime - startTime) / 1000)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      clearInterval(timerInterval)
      setIsGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 p-4">
      <div className="max-w-4xl mx-auto">
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
            🍌 Nano Banana Classic
          </h1>
        </div>

        <CreditSystem userId={user?.id} service="gemini" />

        {/* Main Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Input */}
          <div className="space-y-6">
            {/* Prompt Input */}
            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">Prompt</h3>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your desired image..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                rows={6}
              />
            </Card>

            {/* Image Upload */}
            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">Reference Images</h3>
              <div className="space-y-4">
                <label className="block">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Button className="w-full" variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Images (max 14)
                  </Button>
                </label>
                
                {images.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {images.map((image, index) => (
                      <div key={index} className="relative">
                        <img 
                          src={image.base64} 
                          alt={`Upload ${index}`}
                          className="w-full h-20 object-cover rounded border"
                        />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            {/* Generate Button */}
            <Button 
              onClick={generateImage}
              disabled={!prompt.trim() || isGenerating}
              className="w-full banana-glow"
              size="lg"
            >
              {isGenerating ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Generating... {liveTimer.toFixed(1)}s
                </div>
              ) : (
                'Generate Image ✨'
              )}
            </Button>
          </div>

          {/* Right: Output */}
          <div className="space-y-6">
            {/* Prompt Templates */}
            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">Prompt Templates</h3>
              <div className="space-y-4">
                {promptTemplates.map((category, catIndex) => (
                  <div key={catIndex}>
                    <h4 className="font-medium text-gray-800 mb-2">{category.category}</h4>
                    <div className="space-y-2">
                      {category.prompts.map((template, promptIndex) => (
                        <button
                          key={promptIndex}
                          onClick={() => insertPromptTemplate(template)}
                          className="w-full text-left p-2 text-sm bg-gray-50 hover:bg-gray-100 rounded border"
                        >
                          {template.substring(0, 60)}...
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Error Display */}
            {error && (
              <Card className="p-4 bg-red-50 border-red-200">
                <p className="text-red-600">{error}</p>
              </Card>
            )}

            {/* Generated Image */}
            {result && (
              <Card className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Generated Image</h3>
                  <div className="flex items-center gap-2">
                    {generationTime && (
                      <span className="text-sm text-gray-500">
                        {generationTime.toFixed(1)}s
                      </span>
                    )}
                    <Button size="sm" onClick={downloadImage}>
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
                <div className="relative">
                  <img 
                    src={result.image}
                    alt="Generated by Nano Banana Classic"
                    className="w-full rounded-lg shadow-lg"
                  />
                </div>
                <div className="mt-2 text-sm text-gray-500 text-center">
                  Cost: ${result.cost.toFixed(2)}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}