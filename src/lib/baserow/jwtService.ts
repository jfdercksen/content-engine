/**
 * Baserow JWT Authentication Service
 * Handles JWT authentication for admin operations (base creation, table creation, etc.)
 */

interface JWTTokens {
  access_token: string
  refresh_token: string
  expires_at: number
}

interface JWTCache {
  tokens: JWTTokens | null
  lastRefresh: number
}

class BaserowJWTService {
  private cache: JWTCache = {
    tokens: null,
    lastRefresh: 0
  }

  private baseUrl: string
  private username: string
  private password: string
  private workspaceId: string

  constructor() {
    this.baseUrl = process.env.BASEROW_API_URL || 'https://baserow.aiautomata.co.za'
    this.username = process.env.BASEROW_ADMIN_USERNAME || ''
    this.password = process.env.BASEROW_ADMIN_PASSWORD || ''
    this.workspaceId = process.env.BASEROW_WORKSPACE_ID || ''

    if (!this.username || !this.password || !this.workspaceId) {
      console.warn('⚠️ JWT credentials not fully configured. Admin operations will fail.')
    }
  }

  /**
   * Get valid JWT tokens (from cache or by authenticating)
   */
  async getValidTokens(): Promise<JWTTokens> {
    const now = Date.now()
    
    // Check if we have valid cached tokens
    if (this.cache.tokens && this.cache.tokens.expires_at > now + 60000) { // 1 minute buffer
      console.log('✅ Using cached JWT tokens')
      return this.cache.tokens
    }

    // Refresh tokens if they exist, otherwise authenticate
    if (this.cache.tokens && this.cache.tokens.refresh_token) {
      try {
        console.log('🔄 Refreshing JWT tokens...')
        const newTokens = await this.refreshTokens(this.cache.tokens.refresh_token)
        this.cache.tokens = newTokens
        this.cache.lastRefresh = now
        console.log('✅ JWT tokens refreshed successfully')
        return newTokens
      } catch (error) {
        console.log('❌ Token refresh failed, re-authenticating...')
        // Fall through to fresh authentication
      }
    }

    // Fresh authentication
    console.log('🔐 Authenticating with JWT...')
    const tokens = await this.authenticate()
    this.cache.tokens = tokens
    this.cache.lastRefresh = now
    console.log('✅ JWT authentication successful')
    return tokens
  }

  /**
   * Authenticate with username/password to get JWT tokens
   */
  private async authenticate(): Promise<JWTTokens> {
    const response = await fetch(`${this.baseUrl}/api/user/token-auth/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: this.username,
        password: this.password
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`JWT Authentication failed: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: Date.now() + (data.expires_in * 1000) // Convert seconds to milliseconds
    }
  }

  /**
   * Refresh JWT tokens using refresh token
   */
  private async refreshTokens(refreshToken: string): Promise<JWTTokens> {
    const response = await fetch(`${this.baseUrl}/api/user/token-refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        refresh_token: refreshToken
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`JWT Token refresh failed: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: Date.now() + (data.expires_in * 1000)
    }
  }

  /**
   * Make an authenticated JWT request
   */
  async makeJWTRRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const tokens = await this.getValidTokens()
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `JWT ${tokens.access_token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    })

    return response
  }

  /**
   * Create a new workspace for the client
   * Based on testing, we need to create workspaces instead of applications
   */
  async createWorkspace(name: string): Promise<any> {
    console.log(`🏢 Creating workspace: ${name}`)
    
    try {
      const response = await this.makeJWTRRequest('/api/workspaces/', {
        method: 'POST',
        body: JSON.stringify({
          name: name
        })
      })

      if (response.ok) {
        const result = await response.json()
        console.log(`✅ Workspace created successfully: ${result.id}`)
        return result
      } else {
        const errorText = await response.text()
        throw new Error(`Failed to create workspace: ${response.status} - ${errorText}`)
      }
    } catch (error) {
      console.error(`❌ Failed to create workspace:`, error)
      throw error
    }
  }

  /**
   * Create a database token for the workspace
   * This token will be used for all API calls and webhooks for this client
   */
  async createDatabaseToken(workspaceId: string, tokenName: string): Promise<any> {
    console.log(`🔑 Creating database token for workspace: ${workspaceId}`)
    
    try {
      const response = await this.makeJWTRRequest('/api/database/tokens/', {
        method: 'POST',
        body: JSON.stringify({
          name: tokenName,
          workspace: parseInt(workspaceId)
        })
      })

      if (response.ok) {
        const result = await response.json()
        console.log(`✅ Database token created successfully: ${result.key.substring(0, 10)}...`)
        return result
      } else {
        const errorText = await response.text()
        throw new Error(`Failed to create database token: ${response.status} - ${errorText}`)
      }
    } catch (error) {
      console.error(`❌ Failed to create database token:`, error)
      throw error
    }
  }

  /**
   * Create a new base (database) in the workspace
   * Note: Based on API testing, this is not supported in this Baserow version
   * We'll use workspace-only approach for multi-tenancy
   */
  async createBase(name: string): Promise<any> {
    console.log(`🏗️ Attempting to create base: ${name}`)
    console.log(`❌ Base creation is not supported in this Baserow version`)
    console.log(`🔄 Using workspace-only approach (no separate base needed)`)
    
    // Since base creation isn't supported, we'll create a workspace-based identifier
    // This represents the "base" within the workspace
    const workspaceBasedId = `workspace-base-${Date.now()}`
    console.log(`📋 Created workspace-based identifier: ${workspaceBasedId}`)
    
    return {
      id: workspaceBasedId,
      name: name,
      type: 'workspace-base',
      isWorkspaceOnly: true
    }
  }

  /**
   * Create a table in a base
   */
  async createTable(baseId: string, name: string): Promise<any> {
    console.log(`📋 Creating table: ${name} in base ${baseId}`)
    
    // Try multiple endpoints for creating a table
    const endpoints = [
      {
        url: `/api/database/tables/`,
        body: { name: name, database_id: parseInt(baseId) }
      },
      {
        url: `/api/applications/${baseId}/tables/`,
        body: { name: name }
      },
      {
        url: `/api/tables/`,
        body: { name: name, database_id: parseInt(baseId) }
      }
    ]

    for (const endpoint of endpoints) {
      try {
        console.log(`Trying table endpoint: ${endpoint.url}`)
        const response = await this.makeJWTRRequest(endpoint.url, {
          method: 'POST',
          body: JSON.stringify(endpoint.body)
        })

        if (response.ok) {
          const result = await response.json()
          console.log(`✅ Table created successfully: ${result.id}`)
          return result
        } else {
          const errorText = await response.text()
          console.log(`❌ Table endpoint ${endpoint.url} failed with status: ${response.status}`)
          console.log(`Error: ${errorText}`)
        }
      } catch (error) {
        console.log(`❌ Table endpoint ${endpoint.url} failed with error:`, error)
      }
    }

    throw new Error(`Failed to create table: All endpoints failed.`)
  }

  /**
   * Create a field in a table
   */
  async createField(tableId: string, fieldConfig: any): Promise<any> {
    console.log(`🔧 Creating field: ${fieldConfig.name} in table ${tableId}`)
    
    const response = await this.makeJWTRRequest(`/api/database/fields/table/${tableId}/`, {
      method: 'POST',
      body: JSON.stringify(fieldConfig)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to create field: ${response.status} - ${errorText}`)
    }

    const result = await response.json()
    console.log(`✅ Field created successfully: ${result.id}`)
    return result
  }

  /**
   * Delete a base (for rollback)
   */
  async deleteBase(baseId: string): Promise<void> {
    console.log(`🗑️ Deleting base: ${baseId}`)
    
    const response = await this.makeJWTRRequest(`/api/applications/${baseId}/`, {
      method: 'DELETE'
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to delete base: ${response.status} - ${errorText}`)
    }

    console.log(`✅ Base deleted successfully: ${baseId}`)
  }

  /**
   * Delete a table (for rollback)
   */
  async deleteTable(tableId: string): Promise<void> {
    console.log(`🗑️ Deleting table: ${tableId}`)
    
    const response = await this.makeJWTRRequest(`/api/database/tables/${tableId}/`, {
      method: 'DELETE'
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to delete table: ${response.status} - ${errorText}`)
    }

    console.log(`✅ Table deleted successfully: ${tableId}`)
  }

  /**
   * Clear cached tokens (for logout or errors)
   */
  clearCache(): void {
    this.cache.tokens = null
    this.cache.lastRefresh = 0
    console.log('🧹 JWT cache cleared')
  }
}

// Export singleton instance
export const baserowJWTService = new BaserowJWTService()
export default baserowJWTService
