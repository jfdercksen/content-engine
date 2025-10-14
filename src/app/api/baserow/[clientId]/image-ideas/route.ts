import { NextRequest, NextResponse } from 'next/server'
import { BaserowAPI } from '@/lib/baserow/api'
import { getClientConfigForAPI } from '@/lib/utils/getClientConfigForAPI'
import { z } from 'zod'

// Schema for Image Ideas validation (using Images table fields)
const imageIdeaSchema = z.object({
  imagePrompt: z.string().optional(),
  imageScene: z.string().optional(),
  imageType: z.string().optional(),
  imageStyle: z.string().optional(),
  imageModel: z.string().optional(),
  imageSize: z.string().optional(),
  referenceUrl: z.string().url().optional().or(z.literal('')),
  referenceImage: z.array(z.any()).optional(), // File upload field
  voiceNote: z.array(z.any()).optional(), // Voice note file upload field
  operationType: z.enum(['generate', 'combine', 'edit', 'browse']).default('generate').optional(),
  selectedImages: z.array(z.string()).optional(),
  imagePrompt: z.string().optional(),
  imageStatus: z.string().default('Generating')
})

export async function GET(request: NextRequest, { params }: { params: { clientId: string } }) {
  try {
    const clientId = params.clientId
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      )
    }

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

    const baserowAPI = new BaserowAPI(
      clientConfig.baserow.token,
      clientConfig.baserow.databaseId,
      clientConfig.fieldMappings
    )
    
    try {
      // Fetch images from the Images table (729) - these are our "image ideas"
      const images = await baserowAPI.getImages(imagesTableId)
      console.log('Image Ideas API: Fetched images:', images)
      console.log('Image Ideas API: Results count:', images.results?.length || 0)
      
      return NextResponse.json({
        success: true,
        results: images.results || []
      })
    } catch (error) {
      console.error('Error fetching images from Baserow:', error)
      
      // Check if it's a table not found error
      if (error instanceof Error && error.message.includes('404')) {
        return NextResponse.json({
          success: true,
          results: [],
          message: 'Images table not found in Baserow.',
          error: 'Table not found'
        })
      }
      
      throw error
    }

  } catch (error) {
    console.error('Error fetching image ideas:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json(
      { error: 'Failed to fetch image ideas', details: errorMessage },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest, { params }: { params: { clientId: string } }) {
  try {
    const clientId = params.clientId
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      )
    }

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

    // Parse form data
    const formData = await request.formData()
    const data: any = {}
    const files: { [key: string]: File } = {}
    
    // Extract form fields and separate files
    for (const [key, value] of formData.entries()) {
      console.log(`API: Processing form field: ${key}, type: ${typeof value}, isFile: ${value instanceof File}`)
      if (key === 'selectedImages' || key === 'uploadedImages') {
        // Handle arrays
        if (!data[key]) data[key] = []
        data[key].push(value)
      } else if (key === 'referenceImage' || key === 'voiceNote') {
        // Handle file uploads - store files separately
        if (value instanceof File) {
          files[key] = value
          console.log(`API: Stored file for ${key}:`, value.name, value.size)
        }
      } else {
        data[key] = value
      }
    }
    
    console.log('API: Extracted data:', data)
    console.log('API: Extracted files:', Object.keys(files))

    // Validate the data
    const validationResult = imageIdeaSchema.safeParse(data)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validationResult.error.issues 
        },
        { status: 400 }
      )
    }

    const baserowAPI = new BaserowAPI(
      clientConfig.baserow.token,
      clientConfig.baserow.databaseId,
      clientConfig.fieldMappings
    )
    
    // Upload files first and get file references
    const fileReferences: { [key: string]: any } = {}
    for (const [key, file] of Object.entries(files)) {
      try {
        const fileUploadResult = await baserowAPI.uploadFile(file)
        fileReferences[key] = fileUploadResult
        console.log(`Uploaded ${key} file:`, fileUploadResult)
      } catch (error) {
        console.error(`Failed to upload ${key} file:`, error)
        return NextResponse.json(
          { error: `Failed to upload ${key} file` },
          { status: 500 }
        )
      }
    }
    
    // Add file references to the data (file fields need to be arrays in Baserow)
    // Filter out fields that don't exist in the Images table
    const { operationType, selectedImages, uploadedImages, ...imagesTableData } = validationResult.data
    const dataWithFiles = {
      ...imagesTableData,
      referenceImage: fileReferences.referenceImage ? [fileReferences.referenceImage] : undefined,
      voiceNote: fileReferences.voiceNote ? [fileReferences.voiceNote] : undefined
    }
    
    console.log('API: File references:', fileReferences)
    console.log('API: Images table data:', imagesTableData)
    console.log('API: Data with files:', dataWithFiles)
    
    // Create image record in Images table (729) instead of separate Image Ideas table
    const createdImage = await baserowAPI.createImage(imagesTableId, dataWithFiles)
    console.log('✅ Image record created:', createdImage.id)

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
          imageIdeaId: createdImage.id,
          imagePrompt: data.imagePrompt || '',
          imageScene: data.imageScene || '',
          imageType: data.imageType || '',
          imageStyle: data.imageStyle || '',
          imageModel: data.imageModel || '',
          imageSize: data.imageSize || '',
          referenceUrl: data.referenceUrl || '',
          operationType: operationType || 'generate',
          imageStatus: data.imageStatus || 'Generating',
          selectedImages: selectedImages || [],
          baserow: {
            tableId: imagesTableId,
            recordId: createdImage.id
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
            console.log('✅ Webhook triggered successfully')
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
      message: 'Image idea created successfully',
      data: createdImage
    })

  } catch (error) {
    console.error('Error creating image idea:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json(
      { error: 'Failed to create image idea', details: errorMessage },
      { status: 500 }
    )
  }
}
