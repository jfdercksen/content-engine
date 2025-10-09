import { NextRequest, NextResponse } from 'next/server'
import { getClientConfig } from '@/lib/config/clients'

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    console.log('DEBUG: Webhook received payload:', payload)
    console.log('DEBUG: Webhook ideaId:', payload.ideaId)

    // Skip webhook secret validation for internal calls
    // (This is an internal API route called from our own application)
    console.log('Processing internal webhook call')

    // Get client configuration to populate Baserow details
    const clientConfig = getClientConfig(payload.clientId)
    if (!clientConfig) {
      console.error('Client configuration not found for:', payload.clientId)
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    // Prepare enhanced data for n8n workflow
    const n8nPayload = {
      // Required fields for n8n workflow (top level)
      client_id: payload.clientId,
      base_id: clientConfig.baserow.databaseId,
      record_id: payload.ideaId,
      table_id: clientConfig.baserow.tables.contentIdeas,
      idea_type: 'social_media_idea',
      title: payload.contentIdea,
      priority: payload.priority,
      
      // Additional metadata
      event: 'content_idea_created',
      timestamp: new Date().toISOString(),
      
      // Legacy fields (keeping for compatibility)
      clientId: payload.clientId,
      ideaId: payload.ideaId,
      
      // Enhanced client information
      client: {
        name: clientConfig.name,
        id: payload.clientId
      },
      
      // Enhanced table information for n8n to access all tables
      tables: {
        contentIdeas: {
          id: clientConfig.baserow.tables.contentIdeas,
          recordId: payload.ideaId
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
        recordId: payload.ideaId
      },
      
      // Add field mappings for dynamic field handling
      fieldMappings: clientConfig.fieldMappings,
      
      // Social Media specific data
      socialMedia: {
        platforms: payload.platforms || [],
        postType: payload.postType,
        informationSource: payload.informationSource,
        numberOfPosts: payload.numberOfPosts || 1,
        hookFocus: payload.hookFocus,
        cta: payload.cta,
        // Add missing strategy fields to socialMedia section
        contentStrategy: payload.contentStrategy,
        contentTypeStrategy: payload.contentTypeStrategy,
        primaryObjective: payload.primaryObjective,
        targetAudience: payload.targetAudience,
        sourceContent: payload.sourceContent,
        additionalNotes: payload.additionalNotes,
        // Baserow file references (accessible as {{ $json.socialMedia.uploadedImage[0].url }})
        uploadedImage: payload.files?.uploadedImageUrl || null,
        uploadedVideo: payload.files?.uploadedVideoUrl || null,
        voiceFile: payload.files?.voiceFileUrl || null
      },
      
      contentIdea: {
        title: payload.contentIdea,
        ideaType: payload.contentType,
        description: payload.hookFocus || payload.contentIdea,
        sourceType: payload.informationSource,
        sourceUrl: payload.sourceUrl,
        sourceContent: payload.sourceContent,
        targetAudience: payload.targetAudience,
        priority: payload.priority,
        dueDate: payload.dueDate,
        clientNotes: payload.additionalNotes,
        voiceFileUrl: payload.voiceFileUrl,
        // Add missing strategy fields
        contentStrategy: payload.contentStrategy,
        contentTypeStrategy: payload.contentTypeStrategy,
        primaryObjective: payload.primaryObjective,
        status: 'Idea'
      },
      
      // Strategy information for workflow processing
      strategy: {
        contentStrategy: payload.contentStrategy,
        contentTypeStrategy: payload.contentTypeStrategy,
        primaryObjective: payload.primaryObjective,
        targetAudience: payload.targetAudience,
        sourceContent: payload.sourceContent,
        additionalNotes: payload.additionalNotes
      },
      
      // Additional metadata for n8n processing
      metadata: {
        createdAt: new Date().toISOString(),
        source: 'content-engine-app',
        version: '1.0',
        contentType: 'social_media_post'
      }
    }
    
    console.log('DEBUG: n8n payload record_id:', n8nPayload.record_id)
    console.log('DEBUG: n8n payload ideaId:', n8nPayload.ideaId)

    // Send to n8n webhook
    const n8nWebhookUrl = process.env.N8N_CONTENT_IDEA_WEBHOOK_URL || 'https://n8n.aiautomata.co.za/webhook/social-media-processor'

    if (!n8nWebhookUrl) {
      console.log('n8n webhook URL not configured, skipping webhook trigger')
      return NextResponse.json({
        success: true,
        message: 'Content idea created, webhook not configured'
      })
    }

    console.log('Sending to n8n webhook:', n8nWebhookUrl)
    console.log('Enhanced payload:', JSON.stringify(n8nPayload, null, 2))
    console.log('Webhook payload token:', n8nPayload.baserow.token)
    console.log('Webhook payload token length:', n8nPayload.baserow.token?.length)
    console.log('Client config check:', {
      clientId: payload.clientId,
      clientName: clientConfig.name,
      databaseId: clientConfig.baserow.databaseId,
      contentIdeasTable: clientConfig.baserow.tables.contentIdeas,
      socialMediaContentTable: clientConfig.baserow.tables.socialMediaContent,
      brandAssetsTable: clientConfig.baserow.tables.brandAssets
    })
    console.log('Key fields check:', {
      client_id: n8nPayload.client_id,
      client_name: n8nPayload.client.name,
      base_id: n8nPayload.base_id,
      table_id: n8nPayload.table_id,
      record_id: n8nPayload.record_id,
      tables_available: Object.keys(n8nPayload.tables)
    })

    try {
      // Try POST first, then GET if it fails
      let n8nResponse = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(n8nPayload)
      })

      // If POST fails with 404, try GET with query parameters
      if (!n8nResponse.ok && n8nResponse.status === 404) {
        console.log('POST failed, trying GET method...')
        const queryParams = new URLSearchParams({
          // Essential fields for n8n workflow
          client_id: n8nPayload.client_id || '',
          client_name: n8nPayload.client.name || '',
          base_id: n8nPayload.base_id || '',
          record_id: n8nPayload.record_id || '',
          table_id: n8nPayload.table_id || '',
          // Enhanced table information
          content_ideas_table: n8nPayload.tables.contentIdeas.id || '',
          social_media_content_table: n8nPayload.tables.socialMediaContent.id || '',
          brand_assets_table: n8nPayload.tables.brandAssets.id || '',
          // Content information
          idea_type: n8nPayload.idea_type || '',
          title: n8nPayload.title || '',
          priority: n8nPayload.priority || '',
          event: n8nPayload.event,
          timestamp: n8nPayload.timestamp,
          // Legacy fields for compatibility
          clientId: n8nPayload.clientId || '',
          ideaId: n8nPayload.ideaId || ''
        })

        n8nResponse = await fetch(`${n8nWebhookUrl}?${queryParams.toString()}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })
      }

      console.log('n8n response status:', n8nResponse.status)

      if (!n8nResponse.ok) {
        const errorText = await n8nResponse.text()
        console.error('n8n webhook failed:', n8nResponse.status, errorText)

        // Don't fail the whole request if webhook fails
        return NextResponse.json({
          success: true,
          message: 'Content idea created, but n8n webhook failed',
          webhookError: `${n8nResponse.status}: ${errorText}`
        })
      }

      const responseData = await n8nResponse.text()
      console.log('n8n webhook success:', responseData)

      return NextResponse.json({
        success: true,
        message: 'Content idea created and n8n workflow triggered',
        n8nStatus: n8nResponse.status
      })

    } catch (webhookError) {
      console.error('n8n webhook error:', webhookError)

      // Don't fail the whole request if webhook fails
      return NextResponse.json({
        success: true,
        message: 'Content idea created, but n8n webhook had an error',
        webhookError: webhookError instanceof Error ? webhookError.message : 'Unknown webhook error'
      })
    }

  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}