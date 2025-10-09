import { NextRequest, NextResponse } from 'next/server'
import { BaserowAPI } from '@/lib/baserow/api'
import { getClientConfigForAPI } from '@/lib/utils/getClientConfigForAPI'
import { brandAssetFormSchema } from '@/lib/types/content'
import { z } from 'zod'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { clientId } = await params
    console.log('Brand Assets API: Client ID:', clientId)
    
    const clientConfig = await getClientConfigForAPI(clientId)
    console.log('Brand Assets API: Client config found:', !!clientConfig)

    if (!clientConfig) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    console.log('Brand Assets API: Client config tables:', clientConfig.baserow.tables)
    
    const baserowAPI = new BaserowAPI(
      clientConfig.baserow.token,
      clientConfig.baserow.databaseId,
      clientConfig.fieldMappings
    )
    const brandAssetsTableId = clientConfig.baserow.tables.brandAssets
    console.log('Brand Assets API: Brand assets table ID:', brandAssetsTableId)

    if (!brandAssetsTableId) {
      console.log('Brand Assets API: Brand assets table not configured')
      return NextResponse.json(
        { error: 'Brand Assets table not configured' },
        { status: 500 }
      )
    }

    // Parse query parameters for filtering
    const url = new URL(request.url)
    const filters: any = {}
    
    if (url.searchParams.get('platform')) {
      filters.platform = url.searchParams.get('platform')
    }
    if (url.searchParams.get('status')) {
      filters.status = url.searchParams.get('status')
    }
    if (url.searchParams.get('contentType')) {
      filters.contentType = url.searchParams.get('contentType')
    }
    if (url.searchParams.get('assetType')) {
      filters.assetType = url.searchParams.get('assetType')
    }
    if (url.searchParams.get('priority')) {
      filters.priority = url.searchParams.get('priority')
    }
    if (url.searchParams.get('page')) {
      filters.page = parseInt(url.searchParams.get('page') || '1')
    }
    if (url.searchParams.get('size')) {
      filters.size = parseInt(url.searchParams.get('size') || '50')
    }

    console.log('Fetching brand assets with filters:', filters)

    const result = await baserowAPI.getBrandAssets(brandAssetsTableId, filters)

    return NextResponse.json({
      success: true,
      count: result.count,
      results: result.results,
      next: result.next,
      previous: result.previous
    })

  } catch (error) {
    console.error('Error fetching brand assets:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json(
      { error: 'Failed to fetch brand assets', details: errorMessage },
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

    const brandAssetsTableId = clientConfig.baserow.tables.brandAssets

    if (!brandAssetsTableId) {
      return NextResponse.json(
        { error: 'Brand Assets table not configured' },
        { status: 500 }
      )
    }

    // Handle both JSON and FormData for file uploads
    let formData: any = {}
    let uploadedFile: File | null = null

    try {
      const contentType = request.headers.get('content-type')
      console.log('Request content type:', contentType)
      
      if (contentType?.includes('multipart/form-data')) {
        // Handle FormData (with files)
        console.log('Processing FormData request...')
        const formDataRequest = await request.formData()
        
        // Extract file
        uploadedFile = formDataRequest.get('file') as File
        
        console.log('File extracted:', uploadedFile?.name || 'none')
        
        // Extract form fields
        for (const [key, value] of formDataRequest.entries()) {
          if (key !== 'file') {
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

    console.log('Creating brand asset with data:', formData)

    // Validate the data using Zod schema
    try {
      const validatedData = brandAssetFormSchema.parse(formData)
      console.log('Data validation successful:', validatedData)

      // Map form field names to API field names
      const apiData: any = {
        assetname: validatedData.assetName,
        platform: validatedData.platform,
        contenttype: validatedData.contentType,
        assettype: validatedData.assetType,
        status: validatedData.status,
        priority: validatedData.priority
      }
      
      // Only add optional fields if they have values
      if (validatedData.assetInformation) apiData.assetinformation = validatedData.assetInformation
      if (validatedData.brandVoiceGuidelines) apiData.brandvoiceguidelines = validatedData.brandVoiceGuidelines
      if (validatedData.approvedHashtags) apiData.approvedhashtags = validatedData.approvedHashtags
      if (validatedData.forbiddenWordsTopics) apiData['forbiddenwords/topics'] = validatedData.forbiddenWordsTopics
      if (validatedData.platformSpecificRules) apiData['platform-specificrules'] = validatedData.platformSpecificRules
      if (validatedData.notes) apiData.assetnotes = validatedData.notes
      if (validatedData.fileUrl) apiData.fileurl = validatedData.fileUrl
      if (validatedData.file) apiData.file = validatedData.file
      
      console.log('Mapped API data:', apiData)

      const baserowAPI = new BaserowAPI(
        clientConfig.baserow.token,
        clientConfig.baserow.databaseId,
        clientConfig.fieldMappings
      )
      
      // Step 1: Create the record
      const result = await baserowAPI.createBrandAsset(brandAssetsTableId, apiData)
      console.log('Brand asset record created:', result.id)

      // Step 2: Upload file to Baserow and link it to the record if file provided
      if (uploadedFile && uploadedFile.size > 0) {
        console.log('Uploading file to Baserow...', uploadedFile.name, uploadedFile.size)
        try {
          const fileUpload = await baserowAPI.uploadFile(uploadedFile)
          
          // Update the record with the file reference
          const fileUpdate = {
            file: fileUpload.url, // Store file URL
            fileUrl: fileUpload.url // Also store in fileUrl field for easy access
          }
          
          await baserowAPI.updateBrandAsset(brandAssetsTableId, result.id, fileUpdate)
          console.log('File uploaded and linked successfully:', fileUpload.url)
          
          // Include file info in response
          result.file = fileUpload.url
          result.fileUrl = fileUpload.url
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
    console.error('Error creating brand asset:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json(
      { error: 'Failed to create brand asset', details: errorMessage },
      { status: 500 }
    )
  }
}