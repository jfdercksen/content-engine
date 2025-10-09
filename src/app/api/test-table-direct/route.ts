import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const baseUrl = process.env.BASEROW_API_URL
    const token = process.env.BASEROW_MODERN_MANAGEMENT_TOKEN
    const tableId = process.env.BASEROW_MODERN_MANAGEMENT_CONTENT_IDEAS_TABLE

    // Try different table access patterns
    const tableEndpoints = [
      `/api/database/rows/table/${tableId}/`,
      `/api/database/tables/${tableId}/`,
      `/api/tables/${tableId}/`,
      `/api/table/${tableId}/rows/`,
      `/database/rows/table/${tableId}/`,
      `/database/tables/${tableId}/`
    ]

    const results = []

    for (const endpoint of tableEndpoints) {
      const testUrl = `${baseUrl}${endpoint}`
      console.log('Testing table endpoint:', testUrl)

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
          data: response.ok ? responseData : { error: responseData }
        })

        if (response.ok) {
          console.log(`SUCCESS: ${endpoint} works!`)
          break // Stop on first success
        }
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
        tableId,
        hasToken: !!token
      },
      tableTests: results
    })

  } catch (error) {
    console.error('Table test error:', error)
    return NextResponse.json({
      error: 'Table test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}