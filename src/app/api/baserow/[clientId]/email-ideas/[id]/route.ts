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

    return NextResponse.json({
      success: true,
      id: result.id,
      status: result.status,
      generatedHtml: result.generatedHtml,
      data: result
    })

  } catch (error) {
    console.error('Error fetching single email idea:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json(
      { error: 'Failed to fetch email idea', details: errorMessage },
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