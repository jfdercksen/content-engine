import { getClientConfig } from '@/lib/config/clients'
import { 
  mapSocialMediaContentFromBaserow, 
  mapSocialMediaContentToBaserow,
  mapBrandAssetsFromBaserow,
  mapBrandAssetsToBaserow,
  mapImagesFromBaserow,
  mapImagesToBaserow,
  mapEmailIdeasFromBaserow,
  mapEmailIdeasToBaserow,
  mapTemplatesFromBaserow,
  mapTemplatesToBaserow,
  mapImageIdeasFromBaserow,
  mapImageIdeasToBaserow
} from './fieldMappings'

export class BaserowAPI {
  private baseUrl: string
  private token: string
  private databaseId: string
  private fieldMappings: Record<string, Record<string, number>>

  constructor(token: string, databaseId: string, fieldMappings?: Record<string, Record<string, number>>) {
    this.baseUrl = process.env.BASEROW_API_URL || 'https://baserow.aiautomata.co.za'
    this.token = token
    this.databaseId = databaseId
    this.fieldMappings = fieldMappings || {}
  }

  public mapFieldsFromBaserow(baserowData: any, tableName: string, convertToCamelCase: boolean = false) {
    const mapped: any = {}
    
    // Get field mappings for this table
    const tableFieldMappings = this.fieldMappings[tableName]
    
    if (!tableFieldMappings || Object.keys(tableFieldMappings).length === 0) {
      console.log(`No dynamic field mappings found for table: ${tableName}, using hardcoded fallback`)
      
      // Use hardcoded field mappings as fallback only when no dynamic mappings exist
      switch (tableName) {
        case 'socialMediaContent':
          return mapSocialMediaContentFromBaserow(baserowData)
        case 'brandAssets':
          return mapBrandAssetsFromBaserow(baserowData)
        case 'images':
          return mapImagesFromBaserow(baserowData)
        case 'emailIdeas':
          return mapEmailIdeasFromBaserow(baserowData)
        case 'templates':
          return mapTemplatesFromBaserow(baserowData)
        case 'imageIdeas':
          return mapImageIdeasFromBaserow(baserowData)
        default:
          console.log(`No fallback mapping found for table: ${tableName}`)
          return baserowData
      }
    }
    
    // Create reverse mapping (field ID -> field name)
    // Client mappings store: { "fieldname": fieldIdNumber }
    // Baserow returns: { "field_12345": value }
    // So we need: field_12345 -> fieldname
    const reverseMapping: Record<string, string> = {}
    for (const [fieldName, fieldId] of Object.entries(tableFieldMappings)) {
      // Handle both numeric IDs and string IDs like "field_XXXXX"
      let actualFieldId: string
      if (typeof fieldId === 'number') {
        actualFieldId = `field_${fieldId}`
      } else if (typeof fieldId === 'string') {
        // If it's already in field_XXXXX format, use it as-is
        actualFieldId = fieldId.startsWith('field_') ? fieldId : `field_${fieldId}`
      } else {
        continue
      }
      reverseMapping[actualFieldId] = fieldName
    }
    
    console.log(`📋 Created reverse mapping for ${tableName}:`, Object.keys(reverseMapping).length, 'fields')
    if (tableName === 'emailIdeas') {
      console.log('📋 Email Ideas field mappings:', reverseMapping)
    }
    
    // Helper function to convert lowercase field names to camelCase for forms
    const toCamelCase = (fieldName: string): string => {
      // Special cases for specific field names that need camelCase conversion
      const camelCaseMap: Record<string, string> = {
        'contenttheme': 'contentTheme',
        'psychologicaltrigger': 'psychologicalTrigger',
        'engagementobjective': 'engagementObjective',
        'imageprompt': 'imagePrompt',
        'imagestatus': 'imageStatus',
        'contenttype': 'contentType',
        'scheduledtime': 'scheduledTime',
        'charactercount': 'characterCount',
        'engagementprediction': 'engagementPrediction',
        'updated_at': 'updated_at',
        'contentidea': 'contentIdea',
        'created_at': 'created_at',
        'accepted_at': 'accepted_at',
        'client_id': 'client_id',
        // Image fields
        'imageid': 'imageId',
        'imagetype': 'imageType',
        'imagestyle': 'imageStyle',
        'imagescene': 'imageScene',
        'imagelinkurl': 'imageLinkUrl',
        'image': 'image',
        // Brand Asset fields
        'assetname': 'assetName',
        'assetinformation': 'assetInformation',
        'brandvoiceguidelines': 'brandVoiceGuidelines',
        'approvedhashtags': 'approvedHashtags',
        'tone/stylepreferences': 'toneStylePreferences',
        'forbiddenwords/topics': 'forbiddenWordsTopics',
        'platform-specificrules': 'platformSpecificRules',
        'assetnotes': 'notes',
        'fileurl': 'fileUrl',
        'createddate': 'createdDate',
        'lastupdated': 'lastUpdated',
        // Blog Post fields
        'meta_title': 'metaTitle',
        'meta_description': 'metaDescription',
        'focus_keyword': 'focusKeyword',
        'secondary_keywords': 'secondaryKeywords',
        'seo_score': 'seoScore',
        'word_count': 'wordCount',
        'readability_score': 'readabilityScore',
        'scheduled_publish_date': 'scheduledPublishDate',
        'author_id': 'authorId',
        'featured_image_prompt': 'featuredImagePrompt',
        'featured_image_url': 'featuredImageUrl',
        'featured_image_alt': 'featuredImageAlt',
        'featured_image': 'featuredImage',
        'alt_texts': 'altTexts',
        'internal_links': 'internalLinks',
        'external_sources': 'externalSources',
        'processing_log': 'processingLog',
        'created_at': 'createdAt',
        'updated_at': 'updatedAt'
      }
      
      return camelCaseMap[fieldName] || fieldName
    }
    
    // Helper function to normalize field names for emailIdeas (use lowercase for frontend compatibility)
    const normalizeEmailIdeasFieldName = (fieldName: string): string => {
      if (tableName !== 'emailIdeas') return fieldName
      
      // Convert common emailIdeas field names to lowercase format expected by frontend
      const fieldNameLower = fieldName.toLowerCase()
      const nameMap: Record<string, string> = {
        'emailideaname': 'emailideaname',
        'emailideanname': 'emailideaname',
        'emailtype': 'emailtype',
        'emailtextidea': 'emailtextidea',
        'generatedhtml': 'generatedhtml',
        'emailurlidea': 'emailurlidea',
        'emailvoiceidea': 'emailvoiceidea',
        'emailvideoidea': 'emailvideoidea',
        'emailimageidea': 'emailimageidea',
        'createddate': 'createddate',
        'lastmodified': 'lastmodified',
        'hook': 'hook',
        'cta': 'cta',
        'status': 'status'
      }
      
      // Check if field name matches any known pattern
      for (const [key, normalized] of Object.entries(nameMap)) {
        if (fieldNameLower.includes(key) || fieldNameLower === key) {
          return normalized
        }
      }
      
      // For emailIdeas, use lowercase version of the field name
      return fieldNameLower
    }
    
    // Map field IDs to field names and convert Baserow objects to display values
    // Also include all fields from Baserow response, even if not in mapping
    for (const [fieldId, value] of Object.entries(baserowData)) {
      // Skip standard Baserow fields that should remain as-is
      if (fieldId === 'id' || fieldId === 'order' || fieldId === 'created_on' || fieldId === 'updated_on' || fieldId === 'created_at' || fieldId === 'updated_at') {
        mapped[fieldId] = value
        continue
      }
      
      const fieldName = reverseMapping[fieldId]
      if (fieldName) {
        // For emailIdeas, normalize field names to lowercase format expected by frontend
        // For other tables, optionally convert to camelCase for form compatibility
        let finalFieldName: string
        if (tableName === 'emailIdeas') {
          finalFieldName = normalizeEmailIdeasFieldName(fieldName)
        } else {
          finalFieldName = convertToCamelCase ? toCamelCase(fieldName) : fieldName
        }
        
        // Special handling for file fields - preserve the original array structure
        if (fieldName === 'image' && Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && value[0] !== null && 'url' in value[0]) {
          // Keep the file array as-is for proper URL extraction
          mapped[finalFieldName] = value
        } else {
          // Convert Baserow objects to display values for other fields
          mapped[finalFieldName] = this.convertBaserowValueToDisplayValue(value)
        }
        
        // Also keep the original field name for backwards compatibility
        if (tableName === 'emailIdeas' && finalFieldName !== fieldName) {
          mapped[fieldName] = mapped[finalFieldName]
        }
      } else {
        // Include unmapped fields as well (with field ID as key) so all data is available
        // This ensures fields not in the mapping are still accessible
        mapped[fieldId] = this.convertBaserowValueToDisplayValue(value)
        
        if (tableName === 'emailIdeas' && fieldId.startsWith('field_')) {
          console.log(`⚠️ Unmapped emailIdeas field found: ${fieldId} =`, typeof value === 'string' && value.length > 100 ? value.substring(0, 50) + '...' : value)
        }
      }
    }
    
    // Log mapping results for emailIdeas to help debug
    if (tableName === 'emailIdeas') {
      console.log(`🗺️ Mapped emailIdeas fields:`, Object.keys(mapped).length, 'total fields')
      console.log(`🗺️ Mapped field names:`, Object.keys(mapped).filter(k => !k.startsWith('field_')).join(', '))
      if (mapped.generatedHtml || mapped.generatedhtml) {
        const htmlField = mapped.generatedHtml || mapped.generatedhtml
        console.log(`✅ Generated HTML found:`, htmlField ? `${htmlField.length} characters` : 'empty')
      } else {
        console.log(`⚠️ Generated HTML not found in mapped fields`)
      }
    }
    
    if (tableName === 'brandAssets' && convertToCamelCase) {
      console.log('🗺️ Mapped brand asset from Baserow:', mapped)
    }
    
    return mapped
  }

  private convertBaserowValueToDisplayValue(value: any, fieldName?: string): any {
    // Handle null/undefined
    if (value === null || value === undefined) {
      return value
    }
    
    // Handle date/time strings for datetime-local inputs
    // Baserow returns: "2025-10-08T14:30:00+00:00" or "2025-10-08T14:30:00.000Z"
    // datetime-local needs: "2025-10-08T14:30"
    if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
      // Extract just the date and time part (YYYY-MM-DDTHH:mm)
      return value.substring(0, 16)
    }
    
    // Handle arrays
    if (Array.isArray(value)) {
      // If it's an array of file objects (Baserow file field), extract the URL from the first file
      if (value.length > 0 && typeof value[0] === 'object' && value[0] !== null && 'url' in value[0]) {
        return value[0].url // Return the URL of the first file
      }
      
      // If it's an array of select objects with 'value' properties (multiple select fields)
      if (value.length > 0 && typeof value[0] === 'object' && value[0] !== null && 'value' in value[0]) {
        // Return as array for form compatibility (forms expect arrays for multi-select)
        return value.map(item => item.value)
      }
      
      // For other array types, return as-is
      return value
    }
    
    // Handle single select objects {id, value, color}
    if (typeof value === 'object' && value?.value) {
      return value.value
    }
    
    // Handle other types (strings, numbers, etc.)
    return value
  }

  private async findFeaturedImageFieldId(tableId: string): Promise<number | null> {
    try {
      console.log(`🔍 Fetching table fields for table ${tableId} to find featured_image link_row field...`)
      const fields = await this.getTableFields(tableId)
      
      if (!fields || !Array.isArray(fields)) {
        console.error('❌ Invalid fields response:', fields)
        return null
      }
      
      console.log(`📋 Found ${fields.length} fields in table. Searching for featured_image link_row field...`)
      
      // First, look specifically for "Featured Image" link_row field (exact match preferred)
      let featuredImageField = fields.find((field: any) => {
        if (!field.name || field.type !== 'link_row') return false
        
        // Exact matches first (most reliable)
        const exactMatches = 
          field.name === 'Featured Image' ||
          field.name === 'featured_image' ||
          field.name === 'FeaturedImage' ||
          field.name.toLowerCase() === 'featured image'
        
        if (exactMatches) {
          console.log(`✅ Found exact match: "${field.name}" (type: ${field.type}, ID: ${field.id})`)
          return true
        }
        
        return false
      })
      
      // If no exact match, try partial match but ONLY for link_row fields
      if (!featuredImageField) {
        featuredImageField = fields.find((field: any) => {
          if (!field.name || field.type !== 'link_row') return false
          
          const name = field.name.toLowerCase().replace(/\s+/g, '').replace(/_/g, '')
          const fieldNameLower = field.name.toLowerCase()
          
          // Only match if it contains both "featured" and "image" AND is a link_row
          const matches = 
            name === 'featuredimage' || 
            name === 'featured_image' ||
            (fieldNameLower.includes('featured') && fieldNameLower.includes('image') && !fieldNameLower.includes('prompt') && !fieldNameLower.includes('url') && !fieldNameLower.includes('alt'))
          
          if (matches) {
            console.log(`🔍 Found partial match: "${field.name}" (type: ${field.type}, ID: ${field.id})`)
          }
          
          return matches
        })
      }
      
      if (featuredImageField && featuredImageField.type === 'link_row') {
        console.log(`✅ Auto-detected featured_image link_row field: "${featuredImageField.name}" (type: ${featuredImageField.type}, ID: ${featuredImageField.id}, links to table: ${featuredImageField.link_row_table_id})`)
        return featuredImageField.id
      } else {
        console.warn(`⚠️ No featured_image link_row field found.`)
        console.warn(`   Available link_row fields:`, fields.filter((f: any) => f.type === 'link_row').map((f: any) => `${f.name} (ID: ${f.id})`).join(', '))
      }
    } catch (error) {
      console.error('❌ Error auto-detecting featured_image field:', error)
      if (error instanceof Error) {
        console.error('   Error message:', error.message)
        console.error('   Error stack:', error.stack)
      }
    }
    return null
  }

  private mapFieldsToBaserow(data: any, tableName: string) {
    const mapped: any = {}
    
    // Get field mappings for this table
    const tableFieldMappings = this.fieldMappings[tableName]
    console.log(`DEBUG: Available field mappings for ${tableName}:`, Object.keys(tableFieldMappings || {}))
    
    if (!tableFieldMappings || Object.keys(tableFieldMappings).length === 0) {
      console.log(`No dynamic field mappings found for table: ${tableName}, using hardcoded fallback`)
      
      // Use hardcoded field mappings as fallback
      switch (tableName) {
        case 'socialMediaContent':
          return mapSocialMediaContentToBaserow(data)
        case 'brandAssets':
          return mapBrandAssetsToBaserow(data)
        case 'images':
          return mapImagesToBaserow(data)
        case 'emailIdeas':
          return mapEmailIdeasToBaserow(data)
        case 'templates':
          return mapTemplatesToBaserow(data)
        case 'imageIdeas':
          return mapImageIdeasToBaserow(data)
        case 'contentIdeas':
          // For contentIdeas, we should use dynamic mapping, so return data as-is for fallback
          console.log(`Using fallback for contentIdeas - returning data as-is`)
          return data
        case 'blogRequests':
          // For blogRequests, we should use dynamic mapping, so return data as-is for fallback
          console.log(`Using fallback for blogRequests - returning data as-is`)
          return data
        case 'blogPosts':
          // For blogPosts, we should use dynamic mapping, so return data as-is for fallback
          console.log(`Using fallback for blogPosts - returning data as-is`)
          return data
        default:
          console.log(`No fallback mapping found for table: ${tableName}`)
          return data
      }
    }
    
    // Helper function to convert camelCase to field mapping names
    const convertFieldName = (camelCaseName: string): string => {
      const conversions: Record<string, string> = {
        'contentIdea': 'contentidea',
        'ideaType': 'ideatype', 
        'numberOfPosts': 'number_of_posts',
        'hookFocus': 'hook_focus',
        'targetAudience': 'targetaudience',
        'informationSource': 'information_source',
        'sourceUrl': 'sourceurl',
        'sourceContent': 'sourcecontent',
        'contentStrategy': 'contentstrategy',
        'contentTypeStrategy': 'contenttypestrategy',
        'primaryObjective': 'primaryobjectiveoptions',
        'scheduledTime': 'scheduledtime',
        // Social Media Content fields
        'contentTheme': 'contenttheme',
        'psychologicalTrigger': 'psychologicaltrigger',
        'engagementObjective': 'engagementobjective',
        'imagePrompt': 'imageprompt',
        // Brand Assets fields
        'assetName': 'assetname',
        'contentType': 'contenttype',
        'assetType': 'assettype',
        'assetInformation': 'assetinformation',
        'fileUrl': 'fileurl',
        'brandVoiceGuidelines': 'brandvoiceguidelines',
        'approvedHashtags': 'approvedhashtags',
        'toneStylePreferences': 'tone/stylepreferences',
        'forbiddenWordsTopics': 'forbiddenwords/topics',
        'platformSpecificRules': 'platform-specificrules',
        'notes': 'assetnotes',
        'createdDate': 'createddate',
        'lastUpdated': 'lastupdated',
        // Blog Post fields
        'featuredImage': 'featuredimage',
        'featured_image': 'featuredimage',
        'featuredImageUrl': 'featuredimageurl',
        'featured_image_url': 'featuredimageurl',
        'featuredImageAlt': 'featuredimagealt',
        'featured_image_alt': 'featuredimagealt'
      }
      return conversions[camelCaseName] || camelCaseName.toLowerCase()
    }

    // Map field names to field IDs
    for (const [fieldName, value] of Object.entries(data)) {
      const mappedFieldName = convertFieldName(fieldName)
      const fieldId = tableFieldMappings[mappedFieldName]
      console.log(`DEBUG: Mapping field "${fieldName}" -> "${mappedFieldName}" -> fieldId: ${fieldId}`)
      
      if (fieldId) {
        // Skip null/undefined values
        if (value === null || value === undefined) {
          console.log(`Skipping null/undefined value for field: ${mappedFieldName} (${fieldName})`)
          continue
        }
        
        // Skip empty arrays for link_row fields (templates, images, etc.)
        if (Array.isArray(value) && value.length === 0) {
          console.log(`Skipping empty array for link_row field: ${mappedFieldName} (${fieldName})`)
          continue
        }
        
        // Skip read-only fields (created_on, last_modified) - they're automatically set by Baserow
        if (mappedFieldName === 'submission_timestamp' || mappedFieldName === 'created_at' || mappedFieldName === 'updated_at') {
          continue
        }
        
        // Skip empty strings for select fields to avoid validation errors
        if (value === '' && (mappedFieldName === 'category' || mappedFieldName === 'status' || mappedFieldName === 'tags' || mappedFieldName === 'meta_title' || mappedFieldName === 'meta_description')) {
          continue
        }
        
        // Convert empty strings to null for datetime fields (Baserow doesn't accept empty strings)
        // Check if this is likely a datetime field by checking common datetime field names
        const isDateTimeField = mappedFieldName.includes('time') || 
                                mappedFieldName.includes('date') || 
                                mappedFieldName.includes('scheduled') ||
                                mappedFieldName.includes('timestamp') ||
                                fieldName.toLowerCase().includes('time') ||
                                fieldName.toLowerCase().includes('date') ||
                                fieldName.toLowerCase().includes('scheduled')
        
        if (isDateTimeField && (value === '' || value === null || value === undefined)) {
          console.log(`Converting empty/null value to null for datetime field: ${mappedFieldName} (${fieldName})`)
          mapped[`field_${fieldId}`] = null
        } else if (value === '') {
          // For non-datetime fields, skip empty strings to avoid validation errors
          console.log(`Skipping empty string for field: ${mappedFieldName} (${fieldName})`)
          continue
        } else {
          mapped[`field_${fieldId}`] = value
        }
      } else {
        // Keep unmapped fields as-is (like id, order)
        mapped[fieldName] = value
      }
    }
    
    return mapped
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`
    
    console.log('BaserowAPI: Making request to:', url)
    console.log('BaserowAPI: Request options:', {
      method: options.method || 'GET',
      headers: {
        'Authorization': `Token ${this.token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: options.body
    })
    
    // Add timeout to the fetch request
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout
    
    let response: Response
    try {
      response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Authorization': `Token ${this.token}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      })
      
      clearTimeout(timeoutId)
    } catch (error: any) {
      clearTimeout(timeoutId)
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after 30 seconds: ${url}`)
      }
      throw error
    }

    console.log('BaserowAPI: Response status:', response.status)
    console.log('BaserowAPI: Response headers:', Object.fromEntries(response.headers.entries()))
    
    if (!response.ok) {
      let errorText = await response.text()
      console.error('BaserowAPI: Error response:', errorText)
      
      // Try to parse as JSON to get detailed error info
      try {
        const errorJson = JSON.parse(errorText)
        if (errorJson.detail) {
          console.error('BaserowAPI: Validation errors by field:', errorJson.detail)
          // Format the error details for better visibility
          const fieldErrors = Object.entries(errorJson.detail)
            .map(([field, errors]: [string, any]) => {
              const errorMessages = Array.isArray(errors) 
                ? errors.map((e: any) => e.error || e.message || String(e)).join(', ')
                : String(errors)
              return `${field}: ${errorMessages}`
            })
            .join('; ')
          throw new Error(`Baserow API Error: ${response.status} - ${errorJson.error || 'Validation failed'}. Field errors: ${fieldErrors}`)
        }
        throw new Error(`Baserow API Error: ${response.status} - ${errorJson.error || errorText}`)
      } catch (parseError) {
        // If it's not JSON, throw with the text error
        throw new Error(`Baserow API Error: ${response.status} - ${errorText}`)
      }
    }

    // Handle 204 No Content (common for DELETE operations)
    if (response.status === 204) {
      console.log('BaserowAPI: 204 No Content response (successful DELETE)')
      return { success: true }
    }

    // Check if response is JSON
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      const textResponse = await response.text()
      console.error('BaserowAPI: Non-JSON response received:', textResponse)
      // For empty responses on successful operations, return success
      if (textResponse === '' && response.ok) {
        console.log('BaserowAPI: Empty response on successful operation')
        return { success: true }
      }
      throw new Error(`Baserow API returned non-JSON response: ${textResponse}`)
    }

    const result = await response.json()
    console.log('BaserowAPI: Response body:', result)
    return result
  }

  // Create a new content idea
  async createContentIdea(tableId: string, data: any) {
    console.log('BaserowAPI: Creating content idea with data:', data)
    console.log('BaserowAPI: Using table ID:', tableId)
    
    // Use user_field_names=true to send human-readable field names directly
    const result = await this.request(`/api/database/rows/table/${tableId}/?user_field_names=true`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
    
    console.log('BaserowAPI: Response received:', result)
    return result
  }

  // Get all content ideas
  async getContentIdeas(tableId: string, filters?: any) {
    let endpoint = `/api/database/rows/table/${tableId}/`
    
    if (filters) {
      const params = new URLSearchParams(filters)
      endpoint += `?${params.toString()}`
    }
    
    return this.request(endpoint)
  }

  // Get a single content idea by ID
  async getContentIdea(tableId: string, rowId: string) {
    return this.request(`/api/database/rows/table/${tableId}/${rowId}/`)
  }

  // Alias for consistency
  async getContentIdeaById(tableId: string, rowId: string) {
    return this.getContentIdea(tableId, rowId)
  }

  // Update content idea
  async updateContentIdea(tableId: string, rowId: string, data: any) {
    console.log('BaserowAPI: Updating content idea:', rowId, 'with data:', data)
    
    // Use user_field_names=true to send human-readable field names directly
    const result = await this.request(`/api/database/rows/table/${tableId}/${rowId}/?user_field_names=true`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
    
    console.log('BaserowAPI: Content idea updated:', result)
    return result
  }

  // Delete content idea
  async deleteContentIdea(tableId: string, rowId: string) {
    console.log('BaserowAPI: Deleting content idea:', rowId)
    
    const result = await this.request(`/api/database/rows/table/${tableId}/${rowId}/`, {
      method: 'DELETE',
    })
    
    console.log('BaserowAPI: Content idea deleted:', result)
    return result
  }

  // Get table structure to debug field issues
  async getTableStructure(tableId: string) {
    console.log('BaserowAPI: Getting table structure for table:', tableId)
    
    try {
      const result = await this.request(`/api/database/rows/table/${tableId}/?size=1`)
      console.log('BaserowAPI: Table structure sample:', JSON.stringify(result, null, 2))
      return result
    } catch (error) {
      console.error('BaserowAPI: Error getting table structure:', error)
      throw error
    }
  }

  // Get table fields metadata to find field IDs by name
  async getTableFields(tableId: string) {
    console.log('BaserowAPI: Getting table fields for table:', tableId)
    
    try {
      // Get all fields for this table directly
      const fields = await this.request(`/api/database/fields/table/${tableId}/`)
      console.log(`BaserowAPI: Retrieved ${fields?.length || 0} fields from table ${tableId}`)
      
      if (fields && Array.isArray(fields)) {
        // Log all field names for debugging
        console.log('BaserowAPI: Field names:', fields.map((f: any) => `${f.name} (${f.type})`).join(', '))
      }
      
      return fields
    } catch (error) {
      console.error('BaserowAPI: Error getting table fields:', error)
      if (error instanceof Error) {
        console.error('   Error details:', error.message)
      }
      throw error
    }
  }

  // Upload file to Baserow
  async uploadFile(file: File): Promise<any> {
    try {
      console.log('📤 BaserowAPI.uploadFile called:', {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        isFile: file instanceof File,
        isBlob: file instanceof Blob
      })

      // In server-side Next.js, convert File to Blob for better compatibility
      let fileToUpload: File | Blob = file
      
      // If we're in a server environment and the file needs conversion
      if (typeof window === 'undefined') {
        // Server-side: convert to Blob for FormData compatibility
        try {
          const arrayBuffer = await file.arrayBuffer()
          fileToUpload = new Blob([arrayBuffer], { type: file.type || 'application/octet-stream' })
          console.log('📦 Converted File to Blob for server-side upload')
        } catch (conversionError) {
          console.warn('⚠️ Could not convert File to Blob, using original:', conversionError)
          // Fall back to using the original file
          fileToUpload = file
        }
      }

      const formData = new FormData()
      // FormData.append accepts File, Blob, or string
      // If it's a Blob, we can't specify filename in append, but Baserow should handle it
      if (fileToUpload instanceof File) {
        formData.append('file', fileToUpload, file.name || 'uploaded-file')
      } else {
        // For Blob, we can't specify filename in FormData.append, but that's okay
        formData.append('file', fileToUpload, file.name || 'uploaded-file')
      }

      console.log('📤 Sending file to Baserow:', {
        url: `${this.baseUrl}/api/user-files/upload-file/`,
        fileName: file.name,
        fileSize: fileToUpload.size,
        fileType: fileToUpload.type
      })

      const response = await fetch(`${this.baseUrl}/api/user-files/upload-file/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${this.token}`,
        },
        body: formData
      })

      console.log('📥 Baserow file upload response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Baserow file upload error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        })
        throw new Error(`Baserow file upload failed: ${response.status} - ${errorText}`)
      }

      const result = await response.json()
      console.log('✅ Baserow file upload result:', result)
      return result
    } catch (error) {
      console.error('❌ Error in uploadFile:', error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error(`File upload failed: ${String(error)}`)
    }
  }

  // Update record with file references
  async updateRecordWithFiles(tableId: string, recordId: string, fileUpdates: any) {
    return this.request(`/api/database/rows/table/${tableId}/${recordId}/`, {
      method: 'PATCH',
      body: JSON.stringify(fileUpdates),
    })
  }

  // Social Media Content API methods
  async createSocialMediaContent(tableId: string, data: any) {
    console.log('BaserowAPI: Creating social media content with data:', data)
    console.log('BaserowAPI: Using table ID:', tableId)
    
    // Map human-readable field names to Baserow field IDs
    const baserowData = this.mapFieldsToBaserow(data, 'socialMediaContent')
    
    const result = await this.request(`/api/database/rows/table/${tableId}/`, {
      method: 'POST',
      body: JSON.stringify(baserowData),
    })
    
    console.log('BaserowAPI: Social media content created:', result)
    
    // Map response back to human-readable format with camelCase conversion
    return {
      ...result,
      ...this.mapFieldsFromBaserow(result, 'socialMediaContent', true)
    }
  }

  async getSocialMediaContent(tableId: string, filters: any = {}) {
    console.log('BaserowAPI: Getting social media content with filters:', filters)
    console.log('BaserowAPI: Table ID:', tableId)
    
    // Build query parameters
    const params = new URLSearchParams()
    
    // Add filters
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null) {
        // Handle contentIdea filter - convert to proper field format
        if (key === 'contentIdea') {
          const contentIdeaFieldId = this.fieldMappings?.socialMediaContent?.contentidea
          if (contentIdeaFieldId) {
            params.append(`filter__field_${contentIdeaFieldId}__link_row_has`, filters[key])
          } else {
            console.warn('BaserowAPI: contentIdea field mapping not found, skipping filter')
          }
        } else {
        params.append(key, filters[key])
        }
      }
    })
    
    // Add include parameter for all social media content fields using dynamic field mapping
    const socialMediaFieldMappings = this.fieldMappings?.socialMediaContent
    const imageFieldMappings = this.fieldMappings?.images
    
    let allFields: string[] = []
    
    if (socialMediaFieldMappings) {
      // Convert social media field mappings to field IDs
      const socialMediaFields = Object.values(socialMediaFieldMappings).map(fieldId => `field_${fieldId}`)
      console.log('BaserowAPI: Using dynamic social media fields:', socialMediaFields)
      allFields = [...allFields, ...socialMediaFields]
    }
    
    if (imageFieldMappings) {
      // Convert image field mappings to field IDs
      const imageFields = Object.values(imageFieldMappings).map(fieldId => `field_${fieldId}`)
      console.log('BaserowAPI: Using dynamic image fields:', imageFields)
      allFields = [...allFields, ...imageFields]
    }
    
    if (allFields.length > 0) {
    params.append('include', allFields.join(','))
    } else {
      console.log('BaserowAPI: No field mappings found, fetching all fields')
    }
    
    // Add expand parameter to get linked image details using dynamic field mapping
    if (socialMediaFieldMappings?.images) {
      const imagesFieldId = socialMediaFieldMappings.images
      console.log('BaserowAPI: Expanding images field:', `field_${imagesFieldId}`)
      params.append('expand', `field_${imagesFieldId}`)
    }
    
    const url = `/api/database/rows/table/${tableId}/?${params.toString()}`
    console.log('BaserowAPI: Making request to:', url)
    
    try {
      const result = await this.request(url, {
        method: 'GET'
      })
      
      console.log('BaserowAPI: Raw API response received:', result)
      console.log('BaserowAPI: Response has results:', !!result.results)
      console.log('BaserowAPI: Results count:', result.results?.length || 0)
      
      if (result.results && result.results.length > 0) {
        const sampleRow = result.results[0]
        console.log('BaserowAPI: Sample row before mapping:', sampleRow)
        console.log('BaserowAPI: Sample row keys:', Object.keys(sampleRow))
        
        // Check if field_7193 (images) is expanded
        if (sampleRow.field_7193) {
          console.log('BaserowAPI: field_7193 (images) content:', sampleRow.field_7193)
          if (Array.isArray(sampleRow.field_7193) && sampleRow.field_7193.length > 0) {
            console.log('BaserowAPI: First image object in field_7193:', sampleRow.field_7193[0])
            console.log('BaserowAPI: First image object keys:', Object.keys(sampleRow.field_7193[0]))
          }
        }
      }
      
      // Map all results to human-readable format with camelCase conversion
      if (result.results) {
        result.results = result.results.map((item: any) => ({
          ...item,
          ...this.mapFieldsFromBaserow(item, 'socialMediaContent', true)
        }))
      }
      
      console.log('BaserowAPI: Social media content retrieved:', result)
      return result
    } catch (error) {
      console.error('BaserowAPI: Error in getSocialMediaContent:', error)
      throw error
    }
  }

  async getSocialMediaContentById(tableId: string, rowId: string) {
    console.log('BaserowAPI: Getting social media content by ID:', rowId)
    
    const result = await this.request(`/api/database/rows/table/${tableId}/${rowId}/`)
    
    console.log('BaserowAPI: Social media content retrieved by ID:', result)
    
    // Map fields to human-readable format with camelCase conversion
    return {
      ...result,
      ...this.mapFieldsFromBaserow(result, 'socialMediaContent', true)
    }
  }

  async updateSocialMediaContent(tableId: string, rowId: string, data: any) {
    console.log('BaserowAPI: Updating social media content:', rowId, 'with data:', data)
    
    // Map human-readable field names to Baserow field IDs
    const baserowData = this.mapFieldsToBaserow(data, 'socialMediaContent')
    console.log('BaserowAPI: Mapped data for Baserow:', baserowData)
    
    const result = await this.request(`/api/database/rows/table/${tableId}/${rowId}/`, {
      method: 'PATCH',
      body: JSON.stringify(baserowData),
    })
    
    console.log('BaserowAPI: Social media content updated:', result)
    
    // Map response back to human-readable format with camelCase conversion
    return {
      ...result,
      ...this.mapFieldsFromBaserow(result, 'socialMediaContent', true)
    }
  }

  async deleteSocialMediaContent(tableId: string, rowId: string) {
    console.log('BaserowAPI: Deleting social media content:', rowId)
    
    const result = await this.request(`/api/database/rows/table/${tableId}/${rowId}/`, {
      method: 'DELETE',
    })
    
    console.log('BaserowAPI: Social media content deleted:', result)
    return result
  }

  // Brand Assets API methods
  async createBrandAsset(tableId: string, data: any) {
    console.log('BaserowAPI: Creating brand asset with data:', data)
    console.log('BaserowAPI: Using table ID:', tableId)
    
    // Map human-readable field names to Baserow field IDs
    const baserowData = this.mapFieldsToBaserow(data, 'brandAssets')
    
    const result = await this.request(`/api/database/rows/table/${tableId}/`, {
      method: 'POST',
      body: JSON.stringify(baserowData),
    })
    
    console.log('BaserowAPI: Brand asset created:', result)
    
    // Map response back to human-readable format
    return {
      ...result,
      ...this.mapFieldsFromBaserow(result, 'brandAssets')
    }
  }

  async getBrandAssets(tableId: string, filters?: any) {
    console.log('BaserowAPI: Getting brand assets from table:', tableId)
    console.log('BaserowAPI: With filters:', filters)
    
    let endpoint = `/api/database/rows/table/${tableId}/`
    
    if (filters) {
      const params = new URLSearchParams()
      
      // Handle common filter parameters
      if (filters.platform) {
        params.append('filter__field_7155__equal', filters.platform)
      }
      if (filters.status) {
        params.append('filter__field_7161__equal', filters.status)
      }
      if (filters.contentType) {
        params.append('filter__field_7156__equal', filters.contentType)
      }
      if (filters.assetType) {
        params.append('filter__field_7157__equal', filters.assetType)
      }
      if (filters.priority) {
        params.append('filter__field_7162__equal', filters.priority)
      }
      if (filters.page) {
        params.append('page', filters.page.toString())
      }
      if (filters.size) {
        params.append('size', filters.size.toString())
      }
      
      if (params.toString()) {
        endpoint += `?${params.toString()}`
      }
    }
    
    console.log('BaserowAPI: Making request to endpoint:', endpoint)
    
    try {
      const result = await this.request(endpoint)
      console.log('BaserowAPI: Raw result received:', result)
    
    // Map all results to human-readable format
    if (result.results) {
      result.results = result.results.map((item: any) => ({
        ...item,
        ...this.mapFieldsFromBaserow(item, 'brandAssets')
      }))
    }
    
    console.log('BaserowAPI: Brand assets retrieved:', result)
    return result
    } catch (error) {
      console.error('BaserowAPI: Error in getBrandAssets:', error)
      throw error
    }
  }

  async updateBrandAsset(tableId: string, rowId: string, data: any) {
    console.log('BaserowAPI: Updating brand asset:', rowId, 'with data:', data)
    
    // Map human-readable field names to Baserow field IDs
    const baserowData = this.mapFieldsToBaserow(data, 'brandAssets')
    
    const result = await this.request(`/api/database/rows/table/${tableId}/${rowId}/`, {
      method: 'PATCH',
      body: JSON.stringify(baserowData),
    })
    
    console.log('BaserowAPI: Brand asset updated:', result)
    
    // Map response back to human-readable format
    return {
      ...result,
      ...this.mapFieldsFromBaserow(result, 'brandAssets')
    }
  }

  async deleteBrandAsset(tableId: string, rowId: string) {
    console.log('BaserowAPI: Deleting brand asset:', rowId)
    
    const result = await this.request(`/api/database/rows/table/${tableId}/${rowId}/`, {
      method: 'DELETE',
    })
    
    console.log('BaserowAPI: Brand asset deleted:', result)
    return result
  }

  // Relationship query methods
  async getSocialMediaContentByContentIdea(contentIdeaId: string, tableId: string) {
    console.log('BaserowAPI: Getting social media content for content idea:', contentIdeaId)
    
    return this.getSocialMediaContent(tableId, {
      contentIdea: contentIdeaId
    })
  }

  async getBrandAssetsByPlatform(platform: string, tableId: string) {
    console.log('BaserowAPI: Getting brand assets for platform:', platform)
    
    return this.getBrandAssets(tableId, {
      platform: platform,
      status: 'Active' // Only get active assets by default
    })
  }

  // Email Ideas Methods
  async getEmailIdeas(tableId: string, filters?: any) {
    console.log('BaserowAPI: Getting email ideas from table:', tableId)
    console.log('BaserowAPI: With filters:', filters)
    
    let endpoint = `/api/database/rows/table/${tableId}/`
    
    if (filters) {
      const params = new URLSearchParams()
      
      // Handle common filter parameters
      if (filters.emailType) {
        params.append('filter__field_7201__equal', filters.emailType)
      }
      if (filters.status) {
        params.append('filter__field_7200__equal', filters.status)
      }
      if (filters.page) {
        params.append('page', filters.page.toString())
      }
      if (filters.size) {
        params.append('size', filters.size.toString())
      }
      
      if (params.toString()) {
        endpoint += `?${params.toString()}`
      }
    }
    
    console.log('BaserowAPI: Making request to endpoint:', endpoint)
    
    try {
      const result = await this.request(endpoint)
      console.log('BaserowAPI: Raw result received:', result)
      
      // Map all results to human-readable format
      if (result.results) {
        result.results = result.results.map((item: any) => {
          const mappedFields = this.mapFieldsFromBaserow(item, 'emailIdeas', false)
          // For emailIdeas, merge mapped fields with original item, with mapped fields taking precedence
          // This ensures all fields are available in both formats (field IDs and mapped names)
          return {
            ...item,           // Original Baserow fields (field_XXXXX format)
            ...mappedFields    // Mapped human-readable fields (overrides any duplicates)
          }
        })
      }
      
      console.log('BaserowAPI: Email ideas retrieved:', result)
      return result
    } catch (error) {
      console.error('BaserowAPI: Error in getEmailIdeas:', error)
      throw error
    }
  }

  async getEmailIdeaById(tableId: string, rowId: string) {
    console.log('BaserowAPI: Getting email idea by ID:', rowId, 'from table:', tableId)
    
    try {
      const result = await this.request(`/api/database/rows/table/${tableId}/${rowId}/`)
      console.log('BaserowAPI: Raw email idea result:', result)
      console.log('BaserowAPI: All field keys in raw result:', Object.keys(result))
      
      // Map to human-readable format
      const mappedFields = this.mapFieldsFromBaserow(result, 'emailIdeas', false)
      console.log('BaserowAPI: Mapped fields:', mappedFields)
      console.log('BaserowAPI: generatedHtml in mapped fields:', mappedFields.generatedHtml)
      console.log('BaserowAPI: All keys in mapped fields:', Object.keys(mappedFields))
      
      // For emailIdeas, ensure we have both original fields and mapped fields
      // Mapped fields take precedence, but original fields are kept for debugging
      const mappedResult = {
        ...result,        // Keep original Baserow response fields
        ...mappedFields   // Add mapped fields (these override duplicates)
      }
      
      // Ensure common emailIdeas fields are accessible in multiple formats
      // Create lowercase aliases for fields that might be in camelCase
      const fieldAliases: Record<string, string[]> = {
        'emailideaname': ['emailIdeaName', 'email_idea_name'],
        'emailtype': ['emailType', 'email_type'],
        'emailtextidea': ['emailTextIdea', 'email_text_idea'],
        'generatedhtml': ['generatedHtml', 'generated_html'],
        'emailurlidea': ['emailUrlIdea', 'email_url_idea'],
        'emailvoiceidea': ['emailVoiceIdea', 'email_voice_idea'],
        'emailvideoidea': ['emailVideoIdea', 'email_video_idea'],
        'emailimageidea': ['emailImageIdea', 'email_image_idea'],
        'createddate': ['createdDate', 'created_date'],
        'lastmodified': ['lastModified', 'last_modified']
      }
      
      // Create lowercase aliases for fields that might be in camelCase
      for (const [lowercaseKey, possibleKeys] of Object.entries(fieldAliases)) {
        if (!mappedResult[lowercaseKey]) {
          // Try to find the field in any of the possible formats
          for (const key of possibleKeys) {
            if (mappedResult[key]) {
              mappedResult[lowercaseKey] = mappedResult[key]
              break
            }
          }
        }
      }
      
      // Ensure generatedHtml is accessible (check both camelCase and snake_case)
      if (!mappedResult.generatedHtml) {
        // Try to find it by field ID
        const fieldIdKeys = Object.keys(result).filter(key => key.startsWith('field_'))
        console.log('BaserowAPI: Searching for generatedHtml in field IDs:', fieldIdKeys)
        for (const fieldId of fieldIdKeys) {
          if (result[fieldId] && typeof result[fieldId] === 'string' && result[fieldId].length > 100) {
            // Likely HTML content
            console.log(`BaserowAPI: Found potential HTML in ${fieldId}:`, result[fieldId].substring(0, 50))
          }
        }
      }
      
      console.log('BaserowAPI: Final mapped email idea - generatedHtml:', mappedResult.generatedHtml ? 'Found' : 'Missing')
      return mappedResult
    } catch (error) {
      console.error('BaserowAPI: Error in getEmailIdeaById:', error)
      throw error
    }
  }

  async createEmailIdea(tableId: string, data: any) {
    console.log('BaserowAPI: Creating email idea with data:', data)
    
    // Map human-readable field names to Baserow field IDs
    const baserowData = this.mapFieldsToBaserow(data, 'emailIdeas')
    
    const result = await this.request(`/api/database/rows/table/${tableId}/`, {
      method: 'POST',
      body: JSON.stringify(baserowData),
    })
    
    console.log('BaserowAPI: Email idea created:', result)
    
    // Map response back to human-readable format
    return {
      ...result,
      ...this.mapFieldsFromBaserow(result, 'emailIdeas')
    }
  }

  async updateEmailIdea(tableId: string, rowId: string, data: any, files?: { [key: string]: File[] }) {
    console.log('BaserowAPI: Updating email idea:', rowId, 'with data:', data)
    console.log('BaserowAPI: Files to upload:', files)
    
    // Map human-readable field names to Baserow field IDs
    const baserowData = this.mapFieldsToBaserow(data, 'emailIdeas')
    
    // If there are files to upload, handle them first
    if (files && Object.keys(files).length > 0) {
      console.log('BaserowAPI: Processing file uploads for email idea update')
      
      // Upload files and get their URLs
      const fileUrls: { [key: string]: string[] } = {}
      
      for (const [fieldName, fileList] of Object.entries(files)) {
        if (fileList && fileList.length > 0) {
          const urls = []
          for (const file of fileList) {
            try {
              const fileUrl = await this.uploadFile(file)
              urls.push(fileUrl)
            } catch (error) {
              console.error(`BaserowAPI: Error uploading file ${file.name}:`, error)
            }
          }
          if (urls.length > 0) {
            fileUrls[fieldName] = urls
          }
        }
      }
      
      // Add file URLs to the data
      if (fileUrls.emailVoiceIdea) {
        baserowData.field_7213 = fileUrls.emailVoiceIdea
      }
      if (fileUrls.emailVideoIdea) {
        baserowData.field_7214 = fileUrls.emailVideoIdea
      }
      if (fileUrls.emailImageIdea) {
        baserowData.field_7215 = fileUrls.emailImageIdea
      }
    }
    
    const result = await this.request(`/api/database/rows/table/${tableId}/${rowId}/`, {
      method: 'PATCH',
      body: JSON.stringify(baserowData),
    })
    
    console.log('BaserowAPI: Email idea updated:', result)
    
    // Map response back to human-readable format
    return {
      ...result,
      ...this.mapFieldsFromBaserow(result, 'emailIdeas')
    }
  }

  async deleteEmailIdea(tableId: string, rowId: string) {
    console.log('BaserowAPI: Deleting email idea:', rowId)
    
    const result = await this.request(`/api/database/rows/table/${tableId}/${rowId}/`, {
      method: 'DELETE',
    })
    
    console.log('BaserowAPI: Email idea deleted:', result)
    return result
  }

  // Templates Methods
  async getTemplates(tableId: string, filters?: any) {
    console.log('BaserowAPI: Getting templates from table:', tableId)
    console.log('BaserowAPI: With filters:', filters)
    
    let endpoint = `/api/database/rows/table/${tableId}/`
    
    if (filters) {
      const params = new URLSearchParams()
      
      // Handle common filter parameters
      if (filters.templateType) {
        params.append('filter__field_7207__equal', filters.templateType)
      }
      if (filters.templateCategory) {
        params.append('filter__field_7206__equal', filters.templateCategory)
      }
      if (filters.isActive !== undefined) {
        params.append('filter__field_7210__equal', filters.isActive.toString())
      }
      if (filters.page) {
        params.append('page', filters.page.toString())
      }
      if (filters.size) {
        params.append('size', filters.size.toString())
      }
      
      if (params.toString()) {
        endpoint += `?${params.toString()}`
      }
    }
    
    console.log('BaserowAPI: Making request to endpoint:', endpoint)
    
    try {
      const result = await this.request(endpoint)
      console.log('BaserowAPI: Raw result received:', result)
      
      // Map all results to human-readable format
      if (result.results) {
        result.results = result.results.map((item: any) => ({
          ...item,
          ...this.mapFieldsFromBaserow(item, 'templates')
        }))
      }
      
      console.log('BaserowAPI: Templates retrieved:', result)
      return result
    } catch (error) {
      console.error('BaserowAPI: Error in getTemplates:', error)
      throw error
    }
  }

  async createTemplate(tableId: string, data: any) {
    console.log('BaserowAPI: Creating template with data:', data)
    
    // Map human-readable field names to Baserow field IDs
    const baserowData = this.mapFieldsToBaserow(data, 'templates')
    
    const result = await this.request(`/api/database/rows/table/${tableId}/`, {
      method: 'POST',
      body: JSON.stringify(baserowData),
    })
    
    console.log('BaserowAPI: Template created:', result)
    
    // Map response back to human-readable format
    return {
      ...result,
      ...this.mapFieldsFromBaserow(result, 'templates')
    }
  }

  async updateTemplate(tableId: string, rowId: string, data: any) {
    console.log('BaserowAPI: Updating template:', rowId, 'with data:', data)
    
    // Map human-readable field names to Baserow field IDs
    const baserowData = this.mapFieldsToBaserow(data, 'templates')
    
    const result = await this.request(`/api/database/rows/table/${tableId}/${rowId}/`, {
      method: 'PATCH',
      body: JSON.stringify(baserowData),
    })
    
    console.log('BaserowAPI: Template updated:', result)
    
    // Map response back to human-readable format
    return {
      ...result,
      ...this.mapFieldsFromBaserow(result, 'templates')
    }
  }

  async deleteTemplate(tableId: string, rowId: string) {
    console.log('BaserowAPI: Deleting template:', rowId)
    
    const result = await this.request(`/api/database/rows/table/${tableId}/${rowId}/`, {
      method: 'DELETE',
    })
    
    console.log('BaserowAPI: Template deleted:', result)
    return result
  }

  // Utility methods for linking records
  async linkSocialMediaContentToIdea(socialMediaTableId: string, socialMediaRowId: string, contentIdeaId: string) {
    console.log('BaserowAPI: Linking social media content to content idea:', socialMediaRowId, '->', contentIdeaId)
    
    return this.updateSocialMediaContent(socialMediaTableId, socialMediaRowId, {
      contentIdea: contentIdeaId
    })
  }

  async getSocialMediaContentStats(contentIdeaId: string, tableId: string) {
    console.log('BaserowAPI: Getting social media content stats for content idea:', contentIdeaId)
    
    const result = await this.getSocialMediaContentByContentIdea(contentIdeaId, tableId)
    
    const stats = {
      total: result.count || 0,
      byPlatform: {} as Record<string, number>,
      byStatus: {} as Record<string, number>
    }
    
    if (result.results) {
      result.results.forEach((item: any) => {
        // Count by platform
        if (item.platform) {
          stats.byPlatform[item.platform] = (stats.byPlatform[item.platform] || 0) + 1
        }
        
        // Count by status
        if (item.status) {
          stats.byStatus[item.status] = (stats.byStatus[item.status] || 0) + 1
        }
      })
    }
    
    return stats
  }

  // Image methods
  async createImage(tableId: string, data: any) {
    console.log('BaserowAPI: Creating image with data:', data)
    console.log('BaserowAPI: Using table ID:', tableId)
    
    // Map human-readable field names to Baserow field IDs
    const mappedData = this.mapFieldsToBaserow(data, 'images')
    
    // Check if this is a social media upload (not an email image)
    // If imageScene or position is 'Social Media Post', exclude emailImages field
    const isSocialMediaUpload = data.imageScene === 'Social Media Post' || 
                                data.position === 'Social Media Post' ||
                                (data.imageScene && typeof data.imageScene === 'string' && data.imageScene.includes('Social Media'))
    
    if (isSocialMediaUpload) {
      // Remove emailImages field from mapped data if it exists
      // emailImages is a single-select field with specific options (Header, Body 1, etc.)
      // and 'Social Media Post' is not a valid option
      const emailImagesFieldId = this.fieldMappings?.images?.emailimages || 
                                  this.fieldMappings?.images?.emailImages
      
      if (emailImagesFieldId) {
        const emailImagesFieldKey = `field_${emailImagesFieldId}`
        if (mappedData[emailImagesFieldKey] !== undefined) {
          console.log(`Removing emailImages field (${emailImagesFieldKey}) for social media upload`)
          delete mappedData[emailImagesFieldKey]
        }
      }
      
      // Also check for hardcoded field ID (field_7226) if dynamic mapping wasn't used
      if (mappedData.field_7226 !== undefined) {
        console.log('Removing hardcoded emailImages field (field_7226) for social media upload')
        delete mappedData.field_7226
      }
    }
    
    console.log('BaserowAPI: Mapped data for Baserow:', mappedData)
    
    const result = await this.request(`/api/database/rows/table/${tableId}/`, {
      method: 'POST',
      body: JSON.stringify(mappedData),
    })
    
    console.log('BaserowAPI: Image created:', result)
    return result
  }

  async getImages(tableId: string, filters?: any) {
    console.log('BaserowAPI: Getting images with filters:', filters)
    
    let endpoint = `/api/database/rows/table/${tableId}/`
    
    if (filters) {
      const params = new URLSearchParams()
      
      // Handle pagination
      if (filters.page) params.append('page', filters.page.toString())
      if (filters.size) params.append('size', filters.size.toString())
      
      // Handle filters
      Object.keys(filters).forEach(key => {
        if (key.startsWith('filter__') && filters[key] !== undefined) {
          params.append(key, filters[key].toString())
        }
      })
      
      endpoint += `?${params.toString()}`
    }
    
    const result = await this.request(endpoint)
    console.log('BaserowAPI: Images retrieved:', result)
    
    // Map the field IDs to property names with camelCase conversion for frontend compatibility
    if (result.results) {
      result.results = result.results.map((image: any) => {
        console.log('BaserowAPI: Raw image data before mapping:', image)
        const mapped = this.mapFieldsFromBaserow(image, 'images', true)
        console.log('BaserowAPI: Mapped image data:', mapped)
        console.log('BaserowAPI: Image field in mapped data:', mapped.image)
        return mapped
      })
    }
    
    return result
  }

  async updateImage(tableId: string, rowId: string, data: any) {
    console.log('BaserowAPI: Updating image:', rowId, 'with data:', data)
    
    const result = await this.request(`/api/database/rows/table/${tableId}/${rowId}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
    
    console.log('BaserowAPI: Image updated:', result)
    return result
  }

  async getImageById(tableId: string, rowId: string) {
    console.log('BaserowAPI: Getting image by ID:', rowId)
    
    const result = await this.request(`/api/database/rows/table/${tableId}/${rowId}/`)
    console.log('BaserowAPI: Image retrieved:', result)
    
    // Map the field IDs to property names
    return this.mapFieldsFromBaserow(result, 'images')
  }

  async deleteImage(tableId: string, rowId: string) {
    console.log('BaserowAPI: Deleting image:', rowId)
    
    const result = await this.request(`/api/database/rows/table/${tableId}/${rowId}/`, {
      method: 'DELETE',
    })
    
    console.log('BaserowAPI: Image deleted:', result)
    return result
  }

  async getImagesBySocialMediaContent(socialMediaContentId: string, tableId: string) {
    console.log('BaserowAPI: Getting images for social media content:', socialMediaContentId)
    
    return this.getImages(tableId, {
      filter__field_7192__contains: socialMediaContentId
    })
  }

  async acceptImage(tableId: string, rowId: string) {
    console.log('BaserowAPI: Accepting image:', rowId)
    
    return this.updateImage(tableId, rowId, {
      field_7185: 'Accepted', // Image Status
      field_7196: new Date().toISOString() // Accepted At
    })
  }

  async rejectImage(tableId: string, rowId: string) {
    console.log('BaserowAPI: Rejecting image:', rowId)
    
    return this.updateImage(tableId, rowId, {
      field_7185: 'Rejected' // Image Status
    })
  }


  // Image Ideas methods
  async getImageIdeas(tableId: string, filters: any = {}) {
    console.log('BaserowAPI: Getting image ideas from table:', tableId)
    
    const queryParams = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      queryParams.append(key, String(value))
    })
    
    const endpoint = `/api/database/rows/table/${tableId}/?${queryParams.toString()}`
    const result = await this.request(endpoint)
    
    console.log('BaserowAPI: Image ideas fetched:', result)
    
    // Map the field IDs to property names
    if (result.results) {
      result.results = result.results.map((imageIdea: any) => this.mapFieldsFromBaserow(imageIdea, 'imageIdeas'))
    }
    
    return result
  }

  async getImageIdeaById(tableId: string, rowId: string) {
    console.log('BaserowAPI: Getting image idea by ID:', rowId)
    
    const result = await this.request(`/api/database/rows/table/${tableId}/${rowId}/`)
    
    console.log('BaserowAPI: Image idea fetched:', result)
    
    if (result) {
      return this.mapFieldsFromBaserow(result, 'imageIdeas')
    }
    
    return null
  }

  async createImageIdea(tableId: string, data: any) {
    console.log('BaserowAPI: Creating image idea with data:', data)
    
    // Map property names to field IDs
    const baserowData = this.mapFieldsToBaserow(data, 'imageIdeas')
    
    const result = await this.request(`/api/database/rows/table/${tableId}/`, {
      method: 'POST',
      body: JSON.stringify(baserowData),
    })
    
    console.log('BaserowAPI: Image idea created:', result)
    return result
  }

  async updateImageIdea(tableId: string, rowId: string, data: any) {
    console.log('BaserowAPI: Updating image idea:', rowId, 'with data:', data)
    
    const result = await this.request(`/api/database/rows/table/${tableId}/${rowId}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
    
    console.log('BaserowAPI: Image idea updated:', result)
    return result
  }

  async deleteImageIdea(tableId: string, rowId: string) {
    console.log('BaserowAPI: Deleting image idea:', rowId)
    
    const result = await this.request(`/api/database/rows/table/${tableId}/${rowId}/`, {
      method: 'DELETE',
    })
    
    console.log('BaserowAPI: Image idea deleted:', result)
    return result
  }

  // Blog Posts methods
  async getBlogPosts(tableId: string) {
    console.log('BaserowAPI: Getting blog posts...')
    
    const result = await this.request(`/api/database/rows/table/${tableId}/`, {
      method: 'GET'
    })

    console.log('BaserowAPI: Blog posts retrieved:', result)
    
    // Map fields from Baserow format to display format
    if (result.results) {
      result.results = result.results.map((post: any) => this.mapFieldsFromBaserow(post, 'blogPosts', false))
    }
    
    return result
  }

  async createBlogPost(tableId: string, data: any) {
    console.log('BaserowAPI: Creating blog post...')

    const mappedData = this.mapFieldsToBaserow(data, 'blogPosts')
    
    const result = await this.request(`/api/database/rows/table/${tableId}/`, {
      method: 'POST',
      body: JSON.stringify(mappedData)
    })

    console.log('BaserowAPI: Blog post created:', result)
    return this.mapFieldsFromBaserow(result, 'blogPosts')
  }

  async getBlogPostById(tableId: string, id: string) {
    console.log('BaserowAPI: Getting blog post by ID:', id)

    // Build URL with expand parameter for featured_image field (same as social media images)
    const params = new URLSearchParams()
    
    // Try to find featured_image field ID to expand it
    const blogPostsFieldMappings = this.fieldMappings['blogPosts']
    let featuredImageFieldId: string | number | null = null
    
    // Check field mappings for featured_image
    if (blogPostsFieldMappings) {
      featuredImageFieldId = blogPostsFieldMappings['featuredimage'] || 
                             blogPostsFieldMappings['featured image'] ||
                             blogPostsFieldMappings['featured_image'] ||
                             blogPostsFieldMappings['Featured Image']
    }
    
    // If not in mappings, try to auto-detect it synchronously
    if (!featuredImageFieldId) {
      try {
        featuredImageFieldId = await this.findFeaturedImageFieldId(tableId)
        if (featuredImageFieldId) {
          console.log(`✅ Auto-detected featured_image field ID for expand: ${featuredImageFieldId}`)
        }
      } catch (error) {
        console.log('⚠️ Could not auto-detect featured_image field for expand, continuing without expand')
      }
    }
    
    // Expand featured_image field if we know its ID
    if (featuredImageFieldId) {
      const fieldIdNum = typeof featuredImageFieldId === 'string' && featuredImageFieldId.startsWith('field_')
        ? featuredImageFieldId.replace('field_', '')
        : featuredImageFieldId
      params.append('expand', `field_${fieldIdNum}`)
      console.log('BaserowAPI: Expanding featured_image field:', `field_${fieldIdNum}`)
    }

    const url = `/api/database/rows/table/${tableId}/${id}/${params.toString() ? '?' + params.toString() : ''}`
    
    const result = await this.request(url, {
      method: 'GET'
    })

    console.log('BaserowAPI: Blog post retrieved:', result)
    return this.mapFieldsFromBaserow(result, 'blogPosts', false) // Use false to keep underscores (form expects underscores)
  }

  async updateBlogPost(tableId: string, id: string, data: any, imagesTableId?: number) {
    console.log('BaserowAPI: Updating blog post:', id)
    console.log('BaserowAPI: Input data:', JSON.stringify(data, null, 2))

    // If featured_image is being updated, try to get current record to find the field ID
    let featuredImageFieldId: number | null = null
    if (data.featured_image !== undefined && data.featured_image !== null) {
      try {
        // First try auto-detection
        featuredImageFieldId = await this.findFeaturedImageFieldId(tableId)
        
        // If auto-detection failed, try to find it from the current record
        if (!featuredImageFieldId) {
          console.log('🔍 Auto-detection failed, trying to find field from current record...')
          try {
            const currentRecord = await this.request(`/api/database/rows/table/${tableId}/${id}/`)
            
            // imagesTableId is passed from the API route which has access to client config
            console.log(`   Checking link_row fields against Images table ID: ${imagesTableId}`)
            
            // Look for link_row fields that are arrays (empty or with data)
            for (const [fieldKey, fieldValue] of Object.entries(currentRecord)) {
              if (fieldKey.startsWith('field_') && Array.isArray(fieldValue)) {
                // This might be the featured_image field - check by getting field info
                const fieldIdNum = fieldKey.replace('field_', '')
                try {
                  const fieldInfo = await this.request(`/api/database/fields/${fieldIdNum}/`)
                  
                  // Check if it's a link_row field that links to Images table OR has "featured" or "image" in name
                  const isLinkToImages = fieldInfo.type === 'link_row' && 
                                        imagesTableId && 
                                        String(fieldInfo.link_row_table_id) === String(imagesTableId)
                  const hasFeaturedImageName = fieldInfo.type === 'link_row' && 
                                              (fieldInfo.name?.toLowerCase().includes('featured') || 
                                               fieldInfo.name?.toLowerCase().includes('image'))
                  
                  console.log(`   Checking field ${fieldIdNum}: "${fieldInfo.name}" (type: ${fieldInfo.type}, links to: ${fieldInfo.link_row_table_id})`)
                  
                  if (isLinkToImages || hasFeaturedImageName) {
                    featuredImageFieldId = parseInt(fieldIdNum, 10)
                    console.log(`✅ Found featured_image field from record: "${fieldInfo.name}" (type: ${fieldInfo.type}, links to: ${fieldInfo.link_row_table_id}, field_${featuredImageFieldId})`)
                    break
                  }
                } catch (e) {
                  // Skip if we can't get field info
                  console.log(`   Skipping field ${fieldIdNum} - couldn't get field info:`, e)
                }
              }
            }
          } catch (recordError) {
            console.error('Error fetching current record for field detection:', recordError)
          }
        }
      } catch (error) {
        console.error('Error finding featured_image field:', error)
      }
    }

    const mappedData = await this.mapFieldsToBaserowAsync(data, 'blogPosts', tableId, featuredImageFieldId)
    console.log('BaserowAPI: Mapped data for Baserow:', JSON.stringify(mappedData, null, 2))
    
    const result = await this.request(`/api/database/rows/table/${tableId}/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(mappedData)
    })

    console.log('BaserowAPI: Blog post updated:', result)
    return this.mapFieldsFromBaserow(result, 'blogPosts', false)
  }

  // Async version of mapFieldsToBaserow for cases where we need to fetch field info
  private async mapFieldsToBaserowAsync(data: any, tableName: string, tableId?: string, featuredImageFieldId?: number | null): Promise<any> {
    const mapped: any = {}
    
    // Get field mappings for this table
    const tableFieldMappings = this.fieldMappings[tableName]
    console.log(`DEBUG: Available field mappings for ${tableName}:`, Object.keys(tableFieldMappings || {}))
    
    if (!tableFieldMappings || Object.keys(tableFieldMappings).length === 0) {
      console.log(`No dynamic field mappings found for table: ${tableName}, using hardcoded fallback`)
      
      // Use hardcoded field mappings as fallback
      switch (tableName) {
        case 'socialMediaContent':
          return mapSocialMediaContentToBaserow(data)
        case 'brandAssets':
          return mapBrandAssetsToBaserow(data)
        case 'images':
          return mapImagesToBaserow(data)
        case 'emailIdeas':
          return mapEmailIdeasToBaserow(data)
        case 'templates':
          return mapTemplatesToBaserow(data)
        case 'imageIdeas':
          return mapImageIdeasToBaserow(data)
        case 'contentIdeas':
          // For contentIdeas, we should use dynamic mapping, so return data as-is for fallback
          console.log(`Using fallback for contentIdeas - returning data as-is`)
          return data
        case 'blogRequests':
          // For blogRequests, we should use dynamic mapping, so return data as-is for fallback
          console.log(`Using fallback for blogRequests - returning data as-is`)
          return data
        case 'blogPosts':
          // For blogPosts, we should use dynamic mapping, so return data as-is for fallback
          console.log(`Using fallback for blogPosts - returning data as-is`)
          return data
        default:
          console.log(`No fallback mapping found for table: ${tableName}`)
          return data
      }
    }
    
    // Helper function to convert camelCase to field mapping names
    const convertFieldName = (camelCaseName: string): string => {
      const conversions: Record<string, string> = {
        'contentIdea': 'contentidea',
        'ideaType': 'ideatype', 
        'numberOfPosts': 'number_of_posts',
        'hookFocus': 'hook_focus',
        'targetAudience': 'targetaudience',
        'informationSource': 'information_source',
        'sourceUrl': 'sourceurl',
        'sourceContent': 'sourcecontent',
        'contentStrategy': 'contentstrategy',
        'contentTypeStrategy': 'contenttypestrategy',
        'primaryObjective': 'primaryobjectiveoptions',
        'scheduledTime': 'scheduledtime',
        // Social Media Content fields
        'contentTheme': 'contenttheme',
        'psychologicalTrigger': 'psychologicaltrigger',
        'engagementObjective': 'engagementobjective',
        'imagePrompt': 'imageprompt',
        // Brand Assets fields
        'assetName': 'assetname',
        'contentType': 'contenttype',
        'assetType': 'assettype',
        'assetInformation': 'assetinformation',
        'fileUrl': 'fileurl',
        'brandVoiceGuidelines': 'brandvoiceguidelines',
        'approvedHashtags': 'approvedhashtags',
        'toneStylePreferences': 'tone/stylepreferences',
        'forbiddenWordsTopics': 'forbiddenwords/topics',
        'platformSpecificRules': 'platform-specificrules',
        'notes': 'assetnotes',
        'createdDate': 'createddate',
        'lastUpdated': 'lastupdated',
        // Blog Post fields
        'featuredImage': 'featuredimage',
        'featured_image': 'featuredimage',
        'featuredImageUrl': 'featuredimageurl',
        'featured_image_url': 'featuredimageurl',
        'featuredImageAlt': 'featuredimagealt',
        'featured_image_alt': 'featuredimagealt'
      }
      return conversions[camelCaseName] || camelCaseName.toLowerCase()
    }

    // Map field names to field IDs
    for (const [fieldName, value] of Object.entries(data)) {
      const mappedFieldName = convertFieldName(fieldName)
      const fieldId = tableFieldMappings[mappedFieldName]
      console.log(`DEBUG: Mapping field "${fieldName}" -> "${mappedFieldName}" -> fieldId: ${fieldId}`)
      
      // Special handling for featured_image link_row field (same pattern as social media 'images' field)
      // Skip it entirely if null/undefined to avoid sending it to wrong field types
      if (fieldName === 'featured_image' || fieldName === 'featuredImage') {
        // If null or undefined, skip it completely (don't update the field)
        if (value === null || value === undefined) {
          console.log(`⚠️ Skipping featured_image field (null/undefined)`)
          continue
        }
        
        // Ensure it's an array of numbers for link_row fields (same as social media images)
        const arrayValue = Array.isArray(value) ? value : [value]
        const numericArray = arrayValue.map((id: any) => {
          if (typeof id === 'string') {
            const parsed = parseInt(id, 10)
            return isNaN(parsed) ? null : parsed
          }
          return typeof id === 'number' ? id : null
        }).filter((id: any) => id !== null && !isNaN(id))
        
        // If we have a field ID from mappings, use it (standard path - same as social media)
        if (fieldId) {
          mapped[`field_${fieldId}`] = numericArray
          console.log(`✅ Set featured_image link_row field via mapping: field_${fieldId} =`, numericArray)
          continue
        }
        
        // If we have a pre-detected field ID from updateBlogPost, use it
        if (featuredImageFieldId) {
          mapped[`field_${featuredImageFieldId}`] = numericArray
          console.log(`✅ Set featured_image using pre-detected field ID: field_${featuredImageFieldId} =`, numericArray)
          continue
        }
        
        // Try alternative field name formats that might exist in Baserow
        const altFieldId1 = tableFieldMappings['featured image'] // With space
        const altFieldId2 = tableFieldMappings['featuredimage'] // No underscore  
        const altFieldId3 = tableFieldMappings['featured_image'] // With underscore
        const altFieldId4 = tableFieldMappings['Featured Image'] // Capitalized with space
        const altFieldId5 = tableFieldMappings['FeaturedImage'] // CamelCase
        
        const finalFieldId = altFieldId1 || altFieldId2 || altFieldId3 || altFieldId4 || altFieldId5
        
        if (finalFieldId) {
          // Extract just the number from field_XXXXX format if needed
          const fieldIdNum = typeof finalFieldId === 'string' && finalFieldId.startsWith('field_') 
            ? finalFieldId.replace('field_', '') 
            : finalFieldId
          mapped[`field_${fieldIdNum}`] = numericArray
          console.log(`✅ Set featured_image link_row field (alt mapping): field_${fieldIdNum} =`, numericArray)
          continue
        }
        
        // Try to auto-detect the field ID from Baserow table structure (fallback)
        if (tableId && tableName === 'blogPosts') {
          console.log(`🔍 Attempting to auto-detect featured_image field ID from table ${tableId}...`)
          try {
            const autoDetectedId = await this.findFeaturedImageFieldId(tableId)
            if (autoDetectedId) {
              mapped[`field_${autoDetectedId}`] = numericArray
              console.log(`✅ Set featured_image using auto-detected field ID: field_${autoDetectedId} =`, numericArray)
              continue
            }
          } catch (detectionError) {
            console.error(`❌ Auto-detection error:`, detectionError)
          }
        }
        
        // Field mapping not found - skip it and log warning (don't send invalid data)
        console.warn(`⚠️ WARNING: featured_image field mapping not found for table "${tableName}"`)
        console.warn(`   Available field mappings:`, Object.keys(tableFieldMappings).join(', '))
        console.warn(`   Tried: "featuredimage", "featured image", "featured_image", "Featured Image", "FeaturedImage"`)
        console.warn(`   Skipping featured_image update - add field mapping to client config to enable`)
        continue
      }
      
      if (fieldId) {
        // Skip null values for link_row fields to avoid validation errors
        if (value === null && (mappedFieldName === 'blog_post_id' || mappedFieldName === 'completion_timestamp')) {
          continue
        }
        
        // Skip read-only fields (created_on, last_modified) - they're automatically set by Baserow
        if (mappedFieldName === 'submission_timestamp' || mappedFieldName === 'created_at' || mappedFieldName === 'updated_at') {
          continue
        }
        
        // Skip empty strings for select fields to avoid validation errors
        if (value === '' && (mappedFieldName === 'category' || mappedFieldName === 'status' || mappedFieldName === 'tags' || mappedFieldName === 'meta_title' || mappedFieldName === 'meta_description')) {
          continue
        }
        
        // Don't send null/undefined to fields that expect strings (Baserow validation error)
        if (value === null || value === undefined) {
          console.log(`⚠️ Skipping null/undefined value for field: ${mappedFieldName} (field_${fieldId})`)
          continue
        }
        
        // Arrays should only be sent to link_row or multiple select fields
        // Check if this field is specifically a link_row or multiple select by checking field name patterns
        // For blog posts: featured_image is link_row, but featured_image_url/featured_image_alt are strings
        const isLinkRowField = (mappedFieldName === 'featuredimage' || mappedFieldName === 'images') && 
                               fieldName !== 'featured_image_url' && 
                               fieldName !== 'featured_image_alt' &&
                               fieldName !== 'featuredImageUrl' &&
                               fieldName !== 'featuredImageAlt'
        const isMultipleSelectField = mappedFieldName.includes('tags') || 
                                     mappedFieldName.includes('keywords') ||
                                     mappedFieldName === 'secondary_keywords'
        
        if (Array.isArray(value) && !isLinkRowField && !isMultipleSelectField) {
          // Arrays should not be sent to text/string fields - this is likely a mapping error
          console.error(`❌ ERROR: Attempting to send array to string field: ${fieldName} (${mappedFieldName}) -> field_${fieldId}`)
          console.error(`   Array value:`, value)
          console.error(`   This field expects a string, not an array. Skipping to prevent validation error.`)
          continue
        }
        
        // Validate and convert values based on field type expectations
        // Don't send objects or booleans to string fields unless they're properly formatted
        if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
          // Objects should be stringified for text fields
          console.log(`⚠️ Converting object to JSON string for field: ${mappedFieldName} (field_${fieldId})`)
          try {
            mapped[`field_${fieldId}`] = JSON.stringify(value)
          } catch (e) {
            console.error(`❌ Failed to stringify object for field: ${mappedFieldName}`, e)
            continue
          }
        } else if (typeof value === 'boolean') {
          // Convert boolean to string for text fields
          console.log(`⚠️ Converting boolean to string for field: ${mappedFieldName} (field_${fieldId})`)
          mapped[`field_${fieldId}`] = String(value)
        } else if (typeof value === 'number') {
          // Check if this is likely a text field (not a number field)
          const isNumberField = mappedFieldName.includes('score') || 
                               mappedFieldName.includes('count') || 
                               (mappedFieldName.includes('id') && mappedFieldName !== 'author_id') ||
                               mappedFieldName.includes('volume') ||
                               mappedFieldName.includes('difficulty')
          
          if (!isNumberField) {
            // Convert number to string for text fields
            console.log(`⚠️ Converting number to string for text field: ${mappedFieldName} (field_${fieldId})`)
            mapped[`field_${fieldId}`] = String(value)
          } else {
            mapped[`field_${fieldId}`] = value
          }
        } else {
          // String, array, or other types - send as-is
          mapped[`field_${fieldId}`] = value
        }
        
        // Log what we're sending for debugging
        console.log(`✅ Mapping field "${fieldName}" (${mappedFieldName}) -> field_${fieldId}: ${typeof mapped[`field_${fieldId}`]} = ${JSON.stringify(mapped[`field_${fieldId}`]).substring(0, 100)}`)
      } else {
        // Keep unmapped fields as-is (like id, order)
        mapped[fieldName] = value
      }
    }
    
    return mapped
  }

  async deleteBlogPost(tableId: string, id: string) {
    console.log('BaserowAPI: Deleting blog post:', id)

    const result = await this.request(`/api/database/rows/table/${tableId}/${id}/`, {
      method: 'DELETE'
    })
    
    console.log('BaserowAPI: Blog post deleted:', result)
    return result
  }

  // Blog Posts methods
  async createBlogPost(tableId: string, data: any) {
    const mappedData = this.mapFieldsToBaserow(data, 'blogPosts')
    
    const result = await this.request(`/api/database/rows/table/${tableId}/`, {
      method: 'POST',
      body: JSON.stringify(mappedData)
    })

    return this.mapFieldsFromBaserow(result, 'blogPosts')
  }

  // Blog Requests methods
  async createBlogRequest(tableId: string, data: any) {
    const mappedData = this.mapFieldsToBaserow(data, 'blogRequests')
    
    const result = await this.request(`/api/database/rows/table/${tableId}/`, {
      method: 'POST',
      body: JSON.stringify(mappedData)
    })

    return this.mapFieldsFromBaserow(result, 'blogRequests')
  }

  async getBlogRequests(tableId: string) {
    console.log('BaserowAPI: Getting blog requests...')
    
    const result = await this.request(`/api/database/rows/table/${tableId}/`, {
      method: 'GET'
    })

    console.log('BaserowAPI: Blog requests retrieved:', result)
    
    // Map fields from Baserow format to display format
    if (result.results) {
      result.results = result.results.map((request: any) => this.mapFieldsFromBaserow(request, 'blogRequests'))
    }
    
    return result
  }

  // Brand Assets methods
  async getBrandAssets(tableId: string, filters?: any) {
    console.log('BaserowAPI: Getting brand assets with filters:', filters)
    
    let endpoint = `/api/database/rows/table/${tableId}/`
    
    if (filters) {
      const params = new URLSearchParams()
      
      // Handle pagination
      if (filters.page) params.append('page', filters.page.toString())
      if (filters.size) params.append('size', filters.size.toString())
      
      // Handle filters
      Object.keys(filters).forEach(key => {
        if (key.startsWith('filter__') && filters[key] !== undefined) {
          params.append(key, filters[key].toString())
        }
      })
      
      endpoint += `?${params.toString()}`
    }
    
    const result = await this.request(endpoint)
    console.log('BaserowAPI: Brand assets retrieved:', result)
    
    // Map the field IDs to property names with camelCase conversion for frontend compatibility
    if (result.results) {
      result.results = result.results.map((asset: any) => this.mapFieldsFromBaserow(asset, 'brandAssets', true))
    }
    
    return result
  }

  async createBrandAsset(tableId: string, data: any) {
    console.log('BaserowAPI: Creating brand asset with data:', data)
    
    // Map human-readable field names to Baserow field IDs
    const baserowData = this.mapFieldsToBaserow(data, 'brandAssets')
    console.log('BaserowAPI: Mapped data for Baserow:', baserowData)
    
    const result = await this.request(`/api/database/rows/table/${tableId}/`, {
      method: 'POST',
      body: JSON.stringify(baserowData),
    })
    
    console.log('BaserowAPI: Brand asset created:', result)
    
    // Map response back to human-readable format
    return {
      ...result,
      ...this.mapFieldsFromBaserow(result, 'brandAssets')
    }
  }

  async updateBrandAsset(tableId: string, rowId: string, data: any) {
    console.log('BaserowAPI: Updating brand asset:', rowId, 'with data:', data)
    
    // Map human-readable field names to Baserow field IDs
    const baserowData = this.mapFieldsToBaserow(data, 'brandAssets')
    console.log('BaserowAPI: Mapped data for Baserow:', baserowData)
    
    const result = await this.request(`/api/database/rows/table/${tableId}/${rowId}/`, {
      method: 'PATCH',
      body: JSON.stringify(baserowData),
    })
    
    console.log('BaserowAPI: Brand asset updated:', result)
    
    // Map response back to human-readable format
    return {
      ...result,
      ...this.mapFieldsFromBaserow(result, 'brandAssets')
    }
  }

  async getBrandAssetById(tableId: string, rowId: string) {
    console.log('BaserowAPI: Getting brand asset by ID:', rowId)
    
    const result = await this.request(`/api/database/rows/table/${tableId}/${rowId}/`)
    console.log('BaserowAPI: Brand asset retrieved:', result)
    
    // Map the field IDs to property names
    return this.mapFieldsFromBaserow(result, 'brandAssets', true)
  }

  // ==================== VIDEO METHODS ====================

  /**
   * Get all videos with optional filters
   */
  async getVideos(tableId: string, filters?: any) {
    console.log('BaserowAPI: Getting videos from table:', tableId)
    
    let url = `/api/database/rows/table/${tableId}/?user_field_names=true`
    
    // Add filters if provided
    if (filters) {
      const filterParams = new URLSearchParams()
      
      // Status filter
      if (filters.videoStatus) {
        filterParams.append('filter__field_43318__equal', filters.videoStatus)
      }
      
      // Client ID filter
      if (filters.clientId) {
        filterParams.append('filter__field_43320__equal', filters.clientId)
      }
      
      // Video Type filter
      if (filters.videoType) {
        filterParams.append('filter__field_43364__equal', filters.videoType)
      }
      
      if (filterParams.toString()) {
        url += `&${filterParams.toString()}`
      }
    }
    
    const result = await this.request(url)
    console.log(`BaserowAPI: Retrieved ${result.results?.length || 0} videos`)
    
    return result
  }

  /**
   * Get a single video by ID
   */
  async getVideoById(tableId: string, recordId: string) {
    console.log('BaserowAPI: Getting video by ID:', recordId)
    
    const result = await this.request(
      `/api/database/rows/table/${tableId}/${recordId}/?user_field_names=true`
    )
    
    console.log('BaserowAPI: Video retrieved:', result.id)
    return result
  }

  /**
   * Create a new video record
   */
  async createVideo(tableId: string, data: any) {
    console.log('BaserowAPI: Creating video with data:', {
      videoPrompt: data.videoPrompt?.substring(0, 50) + '...',
      videoType: data.videoType,
      model: data.model,
      aspectRatio: data.aspectRatio
    })
    
    const result = await this.request(
      `/api/database/rows/table/${tableId}/?user_field_names=true`,
      {
        method: 'POST',
        body: JSON.stringify(data)
      }
    )
    
    console.log('BaserowAPI: Video created with ID:', result.id)
    return result
  }

  /**
   * Update an existing video record
   */
  async updateVideo(tableId: string, recordId: string, data: any) {
    console.log('BaserowAPI: Updating video:', recordId, 'with data:', {
      ...data,
      videoPrompt: data.videoPrompt ? data.videoPrompt.substring(0, 50) + '...' : undefined
    })
    
    const result = await this.request(
      `/api/database/rows/table/${tableId}/${recordId}/?user_field_names=true`,
      {
        method: 'PATCH',
        body: JSON.stringify(data)
      }
    )
    
    console.log('BaserowAPI: Video updated:', result.id)
    return result
  }

  /**
   * Delete a video record
   */
  async deleteVideo(tableId: string, recordId: string) {
    console.log('BaserowAPI: Deleting video:', recordId)
    
    await this.request(
      `/api/database/rows/table/${tableId}/${recordId}/`,
      {
        method: 'DELETE'
      }
    )
    
    console.log('BaserowAPI: Video deleted:', recordId)
  }
}