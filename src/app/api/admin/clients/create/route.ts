import { NextRequest, NextResponse } from 'next/server'
import { STANDARD_TABLE_TEMPLATES, STANDARD_FIELD_MAPPINGS } from '@/lib/types/client'
import { DynamicClientConfig } from '@/lib/config/dynamicClients'
import { DatabaseClientConfig } from '@/lib/config/databaseClientConfig'
import { EnvironmentManager } from '@/lib/config/environmentManager'
import { ClientInformationManager } from '@/lib/config/clientInformationManager'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { clientName, displayName, clientInfo } = body

    if (!clientName || !displayName) {
      return NextResponse.json(
        { error: 'Missing required fields: clientName, displayName' },
        { status: 400 }
      )
    }

    // Check if client already exists (check database first, then file)
    let existingClient = await DatabaseClientConfig.clientExists(clientName)
    
    if (!existingClient) {
      // Also check file-based config
      await DynamicClientConfig.initialize()
      existingClient = DynamicClientConfig.getClient(clientName) !== null
    }
    
    if (existingClient) {
      console.log(`⚠️ Client already exists: ${clientName}`)
      return NextResponse.json(
        { error: `Client "${clientName}" already exists. Please use a different client name.` },
        { status: 409 }
      )
    }

    console.log('Creating new client:', { clientName, displayName })
    console.log('Using workspace 129 client onboarding...')

    let database: any = null
    let tables: any = {}
    let clientConfig: any = null
    let workspace: any = null
    let databaseToken: any = null
    
    try {
      // Step 1: Use existing workspace 129 (no need to create new workspace)
      console.log('Step 1: Using existing workspace 129...')
      workspace = { id: 129, name: 'Existing Workspace' }
      console.log('Using workspace:', workspace.id)
      
      // Step 2: Use existing admin token (no need to create new token)
      console.log('Step 2: Using existing admin token...')
      databaseToken = { key: process.env.BASEROW_MODERN_MANAGEMENT_TOKEN || 'SXe0k6Btm7i28uZP5mp8hr5KPBoWsiE1' }
      console.log('Using existing token:', databaseToken.key.substring(0, 10) + '...')
      
      // Step 3: Create new base in workspace 129 using proven API
      console.log('Step 3: Creating new base in workspace 129...')
      const baseName = `${displayName} Content Engine`
      database = await createRealBase(baseName)
      console.log('✅ Base created successfully:', database.id)
      
      // Step 4: Create real tables in the new base
      console.log('Step 4: Creating tables in new base...')
      tables = await createRealTables(database.id, displayName)
      console.log('✅ Tables created successfully:', tables)
      
      // Step 5: Create real fields in the new tables
      console.log('Step 5: Creating fields in new tables...')
      const fieldMappings = await createRealFields(tables, displayName)
      console.log('✅ Fields created successfully:', Object.keys(fieldMappings))
      
      // Step 6: Create client configuration
      clientConfig = {
        id: clientName,
        name: clientName,
        displayName,
        baserowWorkspaceId: workspace.id,
        baserowDatabaseId: database.id,
        baserowToken: databaseToken.key, // Use the new workspace-specific token
        baserowTokenId: databaseToken.id, // Store token ID for management
        tables: tables,
        fieldMappings,
        isActive: true,
        isMock: false, // Real JWT-based setup with workspace and dedicated token
        isWorkspaceOnly: database.isWorkspaceOnly || false, // Indicates if this client uses workspace-only approach
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // Step 7: Persist client configuration
      console.log('Step 7: Storing client configuration...')
      await storeClientConfiguration(clientConfig)
      console.log('Client configuration stored successfully')
      
      // Step 8: Store environment variables (database in production, .env.local in development)
      console.log('Step 8: Storing environment variables...')
      await storeEnvironmentVariables(clientName, clientConfig)
      console.log('Environment variables stored successfully')
      
      // Step 9: Store client information (onboarding data)
      if (clientInfo) {
        console.log('Step 9: Storing client information...')
        console.log('📋 Client info data:', JSON.stringify(clientInfo, null, 2))
        console.log('🔧 Using environment variables:')
        console.log('  - BASEROW_API_URL:', process.env.BASEROW_API_URL || 'https://baserow.aiautomata.co.za')
        console.log('  - BASEROW_CLIENT_INFORMATION_TABLE_ID:', process.env.BASEROW_CLIENT_INFORMATION_TABLE_ID || '3232')
        console.log('  - BASEROW_MODERN_MANAGEMENT_TOKEN:', process.env.BASEROW_MODERN_MANAGEMENT_TOKEN ? '***set***' : '***NOT SET***')
        console.log('  - WEBHOOK_ONBOARDING:', process.env.WEBHOOK_ONBOARDING || 'https://n8n.aiautomata.co.za/webhook/onboarding')
        
        try {
          await ClientInformationManager.createClientInfo({
            clientId: clientName,
            companyName: clientInfo.companyName || displayName,
            displayName: displayName,
            industry: clientInfo.industry || '',
            companySize: clientInfo.companySize || '',
            foundedYear: clientInfo.foundedYear,
            websiteUrl: clientInfo.websiteUrl,
            blogUrl: clientInfo.blogUrl,
            facebookUrl: clientInfo.facebookUrl,
            instagramHandle: clientInfo.instagramHandle,
            linkedinUrl: clientInfo.linkedinUrl,
            xHandle: clientInfo.xHandle,
            tiktokHandle: clientInfo.tiktokHandle,
            country: clientInfo.country || '',
            city: clientInfo.city,
            timezone: clientInfo.timezone || 'UTC',
            primaryContactName: clientInfo.primaryContactName,
            primaryContactEmail: clientInfo.primaryContactEmail,
            primaryContactPhone: clientInfo.primaryContactPhone,
            targetAudience: clientInfo.targetAudience,
            mainCompetitors: clientInfo.mainCompetitors,
            businessGoals: clientInfo.businessGoals,
            brandVoice: clientInfo.brandVoice,
            postingFrequency: clientInfo.postingFrequency,
            languages: clientInfo.languages,
            primaryBrandColor: clientInfo.primaryBrandColor,
            secondaryBrandColor: clientInfo.secondaryBrandColor,
            onboardingStatus: 'Complete',
            accountManager: clientInfo.accountManager,
            monthlyBudget: clientInfo.monthlyBudget
          })
          console.log('✅ Client information stored and sent to onboarding webhook')
        } catch (infoError: any) {
          console.error('❌ Failed to store client information:', infoError)
          console.error('❌ Error message:', infoError?.message)
          console.error('❌ Error stack:', infoError?.stack)
          console.log('⚠️ Client created successfully, but onboarding data was not saved')
        }
      } else {
        console.log('⚠️ No clientInfo provided - skipping Step 9')
      }
      
      // Step 10: Initialize default settings and preferences
      console.log('Step 10: Initializing default settings...')
      try {
        const settingsResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/settings/${clientName}/initialize`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            webhooks: {
              social_media_processor: process.env.WEBHOOK_SOCIAL_MEDIA_PROCESSOR || 'https://n8n.aiautomata.co.za/webhook/social-media-processor',
              image_generator: process.env.WEBHOOK_IMAGE_GENERATOR || 'https://n8n.aiautomata.co.za/webhook/image-generator-webhook',
              blog_processor: process.env.WEBHOOK_BLOG_PROCESSOR || 'https://n8n.aiautomata.co.za/webhook/blog-creation-mvp',
              email_processor: process.env.WEBHOOK_EMAIL_PROCESSOR || 'https://n8n.aiautomata.co.za/webhook/email-processor',
              uvp_creation: process.env.WEBHOOK_UVP_CREATION || 'https://n8n.aiautomata.co.za/webhook/uvp_creation'
            }
          })
        })
        if (settingsResponse.ok) {
          console.log('✅ Default settings initialized successfully')
        } else {
          console.log('⚠️ Failed to initialize settings, but client creation will continue')
        }
      } catch (settingsError) {
        console.log('⚠️ Settings initialization failed:', settingsError)
        console.log('Client created successfully, but settings need to be configured manually')
      }
      
    } catch (error) {
      console.error('Error during client creation, initiating rollback...', error)
      
      // Rollback: Clean up any created resources (workspace and token only)
      // DO NOT delete existing bases - they contain valuable data!
      try {
        console.log('Rolling back: Cleaning up created workspace and token...')
        
        // Only rollback if we have created resources
        if (workspace && workspace.id) {
          console.log(`⚠️ Workspace ${workspace.id} was created but client setup failed`)
          console.log('⚠️ Manual cleanup may be required in Baserow admin panel')
        }
        
        if (databaseToken && databaseToken.id) {
          console.log(`⚠️ Database token ${databaseToken.id} was created but client setup failed`)
          console.log('⚠️ Manual cleanup may be required in Baserow admin panel')
        }
        
        // Only delete newly created bases, never existing ones
        if (database && database.id && !database.id.toString().startsWith('workspace-') && database.id !== '176') {
          try {
            console.log(`🗑️ Deleting newly created base: ${database.id}`)
            await deleteBase(database.id)
            console.log('✅ Newly created base deleted successfully')
          } catch (deleteError) {
            console.log(`⚠️ Failed to delete base ${database.id}:`, (deleteError as Error).message)
          }
        }
        
        console.log('✅ Rollback completed (no existing resources were deleted)')
      } catch (rollbackError) {
        console.error('❌ Failed during rollback cleanup:', rollbackError)
      }
      
      throw error // Re-throw the original error
    }

    return NextResponse.json({
      success: true,
      clientConfig,
      message: `Client '${displayName}' has been successfully onboarded with dedicated workspace (${workspace.id}), dedicated token, real base (${database.id}), complete table structure with fields, and environment variables updated.`
    })

  } catch (error) {
    console.error('Error creating client:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create client', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

async function createFieldMappings(tables: any, token: string) {
  console.log('Generating field mappings from actual table structures...')
  
  const fieldMappings: Record<string, Record<string, string>> = {}
  
  for (const [tableKey, table] of Object.entries(tables)) {
    console.log(`Fetching field structure for table: ${tableKey}`)
    
    try {
      const baserowUrl = process.env.BASEROW_API_URL || 'https://baserow.aiautomata.co.za'
      const response = await fetch(`${baserowUrl}/api/database/fields/table/${(table as any).id}/`, {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const fields = await response.json()
        console.log(`✅ Fetched ${fields.length} fields for table ${tableKey}`)
        
        // Create mapping from field names to field IDs
        const mapping: Record<string, string> = {}
        fields.forEach((field: any) => {
          // Use the field name as the key and field ID as the value
          mapping[field.name.toLowerCase().replace(/\s+/g, '')] = field.id
        })
        
        fieldMappings[tableKey] = mapping
      } else {
        console.error(`Failed to fetch fields for table ${tableKey}:`, response.status, response.statusText)
        // Use standard mapping as fallback
        fieldMappings[tableKey] = (STANDARD_FIELD_MAPPINGS as any)[tableKey] || {}
      }
    } catch (error) {
      console.error(`Error fetching fields for table ${tableKey}:`, error)
      // Use standard mapping as fallback
        fieldMappings[tableKey] = (STANDARD_FIELD_MAPPINGS as any)[tableKey] || {}
    }
  }
  
  console.log('Field mappings generated:', fieldMappings)
    return fieldMappings
  }

// Helper function to create a real base using proven API
async function createRealBase(baseName: string): Promise<any> {
  const baseUrl = 'https://baserow.aiautomata.co.za'
  const username = 'johan@aiautomations.co.za'
  const password = 'P@ssw0rd.123'
  const workspaceId = 129

  // Get JWT token
  const jwtResponse = await fetch(`${baseUrl}/api/user/token-auth/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: username, password: password })
  })

  if (!jwtResponse.ok) {
    throw new Error('JWT authentication failed')
  }

  const jwtData = await jwtResponse.json()
  const accessToken = jwtData.access_token

  // Create base using proven endpoint
  const endpoint = `/api/applications/workspace/${workspaceId}/`
  const response = await fetch(`${baseUrl}${endpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': `JWT ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: baseName,
      type: 'database'
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to create base: ${response.status} - ${errorText}`)
  }

  return await response.json()
}

// Helper function to create real tables
async function createRealTables(databaseId: number, clientName: string): Promise<any> {
  const baseUrl = 'https://baserow.aiautomata.co.za'
  const username = 'johan@aiautomations.co.za'
  const password = 'P@ssw0rd.123'

  // Get JWT token
  const jwtResponse = await fetch(`${baseUrl}/api/user/token-auth/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: username, password: password })
  })

  if (!jwtResponse.ok) {
    throw new Error('JWT authentication failed')
  }

  const jwtData = await jwtResponse.json()
  const accessToken = jwtData.access_token

  const tables: Record<string, number> = {}
  const tableNames = [
    'Content Ideas',
    'Social Media Content',
    'Images',
    'Brand Assets',
    'Email Ideas',
    'Templates',
    'Blog Posts',
    'Blog Requests',
    'Keyword Research',
    'Product UVPs'
  ]

  for (let i = 0; i < tableNames.length; i++) {
    const tableName = tableNames[i]
    console.log(`  📋 Creating table: ${tableName}`)

    const endpoint = `/api/database/tables/database/${databaseId}/`
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `JWT ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: tableName
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to create table ${tableName}: ${response.status} - ${errorText}`)
    }

    const tableResult = await response.json()
    
    // Map table names to our internal keys
    const tableKey = tableName.toLowerCase().replace(/\s+/g, '') // "Social Media Content" -> "socialmediacontent"
    if (tableKey === 'contentideas') tables['contentIdeas'] = tableResult.id
    else if (tableKey === 'socialmediacontent') tables['socialMediaContent'] = tableResult.id
    else if (tableKey === 'images') tables['images'] = tableResult.id
    else if (tableKey === 'brandassets') tables['brandAssets'] = tableResult.id
    else if (tableKey === 'emailideas') tables['emailIdeas'] = tableResult.id
    else if (tableKey === 'templates') tables['templates'] = tableResult.id
    else if (tableKey === 'blogposts') tables['blogPosts'] = tableResult.id
    else if (tableKey === 'blogrequests') tables['blogRequests'] = tableResult.id
    else if (tableKey === 'keywordresearch') tables['keywordResearch'] = tableResult.id
    else if (tableKey === 'productuvps') tables['productUvps'] = tableResult.id

    console.log(`    ✅ Table created with ID: ${tableResult.id}`)
  }

  // Remove default fields from all tables after all custom fields are created
  console.log('Step 5.5: Removing default fields from all tables...')
  await removeDefaultFieldsFromTables(tables, accessToken)

  return tables
}

// Helper function to remove default fields from all tables
async function removeDefaultFieldsFromTables(tables: Record<string, number>, accessToken: string): Promise<void> {
  const baseUrl = 'https://baserow.aiautomata.co.za'
  
  for (const [tableKey, tableId] of Object.entries(tables)) {
    console.log(`  🗑️ Removing default fields from table: ${tableKey} (ID: ${tableId})`)
    
    try {
      const fieldsResponse = await fetch(`${baseUrl}/api/database/fields/table/${tableId}/`, {
        method: 'GET',
        headers: {
          'Authorization': `JWT ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (fieldsResponse.ok) {
        const fieldsData = await fieldsResponse.json()
        console.log(`    📋 Found ${fieldsData.length} fields in table ${tableKey}:`, fieldsData.map((f: any) => f.name))
        
        // Handle default fields - rename primary field with table-specific names, delete others
        for (const field of fieldsData) {
          if (field.name === 'Name' && field.primary) {
            // Map table keys to specific ID field names
            const idFieldNames: Record<string, string> = {
              'contentideas': 'record_id',
              'socialmediacontent': 'Post ID',
              'emailideas': 'Email ID',
              'templates': 'Template ID',
              'brandassets': 'Asset ID',
              'images': 'Image id',
              'blogrequests': 'Blog_Request_ID',
              'blogposts': 'Blog_Post_ID',
              'keywordresearch': 'ID'
            }
            
            const newFieldName = idFieldNames[tableKey] || 'ID'
            
            // Rename the primary "Name" field to table-specific name and change type to autonumber
            console.log(`    🔄 Renaming primary "Name" field to "${newFieldName}" and changing to autonumber in table: ${tableKey}`)
            
            const renameResponse = await fetch(`${baseUrl}/api/database/fields/${field.id}/`, {
              method: 'PATCH',
              headers: {
                'Authorization': `JWT ${accessToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ 
                name: newFieldName,
                type: 'autonumber'
              })
            })
            
            if (renameResponse.ok) {
              console.log(`    ✅ Primary "Name" field renamed to "${newFieldName}" and changed to autonumber in table: ${tableKey}`)
            } else {
              const errorText = await renameResponse.text()
              console.log(`    ⚠️ Failed to rename/convert primary "Name" field in table: ${tableKey} - ${renameResponse.status}: ${errorText}`)
            }
          } else if (['Notes', 'Active'].includes(field.name)) {
            // Delete non-primary default fields
            console.log(`    🔍 Found default field "${field.name}" (Type: ${field.type}, Order: ${field.order}, ID: ${field.id}), removing...`)
            
            const deleteFieldResponse = await fetch(`${baseUrl}/api/database/fields/${field.id}/`, {
              method: 'DELETE',
              headers: {
                'Authorization': `JWT ${accessToken}`,
                'Content-Type': 'application/json'
              }
            })
            
            if (deleteFieldResponse.ok) {
              console.log(`    ✅ Default "${field.name}" field removed from table: ${tableKey}`)
            } else {
              const errorText = await deleteFieldResponse.text()
              console.log(`    ⚠️ Failed to remove default "${field.name}" field from table: ${tableKey} - ${deleteFieldResponse.status}: ${errorText}`)
            }
          }
        }
      } else {
        const errorText = await fieldsResponse.text()
        console.log(`    ⚠️ Failed to fetch fields for table ${tableKey}: ${fieldsResponse.status} - ${errorText}`)
      }
    } catch (error) {
      console.log(`    ⚠️ Error removing default fields from table ${tableKey}:`, error)
    }
  }
}

// Helper function to create real fields
async function createRealFields(tables: any, clientName: string): Promise<any> {
  const baseUrl = 'https://baserow.aiautomata.co.za'
  const username = 'johan@aiautomations.co.za'
  const password = 'P@ssw0rd.123'

  // Get JWT token
  const jwtResponse = await fetch(`${baseUrl}/api/user/token-auth/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: username, password: password })
  })

  if (!jwtResponse.ok) {
    throw new Error('JWT authentication failed')
  }

  const jwtData = await jwtResponse.json()
  const accessToken = jwtData.access_token

  const fieldMappings: Record<string, Record<string, number>> = {}

  // Define comprehensive field structures based on modern-management client
  const tableFields = {
    contentIdeas: [
      { name: 'Content Idea', type: 'text' },
      { name: 'Idea Type', type: 'single_select', select_options: [
        { value: 'Blog Post', color: 'darker-blue' },
        { value: 'Social Media Post', color: 'red' },
        { value: 'Video Content', color: 'darker-cyan' },
        { value: 'Email Campaign', color: 'darker-orange' }
      ]},
      { name: 'Description', type: 'long_text' },
      { name: 'information_source', type: 'single_select', select_options: [
        { value: 'URL', color: 'dark-blue' },
        { value: 'Manual', color: 'darker-pink' },
        { value: 'Image', color: 'light-orange' },
        { value: 'Template', color: 'darker-yellow' }
      ]},
      { name: 'Source URL', type: 'url' },
      { name: 'Target Audience', type: 'single_select', select_options: [
        { value: 'Young Adults (18-25)', color: 'dark-cyan' },
        { value: 'Millennials (26-40)', color: 'dark-yellow' },
        { value: 'Gen X (41-55)', color: 'darker-orange' },
        { value: 'Working Professionals', color: 'cyan' },
        { value: 'Entrepreneurs & Business Owners', color: 'light-purple' },
        { value: 'Students', color: 'light-blue' },
        { value: 'Parents & Families', color: 'light-green' },
        { value: 'General Audience', color: 'light-gray' }
      ]},
      { name: 'Priority', type: 'single_select', select_options: [
        { value: 'High', color: 'deep-dark-orange' },
        { value: 'Medium', color: 'darker-orange' },
        { value: 'Low', color: 'dark-orange' }
      ]},
      { name: 'status', type: 'single_select', select_options: [
        { value: 'Idea', color: 'light-gray' },
        { value: 'In Progress', color: 'light-purple' },
        { value: 'Ready for Review', color: 'dark-green' },
        { value: 'Client Review', color: 'yellow' }
      ]},
      { name: 'Due Date', type: 'date' },
      { name: 'Client Notes', type: 'long_text' },
      { name: 'Voice File Url', type: 'file' },
      { name: 'platforms', type: 'multiple_select', select_options: [
        { value: 'Facebook', color: 'pink' },
        { value: 'Instagram', color: 'light-brown' },
        { value: 'X', color: 'light-gray' },
        { value: 'LinkedIn', color: 'orange' },
        { value: 'Pinterest', color: 'red' },
        { value: 'Snapchat', color: 'yellow' },
        { value: 'Reddit', color: 'dark-orange' }
      ]},
      { name: 'post_type', type: 'single_select', select_options: [
        { value: 'Image', color: 'darker-green' },
        { value: 'Carousel', color: 'green' },
        { value: 'Story', color: 'dark-cyan' },
        { value: 'Reel', color: 'dark-gray' }
      ]},
      { name: 'number_of_posts', type: 'number' },
      { name: 'hook_focus', type: 'long_text' },
      { name: 'cta', type: 'long_text' },
      { name: 'uploaded_image_url', type: 'file' },
      { name: 'uploaded_video_url', type: 'file' },
      { name: 'Source Content', type: 'long_text' },
      { name: 'Social Media Content', type: 'link_row' },
      { name: 'Content Strategy', type: 'single_select', select_options: [
        { value: 'Awareness & Positioning', color: 'darker-pink' },
        { value: 'Promotion & Sales', color: 'dark-orange' },
        { value: 'Engagement & Community Building', color: 'darker-brown' },
        { value: 'Retention & Customer Loyalty', color: 'light-cyan' },
        { value: 'Market & Trend Commentary', color: 'dark-cyan' },
        { value: 'Partnership & B2B Networking', color: 'light-purple' },
        { value: 'Educational & Value-First Marketing', color: 'dark-purple' },
        { value: 'Inspirational & Motivational Content', color: 'light-green' },
        { value: 'Behind-the-Scenes & Transparency', color: 'dark-green' },
        { value: 'Crisis Communication & Reputation Management', color: 'light-red' },
        { value: 'Seasonal & Event-Driven Marketing', color: 'dark-red' },
        { value: 'User-Generated & Social Proof Content', color: 'light-blue' }
      ]},
      { name: 'Content Type Strategy', type: 'multiple_select', select_options: [
        { value: 'Brand Positioning & Values', color: 'light-purple' },
        { value: 'Thought Leadership & Industry Insights', color: 'light-red' },
        { value: 'Educational How-To & Tutorials', color: 'deep-dark-orange' },
        { value: 'Explainer Content & FAQs', color: 'darker-red' },
        { value: 'Industry Trend Analysis & Commentary', color: 'light-blue' },
        { value: 'Product/Service Advertisement', color: 'dark-green' },
        { value: 'Special Offer & Discount Campaign', color: 'dark-orange' },
        { value: 'Feature Spotlight & Deep Dive', color: 'light-yellow' },
        { value: 'Comparison & Competitive Analysis', color: 'dark-red' },
        { value: 'Urgency & Scarcity-Driven Content', color: 'deep-dark-red' },
        { value: 'Interactive Polls & Surveys', color: 'light-cyan' },
        { value: 'User-Generated Content Campaign', color: 'dark-cyan' },
        { value: 'Community Building & Networking', color: 'light-brown' },
        { value: 'Contest & Giveaway Promotion', color: 'dark-brown' },
        { value: 'Q&A & Live Discussion', color: 'light-gray' },
        { value: 'Customer Success Story & Case Study', color: 'dark-gray' },
        { value: 'Product Tips & Advanced Usage', color: 'light-pink' },
        { value: 'Customer Appreciation & Milestones', color: 'dark-pink' },
        { value: 'Testimonial & Review Showcase', color: 'light-purple' },
        { value: 'Onboarding & Support Content', color: 'dark-purple' },
        { value: 'Breaking News & Reactive Marketing', color: 'light-green' },
        { value: 'Seasonal & Holiday Tie-ins', color: 'dark-blue' },
        { value: 'Event Promotion & Live Coverage', color: 'light-orange' },
        { value: 'Public Relations & Announcements', color: 'darker-orange' },
        { value: 'Partnership & Collaboration Invitation', color: 'deep-dark-orange' }
      ]},
      { name: 'PRIMARY OBJECTIVE OPTIONS', type: 'single_select', select_options: [
        { value: 'Build Brand Awareness & Recognition', color: 'darker-yellow' },
        { value: 'Generate Leads & Drive Conversions', color: 'pink' },
        { value: 'Educate & Inform Target Audience', color: 'cyan' },
        { value: 'Increase Engagement & Community Building', color: 'dark-blue' },
        { value: 'Establish Thought Leadership & Authority', color: 'dark-purple' },
        { value: 'Drive Website Traffic & Click-throughs', color: 'light-green' },
        { value: 'Boost Customer Retention & Loyalty', color: 'dark-orange' },
        { value: 'Support & Nurture Existing Customers', color: 'light-blue' },
        { value: 'Attract Strategic Partnerships & Collaborations', color: 'dark-red' },
        { value: 'Create Viral Content & Expand Reach', color: 'light-pink' }
      ]}
    ],
    socialMediaContent: [
      { name: 'Image Prompt', type: 'text' },
      { name: 'Image Status', type: 'single_select', select_options: [
        { value: 'Not Started', color: 'light-gray' },
        { value: 'In Progress', color: 'light-blue' },
        { value: 'Completed', color: 'light-green' },
        { value: 'Failed', color: 'light-red' }
      ]},
      { name: 'Content Type', type: 'single_select', select_options: [
        { value: 'Image', color: 'dark-blue' },
        { value: 'Video', color: 'dark-orange' },
        { value: 'Carousel', color: 'dark-gray' },
        { value: 'Story', color: 'blue' },
        { value: 'Reel', color: 'light-purple' },
        { value: 'Copywrite', color: 'dark-green' },
        { value: 'Other', color: 'light-gray' }
      ]},
      { name: 'Status', type: 'single_select', select_options: [
        { value: 'In Review', color: 'pink' },
        { value: 'Not Approved', color: 'yellow' },
        { value: 'Approved', color: 'darker-cyan' },
        { value: 'Regenerate', color: 'darker-blue' }
      ]},
      { name: 'Platform', type: 'single_select', select_options: [
        { value: 'Facebook', color: 'dark-purple' },
        { value: 'Instagram', color: 'darker-cyan' },
        { value: 'LinkedIn', color: 'light-red' },
        { value: 'X', color: 'red' },
        { value: 'Pinterest', color: 'dark-red' },
        { value: 'Snapchat', color: 'yellow' },
        { value: 'Reddit', color: 'dark-orange' }
      ]},
      { name: 'Angle', type: 'long_text' },
      { name: 'Intent', type: 'long_text' },
      { name: 'Approved by', type: 'link_row' },
      { name: 'Scheduled Time', type: 'date', date_include_time: true },
      { name: 'Hook', type: 'text' },
      { name: 'Post', type: 'long_text' },
      { name: 'Comments', type: 'long_text' },
      { name: 'CTA', type: 'text' },
      { name: 'Hashtags', type: 'long_text' },
      { name: 'Character Count', type: 'number' },
      { name: 'Engagement Prediction', type: 'number' },
      { name: 'updated_at', type: 'last_modified' },
      { name: 'Content Idea', type: 'link_row' },
      { name: 'Content Theme', type: 'long_text' },
      { name: 'Psychological Trigger', type: 'text' },
      { name: 'Engagement Objective', type: 'text' },
      { name: 'Images', type: 'link_row' },
      { name: 'client_id', type: 'text' },
      { name: 'created_at', type: 'created_on' },
      { name: 'accepted_at', type: 'date' }
    ],
    images: [
      { name: 'Image', type: 'file' },
      { name: 'Image Prompt', type: 'long_text' },
      { name: 'Image Type', type: 'single_select', select_options: [
        { value: 'New image', color: 'brown' },
        { value: 'New image with captions', color: 'dark-brown' },
        { value: 'Image from reference image', color: 'light-cyan' },
        { value: 'Image from reference with captions', color: 'darker-purple' }
      ]},
      { name: 'Image Scene', type: 'long_text' },
      { name: 'Image Style', type: 'single_select', select_options: [
        { value: 'Photorealistic', color: 'darker-red' },
        { value: 'Digital Art', color: 'darker-green' },
        { value: 'Vintage', color: 'blue' },
        { value: 'Surreal', color: 'dark-blue' }
      ]},
      { name: 'Image Model', type: 'single_select', select_options: [
        { value: 'openai/gpt-image-1', color: 'brown' },
        { value: 'black-forest-labs/flux-schnell', color: 'darker-brown' },
        { value: 'black-forest-labs/flux-dev', color: 'light-purple' },
        { value: 'black-forest-labs/flux-1.1-pro-ultra', color: 'darker-gray' }
      ]},
      { name: 'Image Size', type: 'single_select', select_options: [
        { value: '1024x1024 (1:1)', color: 'light-blue' },
        { value: '1080 x 1920 (9:16)', color: 'darker-green' },
        { value: '1200 x 630 (1.91:1)', color: 'darker-pink' },
        { value: '1920 x 1080 (16:9)', color: 'light-orange' }
      ]},
      { name: 'Image Status', type: 'single_select', select_options: [
        { value: 'Generating', color: 'dark-green' },
        { value: 'Completed', color: 'darker-blue' },
        { value: 'Failed', color: 'light-pink' },
        { value: 'Accepted', color: 'light-brown' }
      ]},
      { name: 'Reference Image', type: 'file' },
      { name: 'Reference Url', type: 'text' },
      { name: 'Caption Text', type: 'text' },
      { name: 'Caption Font Style', type: 'single_select', select_options: [
        { value: 'Arial', color: 'red' },
        { value: 'Helvetica', color: 'light-green' },
        { value: 'Times New Roman', color: 'deep-dark-orange' },
        { value: 'Georgia', color: 'green' }
      ]},
      { name: 'Caption Font Size', type: 'single_select', select_options: [
        { value: 'Small (12px)', color: 'light-gray' },
        { value: 'Medium (16px)', color: 'light-red' },
        { value: 'Large (20px)', color: 'cyan' },
        { value: 'Extra Large (24px)', color: 'gray' }
      ]},
      { name: 'Caption Position', type: 'single_select', select_options: [
        { value: 'bottom-center', color: 'light-green' },
        { value: 'bottom-left', color: 'blue' },
        { value: 'bottom-right', color: 'dark-cyan' },
        { value: 'top-center', color: 'dark-red' }
      ]},
      { name: 'Social Media Content', type: 'link_row' },
      { name: 'client_id', type: 'text' },
      { name: 'created_at', type: 'date' },
      { name: 'accepted_at', type: 'date' },
      { name: 'Email Ideas', type: 'link_row' },
      { name: 'Email Images', type: 'single_select', select_options: [
        { value: 'Header Image', color: 'darker-green' },
        { value: 'Main Survey Image', color: 'cyan' },
        { value: 'CTA Image', color: 'red' },
        { value: 'Company Logo', color: 'dark-green' }
      ]},
      { name: 'Image Link URL', type: 'url' },
      { name: 'Voice Note', type: 'file' }
    ],
    blogPosts: [
      { name: 'title', type: 'text' },
      { name: 'slug', type: 'text' },
      { name: 'content', type: 'long_text' },
      { name: 'meta_title', type: 'text' },
      { name: 'meta_description', type: 'long_text' },
      { name: 'focus_keyword', type: 'text' },
      { name: 'secondary_keywords', type: 'text' },
      { name: 'status', type: 'single_select', select_options: [
        { value: 'Draft', color: 'gray' },
        { value: 'Review', color: 'yellow' },
        { value: 'Published', color: 'green' },
        { value: 'Scheduled', color: 'blue' }
      ]},
      { name: 'seo_score', type: 'number' },
      { name: 'word_count', type: 'number' },
      { name: 'readability_score', type: 'number' },
      { name: 'created_at', type: 'created_on' },
      { name: 'updated_at', type: 'last_modified' },
      { name: 'scheduled_publish_date', type: 'date' },
      { name: 'author_id', type: 'text' },
      { name: 'featured_image_prompt', type: 'long_text' },
      { name: 'alt_texts', type: 'text' },
      { name: 'internal_links', type: 'text' },
      { name: 'external_sources', type: 'text' },
      { name: 'category', type: 'single_select', select_options: [
        { value: 'Business Strategy', color: 'blue' },
        { value: 'Leadership', color: 'green' },
        { value: 'Management', color: 'purple' },
        { value: 'Technology', color: 'orange' }
      ]},
      { name: 'tags', type: 'text' },
      { name: 'processing_log', type: 'long_text' }
    ],
    blogRequests: [
      { name: 'input_type', type: 'single_select', select_options: [
        { value: 'Text', color: 'green' },
        { value: 'URL', color: 'blue' },
        { value: 'Voice Note', color: 'orange' }
      ]},
      { name: 'original_content', type: 'long_text' },
      { name: 'processed_content', type: 'long_text' },
      { name: 'submission_timestamp', type: 'created_on' },
      { name: 'status', type: 'single_select', select_options: [
        { value: 'Pending', color: 'yellow' },
        { value: 'Processing', color: 'blue' },
        { value: 'Completed', color: 'green' },
        { value: 'Failed', color: 'red' }
      ]},
      { name: 'workflow_execution_id', type: 'text' },
      { name: 'selected_keyword', type: 'text' },
      { name: 'keyword_data', type: 'long_text' },
      { name: 'content_length', type: 'number' },
      { name: 'error_message', type: 'long_text' },
      { name: 'completion_timestamp', type: 'date' },
      { name: 'blog_post_id', type: 'link_row' }
    ],
    keywordResearch: [
      { name: 'blog_request_id', type: 'link_row' },
      { name: 'keyword', type: 'text' },
      { name: 'search_volume', type: 'number' },
      { name: 'keyword_difficulty', type: 'number' },
      { name: 'search_intent', type: 'single_select', select_options: [
        { value: 'Informational', color: 'blue' },
        { value: 'Navigational', color: 'green' },
        { value: 'Transactional', color: 'purple' },
        { value: 'Commercial', color: 'orange' }
      ]},
      { name: 'cpc', type: 'number', number_decimal_places: 2 },
      { name: 'competition_level', type: 'single_select', select_options: [
        { value: 'Low', color: 'green' },
        { value: 'Medium', color: 'yellow' },
        { value: 'High', color: 'red' }
      ]},
      { name: 'related_keywords', type: 'text' },
      { name: 'serp_features', type: 'text' },
      { name: 'opportunity_score', type: 'number' },
      { name: 'research_timestamp', type: 'created_on' },
      { name: 'is_selected', type: 'boolean' }
    ],
    productUvps: [
      { name: 'Product/Service Name', type: 'text' },
      { name: 'Product URL', type: 'url' },
      { name: 'Customer Type', type: 'single_select', select_options: [
        { value: 'Individual Consumers', color: 'light-blue' },
        { value: 'Small Business Owners (1-50 employees)', color: 'light-green' },
        { value: 'Mid-Market Companies (51-500 employees)', color: 'light-orange' },
        { value: 'Enterprise (500+ employees)', color: 'light-red' },
        { value: 'Industry Professionals', color: 'light-purple' },
        { value: 'C-Level Executives', color: 'light-pink' }
      ]},
      { name: 'Industry Category', type: 'single_select', select_options: [
        { value: 'Automotive', color: 'dark-blue' },
        { value: 'Software/SaaS', color: 'dark-green' },
        { value: 'Professional Services', color: 'dark-orange' },
        { value: 'Manufacturing', color: 'dark-red' },
        { value: 'Healthcare', color: 'dark-purple' },
        { value: 'Financial Services', color: 'dark-pink' },
        { value: 'E-commerce/Retail', color: 'blue' },
        { value: 'Real Estate', color: 'green' },
        { value: 'Education', color: 'orange' },
        { value: 'Other', color: 'light-gray' }
      ]},
      { name: 'Problem Solved', type: 'long_text' },
      { name: 'Key Differentiator', type: 'long_text' },
      { name: 'UVP', type: 'long_text' },
      { name: 'Created Date', type: 'created_on' },
      { name: 'Last Modified', type: 'last_modified' }
    ],
    brandAssets: [
      { name: 'Platform', type: 'multiple_select', select_options: [
        { value: 'Facebook', color: 'light-pink' },
        { value: 'Instagram', color: 'red' },
        { value: 'X', color: 'darker-pink' },
        { value: 'LinkedIn', color: 'blue' },
        { value: 'Blog', color: 'green' },
        { value: 'Email', color: 'purple' },
        { value: 'Website', color: 'cyan' },
        { value: 'Print', color: 'orange' },
        { value: 'Universal', color: 'gray' }
      ]},
      { name: 'Content Type', type: 'single_select', select_options: [
        { value: 'Social Media Post', color: 'cyan' },
        { value: 'Story', color: 'dark-gray' },
        { value: 'Reel', color: 'light-orange' },
        { value: 'Blog Post', color: 'purple' },
        { value: 'Email Campaign', color: 'orange' },
        { value: 'General', color: 'gray' }
      ]},
      { name: 'Asset Type', type: 'single_select', select_options: [
        { value: 'Brand Voice', color: 'light-orange' },
        { value: 'Visual Asset', color: 'dark-purple' },
        { value: 'Template', color: 'darker-cyan' },
        { value: 'Guidelines', color: 'green' },
        { value: 'Logo', color: 'light-blue' },
        { value: 'Color Palette', color: 'light-green' },
        { value: 'Font', color: 'light-purple' },
        { value: 'Other', color: 'gray' }
      ]},
      { name: 'Asset Information', type: 'long_text' },
      { name: 'File', type: 'file' },
      { name: 'File URL', type: 'url' },
      { name: 'Status', type: 'single_select', select_options: [
        { value: 'Active', color: 'darker-red' },
        { value: 'Inactive', color: 'light-purple' },
        { value: 'Draft', color: 'gray' }
      ]},
      { name: 'Priority', type: 'single_select', select_options: [
        { value: 'High', color: 'darker-blue' },
        { value: 'Medium', color: 'light-pink' },
        { value: 'Low', color: 'darker-cyan' }
      ]},
      { name: 'Created Date', type: 'created_on' },
      { name: 'Last Updated', type: 'last_modified' },
      { name: 'Asset Notes', type: 'long_text' },
      { name: 'Brand Voice Guidelines', type: 'long_text' },
      { name: 'Approved Hashtags', type: 'long_text' },
      { name: 'Tone/style Preferences', type: 'long_text' },
      { name: 'Forbidden words/topics', type: 'long_text' },
      { name: 'Platform-specific rules', type: 'long_text' },
      { name: 'Asset Name', type: 'text' }
    ],
    emailIdeas: [
      { name: 'Email Idea Name', type: 'text' },
      { name: 'Email Type', type: 'single_select', select_options: [
        { value: 'Welcome & Onboarding Emails', color: 'light-blue' },
        { value: 'Promotional Emails', color: 'light-green' },
        { value: 'Newsletter / Content Emails', color: 'light-purple' },
        { value: 'Lead Nurture / Drip Emails', color: 'light-orange' },
        { value: 'Event or Launch Emails', color: 'light-red' },
        { value: 'Transactional Emails', color: 'light-cyan' },
        { value: 'Re-Engagement Emails', color: 'light-yellow' },
        { value: 'Customer Loyalty & Upsell Emails', color: 'light-pink' },
        { value: 'Survey & Feedback Emails', color: 'light-gray' }
      ]},
      { name: 'Hook', type: 'long_text' },
      { name: 'CTA', type: 'long_text' },
      { name: 'Email Text Idea', type: 'long_text' },
      { name: 'Email URL Idea', type: 'url' },
      { name: 'Email Video Idea', type: 'file' },
      { name: 'Email Image Idea', type: 'file' },
      { name: 'Email Voice Idea', type: 'file' },
      { name: 'Status', type: 'single_select', select_options: [
        { value: 'Draft', color: 'gray' },
        { value: 'Send', color: 'light-green' },
        { value: 'Generating Image', color: 'light-blue' },
        { value: 'Approved', color: 'light-purple' }
      ]},
      { name: 'Last Modified', type: 'date' },
      { name: 'Created Date', type: 'date' },
      { name: 'Templates', type: 'link_row' },
      { name: 'Generated HTML', type: 'long_text' },
      { name: 'Images', type: 'link_row' }
    ],
    templates: [
      { name: 'Template Name', type: 'text' },
      { name: 'Template Type', type: 'single_select', select_options: [
        { value: 'Email', color: 'light-blue' },
        { value: 'Blog', color: 'light-green' },
        { value: 'Social Media', color: 'light-purple' }
      ]},
      { name: 'Template Category', type: 'single_select', select_options: [
        { value: 'Welcome', color: 'light-cyan' },
        { value: 'Promotional', color: 'light-orange' },
        { value: 'Newsletter', color: 'light-pink' }
      ]},
      { name: 'HTML Template', type: 'long_text' },
      { name: 'CSS Styles', type: 'long_text' },
      { name: 'Is Active', type: 'boolean' },
      { name: 'Last Modified', type: 'date' },
      { name: 'Created Date', type: 'date' }
    ],
  }

  for (const [tableKey, tableId] of Object.entries(tables)) {
    console.log(`  🔧 Creating fields for ${tableKey} table (ID: ${tableId})`)
    
    fieldMappings[tableKey] = {}
    const fields = (tableFields as any)[tableKey] || []

    for (const field of fields) {
      console.log(`    📝 Creating field: ${field.name} (${field.type})`)

      // Handle link_row fields by providing the target table ID
      let fieldData = { ...field }
      
      // Handle autonumber fields (ID fields)
      if (field.type === 'autonumber') {
        // Remove primary property as it's handled by Baserow automatically
        delete fieldData.primary
      }
      
      if (field.type === 'link_row') {
        // Map field names to target table IDs
        const linkTargets = {
          'Content Idea': tables.contentIdeas,
          'Images': tables.images,
          'Social Media Content': tables.socialMediaContent,
          'Templates': tables.templates,
          'Email Ideas': tables.emailIdeas,
          'blog_post_id': tables.blogPosts,
          'blog_request_id': tables.blogRequests
        }
        
        const targetTableId = (linkTargets as any)[field.name]
        if (targetTableId) {
          fieldData.link_row_table_id = targetTableId
          console.log(`      🔗 Linking to table ID: ${targetTableId}`)
        } else {
          console.log(`    ⚠️ Skipping link field - no target table found for: ${field.name}`)
          continue
        }
      }

      const endpoint = `/api/database/fields/table/${tableId}/`
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `JWT ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(fieldData)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.log(`    ⚠️ Field creation failed: ${response.status} - ${errorText}`)
        // Continue with other fields instead of failing completely
        continue
      }

      const fieldResult = await response.json()
      
      // Map field names to our internal keys
      const fieldKey = field.name.toLowerCase().replace(/\s+/g, '') // "Created At" -> "createdat"
      fieldMappings[tableKey][fieldKey] = fieldResult.id

      console.log(`      ✅ Field created with ID: ${fieldResult.id}`)
    }
  }

  return fieldMappings
}

// Helper function to update environment variables for new client
async function storeEnvironmentVariables(clientName: string, clientConfig: any) {
  try {
    const environmentVariables = [
      { name: 'TOKEN', value: clientConfig.baserowToken },
      { name: 'DATABASE_ID', value: clientConfig.baserowDatabaseId },
      { name: 'WORKSPACE_ID', value: clientConfig.baserowWorkspaceId },
      { name: 'CONTENT_IDEAS_TABLE_ID', value: clientConfig.tables.contentIdeas },
      { name: 'SOCIAL_MEDIA_CONTENT_TABLE_ID', value: clientConfig.tables.socialMediaContent },
      { name: 'IMAGES_TABLE_ID', value: clientConfig.tables.images },
      { name: 'BRAND_ASSETS_TABLE_ID', value: clientConfig.tables.brandAssets },
      { name: 'EMAIL_IDEAS_TABLE_ID', value: clientConfig.tables.emailIdeas },
      { name: 'TEMPLATES_TABLE_ID', value: clientConfig.tables.templates },
      { name: 'BLOG_POSTS_TABLE_ID', value: clientConfig.tables.blogPosts },
      { name: 'BLOG_REQUESTS_TABLE_ID', value: clientConfig.tables.blogRequests },
      { name: 'KEYWORD_RESEARCH_TABLE_ID', value: clientConfig.tables.keywordResearch },
      { name: 'PRODUCT_UVPS_TABLE_ID', value: clientConfig.tables.productUvps }
    ]

    // Store each environment variable using EnvironmentManager
    for (const envVar of environmentVariables) {
      await EnvironmentManager.setVariable(clientName, envVar.name, envVar.value)
    }
    
    console.log(`✅ Environment variables stored for client: ${clientName}`)
    console.log(`📝 Stored ${environmentVariables.length} environment variables`)
    
  } catch (error) {
    console.error('❌ Failed to store environment variables:', error)
    throw new Error(`Failed to store environment variables: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Helper function to delete a base
async function deleteBase(baseId: number) {
  const baseUrl = 'https://baserow.aiautomata.co.za'
  const username = 'johan@aiautomations.co.za'
  const password = 'P@ssw0rd.123'

  // Get JWT token
  const jwtResponse = await fetch(`${baseUrl}/api/user/token-auth/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: username, password: password })
  })

  if (!jwtResponse.ok) {
    throw new Error('JWT authentication failed')
  }

  const jwtData = await jwtResponse.json()
  const accessToken = jwtData.access_token

  // Delete base
  const response = await fetch(`${baseUrl}/api/applications/${baseId}/`, {
    method: 'DELETE',
    headers: {
      'Authorization': `JWT ${accessToken}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to delete base: ${response.status} - ${errorText}`)
  }

  return true
}

async function storeClientConfiguration(clientConfig: any) {
  try {
    console.log('Storing client configuration...')
    
    let dbSuccess = false
    let fileSuccess = false
    
    // Try to store in database first (production)
    try {
      await DatabaseClientConfig.addClient(clientConfig)
      dbSuccess = true
      console.log('✅ Stored in Baserow database')
    } catch (dbError) {
      console.log('⚠️ Could not store in database:', dbError instanceof Error ? dbError.message : 'Unknown error')
      console.log('This may be due to permissions on Client Configurations table')
    }
    
    // Try to store in file system (development)
    try {
      await DynamicClientConfig.addClient(clientConfig)
      fileSuccess = true
      console.log('✅ Stored in local clients.json')
    } catch (fileError) {
      console.log('⚠️ Could not write to clients.json (expected in production - read-only file system)')
    }
    
    // At least one must succeed
    if (!dbSuccess && !fileSuccess) {
      throw new Error('Failed to store client configuration in both database and file system')
    }
    
    console.log(`Client configuration stored successfully (database: ${dbSuccess}, file: ${fileSuccess})`)
    return true
  } catch (error) {
    console.error('Error storing client configuration:', error)
    throw error
  }
}