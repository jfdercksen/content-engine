// Content Ideas Types
export interface ContentIdea {
  id: string
  title: string                    // Main content idea
  idea_type: string               // blog_post, social_media_post, video_content, etc.
  description: string             // Detailed description
  source_type: string            // url, manual, voice, image
  source_url?: string            // Reference URL if applicable
  manual_content?: string        // User-provided content details
  voice_file_url?: string        // Uploaded voice note URL
  target_audience: string        // b2b_decision_makers, technical_users, etc.
  priority: 'High' | 'Medium' | 'Low'
  status: string                 // Idea, In Progress, Ready for Review, etc.
  due_date?: string             // ISO date string
  client_notes?: string         // Additional notes
  created_date: string          // Auto-generated
  updated_date: string          // Auto-updated
}

// Form Data Types
export interface ContentIdeaFormData {
  contentIdea: string
  contentType: string
  sourceType?: string
  sourceUrl?: string
  manualContent?: string
  targetAudience: string
  priority: 'High' | 'Medium' | 'Low'
  dueDate?: string
  additionalNotes?: string
}

// Content Types
export const CONTENT_TYPES = {
  BLOG_POST: 'blog_post',
  SOCIAL_MEDIA_POST: 'social_media_post',
  VIDEO_CONTENT: 'video_content',
  EMAIL_CAMPAIGN: 'email_campaign',
  PRODUCT_UVP: 'product_uvp',
  CONTENT_FOCUS_PLAN: 'content_focus_plan',
  IMAGE_CONTENT: 'image_content',
  VOICE_CONTENT: 'voice_content',
  OTHER: 'other'
} as const

// Source Types
export const SOURCE_TYPES = {
  URL: 'url',
  MANUAL: 'manual',
  VOICE: 'voice',
  IMAGE: 'image',
  TEMPLATE: 'template'
} as const

// Target Audiences
export const TARGET_AUDIENCES = {
  B2B_DECISION_MAKERS: 'b2b_decision_makers',
  TECHNICAL_USERS: 'technical_users',
  END_CONSUMERS: 'end_consumers',
  INDUSTRY_EXPERTS: 'industry_experts',
  GENERAL_BUSINESS: 'general_business'
} as const

// Content Status
export const CONTENT_STATUS = {
  IDEA: 'Idea',
  IN_PROGRESS: 'In Progress',
  READY_FOR_REVIEW: 'Ready for Review',
  CLIENT_REVIEW: 'Client Review',
  APPROVED: 'Approved',
  PUBLISHED: 'Published',
  ARCHIVED: 'Archived'
} as const

// API Response Types
export interface BaserowResponse<T> {
  count: number
  next?: string
  previous?: string
  results: T[]
}

export interface CreateContentIdeaResponse {
  success: boolean
  id: string
  data: ContentIdea
  message?: string
}

export interface CreateSocialMediaContentResponse {
  success: boolean
  id: string
  data: SocialMediaContent
  message?: string
}

export interface CreateBrandAssetResponse {
  success: boolean
  id: string
  data: BrandAsset
  message?: string
}

export interface UpdateContentIdeaResponse {
  success: boolean
  id: string
  data: ContentIdea
  message?: string
}

export interface UpdateSocialMediaContentResponse {
  success: boolean
  id: string
  data: SocialMediaContent
  message?: string
}

export interface UpdateBrandAssetResponse {
  success: boolean
  id: string
  data: BrandAsset
  message?: string
}

export interface DeleteBrandAssetResponse {
  success: boolean
  id: string
  message?: string
}

// Enhanced API Response Types
export interface GetContentIdeaResponse {
  success: boolean
  data: ContentIdea
  message?: string
}

export interface GetSocialMediaContentResponse {
  success: boolean
  data: SocialMediaContent
  message?: string
}

export interface GetBrandAssetResponse {
  success: boolean
  data: BrandAsset
  message?: string
}

export interface ListContentIdeasResponse {
  success: boolean
  data: ContentIdea[]
  pagination: {
    total: number
    page: number
    size: number
    totalPages: number
  }
  message?: string
}

export interface ListSocialMediaContentResponse {
  success: boolean
  data: SocialMediaContent[]
  pagination: {
    total: number
    page: number
    size: number
    totalPages: number
  }
  message?: string
}

export interface ListBrandAssetsResponse {
  success: boolean
  data: BrandAsset[]
  pagination: {
    total: number
    page: number
    size: number
    totalPages: number
  }
  message?: string
}

export interface RelationshipQueryResponse {
  success: boolean
  data: RelationshipQueryResult
  message?: string
}

export interface ApiErrorResponse {
  success: false
  error: string
  details?: string
  code?: string
  field?: string
}

// Relationship Type Definitions
export interface ContentIdeaWithSocialMedia extends ContentIdea {
  socialMediaContent?: SocialMediaContent[]
  socialMediaContentCount?: number
  socialMediaStats?: SocialMediaContentStats
  relevantBrandAssets?: BrandAsset[]
}

export interface SocialMediaContentWithIdea extends SocialMediaContent {
  contentIdeaData?: ContentIdea
  relevantBrandAssets?: BrandAsset[]
}

export interface BrandAssetWithRelations extends BrandAsset {
  relatedContentIdeas?: ContentIdea[]
  relatedSocialMediaContent?: SocialMediaContent[]
  usageCount?: number
  lastUsed?: string
}

export interface BrandAssetsByPlatform {
  platform: string
  assets: BrandAsset[]
  count: number
}

export interface BrandAssetsByType {
  assetType: string
  assets: BrandAsset[]
  count: number
}

export interface ContentRelationships {
  contentIdea: ContentIdea
  socialMediaContent: SocialMediaContent[]
  relevantBrandAssets: BrandAsset[]
  brandAssetsByPlatform: BrandAssetsByPlatform[]
}

export interface ContentWorkflowData {
  contentIdea: ContentIdea
  generatedContent: SocialMediaContent[]
  usedBrandAssets: BrandAsset[]
  workflow: {
    status: 'pending' | 'processing' | 'completed' | 'failed'
    startedAt: string
    completedAt?: string
    error?: string
  }
}

// Enhanced relationship query types
export interface RelationshipQuery {
  contentIdeaId?: string
  socialMediaContentId?: string
  brandAssetId?: string
  platform?: string
  contentType?: string
  includeStats?: boolean
}

export interface RelationshipQueryResult {
  contentIdeas: ContentIdea[]
  socialMediaContent: SocialMediaContent[]
  brandAssets: BrandAsset[]
  relationships: {
    contentIdeaToSocialMedia: Record<string, string[]>
    socialMediaToBrandAssets: Record<string, string[]>
    contentIdeaToBrandAssets: Record<string, string[]>
  }
  stats?: {
    totalRelationships: number
    averageContentPerIdea: number
    mostUsedBrandAssets: BrandAsset[]
  }
}

// Filter Types for API queries
export interface SocialMediaContentFilters {
  platform?: string
  status?: string
  contentType?: string
  contentIdea?: string
  dateFrom?: string
  dateTo?: string
}

export interface BrandAssetFilters {
  platform?: string
  assetType?: string
  status?: string
  priority?: string
  contentType?: string
}

// Webhook Types
export interface N8nWebhookPayload {
  event: string
  timestamp: string
  clientId: string
  ideaId: string
  contentData: {
    title: string
    type: string
    sourceType: string
    sourceUrl?: string
    manualContent?: string
    targetAudience: string
    priority: string
    dueDate?: string
    additionalNotes?: string
    voiceFileUrl?: string
  }
  // Enhanced payload for multi-table integration
  tables: {
    contentIdeas: {
      id: string
      recordId: string
    }
    socialMediaContent: {
      id: string
    }
    brandAssets: {
      id: string
    }
  }
  client: {
    name: string
    id: string
  }
  baserow: {
    baseUrl: string
    databaseId: string
    token: string
  }
  metadata?: {
    workflowId?: string
    executionId?: string
    retryCount?: number
  }
}

export interface N8nWebhookResponse {
  success: boolean
  message: string
  data?: {
    contentIdea?: ContentIdea
    socialMediaContent?: SocialMediaContent[]
    brandAssets?: BrandAsset[]
  }
  error?: string
}

// File Upload Types
export interface VoiceUploadResponse {
  success: boolean
  fileUrl: string
  fileName: string
  fileSize: number
}

import { z } from 'zod'

// Social Media Content Types
export interface SocialMediaContent {
  id: string
  postId: string           // field_6920
  hook: string            // field_7144
  post: string            // field_7145
  cta: string             // field_7147
  hashtags: string        // field_7148
  platform: string        // field_6923
  contentType: string     // field_6921
  characterCount: number  // field_7149
  imagePrompt: string     // field_6922
  image: string           // field_6929 (unused)
  images: Image[]         // field_7193 (linked to Images table)
  angle: string           // field_6925
  intent: string          // field_6926
  contentTheme: string    // field_7166
  psychologicalTrigger: string // field_7167
  engagementObjective: string  // field_7168
  comments: string        // field_7146
  engagementPrediction: string // field_7150
  status: string          // field_6950
  approvedBy: string      // field_6927
  contentIdea: string     // field_7152 (relationship)
  scheduledTime: string   // field_6928
  createdAt: string       // field_6930
  updatedAt: string       // field_7151
}

// Social Media Content Constants
export const SOCIAL_MEDIA_PLATFORMS = {
  FACEBOOK: 'Facebook',
  INSTAGRAM: 'Instagram',
  X: 'X',
  LINKEDIN: 'LinkedIn',
  TIKTOK: 'TikTok',
  YOUTUBE: 'YouTube',
  PINTEREST: 'Pinterest'
} as const

// Social Media Content Types
export const SOCIAL_MEDIA_CONTENT_TYPES = {
  IMAGE: 'Image',
  VIDEO: 'Video',
  CAROUSEL: 'Carousel',
  STORY: 'Story',
  REEL: 'Reel',
  COPYWRITE: 'Copywrite',
  OTHER: 'Other'
} as const

// Social Media Status
export const SOCIAL_MEDIA_STATUS = {
  IN_REVIEW: 'In Review',
  APPROVED: 'Approved',
  NOT_APPROVED: 'Not Approved',
  REGENERATE: 'Regenerate',
  SCHEDULED: 'Scheduled',
  PUBLISHED: 'Published',
  ARCHIVED: 'Archived'
} as const

// Remove duplicate - using the more comprehensive schema below

// Brand Assets Types
export interface BrandAsset {
  id: string
  assetName: string       // field_7197
  platform: string        // field_7155
  contentType: string     // field_7156
  assetType: string       // field_7157
  assetInformation: string // field_7158
  brandVoiceGuidelines: string // field_7169
  approvedHashtags: string // field_7170
  toneStylePreferences: string // field_7171
  forbiddenWordsTopics: string // field_7172
  platformSpecificRules: string // field_7173
  file: string            // field_7159
  fileUrl: string         // field_7160
  status: string          // field_7161
  priority: string        // field_7162
  createdDate: string     // field_7163
  lastUpdated: string     // field_7164
  notes: string           // field_7165
}

// Images Types
export interface Image {
  id: string
  image: string           // field_7178 (file field - final generated image)
  imagePrompt: string     // field_7179 (text field - for Image Ideas text notes)
  imageType: string       // field_7180 (single select)
  imageScene: string      // field_7181 (text field)
  imageStyle: string      // field_7182 (single select)
  imageModel: string      // field_7183 (single select)
  imageSize: string       // field_7184 (single select)
  imageStatus: string     // field_7185 (single select)
  referenceImage: string  // field_7186 (file field - for uploaded reference)
  referenceUrl: string    // field_7187 (text field - for URL reference)
  captionText: string     // field_7188 (text field - for image captions)
  captionFontStyle: string // field_7189 (single select)
  captionFontSize: string // field_7190 (single select)
  captionPosition: string // field_7191 (single select)
  voiceNote: string       // field_7228 (file field - for voice notes)
  socialMediaContent: string[] // field_7192 (link_row to social media content)
  emailImages: string     // field_7226 (single select - Header, Body 1, etc.)
  clientId: string        // field_7194 (text)
  createdAt: string       // field_7195 (date)
  acceptedAt: string      // field_7196 (date)
}

// Email Ideas Types
export interface EmailIdea {
  id: string
  emailId: string         // field_7198 (auto number)
  emailIdeaName: string   // field_7199 (text)
  emailType: string       // field_7201 (single select)
  hook: string            // field_7202 (text)
  cta: string             // field_7203 (text)
  emailTextIdea: string   // field_7211 (text)
  emailVoiceIdea: string  // field_7213 (file)
  emailUrlIdea: string    // field_7212 (url)
  emailVideoIdea: string  // field_7214 (file)
  emailImageIdea: string  // field_7215 (file)
  status: string          // field_7200 (single select)
  lastModified: string    // field_7216 (iso date)
  createdDate: string     // field_7217 (iso date)
  templates: string[]     // field_7221 (link to templates table)
  generatedHtml: string   // field_7223 (text)
  images: string[]        // field_7224 (link to images table)
}

// Templates Types
export interface Template {
  id: string
  templateId: string      // field_7204 (auto number)
  templateName: string    // field_7205 (text)
  templateType: string    // field_7207 (single select)
  templateCategory: string // field_7206 (single select)
  htmlTemplate: string    // field_7208 (text)
  cssStyles: string       // field_7209 (text)
  isActive: boolean       // field_7210 (boolean)
  lastModified: string    // field_7218 (iso date)
  createdDate: string     // field_7219 (iso date)
}

// Brand Assets Constants
export const BRAND_ASSET_PLATFORMS = {
  FACEBOOK: 'Facebook',
  INSTAGRAM: 'Instagram',
  X: 'X',
  LINKEDIN: 'LinkedIn',
  BLOG: 'Blog',
  EMAIL: 'Email',
  WEBSITE: 'Website',
  PRINT: 'Print',
  UNIVERSAL: 'Universal'
} as const

export const BRAND_ASSET_CONTENT_TYPES = {
  SOCIAL_MEDIA_POST: 'Social Media Post',
  STORY: 'Story',
  REEL: 'Reel',
  BLOG_POST: 'Blog Post',
  EMAIL_CAMPAIGN: 'Email Campaign',
  GENERAL: 'General'
} as const

export const BRAND_ASSET_TYPES = {
  BRAND_VOICE: 'Brand Voice',
  VISUAL_ASSET: 'Visual Asset',
  TEMPLATE: 'Template',
  GUIDELINES: 'Guidelines'
} as const

export const BRAND_ASSET_STATUS = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  DRAFT: 'Draft'
} as const

export const BRAND_ASSET_PRIORITY = {
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low'
} as const

// Email Ideas Constants
export const EMAIL_TYPES = {
  WELCOME_ONBOARDING: 'Welcome & Onboarding Emails',
  PROMOTIONAL: 'Promotional Emails',
  NEWSLETTER_CONTENT: 'Newsletter / Content Emails',
  LEAD_NURTURE_DRIP: 'Lead Nurture / Drip Emails',
  EVENT_LAUNCH: 'Event or Launch Emails',
  TRANSACTIONAL: 'Transactional Emails',
  RE_ENGAGEMENT: 'Re-Engagement Emails',
  CUSTOMER_LOYALTY_UPSELL: 'Customer Loyalty & Upsell Emails',
  SURVEY_FEEDBACK: 'Survey & Feedback Emails'
} as const

export const EMAIL_STATUS = {
  DRAFT: 'Draft',
  SEND: 'Send',
  GENERATING_IMAGE: 'Generating Image',
  APPROVED: 'Approved'
} as const

export const EMAIL_IMAGE_POSITIONS = {
  // Based on actual template usage
  HEADER: 'Header Image',
  MAIN: 'Main Survey Image', 
  CTA: 'CTA Image',
  FOOTER: 'Company Logo',
  HERO: 'Hero Image',
  BANNER: 'Banner Image',
  BODY_1: 'Body Image 1',
  BODY_2: 'Body Image 2', 
  BODY_3: 'Body Image 3',
  PROMO_1: 'Promo Image 1',
  PROMO_2: 'Promo Image 2',
  PROMO_3: 'Promo Image 3',
  LOGO: 'Logo',
  SIGNATURE: 'Signature',
  GALLERY_1: 'Gallery Image 1',
  GALLERY_2: 'Gallery Image 2',
  PRODUCT_1: 'Product Image 1',
  PRODUCT_2: 'Product Image 2',
  TEAM_1: 'Team Image 1',
  TEAM_2: 'Team Image 2',
  TESTIMONIAL_1: 'Testimonial Image 1',
  TESTIMONIAL_2: 'Testimonial Image 2',
  EVENT_1: 'Event Image 1',
  EVENT_2: 'Event Image 2',
  OFFER_1: 'Offer Image 1',
  OFFER_2: 'Offer Image 2',
  NEWSLETTER: 'Newsletter Image',
  SOCIAL: 'Social Image',
  BRAND: 'Brand Image'
} as const;

// Simple template image configuration
export interface TemplateImageConfig {
  templateId: number;
  imageSlots: string[]; // e.g., ['Header', 'Body 1', 'CTA', 'Footer']
  description?: string; // Optional description of what each image is for
}

// Predefined image slot configurations for common email templates
export const TEMPLATE_IMAGE_CONFIGS: TemplateImageConfig[] = [
  {
    templateId: 1,
    imageSlots: ['Header Image', 'Body Image 1', 'CTA Image', 'Company Logo'],
    description: 'Standard 4-image template with header, body, CTA, and footer images'
  },
  {
    templateId: 2,
    imageSlots: ['Hero Image', 'Body Image 1', 'Body Image 2', 'Promo Image 1', 'CTA Image'],
    description: 'Promotional template with hero, two body sections, promo, and CTA'
  },
  {
    templateId: 3,
    imageSlots: ['Header Image', 'Gallery Image 1', 'Gallery Image 2', 'Gallery Image 3', 'CTA Image'],
    description: 'Gallery template with header, three gallery images, and CTA'
  },
  {
    templateId: 4,
    imageSlots: ['Logo', 'Hero Image', 'Body Image 1', 'Signature'],
    description: 'Simple template with logo, hero, body, and signature'
  },
  {
    templateId: 5,
    imageSlots: ['Banner Image', 'Product Image 1', 'Product Image 2', 'Product Image 3', 'CTA Image', 'Company Logo'],
    description: 'Product showcase template with banner, three products, CTA, and footer'
  },
  {
    templateId: 6,
    imageSlots: ['Header Image', 'Hero Image', 'Body Image 1', 'Body Image 2', 'CTA Image', 'Company Logo'],
    description: 'Comprehensive template with header, hero, two body sections, CTA, and footer'
  }
];

// Templates Constants
export const TEMPLATE_TYPES = {
  EMAIL: 'Email',
  BLOG: 'Blog',
  SOCIAL_MEDIA: 'Social Media'
} as const

export const TEMPLATE_CATEGORIES = {
  WELCOME: 'Welcome',
  PROMOTIONAL: 'Promotional',
  NEWSLETTER: 'Newsletter'
} as const

// Images Constants
export const IMAGE_TYPES = {
  NEW_IMAGE: 'New image',
  NEW_IMAGE_WITH_CAPTIONS: 'New image with captions',
  IMAGE_FROM_REFERENCE: 'Image from reference image',
  IMAGE_FROM_REFERENCE_WITH_CAPTIONS: 'Image from reference with captions',
  IMAGE_FROM_URL: 'Image from URL',
  IMAGE_FROM_URL_WITH_CAPTIONS: 'Image from URL with captions'
} as const

export const IMAGE_STYLES = {
  PHOTOREALISTIC: 'Photorealistic',
  DIGITAL_ART: 'Digital Art',
  VINTAGE: 'Vintage',
  SURREAL: 'Surreal',
  GOTHIC: 'Gothic',
  STEAMPUNK: 'Steampunk',
  MINIMALIST: 'Minimalist',
  CYBERPUNK: 'Cyberpunk',
  MEME: 'Meme',
  PENCIL_SKETCH: 'Pencil Sketch',
  ANIME_MANGA: 'Anime/Manga',
  THREE_D_RENDER: '3D Render',
  PIXEL_ART: 'Pixel Art',
  COMIC_BOOK: 'Comic Book',
  ABSTRACT: 'Abstract',
  PORTRAIT_PHOTOGRAPHY: 'Portrait Photography'
} as const

export const IMAGE_MODELS = {
  OPENAI_GPT_IMAGE_1: 'openai/gpt-image-1',
  BLACK_FOREST_FLUX_SCHNELL: 'black-forest-labs/flux-schnell',
  BLACK_FOREST_FLUX_DEV: 'black-forest-labs/flux-dev',
  BLACK_FOREST_FLUX_1_1_PRO_ULTRA: 'black-forest-labs/flux-1.1-pro-ultra',
  BLACK_FOREST_FLUX_KONTEXT_DEV: 'black-forest-labs/flux-kontext-dev',
  BLACK_FOREST_FLUX_KONTEXT_PRO: 'black-forest-labs/flux-kontext-pro',
  STABILITY_AI_STABLE_DIFFUSION_3_5_LARGE: 'stability-ai/stable-diffusion-3.5-large',
  STABILITY_AI_SDXL_TURBO: 'stability-ai/sdxl-turbo',
  RECRAFT_AI_RECRAFT_V3: 'recraft-ai/recraft-v3',
  IDEOGRAM_AI_IDEOGRAM_V2: 'ideogram-ai/ideogram-v2',
  BYTEDANCE_SDXL_LIGHTNING_4STEP: 'bytedance/sdxl-lightning-4step'
} as const

export const IMAGE_SIZES = {
  SQUARE_1024: '1024x1024 (1:1)',
  PORTRAIT_1080_1920: '1080 x 1920 (9:16)',
  LANDSCAPE_1200_630: '1200 x 630 (1.91:1)',
  LANDSCAPE_1920_1080: '1920 x 1080 (16:9)',
  PORTRAIT_896_1120: '896 x 1120 (4:5)'
} as const

export const IMAGE_STATUS = {
  GENERATING: 'Generating',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected'
} as const

export const CAPTION_FONT_STYLES = {
  ARIAL: 'Arial',
  HELVETICA: 'Helvetica',
  TIMES_NEW_ROMAN: 'Times New Roman',
  GEORGIA: 'Georgia',
  VERDANA: 'Verdana',
  COMIC_SANS_MS: 'Comic Sans MS',
  IMPACT: 'Impact',
  ROBOTO: 'Roboto',
  OPEN_SANS: 'Open Sans',
  MONTSERRAT: 'Montserrat'
} as const

export const CAPTION_FONT_SIZES = {
  SMALL: 'Small (12px)',
  MEDIUM: 'Medium (16px)',
  LARGE: 'Large (20px)',
  EXTRA_LARGE: 'Extra Large (24px)',
  XXL: 'XXL (32px)',
  XXXL: 'XXXL (48px)'
} as const

export const CAPTION_POSITIONS = {
  BOTTOM_CENTER: 'bottom-center',
  BOTTOM_LEFT: 'bottom-left',
  BOTTOM_RIGHT: 'bottom-right',
  TOP_CENTER: 'top-center',
  TOP_LEFT: 'top-left',
  TOP_RIGHT: 'top-right',
  CENTER: 'center',
  LOWER_THIRD: 'lower-third',
  UPPER_THIRD: 'upper-third'
} as const

// Remove duplicate - using the more comprehensive schema below

// Form Data Types
export interface SocialMediaContentFormData {
  hook: string
  post: string
  cta: string
  hashtags: string
  platform: string
  contentType: string
  imagePrompt?: string
  angle: string
  intent: string
  contentTheme: string
  psychologicalTrigger: string
  engagementObjective: string
  status: string
  scheduledTime?: string
  contentIdea?: string
}

export interface BrandAssetFormData {
  assetName: string
  platform: string
  contentType: string
  assetType: string
  assetInformation?: string
  brandVoiceGuidelines?: string
  approvedHashtags?: string
  toneStylePreferences?: string
  forbiddenWordsTopics?: string
  platformSpecificRules?: string
  file?: File
  fileUrl?: string
  status: string
  priority: string
  notes?: string
}

export interface ImageFormData {
  imagePrompt: string
  imageType: string
  imageScene?: string
  imageStyle: string
  imageModel: string
  imageSize: string
  useReferenceImage?: boolean
  referenceImage?: File
  referenceUrl?: string
  useCaptions?: boolean
  captionText?: string
  captionFontStyle?: string
  captionFontSize?: string
  captionPosition?: string
  socialMediaContent?: string
}

// Brand Asset Form Data Zod Schema
export const brandAssetFormDataSchema = z.object({
  assetName: z.string().min(1, 'Asset name is required'),
  platform: z.enum(['Facebook', 'Instagram', 'X', 'LinkedIn', 'Blog', 'Email', 'Website', 'Print', 'Universal']),
  contentType: z.enum(['Social Media Post', 'Story', 'Reel', 'Blog Post', 'Email Campaign', 'General']),
  assetType: z.enum(['Brand Voice', 'Visual Asset', 'Template', 'Guidelines']),
  assetInformation: z.string().optional().default(''),
  brandVoiceGuidelines: z.string().optional().default(''),
  approvedHashtags: z.string().optional().default(''),
  toneStylePreferences: z.string().optional().default(''),
  forbiddenWordsTopics: z.string().optional().default(''),
  platformSpecificRules: z.string().optional().default(''),
  file: z.instanceof(File).optional(),
  fileUrl: z.string().url().optional().or(z.literal('')),
  status: z.enum(['Active', 'Inactive', 'Draft']),
  priority: z.enum(['High', 'Medium', 'Low']),
  notes: z.string().optional().default('')
})

// Social Media Content validation schema
export const socialMediaContentSchema = z.object({
  postId: z.string().optional(),
  hook: z.string().min(1, 'Hook is required').max(500, 'Hook must be less than 500 characters'),
  post: z.string().min(1, 'Post content is required').max(2000, 'Post must be less than 2000 characters'),
  cta: z.string().min(1, 'Call to action is required').max(200, 'CTA must be less than 200 characters'),
  hashtags: z.string().max(500, 'Hashtags must be less than 500 characters').optional(),
  platform: z.enum(['Facebook', 'Instagram', 'X', 'LinkedIn', 'TikTok', 'YouTube', 'Other']),
  contentType: z.enum(['Post', 'Story', 'Reel', 'Video', 'Carousel', 'Live', 'Other']),
  characterCount: z.number().min(0).optional(),
  imagePrompt: z.string().max(1000, 'Image prompt must be less than 1000 characters').optional(),
  image: z.string().url('Invalid image URL').optional().or(z.literal('')),
  angle: z.string().max(200, 'Angle must be less than 200 characters').optional(),
  intent: z.string().max(200, 'Intent must be less than 200 characters').optional(),
  contentTheme: z.string().max(200, 'Content theme must be less than 200 characters').optional(),
  psychologicalTrigger: z.string().max(200, 'Psychological trigger must be less than 200 characters').optional(),
  engagementObjective: z.string().max(200, 'Engagement objective must be less than 200 characters').optional(),
  comments: z.string().max(1000, 'Comments must be less than 1000 characters').optional(),
  engagementPrediction: z.string().max(200, 'Engagement prediction must be less than 200 characters').optional(),
  status: z.enum(['Draft', 'Ready for Review', 'Approved', 'Scheduled', 'Published', 'Archived']),
  approvedBy: z.string().optional(),
  contentIdea: z.string().optional(),
  scheduledTime: z.string().datetime().optional().or(z.literal('')),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional()
})

// Social Media Content form validation schema (subset for forms)
export const socialMediaContentFormSchema = z.object({
  hook: z.string().min(1, 'Hook is required').max(500, 'Hook must be less than 500 characters'),
  post: z.string().min(1, 'Post content is required').max(2000, 'Post must be less than 2000 characters'),
  cta: z.string().min(1, 'Call to action is required').max(200, 'CTA must be less than 200 characters'),
  hashtags: z.string().max(500, 'Hashtags must be less than 500 characters').optional(),
  platform: z.enum(['Facebook', 'Instagram', 'X', 'LinkedIn', 'TikTok', 'YouTube', 'Other']),
  contentType: z.enum(['Image', 'Video', 'Carousel', 'Story', 'Reel', 'Copywrite', 'Other']),
  imagePrompt: z.string().max(1000, 'Image prompt must be less than 1000 characters').optional(),
  angle: z.string().max(200, 'Angle must be less than 200 characters').optional(),
  intent: z.string().max(200, 'Intent must be less than 200 characters').optional(),
  contentTheme: z.string().max(200, 'Content theme must be less than 200 characters').optional(),
  psychologicalTrigger: z.string().max(200, 'Psychological trigger must be less than 200 characters').optional(),
  engagementObjective: z.string().max(200, 'Engagement objective must be less than 200 characters').optional(),
  status: z.enum(['In Review', 'Approved', 'Not Approved', 'Regenerate', 'Scheduled', 'Published', 'Archived']),
  scheduledTime: z.string().optional().or(z.literal('')),
  contentIdea: z.union([z.string(), z.object({ id: z.any(), value: z.any() })]).optional(),
  selectedImages: z.array(z.string()).optional()
})

// Brand Assets validation schema
export const brandAssetSchema = z.object({
  assetName: z.string().min(1, 'Asset name is required').max(200, 'Asset name must be less than 200 characters'),
  platform: z.enum(['Facebook', 'Instagram', 'X', 'LinkedIn', 'Blog', 'Email', 'Website', 'Print', 'Universal']),
  contentType: z.enum(['Social Media Post', 'Story', 'Reel', 'Blog Post', 'Email Campaign', 'General']),
  assetType: z.enum(['Brand Voice', 'Visual Asset', 'Template', 'Guidelines']),
  assetInformation: z.string().max(10000, 'Asset information must be less than 10000 characters').optional(),
  brandVoiceGuidelines: z.string().max(10000, 'Brand voice guidelines must be less than 10000 characters').optional(),
  approvedHashtags: z.string().max(5000, 'Approved hashtags must be less than 5000 characters').optional(),
  toneStylePreferences: z.string().max(5000, 'Tone/style preferences must be less than 5000 characters').optional(),
  forbiddenWordsTopics: z.string().max(5000, 'Forbidden words/topics must be less than 5000 characters').optional(),
  platformSpecificRules: z.string().max(10000, 'Platform-specific rules must be less than 10000 characters').optional(),
  file: z.string().optional(), // File reference from Baserow
  fileUrl: z.string().url('Invalid file URL').optional().or(z.literal('')),
  status: z.enum(['Active', 'Inactive', 'Draft']),
  priority: z.enum(['High', 'Medium', 'Low']),
  createdDate: z.string().datetime().optional(),
  lastUpdated: z.string().datetime().optional(),
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional()
})

// Brand Assets form validation schema
export const brandAssetFormSchema = z.object({
  assetName: z.string().min(1, 'Asset name is required').max(200, 'Asset name must be less than 200 characters'),
  platform: z.array(z.enum(['Facebook', 'Instagram', 'X', 'LinkedIn', 'Blog', 'Email', 'Website', 'Print', 'Universal'])),
  contentType: z.enum(['Social Media Post', 'Story', 'Reel', 'Blog Post', 'Email Campaign', 'General']),
  assetType: z.enum(['Brand Voice', 'Visual Asset', 'Template', 'Guidelines']),
  assetInformation: z.string().max(10000, 'Asset information must be less than 10000 characters').optional(),
  brandVoiceGuidelines: z.string().max(10000, 'Brand voice guidelines must be less than 10000 characters').optional(),
  approvedHashtags: z.string().max(5000, 'Approved hashtags must be less than 5000 characters').optional(),
  toneStylePreferences: z.string().max(5000, 'Tone/style preferences must be less than 5000 characters').optional(),
  forbiddenWordsTopics: z.string().max(5000, 'Forbidden words/topics must be less than 5000 characters').optional(),
  platformSpecificRules: z.string().max(10000, 'Platform-specific rules must be less than 10000 characters').optional(),
  file: z.instanceof(File).optional(),
  fileUrl: z.string().url('Invalid file URL').optional().or(z.literal('')),
  status: z.enum(['Active', 'Inactive', 'Draft']),
  priority: z.enum(['High', 'Medium', 'Low']),
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional()
})

// Image form validation schema
export const imageFormSchema = z.object({
  imagePrompt: z.string().min(1, 'Image prompt is required').max(1000, 'Image prompt must be less than 1000 characters'),
  imageType: z.enum(['New image', 'New image with captions', 'Image from reference image', 'Image from reference with captions', 'Image from URL', 'Image from URL with captions']),
  imageScene: z.string().max(500, 'Image scene must be less than 500 characters').optional(),
  imageStyle: z.enum(['Photorealistic', 'Digital Art', 'Vintage', 'Surreal', 'Gothic', 'Steampunk', 'Minimalist', 'Cyberpunk', 'Meme', 'Pencil Sketch', 'Anime/Manga', '3D Render', 'Pixel Art', 'Comic Book', 'Abstract', 'Portrait Photography']),
  imageModel: z.enum(['openai/gpt-image-1', 'black-forest-labs/flux-schnell', 'black-forest-labs/flux-dev', 'black-forest-labs/flux-1.1-pro-ultra', 'black-forest-labs/flux-kontext-dev', 'black-forest-labs/flux-kontext-pro', 'stability-ai/stable-diffusion-3.5-large', 'stability-ai/sdxl-turbo', 'recraft-ai/recraft-v3', 'ideogram-ai/ideogram-v2', 'bytedance/sdxl-lightning-4step']),
  imageSize: z.enum(['1024x1024 (1:1)', '1080 x 1920 (9:16)', '1200 x 630 (1.91:1)', '1920 x 1080 (16:9)', '896 x 1120 (4:5)']),
  imageStatus: z.enum(['Draft', 'Generating', 'Generated', 'Failed', 'Uploaded']).optional(),
  emailImages: z.string().optional(), // Position for email images
  image: z.string().url('Invalid image URL').optional(), // The uploaded/generated image URL
  useReferenceImage: z.boolean().optional(),
  referenceImage: z.any().optional(), // Allow any type for File objects
  referenceUrl: z.string().url('Invalid reference URL').optional().or(z.literal('')),
  useCaptions: z.boolean().optional(),
  captionText: z.string().max(200, 'Caption text must be less than 200 characters').optional(),
  captionFontStyle: z.enum(['Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana', 'Comic Sans MS', 'Impact', 'Roboto', 'Open Sans', 'Montserrat']).optional(),
  captionFontSize: z.enum(['Small (12px)', 'Medium (16px)', 'Large (20px)', 'Extra Large (24px)', 'XXL (32px)', 'XXXL (48px)']).optional(),
  captionPosition: z.enum(['bottom-center', 'bottom-left', 'bottom-right', 'top-center', 'top-left', 'top-right', 'center', 'lower-third', 'upper-third']).optional(),
  socialMediaContent: z.union([z.string(), z.number()]).optional().or(z.undefined())
})

// Type inference from schemas
export type SocialMediaContentFormInput = z.infer<typeof socialMediaContentFormSchema>
export type BrandAssetFormInput = z.infer<typeof brandAssetFormSchema>
export type ImageFormInput = z.infer<typeof imageFormSchema>

// Statistics and Analytics Types
export interface SocialMediaContentStats {
  total: number
  byPlatform: Record<string, number>
  byStatus: Record<string, number>
  byContentType: Record<string, number>
  averageCharacterCount: number
  mostUsedHashtags: string[]
}

export interface BrandAssetStats {
  total: number
  byPlatform: Record<string, number>
  byAssetType: Record<string, number>
  byStatus: Record<string, number>
  byPriority: Record<string, number>
}

export interface ContentIdeaStats {
  total: number
  byStatus: Record<string, number>
  byContentType: Record<string, number>
  byPriority: Record<string, number>
  averageGeneratedPosts: number
}

// Remove duplicate - using the more comprehensive filters below

// Utility Types
export type SocialMediaPlatform = 'Facebook' | 'Instagram' | 'X' | 'LinkedIn' | 'TikTok' | 'YouTube' | 'Other'
export type SocialMediaContentType = 'Post' | 'Story' | 'Reel' | 'Video' | 'Carousel' | 'Live' | 'Other'
export type BrandAssetType = 'Brand Voice' | 'Visual Asset' | 'Template' | 'Guidelines' | 'Logo' | 'Color Palette' | 'Font' | 'Other'
export type ContentStatus = 'Draft' | 'Ready for Review' | 'Approved' | 'Scheduled' | 'Published' | 'Archived'
export type AssetStatus = 'Active' | 'Inactive' | 'Draft' | 'Archived'
export type Priority = 'High' | 'Medium' | 'Low'

// Table Operation Types
export type TableOperation = 'create' | 'read' | 'update' | 'delete'
export type TableName = 'contentIdeas' | 'socialMediaContent' | 'brandAssets' | 'contentAssets' | 'publishingSchedule' | 'performanceAnalytics'

// Extended Client Configuration Types
export interface ExtendedClientConfig {
  id: string
  name: string
  baserow: {
    token: string
    databaseId: string
    tables: {
      contentIdeas: string
      socialMediaContent: string
      brandAssets: string
      contentAssets: string
      publishingSchedule: string
      performanceAnalytics: string
    }
  }
  branding: {
    primaryColor: string
    secondaryColor: string
    logo?: string
  }
  settings: {
    maxFileSize: number
    allowedFileTypes: string[]
    autoApproval: boolean
    enabledTables: TableName[]
    defaultFilters: {
      socialMediaContent?: SocialMediaContentFilters
      brandAssets?: BrandAssetFilters
    }
  }
  users: {
    email: string
    role: 'creator' | 'client' | 'admin'
    permissions: {
      tables: Record<TableName, TableOperation[]>
      canManageBrandAssets: boolean
      canApproveSocialContent: boolean
    }
  }[]
}

// Table Configuration Validation
export interface TableConfigValidation {
  tableName: TableName
  isConfigured: boolean
  isRequired: boolean
  tableId?: string
  errors: string[]
  warnings: string[]
}

// API Query Types
export interface PaginationParams {
  page?: number
  size?: number
  offset?: number
  limit?: number
}

export interface SortParams {
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface BaseApiParams extends PaginationParams, SortParams {
  search?: string
}

// Field Mapping Types
export interface FieldMapping {
  [fieldId: string]: string
}

export interface BaserowFieldMapping {
  [baserowFieldId: string]: keyof ContentIdea | keyof SocialMediaContent | keyof BrandAsset
}

export interface TableFieldMappings {
  contentIdeas: BaserowFieldMapping
  socialMediaContent: BaserowFieldMapping
  brandAssets: BaserowFieldMapping
}

// Validation Result Types
export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

export interface ValidationError {
  field: string
  message: string
  code?: string
}

// Bulk Operation Types
export interface BulkOperation<T> {
  operation: 'create' | 'update' | 'delete'
  data: T[]
}

export interface BulkOperationResult<T> {
  success: boolean
  results: {
    successful: T[]
    failed: Array<{
      data: T
      error: string
    }>
  }
  summary: {
    total: number
    successful: number
    failed: number
  }
}

// Enhanced Webhook Types for Multi-table Integration
export interface EnhancedN8nWebhookPayload extends N8nWebhookPayload {
  brandAssetContext?: {
    relevantAssets: BrandAsset[]
    platformAssets: BrandAssetsByPlatform[]
    assetPreferences: {
      preferredAssetTypes: string[]
      platformSpecificAssets: Record<string, string[]>
    }
  }
  generationContext?: {
    targetPlatforms: string[]
    contentVariations: number
    useExistingAssets: boolean
    generateNewAssets: boolean
  }
}

// Type Guards
export const isContentIdea = (obj: any): obj is ContentIdea => {
  return obj && typeof obj.id === 'string' && typeof obj.title === 'string'
}

export const isSocialMediaContent = (obj: any): obj is SocialMediaContent => {
  return obj && typeof obj.id === 'string' && typeof obj.post === 'string'
}

export const isBrandAsset = (obj: any): obj is BrandAsset => {
  return obj && typeof obj.id === 'string' && typeof obj.assetName === 'string'
}

// Utility Types for API Responses
export type ApiResponse<T> = 
  | { success: true; data: T; message?: string }
  | { success: false; error: string; details?: string; code?: string }

export type PaginatedApiResponse<T> = 
  | { 
      success: true; 
      data: T[]; 
      pagination: {
        total: number
        page: number
        size: number
        totalPages: number
      }
      message?: string 
    }
  | { success: false; error: string; details?: string; code?: string }

// Field Mapping Utilities
// (Using the definitions above)

// Export all table-specific types for easier imports
export type ContentIdeaApiResponse = ApiResponse<ContentIdea>
export type SocialMediaContentApiResponse = ApiResponse<SocialMediaContent>
export type BrandAssetApiResponse = ApiResponse<BrandAsset>

export type ContentIdeaListResponse = PaginatedApiResponse<ContentIdea>
export type SocialMediaContentListResponse = PaginatedApiResponse<SocialMediaContent>
export type BrandAssetListResponse = PaginatedApiResponse<BrandAsset>