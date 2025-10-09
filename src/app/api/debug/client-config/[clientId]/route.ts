import { NextRequest, NextResponse } from 'next/server'
import { getClientConfig } from '@/lib/config/clients'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { clientId } = await params
    const clientConfig = getClientConfig(clientId)

    if (!clientConfig) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    // Return the config but mask sensitive data
    const debugConfig = {
      id: clientConfig.id,
      name: clientConfig.name,
      baserow: {
        token: clientConfig.baserow.token ? '[SET]' : '[NOT SET]',
        databaseId: clientConfig.baserow.databaseId || '[NOT SET]',
        tables: {
          contentIdeas: clientConfig.baserow.tables.contentIdeas || '[NOT SET]',
          socialMediaContent: clientConfig.baserow.tables.socialMediaContent || '[NOT SET]',
          brandAssets: clientConfig.baserow.tables.brandAssets || '[NOT SET]',
          contentAssets: clientConfig.baserow.tables.contentAssets || '[NOT SET]',
          publishingSchedule: clientConfig.baserow.tables.publishingSchedule || '[NOT SET]',
          performanceAnalytics: clientConfig.baserow.tables.performanceAnalytics || '[NOT SET]'
        }
      }
    }

    return NextResponse.json({
      success: true,
      config: debugConfig,
      envVars: {
        BASEROW_MODERN_MANAGEMENT_TOKEN: process.env.BASEROW_MODERN_MANAGEMENT_TOKEN ? '[SET]' : '[NOT SET]',
        BASEROW_MODERN_MANAGEMENT_DATABASE_ID: process.env.BASEROW_MODERN_MANAGEMENT_DATABASE_ID || '[NOT SET]',
        BASEROW_MODERN_MANAGEMENT_CONTENT_IDEAS_TABLE: process.env.BASEROW_MODERN_MANAGEMENT_CONTENT_IDEAS_TABLE || '[NOT SET]',
        BASEROW_MODERN_MANAGEMENT_SOCIAL_MEDIA_CONTENT_TABLE: process.env.BASEROW_MODERN_MANAGEMENT_SOCIAL_MEDIA_CONTENT_TABLE || '[NOT SET]',
        BASEROW_MODERN_MANAGEMENT_BRAND_ASSETS_TABLE: process.env.BASEROW_MODERN_MANAGEMENT_BRAND_ASSETS_TABLE || '[NOT SET]'
      }
    })

  } catch (error) {
    console.error('Error in debug route:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}