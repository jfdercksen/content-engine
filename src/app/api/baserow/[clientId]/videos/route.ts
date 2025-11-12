import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getClientConfigForAPI } from '@/lib/utils/getClientConfigForAPI'
import { VIDEOS_FIELD_MAPPINGS } from '@/lib/types/video'
import { getClientVideos, createVideo } from '@/lib/baserow/videosAPI'
import { BaserowAPI } from '@/lib/baserow/api'

// ==================== VALIDATION SCHEMA ====================

const videoCreationSchema = z.object({
  // Core Fields (Required)
  videoPrompt: z.string().min(10, 'Video prompt must be at least 10 characters'),
  videoType: z.enum([
    'Text-to-Video',
    'Image-to-Video',
    'Storyboard',
    'Multi-Scene Process',
    'UGC Ad',
    'Social Post Video'
  ]),
  model: z.enum([
    'Sora 2',
    'Veo 3.1',
    'Veo 3.1 Fast',
    'Kling Video',
    'NanoBanana + Veo 3.1',
    'fal.ai'
  ]),
  aspectRatio: z.enum([
    '9:16 (Vertical)',
    '16:9 (Landscape)',
    '1:1 (Square)',
    '4:5 (Portrait)'
  ]),
  duration: z.number().min(1).max(60),

  // Optional Configuration
  nFrames: z.number().optional(),
  removeWatermark: z.boolean().optional(),

  // Reference Media
  referenceImageUrl: z.string().url().optional().or(z.literal('')),
  referenceVideoUrl: z.string().url().optional().or(z.literal('')),

  // Product Info (UGC Ads)
  product: z.string().optional(),
  productPhotoUrl: z.string().url().optional().or(z.literal('')),
  icp: z.string().optional(),
  productFeatures: z.string().optional(),
  videoSetting: z.string().optional(),

  // Process Info (Multi-Scene)
  process: z.string().optional(),
  processId: z.string().optional(),

  // Platform
  platform: z.enum(['Facebook', 'Instagram', 'Twitter', 'LinkedIn', 'TikTok', 'YouTube']).optional(),

  // Audio
  useMusic: z.boolean().optional(),
  backgroundMusicPrompt: z.string().optional(),
  musicTrackId: z.string().optional(),
  useSoundFX: z.boolean().optional(),

  // Captions
  useCaptions: z.boolean().optional(),
  captionText: z.string().optional(),
  captionFontStyle: z.string().optional(),
  captionFontSize: z.string().optional(),
  captionPosition: z.enum(['Top', 'Center', 'Bottom']).optional(),

  // Relationships
  socialMediaContentId: z.string().optional(),
  contentIdeaId: z.string().optional()
})

// ==================== GET - LIST VIDEOS ====================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { clientId } = await params
    console.log(`📹 GET /api/baserow/${clientId}/videos - Fetching videos`)

    // Parse query parameters for filtering
    const { searchParams } = new URL(request.url)
    const filters: any = {}

    if (searchParams.get('videoStatus')) {
      filters.videoStatus = searchParams.get('videoStatus')
    }
    if (searchParams.get('videoType')) {
      filters.videoType = searchParams.get('videoType')
    }

    // Fetch videos from shared table (automatically filtered by clientId)
    const result = await getClientVideos(clientId, filters)

    console.log(`✅ Retrieved ${result.results?.length || 0} videos`)

    return NextResponse.json({
      success: true,
      videos: result.results || [],
      count: result.count || 0
    })

  } catch (error: any) {
    console.error('❌ Error fetching videos:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch videos'
      },
      { status: 500 }
    )
  }
}

// ==================== POST - CREATE VIDEO ====================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { clientId } = await params
    console.log(`📹 POST /api/baserow/${clientId}/videos - Creating video`)

    // Get client configuration (for webhook payload)
    const clientConfig = await getClientConfigForAPI(clientId)
    if (!clientConfig) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      )
    }

    // Check content type to determine how to parse
    const contentType = request.headers.get('content-type') || ''
    const isFormData = contentType.includes('multipart/form-data')

    let body: any
    let referenceImageFile: File | null = null
    let productPhotoFile: File | null = null

    if (isFormData) {
      // Parse FormData (for file uploads)
      console.log('📦 Parsing FormData (with files)')
      const formData = await request.formData()
      
      // Extract files
      referenceImageFile = formData.get('referenceImage') as File | null
      productPhotoFile = formData.get('productPhoto') as File | null
      
      // Parse JSON fields from FormData
      body = {}
      for (const [key, value] of formData.entries()) {
        if (key !== 'referenceImage' && key !== 'productPhoto') {
          // Try to parse as JSON if it looks like a number or boolean
          if (key === 'duration' || key === 'nFrames') {
            body[key] = Number(value)
          } else if (key === 'useCaptions' || key === 'useMusic' || key === 'useSoundFX' || key === 'removeWatermark') {
            body[key] = value === 'true'
          } else {
            body[key] = value
          }
        }
      }
      
      console.log('📁 Files received:', {
        hasReferenceImage: !!referenceImageFile,
        hasProductPhoto: !!productPhotoFile
      })
    } else {
      // Parse JSON
      console.log('📝 Parsing JSON')
      body = await request.json()
    }

    console.log('📝 Request data:', {
      videoType: body.videoType,
      model: body.model,
      promptLength: body.videoPrompt?.length,
      hasFiles: isFormData
    })

    // Validate with Zod
    const validationResult = videoCreationSchema.safeParse(body)
    if (!validationResult.success) {
      console.error('❌ Validation failed:', validationResult.error.errors)
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validationResult.error.errors
        },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Upload files to Baserow if present
    const baserowAPI = new BaserowAPI(clientConfig.baserow.token, clientConfig.baserow.databaseId)
    const fileReferences: any = {}

    if (referenceImageFile && referenceImageFile.size > 0) {
      console.log('📤 Uploading reference image to Baserow...')
      try {
        const uploadedFile = await baserowAPI.uploadFile(referenceImageFile)
        fileReferences.referenceImage = uploadedFile
        console.log('✅ Reference image uploaded')
      } catch (uploadError) {
        console.error('❌ Failed to upload reference image:', uploadError)
      }
    }

    if (productPhotoFile && productPhotoFile.size > 0) {
      console.log('📤 Uploading product photo to Baserow...')
      try {
        const uploadedFile = await baserowAPI.uploadFile(productPhotoFile)
        fileReferences.productPhoto = uploadedFile
        console.log('✅ Product photo uploaded')
      } catch (uploadError) {
        console.error('❌ Failed to upload product photo:', uploadError)
      }
    }

    // Prepare video data for Baserow
    const videoData: any = {
      videoPrompt: data.videoPrompt,
      videoType: data.videoType,
      videoStatus: 'Pending',
      model: data.model,
      clientId: clientId,
      aspectRatio: data.aspectRatio,
      duration: data.duration,
      createdAt: new Date().toISOString()
    }

    // Add optional fields
    if (data.nFrames) videoData.nFrames = data.nFrames
    if (data.removeWatermark !== undefined) videoData.removeWatermark = data.removeWatermark
    if (data.referenceImageUrl) videoData.referenceImageUrl = data.referenceImageUrl
    if (data.referenceVideoUrl) videoData.referenceVideoUrl = data.referenceVideoUrl
    if (data.product) videoData.product = data.product
    if (data.productPhotoUrl) videoData.productPhotoUrl = data.productPhotoUrl
    if (data.icp) videoData.icp = data.icp
    if (data.productFeatures) videoData.productFeatures = data.productFeatures
    if (data.videoSetting) videoData.videoSetting = data.videoSetting
    if (data.process) videoData.process = data.process
    if (data.platform) videoData.platform = data.platform
    if (data.useMusic !== undefined) videoData.useMusic = data.useMusic
    if (data.backgroundMusicPrompt) videoData.backgroundMusicPrompt = data.backgroundMusicPrompt
    if (data.useSoundFX !== undefined) videoData.useSoundFX = data.useSoundFX
    if (data.useCaptions !== undefined) videoData.useCaptions = data.useCaptions
    if (data.captionText) videoData.captionText = data.captionText
    if (data.captionFontStyle) videoData.captionFontStyle = data.captionFontStyle
    if (data.captionFontSize) videoData.captionFontSize = data.captionFontSize
    if (data.captionPosition) videoData.captionPosition = data.captionPosition

    // Add uploaded file references
    if (fileReferences.referenceImage) {
      videoData.referenceImage = [fileReferences.referenceImage]
      videoData.referenceImageUrl = fileReferences.referenceImage.url
    }
    if (fileReferences.productPhoto) {
      videoData.productPhoto = [fileReferences.productPhoto]
      videoData.productPhotoUrl = fileReferences.productPhoto.url
    }

    console.log('💾 Creating video record in shared Videos table...')
    const createdVideo = await createVideo(videoData)

    console.log('✅ Video record created with ID:', createdVideo.id)

    // Prepare webhook payload for n8n
    const webhookPayload = {
      event: 'video_generation',
      clientId: clientId,
      videoType: data.videoType,
      model: data.model,
      timestamp: new Date().toISOString(),

      client: {
        id: clientId,
        name: clientConfig.client.name,
        baserowToken: clientConfig.baserow.token,
        databaseId: clientConfig.baserow.databaseId
      },

      tables: {
        videos: {
          id: '3395',
          recordId: createdVideo.id.toString()
        }
      },

      fieldMappings: {
        videos: VIDEOS_FIELD_MAPPINGS
      },

      video: {
        prompt: data.videoPrompt,
        type: data.videoType,
        model: data.model,
        aspectRatio: data.aspectRatio,
        duration: data.duration,
        nFrames: data.nFrames,
        removeWatermark: data.removeWatermark,
        referenceImageUrl: data.referenceImageUrl || fileReferences.referenceImage?.url,
        referenceVideoUrl: data.referenceVideoUrl,
        product: data.product,
        productPhotoUrl: data.productPhotoUrl || fileReferences.productPhoto?.url,
        icp: data.icp,
        productFeatures: data.productFeatures,
        setting: data.videoSetting,
        process: data.process,
        platform: data.platform,
        useCaptions: data.useCaptions,
        captionText: data.captionText,
        captionFontStyle: data.captionFontStyle,
        captionFontSize: data.captionFontSize,
        captionPosition: data.captionPosition,
        useMusic: data.useMusic,
        musicPrompt: data.backgroundMusicPrompt,
        useSoundFX: data.useSoundFX,
        socialMediaContentId: data.socialMediaContentId,
        contentIdeaId: data.contentIdeaId,
        // Include file info for n8n
        hasReferenceImage: !!fileReferences.referenceImage,
        hasProductPhoto: !!fileReferences.productPhoto
      },

      metadata: {
        source: 'content-engine-app',
        version: '1.0'
      }
    }

    // Get webhook URL from environment or use default
    const webhookUrl = process.env.N8N_VIDEO_GENERATION_WEBHOOK_URL || 'https://n8n.aiautomata.co.za/webhook/video-generation'

    if (webhookUrl) {
      console.log('📡 Sending webhook to n8n:', webhookUrl)
      try {
        const webhookResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(webhookPayload)
        })

        if (webhookResponse.ok) {
          console.log('✅ Webhook sent successfully')
        } else {
          console.error('❌ Webhook failed:', await webhookResponse.text())
        }
      } catch (webhookError: any) {
        console.error('❌ Error sending webhook:', webhookError.message)
        // Don't fail the request if webhook fails
      }
    } else {
      console.warn('⚠️ No webhook URL configured for video_generation (set N8N_VIDEO_GENERATION_WEBHOOK_URL in .env)')
    }

    return NextResponse.json({
      success: true,
      video: createdVideo,
      message: 'Video generation started'
    })

  } catch (error: any) {
    console.error('❌ Error creating video:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create video'
      },
      { status: 500 }
    )
  }
}

