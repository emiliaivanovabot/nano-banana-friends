# INSTAGRAM REEL GENERATOR - KIE.AI INTEGRATION

## 📱 TOOL OVERVIEW

## 🏗️ TECHNISCHE ARCHITEKTUR

### File Structure
```
/src/tools/kie-ai/
├── instagram-reel-v01/
│   ├── pages/
│   │   └── InstagramReelPage.jsx           # Main interface
│   ├── components/
│   │   ├── ImageUploadSection.jsx          # 3-Image upload component
│   │   ├── CharacterBriefSection.jsx       # Editable character settings
│   │   ├── PromptEditorSection.jsx         # System prompt editor
│   │   ├── CreativeDirectionSection.jsx    # User instructions
│   │   ├── GenerationSettingsSection.jsx   # Count & aspect ratio
│   │   ├── PostPreviewCard.jsx            # Individual post preview
│   │   └── PostGallery.jsx                # Generated posts gallery
│   ├── services/
│   │   ├── kieAiService.js                # KIE.AI API integration
│   │   ├── openaiService.js               # ChatGPT integration
│   │   └── instagramWorkflow.js           # Main workflow orchestrator
│   └── utils/
│       ├── promptTemplates.js             # Editable prompt templates
│       └── characterProfiles.js           # Character configurations
```

  <<<<< dokumentation veo 3.1 fast und quality >>>>>
  # Generate Veo 3.1 AI Video(Fast&Quality)

> Create a new video generation task using the Veo3.1 AI model.

## OpenAPI

````yaml veo3-api/veo3-api.json post /api/v1/veo/generate
openapi: 3.0.0
info:
  title: Veo3.1 API
  description: kie.ai Veo3.1 API Documentation - Text-to-Video and Image-to-Video API
  version: 1.0.0
  contact:
    name: Technical Support
    email: support@kie.ai
servers:
  - url: https://api.kie.ai
    description: API Server
security:
  - BearerAuth: []
paths:
  /api/v1/veo/generate:
    post:
      summary: Generate Veo3.1 Video
      description: Create a new video generation task using the Veo3.1 AI model.
      operationId: generate-veo3-1-video
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                prompt:
                  type: string
                  description: >-
                    Text prompt describing the desired video content. Required
                    for all generation modes.


                    - Should be detailed and specific in describing video
                    content

                    - Can include actions, scenes, style and other information

                    - For image-to-video, describe how you want the image to
                    come alive
                  example: A dog playing in a park
                imageUrls:
                  type: array
                  items:
                    type: string
                  description: >-
                    Image URL list (used in image-to-video mode). Supports 1 or
                    2 images:


                    - **1 image**: The generated video will unfold around this
                    image, with the image content presented dynamically

                    - **2 images**: The first image serves as the video's first
                    frame, and the second image serves as the video's last
                    frame, with the video transitioning between them

                    - Must be valid image URLs

                    - Images must be accessible to the API server.
                  example:
                    - http://example.com/image1.jpg
                    - http://example.com/image2.jpg
                model:
                  type: string
                  description: >-
                    Select the model type to use.


                    - veo3: Veo 3.1 Quality, supports both text-to-video and
                    image-to-video generation

                    - veo3_fast: Veo3.1 Fast generation model, supports both
                    text-to-video and image-to-video generation
                  enum:
                    - veo3
                    - veo3_fast
                  default: veo3_fast
                  example: veo3_fast
                generationType:
                  type: string
                  description: >-
                    Video generation mode (optional). Specifies different video
                    generation approaches:


                    - **TEXT_2_VIDEO**: Text-to-video - Generate videos using
                    only text prompts

                    - **FIRST_AND_LAST_FRAMES_2_VIDEO**: First and last frames
                    to video - Flexible image-to-video generation mode
                      - 1 image: Generate video based on the provided image
                      - 2 images: First image as first frame, second image as last frame, generating transition video
                    - **REFERENCE_2_VIDEO**: Reference-to-video - Generate
                    videos based on reference images, requires 1-3 images in
                    imageUrls (minimum 1, maximum 3)


                    **Important Notes**:

                    - REFERENCE_2_VIDEO mode currently only supports veo3_fast
                    model and 16:9 aspect ratio

                    - If not specified, the system will automatically determine
                    the generation mode based on whether imageUrls are provided
                  enum:
                    - TEXT_2_VIDEO
                    - FIRST_AND_LAST_FRAMES_2_VIDEO
                    - REFERENCE_2_VIDEO
                  example: TEXT_2_VIDEO
                aspectRatio:
                  type: string
                  description: >-
                    Video aspect ratio. Specifies the dimension ratio of the
                    generated video. Available options:


                    - 16:9: Landscape video format, supports 1080P HD video
                    generation (**Only 16:9 aspect ratio supports 1080P**)

                    - 9:16: Portrait video format, suitable for mobile short
                    videos

                    - Auto: In auto mode, the video will be automatically
                    center-cropped based on whether your uploaded image is
                    closer to 16:9 or 9:16.


                    Default value is 16:9.
                  enum:
                    - '16:9'
                    - '9:16'
                    - Auto
                  default: '16:9'
                  example: '16:9'
                seeds:
                  type: integer
                  description: >-
                    (Optional) Random seed parameter to control the randomness
                    of the generated content. Value range: 10000-99999. The same
                    seed will generate similar video content, different seeds
                    will generate different content. If not provided, the system
                    will assign one automatically.
                  minimum: 10000
                  maximum: 99999
                  example: 12345
                callBackUrl:
                  type: string
                  description: >-
                    Completion callback URL for receiving video generation
                    status updates.


                    - Optional but recommended for production use

                    - System will POST task completion status to this URL when
                    the video generation is completed

                    - Callback will include task results, video URLs, and status
                    information

                    - Your callback endpoint should accept POST requests with
                    JSON payload

                    - For detailed callback format and implementation guide, see
                    [Callback
                    Documentation](https://docs.kie.ai/veo3-api/generate-veo-3-video-callbacks)

                    - Alternatively, use the Get Video Details endpoint to poll
                    task status
                  example: http://your-callback-url.com/complete
                enableFallback:
                  type: boolean
                  description: >-
                    Deprecated Enable fallback functionality. When set to true,
                    if the official Veo3.1 video generation service is
                    unavailable or encounters exceptions, the system will
                    automatically switch to a backup model for video generation
                    to ensure task continuity and reliability. Default value is
                    false.


                    - When fallback is enabled, backup model will be used for
                    the following errors:
                      - public error minor upload
                      - Your prompt was flagged by Website as violating content policies
                      - public error prominent people upload
                    - Fallback mode requires 16:9 aspect ratio and uses 1080p
                    resolution by default

                    - **Note**: Videos generated through fallback mode cannot be
                    accessed via the Get 1080P Video endpoint

                    - **Credit Consumption**: Successful fallback has different
                    credit consumption, please see https://kie.ai/billing for
                    billing details


                    **Note: This parameter is deprecated. Please remove this
                    parameter from your requests. The system has automatically
                    optimized the content review mechanism without requiring
                    manual fallback configuration.**
                  default: false
                  example: false
                  deprecated: true
                enableTranslation:
                  type: boolean
                  description: >-
                    Enable prompt translation to English. When set to true, the
                    system will automatically translate prompts to English
                    before video generation for better generation results.
                    Default value is true.


                    - true: Enable translation, prompts will be automatically
                    translated to English

                    - false: Disable translation, use original prompts directly
                    for generation
                  default: true
                  example: true
                watermark:
                  type: string
                  description: >-
                    Watermark text.


                    - Optional parameter

                    - If provided, a watermark will be added to the generated
                    video
                  example: MyBrand
              required:
                - prompt
              example:
                prompt: A dog playing in a park
                imageUrls:
                  - http://example.com/image1.jpg
                  - http://example.com/image2.jpg
                model: veo3_fast
                watermark: MyBrand
                callBackUrl: http://your-callback-url.com/complete
                aspectRatio: '16:9'
                seeds: 12345
                enableFallback: false
                enableTranslation: true
                generationType: REFERENCE_2_VIDEO
      responses:
        '200':
          description: Request successful
          content:
            application/json:
              schema:
                type: object
                properties:
                  code:
                    type: integer
                    enum:
                      - 200
                      - 400
                      - 401
                      - 402
                      - 404
                      - 422
                      - 429
                      - 455
                      - 500
                      - 501
                      - 505
                    description: >-
                      Response status code


                      - **200**: Success - Request has been processed
                      successfully

                      - **400**: 1080P is processing. It should be ready in 1-2
                      minutes. Please check back shortly.

                      - **401**: Unauthorized - Authentication credentials are
                      missing or invalid

                      - **402**: Insufficient Credits - Account does not have
                      enough credits to perform the operation

                      - **404**: Not Found - The requested resource or endpoint
                      does not exist

                      - **422**: Validation Error - Request parameters failed
                      validation. When fallback is not enabled and generation
                      fails, error message format: Your request was rejected by
                      Flow(original error message). You may consider using our
                      other fallback channels, which are likely to succeed.
                      Please refer to the documentation.

                      - **429**: Rate Limited - Request limit has been exceeded
                      for this resource

                      - **455**: Service Unavailable - System is currently
                      undergoing maintenance

                      - **500**: Server Error - An unexpected error occurred
                      while processing the request

                      - **501**: Generation Failed - Video generation task
                      failed

                      - **505**: Feature Disabled - The requested feature is
                      currently disabled
                  msg:
                    type: string
                    description: Error message when code != 200
                    example: success
                  data:
                    type: object
                    properties:
                      taskId:
                        type: string
                        description: >-
                          Task ID, can be used with Get Video Details endpoint
                          to query task status
                        example: veo_task_abcdef123456
              example:
                code: 200
                msg: success
                data:
                  taskId: veo_task_abcdef123456
        '500':
          $ref: '#/components/responses/Error'
      callbacks:
        onVideoGenerated:
          '{$request.body#/callBackUrl}':
            post:
              summary: Video Generation Callback
              description: >-
                When the video generation task is completed, the system will
                send the result to your provided callback URL via POST request
              requestBody:
                required: true
                content:
                  application/json:
                    schema:
                      type: object
                      properties:
                        code:
                          type: integer
                          description: >-
                            Status code


                            - **200**: Success - Video generation task
                            successfully

                            - **400**: Your prompt was flagged by Website as
                            violating content policies.

                            Only English prompts are supported at this time.

                            Failed to fetch the image. Kindly verify any access
                            limits set by you or your service provider.

                            public error unsafe image upload.

                            - **422**: Fallback failed - When fallback is not
                            enabled and specific errors occur, returns error
                            message format: Your request was rejected by
                            Flow(original error message). You may consider using
                            our other fallback channels, which are likely to
                            succeed. Please refer to the documentation.

                            - **500**: Internal Error, Please try again later.

                            Internal Error - Timeout

                            - **501**: Failed - Video generation task failed
                          enum:
                            - 200
                            - 400
                            - 422
                            - 500
                            - 501
                        msg:
                          type: string
                          description: Status message
                          example: Veo3.1 video generated successfully.
                        data:
                          type: object
                          properties:
                            taskId:
                              type: string
                              description: Task ID
                              example: veo_task_abcdef123456
                            info:
                              type: object
                              properties:
                                resultUrls:
                                  type: string
                                  description: Generated video URLs
                                  example: '[http://example.com/video1.mp4]'
                                originUrls:
                                  type: string
                                  description: >-
                                    Original video URLs. Only has value when
                                    aspectRatio is not 16:9
                                  example: '[http://example.com/original_video1.mp4]'
                                resolution:
                                  type: string
                                  description: Video resolution information
                                  example: 1080p
                            fallbackFlag:
                              type: boolean
                              description: >-
                                Whether generated using fallback model. True
                                means backup model was used, false means primary
                                model was used
                              example: false
                              deprecated: true
              responses:
                '200':
                  description: Callback received successfully
components:
  responses:
    Error:
      description: Server Error
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: API Key
      description: >-
        All APIs require authentication via Bearer Token.


        Get API Key: 

        1. Visit [API Key Management Page](https://kie.ai/api-key) to get your
        API Key


        Usage:

        Add to request header:

        Authorization: Bearer YOUR_API_KEY

````

---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://docs.kie.ai/llms.txt


<<<<< nan0 banana edit doku >>>>>

# Google - Nano Banana Edit

> Image editing using Google's Nano Banana Edit model

## OpenAPI

````yaml market/google/nano-banana-edit.json post /api/v1/jobs/createTask
openapi: 3.0.0
info:
  title: Google API
  description: kie.ai Google API Documentation
  version: 1.0.0
  contact:
    name: Technical Support
    email: support@kie.ai
servers:
  - url: https://api.kie.ai
    description: API Server
security:
  - BearerAuth: []
paths:
  /api/v1/jobs/createTask:
    post:
      summary: Generate content using google/nano-banana-edit
      operationId: google-nano-banana-edit
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - model
              properties:
                model:
                  type: string
                  enum:
                    - google/nano-banana-edit
                  default: google/nano-banana-edit
                  description: |-
                    The model name to use for generation. Required field.

                    - Must be `google/nano-banana-edit` for this endpoint
                  example: google/nano-banana-edit
                callBackUrl:
                  type: string
                  format: uri
                  description: >-
                    The URL to receive generation task completion updates.
                    Optional but recommended for production use.


                    - System will POST task status and results to this URL when
                    generation completes

                    - Callback includes generated content URLs and task
                    information

                    - Your callback endpoint should accept POST requests with
                    JSON payload containing results

                    - Alternatively, use the Get Task Details endpoint to poll
                    task status
                  example: https://your-domain.com/api/callback
                input:
                  type: object
                  description: Input parameters for the generation task
                  properties:
                    prompt:
                      description: >-
                        The prompt for image editing (Max length: 5000
                        characters)
                      type: string
                      maxLength: 5000
                      example: >-
                        turn this photo into a character figure. Behind it,
                        place a box with the character’s image printed on it,
                        and a computer showing the Blender modeling process on
                        its screen. In front of the box, add a round plastic
                        base with the character figure standing on it. set the
                        scene indoors if possible
                    image_urls:
                      description: >-
                        List of URLs of input images for editing,up to 10
                        images. (File URL after upload, not file content;
                        Accepted types: image/jpeg, image/png, image/webp; Max
                        size: 10.0MB)
                      type: array
                      items:
                        type: string
                        format: uri
                      maxItems: 10
                      example:
                        - >-
                          https://file.aiquickdraw.com/custom-page/akr/section-images/1756223420389w8xa2jfe.png
                    output_format:
                      description: Output format for the images
                      type: string
                      enum:
                        - png
                        - jpeg
                      default: png
                      example: png
                    image_size:
                      description: Radio description
                      type: string
                      enum:
                        - '1:1'
                        - '9:16'
                        - '16:9'
                        - '3:4'
                        - '4:3'
                        - '3:2'
                        - '2:3'
                        - '5:4'
                        - '4:5'
                        - '21:9'
                        - auto
                      default: '1:1'
                      example: '1:1'
                  required:
                    - prompt
                    - image_urls
            example:
              model: google/nano-banana-edit
              callBackUrl: https://your-domain.com/api/callback
              input:
                prompt: >-
                  turn this photo into a character figure. Behind it, place a
                  box with the character’s image printed on it, and a computer
                  showing the Blender modeling process on its screen. In front
                  of the box, add a round plastic base with the character figure
                  standing on it. set the scene indoors if possible
                image_urls:
                  - >-
                    https://file.aiquickdraw.com/custom-page/akr/section-images/1756223420389w8xa2jfe.png
                output_format: png
                image_size: '1:1'
      responses:
        '200':
          description: Request successful
          content:
            application/json:
              schema:
                allOf:
                  - $ref: '#/components/schemas/ApiResponse'
                  - type: object
                    properties:
                      data:
                        type: object
                        properties:
                          taskId:
                            type: string
                            description: >-
                              Task ID, can be used with Get Task Details
                              endpoint to query task status
                            example: task_google_1765178615729
              example:
                code: 200
                msg: success
                data:
                  taskId: task_google_1765178615729
        '500':
          $ref: '#/components/responses/Error'
components:
  schemas:
    ApiResponse:
      type: object
      properties:
        code:
          type: integer
          enum:
            - 200
            - 401
            - 402
            - 404
            - 422
            - 429
            - 455
            - 500
            - 501
            - 505
          description: >-
            Response status code


            - **200**: Success - Request has been processed successfully

            - **401**: Unauthorized - Authentication credentials are missing or
            invalid

            - **402**: Insufficient Credits - Account does not have enough
            credits to perform the operation

            - **404**: Not Found - The requested resource or endpoint does not
            exist

            - **422**: Validation Error - The request parameters failed
            validation checks

            - **429**: Rate Limited - Request limit has been exceeded for this
            resource

            - **455**: Service Unavailable - System is currently undergoing
            maintenance

            - **500**: Server Error - An unexpected error occurred while
            processing the request

            - **501**: Generation Failed - Content generation task failed

            - **505**: Feature Disabled - The requested feature is currently
            disabled
        msg:
          type: string
          description: Response message, error description when failed
          example: success
  responses:
    Error:
      description: Server Error
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: API Key
      description: >-
        All APIs require authentication via Bearer Token.


        Get API Key:

        1. Visit [API Key Management Page](https://kie.ai/api-key) to get your
        API Key


        Usage:

        Add to request header:

        Authorization: Bearer YOUR_API_KEY


        Note:

        - Keep your API Key secure and do not share it with others

        - If you suspect your API Key has been compromised, reset it immediately
        in the management page

````

---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://docs.kie.ai/llms.txt