import { SettingsManager } from '@/lib/config/settingsManager'

/**
 * Get webhook URL for a client
 * Checks client-specific settings first, then falls back to environment variables
 */
export async function getWebhookUrl(
  clientId: string, 
  webhookType: 'social_media_processor' | 'image_generator' | 'blog_processor' | 'email_processor' | 'uvp_creation' | 'wordpress_publisher'
): Promise<string | null> {
  
  // Try to get from client-specific settings (table 1061) first
  try {
    const settings = await SettingsManager.getSettings(clientId)
    if (settings.webhooks?.[webhookType]) {
      console.log(`✅ Using client-specific ${webhookType} webhook from settings`)
      return settings.webhooks[webhookType]
    }
  } catch (settingsError) {
    console.log(`⚠️ Could not fetch client settings for ${webhookType}, trying environment variables`)
  }

  // Fallback to environment variables
  const envMap: Record<string, string | undefined> = {
    'social_media_processor': process.env.N8N_CONTENT_IDEA_WEBHOOK_URL || process.env.WEBHOOK_SOCIAL_MEDIA_PROCESSOR,
    'image_generator': process.env.N8N_IMAGE_IDEA_WEBHOOK_URL || process.env.WEBHOOK_IMAGE_GENERATOR,
    'blog_processor': process.env.N8N_BLOG_WORKFLOW_WEBHOOK_URL || process.env.WEBHOOK_BLOG_PROCESSOR,
    'email_processor': process.env.N8N_EMAIL_IDEA_WEBHOOK_URL || process.env.WEBHOOK_EMAIL_PROCESSOR,
    'uvp_creation': process.env.N8N_UVP_WEBHOOK_URL || process.env.WEBHOOK_UVP_CREATION,
    'wordpress_publisher': process.env.WEBHOOK_WORDPRESS_PUBLISHER
  }

  let webhookUrl = envMap[webhookType]
  
  // Final fallback to hardcoded default URLs (system-wide)
  if (!webhookUrl) {
    const defaults: Record<string, string> = {
      'social_media_processor': 'https://n8n.aiautomata.co.za/webhook/social-media-processor',
      'image_generator': 'https://n8n.aiautomata.co.za/webhook/image-generator-webhook',
      'blog_processor': 'https://n8n.aiautomata.co.za/webhook/blog-creation-mvp',
      'email_processor': 'https://n8n.aiautomata.co.za/webhook/email-processor',
      'uvp_creation': 'https://n8n.aiautomata.co.za/webhook/uvp_creation',
      'wordpress_publisher': 'https://n8n.aiautomata.co.za/webhook/blog_post'
    }
    webhookUrl = defaults[webhookType]
    console.log(`✅ Using default ${webhookType} webhook (hardcoded fallback)`)
  } else {
    console.log(`✅ Using ${webhookType} webhook from environment variables`)
  }
  
  return webhookUrl
}

