import { NextRequest, NextResponse } from 'next/server'
import { getClientConfig } from '@/lib/config/clients'
import { getClientConfigForAPI } from '@/lib/utils/getClientConfigForAPI'
import { BaserowAPI } from '@/lib/baserow/api'

export async function POST(request: NextRequest) {
  try {
    console.log('=== IMAGE IDEA GENERATION WEBHOOK CALLED ===')
    console.log('Request URL:', request.url)
    console.log('Request method:', request.method)
    console.log('Request headers:', Object.fromEntries(request.headers.entries()))
    
    const formData = await request.formData()
    console.log('FormData received, keys:', Array.from(formData.keys()))
    
    // Extract form data
    const imageIdeaName = formData.get('imageIdeaName') as string
    const imagePrompt = formData.get('imagePrompt') as string
    const imageScene = formData.get('imageScene') as string
    const imageType = formData.get('imageType') as string
    const imageStyle = formData.get('imageStyle') as string
    const imageModel = formData.get('imageModel') as string
    const imageSize = formData.get('imageSize') as string
    const referenceUrl = formData.get('referenceUrl') as string
    const operationType = formData.get('operationType') as string
    const notes = formData.get('notes') as string
    const imageStatus = formData.get('imageStatus') as string
    const imageIdeaId = formData.get('imageIdeaId') as string
    
    // Extract selected images for combine/edit operations
    const selectedImages: string[] = []
    const selectedImagesData = formData.getAll('selectedImages')
    selectedImagesData.forEach((imageId) => {
      if (typeof imageId === 'string') {
        selectedImages.push(imageId)
      }
    })
    
    // Extract uploaded images for combine/edit operations
    const uploadedImages: any[] = []
    const uploadedImagesData = formData.getAll('uploadedImages')
    uploadedImagesData.forEach((file, index) => {
      if (file instanceof File) {
        uploadedImages.push({
          name: file.name,
          size: file.size,
          type: file.type,
          index
        })
      }
    })
    
    // Extract reference image file
    const referenceImageFile = formData.get('referenceImage') as File
    const referenceImageData = referenceImageFile ? {
      name: referenceImageFile.name,
      size: referenceImageFile.size,
      type: referenceImageFile.type
    } : null
    
    // Extract voice note file
    const voiceNoteFile = formData.get('voiceNote') as File
    const voiceNoteData = voiceNoteFile ? {
      name: voiceNoteFile.name,
      size: voiceNoteFile.size,
      type: voiceNoteFile.type
    } : null
    
    console.log('Extracted form data:', {
      imageIdeaName,
      imagePrompt,
      imageScene,
      imageType,
      imageStyle,
      imageModel,
      imageSize,
      referenceUrl,
      operationType,
      notes,
      imageStatus,
      imageIdeaId,
      selectedImages,
      uploadedImages: uploadedImages.length,
      referenceImageData,
      voiceNoteData
    })
    
    // Get client ID from the request URL or form data
    const clientId = formData.get('clientId') as string || 'modern-management'
    console.log('Client ID:', clientId)
    const clientConfig = await getClientConfigForAPI(clientId)
    
    if (!clientConfig) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    console.log('Client config:', {
      name: clientConfig.name,
      hasBaserow: !!clientConfig.baserow,
      baseUrl: clientConfig.baserow?.baseUrl,
      databaseId: clientConfig.baserow?.databaseId,
      hasToken: !!clientConfig.baserow?.token
    })

    // Prepare n8n payload for image generation (using client's Images table)
    const imagesTableId = clientConfig.baserow.tables.images
    console.log('Using Images table ID for client:', clientId, '=', imagesTableId)
    console.log('Field mappings available:', !!clientConfig.fieldMappings)
    console.log('Images field mappings:', clientConfig.fieldMappings?.images)
    
    const n8nPayload = {
      client_id: clientId,
      base_id: clientConfig.baserow.databaseId,
      table_id: imagesTableId, // Use client's actual Images table ID
      event: "image_generation",
      timestamp: new Date().toISOString(),
      clientId: clientId,
      client: {
        name: clientConfig.name,
        id: clientId
      },
      tables: {
        images: {
          id: imagesTableId,
          recordId: null // Will be set after creation
        }
      },
      baserow: {
        baseUrl: clientConfig.baserow.baseUrl,
        databaseId: clientConfig.baserow.databaseId,
        token: clientConfig.baserow.token,
        tableId: imagesTableId,
        recordId: null
      },
      // Add field mappings for dynamic field handling
      fieldMappings: clientConfig.fieldMappings,
      image: {
        imagePrompt,
        imageScene,
        imageType,
        imageStyle,
        imageModel,
        imageSize,
        referenceUrl,
        operationType,
        notes,
        imageStatus,
        selectedImages,
        uploadedImages,
        referenceImageData,
        voiceNoteData
      },
      metadata: {
        createdAt: new Date().toISOString(),
        source: "content-engine-app",
        version: "1.0",
        contentType: "image-idea" // This is the key routing parameter
      }
    }

    // Use the record ID from the form data - the record should already exist
    const finalRecordId = imageIdeaId
    
    if (!finalRecordId) {
      console.error('No record ID provided - record should already exist from form submission')
      console.error('Form data keys:', Array.from(formData.keys()))
      console.error('imageIdeaId value:', imageIdeaId)
      return NextResponse.json({ 
        error: 'No record ID provided - record should already exist from form submission',
        details: 'The form submission should provide the record ID in the imageIdeaId field'
      }, { status: 400 })
    }
    
    console.log('Using existing record ID from form data:', finalRecordId)

    // Update the n8n payload with the record ID
    if (finalRecordId) {
      n8nPayload.tables.images.recordId = finalRecordId
      n8nPayload.baserow.recordId = finalRecordId
      console.log('Updated n8n payload with record ID:', finalRecordId)
    }

    // Send to n8n webhook
    console.log('All environment variables:', {
      N8N_CONTENT_IDEA_WEBHOOK_URL: process.env.N8N_CONTENT_IDEA_WEBHOOK_URL,
      N8N_EMAIL_IDEA_WEBHOOK_URL: process.env.N8N_EMAIL_IDEA_WEBHOOK_URL,
      N8N_IMAGE_IDEA_WEBHOOK_URL: process.env.N8N_IMAGE_IDEA_WEBHOOK_URL,
      NODE_ENV: process.env.NODE_ENV,
      BASEROW_BASE_URL: process.env.BASEROW_BASE_URL
    })
    
    // Get webhook URL from client settings or environment
    const { getWebhookUrl } = await import('@/lib/utils/getWebhookUrl')
    const n8nWebhookUrl = await getWebhookUrl(clientId, 'image_generator')
    
    if (!n8nWebhookUrl) {
      console.error('❌ Image webhook URL not configured')
      return NextResponse.json({ 
        error: 'Image webhook URL not configured. Please configure in Settings.' 
      }, { status: 500 })
    }
    
    console.log('📡 Using image webhook:', n8nWebhookUrl)

    console.log('Sending image idea generation request to n8n with record ID:', finalRecordId)
    console.log('Updated n8n payload:', n8nPayload)
    console.log('Image webhook payload token:', n8nPayload.baserow.token)
    console.log('Image webhook payload token length:', n8nPayload.baserow.token?.length)

    // Update status to "Generating" before sending to n8n
    if (finalRecordId && clientConfig?.baserow?.baseUrl) {
      try {
        const updateResponse = await fetch(`${clientConfig.baserow.baseUrl}/api/database/rows/table/729/${finalRecordId}/`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Token ${clientConfig.baserow.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            field_7185: 'Generating' // Update status to "Generating"
          })
        })
        
        if (updateResponse.ok) {
          console.log('Updated existing record status to "Generating"')
        } else {
          console.error('Failed to update record status:', await updateResponse.text())
        }
      } catch (error) {
        console.error('Error updating status to Generating:', error)
      }
    }

    console.log('Making request to n8n webhook...')
    
    // Send to n8n asynchronously (fire-and-forget)
    fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(n8nPayload)
    }).then(async (n8nResponse) => {
      console.log('N8N response status:', n8nResponse.status)
      
      if (n8nResponse.ok) {
        const n8nResult = await n8nResponse.json()
        console.log('N8N response:', n8nResult)

        // Extract generated image from n8n response
        const generatedImage = n8nResult.generatedImage || n8nResult.imageUrl || ''

        // Update the record with generated image and status
        if (finalRecordId && clientConfig?.baserow?.baseUrl) {
          try {
            // Initialize Baserow API with dynamic field mappings
            const baserowAPI = new BaserowAPI(
              clientConfig.baserow.token,
              clientConfig.baserow.databaseId,
              clientConfig.fieldMappings
            )

            // Update the record with generated image using dynamic field mapping
            const updateData = {
              image: generatedImage, // Update with generated image
              imageStatus: 'Generated' // Update status to "Generated"
            }
            
            console.log('Updating image record with dynamic field mapping:', updateData)
            const updateResult = await baserowAPI.updateImage(imagesTableId, finalRecordId, updateData)

            if (updateResult && updateResult.id) {
              console.log('Image updated with generated image and status:', updateResult.id)
            } else {
              console.error('Failed to update record with generated image:', updateResult)
            }
          } catch (error) {
            console.error('Error updating record with generated image:', error)
          }
        }
      } else {
        const errorText = await n8nResponse.text()
        console.error('N8N webhook failed:', n8nResponse.status, errorText)
        
        // Update status to "Failed" if n8n fails
        if (finalRecordId && clientConfig?.baserow?.baseUrl) {
          try {
            await fetch(`${clientConfig.baserow.baseUrl}/api/database/rows/table/729/${finalRecordId}/`, {
              method: 'PATCH',
              headers: {
                'Authorization': `Token ${clientConfig.baserow.token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                field_7185: 'Failed' // Update status to "Failed"
              })
            })
          } catch (error) {
            console.error('Error updating status to Failed:', error)
          }
        }
      }
    }).catch((error) => {
      console.error('Error sending to n8n webhook:', error)
      
      // Update status to "Failed" if there's an error
      if (finalRecordId && clientConfig?.baserow?.baseUrl) {
        fetch(`${clientConfig.baserow.baseUrl}/api/database/rows/table/729/${finalRecordId}/`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Token ${clientConfig.baserow.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            field_7185: 'Failed' // Update status to "Failed"
          })
        }).catch(updateError => {
          console.error('Error updating status to Failed:', updateError)
        })
      }
    })

    // Return immediately without waiting for n8n completion
    return NextResponse.json({
      success: true,
      recordId: finalRecordId,
      message: 'Image generation started. Please check back in a few minutes.',
      status: 'Generating'
    })

  } catch (error) {
    console.error('Error in image idea generation webhook:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
