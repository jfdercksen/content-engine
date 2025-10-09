import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug Environment Variables:')
    console.log('BASEROW_API_URL:', process.env.BASEROW_API_URL)
    console.log('BASEROW_MODERN_MANAGEMENT_TOKEN:', process.env.BASEROW_MODERN_MANAGEMENT_TOKEN)
    console.log('BASEROW_MODERN_MANAGEMENT_DATABASE_ID:', process.env.BASEROW_MODERN_MANAGEMENT_DATABASE_ID)
    
    return NextResponse.json({
      BASEROW_API_URL: process.env.BASEROW_API_URL,
      BASEROW_MODERN_MANAGEMENT_TOKEN: process.env.BASEROW_MODERN_MANAGEMENT_TOKEN ? 'SET' : 'NOT SET',
      BASEROW_MODERN_MANAGEMENT_DATABASE_ID: process.env.BASEROW_MODERN_MANAGEMENT_DATABASE_ID,
      allBaserowVars: Object.keys(process.env).filter(key => key.includes('BASEROW')),
      nodeEnv: process.env.NODE_ENV
    })
  } catch (error) {
    console.error('Debug env error:', error)
    return NextResponse.json({
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
