import { NextRequest, NextResponse } from 'next/server'
import { BaserowAPI } from '@/lib/baserow/api'
import { getClientConfigForAPI } from '@/lib/utils/getClientConfigForAPI'
import { socialMediaContentFormSchema } from '@/lib/types/content'
import { z } from 'zod'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { clientId } = await params
    console.log('GENERAL SOCIAL MEDIA CONTENT API ROUTE: Called for clientId:', clientId)
    console.log('GENERAL SOCIAL MEDIA CONTENT API ROUTE: Request URL:', request.url)
    
    const clientConfig = await getClientConfigForAPI(clientId)

    if (!clientConfig) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    const baserowAPI = new BaserowAPI(
      clientConfig.baserow.token,
      clientConfig.baserow.databaseId,
      clientConfig.fieldMappings
    )
    const socialMediaTableId = clientConfig.baserow.tables.socialMediaContent
    const contentIdeasTableId = clientConfig.baserow.tables.contentIdeas

    if (!socialMediaTableId) {
      return NextResponse.json(
        { error: 'Social Media Content table not configured' },
        { status: 500 }
      )
    }

    // Parse query parameters for filtering
    const url = new URL(request.url)
    const filters: any = {}
    
    // Check if this is a content idea specific request
    const urlPath = request.url
    let contentIdeaId = null
    let contentIdeaMatch = urlPath.match(/\/content-ideas\/(\d+)\/social-media-content/)
    
    if (contentIdeaMatch) {
      contentIdeaId = contentIdeaMatch[1]
    } else {
      // Try alternative pattern
      contentIdeaMatch = urlPath.match(/content-ideas%2F(\d+)%2Fsocial-media-content/)
      if (contentIdeaMatch) {
        contentIdeaId = contentIdeaMatch[1]
      }
    }
    
    if (url.searchParams.get('platform')) {
      filters.platform = url.searchParams.get('platform')
    }
    if (url.searchParams.get('status')) {
      filters.status = url.searchParams.get('status')
    }
    if (url.searchParams.get('contentType')) {
      filters.contentType = url.searchParams.get('contentType')
    }
    if (url.searchParams.get('contentIdea')) {
      filters.contentIdea = url.searchParams.get('contentIdea')
    }
    if (url.searchParams.get('page')) {
      filters.page = parseInt(url.searchParams.get('page') || '1')
    }
    if (url.searchParams.get('size')) {
      filters.size = parseInt(url.searchParams.get('size') || '50')
    }

    let result

    if (contentIdeaId) {
      // Handle content idea specific filtering
      console.log('GENERAL ROUTE: Fetching content idea:', contentIdeaId, 'and its linked social media content')
      console.log('GENERAL ROUTE: Field mappings:', clientConfig.fieldMappings)
      
      try {
        // First, fetch the content idea to get its field_7153 (linked social media content)
        console.log('GENERAL ROUTE: Fetching content idea with ID:', contentIdeaId)
        const contentIdeaResponse = await baserowAPI.getContentIdea(contentIdeasTableId, contentIdeaId)
        
        console.log('GENERAL ROUTE: Content idea response:', contentIdeaResponse)
        
        // Get the social media content field ID from client configuration
        const socialMediaContentFieldId = clientConfig?.fieldMappings?.contentIdeas?.socialmediacontent
        if (!socialMediaContentFieldId) {
          console.error('Social media content field ID not found in client configuration')
          return NextResponse.json({ results: [] })
        }
        
        const fieldKey = `field_${socialMediaContentFieldId}`
        const socialMediaContentField = contentIdeaResponse[fieldKey]
        console.log('GENERAL ROUTE: Using field key:', fieldKey)
        console.log('GENERAL ROUTE: Social media content field:', socialMediaContentField)
        
        if (socialMediaContentField && Array.isArray(socialMediaContentField) && socialMediaContentField.length > 0) {
          // Get the IDs of the linked social media content
          const linkedContentIds = socialMediaContentField.map((item: any) => item.id)
          console.log('GENERAL ROUTE: Linked social media content IDs:', linkedContentIds)
          
          // Fetch the specific social media content posts
          const socialMediaContentIds = linkedContentIds.join(',')
          console.log('GENERAL ROUTE: Fetching social media content with IDs:', socialMediaContentIds)
          result = await baserowAPI.getSocialMediaContent(socialMediaTableId, {
            'filter__id__in': socialMediaContentIds
          })
          
          console.log('GENERAL ROUTE: Fetched linked social media content:', result)
        } else {
          // No linked social media content found
          console.log('GENERAL ROUTE: No social media content linked to this content idea')
          result = { results: [], count: 0 }
        }
      } catch (apiError) {
        console.error('GENERAL ROUTE: Error fetching content idea or social media content:', apiError)
        throw apiError
      }
    } else {
      // Handle general filtering
      console.log('GENERAL ROUTE: Fetching social media content with filters:', filters)
      result = await baserowAPI.getSocialMediaContent(socialMediaTableId, filters)
    }

    // Fetch and populate image data for all posts
    if (result.results && result.results.length > 0) {
      console.log('GENERAL ROUTE: Fetching linked images for', result.results.length, 'posts')
      
      // Debug: Check structure of first post's images field
      if (result.results[0]) {
        console.log('GENERAL ROUTE: Sample post images field:', result.results[0].images)
        console.log('GENERAL ROUTE: Sample post images type:', typeof result.results[0].images)
        console.log('GENERAL ROUTE: Sample post images isArray:', Array.isArray(result.results[0].images))
        if (result.results[0].images && Array.isArray(result.results[0].images) && result.results[0].images.length > 0) {
          console.log('GENERAL ROUTE: Sample first image object:', result.results[0].images[0])
          console.log('GENERAL ROUTE: Sample first image keys:', Object.keys(result.results[0].images[0]))
        }
      }
      
      try {
        // Get the Images table ID from client config
        const imagesTableId = clientConfig.baserow.tables.images
        if (imagesTableId) {
          // Collect all unique image IDs from all posts
          const allImageIds = new Set<number>()
          
          result.results.forEach((post: any, index: number) => {
            // Check both 'images' (camelCase) and potential field ID formats
            const imagesField = post.images || post.Images || post.field_7193
            
            if (imagesField) {
              if (Array.isArray(imagesField)) {
                imagesField.forEach((img: any) => {
                  // Handle different possible structures:
                  // 1. { id: 123, value: 123 } - link reference
                  // 2. { id: 123 } - link reference
                  // 3. Just a number
                  // 4. String ID
                  const imageId = img?.id || img?.value || img
                  if (imageId !== undefined && imageId !== null && imageId !== '') {
                    const numId = typeof imageId === 'string' ? parseInt(imageId, 10) : imageId
                    if (!isNaN(numId) && numId > 0) {
                      allImageIds.add(numId)
                    }
                  }
                })
              } else if (typeof imagesField === 'string' && imagesField.trim() !== '') {
                // Single string ID
                const numId = parseInt(imagesField, 10)
                if (!isNaN(numId) && numId > 0) {
                  allImageIds.add(numId)
                }
              } else if (typeof imagesField === 'number') {
                // Single number ID
                allImageIds.add(imagesField)
              }
            }
          })
          
          if (allImageIds.size > 0) {
            console.log('GENERAL ROUTE: Found', allImageIds.size, 'unique image IDs:', Array.from(allImageIds))
            
            // Fetch all images at once
            const allImagesResult = await baserowAPI.getImages(imagesTableId, {})
            console.log('GENERAL ROUTE: Fetched', allImagesResult.results?.length || 0, 'total images')
            
            // Create a map of image ID to image data for quick lookup
            const imageMap = new Map<number, any>()
            if (allImagesResult.results) {
              allImagesResult.results.forEach((img: any) => {
                const imgId = typeof img.id === 'string' ? parseInt(img.id, 10) : img.id
                if (!isNaN(imgId) && imgId > 0 && allImageIds.has(imgId)) {
                  imageMap.set(imgId, img)
                }
              })
            }
            
            console.log('GENERAL ROUTE: Created image map with', imageMap.size, 'images')
            
            // Replace link references with actual image data in each post
            result.results = result.results.map((post: any) => {
              // Check both 'images' (camelCase) and potential field ID formats
              const imagesField = post.images || post.Images || post.field_7193
              
              if (imagesField) {
                let imageRefs: any[] = []
                
                if (Array.isArray(imagesField)) {
                  imageRefs = imagesField
                } else if (typeof imagesField === 'string' && imagesField.trim() !== '') {
                  imageRefs = [{ id: parseInt(imagesField, 10) }]
                } else if (typeof imagesField === 'number') {
                  imageRefs = [{ id: imagesField }]
                }
                
                if (imageRefs.length > 0) {
                  const fetchedImages = imageRefs
                    .map((imgRef: any) => {
                      const imageId = imgRef?.id || imgRef?.value || imgRef
                      const imgId = typeof imageId === 'string' ? parseInt(imageId, 10) : imageId
                      return imageMap.get(imgId)
                    })
                    .filter((img: any) => img !== undefined && img !== null)
                  
                  if (fetchedImages.length > 0) {
                    return {
                      ...post,
                      images: fetchedImages
                    }
                  }
                }
              }
              return post
            })
            
            console.log('GENERAL ROUTE: Updated posts with image data')
            // Debug: Check structure after update
            if (result.results[0] && result.results[0].images) {
              console.log('GENERAL ROUTE: After update - first post images:', result.results[0].images)
              if (Array.isArray(result.results[0].images) && result.results[0].images.length > 0) {
                console.log('GENERAL ROUTE: After update - first image:', result.results[0].images[0])
                console.log('GENERAL ROUTE: After update - first image has image field:', !!result.results[0].images[0].image)
              }
            }
          } else {
            console.log('GENERAL ROUTE: No images found in posts')
          }
        } else {
          console.log('GENERAL ROUTE: Images table ID not configured')
        }
      } catch (error) {
        console.error('GENERAL ROUTE: Error fetching linked images:', error)
        console.error('GENERAL ROUTE: Error stack:', error instanceof Error ? error.stack : 'No stack')
        // Don't fail the request if image fetching fails, just log the error
      }
    }

    return NextResponse.json({
      success: true,
      contentIdeaId: contentIdeaId,
      count: result.count,
      totalCount: result.count,
      results: result.results,
      next: result.next,
      previous: result.previous
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

export async function POST(
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

    const socialMediaTableId = clientConfig.baserow.tables.socialMediaContent

    if (!socialMediaTableId) {
      return NextResponse.json(
        { error: 'Social Media Content table not configured' },
        { status: 500 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    console.log('Creating social media content with data:', body)

    // Validate the data using Zod schema
    try {
      console.log('Validating data with schema...')
      console.log('Body data:', JSON.stringify(body, null, 2))
      
      // Convert contentIdea to string if it's a number
      if (body.contentIdea && typeof body.contentIdea === 'number') {
        body.contentIdea = String(body.contentIdea)
        console.log('Converted contentIdea from number to string:', body.contentIdea)
      }
      
      // Convert selectedImages array items to strings if they're numbers
      if (body.selectedImages && Array.isArray(body.selectedImages)) {
        body.selectedImages = body.selectedImages.map((id: any) => String(id))
        console.log('Converted selectedImages to strings:', body.selectedImages)
      }
      
      // Convert images array items to strings if they're numbers
      if (body.images && Array.isArray(body.images)) {
        body.images = body.images.map((id: any) => String(id))
        console.log('Converted images to strings:', body.images)
      }
      
      const validatedData = socialMediaContentFormSchema.parse(body)
      console.log('Data validation successful:', validatedData)
      console.log('Validated data keys:', Object.keys(validatedData))
      console.log('Validated data types:', Object.entries(validatedData).map(([k, v]) => `${k}: ${typeof v}`))

      // Check for selectedImages in the original body (not validated)
      const selectedImages = body.selectedImages || validatedData.images || []
      console.log('Selected images for creation:', selectedImages)
      console.log('Selected images type:', typeof selectedImages)
      console.log('Selected images is array?:', Array.isArray(selectedImages))
      
      // Map form field names to API field names
      const apiData = {
        hook: validatedData.hook,
        post: validatedData.post,
        cta: validatedData.cta,
        hashtags: validatedData.hashtags,
        platform: validatedData.platform,
        contenttype: validatedData.contentType,
        imageprompt: validatedData.imagePrompt,
        angle: validatedData.angle,
        intent: validatedData.intent,
        contenttheme: validatedData.contentTheme,
        psychologicaltrigger: validatedData.psychologicalTrigger,
        engagementobjective: validatedData.engagementObjective,
        status: validatedData.status,
        scheduledtime: validatedData.scheduledTime,
        contentidea: validatedData.contentIdea,
        images: selectedImages,
        imagestatus: validatedData.imageStatus
      }
      
      console.log('Mapped API data:', apiData)

      const baserowAPI = new BaserowAPI(
      clientConfig.baserow.token,
      clientConfig.baserow.databaseId,
      clientConfig.fieldMappings
    )
      const result = await baserowAPI.createSocialMediaContent(socialMediaTableId, apiData)

      return NextResponse.json({
        success: true,
        id: result.id,
        data: result
      })

    } catch (validationError) {
      console.error('❌ Validation error type:', validationError)
      console.error('❌ Is ZodError?', validationError instanceof z.ZodError)
      
      if (validationError instanceof z.ZodError) {
        console.error('❌ Validation failed with errors:', validationError.errors)
        console.error('❌ Formatted errors:', JSON.stringify(validationError.errors, null, 2))
        const errorMessages = validationError.errors && Array.isArray(validationError.errors)
          ? validationError.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ')
          : 'Validation failed'
        return NextResponse.json(
          { 
            error: 'Validation failed', 
            details: validationError.errors || [],
            message: errorMessages
          },
          { status: 400 }
        )
      }
      
      // If it's not a ZodError, log it and throw
      console.error('❌ Unexpected validation error:', validationError)
      throw validationError
    }

  } catch (error) {
    console.error('❌ Error creating social media content:', error)
    console.error('❌ Error type:', typeof error)
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    console.error('❌ Error message:', errorMessage)
    return NextResponse.json(
      { error: 'Failed to create social media content', details: errorMessage },
      { status: 500 }
    )
  }
}