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

    const socialMediaTableId = clientConfig.baserow.tables.socialMediaContent
    const baserowAPI = new BaserowAPI(clientId)

    // Get table structure
    const structure = await baserowAPI.getTableStructure(socialMediaTableId)
    
    // Get a sample record to see the actual field structure
    const sampleData = await baserowAPI.getSocialMediaContent(socialMediaTableId, { size: 1 })
    
    return NextResponse.json({
      tableId: socialMediaTableId,
      structure: structure,
      sampleRecord: sampleData.results?.[0] || null,
      fieldCount: structure?.length || 0
    })

  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json(
      { error: 'Debug failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

