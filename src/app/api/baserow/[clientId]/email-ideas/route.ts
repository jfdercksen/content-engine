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

    console.log('=== Raw Form Data Received ===')
    console.log('Form data keys:', Object.keys(formData))
    console.log('Form data:', JSON.stringify(formData, null, 2))

    // Preprocess the data
    const processedData = { ...formData }
    console.log('Processed data keys:', Object.keys(processedData))
    console.log('emailideaname:', processedData.emailideaname)
    console.log('emailtype:', processedData.emailtype)
    console.log('emailIdeaName:', processedData.emailIdeaName)
    console.log('emailType:', processedData.emailType)
    
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

    // Normalize field names to match Zod schema (camelCase)
    // Handle both camelCase and lowercase/snake_case field names from form
    const normalizedData: any = {}
    
    // Required fields - check both formats
    normalizedData.emailIdeaName = processedData.emailIdeaName || processedData.emailideaname || processedData['emailIdeaName'] || ''
    normalizedData.emailType = processedData.emailType || processedData.emailtype || processedData['emailType'] || ''
    
    // Optional fields - check both formats
    if (processedData.emailTextIdea || processedData.emailtextidea || processedData['emailTextIdea']) {
      normalizedData.emailTextIdea = processedData.emailTextIdea || processedData.emailtextidea || processedData['emailTextIdea']
    }
    if (processedData.emailUrlIdea || processedData.emailurlidea || processedData['emailUrlIdea']) {
      normalizedData.emailUrlIdea = processedData.emailUrlIdea || processedData.emailurlidea || processedData['emailUrlIdea']
    }
    if (processedData.emailVoiceIdea || processedData.emailvoiceidea || processedData['emailVoiceIdea']) {
      normalizedData.emailVoiceIdea = processedData.emailVoiceIdea || processedData.emailvoiceidea || processedData['emailVoiceIdea']
    }
    if (processedData.emailVideoIdea || processedData.emailvideoidea || processedData['emailVideoIdea']) {
      normalizedData.emailVideoIdea = processedData.emailVideoIdea || processedData.emailvideoidea || processedData['emailVideoIdea']
    }
    if (processedData.emailImageIdea || processedData.emailimageidea || processedData['emailImageIdea']) {
      normalizedData.emailImageIdea = processedData.emailImageIdea || processedData.emailimageidea || processedData['emailImageIdea']
    }
    if (processedData.hook || processedData['hook']) {
      normalizedData.hook = processedData.hook || processedData['hook']
    }
    if (processedData.cta || processedData['cta']) {
      normalizedData.cta = processedData.cta || processedData['cta']
    }
    normalizedData.status = processedData.status || processedData['status'] || 'Draft'
    if (processedData.templates || processedData['templates']) {
      normalizedData.templates = processedData.templates || processedData['templates']
    }
    if (processedData.generatedHtml || processedData.generatedhtml || processedData['generatedHtml']) {
      normalizedData.generatedHtml = processedData.generatedHtml || processedData.generatedhtml || processedData['generatedHtml']
    }
    if (processedData.images || processedData['images']) {
      normalizedData.images = processedData.images || processedData['images']
    }
    
    console.log('Processed data (raw):', processedData)
    console.log('Normalized data for validation:', normalizedData)
    
    // Validate the data using Zod schema
    try {
      const validatedData = emailIdeaSchema.parse(normalizedData)
      console.log('Data validation successful:', validatedData)

      // Map simplified email types to Baserow's full format
      const emailTypeMap: Record<string, string> = {
        'Welcome': 'Welcome & Onboarding Emails',
        'Promotional': 'Promotional Emails',
        'Newsletter': 'Newsletter / Content Emails'
      }
      
      const baserowEmailType = emailTypeMap[validatedData.emailType] || validatedData.emailType
      
      console.log(`Mapping email type: "${validatedData.emailType}" -> "${baserowEmailType}"`)
      
      // Map form field names to API field names
      // Only include fields with actual values - skip empty strings and empty arrays
      const apiData: any = {
        emailideaname: validatedData.emailIdeaName,
        emailtype: baserowEmailType, // Use mapped email type
        emailtextidea: validatedData.emailTextIdea || '',
        status: validatedData.status || 'Draft',
        lastmodified: new Date().toISOString().split('T')[0] // Set current date
      }
      
      // Only include optional fields if they have values
      if (validatedData.hook && validatedData.hook.trim() !== '') {
        apiData.hook = validatedData.hook
      }
      if (validatedData.cta && validatedData.cta.trim() !== '') {
        apiData.cta = validatedData.cta
      }
      if (validatedData.emailUrlIdea && validatedData.emailUrlIdea.trim() !== '') {
        apiData.emailurlidea = validatedData.emailUrlIdea
      }
      if (validatedData.emailVoiceIdea && validatedData.emailVoiceIdea.trim() !== '') {
        apiData.emailvoiceidea = validatedData.emailVoiceIdea
      }
      if (validatedData.emailVideoIdea && validatedData.emailVideoIdea.trim() !== '') {
        apiData.emailvideoidea = validatedData.emailVideoIdea
      }
      if (validatedData.emailImageIdea && validatedData.emailImageIdea.trim() !== '') {
        apiData.emailimageidea = validatedData.emailImageIdea
      }
      if (validatedData.generatedHtml && validatedData.generatedHtml.trim() !== '') {
        apiData.generatedhtml = validatedData.generatedHtml
      }
      // Only include templates/images if they have values (arrays with items)
      if (validatedData.templates && Array.isArray(validatedData.templates) && validatedData.templates.length > 0) {
        apiData.templates = validatedData.templates
      }
      if (validatedData.images && Array.isArray(validatedData.images) && validatedData.images.length > 0) {
        apiData.images = validatedData.images
      }
      
      console.log('=== Email Idea Creation Debug ===')
      console.log('API Data being sent to Baserow:', JSON.stringify(apiData, null, 2))
      console.log('Email Ideas Table ID:', emailIdeasTableId)
      console.log('Field Mappings:', clientConfig.fieldMappings?.emailIdeas)
      
      const baserowAPI = new BaserowAPI(
        clientConfig.baserow.token,
        clientConfig.baserow.databaseId,
        clientConfig.fieldMappings
      )
      
      // Step 1: Create the record
      let result
      try {
        result = await baserowAPI.createEmailIdea(emailIdeasTableId, apiData)
        console.log('✅ Email idea record created:', result.id)

      } catch (baserowError: any) {
        console.error('❌ === Baserow API Error ===')
        console.error('Error creating email idea:', baserowError)
        console.error('Error message:', baserowError.message)
        console.error('Error stack:', baserowError.stack)
        
        // Extract detailed error information if available
        const errorMatch = baserowError.message?.match(/Field errors: (.+)/)
        if (errorMatch) {
          console.error('Field-specific errors:', errorMatch[1])
        }
        
        // Re-throw the original error to preserve the full error message
        throw baserowError
      }

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
