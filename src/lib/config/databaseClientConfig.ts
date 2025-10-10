/**
 * Database Client Configuration Manager
 * 
 * Stores client configurations in Baserow instead of file system
 * This is production-ready for serverless environments like Vercel
 * 
 * Table: Client Configurations (3231) in Client Info base (233)
 */

import { ClientConfiguration } from '@/lib/types/client'

interface BaserowClientConfig {
    id: number
    'Client ID': string
    'Client Name': string
    'Display Name': string
    'Workspace ID': number
    'Database ID': number
    'Token': string
    'Table IDs': string // JSON string
    'Field Mappings': string // JSON string
    'Is Active': boolean
    'Created on': string
    'Last modified': string
}

export class DatabaseClientConfig {
    private static baserowToken = process.env.BASEROW_MODERN_MANAGEMENT_TOKEN || 'SXe0k6Btm7i28uZP5mp8hr5KPBoWsiE1'
    private static baseUrl = process.env.BASEROW_API_URL || 'https://baserow.aiautomata.co.za'
    private static clientConfigTableId = process.env.BASEROW_CLIENT_CONFIGURATIONS_TABLE_ID || '3231'
    private static cache: Map<string, ClientConfiguration> = new Map()
    private static cacheTimestamp: number = 0
    private static CACHE_TTL = 60000 // 1 minute cache

    /**
     * Get all client configurations
     */
    static async getAllClients(): Promise<ClientConfiguration[]> {
        try {
            // Check cache first
            const now = Date.now()
            if (this.cache.size > 0 && (now - this.cacheTimestamp) < this.CACHE_TTL) {
                console.log('📦 Returning cached client configurations')
                return Array.from(this.cache.values())
            }

            console.log('📡 Fetching client configurations from Baserow...')
            const response = await fetch(
                `${this.baseUrl}/api/database/rows/table/${this.clientConfigTableId}/?user_field_names=true&size=200`,
                {
                    headers: {
                        'Authorization': `Token ${this.baserowToken}`,
                        'Content-Type': 'application/json',
                    },
                }
            )

            if (!response.ok) {
                throw new Error(`Failed to fetch client configurations: ${response.statusText}`)
            }

            const data = await response.json()
            const clients: ClientConfiguration[] = []

            // Parse each row
            for (const row of data.results) {
                try {
                    const config = this.parseBaserowRow(row)
                    clients.push(config)
                    this.cache.set(config.id, config)
                } catch (parseError) {
                    console.error('Error parsing client config row:', parseError)
                }
            }

            this.cacheTimestamp = now
            console.log(`✅ Loaded ${clients.length} client configurations from database`)
            return clients
        } catch (error) {
            console.error('Error fetching client configurations:', error)
            // Return cache if available, even if stale
            if (this.cache.size > 0) {
                console.log('⚠️ Using stale cache due to fetch error')
                return Array.from(this.cache.values())
            }
            return []
        }
    }

    /**
     * Get a single client configuration
     */
    static async getClient(clientId: string): Promise<ClientConfiguration | null> {
        // Check cache first
        const now = Date.now()
        if (this.cache.has(clientId) && (now - this.cacheTimestamp) < this.CACHE_TTL) {
            console.log(`📦 Returning cached config for ${clientId}`)
            return this.cache.get(clientId) || null
        }

        // Fetch all clients (this will update cache)
        const clients = await this.getAllClients()
        return clients.find(c => c.id === clientId) || null
    }

    /**
     * Add a new client configuration
     */
    static async addClient(config: ClientConfiguration): Promise<boolean> {
        try {
            console.log(`➕ Adding client configuration to database: ${config.id}`)

            const response = await fetch(
                `${this.baseUrl}/api/database/rows/table/${this.clientConfigTableId}/?user_field_names=true`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Token ${this.baserowToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        'Client ID': config.id,
                        'Client Name': config.name,
                        'Display Name': config.displayName,
                        'Workspace ID': config.baserowWorkspaceId || 129,
                        'Database ID': parseInt(config.baserowDatabaseId as string),
                        'Token': config.baserowToken,
                        'Table IDs': JSON.stringify(config.tables),
                        'Field Mappings': JSON.stringify(config.fieldMappings || {}),
                        'Is Active': config.isActive !== false,
                    }),
                }
            )

            if (!response.ok) {
                const errorData = await response.json()
                console.error('❌ Failed to add client:', errorData)
                throw new Error(`Failed to add client: ${response.statusText}`)
            }

            const result = await response.json()
            console.log(`✅ Client configuration added to database: ${config.id}`)

            // Update cache
            this.cache.set(config.id, config)
            this.cacheTimestamp = Date.now()

            return true
        } catch (error) {
            console.error('Error adding client configuration:', error)
            throw error
        }
    }

    /**
     * Update an existing client configuration
     */
    static async updateClient(clientId: string, updates: Partial<ClientConfiguration>): Promise<boolean> {
        try {
            console.log(`🔄 Updating client configuration: ${clientId}`)

            // First, get the existing record ID
            const response = await fetch(
                `${this.baseUrl}/api/database/rows/table/${this.clientConfigTableId}/?user_field_names=true&size=200`,
                {
                    headers: {
                        'Authorization': `Token ${this.baserowToken}`,
                        'Content-Type': 'application/json',
                    },
                }
            )

            if (!response.ok) {
                throw new Error(`Failed to fetch client: ${response.statusText}`)
            }

            const data = await response.json()
            const existingRow = data.results.find((row: BaserowClientConfig) => row['Client ID'] === clientId)

            if (!existingRow) {
                console.error(`❌ Client not found: ${clientId}`)
                return false
            }

            // Prepare update data
            const updateData: any = {}
            if (updates.name) updateData['Client Name'] = updates.name
            if (updates.displayName) updateData['Display Name'] = updates.displayName
            if (updates.baserowWorkspaceId) updateData['Workspace ID'] = updates.baserowWorkspaceId
            if (updates.baserowDatabaseId) updateData['Database ID'] = parseInt(updates.baserowDatabaseId as string)
            if (updates.baserowToken) updateData['Token'] = updates.baserowToken
            if (updates.tables) updateData['Table IDs'] = JSON.stringify(updates.tables)
            if (updates.fieldMappings) updateData['Field Mappings'] = JSON.stringify(updates.fieldMappings)
            if (updates.isActive !== undefined) updateData['Is Active'] = updates.isActive

            // Update in Baserow
            const updateResponse = await fetch(
                `${this.baseUrl}/api/database/rows/table/${this.clientConfigTableId}/${existingRow.id}/?user_field_names=true`,
                {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Token ${this.baserowToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(updateData),
                }
            )

            if (!updateResponse.ok) {
                throw new Error(`Failed to update client: ${updateResponse.statusText}`)
            }

            console.log(`✅ Client configuration updated: ${clientId}`)

            // Invalidate cache
            this.cache.delete(clientId)
            this.cacheTimestamp = 0

            return true
        } catch (error) {
            console.error('Error updating client configuration:', error)
            return false
        }
    }

    /**
     * Delete a client configuration
     */
    static async deleteClient(clientId: string): Promise<boolean> {
        try {
            console.log(`🗑️ Deleting client configuration: ${clientId}`)

            // First, get the existing record ID
            const response = await fetch(
                `${this.baseUrl}/api/database/rows/table/${this.clientConfigTableId}/?user_field_names=true&size=200`,
                {
                    headers: {
                        'Authorization': `Token ${this.baserowToken}`,
                        'Content-Type': 'application/json',
                    },
                }
            )

            if (!response.ok) {
                throw new Error(`Failed to fetch client: ${response.statusText}`)
            }

            const data = await response.json()
            const existingRow = data.results.find((row: BaserowClientConfig) => row['Client ID'] === clientId)

            if (!existingRow) {
                console.log(`⚠️ Client not found in database: ${clientId}`)
                return false
            }

            // Delete from Baserow
            const deleteResponse = await fetch(
                `${this.baseUrl}/api/database/rows/table/${this.clientConfigTableId}/${existingRow.id}/`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Token ${this.baserowToken}`,
                    },
                }
            )

            if (!deleteResponse.ok) {
                throw new Error(`Failed to delete client: ${deleteResponse.statusText}`)
            }

            console.log(`✅ Client configuration deleted: ${clientId}`)

            // Remove from cache
            this.cache.delete(clientId)

            return true
        } catch (error) {
            console.error('Error deleting client configuration:', error)
            return false
        }
    }

    /**
     * Check if a client exists
     */
    static async clientExists(clientId: string): Promise<boolean> {
        const client = await this.getClient(clientId)
        return client !== null
    }

    /**
     * Clear cache (use when you know data has changed)
     */
    static clearCache(): void {
        this.cache.clear()
        this.cacheTimestamp = 0
        console.log('🗑️ Client configuration cache cleared')
    }

    /**
     * Parse a Baserow row into ClientConfiguration
     */
    private static parseBaserowRow(row: BaserowClientConfig): ClientConfiguration {
        return {
            id: row['Client ID'],
            name: row['Client Name'],
            displayName: row['Display Name'],
            baserowWorkspaceId: row['Workspace ID'],
            baserowDatabaseId: row['Database ID'].toString(),
            baserowToken: row['Token'],
            tables: JSON.parse(row['Table IDs'] || '{}'),
            fieldMappings: JSON.parse(row['Field Mappings'] || '{}'),
            isActive: row['Is Active'],
            createdAt: new Date(row['Created on']),
            updatedAt: new Date(row['Last modified'])
        }
    }
}

