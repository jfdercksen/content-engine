import { NextResponse } from 'next/server'
import { DynamicClientConfig } from '@/lib/config/dynamicClients'
import { DatabaseClientConfig } from '@/lib/config/databaseClientConfig'

/**
 * Migrate existing clients from clients.json to Baserow database
 * Run this once to move from file-based to database-based client storage
 */
export async function POST() {
  try {
    console.log('🔄 Starting client migration from file to database...')
    
    // Load clients from file
    await DynamicClientConfig.initialize()
    const fileClients = DynamicClientConfig.getAllClients()
    
    console.log(`📋 Found ${fileClients.length} clients in file system`)
    
    const results = []
    
    for (const client of fileClients) {
      try {
        console.log(`➡️ Migrating client: ${client.id}`)
        
        // Check if already exists in database
        const exists = await DatabaseClientConfig.clientExists(client.id)
        
        if (exists) {
          console.log(`⏭️ Client ${client.id} already in database, skipping`)
          results.push({
            clientId: client.id,
            status: 'skipped',
            message: 'Already exists in database'
          })
          continue
        }
        
        // Add to database
        await DatabaseClientConfig.addClient(client)
        
        console.log(`✅ Migrated client: ${client.id}`)
        results.push({
          clientId: client.id,
          status: 'success',
          message: 'Migrated successfully'
        })
        
      } catch (clientError) {
        console.error(`❌ Failed to migrate client ${client.id}:`, clientError)
        results.push({
          clientId: client.id,
          status: 'error',
          message: clientError instanceof Error ? clientError.message : 'Unknown error'
        })
      }
    }
    
    const successCount = results.filter(r => r.status === 'success').length
    const skippedCount = results.filter(r => r.status === 'skipped').length
    const errorCount = results.filter(r => r.status === 'error').length
    
    console.log(`✅ Migration complete: ${successCount} migrated, ${skippedCount} skipped, ${errorCount} errors`)
    
    return NextResponse.json({
      success: true,
      message: 'Migration completed',
      results,
      summary: {
        total: results.length,
        migrated: successCount,
        skipped: skippedCount,
        errors: errorCount
      }
    })
    
  } catch (error) {
    console.error('Error during migration:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Migration failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

