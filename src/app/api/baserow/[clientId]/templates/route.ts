import { NextRequest, NextResponse } from 'next/server'
import { BaserowAPI } from '@/lib/baserow/api'
import { getClientConfigForAPI } from '@/lib/utils/getClientConfigForAPI'
import { z } from 'zod'

// Validation schema for template creation
const templateSchema = z.object({
  templateName: z.string().min(1, 'Template name is required'),
  templateType: z.string().min(1, 'Template type is required'),
  templateCategory: z.string().min(1, 'Template category is required'),
  htmlTemplate: z.string().min(1, 'HTML template is required'),
  cssStyles: z.string().optional(),
  isActive: z.boolean().default(true)
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { clientId } = await params
    console.log('Templates API: Client ID:', clientId)
    
    const clientConfig = await getClientConfigForAPI(clientId)
    console.log('Templates API: Client config found:', !!clientConfig)

    if (!clientConfig) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    console.log('Templates API: Client config tables:', clientConfig.baserow.tables)
    
    const baserowAPI = new BaserowAPI(
      clientConfig.baserow.token,
      clientConfig.baserow.databaseId,
      clientConfig.fieldMappings
    )
    const templatesTableId = clientConfig.baserow.tables.templates
    console.log('Templates API: Templates table ID:', templatesTableId)

    if (!templatesTableId) {
      console.log('Templates API: Templates table not configured')
      return NextResponse.json(
        { error: 'Templates table not configured' },
        { status: 500 }
      )
    }

    // Parse query parameters for filtering
    const url = new URL(request.url)
    const filters: any = {}
    
    if (url.searchParams.get('templateType')) {
      filters.templateType = url.searchParams.get('templateType')
    }
    if (url.searchParams.get('templateCategory')) {
      filters.templateCategory = url.searchParams.get('templateCategory')
    }
    if (url.searchParams.get('isActive') !== null) {
      filters.isActive = url.searchParams.get('isActive') === 'true'
    }
    if (url.searchParams.get('page')) {
      filters.page = parseInt(url.searchParams.get('page') || '1')
    }
    if (url.searchParams.get('size')) {
      filters.size = parseInt(url.searchParams.get('size') || '50')
    }

    console.log('Fetching templates with filters:', filters)

    const result = await baserowAPI.getTemplates(templatesTableId, filters)

    return NextResponse.json({
      success: true,
      count: result.count,
      results: result.results,
      next: result.next,
      previous: result.previous
    })

  } catch (error) {
    console.error('Error fetching templates:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json(
      { error: 'Failed to fetch templates', details: errorMessage },
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

    const templatesTableId = clientConfig.baserow.tables.templates

    if (!templatesTableId) {
      return NextResponse.json(
        { error: 'Templates table not configured' },
        { status: 500 }
      )
    }

    // Parse JSON request
    let formData: any = {}
    try {
      formData = await request.json()
    } catch (parseError) {
      console.error('Error parsing request:', parseError)
      throw new Error('Failed to parse request data')
    }

    console.log('Creating template with data:', formData)

    // Validate the data using Zod schema
    try {
      const validatedData = templateSchema.parse(formData)
      console.log('Data validation successful:', validatedData)

      // Map form field names to API field names
      const apiData = {
        templatename: validatedData.templateName,
        templatetype: validatedData.templateType,
        templatecategory: validatedData.templateCategory,
        htmltemplate: validatedData.htmlTemplate,
        cssstyles: validatedData.cssStyles,
        isactive: validatedData.isActive
      }
      
      console.log('Mapped API data:', apiData)

      const baserowAPI = new BaserowAPI(
      clientConfig.baserow.token,
      clientConfig.baserow.databaseId,
      clientConfig.fieldMappings
    )
      
      // Create the template record
      const result = await baserowAPI.createTemplate(templatesTableId, apiData)
      console.log('Template record created:', result.id)

      return NextResponse.json({
        success: true,
        id: result.id,
        data: result
      })

    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          { 
            error: 'Validation failed', 
            details: validationError.errors 
          },
          { status: 400 }
        )
      }
      throw validationError
    }

  } catch (error) {
    console.error('Error creating template:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json(
      { error: 'Failed to create template', details: errorMessage },
      { status: 500 }
    )
  }
}
