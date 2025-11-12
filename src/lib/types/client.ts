export interface ClientConfiguration {
  id: string
  name: string
  displayName: string
  baserowWorkspaceId?: number
  baserowDatabaseId: string
  baserowToken: string
  tables: {
    contentIdeas: string
    socialMediaContent: string
    images: string
    videos: string
    brandAssets: string
    emailIdeas: string
    templates: string
  }
  fieldMappings: Record<string, string>
  branding?: {
    primaryColor?: string
    secondaryColor?: string
    description?: string
    websiteUrl?: string
    contactEmail?: string
    targetAudience?: string
    brandVoice?: string
    contentGuidelines?: string
  }
  isActive: boolean
  finalizationStatus?: 'pending' | 'in_progress' | 'complete' | 'failed'
  createdAt: Date
  updatedAt: Date
}

export interface TableTemplate {
  name: string
  fields: FieldTemplate[]
  relationships?: RelationshipTemplate[]
}

export interface FieldTemplate {
  name: string
  type: 'text' | 'long_text' | 'number' | 'select' | 'link_row' | 'file' | 'date' | 'boolean'
  options?: string[]
  linkedTable?: string
  required?: boolean
}

export interface RelationshipTemplate {
  fromTable: string
  toTable: string
  fromField: string
  toField: string
}

// Standard table templates for all clients
export const STANDARD_TABLE_TEMPLATES: Record<string, TableTemplate> = {
  contentIdeas: {
    name: 'Content Ideas',
    fields: [
      { name: 'Title', type: 'text', required: true },
      { name: 'Description', type: 'long_text' },
      { name: 'Idea Type', type: 'select', options: ['Social Media', 'Email', 'Blog', 'Video'] },
      { name: 'Source Type', type: 'select', options: ['Manual', 'AI Generated', 'Scraped'] },
      { name: 'Status', type: 'select', options: ['Draft', 'Approved', 'In Review', 'Published'] },
      { name: 'Created At', type: 'date' },
      { name: 'Updated At', type: 'date' }
    ]
  },
  socialMediaContent: {
    name: 'Social Media Content',
    fields: [
      { name: 'Post', type: 'long_text', required: true },
      { name: 'Platform', type: 'select', options: ['Facebook', 'Instagram', 'Twitter', 'LinkedIn', 'TikTok'] },
      { name: 'Content Type', type: 'select', options: ['Text', 'Image', 'Video', 'Carousel'] },
      { name: 'Character Count', type: 'number' },
      { name: 'Images', type: 'link_row', linkedTable: 'images' },
      { name: 'Content Idea', type: 'link_row', linkedTable: 'contentIdeas' },
      { name: 'Status', type: 'select', options: ['Draft', 'Approved', 'Published', 'Scheduled'] },
      { name: 'Scheduled Time', type: 'date' },
      { name: 'Created At', type: 'date' }
    ]
  },
  images: {
    name: 'Images',
    fields: [
      { name: 'Image', type: 'file' },
      { name: 'Image Prompt', type: 'text' },
      { name: 'Image Type', type: 'select', options: ['Generated', 'Uploaded', 'Stock'] },
      { name: 'Image Scene', type: 'text' },
      { name: 'Image Style', type: 'select', options: ['Photorealistic', 'Cartoon', 'Abstract', 'Minimalist'] },
      { name: 'Image Status', type: 'select', options: ['Generating', 'Completed', 'Failed', 'Approved'] },
      { name: 'Created At', type: 'date' }
    ]
  },
  brandAssets: {
    name: 'Brand Assets',
    fields: [
      { name: 'Asset Type', type: 'select', options: ['Logo', 'Image', 'Video', 'Document'] },
      { name: 'Asset File', type: 'file' },
      { name: 'Platform', type: 'select', options: ['Facebook', 'Instagram', 'Twitter', 'LinkedIn', 'General'] },
      { name: 'Status', type: 'select', options: ['Active', 'Inactive', 'Archived'] },
      { name: 'Created At', type: 'date' }
    ]
  },
  emailIdeas: {
    name: 'Email Ideas',
    fields: [
      { name: 'Subject', type: 'text', required: true },
      { name: 'Content', type: 'long_text', required: true },
      { name: 'Email Type', type: 'select', options: ['Newsletter', 'Promotional', 'Transactional', 'Welcome'] },
      { name: 'Status', type: 'select', options: ['Draft', 'Approved', 'Sent', 'Scheduled'] },
      { name: 'Created At', type: 'date' }
    ]
  },
  templates: {
    name: 'Templates',
    fields: [
      { name: 'Template Name', type: 'text', required: true },
      { name: 'Template Type', type: 'select', options: ['Social Media', 'Email', 'Document'] },
      { name: 'Content', type: 'long_text' },
      { name: 'Variables', type: 'long_text' },
      { name: 'Status', type: 'select', options: ['Active', 'Inactive'] },
      { name: 'Created At', type: 'date' }
    ]
  }
}

// Standard field mappings (Baserow field IDs will be generated dynamically)
export const STANDARD_FIELD_MAPPINGS = {
  contentIdeas: {
    title: 'field_title',
    description: 'field_description',
    ideaType: 'field_idea_type',
    sourceType: 'field_source_type',
    status: 'field_status',
    createdAt: 'field_created_at',
    updatedAt: 'field_updated_at'
  },
  socialMediaContent: {
    post: 'field_post',
    platform: 'field_platform',
    contentType: 'field_content_type',
    characterCount: 'field_character_count',
    images: 'field_images',
    contentIdea: 'field_content_idea',
    status: 'field_status',
    scheduledTime: 'field_scheduled_time',
    createdAt: 'field_created_at'
  },
  images: {
    image: 'field_image',
    imagePrompt: 'field_image_prompt',
    imageType: 'field_image_type',
    imageScene: 'field_image_scene',
    imageStyle: 'field_image_style',
    imageStatus: 'field_image_status',
    createdAt: 'field_created_at'
  }
  // ... other mappings
}
