import { NextRequest, NextResponse } from 'next/server'
import { BaserowAPI } from '@/lib/baserow/api'
import { getClientConfigForAPI } from '@/lib/utils/getClientConfigForAPI'

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

    const imagesTableId = clientConfig.baserow.tables.images

    if (!imagesTableId) {
      return NextResponse.json(
        { error: 'Images table not configured' },
        { status: 500 }
      )
    }

    console.log('Fetching image:', id)

    const baserowAPI = new BaserowAPI(
      clientConfig.baserow.token,
      clientConfig.baserow.databaseId,
      clientConfig.fieldMappings
    )
    
    // Get single record by filtering with ID
    const result = await baserowAPI.getImages(imagesTableId, { 
      page: 1, 
      size: 1 
    })

    // Find the specific record by ID
    const record = result.results?.find((item: any) => item.id === parseInt(id))

    if (!record) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: record
    })

  } catch (error) {
    console.error('Error fetching image:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json(
      { error: 'Failed to fetch image', details: errorMessage },
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

    const imagesTableId = clientConfig.baserow.tables.images

    if (!imagesTableId) {
      return NextResponse.json(
        { error: 'Images table not configured' },
        { status: 500 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    console.log('Updating image:', id, 'with data:', body)

    try {
      console.log('Raw body data:', body)
      console.log('Body keys:', Object.keys(body))
      console.log('Body values:', Object.entries(body).map(([key, value]) => `${key}: ${typeof value} = ${JSON.stringify(value)}`))
      
      // Prepare data for Baserow using dynamic field mapping
      const baserowAPI = new BaserowAPI(
        clientConfig.baserow.token,
        clientConfig.baserow.databaseId,
        clientConfig.fieldMappings
      )

      console.log('Updating image data for client:', clientId, body)
      console.log('Using field mappings:', clientConfig.fieldMappings?.images)

      // The BaserowAPI will handle the field mapping automatically
      console.log('Data being sent to Baserow:', body)

      const result = await baserowAPI.updateImage(imagesTableId, id, body)

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
      
      return NextResponse.json(
        { 
          error: 'Update failed', 
          details: error instanceof Error ? error.message : 'Unknown error',
          receivedData: body
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error updating image:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json(
      { error: 'Failed to update image', details: errorMessage },
      { status: 500 }
    )
  }
}
