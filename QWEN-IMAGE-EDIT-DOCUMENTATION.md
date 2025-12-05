# Qwen Image Edit - RunPod Integration Documentation

## Overview

Edit images with text instructions using Qwen-Image-Edit on Runpod. Built on the Qwen-Image family, Qwen-Image-Edit extends its native text rendering strengths (EN & ZH) to editing tasks—making it particularly good at precise text edits, typography adjustments, object/style changes, and layout-preserving transformations.

## Description

Qwen-Image-Edit is an image editing model that accepts an input image + prompt and outputs a modified image while preserving structure and identity. It's designed to keep typography legible and on-model, enabling changes like swapping copy on signage, recoloring garments with printed text, or refining poster layouts—without introducing the typical "AI text" artifacts. On Runpod, you get a simple /runsync API with predictable latency and easy integration.

## Key Features

### ✨ What Makes It Special
- **Text-Accurate Editing** — Clean, readable English & Chinese text edits in-frame (signage, labels, packaging, posters)
- **Structure-Preserving Changes** — Maintains subject identity, pose, and composition while applying the requested edits
- **Style & Object Control** — Change colors, add/remove small objects, adjust lighting or background styling
- **Production-Friendly** — Deterministic controls (seed), safety checks, and standard formats (png, jpg, webp)

### 🎯 Popular Use Cases
- **Brand & Marketing**: Update poster copy, swap product taglines, refresh seasonal colorways
- **E-commerce**: Recolor apparel/props; adjust labels or packaging text
- **Editorial & UI**: Tweak captions, replace billboard/sign text, revise app mockup screenshots
- **Creative Direction**: Style remixes and lighting changes while keeping layout intact

## Technical Specifications

### 📥 Input Parameters (RunPod endpoint)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `image` | string | ✅ | URL to the image to edit |
| `prompt` | string | ✅ | Edit instruction (concise, explicit) |
| `negative_prompt` | string | ❌ | Content to avoid |
| `seed` | number | ❌ | Reproducibility (-1 = random) |
| `output_format` | string | ❌ | "png" \| "jpg" \| "webp" |
| `size` | string | ❌ | "W*H" (e.g., "1024*1024") if you need to override resolution |
| `enable_safety_checker` | boolean | ❌ | Default: true |

### 📤 Output Response

| Field | Type | Description |
|-------|------|-------------|
| `image_url` | string | Direct link to the edited image |
| `width` | number | Image width (metadata) |
| `height` | number | Image height (metadata) |
| `seed` | number | Used seed value |
| `generation_time` | number | Processing time in seconds |

## API Interface (TypeScript)

### Request Parameters
```typescript
interface QwenImageEditParams {
  image: string;                 // required (URL to source image)
  prompt: string;                // required (edit instruction)
  negative_prompt?: string;
  seed?: number;                 // -1 = random
  output_format?: "png" | "jpg" | "webp";
  size?: string;                 // "W*H" (optional override)
  enable_safety_checker?: boolean;
}
```

### Response Format
```typescript
interface QwenImageEditResponse {
  id: string;
  status: "COMPLETED" | "FAILED";
  output?: {
    image_url?: string;
    width?: number;
    height?: number;
    seed?: number;
    generation_time?: number;
  };
  error?: string;
}
```

## 💰 Pricing

**$0.02 per megapixel** on RunPod

### Pricing Examples:
- **1024×1024** → $0.02
- **2048×2048** → $0.08

### Formula:
```
price = (width × height / 1,000,000) × $0.02
```

## 🔧 Getting Started

1. **Create an API key** for your RunPod account
2. Configure your **prompt and model parameters**
3. **Generate endpoint request** using API Playground (/run endpoint)
4. **Execute the request** with your actual API key
5. **Poll /status endpoint** to check completion status
6. **Retrieve the edited image** from the output field when status is COMPLETED

## 📋 Best Practices

### ✅ Effective Prompting
- **Be explicit** about what changes vs. what must remain the same
  - Example: "keep pose and background, change coat color to light grey"
- **Typography edits**: provide exact wording and placement
  - Example: "upper-right poster reads 'SPRING SALE' in bold condensed sans"

### 🎯 Workflow Optimization
- **Small steps > big leaps**: iterate with focused edits
- **Lock a seed** to reproduce a final look
- **Resolution strategy**: work at 1024×1024 for iteration; upscale only if needed

### 🛡️ Safety & Quality Assurance
- **Keep enable_safety_checker: true** for production use
- **Validate outputs** in your pipeline
- **Test edge cases** before deployment

## 🔗 RunPod Integration

### Base Endpoint
```
https://api.runpod.ai/v2/[ENDPOINT_ID]/run
```

### Status Check
```
https://api.runpod.ai/v2/[ENDPOINT_ID]/status/[JOB_ID]
```

### Required Headers
```
Authorization: Bearer [YOUR_RUNPOD_API_KEY]
Content-Type: application/json
```

## Example Use Cases

### 🏷️ Brand Marketing
```json
{
  "image": "https://example.com/poster.jpg",
  "prompt": "Change the main headline from 'Summer Sale' to 'Winter Sale' keeping the same font style and layout",
  "enable_safety_checker": true
}
```

### 👕 E-commerce
```json
{
  "image": "https://example.com/tshirt.jpg", 
  "prompt": "Change the t-shirt color from blue to red while keeping the logo and text clearly visible",
  "output_format": "png"
}
```

### 🎨 Creative Editing
```json
{
  "image": "https://example.com/scene.jpg",
  "prompt": "Add warm sunset lighting while keeping all objects and text in their current positions",
  "negative_prompt": "blurry text, distorted logos",
  "seed": 42
}
```

---

**Documentation Version**: 1.0  
**Last Updated**: December 2024  
**Model**: Qwen-Image-Edit via RunPod  
**Pricing**: $0.02/MP


Qwen Image Edit for RunPod Serverless
한국어 README 보기

This project is a template designed to easily deploy and use an image editing workflow (Qwen Image Edit via ComfyUI) in the RunPod Serverless environment.


The template performs prompt-guided image editing using ComfyUI workflows. It supports one or two input images and accepts inputs as path, URL, or Base64.

🎨 Engui Studio Integration
EnguiStudio

This Qwen Image Edit template is primarily designed for Engui Studio, a comprehensive AI model management platform. While it can be used via API, Engui Studio provides enhanced features and broader model support.

Engui Studio Benefits:

Expanded Model Support: Access to a wide variety of AI models beyond what's available through API
Enhanced User Interface: Intuitive workflow management and model selection
Advanced Features: Additional tools and capabilities for AI model deployment
Seamless Integration: Optimized for Engui Studio's ecosystem
Note: While this template works perfectly with API calls, Engui Studio users will have access to additional models and features that are planned for future releases.

✨ Key Features
Prompt-Guided Image Editing: Edit images based on a text prompt.
One or Two Input Images: Automatically selects single- or dual-image workflow.
Flexible Inputs: Provide images via file path, URL, or Base64 string.
Customizable Parameters: Control seed, width, height, and prompt.
ComfyUI Integration: Built on top of ComfyUI for flexible workflow management.
🚀 RunPod Serverless Template
This template includes all the necessary components to run Qwen Image Edit as a RunPod Serverless Worker.

Dockerfile: Configures the environment and installs all dependencies required for model execution.
handler.py: Implements the handler function that processes requests for RunPod Serverless.
entrypoint.sh: Performs initialization tasks when the worker starts.
qwen_image_edit_1.json / qwen_image_edit_2.json: ComfyUI workflows for single- or dual-image editing.
Input
The input object must contain the following fields. Image inputs support URL, file path, or Base64 encoded string.

Parameter	Type	Required	Default	Description
prompt	string	Yes	N/A	Text prompt that guides the edit.
image_path or image_url or image_base64	string	Yes	N/A	First image input (path/URL/Base64).
image_path_2 or image_url_2 or image_base64_2	string	No	N/A	Optional second image input (path/URL/Base64). Enables dual-image workflow.
seed	integer	Yes	N/A	Random seed for deterministic output.
width	integer	Yes	N/A	Output image width in pixels.
height	integer	Yes	N/A	Output image height in pixels.
Notes:

Guidance is not used by the current handler.
If any of the *_2 fields are provided, the dual-image workflow is selected automatically.
Request Example (single image via URL):

{
  "input": {
    "prompt": "add watercolor style, soft pastel tones",
    "image_url": "https://path/to/your/reference.jpg",
    "seed": 12345,
    "width": 768,
    "height": 1024
  }
}
Request Example (dual images, path + URL):

{
  "input": {
    "prompt": "blend subject A and subject B, cinematic lighting",
    "image_path": "/network_volume/img_a.jpg",
    "image_url_2": "https://path/to/img_b.jpg",
    "seed": 7777,
    "width": 1024,
    "height": 1024
  }
}
Request Example (single image via Base64):

{
  "input": {
    "prompt": "vintage look, grain, warm tones",
    "image_base64": "<BASE64_STRING>",
    "seed": 42,
    "width": 512,
    "height": 512
  }
}
Output
Success
If the job is successful, it returns a JSON object with the generated image Base64 encoded.

Parameter	Type	Description
image	string	Base64 encoded image file data.
Success Response Example:

{
  "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
}
Error
If the job fails, it returns a JSON object containing an error message.

Parameter	Type	Description
error	string	Description of the error that occurred.
Error Response Example:

{
  "error": "이미지를 찾을 수 없습니다."
}
🛠️ Usage and API Reference
Create a Serverless Endpoint on RunPod based on this repository.
Once the build is complete and the endpoint is active, submit jobs via HTTP POST requests according to the API Reference above.
📁 Using Network Volumes
Instead of directly transmitting Base64 encoded files, you can use RunPod's Network Volumes to handle large files. This is especially useful when dealing with large image files.

Create and Connect Network Volume: Create a Network Volume (e.g., S3-based volume) from the RunPod dashboard and connect it to your Serverless Endpoint settings.
Upload Files: Upload the image files you want to use to the created Network Volume.
Specify Paths: When making an API request, specify the file paths within the Network Volume for image_path or image_path_2. For example, if the volume is mounted at /my_volume and you use reference.jpg, the path would be "/my_volume/reference.jpg".
🔧 Workflow Configuration
This template includes the following workflow configurations:

qwen_image_edit_1.json: Single-image editing workflow
qwen_image_edit_2.json: Dual-image editing workflow
The workflows are based on ComfyUI and include necessary nodes for prompt-guided image editing and output processing.

🙏 Original Project
This project is based on the following repositories. All rights to the model and core logic belong to the original authors.

ComfyUI: https://github.com/comfyanonymous/ComfyUI
Qwen (project group): https://github.com/QwenLM/Qwen-Image