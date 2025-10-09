import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const baseUrl = process.env.BASEROW_API_URL
    const token = process.env.BASEROW_MODERN_MANAGEMENT_TOKEN

    console.log('Testing databases endpoint...')
    console.log('Base URL:', baseUrl)
    console.log('Token:', token)

    // Test different endpoints to find the right API structure
    const endpoints = [
      '/api/applications/',
      '/api/workspaces/',
      '/api/database/applications/',
      '/api/databases/',
      '/api/user/account/',
      '/api/auth/user/'
    ]

    const results = []

    for (const endpoint of endpoints) {
      const testUrl = `${baseUrl}${endpoint}`
      console.log('Testing endpoint:', testUrl)

      try {
        const response = await fetch(testUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Token ${token}`,
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
          endpoint,
          url: testUrl,
          status: response.status,
          ok: response.ok,
          data: responseData
        })

        console.log(`${endpoint}: ${response.status}`)
      } catch (error) {
        results.push({
          endpoint,
          url: testUrl,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      config: {
        baseUrl,
        token: token
      },
      endpointTests: results
    })

  } catch (error) {
    console.error('Database test error:', error)
    return NextResponse.json({
      error: 'Database test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}