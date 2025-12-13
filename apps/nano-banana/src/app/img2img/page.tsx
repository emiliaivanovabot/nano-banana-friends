'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@repo/ui'
import { Card } from '@repo/ui'
import { useAuth } from '@repo/auth-config'
import { CreditSystem, deductCredits } from '@repo/business-logic'
import { ArrowLeft, Download, Upload, X, RefreshCw } from 'lucide-react'

export default function Img2ImgPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [prompt, setPrompt] = useState('')
  const [images, setImages] = useState<Array<{file: File, base64: string, name: string}>>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<{image: string, cost: number} | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [liveTimer, setLiveTimer] = useState(0)
  const [generationTime, setGenerationTime] = useState<number | null>(null)

  // Prompt templates for Image2Image from V1
  const promptTemplates = [
    {
      category: "Szenario-Änderungen",
      prompts: [
        "Using the provided images, take the face from the first image and place it on the person in the second image. Change the background to a tropical beach with palms and turquoise water. Ensure the facial features from the first image remain completely unchanged while adapting to the lighting and pose of the second image.",
        "Using the provided images, take the face from the first image and place it on the person in the second image. Change the facial expression to a radiant smile with sparkling eyes. Ensure all facial features from the first image remain identical while adapting to the second image's pose and setting.",
        "Using the provided images, take the face from the first image and place it on the person in the second image. Change the pose to a confident, dynamic stance with crossed arms. Ensure the facial features from the first image remain completely unchanged."
      ],
      labels: ["Strand Hintergrund", "Lächeln", "Selbstbewusste Pose"]
    },
    {
      category: "Outfit Changes", 
      prompts: [
        "Using the provided images, take the face from the first image and place it on the person in the second image. Transform the outfit into an elegant black evening dress with jewelry. Ensure the facial features from the first image remain completely unchanged while maintaining the pose from the second image.",
        "Using the provided images, take the face from the first image and place it on the person in the second image. Change the clothing to a modern streetwear look with hoodie and sneakers. Ensure all facial features from the first image remain identical.",
        "Using the provided images, take the face from the first image and place it on the person in the second image. Create a vintage 80s outfit with colorful patterns. Ensure the facial features from the first image remain completely unchanged."
      ],
      labels: ["Abendkleid", "Streetwear", "Vintage 80s"]
    },
    {
      category: "Posen-Transfer",
      prompts: [
        "Using the provided images, take the face from the first image and place it exactly on the person in the second image. Keep the exact pose, outfit and background from the second image unchanged. Ensure the facial features from the first image remain completely identical with natural lighting and shadows.",
        "Using the provided images, take the face from the first image and place it on the person in the second image. Maintain the dynamic pose from the second image completely. Ensure all facial features, hair color and skin tone from the first image are preserved exactly.",
        "Using the provided images, take the face from the first image and place it on the person in the second image. Keep the professional pose from the second image unchanged. Ensure the facial features from the first image remain completely unchanged with realistic integration."
      ],
      labels: ["Exakte Pose", "Dynamische Pose", "Profi-Pose"]
    },
    {
      category: "Perfekte Face-Swaps",
      prompts: [
        "Using the provided images, take the face from the first image and place it exactly on the person in the second image. Keep the pose, outfit, and background from the second image completely unchanged. Ensure the facial features from the first image remain completely identical with natural lighting adaptation.",
        "Using the provided images, take the face from the first image and seamlessly place it on the person in the second image. Maintain everything from the second image except replace the face. Ensure all facial features, hair color and skin tone from the first image are preserved exactly.",
        "Using the provided images, take the face from the first image and place it on the person in the second image with perfect lighting integration. Keep the scene from the second image unchanged. Ensure the facial features from the first image remain completely unchanged with realistic shadows and highlights."
      ],
      labels: ["Exakter Swap", "Nahtlos", "Perfekte Beleuchtung"]
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
      link.download = `nano-banana-img2img-${Date.now()}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed', error)
    }
  }

  const transformImage = async () => {
    if (!prompt.trim()) {
      alert('Bitte gib einen Prompt ein')
      return
    }

    if (images.length < 2) {
      alert('Für Image2Image sind mindestens 2 Bilder erforderlich')
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
        amount: 0.15 // 15 cents for image transformation
      })
      
      if (!creditResult.success) {
        throw new Error('Insufficient credits')
      }

      // Call API route
      const response = await fetch('/api/img2img', {
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
        throw new Error('Image transformation failed')
      }

      const data = await response.json()
      const endTime = Date.now()
      
      setResult({
        image: data.imageUrl,
        cost: 0.15
      })
      setGenerationTime((endTime - startTime) / 1000)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transformation failed')
    } finally {
      clearInterval(timerInterval)
      setIsGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 p-4">
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
            🖼️ Image to Image
          </h1>
        </div>

        <CreditSystem userId={user?.id} service="gemini" />

        {/* Main Interface */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left: Input */}
          <div className="space-y-6">
            {/* Images Upload */}
            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">Source Images</h3>
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
                    Upload Images (min 2, max 14)
                  </Button>
                </label>
                
                {images.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {images.map((image, index) => (
                      <div key={index} className="relative">
                        <img 
                          src={image.base64} 
                          alt={`Upload ${index + 1}`}
                          className="w-full h-24 object-cover rounded border"
                        />
                        <div className="absolute top-1 left-1 bg-black bg-opacity-60 text-white text-xs px-1 rounded">
                          {index + 1}
                        </div>
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
                
                {images.length > 0 && (
                  <p className="text-sm text-gray-600">
                    Face from image 1 → Pose from image 2
                  </p>
                )}
              </div>
            </Card>

            {/* Prompt Input */}
            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">Transformation Prompt</h3>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe how to transform the images..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
              />
            </Card>

            {/* Transform Button */}
            <Button 
              onClick={transformImage}
              disabled={!prompt.trim() || images.length < 2 || isGenerating}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <div className="flex items-center justify-center">
                  <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                  Transforming... {liveTimer.toFixed(1)}s
                </div>
              ) : (
                <>
                  <RefreshCw className="h-5 w-5 mr-2" />
                  Transform Images ✨
                </>
              )}
            </Button>
          </div>

          {/* Middle: Templates */}
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">Quick Templates</h3>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {promptTemplates.map((category, catIndex) => (
                  <div key={catIndex}>
                    <h4 className="font-medium text-gray-800 mb-2">{category.category}</h4>
                    <div className="space-y-2">
                      {category.prompts.map((template, promptIndex) => (
                        <button
                          key={promptIndex}
                          onClick={() => insertPromptTemplate(template)}
                          className="w-full text-left p-2 text-xs bg-gray-50 hover:bg-blue-50 rounded border transition-colors"
                        >
                          <div className="font-medium text-blue-600 mb-1">
                            {category.labels[promptIndex]}
                          </div>
                          <div className="text-gray-600">
                            {template.substring(0, 80)}...
                          </div>
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
                <p className="text-red-600 text-sm">{error}</p>
              </Card>
            )}
          </div>

          {/* Right: Output */}
          <div className="space-y-6">
            {result && (
              <Card className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Transformed Image</h3>
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
                    alt="Transformed by Nano Banana Img2Img"
                    className="w-full rounded-lg shadow-lg"
                  />
                </div>
                <div className="mt-2 text-sm text-gray-500 text-center">
                  Cost: ${result.cost.toFixed(2)}
                </div>
              </Card>
            )}

            {/* Instructions */}
            {!result && (
              <Card className="p-6 bg-blue-50">
                <h3 className="text-lg font-medium mb-2">How to Use</h3>
                <ol className="text-sm text-gray-600 space-y-2">
                  <li>1. Upload at least 2 images</li>
                  <li>2. First image = Source face/features</li>
                  <li>3. Second image = Target pose/scene</li>
                  <li>4. Choose a template or write custom prompt</li>
                  <li>5. Click Transform to create new image</li>
                </ol>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}