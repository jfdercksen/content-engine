import { NextRequest, NextResponse } from 'next/server'
import { getClientConfigForAPI } from '@/lib/utils/getClientConfigForAPI'
import { BaserowAPI } from '@/lib/baserow/api'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    // Extract file and other data
    const imageFile = formData.get('imageFile') as File
    const position = formData.get('position') as string
    const clientId = formData.get('clientId') as string

    if (!imageFile || !position || !clientId) {
      return NextResponse.json(
        { error: 'Missing required fields: imageFile, position, or clientId' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!imageFile.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      )
    }

    // Get client configuration
    const clientConfig = await getClientConfigForAPI(clientId)
    if (!clientConfig) {
      return NextResponse.json(
        { error: 'Invalid client ID' },
        { status: 400 }
      )
    }

    const imagesTableId = clientConfig.baserow.tables.images
    console.log('Using images table ID:', imagesTableId)

    // First upload the file to Baserow to get the file reference
    const baserowAPI = new BaserowAPI(
      clientConfig.baserow.token,
      clientConfig.baserow.databaseId,
      clientConfig.fieldMappings
    )
    let fileUploadResult
    try {
      fileUploadResult = await baserowAPI.uploadFile(imageFile)
      console.log('File upload result:', fileUploadResult)
    } catch (uploadError) {
      console.error('File upload failed:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload image file', details: uploadError instanceof Error ? uploadError.message : 'Unknown error' },
        { status: 500 }
      )
    }

    // Prepare data for Baserow with the file reference using dynamic field mapping
    const imageData = {
      image: [fileUploadResult], // Main image field (File) - must be array of file objects
      imagePrompt: `Image for ${position}`, // Image Prompt
      imageStatus: 'Completed', // Image Status
      imageType: 'New image', // Image Type
      imageScene: position, // Image Scene
      imageStyle: 'Photorealistic', // Image Style
      imageModel: 'openai/gpt-image-1', // Image Model
      imageSize: '1024x1024 (1:1)', // Image Size
      captionText: `Image for ${position} position`, // Caption Text
      emailImages: position, // Email Images position
      imageLinkUrl: fileUploadResult.url, // Image Link URL
      client_id: clientId, // client_id
      created_at: new Date().toISOString().split('T')[0], // created_at
    }

    console.log('Prepared image data for client:', clientId, imageData)
    console.log('Using field mappings:', clientConfig.fieldMappings?.images)

    // Create the image record with the file reference
    const result = await baserowAPI.createImage(imagesTableId, imageData)
    console.log('Baserow create result:', JSON.stringify(result, null, 2))

    if (!result.id) {
      throw new Error('Failed to create image record')
    }

    // Trigger n8n webhook for image generation
    try {
      const { getWebhookUrl } = await import('@/lib/utils/getWebhookUrl')
      const webhookUrl = await getWebhookUrl(clientId, 'image_generator')
      
      if (!webhookUrl) {
        console.warn('⚠️ Image generator webhook not configured, skipping webhook call')
      } else {
        console.log('📡 Triggering image generation webhook:', webhookUrl)
        
        // Prepare payload for n8n
        const webhookPayload = {
          clientId,
          imageIdeaId: result.id,
          imagePrompt: imageData.imagePrompt || '',
          imageScene: imageData.imageScene || position || '',
          imageType: imageData.imageType || '',
          imageStyle: imageData.imageStyle || '',
          imageModel: imageData.imageModel || '',
          imageSize: imageData.imageSize || '',
          imageStatus: imageData.imageStatus || 'Generating',
          operationType: 'generate',
          source: 'social_media_post', // Indicate this came from social media post
          baserow: {
            tableId: imagesTableId,
            recordId: result.id
          }
        }
        
        // Call webhook asynchronously (fire-and-forget)
        fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(webhookPayload)
        }).then(response => {
          if (response.ok) {
            console.log('✅ Webhook triggered successfully for social media image')
          } else {
            console.error('❌ Webhook failed:', response.status, response.statusText)
          }
        }).catch(error => {
          console.error('❌ Error calling webhook:', error)
        })
      }
    } catch (webhookError) {
      console.error('❌ Error triggering webhook:', webhookError)
      // Don't fail the request if webhook fails
    }

    return NextResponse.json({
      success: true,
      id: result.id,
      url: fileUploadResult.url,
      message: 'Image created successfully'
    })

  } catch (error) {
    console.error('Error in image creation:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { clientId } = await params
    const clientConfig = await getClientConfigForAPI(clientId)

    if (!clientConfig) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    const imagesTableId = clientConfig.baserow.tables.images

    if (!imagesTableId) {
      return NextResponse.json(
        { error: 'Images table not configured' },
        { status: 500 }
      )
    }

    // GET - List images with optional filtering
    if (request.method === 'GET') {
      try {
        const { searchParams } = new URL(request.url)
        const socialMediaContentId = searchParams.get('socialMediaContent')
        
        let filters = {}
        
        // If socialMediaContentId is provided, filter by it using dynamic field mapping
        if (socialMediaContentId) {
          // Get the dynamic field ID for socialMediaContent link
          const socialMediaContentFieldId = clientConfig.fieldMappings?.images?.socialMediaContent
          if (socialMediaContentFieldId) {
            filters = {
              [`filter__${socialMediaContentFieldId}__link_row_has`]: socialMediaContentId
            }
            console.log('Using dynamic field mapping for socialMediaContent filter:', socialMediaContentFieldId)
          } else {
            console.log('No field mapping found for socialMediaContent, skipping filter')
          }
        }
        
        const baserowAPIInstance = new BaserowAPI(
          clientConfig.baserow.token,
          clientConfig.baserow.databaseId,
          clientConfig.fieldMappings
        )
        const result = await baserowAPIInstance.getImages(clientConfig.baserow.tables.images, filters)
        
        return NextResponse.json({
          success: true,
          results: result.results || result
        })
      } catch (error) {
        console.error('Error fetching images:', error)
        return NextResponse.json(
          { error: 'Failed to fetch images' }, 
          { status: 500 }
        )
      }
    }

  } catch (error) {
    console.error('Error fetching images:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json(
      { error: 'Failed to fetch images', details: errorMessage },
      { status: 500 }
    )
  }
}
