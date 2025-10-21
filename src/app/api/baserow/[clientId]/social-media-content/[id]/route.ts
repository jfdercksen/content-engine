import { NextRequest, NextResponse } from 'next/server'
import { BaserowAPI } from '@/lib/baserow/api'
import { getClientConfigForAPI } from '@/lib/utils/getClientConfigForAPI'
import { socialMediaContentFormSchema } from '@/lib/types/content'
import { mapSocialMediaContentToBaserow, mapSocialMediaContentFromBaserow } from '@/lib/baserow/fieldMappings'
import { z } from 'zod'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string; id: string }> }
) {
  try {
    const { clientId, id } = await params
    const clientConfig = await getClientConfigForAPI(clientId)

    if (!clientConfig) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    const socialMediaTableId = clientConfig.baserow.tables.socialMediaContent

    if (!socialMediaTableId) {
      return NextResponse.json(
        { error: 'Social Media Content table not configured' },
        { status: 500 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    console.log('=== UPDATE API DEBUG ===')
    console.log('Updating social media content:', id, 'with data:', body)
    console.log('Request headers:', Object.fromEntries(request.headers.entries()))

    // Validate the data using Zod schema (partial update allowed)
    try {
      console.log('Raw body data:', body)
      console.log('Body keys:', Object.keys(body))
      console.log('Body values:', Object.entries(body).map(([key, value]) => `${key}: ${typeof value} = ${JSON.stringify(value)}`))
      
      // Check if selectedImages is present and log it
      if (body.selectedImages) {
        console.log('selectedImages found in body:', body.selectedImages)
      }
      
      // Create a copy of body without selectedImages for validation since it's not in the schema
      const { selectedImages, ...bodyForValidation } = body
      
      // Convert contentIdea to string if it's a number
      if (bodyForValidation.contentIdea && typeof bodyForValidation.contentIdea === 'number') {
        bodyForValidation.contentIdea = String(bodyForValidation.contentIdea)
        console.log('Converted contentIdea from number to string:', bodyForValidation.contentIdea)
      }
      
      console.log('Body for validation (without selectedImages):', bodyForValidation)
      
      // Validate the data using Zod schema (partial update allowed)
      const validatedData = socialMediaContentFormSchema.partial().parse(bodyForValidation)
      console.log('Validated data:', validatedData)

      // Initialize Baserow API with dynamic field mappings
      const baserowAPI = new BaserowAPI(
        clientConfig.baserow.token,
        clientConfig.baserow.databaseId,
        clientConfig.fieldMappings
      )

      console.log('Using dynamic field mappings for client:', clientId)
      console.log('Field mappings available:', !!clientConfig.fieldMappings?.socialMediaContent)

      // Prepare update data - BaserowAPI will handle field mapping automatically
      const updateData = { ...validatedData }
      
      // Handle selectedImages if present
      if (body.selectedImages && Array.isArray(body.selectedImages) && body.selectedImages.length > 0) {
        console.log('Processing selectedImages:', body.selectedImages)
        updateData.images = body.selectedImages
      }
      
      console.log('Data being sent to Baserow:', updateData)
      const result = await baserowAPI.updateSocialMediaContent(socialMediaTableId, id, updateData)

      return NextResponse.json({
        success: true,
        id: result.id,
        data: result
      })

    } catch (error) {
      console.log('=== ERROR IN UPDATE ===')
      console.log('Error type:', typeof error)
      console.log('Error:', error)
      console.log('Error message:', error instanceof Error ? error.message : 'Unknown error')
      console.log('Error stack:', error instanceof Error ? error.stack : 'No stack')
      
      // If it's a Zod validation error, log more details
      if (error && typeof error === 'object' && 'issues' in error) {
        console.log('Zod validation error issues:', (error as any).issues)
      }
      
      return NextResponse.json(
        { 
          error: 'Update failed', 
          details: error instanceof Error ? error.message : 'Unknown error',
          receivedData: body,
          errorType: typeof error
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error updating social media content:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json(
      { error: 'Failed to update social media content', details: errorMessage },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string; id: string }> }
) {
  try {
    const { clientId, id } = await params
    const clientConfig = await getClientConfigForAPI(clientId)

    if (!clientConfig) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    const socialMediaTableId = clientConfig.baserow.tables.socialMediaContent

    if (!socialMediaTableId) {
      return NextResponse.json(
        { error: 'Social Media Content table not configured' },
        { status: 500 }
      )
    }

    console.log('Fetching social media content:', id)

    const baserowAPI = new BaserowAPI(
      clientConfig.baserow.token,
      clientConfig.baserow.databaseId,
      clientConfig.fieldMappings
    )
    
    // Get single record and map it to human-readable field names
    const result = await baserowAPI.getSocialMediaContentById(socialMediaTableId, id)

    console.log('Raw API result:', result)

    if (!result) {
      return NextResponse.json(
        { error: 'Social media content not found' },
        { status: 404 }
      )
    }

    // Map the raw Baserow data to human-readable field names using BaserowAPI
    // Use convertToCamelCase: true for form compatibility
    const record = baserowAPI.mapFieldsFromBaserow(result, 'socialMediaContent', true)

    console.log('Mapped record:', record)
    console.log('Record images field:', record.images)
    console.log('Record keys:', Object.keys(record))

    // If there are linked images, fetch their details
    console.log('=== LINKED IMAGES DEBUG ===')
    console.log('record.images:', record.images)
    console.log('typeof record.images:', typeof record.images)
    console.log('Array.isArray(record.images):', Array.isArray(record.images))
    
    if (record.images) {
      if (typeof record.images === 'string' && record.images.trim() !== '') {
        // If images is a string (ID), convert it to an array with the ID
        console.log('Images field contains string ID:', record.images)
        const imageIds = [parseInt(record.images)]
        record.images = imageIds.map(id => ({ id, value: id }))
        console.log('Converted to array format:', record.images)
      }
      
      if (Array.isArray(record.images) && record.images.length > 0) {
        console.log('Found linked images:', record.images)
      
      try {
        // Get the Images table ID from client config
        const imagesTableId = clientConfig.baserow.tables.images
        if (imagesTableId) {
          // Fetch the linked images by their IDs
          const imageIds = record.images.map((img: any) => img.id || img.value)
          console.log('Fetching images with IDs:', imageIds)
          
          // Fetch all images and filter on our side since Baserow filtering isn't working
          const allImagesResult = await baserowAPI.getImages(imagesTableId, {})
          console.log('All images fetched:', allImagesResult.results?.length || 0)
          
          // Filter to only include the linked images
          const fetchedImages = allImagesResult.results?.filter((img: any) => {
            const isMatch = imageIds.includes(img.id) || imageIds.includes(img.id.toString())
            console.log(`Checking image ${img.id} against imageIds [${imageIds}]: ${isMatch}`)
            return isMatch
          }) || []
          
          console.log('Filtered to linked images:', fetchedImages.map((img: any) => img.id))
          
          console.log('Fetched images for this record:', fetchedImages)
          
          if (fetchedImages.length > 0) {
            // Replace the link references with actual image data
            record.images = fetchedImages
            console.log('Updated record with linked image data:', record)
          }
        }
      } catch (error) {
        console.error('Error fetching linked images:', error)
      }
      }
    }

    return NextResponse.json({
      success: true,
      data: record
    })

  } catch (error) {
    console.error('Error fetching social media content:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json(
      { error: 'Failed to fetch social media content', details: errorMessage },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string; id: string }> }
) {
  try {
    const { clientId, id } = await params
    const clientConfig = await getClientConfigForAPI(clientId)

    if (!clientConfig) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    const socialMediaTableId = clientConfig.baserow.tables.socialMediaContent

    if (!socialMediaTableId) {
      return NextResponse.json(
        { error: 'Social Media Content table not configured' },
        { status: 500 }
      )
    }

    console.log('Deleting social media content:', id)

    const baserowAPI = new BaserowAPI(
      clientConfig.baserow.token,
      clientConfig.baserow.databaseId,
      clientConfig.fieldMappings
    )
    
    await baserowAPI.deleteSocialMediaContent(socialMediaTableId, id)

    return NextResponse.json({
      success: true,
      message: 'Social media content deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting social media content:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json(
      { error: 'Failed to delete social media content', details: errorMessage },
      { status: 500 }
    )
  }
}