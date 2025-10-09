import { DynamicClientConfig } from '@/lib/config/dynamicClients'

interface ClientConfigForAPI {
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
      images: string
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
  users: Array<{
    email: string
    role: string
  }>
}

export async function getClientConfigForAPI(clientId: string): Promise<ClientConfigForAPI | null> {
  try {
    // Initialize and get client config from new system
    await DynamicClientConfig.initialize()
    const clientConfig = DynamicClientConfig.getClientConfig(clientId)
    
    if (!clientConfig) {
      console.log(`Client config not found for: ${clientId}`)
      return null
    }

    // Transform to the format expected by existing Baserow APIs
    const transformedConfig: ClientConfigForAPI = {
      id: clientConfig.id,
      name: clientConfig.displayName, // Use displayName as name
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
