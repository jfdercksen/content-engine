import { NextRequest, NextResponse } from 'next/server'
import { BaserowAPI } from '@/lib/baserow/api'
import { getClientConfigForAPI } from '@/lib/utils/getClientConfigForAPI'
import { brandAssetFormSchema } from '@/lib/types/content'
import { z } from 'zod'

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

    const brandAssetsTableId = clientConfig.baserow.tables.brandAssets

    if (!brandAssetsTableId) {
      return NextResponse.json(
        { error: 'Brand Assets table not configured' },
        { status: 500 }
      )
    }

    console.log('Fetching brand asset:', id)

    const baserowAPI = new BaserowAPI(
      clientConfig.baserow.token,
      clientConfig.baserow.databaseId,
      clientConfig.fieldMappings
    )
    
    // Get single record by filtering with ID
    const result = await baserowAPI.getBrandAssets(brandAssetsTableId, { 
      page: 1, 
      size: 1 
    })

    // Find the specific record by ID
    const record = result.results?.find((item: any) => item.id === parseInt(id))

    if (!record) {
      return NextResponse.json(
        { error: 'Brand asset not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: record
    })

  } catch (error) {
    console.error('Error fetching brand asset:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json(
      { error: 'Failed to fetch brand asset', details: errorMessage },
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

    console.log('Updating brand asset:', id, 'with data:', formData)

    // Validate the data using Zod schema (partial update allowed)
    try {
      const validatedData = brandAssetFormSchema.partial().parse(formData)
      console.log('Data validation successful:', validatedData)

      const baserowAPI = new BaserowAPI(
      clientConfig.baserow.token,
      clientConfig.baserow.databaseId,
      clientConfig.fieldMappings
    )
      
      // Step 1: Update the record with form data
      const result = await baserowAPI.updateBrandAsset(brandAssetsTableId, id, validatedData)
      console.log('Brand asset record updated:', result.id)

      // Step 2: Upload new file if provided
      if (uploadedFile && uploadedFile.size > 0) {
        console.log('Uploading new file to Baserow...', uploadedFile.name, uploadedFile.size)
        try {
          const fileUpload = await baserowAPI.uploadFile(uploadedFile)
          
          // Update the record with the new file reference
          const fileUpdate = {
            file: fileUpload.url, // Store file URL
            fileUrl: fileUpload.url // Also store in fileUrl field for easy access
          }
          
          await baserowAPI.updateBrandAsset(brandAssetsTableId, id, fileUpdate)
          console.log('New file uploaded and linked successfully:', fileUpload.url)
          
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
    console.error('Error updating brand asset:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json(
      { error: 'Failed to update brand asset', details: errorMessage },
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

    const brandAssetsTableId = clientConfig.baserow.tables.brandAssets

    if (!brandAssetsTableId) {
      return NextResponse.json(
        { error: 'Brand Assets table not configured' },
        { status: 500 }
      )
    }

    console.log('Deleting brand asset:', id)

    const baserowAPI = new BaserowAPI(
      clientConfig.baserow.token,
      clientConfig.baserow.databaseId,
      clientConfig.fieldMappings
    )
    await baserowAPI.deleteBrandAsset(brandAssetsTableId, id)

    return NextResponse.json({
      success: true,
      message: 'Brand asset deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting brand asset:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json(
      { error: 'Failed to delete brand asset', details: errorMessage },
      { status: 500 }
    )
  }
}