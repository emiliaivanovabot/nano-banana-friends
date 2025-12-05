# WAN 2.5 — Advanced Image-to-Video Generation on Runpod

Transform static images into dynamic videos with WAN 2.5 on Runpod. This powerful video generation model creates engaging animations with realistic motion, lip-sync capabilities, and text-guided transformations, perfect for creating dynamic content from static visuals.

## Overview

WAN 2.5 is an advanced image-to-video generation model that excels at animating static images with text-guided motion. It can generate realistic videos with lip-sync, facial expressions, and natural movement patterns, making it ideal for creating dynamic content, marketing materials, and engaging visual storytelling from static images.

## Key Capabilities

- **Image-to-Video Animation**: Transform static images into dynamic videos
- **Text-Guided Motion**: Use detailed prompts to control animation style and movement
- **Lip-Sync Generation**: Create realistic mouth movements and facial expressions
- **Customizable Duration**: Generate videos from 1-10 seconds in length
- **Multiple Resolutions**: Support for various video dimensions (1280×720, 1024×1024, etc.)
- **Safety Controls**: Built-in content safety checking and filtering
- **Prompt Expansion**: Optional automatic prompt enhancement for better results
- **Reproducible Results**: Seed-based generation for consistent outputs

## Getting Started

1. Create an API key for your Runpod account.
2. In the section labeled Input above, configure your prompt and image URL.
3. Click API Playground to generate an endpoint request for your desired language (make sure /run is selected).
4. Run the endpoint request on your local machine (or integrate it into your application), replacing the placeholder YOUR_API_KEY with your actual API key.
5. Poll the /status endpoint to check the status of your request. When the status is COMPLETED, a URL to the generated video will be available in the output field.

For more details on how to use the /run and /status operations, see the Runpod documentation.

## Technical Specifications

### Model
- WAN 2.5 for advanced image-to-video generation
- High-quality video output with realistic motion
- Support for various video resolutions and durations

### Input Parameters

- **prompt** (required): Detailed text description of the desired video animation
- **image** (required): URL of the source image to animate
- **negative_prompt** (optional): Elements to exclude from the video (default: "")
- **size** (optional): Video dimensions in format "width*height" (default: "1280*720")
- **duration** (optional): Video duration in seconds (default: 5)
- **seed** (optional): Random seed for reproducible results (default: -1 for random)
- **enable_prompt_expansion** (optional): Auto-enhance prompts (default: false)
- **enable_safety_checker** (optional): Enable content safety checking (default: true)

### Outputs

- **video_url**: URL to the generated video file
- **cost**: Processing cost information

### Supported Resolutions

- 854×480 (SD)
- 1280×720 (HD) 
- 1920×1080 (Full HD)

### Audio Support

- **Audio Upload**: Upload MP3, WAV, M4A files for lip-sync and sound
- **File formats**: mpeg, mp3, wav, m4a up to 16MB
- **Lip-sync**: Automatic lip synchronization with uploaded audio

### Duration Limits

- **Minimum**: 1 second
- **Maximum**: 10 seconds
- **Default**: 5 seconds

## Example Usage

### Basic Video Generation

```json
{
  "prompt": "A person smiling and waving their hand",
  "image": "https://example.com/portrait.jpg",
  "size": "1280*720",
  "duration": 3
}
```

### Lip-Sync Animation

```json
{
  "prompt": "A stand-up comedian delivering a dad joke with animated gestures and lip-sync",
  "image": "https://example.com/comedian.jpg",
  "negative_prompt": "blurry, low quality",
  "size": "1280*720",
  "duration": 5,
  "enable_prompt_expansion": true
}
```

### High-Resolution Video

```json
{
  "prompt": "Gentle wind blowing through hair with natural movement",
  "image": "https://example.com/model.jpg",
  "size": "1920*1080",
  "duration": 7,
  "seed": 42,
  "enable_safety_checker": true
}
```

### Marketing Content

```json
{
  "prompt": "Product rotating slowly with elegant lighting effects",
  "image": "https://example.com/product.jpg",
  "negative_prompt": "distorted, artifacts",
  "size": "1024*1024",
  "duration": 4,
  "enable_prompt_expansion": false
}
```

## Best Practices

- **Image Quality**: Use high-resolution, clear images for best animation results
- **Prompt Detail**: Provide specific, detailed descriptions of desired motion and expressions
- **Negative Prompts**: Use negative prompts to exclude unwanted elements (blurry, distorted, artifacts)
- **Duration Planning**: Choose appropriate duration based on content complexity
- **Seed Usage**: Use consistent seeds for reproducible results across multiple generations
- **Safety Settings**: Keep safety checker enabled for appropriate content filtering
- **Resolution Selection**: Match resolution to your intended use case (social media, web, etc.)

## Use Cases

- **Marketing Videos**: Create dynamic product showcases from static images
- **Social Media Content**: Generate engaging animated posts for platforms
- **Educational Content**: Animate diagrams and illustrations for better engagement
- **Entertainment**: Create character animations and storytelling videos
- **E-commerce**: Animate product photos for enhanced shopping experiences
- **Presentations**: Add dynamic elements to static presentation materials
- **Content Creation**: Transform portraits into talking head videos

## API Integration

The endpoint follows Runpod's standard serverless API pattern:

1. **Submit Job**: POST to /run with your input parameters
2. **Check Status**: GET from /status/{job_id} to monitor progress
3. **Retrieve Result**: Download the final video from the returned URL

### API Example

```bash
curl -X POST https://api.runpod.ai/v2/wan-2-5/run \
    -H 'Content-Type: application/json' \
    -H 'Authorization: Bearer YOUR_API_KEY' \
    -d '{"input":{"prompt":"A stand-up comedian in his 30s stands on stage under warm spotlight lighting, holding a microphone with a playful grin. The comedy club audience is visible in the dim background, some people laughing and clapping. He leans slightly forward as he delivers a dad joke about skeletons not having the guts to fight each other. His lip movements match the words, and he uses animated gestures to sell the punchline. After the punchline, the audience bursts into big laughter and applause, like a sitcom laugh track moment.","image":"https://image.runpod.ai/assets/alibaba/comedian.jpg","negative_prompt":"","size":"1280*720","duration":5,"seed":-1,"enable_prompt_expansion":false,"enable_safety_checker":true}}'
```

Start creating dynamic videos with WAN 2.5 on Runpod.