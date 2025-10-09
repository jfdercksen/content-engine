export interface ClientConfig {
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
        imageIdeas: string
      }
    }
    branding: {
      primaryColor: string
      secondaryColor: string
      logo?: string
    }
    settings: {
      maxFileSize: number // in MB
      allowedFileTypes: string[]
      autoApproval: boolean
      enabledTables?: ('contentIdeas' | 'socialMediaContent' | 'brandAssets' | 'contentAssets' | 'publishingSchedule' | 'performanceAnalytics')[]
      defaultFilters?: {
        socialMediaContent?: {
          platform?: string
          status?: string
          contentType?: string
        }
        brandAssets?: {
          platform?: string
          assetType?: string
          status?: string
          priority?: string
        }
      }
    }
    users: {
      email: string
      role: 'creator' | 'client' | 'admin'
      permissions?: {
        tables?: Record<string, ('create' | 'read' | 'update' | 'delete')[]>
        canManageBrandAssets?: boolean
        canApproveSocialContent?: boolean
      }
    }[]
  }

// Type for table configuration validation
export interface TableConfig {
  id: string
  name: string
  required: boolean
}

// Available table configurations
export const AVAILABLE_TABLES: Record<string, TableConfig> = {
  contentIdeas: { id: 'contentIdeas', name: 'Content Ideas', required: true },
  socialMediaContent: { id: 'socialMediaContent', name: 'Social Media Content', required: true },
  brandAssets: { id: 'brandAssets', name: 'Brand Assets', required: true },
  contentAssets: { id: 'contentAssets', name: 'Content Assets', required: false },
  publishingSchedule: { id: 'publishingSchedule', name: 'Publishing Schedule', required: false },
  performanceAnalytics: { id: 'performanceAnalytics', name: 'Performance Analytics', required: false },
  images: { id: 'images', name: 'Images', required: false },
  emailIdeas: { id: 'emailIdeas', name: 'Email Ideas', required: false },
  templates: { id: 'templates', name: 'Templates', required: false },
  imageIdeas: { id: 'imageIdeas', name: 'Image Ideas', required: false }
} as const

// User role type
export type UserRole = 'creator' | 'client' | 'admin'

// Client validation result
export interface ClientConfigValidation {
  isValid: boolean
  errors: string[]
  warnings: string[]
}
  
  

export const clientConfigs: Record<string, ClientConfig> = {
    'modern-management': {
      id: 'modern-management',
      name: 'Modern Management',
      baserow: {
        token: process.env.BASEROW_MODERN_MANAGEMENT_TOKEN || 'SXe0k6Btm7i28uZP5mp8hr5KPBoWsiE1',
        databaseId: process.env.BASEROW_MODERN_MANAGEMENT_DATABASE_ID || '176',
        tables: {
          contentIdeas: process.env.BASEROW_MODERN_MANAGEMENT_CONTENT_IDEAS_TABLE || '721',
          socialMediaContent: process.env.BASEROW_MODERN_MANAGEMENT_SOCIAL_MEDIA_CONTENT_TABLE || '712',
          brandAssets: process.env.BASEROW_MODERN_MANAGEMENT_BRAND_ASSETS_TABLE || '728',
          contentAssets: process.env.BASEROW_MODERN_MANAGEMENT_CONTENT_ASSETS_TABLE || '',
          publishingSchedule: process.env.BASEROW_MODERN_MANAGEMENT_PUBLISHING_SCHEDULE_TABLE || '',
          performanceAnalytics: process.env.BASEROW_MODERN_MANAGEMENT_ANALYTICS_TABLE || '',
          images: process.env.BASEROW_MODERN_MANAGEMENT_IMAGES_TABLE || '729',
          emailIdeas: process.env.BASEROW_MODERN_MANAGEMENT_EMAIL_IDEAS_TABLE || '730',
          templates: process.env.BASEROW_MODERN_MANAGEMENT_TEMPLATES_TABLE || '731',
          imageIdeas: process.env.BASEROW_MODERN_MANAGEMENT_IMAGE_IDEAS_TABLE || '732'
        }
      },
      branding: {
        primaryColor: process.env.MODERN_MANAGEMENT_PRIMARY_COLOR || '#3B82F6',
        secondaryColor: process.env.MODERN_MANAGEMENT_SECONDARY_COLOR || '#10B981'
      },
      settings: {
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '50'),
        allowedFileTypes: (process.env.ALLOWED_FILE_TYPES || 'image/*,video/*,audio/*').split(','),
        autoApproval: false
      },
      users: [
        { email: 'admin@modernmanagement.com', role: 'admin' },
        { email: 'content@modernmanagement.com', role: 'creator' }
      ]
    }
  }
  
  export const getClientConfig = (clientId: string): ClientConfig | null => {
    // First check hardcoded clients
    if (clientConfigs[clientId]) {
      return clientConfigs[clientId]
    }
    
    // Then check dynamic clients (synchronously for now)
    // This is a temporary solution - ideally we'd make this async
    try {
      // Import the dynamic client config
      const { DynamicClientConfig } = require('./dynamicClients')
      
      // Initialize the dynamic client config if not already done
      if (!DynamicClientConfig.isInitialized) {
        DynamicClientConfig.initialize()
      }
      
      // Get the client config from dynamic system
      const dynamicConfig = DynamicClientConfig.getClientConfig(clientId)
      
      if (dynamicConfig) {
        // Transform to the expected format
        return {
          id: dynamicConfig.id,
          name: dynamicConfig.displayName,
          baserow: {
            token: dynamicConfig.baserowToken,
            databaseId: dynamicConfig.baserowDatabaseId,
            tables: {
              contentIdeas: dynamicConfig.tables.contentIdeas || '',
              socialMediaContent: dynamicConfig.tables.socialMediaContent || '',
              brandAssets: dynamicConfig.tables.brandAssets || '',
              contentAssets: '',
              publishingSchedule: '',
              performanceAnalytics: '',
              images: dynamicConfig.tables.images || '',
              emailIdeas: dynamicConfig.tables.emailIdeas || '',
              templates: dynamicConfig.tables.templates || '',
              imageIdeas: dynamicConfig.tables.imageIdeas || ''
            }
          },
          branding: {
            primaryColor: '#3B82F6',
            secondaryColor: '#10B981'
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
      }
    } catch (error) {
      console.error('Error getting dynamic client config:', error)
    }
    
    return null
  }
  
  export const getAllClients = (): ClientConfig[] => {
    return Object.values(clientConfigs)
  }

  // Validate client configuration
  export const validateClientConfig = (config: ClientConfig): ClientConfigValidation => {
    const errors: string[] = []
    const warnings: string[] = []

    // Check required fields
    if (!config.id) errors.push('Client ID is required')
    if (!config.name) errors.push('Client name is required')
    if (!config.baserow.token) errors.push('Baserow token is required')
    if (!config.baserow.databaseId) errors.push('Baserow database ID is required')

    // Check required tables
    Object.entries(AVAILABLE_TABLES).forEach(([key, tableConfig]) => {
      const tableId = config.baserow.tables[key as keyof typeof config.baserow.tables]
      if (tableConfig.required && !tableId) {
        errors.push(`${tableConfig.name} table ID is required`)
      }
      if (!tableConfig.required && !tableId) {
        warnings.push(`${tableConfig.name} table ID is not configured`)
      }
    })

    // Check branding
    if (!config.branding.primaryColor) warnings.push('Primary color not configured')
    if (!config.branding.secondaryColor) warnings.push('Secondary color not configured')

    // Check settings
    if (config.settings.maxFileSize <= 0) errors.push('Max file size must be greater than 0')
    if (config.settings.allowedFileTypes.length === 0) warnings.push('No allowed file types configured')

    // Check users
    if (config.users.length === 0) warnings.push('No users configured')

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  // Get table ID by name
  export const getTableId = (clientId: string, tableName: keyof ClientConfig['baserow']['tables']): string | null => {
    const config = getClientConfig(clientId)
    return config?.baserow.tables[tableName] || null
  }

  // Get table configuration with validation
  export const getTableConfig = (clientId: string, tableName: keyof ClientConfig['baserow']['tables']) => {
    const config = getClientConfig(clientId)
    const tableConfig = AVAILABLE_TABLES[tableName]
    const tableId = config?.baserow.tables[tableName]

    return {
      tableName,
      tableId,
      isConfigured: !!tableId,
      isRequired: tableConfig?.required || false,
      isEnabled: config?.settings.enabledTables?.includes(tableName as any) ?? true,
      config: tableConfig
    }
  }

  // Check if table is accessible for client
  export const isTableAccessible = (clientId: string, tableName: keyof ClientConfig['baserow']['tables']): boolean => {
    const tableConfig = getTableConfig(clientId, tableName)
    return tableConfig.isConfigured && tableConfig.isEnabled
  }

  // Get all accessible tables for client
  export const getAccessibleTables = (clientId: string): string[] => {
    const config = getClientConfig(clientId)
    if (!config) return []

    return Object.keys(config.baserow.tables).filter(tableName => 
      isTableAccessible(clientId, tableName as keyof ClientConfig['baserow']['tables'])
    )
  }