import { NextRequest, NextResponse } from 'next/server'
import { DynamicClientConfig } from '@/lib/config/dynamicClients'
import { DatabaseClientConfig } from '@/lib/config/databaseClientConfig'
import { BaserowAPI } from '@/lib/baserow/api'
import { EnvironmentManager } from '@/lib/config/environmentManager'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    // Get all clients from database (production) or file (development)
    let clients = await DatabaseClientConfig.getAllClients()
    
    // Fallback to file-based config if database is empty (development)
    if (clients.length === 0) {
      console.log('⚠️ No clients in database, falling back to file-based config')
      await DynamicClientConfig.initialize()
      clients = DynamicClientConfig.getAllClients()
    }
    
    // Transform the data to match the expected format
    const formattedClients = clients.map(client => ({
      id: client.id,
      name: client.name,
      displayName: client.displayName,
      baserowDatabaseId: client.baserowDatabaseId,
      isActive: client.isActive,
      createdAt: client.createdAt instanceof Date ? client.createdAt.toISOString() : new Date().toISOString(),
      tables: {
        contentIdeas: client.tables?.contentIdeas || 'N/A',
        socialMediaContent: client.tables?.socialMediaContent || 'N/A',
        images: client.tables?.images || 'N/A',
        brandAssets: client.tables?.brandAssets || 'N/A',
        emailIdeas: client.tables?.emailIdeas || 'N/A',
        templates: client.tables?.templates || 'N/A',
        blogPosts: client.tables?.blogPosts || 'N/A',
        blogRequests: client.tables?.blogRequests || 'N/A',
        keywordResearch: client.tables?.keywordResearch || 'N/A'
      }
    }))

    return NextResponse.json({
      success: true,
      clients: formattedClients,
      count: formattedClients.length
    })

  } catch (error) {
    console.error('Error fetching clients:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch clients',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { clientId } = await request.json()
    
    if (!clientId) {
      return NextResponse.json(
        { success: false, error: 'Client ID is required' },
        { status: 400 }
      )
    }

    console.log(`🗑️ Starting deletion process for client: ${clientId}`)

    // Get client configuration before deletion (try database first)
    let client = await DatabaseClientConfig.getClient(clientId)
    
    // Fallback to file-based config if not in database
    if (!client) {
      await DynamicClientConfig.initialize()
      client = DynamicClientConfig.getClient(clientId)
    }
    
    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      )
    }

    console.log(`📋 Found client configuration:`, {
      id: client.id,
      displayName: client.displayName,
      databaseId: client.baserowDatabaseId
    })

    // Step 1: Try to delete Baserow database (optional - may fail due to permissions)
    let baserowDeletionResult = null
    try {
      if (client.baserowToken && client.baserowDatabaseId) {
        console.log(`🗄️ Attempting to delete Baserow database: ${client.baserowDatabaseId}`)
        
        const baserowAPI = new BaserowAPI(client.baserowToken, client.baserowDatabaseId, {})
        const response = await baserowAPI.request(`/api/databases/${client.baserowDatabaseId}/`, {
          method: 'DELETE'
        })
        
        baserowDeletionResult = { success: true, message: 'Baserow database deleted successfully' }
        console.log(`✅ Baserow database deleted successfully`)
      }
    } catch (baserowError) {
      baserowDeletionResult = { 
        success: false, 
        message: `Failed to delete Baserow database: ${baserowError instanceof Error ? baserowError.message : 'Unknown error'}` 
      }
      console.log(`⚠️ Baserow database deletion failed:`, baserowError)
      // Continue with app cleanup even if Baserow deletion fails
    }

    // Step 2: Remove client from database configuration
    console.log(`📝 Removing client from database configuration`)
    const dbDeleteResult = await DatabaseClientConfig.deleteClient(clientId)
    
    // Also try to delete from file-based config (development)
    try {
      DynamicClientConfig.deleteClient(clientId)
      console.log(`✅ Also removed from local clients.json`)
    } catch (fileError) {
      console.log(`⚠️ Could not remove from clients.json (expected in production)`)
    }
    
    if (!dbDeleteResult) {
      console.log(`⚠️ Client not found in database, but continuing with cleanup`)
    }

    // Step 3: Remove environment variables (database in production, .env.local in development)
    console.log(`🔧 Cleaning up environment variables`)
    try {
      await EnvironmentManager.deleteClientVariables(clientId)
      console.log(`✅ Environment variables cleaned up`)
    } catch (envError) {
      console.log(`⚠️ Failed to clean environment variables:`, envError)
      // Continue even if env cleanup fails
    }

    console.log(`✅ Client deletion completed successfully`)

    return NextResponse.json({
      success: true,
      message: 'Client deleted successfully',
      clientId,
      baserowDeletion: baserowDeletionResult,
      details: {
        appConfigRemoved: true,
        envVariablesCleaned: true,
        baserowDatabaseDeleted: baserowDeletionResult?.success || false
      }
    })

  } catch (error) {
    console.error('Error deleting client:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to delete client',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
