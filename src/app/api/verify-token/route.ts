import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const baseUrl = process.env.BASEROW_API_URL
    const token = process.env.BASEROW_MODERN_MANAGEMENT_TOKEN

    console.log('Verifying token...')
    console.log('Base URL:', baseUrl)
    console.log('Token:', token)

    // Test the user info endpoint to verify token
    const userUrl = `${baseUrl}/api/user/`
    console.log('Testing user endpoint:', userUrl)

    const response = await fetch(userUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json'
      }
    })

    console.log('User endpoint response status:', response.status)

    const responseText = await response.text()
    console.log('Response:', responseText)

    let responseData
    try {
      responseData = JSON.parse(responseText)
    } catch (e) {
      responseData = { error: 'Not JSON', text: responseText }
    }

    return NextResponse.json({
      tokenTest: {
        url: userUrl,
        status: response.status,
        ok: response.ok,
        data: responseData
      },
      config: {
        baseUrl,
        token: token
      }
    })

  } catch (error) {
    console.error('Token verification error:', error)
    return NextResponse.json({
      error: 'Token verification failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}