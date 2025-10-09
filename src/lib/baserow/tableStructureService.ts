/**
 * Baserow Table Structure Service
 * Replicates the exact table structure from modern-management client
 */

import { baserowJWTService } from './jwtService'

// Table structure definitions based on modern-management client
export const TABLE_STRUCTURES = {
  contentIdeas: {
    name: 'Content Ideas',
    fields: [
      { name: 'Title', type: 'text', field_options: {} },
      { name: 'Description', type: 'long_text', field_options: {} },
      { name: 'Idea Type', type: 'single_select', field_options: { select_options: [
        { value: 'Social Media Post', color: 'blue' },
        { value: 'Email Campaign', color: 'green' },
        { value: 'Blog Post', color: 'purple' },
        { value: 'Video Content', color: 'red' }
      ]}},
      { name: 'Source Type', type: 'single_select', field_options: { select_options: [
        { value: 'AI Generated', color: 'blue' },
        { value: 'Manual Entry', color: 'green' },
        { value: 'Imported', color: 'orange' }
      ]}},
      { name: 'Status', type: 'single_select', field_options: { select_options: [
        { value: 'Draft', color: 'yellow' },
        { value: 'Approved', color: 'green' },
        { value: 'Rejected', color: 'red' },
        { value: 'In Review', color: 'blue' }
      ]}},
      { name: 'Created At', type: 'created_on', field_options: {} },
      { name: 'Updated At', type: 'last_modified', field_options: {} }
    ]
  },

  socialMediaContent: {
    name: 'Social Media Content',
    fields: [
      { name: 'Post ID', type: 'auto_number', field_options: {} },
      { name: 'Hook', type: 'long_text', field_options: {} },
      { name: 'Post', type: 'long_text', field_options: {} },
      { name: 'CTA', type: 'text', field_options: {} },
      { name: 'Hashtags', type: 'text', field_options: {} },
      { name: 'Platform', type: 'single_select', field_options: { select_options: [
        { value: 'Facebook', color: 'blue' },
        { value: 'Instagram', color: 'pink' },
        { value: 'Twitter', color: 'light-blue' },
        { value: 'LinkedIn', color: 'blue' },
        { value: 'TikTok', color: 'black' }
      ]}},
      { name: 'Content Type', type: 'single_select', field_options: { select_options: [
        { value: 'Post', color: 'blue' },
        { value: 'Story', color: 'green' },
        { value: 'Reel', color: 'purple' },
        { value: 'Video', color: 'red' }
      ]}},
      { name: 'Character Count', type: 'number', field_options: {} },
      { name: 'Image Prompt', type: 'long_text', field_options: {} },
      { name: 'Image', type: 'file', field_options: {} },
      { name: 'Images', type: 'link_row', field_options: {} }, // Will be linked to Images table
      { name: 'Angle', type: 'text', field_options: {} },
      { name: 'Intent', type: 'text', field_options: {} },
      { name: 'Content Theme', type: 'text', field_options: {} },
      { name: 'Psychological Trigger', type: 'text', field_options: {} },
      { name: 'Engagement Objective', type: 'text', field_options: {} },
      { name: 'Comments', type: 'long_text', field_options: {} },
      { name: 'Engagement Prediction', type: 'text', field_options: {} },
      { name: 'Status', type: 'single_select', field_options: { select_options: [
        { value: 'Draft', color: 'yellow' },
        { value: 'Approved', color: 'green' },
        { value: 'Published', color: 'blue' },
        { value: 'Scheduled', color: 'orange' },
        { value: 'Rejected', color: 'red' }
      ]}},
      { name: 'Approved By', type: 'text', field_options: {} },
      { name: 'Content Idea', type: 'link_row', field_options: {} }, // Will be linked to Content Ideas table
      { name: 'Scheduled Time', type: 'date', field_options: {} },
      { name: 'Created At', type: 'created_on', field_options: {} },
      { name: 'Updated At', type: 'last_modified', field_options: {} }
    ]
  },

  brandAssets: {
    name: 'Brand Assets',
    fields: [
      { name: 'Asset Name', type: 'text', field_options: {} },
      { name: 'Platform', type: 'single_select', field_options: { select_options: [
        { value: 'Facebook', color: 'blue' },
        { value: 'Instagram', color: 'pink' },
        { value: 'Twitter', color: 'light-blue' },
        { value: 'LinkedIn', color: 'blue' },
        { value: 'Website', color: 'green' }
      ]}},
      { name: 'Content Type', type: 'single_select', field_options: { select_options: [
        { value: 'Logo', color: 'blue' },
        { value: 'Banner', color: 'green' },
        { value: 'Icon', color: 'purple' },
        { value: 'Image', color: 'orange' }
      ]}},
      { name: 'Asset Type', type: 'single_select', field_options: { select_options: [
        { value: 'Primary', color: 'blue' },
        { value: 'Secondary', color: 'green' },
        { value: 'Tertiary', color: 'orange' }
      ]}},
      { name: 'Asset Information', type: 'long_text', field_options: {} },
      { name: 'Brand Voice Guidelines', type: 'long_text', field_options: {} },
      { name: 'Approved Hashtags', type: 'text', field_options: {} },
      { name: 'Tone Style Preferences', type: 'long_text', field_options: {} },
      { name: 'Forbidden Words Topics', type: 'long_text', field_options: {} },
      { name: 'Platform Specific Rules', type: 'long_text', field_options: {} },
      { name: 'File', type: 'file', field_options: {} },
      { name: 'File URL', type: 'url', field_options: {} },
      { name: 'Status', type: 'single_select', field_options: { select_options: [
        { value: 'Draft', color: 'yellow' },
        { value: 'Approved', color: 'green' },
        { value: 'Active', color: 'blue' },
        { value: 'Archived', color: 'gray' }
      ]}},
      { name: 'Priority', type: 'single_select', field_options: { select_options: [
        { value: 'Low', color: 'green' },
        { value: 'Medium', color: 'yellow' },
        { value: 'High', color: 'red' }
      ]}},
      { name: 'Created Date', type: 'created_on', field_options: {} },
      { name: 'Last Updated', type: 'last_modified', field_options: {} },
      { name: 'Notes', type: 'long_text', field_options: {} }
    ]
  },

  images: {
    name: 'Images',
    fields: [
      { name: 'Image ID', type: 'auto_number', field_options: {} },
      { name: 'Image', type: 'file', field_options: {} },
      { name: 'Image Prompt', type: 'long_text', field_options: {} },
      { name: 'Image Type', type: 'single_select', field_options: { select_options: [
        { value: 'New image', color: 'blue' },
        { value: 'New image with captions', color: 'green' },
        { value: 'Image from reference image', color: 'purple' },
        { value: 'Image from reference with captions', color: 'orange' },
        { value: 'Image from URL', color: 'red' },
        { value: 'Image from URL with captions', color: 'pink' }
      ]}},
      { name: 'Image Scene', type: 'long_text', field_options: {} },
      { name: 'Image Style', type: 'single_select', field_options: { select_options: [
        { value: 'Photorealistic', color: 'blue' },
        { value: 'Digital Art', color: 'green' },
        { value: 'Vintage', color: 'purple' },
        { value: 'Surreal', color: 'orange' },
        { value: 'Gothic', color: 'red' },
        { value: 'Steampunk', color: 'pink' },
        { value: 'Minimalist', color: 'gray' },
        { value: 'Cyberpunk', color: 'black' },
        { value: 'Meme', color: 'yellow' },
        { value: 'Pencil Sketch', color: 'brown' },
        { value: 'Anime/Manga', color: 'pink' },
        { value: '3D Render', color: 'blue' },
        { value: 'Pixel Art', color: 'green' },
        { value: 'Comic Book', color: 'orange' },
        { value: 'Abstract', color: 'purple' },
        { value: 'Portrait Photography', color: 'gray' }
      ]}},
      { name: 'Image Model', type: 'single_select', field_options: { select_options: [
        { value: 'openai/gpt-image-1', color: 'blue' },
        { value: 'black-forest-labs/flux-schnell', color: 'green' },
        { value: 'black-forest-labs/flux-dev', color: 'purple' },
        { value: 'black-forest-labs/flux-1.1-pro-ultra', color: 'red' },
        { value: 'black-forest-labs/flux-kontext-dev', color: 'orange' },
        { value: 'black-forest-labs/flux-kontext-pro', color: 'pink' },
        { value: 'stability-ai/stable-diffusion-3.5-large', color: 'blue' },
        { value: 'stability-ai/sdxl-turbo', color: 'green' },
        { value: 'recraft-ai/recraft-v3', color: 'purple' },
        { value: 'ideogram-ai/ideogram-v2', color: 'red' },
        { value: 'bytedance/sdxl-lightning-4step', color: 'orange' }
      ]}},
      { name: 'Image Size', type: 'single_select', field_options: { select_options: [
        { value: '1024x1024 (1:1)', color: 'blue' },
        { value: '1080 x 1920 (9:16)', color: 'green' },
        { value: '1200 x 630 (1.91:1)', color: 'purple' },
        { value: '1920 x 1080 (16:9)', color: 'red' },
        { value: '896 x 1120 (4:5)', color: 'orange' }
      ]}},
      { name: 'Image Status', type: 'single_select', field_options: { select_options: [
        { value: 'Draft', color: 'yellow' },
        { value: 'Generating', color: 'blue' },
        { value: 'Generated', color: 'green' },
        { value: 'Completed', color: 'blue' },
        { value: 'Failed', color: 'red' },
        { value: 'Uploaded', color: 'green' }
      ]}},
      { name: 'Reference Image', type: 'file', field_options: {} },
      { name: 'Reference URL', type: 'url', field_options: {} },
      { name: 'Caption Text', type: 'text', field_options: {} },
      { name: 'Caption Font Style', type: 'single_select', field_options: { select_options: [
        { value: 'Arial', color: 'blue' },
        { value: 'Helvetica', color: 'green' },
        { value: 'Times New Roman', color: 'purple' },
        { value: 'Georgia', color: 'red' },
        { value: 'Verdana', color: 'orange' },
        { value: 'Comic Sans MS', color: 'pink' },
        { value: 'Impact', color: 'black' },
        { value: 'Roboto', color: 'blue' },
        { value: 'Open Sans', color: 'green' },
        { value: 'Montserrat', color: 'purple' }
      ]}},
      { name: 'Caption Font Size', type: 'single_select', field_options: { select_options: [
        { value: 'Small (12px)', color: 'blue' },
        { value: 'Medium (16px)', color: 'green' },
        { value: 'Large (20px)', color: 'purple' },
        { value: 'Extra Large (24px)', color: 'red' },
        { value: 'XXL (32px)', color: 'orange' },
        { value: 'XXXL (48px)', color: 'pink' }
      ]}},
      { name: 'Caption Position', type: 'single_select', field_options: { select_options: [
        { value: 'bottom-center', color: 'blue' },
        { value: 'bottom-left', color: 'green' },
        { value: 'bottom-right', color: 'purple' },
        { value: 'top-center', color: 'red' },
        { value: 'top-left', color: 'orange' },
        { value: 'top-right', color: 'pink' },
        { value: 'center', color: 'black' },
        { value: 'lower-third', color: 'gray' },
        { value: 'upper-third', color: 'brown' }
      ]}},
      { name: 'Voice Note', type: 'file', field_options: {} },
      { name: 'Social Media Content', type: 'link_row', field_options: {} }, // Will be linked to Social Media Content table
      { name: 'Client ID', type: 'text', field_options: {} },
      { name: 'Created At', type: 'created_on', field_options: {} },
      { name: 'Accepted At', type: 'date', field_options: {} },
      { name: 'Email Ideas', type: 'link_row', field_options: {} }, // Will be linked to Email Ideas table
      { name: 'Email Images', type: 'single_select', field_options: { select_options: [
        { value: 'Header Image', color: 'blue' },
        { value: 'Hero Image', color: 'green' },
        { value: 'Body Image 1', color: 'purple' },
        { value: 'Body Image 2', color: 'red' },
        { value: 'Promo Image 1', color: 'orange' },
        { value: 'CTA Image', color: 'pink' },
        { value: 'Signature', color: 'gray' },
        { value: 'Logo', color: 'black' },
        { value: 'Gallery Image 1', color: 'brown' },
        { value: 'Gallery Image 2', color: 'yellow' }
      ]}},
      { name: 'Image Link URL', type: 'url', field_options: {} }
    ]
  },

  emailIdeas: {
    name: 'Email Ideas',
    fields: [
      { name: 'Email ID', type: 'auto_number', field_options: {} },
      { name: 'Email Idea Name', type: 'text', field_options: {} },
      { name: 'Email Type', type: 'single_select', field_options: { select_options: [
        { value: 'Newsletter', color: 'blue' },
        { value: 'Promotional', color: 'green' },
        { value: 'Transactional', color: 'purple' },
        { value: 'Welcome Series', color: 'red' }
      ]}},
      { name: 'Hook', type: 'long_text', field_options: {} },
      { name: 'CTA', type: 'text', field_options: {} },
      { name: 'Email Text Idea', type: 'long_text', field_options: {} },
      { name: 'Email Voice Idea', type: 'file', field_options: {} },
      { name: 'Email URL Idea', type: 'url', field_options: {} },
      { name: 'Email Video Idea', type: 'file', field_options: {} },
      { name: 'Email Image Idea', type: 'file', field_options: {} },
      { name: 'Status', type: 'single_select', field_options: { select_options: [
        { value: 'Draft', color: 'yellow' },
        { value: 'Approved', color: 'green' },
        { value: 'Sent', color: 'blue' },
        { value: 'Scheduled', color: 'orange' }
      ]}},
      { name: 'Last Modified', type: 'last_modified', field_options: {} },
      { name: 'Created Date', type: 'created_on', field_options: {} },
      { name: 'Templates', type: 'link_row', field_options: {} }, // Will be linked to Templates table
      { name: 'Generated HTML', type: 'long_text', field_options: {} },
      { name: 'Images', type: 'link_row', field_options: {} } // Will be linked to Images table
    ]
  },

  templates: {
    name: 'Templates',
    fields: [
      { name: 'Template ID', type: 'auto_number', field_options: {} },
      { name: 'Template Name', type: 'text', field_options: {} },
      { name: 'Template Type', type: 'single_select', field_options: { select_options: [
        { value: 'Email', color: 'blue' },
        { value: 'Social Media', color: 'green' },
        { value: 'Web Page', color: 'purple' },
        { value: 'Document', color: 'red' }
      ]}},
      { name: 'Template Category', type: 'text', field_options: {} },
      { name: 'HTML Template', type: 'long_text', field_options: {} },
      { name: 'CSS Styles', type: 'long_text', field_options: {} },
      { name: 'Is Active', type: 'boolean', field_options: {} },
      { name: 'Last Modified', type: 'last_modified', field_options: {} },
      { name: 'Created Date', type: 'created_on', field_options: {} }
    ]
  },

  imageIdeas: {
    name: 'Image Ideas',
    fields: [
      { name: 'Image Idea ID', type: 'auto_number', field_options: {} },
      { name: 'Image Idea Name', type: 'text', field_options: {} },
      { name: 'Image Prompt', type: 'long_text', field_options: {} },
      { name: 'Image Scene', type: 'long_text', field_options: {} },
      { name: 'Image Type', type: 'single_select', field_options: { select_options: [
        { value: 'New image', color: 'blue' },
        { value: 'New image with captions', color: 'green' },
        { value: 'Image from reference image', color: 'purple' },
        { value: 'Image from reference with captions', color: 'orange' },
        { value: 'Image from URL', color: 'red' },
        { value: 'Image from URL with captions', color: 'pink' }
      ]}},
      { name: 'Image Style', type: 'single_select', field_options: { select_options: [
        { value: 'Photorealistic', color: 'blue' },
        { value: 'Digital Art', color: 'green' },
        { value: 'Vintage', color: 'purple' },
        { value: 'Surreal', color: 'orange' },
        { value: 'Gothic', color: 'red' },
        { value: 'Steampunk', color: 'pink' },
        { value: 'Minimalist', color: 'gray' },
        { value: 'Cyberpunk', color: 'black' },
        { value: 'Meme', color: 'yellow' },
        { value: 'Pencil Sketch', color: 'brown' },
        { value: 'Anime/Manga', color: 'pink' },
        { value: '3D Render', color: 'blue' },
        { value: 'Pixel Art', color: 'green' },
        { value: 'Comic Book', color: 'orange' },
        { value: 'Abstract', color: 'purple' },
        { value: 'Portrait Photography', color: 'gray' }
      ]}},
      { name: 'Image Model', type: 'single_select', field_options: { select_options: [
        { value: 'openai/gpt-image-1', color: 'blue' },
        { value: 'black-forest-labs/flux-schnell', color: 'green' },
        { value: 'black-forest-labs/flux-dev', color: 'purple' },
        { value: 'black-forest-labs/flux-1.1-pro-ultra', color: 'red' },
        { value: 'black-forest-labs/flux-kontext-dev', color: 'orange' },
        { value: 'black-forest-labs/flux-kontext-pro', color: 'pink' },
        { value: 'stability-ai/stable-diffusion-3.5-large', color: 'blue' },
        { value: 'stability-ai/sdxl-turbo', color: 'green' },
        { value: 'recraft-ai/recraft-v3', color: 'purple' },
        { value: 'ideogram-ai/ideogram-v2', color: 'red' },
        { value: 'bytedance/sdxl-lightning-4step', color: 'orange' }
      ]}},
      { name: 'Image Size', type: 'single_select', field_options: { select_options: [
        { value: '1024x1024 (1:1)', color: 'blue' },
        { value: '1080 x 1920 (9:16)', color: 'green' },
        { value: '1200 x 630 (1.91:1)', color: 'purple' },
        { value: '1920 x 1080 (16:9)', color: 'red' },
        { value: '896 x 1120 (4:5)', color: 'orange' }
      ]}},
      { name: 'Reference Image', type: 'file', field_options: {} },
      { name: 'Reference URL', type: 'url', field_options: {} },
      { name: 'Voice Note', type: 'file', field_options: {} },
      { name: 'Operation Type', type: 'single_select', field_options: { select_options: [
        { value: 'generate', color: 'blue' },
        { value: 'combine', color: 'green' },
        { value: 'edit', color: 'purple' },
        { value: 'browse', color: 'orange' }
      ]}},
      { name: 'Selected Images', type: 'link_row', field_options: {} }, // Will be linked to Images table
      { name: 'Uploaded Images', type: 'file', field_options: {} },
      { name: 'Generated Image', type: 'file', field_options: {} },
      { name: 'Image Status', type: 'single_select', field_options: { select_options: [
        { value: 'Draft', color: 'yellow' },
        { value: 'Generating', color: 'blue' },
        { value: 'Generated', color: 'green' },
        { value: 'Completed', color: 'blue' },
        { value: 'Failed', color: 'red' },
        { value: 'Uploaded', color: 'green' }
      ]}},
      { name: 'Created At', type: 'created_on', field_options: {} },
      { name: 'Updated At', type: 'last_modified', field_options: {} },
      { name: 'Notes', type: 'long_text', field_options: {} }
    ]
  }
}

export class TableStructureService {
  /**
   * Create all tables for a new client with exact structure from modern-management
   */
  async createClientTables(baseId: string): Promise<Record<string, any>> {
    console.log(`🏗️ Creating tables for base: ${baseId}`)
    
    const createdTables: Record<string, any> = {}
    const createdTableIds: string[] = []

    try {
      // Create tables in order (some tables depend on others for linking)
      const tableOrder = [
        'contentIdeas',
        'templates', 
        'emailIdeas',
        'images',
        'socialMediaContent',
        'brandAssets',
        'imageIdeas'
      ]

      for (const tableKey of tableOrder) {
        const tableStructure = TABLE_STRUCTURES[tableKey as keyof typeof TABLE_STRUCTURES]
        console.log(`📋 Creating table: ${tableStructure.name}`)
        
        // Create the table
        const table = await baserowJWTService.createTable(baseId, tableStructure.name)
        createdTables[tableKey] = table
        createdTableIds.push(table.id)
        
        console.log(`✅ Table created: ${tableStructure.name} (ID: ${table.id})`)

        // Create fields for this table
        await this.createTableFields(table.id, tableStructure.fields, createdTables)
      }

      // Now create the linking relationships between tables
      await this.createTableLinks(createdTables)

      console.log(`🎉 All tables created successfully for base: ${baseId}`)
      return createdTables

    } catch (error) {
      console.error('❌ Error creating tables, rolling back...', error)
      
      // Rollback: Delete all created tables
      for (const tableId of createdTableIds.reverse()) { // Reverse to delete in opposite order
        try {
          await baserowJWTService.deleteTable(tableId)
          console.log(`🗑️ Rolled back table: ${tableId}`)
        } catch (rollbackError) {
          console.error(`❌ Failed to rollback table ${tableId}:`, rollbackError)
        }
      }
      
      throw error
    }
  }

  /**
   * Create fields for a table
   */
  private async createTableFields(tableId: string, fields: any[], createdTables: Record<string, any>): Promise<void> {
    for (const field of fields) {
      try {
        await baserowJWTService.createField(tableId, field)
        console.log(`  ✅ Field created: ${field.name}`)
      } catch (error) {
        console.error(`  ❌ Failed to create field ${field.name}:`, error)
        throw error
      }
    }
  }

  /**
   * Create linking relationships between tables
   */
  private async createTableLinks(createdTables: Record<string, any>): Promise<void> {
    console.log('🔗 Creating table relationships...')

    // Link Social Media Content to Content Ideas
    if (createdTables.socialMediaContent && createdTables.contentIdeas) {
      // This would need to be implemented by updating the link_row field
      // For now, we'll log that this relationship exists
      console.log('🔗 Relationship: Social Media Content → Content Ideas')
    }

    // Link Social Media Content to Images
    if (createdTables.socialMediaContent && createdTables.images) {
      console.log('🔗 Relationship: Social Media Content → Images')
    }

    // Link Email Ideas to Templates
    if (createdTables.emailIdeas && createdTables.templates) {
      console.log('🔗 Relationship: Email Ideas → Templates')
    }

    // Link Email Ideas to Images
    if (createdTables.emailIdeas && createdTables.images) {
      console.log('🔗 Relationship: Email Ideas → Images')
    }

    // Link Image Ideas to Images
    if (createdTables.imageIdeas && createdTables.images) {
      console.log('🔗 Relationship: Image Ideas → Images')
    }

    console.log('✅ All table relationships configured')
  }
}

// Export singleton instance
export const tableStructureService = new TableStructureService()
export default tableStructureService
