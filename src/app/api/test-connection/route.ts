import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const baseUrl = process.env.BASEROW_API_URL
    const token = process.env.BASEROW_MODERN_MANAGEMENT_TOKEN
    const tableId = process.env.BASEROW_MODERN_MANAGEMENT_CONTENT_IDEAS_TABLE

    console.log('Testing connection with:')
    console.log('Base URL:', baseUrl)
    console.log('Token:', token ? `${token.substring(0, 8)}...` : 'Missing')
    console.log('Table ID:', tableId)

    // Test different authentication formats
    const testUrl = `${baseUrl}/api/database/tables/${tableId}/`
    console.log('Testing URL:', testUrl)

    // Try different auth formats
    const authFormats = [
      `Token ${token}`,
      `Bearer ${token}`,
      token
    ]

    const results = []

    for (const authFormat of authFormats) {
      console.log('Trying auth format:', authFormat.substring(0, 20) + '...')
      
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Authorization': authFormat,
          'Content-Type': 'application/json'
        }
      })

      const responseText = await response.text()
      let responseData
      try {
        responseData = JSON.parse(responseText)
      } catch (e) {
        responseData = { error: 'Not JSON', text: responseText.substring(0, 200) }
      }

      results.push({
        authFormat: authFormat.substring(0, 20) + '...',
        status: response.status,
        ok: response.ok,
        data: responseData
      })

      if (response.ok) break // Stop if we find a working format
    }

    return NextResponse.json({
      config: {
        baseUrl,
        hasToken: !!token,
        tableId,
        fullToken: token // Show full token for debugging
      },
      results: results
    })



  } catch (error) {
    console.error('Connection test error:', error)
    return NextResponse.json({
      error: 'Connection test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}