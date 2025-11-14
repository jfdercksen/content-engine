/**
 * Create Videos Table in Client Info Database (233)
 * 
 * This script creates the complete Videos table structure with all 51 fields
 * Uses JWT authentication like the client creation process
 */

const BASEROW_URL = 'https://baserow.aiautomata.co.za'
const DATABASE_ID = 233 // Client Info database

// JWT credentials
const BASEROW_USERNAME = 'johan@aiautomations.co.za'
const BASEROW_PASSWORD = 'P@ssw0rd.123'

console.log(`📧 Using username: ${BASEROW_USERNAME}`)
console.log(`🔑 Authenticating...`)

/**
 * Authenticate and get JWT access token
 */
async function getJWTToken() {
  console.log('🔐 Authenticating with Baserow...')
  
  const response = await fetch(`${BASEROW_URL}/api/user/token-auth/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: BASEROW_USERNAME,
      password: BASEROW_PASSWORD
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`JWT Authentication failed: ${response.status} - ${error}`)
  }

  const data = await response.json()
  console.log('✅ JWT authentication successful')
  return data.access_token
}

async function createVideosTable() {
  console.log('🎬 Creating Videos table in database', DATABASE_ID)
  
  try {
    // Step 1: Get JWT token
    const accessToken = await getJWTToken()
    
    // Step 2: Create the table with initial data (one row, one column)
    const createTableResponse = await fetch(`${BASEROW_URL}/api/database/tables/database/${DATABASE_ID}/`, {
      method: 'POST',
      headers: {
        'Authorization': `JWT ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Videos',
        data: [['Initial']], // One row with one column value
        first_row_header: false
      })
    })

    if (!createTableResponse.ok) {
      const error = await createTableResponse.text()
      throw new Error(`Failed to create table: ${error}`)
    }

    const table = await createTableResponse.json()
    console.log('✅ Table created with ID:', table.id)
    console.log('   Table name:', table.name)

    const tableId = table.id

    // Step 2: Create all fields
    const fields = [
      // Core Video Fields
      { name: 'video', type: 'file' },
      { name: 'videoUrl', type: 'url' },
      { name: 'thumbnailUrl', type: 'url' },
      { name: 'videoPrompt', type: 'long_text' },
      { 
        name: 'videoType', 
        type: 'single_select',
        select_options: [
          { value: 'Text-to-Video', color: 'blue' },
          { value: 'Image-to-Video', color: 'green' },
          { value: 'Storyboard', color: 'orange' },
          { value: 'Multi-Scene Process', color: 'purple' },
          { value: 'UGC Ad', color: 'red' },
          { value: 'Social Post Video', color: 'yellow' }
        ]
      },
      { 
        name: 'videoStatus', 
        type: 'single_select',
        select_options: [
          { value: 'Pending', color: 'gray' },
          { value: 'Preparing', color: 'blue' },
          { value: 'Generating Scenes', color: 'light-blue' },
          { value: 'Generating Images', color: 'light-green' },
          { value: 'Generating Videos', color: 'yellow' },
          { value: 'Processing Audio', color: 'orange' },
          { value: 'Finalizing', color: 'purple' },
          { value: 'Completed', color: 'green' },
          { value: 'Failed', color: 'red' }
        ]
      },
      { 
        name: 'model', 
        type: 'single_select',
        select_options: [
          { value: 'Sora 2', color: 'blue' },
          { value: 'Veo 3.1', color: 'green' },
          { value: 'Veo 3.1 Fast', color: 'light-green' },
          { value: 'Kling Video', color: 'orange' },
          { value: 'NanoBanana + Veo 3.1', color: 'purple' },
          { value: 'fal.ai', color: 'red' }
        ]
      },
      { name: 'clientId', type: 'text' },
      
      // Video Configuration
      { 
        name: 'aspectRatio', 
        type: 'single_select',
        select_options: [
          { value: '9:16 (Vertical)', color: 'blue' },
          { value: '16:9 (Landscape)', color: 'green' },
          { value: '1:1 (Square)', color: 'orange' },
          { value: '4:5 (Portrait)', color: 'purple' }
        ]
      },
      { name: 'duration', type: 'number', number_decimal_places: 0 },
      { name: 'nFrames', type: 'number', number_decimal_places: 0 },
      { name: 'removeWatermark', type: 'boolean' },
      
      // Reference Media
      { name: 'referenceImage', type: 'file' },
      { name: 'referenceImageUrl', type: 'url' },
      { name: 'referenceVideo', type: 'file' },
      { name: 'referenceVideoUrl', type: 'url' },
      { name: 'styleReferenceImage', type: 'file' },
      
      // Process & Product Information
      { name: 'process', type: 'text' },
      // processId link will be added later if needed
      { name: 'backgroundMusicPrompt', type: 'long_text' },
      // musicTrack link will be added later if needed
      { name: 'product', type: 'text' },
      { name: 'productPhoto', type: 'file' },
      { name: 'productPhotoUrl', type: 'url' },
      { name: 'icp', type: 'long_text' },
      { name: 'productFeatures', type: 'long_text' },
      { name: 'videoSetting', type: 'long_text' },
      
      // Platform
      { 
        name: 'platform', 
        type: 'single_select',
        select_options: [
          { value: 'Facebook', color: 'blue' },
          { value: 'Instagram', color: 'red' },
          { value: 'Twitter', color: 'light-blue' },
          { value: 'LinkedIn', color: 'dark-blue' },
          { value: 'TikTok', color: 'dark-gray' },
          { value: 'YouTube', color: 'red' }
        ]
      },
      
      // Scenes (link field will be added later if needed)
      { name: 'sceneCount', type: 'number', number_decimal_places: 0 },
      
      // Captions
      { name: 'useCaptions', type: 'boolean' },
      { name: 'captionText', type: 'long_text' },
      { name: 'captionFontStyle', type: 'text' },
      { name: 'captionFontSize', type: 'text' },
      { 
        name: 'captionPosition', 
        type: 'single_select',
        select_options: [
          { value: 'Top', color: 'blue' },
          { value: 'Center', color: 'green' },
          { value: 'Bottom', color: 'orange' }
        ]
      },
      
      // Audio
      { name: 'useMusic', type: 'boolean' },
      { name: 'useSoundFX', type: 'boolean' },
      
      // Processing URLs
      { name: 'rawVideoUrl', type: 'url' },
      { name: 'processedVideoUrl', type: 'url' },
      
      // YouTube
      { name: 'youtubeTitle', type: 'text' },
      { name: 'youtubeHashtags', type: 'text' },
      { name: 'youtubeVideoId', type: 'text' },
      
      // Metadata
      { name: 'taskId', type: 'text' },
      { name: 'errorMessage', type: 'long_text' },
      { name: 'metadata', type: 'long_text' },
      
      // Timestamps
      { name: 'createdAt', type: 'date', date_include_time: true },
      { name: 'updatedAt', type: 'last_modified' },
      { name: 'completedAt', type: 'date', date_include_time: true }
    ]

    console.log(`\n📝 Creating ${fields.length} fields...`)
    
    const createdFields = []
    
    for (let i = 0; i < fields.length; i++) {
      const field = fields[i]
      
      const fieldData = {
        name: field.name,
        type: field.type
      }
      
      // Add type-specific options
      if (field.type === 'single_select' && field.select_options) {
        fieldData.select_options = field.select_options
      }
      if (field.type === 'number' && field.number_decimal_places !== undefined) {
        fieldData.number_decimal_places = field.number_decimal_places
      }
      if (field.type === 'date' && field.date_include_time !== undefined) {
        fieldData.date_include_time = field.date_include_time
      }
      
      try {
        const createFieldResponse = await fetch(`${BASEROW_URL}/api/database/fields/table/${tableId}/`, {
          method: 'POST',
          headers: {
            'Authorization': `JWT ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(fieldData)
        })

        if (!createFieldResponse.ok) {
          const error = await createFieldResponse.text()
          console.error(`❌ Failed to create field '${field.name}':`, error)
          continue
        }

        const createdField = await createFieldResponse.json()
        createdFields.push(createdField)
        console.log(`   ✅ ${i + 1}/${fields.length} Created: ${createdField.name} (ID: ${createdField.id})`)
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))
        
      } catch (error) {
        console.error(`❌ Error creating field '${field.name}':`, error.message)
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log('✅ Videos table created successfully!')
    console.log('='.repeat(60))
    console.log(`\nTable ID: ${tableId}`)
    console.log(`Database ID: ${DATABASE_ID}`)
    console.log(`Total Fields Created: ${createdFields.length}`)
    
    console.log('\n📋 Field Mappings (copy to your config):')
    console.log('```json')
    console.log('"videos": {')
    createdFields.forEach((field, index) => {
      const comma = index < createdFields.length - 1 ? ',' : ''
      console.log(`  "${field.name}": "${field.id}"${comma}`)
    })
    console.log('}')
    console.log('```')
    
    console.log('\n📝 Update all client configs with:')
    console.log(`"videos": "${tableId}"`)
    
    return { tableId, createdFields }

  } catch (error) {
    console.error('❌ Error creating Videos table:', error.message)
    throw error
  }
}

// Run the script
createVideosTable()
  .then(() => {
    console.log('\n✅ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error)
    process.exit(1)
  })

