import { NextRequest, NextResponse } from 'next/server'
import { BaserowAPI } from '@/lib/baserow/api'
import { getClientConfig } from '@/lib/config/clients'

export async function GET(request: NextRequest) {
  try {
    const clientId = 'modern-management'
    const clientConfig = getClientConfig(clientId)
    
    if (!clientConfig) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const baserowAPI = new BaserowAPI(clientId)
    const contentIdeasTableId = clientConfig.baserow.tables.contentIdeas

    console.log('Testing GET with table ID:', contentIdeasTableId)

    // Get raw data first
    const result = await baserowAPI.getContentIdeas(contentIdeasTableId)
    console.log('Raw Baserow result:', JSON.stringify(result, null, 2))

    // Test simple mapping
    const simpleResults = result.results?.map((row: any) => ({
      id: row.id,
      title: row.field_7036 || 'No title',
      raw_data: row
    })) || []

    return NextResponse.json({
      success: true,
      count: result.count || 0,
      rawResults: result.results || [],
      simpleResults: simpleResults
    })

  } catch (error) {
    console.error('Test GET error:', error)
    return NextResponse.json({
      error: 'Test GET failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}