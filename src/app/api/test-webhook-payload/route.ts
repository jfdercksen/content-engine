import { NextRequest, NextResponse } from 'next/server'
import { getClientConfig } from '@/lib/config/clients'

export async function POST(request: NextRequest) {
  try {
    // Test payload similar to what would come from the content idea form
    const testPayload = {
      clientId: 'modern-management',
      ideaId: 'test-123',
      contentIdea: 'Test social media content idea',
      contentType: 'social_media_post',
      platforms: ['Facebook', 'Instagram'],
      postType: 'Image',
      informationSource: 'manual',
      sourceContent: 'Test content for social media',
      targetAudience: 'young_adults',
      priority: 'Medium',
      hookFocus: 'Engaging hook for the audience',
      cta: 'Visit our website',
      additionalNotes: 'Test notes',
      files: {
        field_7053: [{ url: 'https://example.com/image.jpg', name: 'test-image.jpg' }]
      }
    }

    // Get client configuration
    const clientConfig = getClientConfig(testPayload.clientId)
    if (!clientConfig) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    // Generate the enhanced n8n payload (same logic as webhook)
    const n8nPayload = {
      // Required fields for n8n workflow (top level)
      client_id: testPayload.clientId,
      base_id: clientConfig.baserow.databaseId,
      record_id: testPayload.ideaId,
      table_id: clientConfig.baserow.tables.contentIdeas,
      idea_type: 'social_media_idea',
      title: testPayload.contentIdea,
      priority: testPayload.priority,
      
      // Additional metadata
      event: 'content_idea_created',
      timestamp: new Date().toISOString(),
      
      // Legacy fields (keeping for compatibility)
      clientId: testPayload.clientId,
      ideaId: testPayload.ideaId,
      
      // Enhanced client information
      client: {
        name: clientConfig.name,
        id: testPayload.clientId
      },
      
      // Enhanced table information for n8n to access all tables
      tables: {
        contentIdeas: {
          id: clientConfig.baserow.tables.contentIdeas,
          recordId: testPayload.ideaId
        },
        socialMediaContent: {
          id: clientConfig.baserow.tables.socialMediaContent
        },
        brandAssets: {
          id: clientConfig.baserow.tables.brandAssets
        }
      },
      
      // Enhanced Baserow connection information for n8n
      baserow: {
        baseUrl: process.env.BASEROW_API_URL || 'https://baserow.aiautomata.co.za',
        databaseId: clientConfig.baserow.databaseId,
        token: clientConfig.baserow.token,
        // Legacy fields for backward compatibility
        tableId: clientConfig.baserow.tables.contentIdeas,
        recordId: testPayload.ideaId
      },
      
      // Social Media specific data
      socialMedia: {
        platforms: testPayload.platforms || [],
        postType: testPayload.postType,
        informationSource: testPayload.informationSource,
        numberOfPosts: 1,
        hookFocus: testPayload.hookFocus,
        cta: testPayload.cta,
        // Baserow file references
        uploadedImage: testPayload.files?.field_7053 || null,
        uploadedVideo: testPayload.files?.field_7054 || null,
        voiceFile: testPayload.files?.field_7046 || null
      },
      
      contentIdea: {
        title: testPayload.contentIdea,
        ideaType: testPayload.contentType,
        description: testPayload.hookFocus || testPayload.contentIdea,
        sourceType: testPayload.informationSource,
        sourceUrl: testPayload.sourceUrl,
        sourceContent: testPayload.sourceContent,
        targetAudience: testPayload.targetAudience,
        priority: testPayload.priority,
        dueDate: testPayload.dueDate,
        clientNotes: testPayload.additionalNotes,
        voiceFileUrl: testPayload.voiceFileUrl,
        status: 'Idea'
      },
      
      // Additional metadata for n8n processing
      metadata: {
        createdAt: new Date().toISOString(),
        source: 'content-engine-app',
        version: '2.0', // Updated version for enhanced payload
        contentType: 'social_media_post'
      }
    }

    // Validation checks
    const validationResults = {
      hasClientId: !!n8nPayload.client_id,
      hasClientName: !!n8nPayload.client.name,
      hasDatabaseId: !!n8nPayload.base_id,
      hasContentIdeasTable: !!n8nPayload.tables.contentIdeas.id,
      hasSocialMediaContentTable: !!n8nPayload.tables.socialMediaContent.id,
      hasBrandAssetsTable: !!n8nPayload.tables.brandAssets.id,
      hasBaserowToken: !!n8nPayload.baserow.token,
      hasBaserowUrl: !!n8nPayload.baserow.baseUrl,
      allTablesConfigured: !!(
        n8nPayload.tables.contentIdeas.id && 
        n8nPayload.tables.socialMediaContent.id && 
        n8nPayload.tables.brandAssets.id
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook payload generated successfully',
      payload: n8nPayload,
      validation: validationResults,
      summary: {
        clientName: n8nPayload.client.name,
        databaseId: n8nPayload.base_id,
        tableIds: {
          contentIdeas: n8nPayload.tables.contentIdeas.id,
          socialMediaContent: n8nPayload.tables.socialMediaContent.id,
          brandAssets: n8nPayload.tables.brandAssets.id
        },
        payloadSize: JSON.stringify(n8nPayload).length,
        timestamp: n8nPayload.timestamp
      }
    })

  } catch (error) {
    console.error('Error generating test webhook payload:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate webhook payload', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Webhook payload test endpoint',
    usage: 'POST to this endpoint to test webhook payload generation',
    testData: {
      clientId: 'modern-management',
      ideaId: 'test-123',
      contentIdea: 'Test social media content idea',
      platforms: ['Facebook', 'Instagram'],
      priority: 'Medium'
    }
  })
}