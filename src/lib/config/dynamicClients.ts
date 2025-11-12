import { ClientConfiguration } from '@/lib/types/client'
import fs from 'fs'
import path from 'path'

// File-based persistence for client configurations
const CLIENTS_FILE_PATH = path.join(process.cwd(), 'data', 'clients.json')

// In-memory cache for client configurations
let clientConfigurations: Map<string, ClientConfiguration> = new Map()
let isInitialized = false

// Ensure data directory exists
function ensureDataDirectory() {
  try {
    const dataDir = path.dirname(CLIENTS_FILE_PATH)
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }
  } catch (error: any) {
    // In production (Vercel), file system is read-only
    if (error.code === 'EROFS') {
      console.log('⚠️ Read-only file system - cannot create data directory (expected in production)')
    } else {
      throw error
    }
  }
}

// Default configurations (your existing clients)
const defaultConfigurations: ClientConfiguration[] = [
  {
    id: 'modern-management',
    name: 'modern-management',
    displayName: 'Modern Management',
    baserowWorkspaceId: 129,
    baserowDatabaseId: process.env.BASEROW_MODERN_MANAGEMENT_DATABASE_ID || '176',
    baserowToken: process.env.BASEROW_MODERN_MANAGEMENT_TOKEN || 'SXe0k6Btm7i28uZP5mp8hr5KPBoWsiE1',
    tables: {
      contentIdeas: process.env.BASEROW_MODERN_MANAGEMENT_CONTENT_IDEAS_TABLE || '721',
      socialMediaContent: process.env.BASEROW_MODERN_MANAGEMENT_SOCIAL_MEDIA_CONTENT_TABLE || '712',
      images: process.env.BASEROW_MODERN_MANAGEMENT_IMAGES_TABLE || '729',
      videos: process.env.BASEROW_MODERN_MANAGEMENT_VIDEOS_TABLE || '3395',
      brandAssets: process.env.BASEROW_MODERN_MANAGEMENT_BRAND_ASSETS_TABLE || '728',
      emailIdeas: process.env.BASEROW_MODERN_MANAGEMENT_EMAIL_IDEAS_TABLE || '730',
      templates: process.env.BASEROW_MODERN_MANAGEMENT_TEMPLATES_TABLE || '731'
    },
    fieldMappings: {
      // Your existing field mappings
    },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

// Load client configurations from file or defaults
async function loadClientConfigurations(): Promise<void> {
  console.log('📝 Loading client configurations...')
  clientConfigurations.clear()
  
  // Always start with default configurations (Modern Management)
  defaultConfigurations.forEach(config => {
    clientConfigurations.set(config.id, config)
  })
  console.log(`✅ Loaded ${defaultConfigurations.length} default client configurations`)
  
  try {
    // Try to load additional configurations from file
    if (fs.existsSync(CLIENTS_FILE_PATH)) {
      const fileContent = fs.readFileSync(CLIENTS_FILE_PATH, 'utf8')
      const savedConfigs: ClientConfiguration[] = JSON.parse(fileContent)
      
      savedConfigs.forEach(config => {
        // Convert date strings back to Date objects
        config.createdAt = new Date(config.createdAt)
        config.updatedAt = new Date(config.updatedAt)
        // Only add if not already in defaults (to avoid overwriting Modern Management)
        if (!clientConfigurations.has(config.id)) {
          clientConfigurations.set(config.id, config)
        }
      })
      
      console.log(`✅ Loaded ${savedConfigs.length} additional client configurations from file`)
    }
    
    // Save the combined configuration to file (only in development)
    if (process.env.NODE_ENV !== 'production') {
      await saveClientConfigurations()
    }
  } catch (error) {
    console.error('Error loading client configurations:', error)
    console.log(`✅ Using ${clientConfigurations.size} default client configurations (fallback)`)
  }
}

// Save client configurations to file
async function saveClientConfigurations(): Promise<void> {
  try {
    ensureDataDirectory()
    
    const configsArray = Array.from(clientConfigurations.values())
    const jsonContent = JSON.stringify(configsArray, null, 2)
    
    fs.writeFileSync(CLIENTS_FILE_PATH, jsonContent, 'utf8')
    console.log(`✅ Saved ${configsArray.length} client configurations to file`)
  } catch (error: any) {
    // In production (Vercel), file system is read-only, so this is expected
    if (error.code === 'EROFS') {
      console.log('⚠️ Read-only file system detected (production environment) - skipping file save')
    } else {
      console.error('Error saving client configurations:', error)
      throw error
    }
  }
}

// Default configurations will be loaded during initialization

export class DynamicClientConfig {
  private static instance: DynamicClientConfig

  static getInstance(): DynamicClientConfig {
    if (!DynamicClientConfig.instance) {
      DynamicClientConfig.instance = new DynamicClientConfig()
    }
    return DynamicClientConfig.instance
  }

  static get isInitialized(): boolean {
    return isInitialized
  }

  static async initialize(): Promise<void> {
    if (isInitialized) {
      return // Already initialized
    }

    await loadClientConfigurations()
    isInitialized = true
  }

  static getClientConfig(clientId: string): ClientConfiguration | null {
    return clientConfigurations.get(clientId) || null
  }

  static getClient(clientId: string): ClientConfiguration | null {
    return clientConfigurations.get(clientId) || null
  }

  static getAllClients(): ClientConfiguration[] {
    return Array.from(clientConfigurations.values())
  }

  static async addClient(config: ClientConfiguration): Promise<void> {
    clientConfigurations.set(config.id, config)
    await saveClientConfigurations()
    console.log(`✅ Added client '${config.displayName}' to persistent storage`)
  }

  static async updateClient(clientId: string, updates: Partial<ClientConfiguration>): Promise<boolean> {
    const existing = clientConfigurations.get(clientId)
    if (!existing) return false

    const updated = { ...existing, ...updates, updatedAt: new Date() }
    clientConfigurations.set(clientId, updated)
    await saveClientConfigurations()
    return true
  }

  static async removeClient(clientId: string): Promise<boolean> {
    const deleted = clientConfigurations.delete(clientId)
    if (deleted) {
      await saveClientConfigurations()
    }
    return deleted
  }

  static deleteClient(clientId: string): boolean {
    const deleted = clientConfigurations.delete(clientId)
    if (deleted) {
      // Save synchronously for immediate effect
      try {
        ensureDataDirectory()
        const configsArray = Array.from(clientConfigurations.values())
        const jsonContent = JSON.stringify(configsArray, null, 2)
        fs.writeFileSync(CLIENTS_FILE_PATH, jsonContent, 'utf8')
        console.log(`✅ Removed client '${clientId}' from persistent storage`)
      } catch (error) {
        console.error('Error saving client configurations after deletion:', error)
      }
    }
    return deleted
  }

  static isClientActive(clientId: string): boolean {
    const config = clientConfigurations.get(clientId)
    return config?.isActive || false
  }

  // Get Baserow configuration for a client
  static getBaserowConfig(clientId: string) {
    const config = clientConfigurations.get(clientId)
    if (!config) {
      throw new Error(`Client configuration not found: ${clientId}`)
    }

    return {
      databaseId: config.baserowDatabaseId,
      token: config.baserowToken,
      tables: config.tables,
      fieldMappings: config.fieldMappings
    }
  }
}

// Migration function to move from static configs to dynamic
export function migrateFromStaticConfig() {
  // This would read from your existing static configs and populate the dynamic system
  console.log('Migrating from static to dynamic client configuration...')
  
  // TODO: Read from src/lib/config/clients.ts and migrate
  // For now, the defaultConfigurations array above contains the migration data
}
