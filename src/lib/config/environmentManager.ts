import fs from 'fs'
import path from 'path'
import { BaserowAPI } from '@/lib/baserow/api'

// Environment Variables Manager for Production
export class EnvironmentManager {
  private static envTableId: string = process.env.BASEROW_ENVIRONMENT_VARIABLES_TABLE_ID || ''
  private static baserowAPI: BaserowAPI | null = null

  private static initializeAPI() {
    if (!this.baserowAPI && this.envTableId) {
      // Use the Client Info database (233) for environment variables
      const clientInfoDatabaseId = '233'
      this.baserowAPI = new BaserowAPI(
        process.env.BASEROW_MODERN_MANAGEMENT_TOKEN || '',
        clientInfoDatabaseId,
        {}
      )
    }
  }

  // Get environment variable for a client
  static async getVariable(clientId: string, variableName: string): Promise<string | null> {
    // 1. Try process.env first (for production deployments)
    const envKey = `BASEROW_${clientId.toUpperCase()}_${variableName.toUpperCase()}`
    const envValue = process.env[envKey]
    if (envValue) {
      console.log(`🔧 Found ${envKey} in process.env`)
      return envValue
    }

    // 2. Try database (for dynamic client creation)
    if (process.env.NODE_ENV === 'production' || this.envTableId) {
      try {
        this.initializeAPI()
        if (!this.baserowAPI) return null

        // Retrieve all records and filter in-memory (more reliable than Baserow filters)
        const records = await this.baserowAPI.request(
          `/api/database/rows/table/${this.envTableId}/?user_field_names=true`
        )

        if (records.results && records.results.length > 0) {
          // Filter by Client ID and Variable Name
          const matchingRecord = records.results.find((record: any) => 
            record['Client ID'] === clientId && record['Variable Name'] === variableName
          )
          
          if (matchingRecord) {
            const value = matchingRecord['Variable Value']
            console.log(`🔧 Found ${variableName} for ${clientId} in database`)
            return value
          }
        }
      } catch (error) {
        console.error(`Error fetching ${variableName} for ${clientId} from database:`, error)
      }
    }

    return null
  }

  // Set environment variable for a client
  static async setVariable(clientId: string, variableName: string, value: string): Promise<void> {
    console.log(`🔧 Setting ${variableName} for ${clientId}`)
    
    // Refresh envTableId from environment (in case it wasn't loaded initially)
    this.envTableId = process.env.BASEROW_ENVIRONMENT_VARIABLES_TABLE_ID || ''
    
    console.log(`🔍 Environment Variables Table ID: ${this.envTableId || 'NOT CONFIGURED'}`)

    // If environment table is configured, use database (even in development for testing)
    if (this.envTableId) {
      console.log(`📊 Using database storage for ${variableName}`)
      await this.saveToDatabase(clientId, variableName, value)
      // Also write to .env.local in development for backward compatibility
      if (process.env.NODE_ENV !== 'production') {
        console.log(`📝 Also writing to .env.local (development mode)`)
        await this.writeToEnvLocal(clientId, variableName, value)
      }
    } else {
      // Fallback: write to .env.local only
      console.log(`⚠️ No table ID configured, using .env.local only`)
      await this.writeToEnvLocal(clientId, variableName, value)
    }
  }

  // Save to database
  private static async saveToDatabase(clientId: string, variableName: string, value: string): Promise<void> {
    if (!this.envTableId) {
      console.log('⚠️ No environment variables table configured, skipping database save')
      return
    }

    try {
      console.log(`💾 Attempting to save ${variableName} to database...`)
      this.initializeAPI()
      
      if (!this.baserowAPI) {
        console.error('❌ BaserowAPI not initialized')
        throw new Error('BaserowAPI not initialized')
      }
      
      console.log(`📡 Fetching existing records from table ${this.envTableId}...`)

      // Check if variable already exists (retrieve all and filter in-memory)
      const existing = await this.baserowAPI.request(
        `/api/database/rows/table/${this.envTableId}/?user_field_names=true`
      )

      console.log(`📊 Found ${existing.results?.length || 0} existing records in database`)

      const existingRecord = existing.results?.find((record: any) =>
        record['Client ID'] === clientId && record['Variable Name'] === variableName
      )

      const data = {
        'Client ID': clientId,
        'Variable Name': variableName,
        'Variable Value': value,
        'Is Encrypted': false
      }

      console.log(`📝 Data to save:`, JSON.stringify(data, null, 2))

      if (existingRecord) {
        // Update existing
        console.log(`🔄 Updating existing record ${existingRecord.id}...`)
        const result = await this.baserowAPI.request(
          `/api/database/rows/table/${this.envTableId}/${existingRecord.id}/?user_field_names=true`,
          {
            method: 'PATCH',
            body: JSON.stringify(data)
          }
        )
        console.log(`✅ Updated ${variableName} for ${clientId} in database`)
        console.log(`📊 Update result:`, result)
      } else {
        // Create new
        console.log(`➕ Creating new record...`)
        const result = await this.baserowAPI.request(
          `/api/database/rows/table/${this.envTableId}/?user_field_names=true`,
          {
            method: 'POST',
            body: JSON.stringify(data)
          }
        )
        console.log(`✅ Created ${variableName} for ${clientId} in database`)
        console.log(`📊 Create result:`, result)
      }
    } catch (error: any) {
      console.error(`❌ Error saving ${variableName} for ${clientId} to database:`)
      console.error(`   Error message:`, error.message)
      console.error(`   Error details:`, error)
      throw error
    }
  }

  // Write to .env.local (development only)
  private static async writeToEnvLocal(clientId: string, variableName: string, value: string): Promise<void> {
    const envPath = path.join(process.cwd(), '.env.local')
    const envKey = `BASEROW_${clientId.toUpperCase()}_${variableName.toUpperCase()}=${value}`
    
    try {
      let envContent = ''
      
      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8')
      }
      
      // Remove existing line if it exists
      const lines = envContent.split('\n')
      const filteredLines = lines.filter(line => {
        const key = `BASEROW_${clientId.toUpperCase()}_${variableName.toUpperCase()}=`
        return !line.startsWith(key)
      })
      
      // Add new line
      filteredLines.push(envKey)
      
      // Write back to file
      const updatedContent = filteredLines.join('\n')
      fs.writeFileSync(envPath, updatedContent)
      
      console.log(`✅ Added ${envKey} to .env.local`)
    } catch (error) {
      console.error(`Error writing to .env.local:`, error)
      throw error
    }
  }

  // Get all environment variables for a client
  static async getAllVariables(clientId: string): Promise<Record<string, string>> {
    const variables: Record<string, string> = {}

    // Try database first
    if (process.env.NODE_ENV === 'production' || this.envTableId) {
      try {
        this.initializeAPI()
        if (this.baserowAPI) {
          const records = await this.baserowAPI.request(
            `/api/database/rows/table/${this.envTableId}/?user_field_names=true`
          )

          if (records.results) {
            // Filter records for this client and build variables object
            records.results
              .filter((record: any) => record['Client ID'] === clientId)
              .forEach((record: any) => {
                variables[record['Variable Name']] = record['Variable Value']
              })
          }
        }
      } catch (error) {
        console.error(`Error fetching variables for ${clientId} from database:`, error)
      }
    }

    // Fallback to process.env
    if (Object.keys(variables).length === 0) {
      const envPrefix = `BASEROW_${clientId.toUpperCase()}_`
      Object.keys(process.env).forEach(key => {
        if (key.startsWith(envPrefix)) {
          const variableName = key.replace(envPrefix, '').toLowerCase()
          variables[variableName] = process.env[key] || ''
        }
      })
    }

    return variables
  }

  // Delete all environment variables for a client
  static async deleteClientVariables(clientId: string): Promise<void> {
    console.log(`🗑️ Deleting all environment variables for ${clientId}`)

    // Delete from database
    if (process.env.NODE_ENV === 'production' || this.envTableId) {
      try {
        this.initializeAPI()
        if (this.baserowAPI) {
          const records = await this.baserowAPI.request(
            `/api/database/rows/table/${this.envTableId}/?user_field_names=true`
          )

          if (records.results) {
            // Filter records for this client
            const clientRecords = records.results.filter((record: any) => 
              record['Client ID'] === clientId
            )
            
            for (const record of clientRecords) {
              await this.baserowAPI.request(
                `/api/database/rows/table/${this.envTableId}/${record.id}/`,
                { method: 'DELETE' }
              )
            }
            console.log(`✅ Deleted ${clientRecords.length} environment variables for ${clientId} from database`)
          }
        }
      } catch (error) {
        console.error(`Error deleting variables for ${clientId} from database:`, error)
      }
    }

    // Remove from .env.local (development)
    if (process.env.NODE_ENV !== 'production') {
      try {
        const envPath = path.join(process.cwd(), '.env.local')
        if (fs.existsSync(envPath)) {
          let envContent = fs.readFileSync(envPath, 'utf8')
          const lines = envContent.split('\n')
          const filteredLines = lines.filter(line => {
            const envPrefix = `BASEROW_${clientId.toUpperCase()}_`
            return !line.startsWith(envPrefix)
          })
          const updatedContent = filteredLines.join('\n')
          fs.writeFileSync(envPath, updatedContent)
          console.log(`✅ Removed environment variables for ${clientId} from .env.local`)
        }
      } catch (error) {
        console.error(`Error removing variables for ${clientId} from .env.local:`, error)
      }
    }
  }
}
