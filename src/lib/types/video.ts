/**
 * Video Types and Interfaces
 * 
 * Defines all types for the unified video generation system
 */

// Video Type Options
export type VideoType = 
  | 'Text-to-Video'
  | 'Image-to-Video'
  | 'Storyboard'
  | 'Multi-Scene Process'
  | 'UGC Ad'
  | 'Social Post Video'

// Video Status Options
export type VideoStatus =
  | 'Pending'
  | 'Preparing'
  | 'Generating Scenes'
  | 'Generating Images'
  | 'Generating Videos'
  | 'Processing Audio'
  | 'Finalizing'
  | 'Completed'
  | 'Failed'

// AI Model Options
export type VideoModel =
  | 'Sora 2'
  | 'Veo 3.1'
  | 'Veo 3.1 Fast'
  | 'Kling Video'
  | 'NanoBanana + Veo 3.1'
  | 'fal.ai'

// Aspect Ratio Options
export type AspectRatio =
  | '9:16 (Vertical)'
  | '16:9 (Landscape)'
  | '1:1 (Square)'
  | '4:5 (Portrait)'

// Platform Options
export type VideoPlatform =
  | 'Facebook'
  | 'Instagram'
  | 'Twitter'
  | 'LinkedIn'
  | 'TikTok'
  | 'YouTube'

// Caption Position Options
export type CaptionPosition = 'Top' | 'Center' | 'Bottom'

/**
 * Main Video Interface (matches Baserow Videos table)
 */
export interface Video {
  // Auto-generated
  video_id: number

  // Core Fields
  video?: {
    url: string
    name: string
    size: number
    visible_name: string
  }[]
  videoUrl?: string
  thumbnailUrl?: string
  videoPrompt: string
  videoType: VideoType
  videoStatus: VideoStatus
  model: VideoModel
  clientId: string

  // Configuration
  aspectRatio: AspectRatio
  duration: number
  nFrames?: number
  removeWatermark?: boolean

  // Reference Media
  referenceImage?: {
    url: string
    name: string
  }[]
  referenceImageUrl?: string
  referenceVideo?: {
    url: string
    name: string
  }[]
  referenceVideoUrl?: string
  styleReferenceImage?: {
    url: string
    name: string
  }[]

  // Process & Product
  process?: string
  processId?: { id: number; value: string }[]
  product?: string
  productPhoto?: {
    url: string
    name: string
  }[]
  productPhotoUrl?: string
  icp?: string
  productFeatures?: string
  videoSetting?: string

  // Audio
  backgroundMusicPrompt?: string
  musicTrack?: { id: number; value: string }[]
  useMusic?: boolean
  useSoundFX?: boolean

  // Platform
  platform?: VideoPlatform

  // Scenes
  scenes?: { id: number; value: string }[]
  sceneCount?: number

  // Captions
  useCaptions?: boolean
  captionText?: string
  captionFontStyle?: string
  captionFontSize?: string
  captionPosition?: CaptionPosition

  // Processing URLs
  rawVideoUrl?: string
  processedVideoUrl?: string

  // Relationships
  socialMediaContent?: { id: number; value: string }[]
  contentIdea?: { id: number; value: string }[]

  // YouTube
  youtubeTitle?: string
  youtubeHashtags?: string
  youtubeVideoId?: string

  // Metadata
  taskId?: string
  errorMessage?: string
  metadata?: string

  // Timestamps
  createdAt: string
  updatedAt: string
  completedAt?: string
}

/**
 * Form Data Interface for Video Creation
 */
export interface VideoFormData {
  // Core
  videoPrompt: string
  videoType: VideoType
  model: VideoModel
  aspectRatio: AspectRatio
  duration: number

  // Optional Configuration
  nFrames?: number
  removeWatermark?: boolean

  // Reference Media (Files from form or selected from Image Ideas)
  referenceImage?: File
  referenceImageUrl?: string
  referenceImageId?: string // ID from Image Ideas library
  referenceVideo?: File
  styleReferenceImage?: File

  // Product Info (for UGC Ads)
  product?: string
  productPhoto?: File
  productPhotoUrl?: string
  icp?: string
  productFeatures?: string
  videoSetting?: string

  // Process Info (for Multi-Scene)
  process?: string
  processId?: string

  // Platform
  platform?: VideoPlatform

  // Audio
  useMusic?: boolean
  backgroundMusicPrompt?: string
  musicTrackId?: string
  useSoundFX?: boolean

  // Captions
  useCaptions?: boolean
  captionText?: string
  captionFontStyle?: string
  captionFontSize?: string
  captionPosition?: CaptionPosition

  // Relationships
  socialMediaContentId?: string
  contentIdeaId?: string

  // Scenes (for multi-scene videos)
  scenes?: VideoSceneFormData[]
}

/**
 * Scene Data for Multi-Scene Videos
 */
export interface VideoSceneFormData {
  number: number
  prompt: string
  duration: number
  animationPrompt?: string
  soundEffectPrompt?: string
}

/**
 * Webhook Payload for n8n
 */
export interface VideoGenerationPayload {
  // Event Info
  event: 'video_generation'
  clientId: string
  videoType: string
  model: string
  timestamp: string

  // Client Configuration
  client: {
    id: string
    name: string
    baserowToken: string
    databaseId: string
  }

  // Baserow Tables
  tables: {
    videos: {
      id: string
      recordId: string
    }
    scenes?: {
      id: string
    }
    socialMediaContent?: {
      id: string
      recordId?: string
    }
  }

  // Field Mappings
  fieldMappings: {
    videos: Record<string, string>
    scenes?: Record<string, string>
  }

  // Video Data
  video: {
    prompt: string
    type: string
    model: string
    aspectRatio: string
    duration: number
    nFrames?: number
    removeWatermark?: boolean

    // Reference Media
    referenceImageUrl?: string
    referenceVideoUrl?: string
    styleReferenceImageUrl?: string

    // Product Info
    product?: string
    productPhotoUrl?: string
    icp?: string
    productFeatures?: string
    setting?: string

    // Process Info
    process?: string
    processId?: string

    // Platform
    platform?: string

    // Captions
    useCaptions?: boolean
    captionText?: string
    captionFontStyle?: string
    captionFontSize?: string
    captionPosition?: string

    // Audio
    useMusic?: boolean
    musicPrompt?: string
    musicTrackId?: string
    useSoundFX?: boolean

    // Links
    socialMediaContentId?: string
    contentIdeaId?: string
  }

  // Scenes (for multi-scene)
  scenes?: Array<{
    number: number
    prompt: string
    duration: number
    animationPrompt?: string
    soundEffectPrompt?: string
  }>

  // Metadata
  metadata: {
    source: string
    version: string
    userAgent?: string
  }
}

/**
 * API Response Types
 */
export interface CreateVideoResponse {
  success: boolean
  video: Video
  message?: string
}

export interface UpdateVideoResponse {
  success: boolean
  video: Video
  message?: string
}

export interface ListVideosResponse {
  success: boolean
  videos: Video[]
  count: number
}

export interface DeleteVideoResponse {
  success: boolean
  message: string
}

/**
 * Field Mappings for Videos Table
 * Table ID: 3395 (in Client Info database 233)
 */
export const VIDEOS_FIELD_MAPPINGS = {
  video: '43368',
  videoUrl: '43369',
  thumbnailUrl: '43370',
  videoPrompt: '43371',
  videoType: '43372',
  videoStatus: '43373',
  model: '43374',
  clientId: '43375',
  aspectRatio: '43376',
  duration: '43377',
  nFrames: '43378',
  removeWatermark: '43379',
  referenceImage: '43380',
  referenceImageUrl: '43381',
  referenceVideo: '43382',
  referenceVideoUrl: '43383',
  styleReferenceImage: '43384',
  process: '43385',
  backgroundMusicPrompt: '43386',
  product: '43387',
  productPhoto: '43388',
  productPhotoUrl: '43389',
  icp: '43390',
  productFeatures: '43391',
  videoSetting: '43392',
  platform: '43393',
  sceneCount: '43394',
  useCaptions: '43395',
  captionText: '43396',
  captionFontStyle: '43397',
  captionFontSize: '43398',
  captionPosition: '43399',
  useMusic: '43400',
  useSoundFX: '43401',
  rawVideoUrl: '43402',
  processedVideoUrl: '43403',
  youtubeTitle: '43404',
  youtubeHashtags: '43405',
  youtubeVideoId: '43406',
  taskId: '43407',
  errorMessage: '43408',
  metadata: '43409',
  createdAt: '43410',
  updatedAt: '43411',
  completedAt: '43412'
} as const

/**
 * Helper to map video type to supported models
 */
export const VIDEO_TYPE_TO_MODELS: Record<VideoType, VideoModel[]> = {
  'Text-to-Video': ['Sora 2', 'Veo 3.1'],
  'Image-to-Video': ['Sora 2', 'Veo 3.1', 'Kling Video'],
  'Storyboard': ['Sora 2'],
  'Multi-Scene Process': ['Kling Video', 'fal.ai'],
  'UGC Ad': ['Veo 3.1', 'Sora 2', 'NanoBanana + Veo 3.1'],
  'Social Post Video': ['Sora 2', 'Veo 3.1']
}

/**
 * Helper to get default aspect ratio for platform
 */
export const PLATFORM_TO_ASPECT_RATIO: Record<VideoPlatform, AspectRatio> = {
  'Facebook': '1:1 (Square)',
  'Instagram': '9:16 (Vertical)',
  'Twitter': '16:9 (Landscape)',
  'LinkedIn': '16:9 (Landscape)',
  'TikTok': '9:16 (Vertical)',
  'YouTube': '16:9 (Landscape)'
}

