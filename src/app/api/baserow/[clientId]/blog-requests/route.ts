import { NextRequest, NextResponse } from 'next/server'
import { getClientConfigForAPI } from '@/lib/utils/getClientConfigForAPI'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { clientId } = await params
    const clientConfig = await getClientConfigForAPI(clientId)
    
    if (!clientConfig) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const blogRequestsTableId = clientConfig.baserow.tables.blogRequests
    if (!blogRequestsTableId) {
      return NextResponse.json({ error: 'Blog Requests table not found' }, { status: 404 })
    }

    // Get the Baserow API instance
    const { BaserowAPI } = await import('@/lib/baserow/api')
    const baserow = new BaserowAPI(
      clientConfig.baserow.token,
      clientConfig.baserow.databaseId,
      clientConfig.fieldMappings
    )
    
    // Fetch blog requests from Baserow
    const blogRequests = await baserow.getRows(blogRequestsTableId)
    
    return NextResponse.json({
      success: true,
      count: blogRequests.results?.length || 0,
      results: blogRequests.results || []
    })

  } catch (error) {
    console.error('Error fetching blog requests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch blog requests' },
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
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const blogRequestsTableId = clientConfig.baserow.tables.blogRequests
    if (!blogRequestsTableId) {
      return NextResponse.json({ error: 'Blog Requests table not found' }, { status: 404 })
    }

    const body = await request.json()
    
    // Get the Baserow API instance
    const { BaserowAPI } = await import('@/lib/baserow/api')
    const baserow = new BaserowAPI(
      clientConfig.baserow.token,
      clientConfig.baserow.databaseId,
      clientConfig.fieldMappings
    )
    
    // Create blog request in Baserow
    const blogRequest = await baserow.createRow(blogRequestsTableId, body)
    
    return NextResponse.json({
      success: true,
      blogRequest
    })

  } catch (error) {
    console.error('Error creating blog request:', error)
    return NextResponse.json(
      { error: 'Failed to create blog request' },
      { status: 500 }
    )
  }
}
