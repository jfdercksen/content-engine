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

    const keywordResearchTableId = clientConfig.baserow.tables.keywordResearch
    if (!keywordResearchTableId) {
      return NextResponse.json({ error: 'Keyword Research table not found' }, { status: 404 })
    }

    // Get the Baserow API instance
    const { BaserowAPI } = await import('@/lib/baserow/api')
    const baserow = new BaserowAPI(
      clientConfig.baserow.token,
      clientConfig.baserow.databaseId,
      clientConfig.fieldMappings
    )
    
    // Fetch keyword research from Baserow
    const keywordResearch = await baserow.getRows(keywordResearchTableId)
    
    return NextResponse.json({
      success: true,
      count: keywordResearch.results?.length || 0,
      results: keywordResearch.results || []
    })

  } catch (error) {
    console.error('Error fetching keyword research:', error)
    return NextResponse.json(
      { error: 'Failed to fetch keyword research' },
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

    const keywordResearchTableId = clientConfig.baserow.tables.keywordResearch
    if (!keywordResearchTableId) {
      return NextResponse.json({ error: 'Keyword Research table not found' }, { status: 404 })
    }

    const body = await request.json()
    
    // Get the Baserow API instance
    const { BaserowAPI } = await import('@/lib/baserow/api')
    const baserow = new BaserowAPI(
      clientConfig.baserow.token,
      clientConfig.baserow.databaseId,
      clientConfig.fieldMappings
    )
    
    // Create keyword research in Baserow
    const keywordResearch = await baserow.createRow(keywordResearchTableId, body)
    
    return NextResponse.json({
      success: true,
      keywordResearch
    })

  } catch (error) {
    console.error('Error creating keyword research:', error)
    return NextResponse.json(
      { error: 'Failed to create keyword research' },
      { status: 500 }
    )
  }
}
