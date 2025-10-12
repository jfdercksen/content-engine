/**
 * Workspace Creation Service
 * Handles the creation of Baserow workspace (base, tables, fields) for new clients
 * Extracted from create route to be reusable across endpoints
 */

interface WorkspaceCreationResult {
  success: boolean
  database?: any
  tables?: any
  fieldMappings?: any
  error?: string
}

export class WorkspaceCreationService {
  private static baserowUrl = process.env.BASEROW_API_URL || 'https://baserow.aiautomata.co.za'
  private static baserowToken = process.env.BASEROW_MODERN_MANAGEMENT_TOKEN || 'SXe0k6Btm7i28uZP5mp8hr5KPBoWsiE1'

  /**
   * Create complete workspace for a client
   * This includes: base, tables, fields
   */
  static async createWorkspace(clientDisplayName: string): Promise<WorkspaceCreationResult> {
    try {
      console.log('🏗️ Creating workspace for:', clientDisplayName)

      // Import helper functions from create route
      // Note: These need to be extracted to a shared location
      const { createRealBase, createRealTables, createRealFields } = await import('../api/admin/clients/create/route')

      // Create base
      const database = await createRealBase(`${clientDisplayName} Content Engine`)
      console.log('✅ Base created:', database.id)

      // Create tables
      const tables = await createRealTables(database.id, clientDisplayName)
      console.log('✅ Tables created:', Object.keys(tables))

      // Create fields
      const fieldMappings = await createRealFields(tables, clientDisplayName)
      console.log('✅ Fields created')

      return {
        success: true,
        database,
        tables,
        fieldMappings
      }

    } catch (error) {
      console.error('❌ Workspace creation failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

