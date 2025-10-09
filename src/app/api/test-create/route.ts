import { NextRequest, NextResponse } from 'next/server'
import { BaserowAPI } from '@/lib/baserow/api'
import { getClientConfig } from '@/lib/config/clients'

export async function POST(request: NextRequest) {
  try {
    const clientId = 'modern-management'
    const clientConfig = getClientConfig(clientId)
    
    if (!clientConfig) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const baserowAPI = new BaserowAPI(clientId)
    const contentIdeasTableId = clientConfig.baserow.tables.contentIdeas

    // Test with minimal required data
    const testData = {
      "Title": "Test Title from API"
    }

    console.log('Sending test data to Baserow:', testData)
    console.log('Table ID:', contentIdeasTableId)
    console.log('API URL:', process.env.BASEROW_API_URL)

    const result = await baserowAPI.createContentIdea(contentIdeasTableId, testData)
    console.log('Baserow response:', result)

    return NextResponse.json({
      success: true,
      sentData: testData,
      result: result
    })

  } catch (error) {
    console.error('Test create error:', error)
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const clientId = 'modern-management'
    const clientConfig = getClientConfig(clientId)
    
    if (!clientConfig) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const baserowAPI = new BaserowAPI(clientId)
    const contentIdeasTableId = clientConfig.baserow.tables.contentIdeas

    // Test with all field types
    const testData = {
      "Title": "Full Test " + Date.now(),
      "Idea Type": "Blog Post",
      "Description": "This is a test description",
      "Source Type": "Manual", 
      "Target Audience": "B2B Decision Makers",
      "Priority": "Medium",
      "status": "Idea"
    }

    console.log('Sending full test data to Baserow:', testData)

    const result = await baserowAPI.createContentIdea(contentIdeasTableId, testData)
    console.log('Baserow response:', result)

    return NextResponse.json({
      success: true,
      sentData: testData,
      result: result
    })

  } catch (error) {
    console.error('Full test error:', error)
    return NextResponse.json({
      error: 'Full test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}