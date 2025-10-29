import { NextRequest, NextResponse } from 'next/server'
import { BaserowAPI } from '@/lib/baserow/api'
import { getClientConfigForAPI } from '@/lib/utils/getClientConfigForAPI'

export async function GET(
  request: NextRequest,
  { params }: { params: { clientId: string; id: string } }
) {
  try {
    const { clientId, id } = params
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

    const baserowAPI = new BaserowAPI(
      clientConfig.baserow.token,
      clientConfig.baserow.databaseId,
      clientConfig.fieldMappings
    )
    const result = await baserowAPI.getImageById(imagesTableId, id)

    if (!result) {
      return NextResponse.json(
        { error: 'Image idea not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      id: result.id,
      status: result.imageStatus,
      generatedImage: result.image,
      data: result
    })

  } catch (error) {
    console.error('Error fetching single image idea:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json(
      { error: 'Failed to fetch image idea', details: errorMessage },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { clientId: string; id: string } }
) {
  try {
    const { clientId, id } = params
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

    const body = await request.json()
    const baserowAPI = new BaserowAPI(
      clientConfig.baserow.token,
      clientConfig.baserow.databaseId,
      clientConfig.fieldMappings
    )

    // Use dynamic field mapping - BaserowAPI will handle the conversion
    console.log('Updating image idea data for client:', clientId, body)
    console.log('Using field mappings:', clientConfig.fieldMappings?.images)
    // Update the image record using dynamic field mapping
    const updatedImage = await baserowAPI.updateImage(
      imagesTableId,
      id,
      body
    )

    return NextResponse.json({
      success: true,
      message: 'Image idea updated successfully',
      data: updatedImage,
    })
  } catch (error) {
    console.error('Error updating image idea:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json(
      { error: 'Failed to update image idea', details: errorMessage },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { clientId: string; id: string } }
) {
  try {
    const { clientId, id } = params
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

    const baserowAPI = new BaserowAPI(
      clientConfig.baserow.token,
      clientConfig.baserow.databaseId,
      clientConfig.fieldMappings
    )

    console.log('Deleting image idea for client:', clientId, 'ID:', id)
    
    // Delete the image record
    await baserowAPI.deleteImage(imagesTableId, id)

    return NextResponse.json({
      success: true,
      message: 'Image idea deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting image idea:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json(
      { error: 'Failed to delete image idea', details: errorMessage },
      { status: 500 }
    )
  }
}
