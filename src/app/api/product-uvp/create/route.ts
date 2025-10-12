import { NextRequest, NextResponse } from 'next/server'
import { getClientConfigForAPI } from '@/lib/utils/getClientConfigForAPI'
import { BaserowAPI } from '@/lib/baserow/api'

export async function POST(request: NextRequest) {
  try {
    console.log('=== PRODUCT UVP CREATE API CALLED ===')
    
    const body = await request.json()
    console.log('Request body:', body)

    const { clientId, ...formData } = body

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      )
    }

    // Get client configuration
    const clientConfig = await getClientConfigForAPI(clientId)
    
    if (!clientConfig) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    // Validate that productUvps table exists
    if (!clientConfig.baserow.tables.productUvps) {
      return NextResponse.json(
        { error: 'Product UVPs table not configured for this client' },
        { status: 500 }
      )
    }

    // Initialize Baserow API
    const baserowAPI = new BaserowAPI(
      clientConfig.baserow.token,
      clientConfig.baserow.databaseId,
      clientConfig.fieldMappings
    )

    // Prepare data for Baserow using exact field names from Baserow UI
    const productUvpData: any = {
      'Product/Service Name': formData.productServiceName,
      'Product URL': formData.productUrl || '',
      'Customer Type': formData.customerType,
      'Industry Category': formData.industryCategory,
      'Problem Solved': formData.problemSolved,
      'Key Differentiator': formData.keyDifferentiator
    }

    console.log('Product UVP data to save:', productUvpData)

    // Create record in Baserow using direct request with user_field_names=true
    const productUvpRecord = await baserowAPI.request(
      `/api/database/rows/table/${clientConfig.baserow.tables.productUvps}/?user_field_names=true`,
      {
        method: 'POST',
        body: JSON.stringify(productUvpData)
      }
    )

    console.log('Product UVP record created in Baserow:', productUvpRecord)

    // Get webhook URL from client settings or environment
    const { getWebhookUrl } = await import('@/lib/utils/getWebhookUrl')
    const webhookUrl = await getWebhookUrl(clientConfig.id, 'uvp_creation')
    
    console.log('🔍 Checking UVP webhook URL...')
    console.log('📡 Webhook URL:', webhookUrl || 'Not configured')
    
    if (!webhookUrl) {
      console.warn('⚠️ UVP webhook URL not configured, skipping webhook call')
      console.warn('Please configure webhook in Settings to enable AI UVP generation')
    } else {
      const webhookPayload = {
        clientId: clientConfig.id,
        clientName: clientConfig.name,
        clientDisplayName: clientConfig.displayName,
        productUvpId: productUvpRecord.id,
        tableIds: {
          productUvps: clientConfig.baserow.tables.productUvps
        },
        productUvp: {
          id: productUvpRecord.id,
          productServiceName: formData.productServiceName,
          productUrl: formData.productUrl || '',
          customerType: formData.customerType,
          industryCategory: formData.industryCategory,
          problemSolved: formData.problemSolved,
          keyDifferentiator: formData.keyDifferentiator
        },
        fieldMappings: clientConfig.fieldMappings?.productUvps || {},
        baserowConfig: {
          token: clientConfig.baserow.token,
          databaseId: clientConfig.baserow.databaseId,
          tableId: clientConfig.baserow.tables.productUvps
        }
      }

      console.log('======================================')
      console.log('🚀 SENDING WEBHOOK TO N8N')
      console.log('Webhook URL:', webhookUrl)
      console.log('Payload size:', JSON.stringify(webhookPayload).length, 'bytes')
      console.log('Full Webhook payload:')
      console.log(JSON.stringify(webhookPayload, null, 2))
      console.log('======================================')

      try {
        const webhookResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(webhookPayload)
        })

        console.log('Webhook response status:', webhookResponse.status)
        console.log('Webhook response headers:', Object.fromEntries(webhookResponse.headers.entries()))

        if (!webhookResponse.ok) {
          const errorText = await webhookResponse.text()
          console.error('❌ Webhook error response:', errorText)
          console.error('Webhook status:', webhookResponse.status)
          
          // Continue without webhook (temporary workaround)
          console.log('⚠️ Webhook failed, but UVP creation succeeded')
        } else {
          const webhookResult = await webhookResponse.json()
          console.log('✅ UVP Creation - Webhook Response:', webhookResult)
        }
      } catch (webhookError: any) {
        console.error('❌ Webhook call failed with error:', webhookError)
        console.error('Error message:', webhookError.message)
        console.error('Error stack:', webhookError.stack)
        console.log('⚠️ Webhook call failed, but UVP creation succeeded')
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Product UVP created successfully',
      data: productUvpRecord
    })

  } catch (error: any) {
    console.error('Error creating product UVP:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create product UVP',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

