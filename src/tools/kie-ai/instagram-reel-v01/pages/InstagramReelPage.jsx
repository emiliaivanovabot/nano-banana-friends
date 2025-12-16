import React, { useState, useRef } from 'react'
import { useAuth } from '../../../../auth/AuthContext.jsx'
import { generateInstagramPrompts, getDefaultCharacterBrief } from '../services/openaiService.js'
import { uploadImageToKieAi, convertImageToBase64, generateNanoBananaImage, pollTaskStatus, checkNanoBananaStatus, generateVeoVideo, checkVeoVideoStatus } from '../services/kieAiService.js'

function InstagramReelPage() {
  const { user } = useAuth()
  
  // Form states
  const [uploadedImages, setUploadedImages] = useState([null, null, null]) // [character, setting, item]
  const [isDragOver, setIsDragOver] = useState(false)
  const [creativeDirection, setCreativeDirection] = useState('have the character wear the dress in the settings. she talks to the camera about how she loves it and that she got it from nano emilia.ivanova fashion.')
  const [imageCount, setImageCount] = useState(1)
  const [videoCount, setVideoCount] = useState(1)
  const [aspectRatio, setAspectRatio] = useState('9:16')
  const [characterBrief, setCharacterBrief] = useState(getDefaultCharacterBrief())
  
  // UI states
  const [expandedSections, setExpandedSections] = useState({
    uploads: true,
    creative: true,
    character: false,
    settings: false
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState('')
  const [generatedPosts, setGeneratedPosts] = useState([])
  const [error, setError] = useState('')
  const [chatGptResponse, setChatGptResponse] = useState(null)
  const [detailedLogs, setDetailedLogs] = useState([])
  
  // Add log function
  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString()
    setDetailedLogs(prev => [...prev, { timestamp, message, type }])
    console.log(`[${timestamp}] ${message}`)
  }
  
  // Refs
  const fileInputRefs = [useRef(null), useRef(null), useRef(null)]

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  // Image Upload Handlers (copied from working Seedream system)
  const handleFileSelect = (files, index = null) => {
    const fileArray = Array.from(files)
    
    // Basic validation
    const validFiles = fileArray.filter(file => {
      if (!file.type.startsWith('image/')) {
        setError('Please select only image files')
        return false
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setError(`File ${file.name} is too large (max 10MB)`)
        return false
      }
      return true
    })
    
    if (validFiles.length === 0) return
    
    const newImages = [...uploadedImages]
    
    if (index !== null) {
      // Single file for specific slot
      newImages[index] = validFiles[0]
    } else {
      // Multiple files, fill available slots
      validFiles.forEach((file, i) => {
        if (i < 3) {
          const emptySlot = newImages.findIndex(slot => slot === null)
          if (emptySlot !== -1) {
            newImages[emptySlot] = file
          }
        }
      })
    }
    
    setUploadedImages(newImages)
    setError('')
  }
  
  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragOver(true)
  }
  
  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragOver(false)
  }
  
  const handleDrop = (e, index = null) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = e.dataTransfer.files
    handleFileSelect(files, index)
  }
  
  const handleImageUpload = (index, file) => {
    if (file) {
      handleFileSelect([file], index)
    }
  }

  const removeImage = (index) => {
    const newImages = [...uploadedImages]
    newImages[index] = null
    setUploadedImages(newImages)
    if (fileInputRefs[index].current) {
      fileInputRefs[index].current.value = ''
    }
  }
  
  // Download function copied from working Nano-Banana system
  const downloadImage = (imageUrl, filename = 'instagram-post.png') => {
    if (!imageUrl) return
    
    try {
      // Check if it's a base64 image
      if (imageUrl.startsWith('data:image/')) {
        // Convert base64 to blob for proper download
        const base64Data = imageUrl.split(',')[1] // Remove data:image/png;base64, prefix
        const mimeType = imageUrl.split(',')[0].split(':')[1].split(';')[0] // Extract MIME type
        
        // Convert base64 to binary
        const binaryData = atob(base64Data)
        const bytes = new Uint8Array(binaryData.length)
        for (let i = 0; i < binaryData.length; i++) {
          bytes[i] = binaryData.charCodeAt(i)
        }
        
        // Create blob and download
        const blob = new Blob([bytes], { type: mimeType })
        const url = URL.createObjectURL(blob)
        
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        // Clean up
        URL.revokeObjectURL(url)
      } else {
        // External URL - open in new tab for now
        window.open(imageUrl, '_blank')
      }
    } catch (error) {
      console.error('Download failed:', error)
      setError('Download failed: ' + error.message)
    }
  }
  
  const saveImageToGallery = async (post, index) => {
    try {
      // For now, just download the image
      // Later we can integrate with actual save/gallery functionality
      const filename = `${post.title.replace(/\s+/g, '_')}_${post.post_type}_${index + 1}.png`
      downloadImage(post.image_url, filename)
      
      // TODO: Add actual save to database/gallery functionality here
      console.log('Saved to gallery:', filename)
    } catch (error) {
      console.error('Save failed:', error)
      setError('Save failed: ' + error.message)
    }
  }

  const generatePosts = async () => {
    if (!user) {
      setError('Please login to generate posts')
      return
    }

    setIsGenerating(true)
    setError('')
    setGenerationProgress('Starting generation...')
    setChatGptResponse(null)
    setDetailedLogs([])
    addLog('🚀 Instagram Post Generation Started', 'success')

    try {
      // Step 1: Upload images to KIE.AI if provided
      setGenerationProgress('Uploading images...')
      addLog('📁 Phase 1: Starting image upload to KIE.AI server...', 'info')
      const uploadedUrls = []
      const imageFilenames = []
      
      for (let i = 0; i < uploadedImages.length; i++) {
        if (uploadedImages[i]) {
          const base64 = await convertImageToBase64(uploadedImages[i])
          addLog(`⬆️ Uploading ${uploadedImages[i].name}...`)
          const uploadResult = await uploadImageToKieAi(base64, uploadedImages[i].name)
          
          if (uploadResult.success) {
            uploadedUrls.push(uploadResult.downloadUrl)
            imageFilenames.push(uploadedImages[i].name)
            addLog(`✅ Upload successful: ${uploadedImages[i].name}`, 'success')
          } else {
            addLog(`❌ Upload failed: ${uploadResult.error}`, 'error')
            throw new Error(`Image upload failed: ${uploadResult.error}`)
          }
        } else {
          uploadedUrls.push(null)
          imageFilenames.push('Not provided')
        }
      }

      // Step 2: Generate prompts with ChatGPT
      setGenerationProgress('Generating post prompts with AI...')
      addLog('🤖 Phase 2: Sending request to ChatGPT-4 for post generation...', 'info')
      addLog(`📝 Creative Direction: "${creativeDirection.substring(0, 60)}..."`, 'info')
      addLog(`👤 Character: Miquela (${imageCount} images, ${videoCount} videos)`, 'info')
      
      const promptResult = await generateInstagramPrompts({
        creativeDirection,
        characterBrief,
        imageCount,
        videoCount,
        aspectRatio,
        imageFilenames
      })

      if (!promptResult.success) {
        addLog(`❌ ChatGPT generation failed: ${promptResult.error}`, 'error')
        throw new Error(`Prompt generation failed: ${promptResult.error}`)
      }

      // Store ChatGPT response for display
      setChatGptResponse(promptResult.data)
      addLog('✅ ChatGPT response received successfully!', 'success')
      
      const posts = Object.values(promptResult.data.posts)
      addLog(`📋 Generated ${posts.length} structured posts:`, 'success')
      posts.forEach((post, i) => {
        addLog(`   ${i+1}. "${post.title}" (${post.post_type}) - ${post.caption.substring(0, 40)}...`, 'info')
        addLog(`      🎬 Video Check: video_prompt = "${post.video_prompt}"`, 'info')
      })
      
      setGenerationProgress(`Generated ${posts.length} post prompts. Starting all tasks...`)
      addLog('🎨 Phase 3: Starting all image and video tasks in parallel...', 'info')

      // Step 3: Start ALL tasks immediately (no waiting)
      const generatedResults = []
      for (let i = 0; i < posts.length; i++) {
        const post = posts[i]
        addLog(`🖼️ Starting image task ${i + 1}/${posts.length}: "${post.title}"`, 'info')
        addLog(`📝 Image Prompt: "${post.image_prompt.substring(0, 80)}..."`, 'info')
        
        // Start image generation (no await for results)
        const imageResult = await generateNanoBananaImage(
          post.image_prompt,
          uploadedUrls.filter(url => url !== null),
          aspectRatio
        )

        if (!imageResult.success) {
          throw new Error(`Image generation failed: ${imageResult.error}`)
        }

        addLog(`✅ Image generation task started: ${imageResult.taskId}`, 'success')

        const resultData = {
          ...post,
          image_taskId: imageResult.taskId,
          image_url: null, // Will be filled by polling
          video_url: null  // Will be filled by polling
        }
        
        // Start video generation if this is a video post (no await for results)
        if (post.post_type === 'video' && post.video_prompt !== 'not applicable') {
          addLog(`🎥 Starting video task for "${post.title}"`, 'info')
          addLog(`📝 Video Prompt: "${String(post.video_prompt).substring(0, 80)}..."`, 'info')
          
          // Use uploaded character image as reference for video
          const videoImageRef = uploadedUrls.find(url => url !== null)
          
          const videoResult = await generateVeoVideo(
            post.video_prompt,
            videoImageRef, // Use uploaded character image as reference
            aspectRatio
          )
          
          if (videoResult.success && videoResult.taskId) {
            resultData.video_taskId = videoResult.taskId
            addLog(`✅ Video generation task started: ${videoResult.taskId}`, 'success')
          } else {
            addLog(`⚠️ Video generation request failed, will show image only: ${videoResult.error}`, 'warning')
          }
        }
        
        generatedResults.push(resultData)
      }

      // Set initial results (empty images/videos)
      setGeneratedPosts([...generatedResults])
      setGenerationProgress('All tasks started. Setting up optimized polling...')
      addLog(`🔄 All ${generatedResults.length} tasks started. Setting up separate polling for images and videos...`, 'success')
      
      // SEPARATE POLLING SYSTEM - Images vs Videos based on experience
      
      // IMAGE POLLING: Start after 25s, poll every 5s, timeout at 60s
      const imagePolling = setTimeout(() => {
        addLog(`🖼️ Starting image polling (Nano-Banana tasks)...`, 'info')
        let imageElapsed = 0
        const imageInterval = setInterval(async () => {
          imageElapsed += 5
          let hasImageUpdates = false
          
          for (let i = 0; i < generatedResults.length; i++) {
            const post = generatedResults[i]
            if (post.image_taskId && !post.image_url) {
              try {
                const imageStatus = await checkNanoBananaStatus(post.image_taskId)
                if (imageStatus.success && imageStatus.state === 'success') {
                  const imageUrl = imageStatus.resultUrls?.[0]
                  if (imageUrl) {
                    generatedResults[i].image_url = imageUrl
                    addLog(`✅ Image completed for "${post.title}" after ${imageElapsed + 25}s`, 'success')
                    hasImageUpdates = true
                  }
                }
              } catch (error) {
                addLog(`⚠️ Image check failed for "${post.title}": ${error.message}`, 'warning')
              }
            }
          }
          
          if (hasImageUpdates) {
            setGeneratedPosts([...generatedResults])
          }
          
          // Check if all images done OR timeout
          const allImagesDone = generatedResults.every(p => p.image_url !== null)
          if (allImagesDone || imageElapsed >= 35) { // 25s + 35s = 60s total
            clearInterval(imageInterval)
            addLog(allImagesDone ? `✅ All images completed!` : `⏰ Image polling timeout (60s)`, allImagesDone ? 'success' : 'warning')
            checkIfAllComplete()
          }
        }, 5000)
      }, 25000) // Start after 25 seconds
      
      // VIDEO POLLING: Start after 60s, poll every 5s, timeout at 200s  
      const videoTasks = generatedResults.filter(p => p.video_taskId)
      if (videoTasks.length > 0) {
        const videoPolling = setTimeout(() => {
          addLog(`🎥 Starting video polling (VEO tasks)...`, 'info')
          let videoElapsed = 0
          const videoInterval = setInterval(async () => {
            videoElapsed += 5
            let hasVideoUpdates = false
            
            for (let i = 0; i < generatedResults.length; i++) {
              const post = generatedResults[i]
              if (post.video_taskId && !post.video_url) {
                try {
                  const videoStatus = await checkVeoVideoStatus(post.video_taskId)
                  addLog(`🔍 Video status for "${post.title}": state=${videoStatus.state}, success=${videoStatus.success}`, 'info')
                  if (videoStatus.success && videoStatus.state === 'success') {
                    const videoUrl = videoStatus.resultUrls?.[0] // Correct: resultUrls is Array per 2025 docs
                    addLog(`🎬 Video URL found: ${videoUrl ? videoUrl.substring(0, 50) + '...' : 'NONE'}`, videoUrl ? 'success' : 'warning')
                    if (videoUrl) {
                      generatedResults[i].video_url = videoUrl
                      addLog(`✅ Video completed for "${post.title}" after ${videoElapsed + 60}s`, 'success')
                      hasVideoUpdates = true
                    }
                  }
                } catch (error) {
                  addLog(`⚠️ Video check failed for "${post.title}": ${error.message}`, 'warning')
                }
              }
            }
            
            if (hasVideoUpdates) {
              setGeneratedPosts([...generatedResults])
            }
            
            // Check if all videos done OR timeout
            const allVideosDone = generatedResults.every(p => p.post_type !== 'video' || p.video_url !== null)
            if (allVideosDone || videoElapsed >= 140) { // 60s + 140s = 200s total
              clearInterval(videoInterval)
              addLog(allVideosDone ? `✅ All videos completed!` : `⏰ Video polling timeout (200s)`, allVideosDone ? 'success' : 'warning')
              checkIfAllComplete()
            }
          }, 5000)
        }, 60000) // Start after 60 seconds
      }
      
      // Helper function to check completion
      function checkIfAllComplete() {
        const finalImageCount = generatedResults.filter(p => p.image_url).length
        const finalVideoCount = generatedResults.filter(p => p.video_url).length
        const totalImages = generatedResults.length
        const totalVideos = generatedResults.filter(p => p.post_type === 'video').length
        
        setGenerationProgress(`Images: ${finalImageCount}/${totalImages}, Videos: ${finalVideoCount}/${totalVideos}`)
        
        // Check if everything is done
        const allImagesDone = generatedResults.every(p => p.image_url !== null)
        const allVideosDone = generatedResults.every(p => p.post_type !== 'video' || p.video_url !== null)
        
        if (allImagesDone && allVideosDone) {
          setIsGenerating(false)
          setGenerationProgress(`Complete! Generated ${finalImageCount} images, ${finalVideoCount} videos.`)
          addLog(`🎉 All tasks completed! ${finalImageCount} images, ${finalVideoCount} videos`, 'success')
        }
      }
      
    } catch (error) {
      console.error('Generation failed:', error)
      addLog(`❌ Generation failed: ${error.message}`, 'error')
      setError(error.message)
      setGenerationProgress('')
      setIsGenerating(false)
    }
  }

  const imageLabels = ['Character Image*', 'Setting Image', 'Item Image']
  const imageDescriptions = [
    'Required: The person who will appear in posts',
    'Optional: Background/location for posts',
    'Optional: Product/clothing for integration'
  ]

  return (
    <div className="instagram-page">
      {/* Header */}
      <div className="instagram-header">
        <h1 className="instagram-title">
          📱 Instagram Reel AI
        </h1>
        <p className="instagram-subtitle">
          AI-powered social media content creator
        </p>
      </div>

      {/* Main Form */}
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        {/* Image Uploads Section */}
        <div className="instagram-form-section">
          <button 
            onClick={() => toggleSection('uploads')}
            style={{
              width: '100%',
              background: 'none',
              border: 'none',
              padding: '0',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: expandedSections.uploads ? '20px' : '0'
            }}
          >
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
              📷 Image Uploads
            </h3>
            <span style={{ fontSize: '20px' }}>
              {expandedSections.uploads ? '▼' : '▶'}
            </span>
          </button>
          
          {expandedSections.uploads && (
            <div>
              {/* Enhanced Upload Area with Drag & Drop - Dreier Grid */}
              <div style={{
                display: 'grid',
                gap: '20px',
                gridTemplateColumns: 'repeat(3, 1fr)',
                marginBottom: '20px'
              }}>
                {uploadedImages.map((image, index) => (
                  <div key={index} style={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    padding: '16px',
                    textAlign: 'center'
                  }}>
                    <h4 style={{
                      margin: '0 0 12px 0',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: 'hsl(var(--foreground))'
                    }}>
                      {imageLabels[index]}
                    </h4>
                    
                    <input
                      ref={fileInputRefs[index]}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/bmp,image/tiff,image/gif"
                      onChange={(e) => handleImageUpload(index, e.target.files[0])}
                      style={{ display: 'none' }}
                    />
                    
                    {image ? (
                      <div style={{ textAlign: 'center' }}>
                        <div style={{
                          position: 'relative',
                          display: 'inline-block',
                          marginBottom: '12px'
                        }}>
                          <img 
                            src={URL.createObjectURL(image)} 
                            alt="Preview"
                            style={{ 
                              width: '120px', 
                              height: '120px', 
                              objectFit: 'cover', 
                              borderRadius: '8px',
                              border: '1px solid hsl(var(--border))'
                            }}
                          />
                          <button
                            onClick={() => removeImage(index)}
                            style={{
                              position: 'absolute',
                              top: '-8px',
                              right: '-8px',
                              background: 'hsl(var(--destructive))',
                              color: 'white',
                              border: 'none',
                              borderRadius: '50%',
                              width: '24px',
                              height: '24px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            ✕
                          </button>
                        </div>
                        <p style={{ 
                          margin: '0', 
                          fontSize: '12px', 
                          color: 'hsl(var(--muted-foreground))',
                          wordBreak: 'break-word'
                        }}>
                          {image.name}
                        </p>
                        <p style={{ 
                          margin: '4px 0 0 0', 
                          fontSize: '11px', 
                          color: 'hsl(var(--muted-foreground))',
                          opacity: 0.7
                        }}>
                          {(image.size / (1024 * 1024)).toFixed(1)} MB
                        </p>
                      </div>
                    ) : (
                      <button
                        onClick={() => fileInputRefs[index].current?.click()}
                        onDragOver={(e) => {
                          e.preventDefault()
                          setIsDragOver(true)
                        }}
                        onDragLeave={(e) => {
                          e.preventDefault()
                          setIsDragOver(false)
                        }}
                        onDrop={(e) => handleDrop(e, index)}
                        style={{
                          width: '100%',
                          minHeight: '120px',
                          background: isDragOver 
                            ? 'hsl(var(--primary) / 0.15)' 
                            : 'hsl(var(--muted) / 0.3)',
                          border: isDragOver 
                            ? '2px dashed hsl(var(--primary))' 
                            : '2px dashed hsl(var(--border))',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px'
                        }}
                        onMouseEnter={(e) => {
                          if (!isDragOver) {
                            e.currentTarget.style.background = 'hsl(var(--primary) / 0.1)'
                            e.currentTarget.style.borderColor = 'hsl(var(--primary) / 0.5)'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isDragOver) {
                            e.currentTarget.style.background = 'hsl(var(--muted) / 0.3)'
                            e.currentTarget.style.borderColor = 'hsl(var(--border))'
                          }
                        }}
                      >
                        <div style={{ fontSize: '32px', opacity: 0.6 }}>📁</div>
                        <div style={{
                          fontSize: '13px',
                          fontWeight: '500',
                          color: 'hsl(var(--foreground))'
                        }}>
                          Click or Drag & Drop
                        </div>
                        <div style={{
                          fontSize: '11px',
                          color: 'hsl(var(--muted-foreground))',
                          textAlign: 'center',
                          lineHeight: '1.3'
                        }}>
                          {imageDescriptions[index]}
                          <br />
                          <span style={{ opacity: 0.7 }}>Max 10MB • JPEG, PNG, WebP</span>
                        </div>
                      </button>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Upload Info */}
              <div style={{
                background: 'hsl(var(--muted) / 0.1)',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '12px',
                color: 'hsl(var(--muted-foreground))',
                textAlign: 'center'
              }}>
                💡 <strong>Tipp:</strong> Ziehen Sie Bilder direkt in die Upload-Bereiche oder klicken Sie zum Auswählen
              </div>
            </div>
          )}
        </div>

        {/* Creative Direction Section */}
        <div className="instagram-form-section">
          <button 
            onClick={() => toggleSection('creative')}
            style={{
              width: '100%',
              background: 'none',
              border: 'none',
              padding: '0',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: expandedSections.creative ? '20px' : '0'
            }}
          >
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
              🎯 Creative Direction
            </h3>
            <span style={{ fontSize: '20px' }}>
              {expandedSections.creative ? '▼' : '▶'}
            </span>
          </button>
          
          {expandedSections.creative && (
            <textarea
              value={creativeDirection}
              onChange={(e) => setCreativeDirection(e.target.value)}
              placeholder="Describe what you want the character to do, how to interact with items, setting, etc..."
              style={{
                width: '100%',
                minHeight: '120px',
                padding: '12px',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                background: 'hsl(var(--background))',
                color: 'hsl(var(--foreground))',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
            />
          )}
        </div>

        {/* Character Brief Section */}
        <div className="instagram-form-section">
          <button 
            onClick={() => toggleSection('character')}
            style={{
              width: '100%',
              background: 'none',
              border: 'none',
              padding: '0',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: expandedSections.character ? '20px' : '0'
            }}
          >
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
              👤 Character Brief (Advanced)
            </h3>
            <span style={{ fontSize: '20px' }}>
              {expandedSections.character ? '▼' : '▶'}
            </span>
          </button>
          
          {expandedSections.character && (
            <textarea
              value={characterBrief}
              onChange={(e) => setCharacterBrief(e.target.value)}
              placeholder="Character personality, voice, style guide..."
              style={{
                width: '100%',
                minHeight: '200px',
                padding: '12px',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                background: 'hsl(var(--background))',
                color: 'hsl(var(--foreground))',
                resize: 'vertical',
                fontFamily: 'monospace',
                fontSize: '13px'
              }}
            />
          )}
        </div>

        {/* Generation Settings Section */}
        <div className="instagram-form-section">
          <button 
            onClick={() => toggleSection('settings')}
            style={{
              width: '100%',
              background: 'none',
              border: 'none',
              padding: '0',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: expandedSections.settings ? '20px' : '0'
            }}
          >
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
              ⚙️ Generation Settings
            </h3>
            <span style={{ fontSize: '20px' }}>
              {expandedSections.settings ? '▼' : '▶'}
            </span>
          </button>
          
          {expandedSections.settings && (
            <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Images: {imageCount}
                </label>
                <input
                  type="range"
                  min="1"
                  max="4"
                  value={imageCount}
                  onChange={(e) => setImageCount(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Videos: {videoCount}
                </label>
                <input
                  type="range"
                  min="0"
                  max="3"
                  value={videoCount}
                  onChange={(e) => setVideoCount(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Aspect Ratio
                </label>
                <select
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '4px',
                    background: 'hsl(var(--background))',
                    color: 'hsl(var(--foreground))'
                  }}
                >
                  <option value="9:16">9:16 (Stories/Reels)</option>
                  <option value="3:4">3:4 (Feed Posts)</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Generate Button */}
        <div style={{ textAlign: 'center', margin: '30px 0' }}>
          <button
            onClick={generatePosts}
            disabled={isGenerating || !uploadedImages[0]}
            className="instagram-btn"
            style={{
              padding: '16px 32px',
              fontSize: '16px',
              fontWeight: '600',
              opacity: isGenerating || !uploadedImages[0] ? 0.6 : 1,
              cursor: isGenerating || !uploadedImages[0] ? 'not-allowed' : 'pointer'
            }}
          >
            {isGenerating ? '🔄 Generating...' : '🚀 Generate Instagram Posts'}
          </button>
          
          {!uploadedImages[0] && (
            <p style={{ margin: '8px 0 0 0', color: 'hsl(var(--destructive))', fontSize: '14px' }}>
              Character image is required
            </p>
          )}
        </div>

        {/* Progress */}
        {generationProgress && (
          <div style={{
            background: 'hsl(var(--muted) / 0.1)',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            padding: '16px',
            textAlign: 'center',
            margin: '20px 0'
          }}>
            <p style={{ margin: 0, color: 'hsl(var(--foreground))' }}>
              {generationProgress}
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            background: 'hsl(var(--destructive) / 0.1)',
            border: '1px solid hsl(var(--destructive))',
            borderRadius: '8px',
            padding: '16px',
            margin: '20px 0',
            color: 'hsl(var(--destructive))'
          }}>
            <strong>Error:</strong> {error}
          </div>
        )}
        
        {/* Live Generation Progress */}
        {(isGenerating || detailedLogs.length > 0) && (
          <div style={{
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '20px'
          }}>
            <h3 style={{
              margin: '0 0 16px 0',
              fontSize: '16px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              {isGenerating ? '🔄' : '✅'} Generation Log
              {isGenerating && (
                <span style={{
                  fontSize: '12px',
                  background: 'var(--instagram)',
                  color: 'white',
                  padding: '2px 6px',
                  borderRadius: '10px'
                }}>
                  LIVE
                </span>
              )}
            </h3>
            
            {/* Current Progress */}
            {generationProgress && (
              <div style={{
                background: 'hsl(var(--muted) / 0.3)',
                padding: '10px',
                borderRadius: '6px',
                marginBottom: '12px',
                fontWeight: '500',
                color: 'hsl(var(--primary))'
              }}>
                ⏳ {generationProgress}
              </div>
            )}
            
            {/* Detailed Logs */}
            <div style={{
              maxHeight: '300px',
              overflowY: 'auto',
              background: 'hsl(var(--muted) / 0.1)',
              borderRadius: '6px',
              padding: '12px',
              fontFamily: 'monospace',
              fontSize: '12px',
              lineHeight: '1.4'
            }}>
              {detailedLogs.length === 0 ? (
                <div style={{ opacity: 0.7, fontStyle: 'italic' }}>
                  Waiting for generation to start...
                </div>
              ) : (
                detailedLogs.map((log, index) => (
                  <div key={index} style={{
                    marginBottom: '4px',
                    color: log.type === 'error' ? '#DC2626' : 
                           log.type === 'success' ? '#059669' :
                           log.type === 'warning' ? '#D97706' : 'hsl(var(--foreground))'
                  }}>
                    <span style={{ opacity: 0.7 }}>[{log.timestamp}]</span> {log.message}
                  </div>
                ))
              )}
              {isGenerating && (
                <div style={{
                  marginTop: '8px',
                  opacity: 0.7,
                  fontStyle: 'italic'
                }}>
                  🔄 Live updates...
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* ChatGPT Response Display */}
        {chatGptResponse && (
          <div style={{
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '20px'
          }}>
            <h3 style={{
              margin: '0 0 16px 0',
              fontSize: '16px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              🤖 ChatGPT Response
            </h3>
            <pre style={{
              background: 'hsl(var(--muted) / 0.1)',
              padding: '12px',
              borderRadius: '6px',
              fontSize: '11px',
              overflow: 'auto',
              maxHeight: '200px',
              fontFamily: 'monospace',
              margin: 0,
              color: 'hsl(var(--foreground))'
            }}>
              {JSON.stringify(chatGptResponse, null, 2)}
            </pre>
          </div>
        )}

        {/* Generated Posts */}
        {generatedPosts.length > 0 && (
          <div style={{ margin: '40px 0' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>
              📱 Generated Posts
            </h2>
            <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
              {generatedPosts.map((post, index) => (
                <div key={index} style={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  padding: '20px',
                  textAlign: 'center'
                }}>
                  <h3 style={{ margin: '0 0 12px 0', fontWeight: '600' }}>
                    {post.title}
                  </h3>
                  
                  {/* Display based on post_type - FIXED: Show correct content type */}
                  {post.post_type === 'video' ? (
                    post.video_url ? (
                      <video 
                        src={post.video_url}
                        controls
                        style={{
                          width: '100%',
                          maxWidth: '200px',
                          height: 'auto',
                          borderRadius: '8px',
                          marginBottom: '12px'
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '100%',
                        maxWidth: '200px',
                        height: '150px',
                        background: 'hsl(var(--muted))',
                        borderRadius: '8px',
                        marginBottom: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px dashed hsl(var(--border))'
                      }}>
                        🎬 Video wird generiert...
                      </div>
                    )
                  ) : (
                    post.image_url ? (
                      <img 
                        src={post.image_url}
                        alt={post.title}
                        style={{
                          width: '100%',
                          maxWidth: '200px',
                          height: 'auto',
                          borderRadius: '8px',
                          marginBottom: '12px'
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '100%',
                        maxWidth: '200px',
                        height: '150px',
                        background: 'hsl(var(--muted))',
                        borderRadius: '8px',
                        marginBottom: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px dashed hsl(var(--border))'
                      }}>
                        🖼️ Bild wird generiert...
                      </div>
                    )
                  )}
                  
                  {(post.video_taskId || post.image_taskId) && (
                    <div style={{
                      width: '100%',
                      maxWidth: '200px',
                      height: '200px',
                      borderRadius: '8px',
                      marginBottom: '12px',
                      background: 'hsl(var(--muted) / 0.3)',
                      border: '2px dashed hsl(var(--border))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column',
                      gap: '8px'
                    }}>
                      <div style={{ fontSize: '32px', opacity: 0.6 }}>
                        {post.post_type === 'video' ? '🎬' : '🖼️'}
                      </div>
                      <div style={{ fontSize: '12px', opacity: 0.7 }}>
                        {post.post_type === 'video' && post.video_taskId ? 'Generating video...' : 'Generating image...'}
                      </div>
                      <div style={{ fontSize: '10px', opacity: 0.5 }}>
                        Task ID: {post.video_taskId || post.image_taskId || 'pending'}
                      </div>
                    </div>
                  )}
                  <p style={{
                    margin: '12px 0',
                    fontStyle: 'italic',
                    color: 'hsl(var(--muted-foreground))',
                    fontSize: '14px'
                  }}>
                    "{post.caption}"
                  </p>
                  
                  {/* PROMPT ANZEIGEN - wie gewünscht */}
                  {post.post_type === 'video' && post.video_prompt && (
                    <div style={{
                      margin: '8px 0',
                      padding: '8px',
                      background: 'hsl(var(--muted))',
                      borderRadius: '6px',
                      fontSize: '12px',
                      color: 'hsl(var(--muted-foreground))'
                    }}>
                      <strong>🎬 Video Prompt:</strong><br />
                      {String(post.video_prompt).substring(0, 100)}...
                    </div>
                  )}
                  {post.post_type === 'image' && post.image_prompt && (
                    <div style={{
                      margin: '8px 0',
                      padding: '8px',
                      background: 'hsl(var(--muted))',
                      borderRadius: '6px',
                      fontSize: '12px',
                      color: 'hsl(var(--muted-foreground))'
                    }}>
                      <strong>🖼️ Image Prompt:</strong><br />
                      {String(post.image_prompt).substring(0, 100)}...
                    </div>
                  )}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    marginTop: '12px'
                  }}>
                    <span style={{
                      background: post.post_type === 'video' ? 'var(--instagram)' : 'hsl(var(--muted))',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}>
                      {post.post_type.toUpperCase()}
                    </span>
                  </div>
                  
                  {/* Action Buttons */}
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    justifyContent: 'center',
                    marginTop: '16px'
                  }}>
                    <button
                      onClick={() => {
                        const mediaUrl = post.post_type === 'video' ? post.video_url : post.image_url
                        if (mediaUrl) {
                          downloadImage(mediaUrl, `${post.title.replace(/\s+/g, '_')}_${index + 1}.${post.post_type === 'video' ? 'mp4' : 'png'}`)
                        }
                      }}
                      disabled={post.post_type === 'video' ? !post.video_url : !post.image_url}
                      style={{
                        padding: '8px 12px',
                        background: (post.post_type === 'video' ? !post.video_url : !post.image_url) ? '#9CA3AF' : '#10B981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: (post.post_type === 'video' ? !post.video_url : !post.image_url) ? 'not-allowed' : 'pointer',
                        fontSize: '12px',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'all 0.3s ease',
                        opacity: (post.post_type === 'video' ? !post.video_url : !post.image_url) ? 0.6 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (post.post_type === 'video' ? post.video_url : post.image_url) {
                          e.currentTarget.style.background = '#059669'
                          e.currentTarget.style.transform = 'translateY(-1px)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (post.post_type === 'video' ? post.video_url : post.image_url) {
                          e.currentTarget.style.background = '#10B981'
                          e.currentTarget.style.transform = 'translateY(0)'
                        }
                      }}
                    >
                      📥 {(post.post_type === 'video' ? !post.video_url : !post.image_url) ? 'Generating...' : `Download ${post.post_type === 'video' ? 'Video' : 'Image'}`}
                    </button>
                    
                    <button
                      onClick={() => {
                        if (post.post_type === 'video' ? post.video_url : post.image_url) {
                          saveImageToGallery(post, index)
                        }
                      }}
                      disabled={post.post_type === 'video' ? !post.video_url : !post.image_url}
                      style={{
                        padding: '8px 12px',
                        background: (post.post_type === 'video' ? !post.video_url : !post.image_url) ? '#9CA3AF' : 'var(--instagram)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: (post.post_type === 'video' ? !post.video_url : !post.image_url) ? 'not-allowed' : 'pointer',
                        fontSize: '12px',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'all 0.3s ease',
                        opacity: (post.post_type === 'video' ? !post.video_url : !post.image_url) ? 0.6 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (post.post_type === 'video' ? post.video_url : post.image_url) {
                          e.currentTarget.style.opacity = '0.9'
                          e.currentTarget.style.transform = 'translateY(-1px)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (post.post_type === 'video' ? post.video_url : post.image_url) {
                          e.currentTarget.style.opacity = '1'
                          e.currentTarget.style.transform = 'translateY(0)'
                        }
                      }}
                    >
                      💾 {(post.post_type === 'video' ? !post.video_url : !post.image_url) ? 'Pending...' : 'Save'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default InstagramReelPage