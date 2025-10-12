import { NextRequest, NextResponse } from 'next/server'
import { getClientConfigForAPI } from '@/lib/utils/getClientConfigForAPI'
import { BaserowAPI } from '@/lib/baserow/api'

export async function POST(request: NextRequest) {
  try {
    console.log('=== IMAGE GENERATION COMPLETE WEBHOOK ===')
    
    // Parse the webhook payload
    const payload = await request.json()
    console.log('Webhook payload received:', payload)
    
    // Extract data from the payload
    const {
      imageId,
      imageUrl,
      status = 'completed',
      socialMediaContentId,
      clientId,
      error
    } = payload
    
    if (!imageId) {
      console.error('Missing imageId in webhook payload')
      return NextResponse.json({ error: 'Missing imageId' }, { status: 400 })
    }
    
    if (!clientId) {
      console.error('Missing clientId in webhook payload')
      return NextResponse.json({ error: 'Missing clientId' }, { status: 400 })
    }
    
    // Get client configuration with field mappings
    const clientConfig = await getClientConfigForAPI(clientId)
    if (!clientConfig) {
      console.error('Client configuration not found:', clientId)
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }
    
    console.log('Client configuration found:', clientConfig.displayName)
    console.log('Using field mappings:', clientConfig.fieldMappings?.images)
    
    // Initialize Baserow API with dynamic field mappings
    const baserowAPI = new BaserowAPI(
      clientConfig.baserow.token,
      clientConfig.baserow.databaseId,
      clientConfig.fieldMappings
    )
    
    // Prepare update data using dynamic field mapping
    const updateData: any = {
      imageStatus: status === 'completed' ? 'Completed' : 'Failed' // Image Status
    }
    
    // If generation was successful, add the image URL
    if (imageUrl && status === 'completed') {
      updateData.image = imageUrl // Image field
    }
    
    // If there was an error, store it in the status field
    if (error) {
      updateData.imageStatus = 'Failed'
      console.error('Image generation failed:', error)
    }
    
    // Update the image record in Baserow
    console.log('Updating image record:', imageId, 'with data:', updateData)
    const result = await baserowAPI.updateImage(
      clientConfig.baserow.tables.images,
      imageId,
      updateData
    )
    
    console.log('Image record updated successfully:', result)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Image generation status updated',
      imageId,
      status 
    })
    
  } catch (error) {
    console.error('Error processing image generation complete webhook:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}
