import { NextResponse } from 'next/server'
import { DynamicClientConfig } from '@/lib/config/dynamicClients'
import { DatabaseClientConfig } from '@/lib/config/databaseClientConfig'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { clientId } = await params
    
    // Try to get client config from database first (production)
    let clientConfig = await DatabaseClientConfig.getClient(clientId)
    
    // Fallback to file-based config (development)
    if (!clientConfig) {
      console.log('⚠️ Client not found in database, trying file-based config')
      await DynamicClientConfig.initialize()
      clientConfig = DynamicClientConfig.getClientConfig(clientId)
    }
    
    if (!clientConfig) {
      return NextResponse.json({
        success: false,
        error: 'Client not found',
        clientId
      }, { status: 404 })
    }

    // Transform the config to match the old structure expected by the dashboard
    const transformedConfig = {
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
          keywordResearch: clientConfig.tables.keywordResearch || ''
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

    return NextResponse.json({
      success: true,
      clientConfig: transformedConfig
    })

  } catch (error) {
    console.error('Error getting client config:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
