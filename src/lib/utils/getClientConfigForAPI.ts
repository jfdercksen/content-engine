import { DynamicClientConfig } from '@/lib/config/dynamicClients'
import { DatabaseClientConfig } from '@/lib/config/databaseClientConfig'
import { SettingsManager } from '@/lib/config/settingsManager'

interface ClientConfigForAPI {
  id: string
  name: string
  client: {
    id: string
    name: string
  }
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
      images: string
      videos: string
      emailIdeas: string
      templates: string
      blogPosts: string
      blogRequests: string
      keywordResearch: string
      productUvps: string
    }
  }
  fieldMappings: Record<string, Record<string, number>>
  branding: {
    primaryColor: string
    secondaryColor: string
    logo?: string
  }
  settings: {
    maxFileSize: number
    allowedFileTypes: string[]
    autoApproval: boolean
  }
  mailchimp?: {
    apiKey?: string
    serverUrl?: string
    serverPrefix?: string
    defaultAudienceId?: string
    defaultFromName?: string
    defaultFromEmail?: string
    defaultReplyToEmail?: string
  }
  users: Array<{
    email: string
    role: string
  }>
}

export async function getClientConfigForAPI(clientId: string): Promise<ClientConfigForAPI | null> {
  try {
    // Try to get client config from database first (production)
    let clientConfig = await DatabaseClientConfig.getClient(clientId)
    
    // Fallback to file-based config (development)
    if (!clientConfig) {
      console.log(`Client not in database, trying file-based config for: ${clientId}`)
      await DynamicClientConfig.initialize()
      clientConfig = DynamicClientConfig.getClientConfig(clientId)
    }
    
    if (!clientConfig) {
      console.log(`Client config not found for: ${clientId}`)
      return null
    }

    // Fetch Mailchimp settings from SettingsManager
    let mailchimpSettings: any = {}
    try {
      const settings = await SettingsManager.getSettings(clientId)
      const mailchimpCategory = settings.mailchimp || settings.integrations?.mailchimp || {}
      
      mailchimpSettings = {
        apiKey: mailchimpCategory.api_key || mailchimpCategory.apiKey || null,
        serverUrl: mailchimpCategory.server_url || mailchimpCategory.serverUrl || null,
        serverPrefix: mailchimpCategory.server_prefix || mailchimpCategory.serverPrefix || null,
        defaultAudienceId: mailchimpCategory.default_audience_id || mailchimpCategory.defaultAudienceId || null,
        defaultFromName: mailchimpCategory.default_from_name || mailchimpCategory.defaultFromName || null,
        defaultFromEmail: mailchimpCategory.default_from_email || mailchimpCategory.defaultFromEmail || null,
        defaultReplyToEmail: mailchimpCategory.default_reply_to_email || mailchimpCategory.defaultReplyToEmail || null
      }
      
      // Extract server prefix from API key if not provided (format: key-us1, key-us2, etc.)
      if (mailchimpSettings.apiKey && !mailchimpSettings.serverPrefix) {
        const prefixMatch = mailchimpSettings.apiKey.match(/-([a-z0-9]+)$/)
        if (prefixMatch) {
          mailchimpSettings.serverPrefix = prefixMatch[1]
        }
      }
      
      // Build server URL from prefix if not provided
      if (mailchimpSettings.serverPrefix && !mailchimpSettings.serverUrl) {
        mailchimpSettings.serverUrl = `https://${mailchimpSettings.serverPrefix}.api.mailchimp.com/3.0`
      }
      
      console.log(`Mailchimp settings loaded for ${clientId}:`, {
        hasApiKey: !!mailchimpSettings.apiKey,
        hasServerUrl: !!mailchimpSettings.serverUrl,
        hasDefaultAudience: !!mailchimpSettings.defaultAudienceId
      })
    } catch (error) {
      console.warn(`Could not load Mailchimp settings for ${clientId}:`, error)
      // Continue without Mailchimp settings
    }

    // Transform to the format expected by existing Baserow APIs
    const transformedConfig: ClientConfigForAPI = {
      id: clientConfig.id,
      name: clientConfig.displayName, // Use displayName as name
      client: {
        id: clientConfig.id,
        name: clientConfig.displayName
      },
      baserow: {
        token: clientConfig.baserowToken,
        databaseId: clientConfig.baserowDatabaseId,
        tables: {
          contentIdeas: clientConfig.tables.contentIdeas || '',
          socialMediaContent: clientConfig.tables.socialMediaContent || '',
          brandAssets: clientConfig.tables.brandAssets || '',
          contentAssets: '',
          publishingSchedule: '',
          performanceAnalytics: '',
          images: clientConfig.tables.images || '',
          videos: clientConfig.tables.videos || '',
          emailIdeas: clientConfig.tables.emailIdeas || '',
          templates: clientConfig.tables.templates || '',
          blogPosts: clientConfig.tables.blogPosts || '',
          blogRequests: clientConfig.tables.blogRequests || '',
          keywordResearch: clientConfig.tables.keywordResearch || '',
          productUvps: clientConfig.tables.productUvps || ''
      }
    },
    fieldMappings: clientConfig.fieldMappings || {},
    branding: {
      primaryColor: '#3B82F6', // Default blue
      secondaryColor: '#10B981', // Default green
      logo: undefined
    },
      settings: {
        maxFileSize: 10,
        allowedFileTypes: ['image/*', 'video/*', 'audio/*'],
        autoApproval: false
      },
      mailchimp: Object.keys(mailchimpSettings).length > 0 ? mailchimpSettings : undefined,
      users: [
        { email: 'admin@example.com', role: 'admin' }
      ]
    }

    console.log(`Client config found for: ${clientId}`)
    return transformedConfig

  } catch (error) {
    console.error(`Error getting client config for ${clientId}:`, error)
    return null
  }
}
