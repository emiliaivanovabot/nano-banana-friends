// OpenAI API Service for Instagram Reel Generator
// Generates structured prompts for Instagram posts

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY
const OPENAI_API_URL = 'https://api.openai.com/v1'

/**
 * Generate Instagram post prompts using ChatGPT
 * Based on n8n workflow system prompt
 */
export const generateInstagramPrompts = async (formData) => {
  try {
    const {
      creativeDirection,
      characterBrief,
      imageCount,
      videoCount,
      aspectRatio,
      imageFilenames = []
    } = formData

    // Build the prompt based on n8n workflow
    const systemPrompt = buildSystemPrompt()
    const userPrompt = buildUserPrompt({
      creativeDirection,
      characterBrief,
      imageCount,
      videoCount,
      aspectRatio,
      imageFilenames
    })

    const response = await fetch(`${OPENAI_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API failed: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()
    const generatedContent = result.choices[0]?.message?.content

    if (!generatedContent) {
      throw new Error('No content generated from OpenAI')
    }

    // Parse the JSON response
    const parsedContent = JSON.parse(generatedContent)
    
    return {
      success: true,
      data: parsedContent,
      rawResponse: result
    }
  } catch (error) {
    console.error('OpenAI Generation Error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Build system prompt based on n8n workflow
 */
const buildSystemPrompt = () => {
  return `## SYSTEM PROMPT: Unified Prompt Generator for AI Influencer Multimedia Posts 🎥🖼️

A – Ask:
Generate detailed prompts for a series of image and video posts based on a creative brief.
Return a single JSON object with a "posts" key containing one object per post.
Each object must contain a title, caption, post_type, image_prompt, and video_prompt.

G – Guidance:
role: content prompt engineer specializing in influencer multimedia posts
output_count: Equal to total number of image and video posts requested by the user
character_limit: None
constraints:
- Output must be a structured JSON object with a single top-level key: "posts"
  - Each post under "posts" must include:
    - title: Max 3 words, stylized and catchy
    - caption: No quotes, social and human tone, must include exactly 1 emoji and 2 hashtags
    - post_type: Either "image" or "video"
    - image_prompt: Always present, even for video posts
    - video_prompt: Always present; if post_type is "image", value must be: "not applicable"
    - Follow the creative direction closely; use it to guide:
    - the physical composition and style of the post 
    - what the subject is doing (especially interaction with item if the image is provided)
    - tone and polish of the aesthetic
  - Follow the character brief to guide:
    - tone of caption
    - energy of title
    - Use reference images (character_image, setting_image, item_image) when provided; infer plausible content if only filenames are given
    - Never refer to images by filename
    - Avoid including image URLs or markdown formatting
    - Never name the character; always refer to them as "the character in the image"  
    - Never modify the outfit or item from the reference when the request is to "wear" something

    🔹 image_prompt (always required, even for video posts):
    - Always begin with a sentence like: "Have the character [in the given setting image, if it's provided], [verb] with the item if it is provided]."
    - If a clothing item is provided, edit this starting sentence to say something like: "wearing the clothing that is provided"
    - subject: Based on character_image or character brief
    - setting: Derived from setting_image or creative direction
    - object: Based on item_image; describe interaction as per creative direction
    - action: Focus on interaction with the object (e.g. "posing with", "holding", "gesturing to") 
    - lighting: General description (e.g. "natural light", "studio-lit")
    - post_style: Aesthetic derived from creative direction and character brief

    🔹 video_prompt (always required):
    - subject: From character_image or character brief
    - setting: From setting_image or creative direction
    - action: Expressive movement, gesture, or behavior aligned with brief
    - lighting: General, consistent with image prompt
    - dialogue: If user provides one or requests for one in the Creative Direction section, include it. If not, use: "no dialogue"
    - music: If user requests music in the Creative Direction section, include appropriate ambient music. If not, use: "no music"
    - voice: If dialogue is provided or requested in Creative Direction, must be consistent with character brief. If not requested, use: "no dialogue"

E – Examples:
{
  "posts": {
    "post_1": {
      "title": "soft launch",
      "caption": "just me and my fave lil plush 🐰 #plushdrop #editorialenergy",
      "post_type": "image",
      "image_prompt": "Have the character in the given setting image, posing with the item that is provided.\\nsubject: the character in the image holding a pastel plush with bunny ears\\nsetting: Neutral beige background\\nobject: Metallic pink designer mini handbag\\naction: Posing with plush while showing off its accessories\\nlighting: Soft indoor studio-lit\\npost_style: High-fashion editorial realism with digital polish",
      "video_prompt": "not applicable"
    }
  }
}

N - Notation:
format: JSON
Return only valid JSON, no additional text or formatting.`
}

/**
 * Build user prompt with form data
 */
const buildUserPrompt = ({ creativeDirection, characterBrief, imageCount, videoCount, aspectRatio, imageFilenames }) => {
  return `**Give an image and video prompt for the posts below.**

Number of image posts needed: ${imageCount}
Number of video posts needed: ${videoCount}
Aspect ratio: ${aspectRatio}

CREATIVE DIRECTION:
${creativeDirection}

***

IMAGE REFERENCES:
The following image references are provided. Note that if the filename is present, that means the image reference exists.

character_image: ${imageFilenames[0] || 'Not provided'}
setting_image: ${imageFilenames[1] || 'Not provided'}
item_image: ${imageFilenames[2] || 'Not provided'}

***

CHARACTER BRIEF:
${characterBrief}

Generate the posts according to the system prompt requirements.`
}

/**
 * Default character brief (Miquela from n8n workflow)
 */
export const getDefaultCharacterBrief = () => {
  return `Name: Miquela
Age 25
She's expressive, fashion-forward, and unafraid to experiment with bold looks. Her posts balance playful selfies, high-fashion streetwear, and behind-the-scenes creative moments that feel spontaneous yet carefully curated.

Personality: Bubbly, confident, expressive, and adventurous – she radiates positive energy and connects easily with her audience through humor and authenticity.

Voice Style & Accent: Cheerful, natural conversational tone with a distinct Australian accent. She speaks casually, often using Gen Z slang and quick, witty phrasing that feels off-the-cuff but always on trend.

Target Audience: Gen Z and young millennials interested in fashion, digital culture, and creative tech. Followers who love style inspiration, futuristic aesthetics, and influencer authenticity with a digital twist.

Style Guide: Highly stylized yet approachable visual tone. Fashion is bold and experimental, featuring vibrant colors, metallic accents, and playful streetwear. Lighting is natural with occasional high-contrast studio shots. Frequent use of city backdrops, mirror selfies, and creative compositions that showcase individuality and confidence. Posts often include subtle nods to virtual identity and self-expression through digital means. The overall feed vibe is hyperreal, creative, and trend-driven – like a fashionable friend.`
}

export default {
  generateInstagramPrompts,
  getDefaultCharacterBrief
}