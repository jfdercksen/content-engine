import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Extract the form data and asset ID from the request
    const { formData, newAssetId, clientId, clientConfig } = body
    
    // Prepare the complete payload for n8n webhook
    const payload = {
      // Baserow authentication and database info
      token: clientConfig.baserow.token,
      databaseId: clientConfig.baserow.databaseId,
      brandAssets: clientConfig.baserow.tables.brandAssets,
      
      // Baserow row information
      rowId: newAssetId,
      tableId: clientConfig.baserow.tables.brandAssets,
      
      // Form data for AI context
      assetName: formData.assetName,
      platform: Array.isArray(formData.platform) ? formData.platform : [formData.platform],
      contentType: formData.contentType,
      assetType: formData.assetType,
      assetInformation: formData.assetInformation || '',
      brandVoiceGuidelines: formData.brandVoiceGuidelines || '',
      approvedHashtags: formData.approvedHashtags || '',
      forbiddenWordsTopics: formData.forbiddenWordsTopics || '',
      platformSpecificRules: formData.platformSpecificRules || '',
      fileUrl: formData.fileUrl || '',
      notes: formData.notes || '',
      
      // Company/Client information
      clientId: clientId,
      clientName: clientConfig.displayName || clientConfig.name,
      clientConfig: clientConfig,
      
      // Baserow field mappings for the workflow to use (dynamic based on client)
      fieldMappings: clientConfig.fieldMappings?.brandAssets || {},
      
      // File data if uploaded
      uploadedFile: formData.file ? {
        name: formData.file.name,
        type: formData.file.type,
        size: formData.file.size
      } : null,
      
      // Timestamp and tracking
      timestamp: new Date().toISOString(),
      requestId: `brand-asset-${newAssetId}-${Date.now()}`
    }

    // Debug: Log the payload being sent
    console.log('Payload being sent to n8n:', JSON.stringify(payload, null, 2))

    // Send to n8n webhook
    const webhookResponse = await fetch('https://n8n.aiautomata.co.za/webhook/brand-asset-generator', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    })

    if (!webhookResponse.ok) {
      throw new Error('Failed to send generation request to AI workflow')
    }

    return NextResponse.json({ 
      success: true, 
      message: 'AI generation request sent successfully',
      payload: payload // Return the payload for debugging
    })

  } catch (error) {
    console.error('Error in brand asset generator webhook:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to send AI generation request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
