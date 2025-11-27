import { NextRequest, NextResponse } from 'next/server'
import { BaserowAPI } from '@/lib/baserow/api'
import { getClientConfigForAPI } from '@/lib/utils/getClientConfigForAPI'
import { z } from 'zod'

const updateEmailIdeaSchema = z.object({
  generatedHtml: z.string().optional(),
  emailIdeaName: z.string().optional(),
  emailType: z.string().optional(),
  hook: z.string().optional(),
  cta: z.string().optional(),
  emailTextIdea: z.string().optional(),
  emailUrlIdea: z.string().optional(),
  status: z.string().optional(),
  // Mailchimp fields
  subjectLine: z.string().optional(),
  fromName: z.string().optional(),
  fromEmail: z.string().email().optional().or(z.literal('')),
  replyToEmail: z.string().email().optional().or(z.literal('')),
})

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

    const emailIdeasTableId = clientConfig.baserow.tables.emailIdeas

    if (!emailIdeasTableId) {
      return NextResponse.json(
        { error: 'Email Ideas table not configured' },
        { status: 500 }
      )
    }

    const baserowAPI = new BaserowAPI(
      clientConfig.baserow.token,
      clientConfig.baserow.databaseId,
      clientConfig.fieldMappings
    )
    const result = await baserowAPI.getEmailIdeaById(emailIdeasTableId, id)

    if (!result) {
      return NextResponse.json(
        { error: 'Email idea not found' },
        { status: 404 }
      )
    }

    // The result is already mapped by getEmailIdeaById using dynamic field mappings
    // Check for generatedHtml in various possible field name formats (mapped or unmapped)
    const generatedHtml = result.generatedHtml || result.generatedhtml || result.data?.generatedHtml || ''
    
    // Get status from mapped fields
    const status = result.status || result.data?.status || ''
    
    console.log('Email Ideas GET: Returning email idea:', {
      id: result.id,
      hasGeneratedHtml: !!(result.generatedHtml || result.generatedhtml),
      generatedHtmlLength: generatedHtml?.length || 0,
      status: status,
      mappedFieldsCount: Object.keys(result).filter(k => !k.startsWith('field_')).length
    })

    return NextResponse.json({
      success: true,
      id: result.id,
      status: status,
      generatedHtml: generatedHtml,
      // Return the full mapped result so frontend has access to all fields
      data: result
    })

  } catch (error) {
    console.error('❌ Error fetching single email idea:', error)
    
    // Log more details for debugging
    if (error instanceof Error) {
      console.error('Error name:', error.name)
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    const errorDetails = error instanceof Error && error.stack ? error.stack : undefined
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch email idea', 
        details: errorMessage,
        ...(process.env.NODE_ENV === 'development' && errorDetails ? { stack: errorDetails } : {})
      },
      { status: 500 }
    )
  }
}

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

    const emailIdeasTableId = clientConfig.baserow.tables.emailIdeas

    if (!emailIdeasTableId) {
      return NextResponse.json(
        { error: 'Email Ideas table not configured' },
        { status: 500 }
      )
    }

    const body = await request.json()
    
    // Validate the request body
    const validationResult = updateEmailIdeaSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const baserowAPI = new BaserowAPI(
      clientConfig.baserow.token,
      clientConfig.baserow.databaseId,
      clientConfig.fieldMappings
    )
    const result = await baserowAPI.updateEmailIdea(emailIdeasTableId, id, validationResult.data)

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to update email idea' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('Error updating email idea:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json(
      { error: 'Failed to update email idea', details: errorMessage },
      { status: 500 }
    )
  }
}