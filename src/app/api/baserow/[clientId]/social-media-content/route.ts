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
      const validatedData = socialMediaContentFormSchema.parse(body)
      console.log('Data validation successful:', validatedData)

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
        images: validatedData.images || validatedData.selectedImages,
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
        const errorMessages = validationError.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ')
        return NextResponse.json(
          { 
            error: 'Validation failed', 
            details: validationError.errors,
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
    console.error('Error creating social media content:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json(
      { error: 'Failed to create social media content', details: errorMessage },
      { status: 500 }
    )
  }
}