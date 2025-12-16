// KIE.AI API Service for Instagram Reel Generator
// Based on n8n workflow APIs

const KIE_AI_API_KEY = import.meta.env.VITE_KIE_AI_API_KEY
const KIE_AI_API_URL = import.meta.env.VITE_KIE_AI_API_URL
const KIE_AI_UPLOAD_URL = import.meta.env.VITE_KIE_AI_UPLOAD_URL

// Headers for KIE.AI API requests
const getKieAiHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${KIE_AI_API_KEY}`,
  // Add any other required headers from n8n workflow
})

/**
 * Upload image file to KIE.AI file storage
 * Based on: POST https://kieai.redpandaai.co/api/file-base64-upload
 */
export const uploadImageToKieAi = async (base64Data, fileName = null) => {
  try {
    const response = await fetch(`${KIE_AI_UPLOAD_URL}/api/file-base64-upload`, {
      method: 'POST',
      headers: getKieAiHeaders(),
      body: JSON.stringify({
        base64Data: base64Data,
        uploadPath: 'documents/upload',
        fileName: fileName || `${Date.now()}.jpg`
      })
    })

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()
    return {
      success: true,
      data: result,
      downloadUrl: result.data?.downloadUrl
    }
  } catch (error) {
    console.error('KIE.AI Upload Error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Generate image using Nano-Banana Edit model
 * Based on: POST https://api.kie.ai/api/v1/jobs/createTask
 */
export const generateNanoBananaImage = async (prompt, imageUrls = [], aspectRatio = '9:16') => {
  try {
    const requestBody = {
      model: 'google/nano-banana-edit',
      input: {
        output_format: 'jpeg',
        image_size: aspectRatio,
        prompt: prompt
      }
    }

    // Add image URLs if provided
    if (imageUrls.length > 0) {
      requestBody.input.image_urls = imageUrls
    }

    const response = await fetch(`${KIE_AI_API_URL}/api/v1/jobs/createTask`, {
      method: 'POST',
      headers: getKieAiHeaders(),
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      throw new Error(`Image generation failed: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()
    return {
      success: true,
      taskId: result.data?.taskId,
      data: result
    }
  } catch (error) {
    console.error('Nano-Banana Generation Error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Check status of Nano-Banana image generation
 * Based on: GET https://api.kie.ai/api/v1/jobs/recordInfo
 */
export const checkNanoBananaStatus = async (taskId) => {
  try {
    const response = await fetch(
      `${KIE_AI_API_URL}/api/v1/jobs/recordInfo?taskId=${taskId}`,
      {
        method: 'GET',
        headers: getKieAiHeaders()
      }
    )

    if (!response.ok) {
      throw new Error(`Status check failed: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()
    return {
      success: true,
      state: result.data?.state,
      resultUrls: result.data?.resultJson ? JSON.parse(result.data.resultJson).resultUrls : null,
      data: result
    }
  } catch (error) {
    console.error('Status Check Error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Generate video using VEO3 model
 * Based on: POST https://api.kie.ai/api/v1/veo/generate
 */
export const generateVeoVideo = async (videoPrompt, imageUrl, aspectRatio = '9:16') => {
  try {
    const requestBody = {
      prompt: videoPrompt,
      model: 'veo3_fast',
      aspectRatio: aspectRatio,
      enableTranslation: false,
      generationType: 'FIRST_AND_LAST_FRAMES_2_VIDEO',
      imageUrls: [imageUrl]
    }

    const response = await fetch(`${KIE_AI_API_URL}/api/v1/veo/generate`, {
      method: 'POST',
      headers: getKieAiHeaders(),
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      throw new Error(`Video generation failed: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()
    return {
      success: true,
      taskId: result.data?.taskId,
      data: result
    }
  } catch (error) {
    console.error('VEO Video Generation Error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Check status of VEO video generation
 * Based on: GET https://api.kie.ai/api/v1/veo/record-info
 */
export const checkVeoVideoStatus = async (taskId) => {
  try {
    const response = await fetch(
      `${KIE_AI_API_URL}/api/v1/veo/record-info?taskId=${taskId}`,
      {
        method: 'GET',
        headers: getKieAiHeaders()
      }
    )

    if (!response.ok) {
      throw new Error(`Video status check failed: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()
    return {
      success: true,
      state: result.data?.successFlag === 1 ? 'success' : 
             result.data?.successFlag === 0 ? 'generating' : 'failed',
      resultUrls: result.data?.response?.resultUrls,
      data: result
    }
  } catch (error) {
    console.error('Video Status Check Error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Convert image file to base64 for upload
 */
export const convertImageToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      // Remove the data:image/jpeg;base64, prefix
      const base64 = reader.result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Utility function to poll task status until completion
 */
export const pollTaskStatus = async (taskId, checkFunction, maxAttempts = 60, interval = 5000) => {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const status = await checkFunction(taskId)
    
    if (!status.success) {
      throw new Error(`Status check failed: ${status.error}`)
    }

    if (status.state === 'success') {
      return status
    } else if (status.state === 'error') {
      throw new Error('Task failed on server')
    }

    // Task is still in progress, wait and retry
    await new Promise(resolve => setTimeout(resolve, interval))
  }

  throw new Error('Task timed out')
}

// Export all functions
export default {
  uploadImageToKieAi,
  generateNanoBananaImage,
  checkNanoBananaStatus,
  generateVeoVideo,
  checkVeoVideoStatus,
  convertImageToBase64,
  pollTaskStatus
}