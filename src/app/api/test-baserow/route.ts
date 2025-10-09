import { NextRequest, NextResponse } from 'next/server'
import { BaserowAPI } from '@/lib/baserow/api'
import { getClientConfig } from '@/lib/config/clients'

export async function GET(request: NextRequest) {
  try {
    const clientId = 'modern-management' // Test with modern-management
    const clientConfig = getClientConfig(clientId)

    if (!clientConfig) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const baserowAPI = new BaserowAPI(clientId)
    const contentIdeasTableId = clientConfig.baserow.tables.contentIdeas

    // Test connection and get table structure
    const structure = await baserowAPI.getTableStructure(contentIdeasTableId)
    
    // Test creating a simple record
    const testData = {
      "title": "Test Content Idea",
      "Idea Type": "blog_post",
      "Target Audience": "b2b_decision_makers",
      "Priority": "Medium",
      "status": "Idea"
    }

    const createResult = await baserowAPI.createContentIdea(contentIdeasTableId, testData)

    return NextResponse.json({
      success: true,
      config: {
        tableId: contentIdeasTableId,
        baseUrl: process.env.BASEROW_API_URL,
        hasToken: !!clientConfig.baserow.token,
        databaseId: clientConfig.baserow.databaseId
      },
      structure: structure,
      testCreate: createResult
    })

  } catch (error) {
    console.error('Baserow test error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({
      error: 'Baserow test failed',
      details: errorMessage,
      config: {
        baseUrl: process.env.BASEROW_API_URL,
        tableId: process.env.BASEROW_MODERN_MANAGEMENT_CONTENT_IDEAS_TABLE
      }
    }, { status: 500 })
  }
}