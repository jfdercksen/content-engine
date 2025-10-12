import { SettingsManager } from '@/lib/config/settingsManager'

/**
 * Get webhook URL for a client
 * Checks client-specific settings first, then falls back to environment variables
 */
export async function getWebhookUrl(
  clientId: string, 
  webhookType: 'social_media_processor' | 'image_generator' | 'blog_processor' | 'email_processor' | 'uvp_creation'
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
    'uvp_creation': process.env.N8N_UVP_WEBHOOK_URL || process.env.WEBHOOK_UVP_CREATION
  }

  const webhookUrl = envMap[webhookType]
  
  if (webhookUrl) {
    console.log(`✅ Using ${webhookType} webhook from environment variables`)
    return webhookUrl
  }

  console.error(`❌ ${webhookType} webhook not configured in settings or environment`)
  return null
}

