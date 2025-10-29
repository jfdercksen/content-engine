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
  referenceUrl: z.string().optional(),
  referenceImage: z.array(z.any()).optional(), // File upload field
  voiceNote: z.any().optional(), // Voice note file upload field
  useReferenceImage: z.boolean().optional(),
  operationType: z.enum(['generate', 'combine', 'edit', 'browse']).default('generate').optional(),
  selectedImages: z.array(z.string()).optional(),
  uploadedImages: z.array(z.any()).optional(), // File upload field
  imageStatus: z.string().default('Generating').optional(),
  // Caption fields
  useCaptions: z.boolean().optional(),
  captionText: z.string().optional(),
  captionFontStyle: z.string().optional(),
  captionFontSize: z.string().optional(),
  captionPosition: z.string().optional(),
  // Social media context fields (for when called from social media posts)
  source: z.string().optional(),
  socialMediaContent: z.union([z.string(), z.number(), z.null()]).optional(),
  isNewPost: z.boolean().optional(),
  contentIdea: z.union([z.string(), z.number(), z.null()]).optional(),
  postContent: z.string().optional(),
  hookContent: z.string().optional(),
  combinedContent: z.string().optional(),
  platform: z.string().optional(),
  contentType: z.string().optional()
})

export async function GET(request: NextRequest, { params }: { params: Promise<{ clientId: string }> }) {
  try {
    const { clientId } = await params
    
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

export async function POST(request: NextRequest, { params }: { params: Promise<{ clientId: string }> }) {
  try {
    const { clientId } = await params
    
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

    // Parse request data based on content type
    const contentType = request.headers.get('content-type') || ''
    let data: any = {}
    let files: { [key: string]: File } = {}
    
    if (contentType.includes('application/json')) {
      // Handle JSON requests (for image generation)
      data = await request.json()
      console.log('API: Received JSON data:', data)
    } else if (contentType.includes('multipart/form-data')) {
      // Handle FormData requests (for file uploads)
      const formData = await request.formData()
      
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
        } else if (key === 'useCaptions' || key === 'isNewPost' || key === 'useReferenceImage') {
          // Handle boolean fields
          data[key] = value === 'true'
        } else {
          data[key] = value
        }
      }
    } else {
      return NextResponse.json(
        { error: 'Unsupported content type. Expected application/json or multipart/form-data' },
        { status: 400 }
      )
    }
    
    console.log('API: Extracted data:', data)
    console.log('API: Extracted files:', Object.keys(files))

    // Validate the data
    const validationResult = imageIdeaSchema.safeParse(data)
    if (!validationResult.success) {
      console.log('❌ Validation failed with errors:', validationResult.error.issues)
      console.log('❌ Data being validated:', JSON.stringify(data, null, 2))
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
    
    // Extract fields from validated data first
    const { operationType, selectedImages, uploadedImages, ...imagesTableData } = validationResult.data
    
    // Upload files first and get file references
    const fileReferences: { [key: string]: any } = {}
    const uploadedImageReferences: any[] = []
    
    // Handle single file uploads (referenceImage, voiceNote)
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
    
    // Handle uploaded images array (for combine/edit operations)
    if (uploadedImages && uploadedImages.length > 0) {
      console.log(`Uploading ${uploadedImages.length} images for combine/edit operation`)
      for (const imageFile of uploadedImages) {
        try {
          const imageUploadResult = await baserowAPI.uploadFile(imageFile)
          uploadedImageReferences.push(imageUploadResult)
          console.log(`Uploaded image:`, imageUploadResult)
        } catch (error) {
          console.error(`Failed to upload image:`, error)
          return NextResponse.json(
            { error: `Failed to upload image: ${imageFile.name}` },
            { status: 500 }
          )
        }
      }
    }
    console.log('API: File references:', fileReferences)
    console.log('API: Uploaded image references:', uploadedImageReferences)
    console.log('API: Images table data:', imagesTableData)
    
    let createdImages = []
    let targetRecord = null
    
    // If there are uploaded images, create separate records for each image
    if (uploadedImageReferences.length > 0) {
      console.log(`Creating ${uploadedImageReferences.length} separate records for uploaded images`)
      
      for (let i = 0; i < uploadedImageReferences.length; i++) {
        const imageReference = uploadedImageReferences[i]
        const dataWithFiles = {
          ...imagesTableData,
          referenceImage: fileReferences.referenceImage ? [fileReferences.referenceImage] : undefined,
          voiceNote: fileReferences.voiceNote ? [fileReferences.voiceNote] : undefined,
          // Store each uploaded image in its own record
          image: [imageReference]
        }
        
        console.log(`Creating record ${i + 1} for image:`, imageReference)
        const createdImage = await baserowAPI.createImage(imagesTableId, dataWithFiles)
        createdImages.push(createdImage)
        console.log(`✅ Image record ${i + 1} created:`, createdImage.id)
      }
      
      // Create a target record for the workflow to store the final generated/combined image
      console.log('Creating target record for workflow to store final generated image')
      const targetDataWithFiles = {
        ...imagesTableData,
        referenceImage: fileReferences.referenceImage ? [fileReferences.referenceImage] : undefined,
        voiceNote: fileReferences.voiceNote ? [fileReferences.voiceNote] : undefined,
        // No image field - this will be populated by the workflow
        imageStatus: 'Generating' // Ensure it's marked as generating
      }
      
      console.log('Creating target record with data:', targetDataWithFiles)
      targetRecord = await baserowAPI.createImage(imagesTableId, targetDataWithFiles)
      createdImages.push(targetRecord)
      console.log(`✅ Target record created for workflow:`, targetRecord.id)
      
    } else {
      // No uploaded images, create a single record (this is the target record)
      const dataWithFiles = {
        ...imagesTableData,
        referenceImage: fileReferences.referenceImage ? [fileReferences.referenceImage] : undefined,
        voiceNote: fileReferences.voiceNote ? [fileReferences.voiceNote] : undefined
      }
      
      console.log('API: Data with files:', dataWithFiles)
      const createdImage = await baserowAPI.createImage(imagesTableId, dataWithFiles)
      createdImages.push(createdImage)
      targetRecord = createdImage // This is also the target record
      console.log('✅ Image record created:', createdImage.id)
    }
    
    // Use the target record for webhook (this is where the workflow will store the final result)
    const createdImage = targetRecord

    // Trigger n8n webhook for image generation
    try {
      const { getWebhookUrl } = await import('@/lib/utils/getWebhookUrl')
      const webhookUrl = await getWebhookUrl(clientId, 'image_generator')
      
      if (!webhookUrl) {
        console.warn('⚠️ Image generator webhook not configured, skipping webhook call')
      } else {
        console.log('📡 Triggering image generation webhook:', webhookUrl)
        
        // Prepare base payload for n8n
        const basePayload = {
          client_id: clientId,
          base_id: clientConfig.baserow.databaseId,
          table_id: imagesTableId,
          event: 'image_generation',
          timestamp: new Date().toISOString(),
          clientId: clientId,
          client: {
            name: clientConfig.displayName || clientId,
            id: clientId
          },
          tables: {
            images: {
              id: imagesTableId,
              recordId: createdImage.id,
              allRecordIds: createdImages.map(img => img.id),
              targetRecordId: targetRecord.id,
              uploadedImageRecordIds: createdImages.filter(img => img.id !== targetRecord.id).map(img => img.id)
            }
          },
          baserow: {
            databaseId: clientConfig.baserow.databaseId,
            token: clientConfig.baserow.token,
            tableId: imagesTableId,
            recordId: createdImage.id,
            allRecordIds: createdImages.map(img => img.id),
            targetRecordId: targetRecord.id,
            uploadedImageRecordIds: createdImages.filter(img => img.id !== targetRecord.id).map(img => img.id)
          },
          fieldMappings: clientConfig.fieldMappings,
          image: {
            imagePrompt: data.imagePrompt || '',
            imageScene: data.imageScene || '',
            imageType: data.imageType || '',
            imageStyle: data.imageStyle || '',
            imageModel: data.imageModel || '',
            imageSize: data.imageSize || '',
            referenceUrl: data.referenceUrl || '',
            operationType: operationType || 'generate',
            notes: data.notes || null,
            imageStatus: data.imageStatus || 'Generating',
            selectedImages: selectedImages || [],
            uploadedImages: uploadedImages || [],
            referenceImageData: fileReferences.referenceImage || null,
            voiceNoteData: fileReferences.voiceNote || null,
            uploadedImageReferences: uploadedImageReferences || [],
            // Target record information for workflow
            targetRecordId: targetRecord.id,
            uploadedImageRecordIds: createdImages.filter(img => img.id !== targetRecord.id).map(img => img.id),
            hasUploadedImages: uploadedImageReferences.length > 0
          },
          metadata: {
            createdAt: new Date().toISOString(),
            source: 'content-engine-app',
            version: '1.0',
            contentType: 'image-idea'
          }
        }

        // Add source identifier to metadata
        const finalPayload = {
          ...basePayload,
          metadata: {
            ...basePayload.metadata,
            source: data.source || 'image_ideas'
          }
        }

        console.log('🔍 Debug: data.source =', data.source)
        console.log('🔍 Debug: finalPayload.metadata.source =', finalPayload.metadata.source)

        // Only add social media specific fields if this is for a social media post
        if (data.source === 'social_media_post') {
          console.log('🔍 Adding social media context fields to webhook payload')
          // Add social media context to the image object
          Object.assign(finalPayload.image, {
            socialMediaContent: data.socialMediaContent || null,
            isNewPost: data.isNewPost === 'true' || data.isNewPost === true,
            contentIdea: data.contentIdea || null,
            postContent: data.postContent || '',
            hookContent: data.hookContent || '',
            combinedContent: data.combinedContent || '',
            platform: data.platform || '',
            contentType: data.contentType || ''
          })
          
          // Update metadata to reflect social media content
          finalPayload.metadata.contentType = 'social-media-image'
        }

        console.log('🔍 Final webhook payload:', JSON.stringify(finalPayload, null, 2))
        
        // Call webhook asynchronously (fire-and-forget)
        fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(finalPayload)
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
