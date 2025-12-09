# Seedream 4.5 Deployment Documentation

## Deployment Solution für Online-Verfügbarkeit

### Problem
- Seedream funktionierte lokal perfekt, aber nicht online
- CORS-Fehler beim Zugriff auf localhost:3002 von Vercel-App
- API Key wurde im Frontend exponiert (Sicherheitsproblem)

### Lösung: Dual-Environment Setup

#### 1. Vercel Serverless Function (Production)
**Datei:** `api/seedream-generate.js`
```javascript
const SEEDREAM_API_KEY = process.env.SEEDREAM_API_KEY
const SEEDREAM_API_BASE_URL = 'https://ark.ap-southeast.bytepluses.com/api/v3'

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const response = await fetch(`${SEEDREAM_API_BASE_URL}/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SEEDREAM_API_KEY}`
      },
      body: JSON.stringify(req.body)
    })
    
    const data = await response.json()
    if (!response.ok) return res.status(response.status).json(data)
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: error.message, details: 'Serverless function error' })
  }
}
```

#### 2. Environment Detection (Frontend)
**Datei:** `src/services/seedreamService.js`
```javascript
// Environment-specific endpoint detection
const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
const API_ENDPOINT = isProduction
  ? '/api/seedream-generate'      // Production: Vercel serverless function
  : 'http://localhost:3002/seedream/generate'  // Local: Express proxy server

console.log(`🌍 Environment: ${isProduction ? 'Production' : 'Development'}`)
console.log(`📡 API Endpoint: ${API_ENDPOINT}`)

const response = await fetch(API_ENDPOINT, { ... })
```

#### 3. Environment Variables Setup
**Lokal (.env.local):**
```bash
# Frontend (VITE prefix für Browser-Zugriff)
VITE_SEEDREAM_API_KEY=9c22ab19-a45a-4930-9e2a-18bd72910bff

# Backend (für API Routes, ohne VITE prefix)
SEEDREAM_API_KEY=9c22ab19-a45a-4930-9e2a-18bd72910bff
```

**Vercel Dashboard:**
- Variable: `SEEDREAM_API_KEY`
- Wert: `9c22ab19-a45a-4930-9e2a-18bd72910bff`

#### 4. URLs und Links
- **Lokaler Proxy:** http://localhost:3002/seedream/generate
- **Production API:** https://nano-banana-friends.vercel.app/api/seedream-generate
- **ComfyUI (aktualisiert):** https://comfyui-web-interface-rouge.vercel.app/
- **Seedream API Basis:** https://ark.ap-southeast.bytepluses.com/api/v3

### Deployment Schritte
1. ✅ Vercel serverless function erstellt: `api/seedream-generate.js`
2. ✅ Environment detection implementiert in `seedreamService.js`
3. ✅ Environment variables konfiguriert (lokal und Vercel)
4. ✅ ComfyUI Link aktualisiert auf neue Vercel URL
5. ✅ Code committed und zu GitHub gepusht
6. ✅ Vercel Auto-Deploy getriggert
7. ✅ Environment Variable `SEEDREAM_API_KEY` in Vercel gesetzt

### Sicherheitsverbesserungen
- ✅ API Key nicht mehr im Frontend exponiert
- ✅ Serverless function handhabt API calls sicher
- ✅ CORS richtig konfiguriert für Cross-Origin Requests

---

## Original API Dokumentation

POST https://ark.ap-southeast.bytepluses.com/api/v3/images/generations Try
This document describes the input and output parameters for the image generation API.
Warning
The Seedream 4.5 model will be available for preview from December 3 to 9, 2025. During the preview period, each account will have an IPM limit of 50. Starting December 10, the IPM will be restored to 500.
Image generation capabilities by model
seedream-4.5new、seedream-4.0
Generate multiple image in sequence - i.e., a batch of related images generated based on your input; set sequential_image_generation to auto
Generate a batch of related images based on your input of multiple reference images (2-14) + text prompt (the total number of input and output images ≤ 15).
Generate a batch of related images (up to 14) from a single reference image + text prompt.
Generate a batch of related images (up to 15) from text prompt.
Generate a single image (set sequential_image_generation to disabled).
Generate a single image from multiple reference images (2-14) + text prompt.
Generate a single image from a single reference image + text prompt.
Generate a single image from text prompt.
seedream-3.0-t2i
Generate a single image from a text prompt.
seededit-3.0-i2i
Generate a single image from a single reference image+text prompt.

Quick start
Authentication
This API only supports API Key authentication. Obtain a long-term API Key on the  API Key management page.

Experience Center 
Model List 
Model Billing 
API Key

API Call Guide 
API Reference 
FAQs 
Model Activation

Request parameters
Request body

model string required
The model ID used for image generation: Model ID or inference endpoint (Endpoint ID).

prompt string required
The text prompt used for image generation. (Prompt guide: Seedream 4.0-4.5, Seedream 3.0)
We recommend keeping the prompt under 600 English words. Excessively long prompts may scatter information, causing the model to overlook details and focus only on major elements, which can result in missing details in the generated image.

image string/array 
Seededit-3.0-t2i does not support this parameter.
Provide the image to edit as a Base64 string or an accessible URL. Seedream-4.5 and seedream-4.0 support inputting a single image or multiple images (see the multi-image blending example), while seededit-3.0-i2i only supports single-image input.
Image URL: Ensure that the image URL is accessible.
Base64 encoding: The format must be data:image/<image format>;base64,<Base64 encoding>. Note that <image format> must be in lowercase, e.g., data:image/png;base64,<base64_image>.
Description
Input Images must meet the following requirements:
Image format: JPEG, PNG (The seedream-4.5 and seedream-4.0 model also support WEBP、BMP、TIFF and GIF formatsnew)
Aspect ratio (width/height): 
Between [1/16, 16] (for seedream-4.5 and seedream-4.0)
Between [1/3, 3] (for seededit-3.0-i2i and seededit-3.0-t2i)
Width and height (px): > 14
Size: Up to 10 MB
Total pixels: No more than 6000×6000
Seedream-4.5 and seedream-4.0 support uploading a maximum of 14 reference images.

size String  

seedream-4.5
seedream-4.0
seedream-3.0-t2i
seededit-3.0-i2i
Specify the output image dimensions. Two methods are available, but they cannot be used at the same time.
Method 1 | Specify the resolution of the generated image, and describe its aspect ratio, shape, or purpose in the prompt using natural language. You let the model determine the width and height.
Optional values: 1K, 2K, 4K
Method 2 | Specify the width and height of the generated image in pixels:
Default value: 2048x2048
Total pixels range: [1280x720=921,600, 4096x4096=16,777,216] 
Aspect ratio range: [1/16, 16]
Description
When using Method 2, both the total pixel range and the aspect ratio range must be satisfied simultaneously. The total pixel limit applies to the product of the image’s width and height, rather than to either dimension individually.
Valid example: 1600x600
Total pixel count: 1600x600 = 960,000, which is within the acceptable range of [921,600, 16,777,216]. Aspect ratio: 1600/600 = 8/3, which is within the acceptable range of [1/16, 16].
Invalid example: 800x800
Total pixel count: 800x800 = 640,000, which does not meet the minimum requirement of 921,600. Aspect ratio: 800/800 = 1, which meets the range of [1/16, 16]. But it's invalid as it only meets one of the two requirements.
Recommended width and height:
Aspect ratio
Width and Height Pixel Values
1:1
2048x2048
4:3
2304x1728
3:4
1728x2304
16:9
2560x1440
9:16
1440x2560
3:2
2496x1664
2:3
1664x2496
21:9
3024x1296

Set the width and height of the generated image in pixels.
Default value: 1024x1024
The value range of total pixels:  [512x512, 2048x2048]
Recommended width and height:
Aspect ratio
Width and height in pixels Value
1:1
1024x1024
4:3
1152x864
3:4
864x1152
16:9
1280x720
9:16
720x1280
3:2
1248x832
2:3
832x1248
21:9
1512x648

Specify the width and height of the generated image in pixels. Only support adaptive for now.
adaptive: Compare your input image's dimensions with those in the table below and select the closest match for the output image. Specifically, the system selects the first available aspect ratio with the smallest difference from that of the original image.
Preset width and height in pixels
Width/Height
Width
High
0.33
512
1536
0.35
544
1536
0.38
576
1536
0.4
608
1536
0.42
640
1536
0.47
640
1376
0.51
672
1312
0.55
704
1280
0.56
736
1312
0.6
768
1280
0.63
768
1216
0.66
800
1216
0.67
832
1248
0.7
832
1184
0.72
832
1152
0.75
864
1152
0.78
896
1152
0.82
896
1088
0.85
928
1088
0.88
960
1088
0.91
992
1088
0.94
1024
1088
0.97
1024
1056
1
1024
1024
1.06
1056
992
1.1
1088
992
1.17
1120
960
1.24
1152
928
1.29
1152
896
1.33
1152
864
1.42
1184
832
1.46
1216
832
1.5
1248
832
1.56
1248
800
1.62
1248
768
1.67
1280
768
1.74
1280
736
1.82
1280
704
1.78
1312
736
1.86
1312
704
1.95
1312
672
2
1344
672
2.05
1376
672
2.1
1408
672
2.2
1408
640
2.25
1440
640
2.3
1472
640
2.35
1504
640
2.4
1536
640
2.53
1536
608
2.67
1536
576
2.82
1536
544
3
1536
512

Specify the output image dimensions. Two methods are available, but they cannot be used at the same time.
Method 1 | Specify the resolution of the generated image, and describe its aspect ratio, shape, or purpose in the prompt using natural language. You let the model determine the width and height.
Optional values: 2K, 4K
Method 2 | Specify the width and height of the generated image in pixels:
Default value: 2048x2048
Total pixels range: [2560x1440=3,686,400, 4096x4096=16,777,216] 
Aspect ratio range: [1/16, 16]
Description
When using Method 2, both the total pixel range and the aspect ratio range must be satisfied simultaneously. The total pixel limit applies to the product of the image’s width and height, rather than to either dimension individually.
Valid example: 3750x1250
Total pixel count: 3750x1250=4,687,500, which is within the acceptable range of [3,686,400, 16,777,216]. Aspect ratio: 3750/1250=3, which is within the acceptable range of [1/16, 16].
Invalid example: 1500x1500
Total pixel count: 1500x1500 = 2,250,000, which does not meet the minimum requirement of 3,686,400. Aspect ratio: 1500/1500 = 1, which meets the range of [1/16, 16]. But it's invalid as it only meets one of the two requirements.
Recommended width and height:

Aspect ratio

Width and Height Pixel Values

1:1

2048x2048

4:3

2304x1728

3:4

1728x2304

16:9

2560x1440

9:16

1440x2560

3:2

2496x1664

2:3

1664x2496

21:9

3024x1296

seed integer Default: -1
Only seedream-3.0-t2i and seededit-3.0-i2i support this parameter.
A random seed that controls the randomness of the generated content. The value range is [-1, 2147483647].
Warning
For the same request, the model will produce different results when using different seed values. For example, leaving the seed unspecified, setting it to -1 (meaning use a random number), or manually changing the seed will all lead to different outputs.
When the same seed is used for the same request, the model will generate similar results, but exact duplication is not guaranteed.

sequential_image_generation string  Default: disabled
This parameter is only supported on seedream-4.5 and seedream-4.0 | See batch image output for an example.
Whether to disable the batch generation feature.
Description
Batch image generation: a batch of thematically related images generated based on your input content.
Valid values:
auto: The model automatically determines whether to return multiple images and the number of returned images based on the user's prompt.
disabled: Only one image is generated.

sequential_image_generation_options object 
Only seedream-4.5 and seedream-4.0 support this parameter.
Configuration for the batch image generation feature; Only effective when sequential_image_generation is set to auto.
Attributes

sequential_image_generation_options.max_images integer Default: 15
Specifies the maximum number of images to generate in this request.
Value range: [1, 15]
Description
The actual number of generated images is determined jointly by max_images and the number of input reference images. Number of input reference images + Number of generated images ≤ 15.

stream  boolean Default: false
Only seedream-4.5 and seedream-4.0 support this parameter | See Streaming Output for an example.
Whether to enable streaming output mode.
false: All output images are returned at once.
true: Each output image is returned immediately after generated. Applicable for both single and batch image generation.

guidance_scale float
Default value for seedream-3.0-t2i: 2.5
Default value for seededit-3.0-i2i: 5.5
Seedream-4.5 and seedream-4.0 are not supported.
This parameter controls how closely the generated image follows the prompt, affecting the model’s degree of creative freedom. A higher value reduces freedom and increases adherence to the prompt.
Valid values: [1, 10] 

response_format string Default: url
Specifies how the generated images are returned.
The generated image is in JPEG and can be returned in the following two ways:
url: Returns a download link for the image. The link is valid for 24 hours after the image is generated.
b64_json: Returns the image data in JSON as a Base64-encoded string.

watermark  boolean Default: true
Adds a watermark to the generated image.
false: No watermark.
true: Adds a "AI generated" watermark on the bottom-right corner of the image.

optimize_prompt_optionsnew object 
Only seedream-4.5 (only supports standard mode) and seedream-4.0 support this parameter.
Configuration for prompt optimization feature.
optimize_prompt_options.mode string Default: standard
Set the mode for the prompt optimization feature. 
standard：Higher quality, longer generation time.
fast：Faster but at a more average quality.

Response parameters
Streaming response parameters
See Streaming Response.

Non-streaming response parameters

model String
The model ID used for image generation (model name-version).

created integer
The Unix timestamp in seconds of the creation time of the request.

data array
Information of the output images.
Description
When generating a batch of images with the seedream-4.5 and seedream-4.0 model, if an image fails to generate：
If the failure is due to the rejection by content filter: The next generation task will still be requested, other image generation tasks in the same request will not be affected.
If the failure is due to an internal service error (500): The next picture generation task will not be requested.
Possible type
Image information object
Successfully generated information.
Attributes
data.url string
The URL of the image, returned when response_format is specified as url. This link will expire within 24 hours of generation. Be sure to save the image before expiration.

data.b64_json string
The Base64 information of the image; returned when response_format is specified as b64_json.

data.size string
Only seedream-4.5 and seedream-4.0 support this parameter.
The width and height of the image in pixels, in the format <width>x<height>, such as 2048×2048.

Error message object
Error message for a failed image generation.
Attributes
data.error Object
Error message structure.
Attributes

data.error.code
The error code for a failed image generation. See Error Codes.

data.error.message
Error message for a failed image generation.

usage Object
Usage information for the current request.
Attributes

usage.generated_images integer
The number of images successfully generated by the model, excluding failed generations.
Note: Billing is based on the number of successfully generated images.

usage.output_tokens integer
The number of tokens consumed for the images generated by the model.
The calculation logic is to calculate sum(image width*image height)/256 and then round the result to an integer.

usage.total_tokens integer
The total number of tokens consumed by this request.
This value is the same as output_tokens as input tokens are currently not calculated.

error  object
The error message for this request, if any.
Attributes

error.code String 
See Error Codes.

error.message String
Error message

