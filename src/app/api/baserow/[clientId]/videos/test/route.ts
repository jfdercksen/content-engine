import { NextRequest, NextResponse } from 'next/server'
import { getClientConfigForAPI } from '@/lib/utils/getClientConfigForAPI'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { clientId } = await params
    console.log(`Testing client config for: ${clientId}`)

    const clientConfig = await getClientConfigForAPI(clientId)
    
    if (!clientConfig) {
      return NextResponse.json({
        success: false,
        error: 'Client not found',
        clientId
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      clientId: clientConfig.id,
      name: clientConfig.name,
      hasVideosTable: !!clientConfig.baserow.tables.videos,
      videosTableId: clientConfig.baserow.tables.videos,
      tables: Object.keys(clientConfig.baserow.tables).filter(key => clientConfig.baserow.tables[key as keyof typeof clientConfig.baserow.tables])
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}

