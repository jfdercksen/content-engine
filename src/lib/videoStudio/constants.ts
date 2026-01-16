// Video Studio Baserow configuration
// Defaults; can be overridden per client via EnvironmentManager
export const VIDEO_STUDIO_DEFAULT_DATABASE_ID = '525'
export const VIDEO_STUDIO_DEFAULT_WEBHOOK_URL =
  'https://n8n.aiautomata.co.za/webhook/short_video'
export const VIDEO_STUDIO_DEFAULT_CALLBACK_SECRET = ''
export const VIDEO_STUDIO_DEFAULT_TOKEN =
  process.env.BASEROW_VIDEO_STUDIO_TOKEN ||
  process.env.BASEROW_MODERN_MANAGEMENT_TOKEN ||
  ''
export const VIDEO_STUDIO_WEBHOOK_URL =
  process.env.N8N_VIDEO_STUDIO_WEBHOOK_URL || ''

// Static table IDs for Video Studio DB
export const VIDEO_STUDIO_TABLES: Record<string, string> = {
  videos: '3449',
  scenes: '3451',
  music: '3452',
  soundfx: '3453',
  videoStyles: '3454',
  imageStyles: '3455',
}

// Field names (using user_field_names=true)
export const VIDEO_FIELDS = {
  campaignName: 'Campaign Name',
  contentId: 'Content ID',
  videoType: 'Video Type',
  script: 'Script',
  videoDescription: 'Video Description',
  musicPrompt: 'Music Prompt',
  ttsVoice: 'TTS Voice',
  ttsAudio: 'TTS Audio',
  ttsStatus: 'TTS Status',
  captionsUrl: 'Captions URL',
  captionedVideo: 'Captioned Video',
  rawVideoUrl: 'Raw Video URL',
  finalVideoUrl: 'Final Video URL',
  finalVideoFile: 'Final Video',
  videoVoiceMusicUrl: 'Video + Voice + Music',
  videoCaptionsUrl: 'Video + Captions URL',
  imageGenerator: 'Image Generator',
  generativeStyle: 'Generative Style',
  scriptStatus: 'Script Status',
  imagesStatus: 'Images Status',
  musicStatus: 'Music Status',
  finalStatus: 'Final Status',
  videoStatus: 'Video Status',
  scenes: 'Scenes',
  progressLog: 'Progress Log',
} as const

export const SCENE_FIELDS = {
  description: 'Description',
  imagePrompt: 'Image Prompt',
  animationPrompt: 'Animation Prompt',
  soundEffectPrompt: 'Sound Effect Prompt',
  image: 'Image',
  videoClip: 'Video Clip',
  externalImageUrl: 'External Image URL',
  externalVideoUrl: 'External Video URL',
  videoSoundFx: 'Video + SoundFX',
  duration: 'Duration',
  scriptSegment: 'Script Segment',
  generationStatus: 'Generation Status',
  videos: 'Videos Campaigns',
} as const


