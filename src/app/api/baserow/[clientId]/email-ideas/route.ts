import { NextRequest, NextResponse } from 'next/server'
import { BaserowAPI } from '@/lib/baserow/api'
import { getClientConfigForAPI } from '@/lib/utils/getClientConfigForAPI'
import { z } from 'zod'

// Validation schema for email idea creation
const emailIdeaSchema = z.object({
  emailIdeaName: z.string().min(1, 'Email idea name is required'),
  emailType: z.string().min(1, 'Email type is required'),
  hook: z.string().optional(),
  cta: z.string().optional(),
  emailTextIdea: z.string().optional(),
  emailVoiceIdea: z.string().optional(),
  emailUrlIdea: z.string().optional(),
  emailVideoIdea: z.string().optional(),
  emailImageIdea: z.string().optional(),
  status: z.string().default('Draft'),
  templates: z.union([z.string(), z.array(z.string()), z.array(z.number())]).optional(),
  generatedHtml: z.string().optional(),
  images: z.union([z.array(z.string()), z.array(z.number())]).optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { clientId } = await params
    console.log('Email Ideas API: Client ID:', clientId)
    
    const clientConfig = await getClientConfigForAPI(clientId)
    console.log('Email Ideas API: Client config found:', !!clientConfig)

    if (!clientConfig) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    console.log('Email Ideas API: Client config tables:', clientConfig.baserow.tables)
    
    const baserowAPI = new BaserowAPI(
      clientConfig.baserow.token,
      clientConfig.baserow.databaseId,
      clientConfig.fieldMappings
    )
    const emailIdeasTableId = clientConfig.baserow.tables.emailIdeas
    console.log('Email Ideas API: Email ideas table ID:', emailIdeasTableId)

    if (!emailIdeasTableId) {
      console.log('Email Ideas API: Email ideas table not configured')
      return NextResponse.json(
        { error: 'Email Ideas table not configured' },
        { status: 500 }
      )
    }

    // Parse query parameters for filtering
    const url = new URL(request.url)
    const filters: any = {}
    
    if (url.searchParams.get('emailType')) {
      filters.emailType = url.searchParams.get('emailType')
    }
    if (url.searchParams.get('status')) {
      filters.status = url.searchParams.get('status')
    }
    if (url.searchParams.get('page')) {
      filters.page = parseInt(url.searchParams.get('page') || '1')
    }
    if (url.searchParams.get('size')) {
      filters.size = parseInt(url.searchParams.get('size') || '50')
    }

    console.log('Fetching email ideas with filters:', filters)

    const result = await baserowAPI.getEmailIdeas(emailIdeasTableId, filters)

    return NextResponse.json({
      success: true,
      count: result.count,
      results: result.results,
      next: result.next,
      previous: result.previous
    })

  } catch (error) {
    console.error('Error fetching email ideas:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json(
      { error: 'Failed to fetch email ideas', details: errorMessage },
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

    const emailIdeasTableId = clientConfig.baserow.tables.emailIdeas

    if (!emailIdeasTableId) {
      return NextResponse.json(
        { error: 'Email Ideas table not configured' },
        { status: 500 }
      )
    }

    // Handle both JSON and FormData for file uploads
    let formData: any = {}
    let uploadedFiles: { [key: string]: File } = {}

    try {
      const contentType = request.headers.get('content-type')
      console.log('Request content type:', contentType)
      
      if (contentType?.includes('multipart/form-data')) {
        // Handle FormData (with files)
        console.log('Processing FormData request...')
        const formDataRequest = await request.formData()
        
        // Extract files
        const fileFields = ['emailVoiceIdea', 'emailVideoIdea', 'emailImageIdea']
        fileFields.forEach(field => {
          const file = formDataRequest.get(field) as File
          if (file) {
            uploadedFiles[field] = file
            console.log(`File extracted for ${field}:`, file.name)
          }
        })
        
        // Extract form fields
        for (const [key, value] of formDataRequest.entries()) {
          if (!fileFields.includes(key)) {
            formData[key] = value
          }
        }
      } else {
        // Handle JSON (no files)
        console.log('Processing JSON request...')
        formData = await request.json()
      }
    } catch (parseError) {
      console.error('Error parsing request:', parseError)
      throw new Error('Failed to parse request data')
    }

    console.log('Creating email idea with data:', formData)

    // Preprocess the data
    const processedData = { ...formData }
    
    // Handle templates field - convert string to array if needed
    if (typeof processedData.templates === 'string') {
      try {
        processedData.templates = JSON.parse(processedData.templates)
      } catch (e) {
        processedData.templates = []
      }
    }

    // Handle images field - if it's an array of image IDs, keep it as is
    // This will be handled by the field mapping to link to the Images table
    if (processedData.images && Array.isArray(processedData.images)) {
      console.log('Processing image IDs:', processedData.images)
    }

    // Validate the data using Zod schema
    try {
      const validatedData = emailIdeaSchema.parse(processedData)
      console.log('Data validation successful:', validatedData)

      // Map form field names to API field names
      const apiData = {
        emailideaname: validatedData.emailIdeaName,
        emailtype: validatedData.emailType,
        hook: validatedData.hook,
        cta: validatedData.cta,
        emailtextidea: validatedData.emailTextIdea,
        emailvoiceidea: validatedData.emailVoiceIdea,
        emailurlidea: validatedData.emailUrlIdea,
        emailvideoidea: validatedData.emailVideoIdea,
        emailimageidea: validatedData.emailImageIdea,
        status: validatedData.status,
        templates: validatedData.templates,
        generatedhtml: validatedData.generatedHtml,
        images: validatedData.images,
        lastmodified: new Date().toISOString().split('T')[0] // Set current date
      }
      
      console.log('Mapped API data:', apiData)

      const baserowAPI = new BaserowAPI(
        clientConfig.baserow.token,
        clientConfig.baserow.databaseId,
        clientConfig.fieldMappings
      )
      
      // Step 1: Create the record
      const result = await baserowAPI.createEmailIdea(emailIdeasTableId, apiData)
      console.log('Email idea record created:', result.id)

      // Step 2: Upload files to Baserow and link them to the record if files provided
      if (Object.keys(uploadedFiles).length > 0) {
        console.log('Uploading files to Baserow...')
        try {
          for (const [fieldName, file] of Object.entries(uploadedFiles)) {
            console.log(`Uploading ${fieldName}:`, file.name, file.size)
            const fileUpload = await baserowAPI.uploadFile(file)
            
            // Update the record with the file reference
            const fileUpdate = { [fieldName]: fileUpload.url }
            await baserowAPI.updateEmailIdea(emailIdeasTableId, result.id, fileUpdate)
            console.log(`${fieldName} uploaded and linked successfully:`, fileUpload.url)
            
            // Include file info in response
            result[fieldName] = fileUpload.url
          }
        } catch (fileError) {
          console.error('File upload failed:', fileError)
          // Don't fail the whole request, just log the error
        }
      }

      return NextResponse.json({
        success: true,
        id: result.id,
        data: result
      })

    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        console.error('Validation error details:', validationError.issues)
        return NextResponse.json(
          { 
            error: 'Validation failed', 
            details: validationError.issues 
          },
          { status: 400 }
        )
      }
      throw validationError
    }

  } catch (error) {
    console.error('Error creating email idea:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json(
      { error: 'Failed to create email idea', details: errorMessage },
      { status: 500 }
    )
  }
}
