import { NextRequest, NextResponse } from 'next/server'
import { BaserowAPI } from '@/lib/baserow/api'
import { getClientConfigForAPI } from '@/lib/utils/getClientConfigForAPI'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { clientId } = await params
    const clientConfig = await getClientConfigForAPI(clientId)

    if (!clientConfig) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    // DEBUG: Check field mappings
    console.log('DEBUG: Client config for', clientId, ':', {
      hasFieldMappings: !!clientConfig.fieldMappings,
      contentIdeasMappings: clientConfig.fieldMappings?.contentIdeas,
      allTableMappings: Object.keys(clientConfig.fieldMappings || {})
    })

    // Handle both JSON and FormData
    let formData: any = {}
    let voiceFile: File | null = null
    let imageFile: File | null = null
    let videoFile: File | null = null

    try {
      const contentType = request.headers.get('content-type')
      console.log('Request content type:', contentType)
      
      if (contentType?.includes('multipart/form-data')) {
        // Handle FormData (with files)
        console.log('Processing FormData request...')
        const formDataRequest = await request.formData()
        
        // Extract files
        voiceFile = formDataRequest.get('voiceFile') as File
        imageFile = formDataRequest.get('imageFile') as File
        videoFile = formDataRequest.get('videoFile') as File
        
        console.log('Files extracted:', {
          voiceFile: voiceFile?.name || 'none',
          imageFile: imageFile?.name || 'none',
          videoFile: videoFile?.name || 'none'
        })
        
        // Extract form fields
        for (const [key, value] of formDataRequest.entries()) {
          if (!['voiceFile', 'imageFile', 'videoFile'].includes(key)) {
            try {
              if (key === 'platforms') {
                formData[key] = JSON.parse(value as string)
              } else {
                formData[key] = value
              }
            } catch (parseError) {
              console.error(`Error parsing field ${key}:`, parseError)
              formData[key] = value // Use raw value if parsing fails
            }
          }
        }
      } else {
        // Handle JSON (no files)
        console.log('Processing JSON request...')
        try {
          formData = await request.json()
        } catch (jsonError) {
          console.error('Error parsing JSON:', jsonError)
          throw new Error('Failed to parse JSON request data')
        }
      }
    } catch (parseError) {
      console.error('Error parsing request:', parseError)
      throw new Error('Failed to parse request data')
    }
    
    console.log('Form data received:', formData) // Debug logging
    console.log('Form data keys:', Object.keys(formData)) // Debug logging
    console.log('Form data contentIdea:', formData.contentIdea) // Debug logging

    // Helper functions to map form values to Baserow select option values
    const mapContentType = (type: string) => {
      const mapping: { [key: string]: string } = {
        'blog_post': 'Blog Post',
        'social_media_post': 'Social Media Post', 
        'video_content': 'Video Content',
        'email_campaign': 'Email Campaign',
        'product_uvp': 'Product UVP',
        'content_focus_plan': 'Content Focus Plan',
        'image_content': 'Image Content',
        'voice_content': 'Other', // Voice Content not in your options, map to Other
        'other': 'Other'
      }
      return mapping[type] || 'Other'
    }

    const mapSourceType = (type: string) => {
      const mapping: { [key: string]: string } = {
        'voice_note': 'Voice Note',
        'url': 'URL',
        'image': 'Image',
        'text_idea': 'Manual',  // Changed from 'Text Idea' to 'Manual'
        'video': 'Video Upload'
      }
      return mapping[type] || ''
    }

    const mapTargetAudience = (audience: string) => {
      const mapping: { [key: string]: string } = {
        'young_adults': 'Young Adults (18-25)',
        'millennials': 'Millennials (26-40)',
        'gen_x': 'Gen X (41-55)',
        'professionals': 'Working Professionals',
        'entrepreneurs': 'Entrepreneurs & Business Owners',
        'students': 'Students',
        'parents': 'Parents & Families',
        'general_audience': 'General Audience'
      }
      return mapping[audience] || ''
    }

    const mapContentTypeStrategy = (strategies: string[]) => {
      // Since all options from the form now exist in Baserow, we can return them as-is
      // The form sends the exact values that match Baserow select options
      return strategies
    }

    const mapPrimaryObjective = (objective: string) => {
      // Since all options from the form now exist in Baserow, we can return them as-is
      // The form sends the exact values that match Baserow select options
      return objective
    }

    // Initialize Baserow API with dynamic field mappings
    const baserowAPI = new BaserowAPI(
      clientConfig.baserow.token,
      clientConfig.baserow.databaseId,
      clientConfig.fieldMappings
    )

    // DEBUG: Check what field mappings were passed to BaserowAPI
    console.log('DEBUG: Field mappings passed to BaserowAPI:', clientConfig.fieldMappings?.contentIdeas)
    console.log('DEBUG: All field mappings:', clientConfig.fieldMappings)

    // Prepare data using exact Baserow UI field names (matching the update endpoint)
    const contentIdeaData: any = {
      'Content Idea': formData.contentIdea || 'Test Social Media Idea',
      'Idea Type': 'Social Media Post',
      'Priority': 'Medium',
      'Status': 'Idea'
    }

    // Add fields if provided
    if (formData.platforms && formData.platforms.length > 0) {
      // Platforms is a single-select field, so extract the first value
      contentIdeaData['Platforms'] = Array.isArray(formData.platforms) ? formData.platforms[0] : formData.platforms
    }
    
    if (formData.numberOfPosts) {
      contentIdeaData['Number of Posts'] = formData.numberOfPosts
    }
    
    if (formData.hookFocus) {
      contentIdeaData['Hook Focus'] = formData.hookFocus
    }
    
    if (formData.cta) {
      contentIdeaData['CTA'] = formData.cta
    }
    
    if (formData.targetAudience) {
      contentIdeaData['Target Audience'] = mapTargetAudience(formData.targetAudience)
    }
    
    if (formData.informationSource) {
      contentIdeaData['Information Source'] = mapSourceType(formData.informationSource)
    }
    
    if (formData.sourceUrl) {
      contentIdeaData['Source URL'] = formData.sourceUrl
    }
    
    if (formData.sourceContent) {
      contentIdeaData['Source Content'] = formData.sourceContent
    }
    
    if (formData.contentStrategy) {
      contentIdeaData['Content Strategy'] = formData.contentStrategy
    }
    
    if (formData.contentTypeStrategy && formData.contentTypeStrategy.length > 0) {
      // Content Type Strategy is a single-select field, so extract the first value
      const mappedStrategies = mapContentTypeStrategy(formData.contentTypeStrategy)
      contentIdeaData['Content Type Strategy'] = Array.isArray(mappedStrategies) ? mappedStrategies[0] : mappedStrategies
    }
    
    if (formData.primaryObjective) {
      contentIdeaData['Primary Objective'] = mapPrimaryObjective(formData.primaryObjective)
    }
    
    if (formData.uploadedImageUrl) {
      contentIdeaData['Uploaded Image URL'] = formData.uploadedImageUrl
    }
    
    if (formData.uploadedVideoUrl) {
      contentIdeaData['Uploaded Video URL'] = formData.uploadedVideoUrl
    }

    if (formData.productUvp) {
      // Product UVP is a link_row field, so send as an array of IDs
      contentIdeaData['Product UVP'] = [parseInt(formData.productUvp)]
    }

    console.log('Content idea data for Baserow:', contentIdeaData)
    const contentIdeasTableId = clientConfig.baserow.tables.contentIdeas

    if (!contentIdeasTableId) {
      return NextResponse.json(
        { error: 'Content Ideas table not configured' },
        { status: 500 }
      )
    }

    console.log('Using table ID:', contentIdeasTableId) // Debug logging
    console.log('Baserow config:', {
      url: process.env.BASEROW_API_URL,
      token: clientConfig.baserow.token ? 'Present' : 'Missing',
      databaseId: clientConfig.baserow.databaseId
    })

    // Validate required configuration
    if (!clientConfig.baserow.token) {
      console.error('Missing Baserow token for client:', clientId)
      return NextResponse.json({
        error: 'Missing Baserow configuration',
        details: 'Baserow token is not configured for this client'
      }, { status: 500 })
    }

    if (!clientConfig.baserow.databaseId) {
      console.error('Missing Baserow database ID for client:', clientId)
      return NextResponse.json({
        error: 'Missing Baserow configuration',
        details: 'Baserow database ID is not configured for this client'
      }, { status: 500 })
    }

    if (!contentIdeasTableId) {
      console.error('Missing content ideas table ID for client:', clientId)
      return NextResponse.json({
        error: 'Missing table configuration',
        details: 'Content ideas table is not configured for this client'
      }, { status: 500 })
    }

    // Validate required form data
    if (!formData.contentIdea || formData.contentIdea.trim() === '') {
      console.error('Missing required field: contentIdea')
      return NextResponse.json({
        error: 'Validation failed',
        details: 'Content idea is required'
      }, { status: 400 })
    }

    console.log('Validation passed, proceeding with Baserow API call...')

    try {
      console.log('About to send to Baserow API...')
      console.log('Table ID:', contentIdeasTableId)
      console.log('Data being sent:', JSON.stringify(contentIdeaData, null, 2))
      
      // Step 1: Create the record
      const result = await baserowAPI.createContentIdea(contentIdeasTableId, contentIdeaData)
      console.log('Baserow record created:', result.id)

      // Step 2: Upload files to Baserow and link them to the record
      const fileUpdates: any = {}
      
      if (voiceFile && voiceFile.size > 0) {
        console.log('Uploading voice file to Baserow...', voiceFile.name, voiceFile.size)
        try {
          const voiceUpload = await baserowAPI.uploadFile(voiceFile)
          fileUpdates.voiceFileUrl = [voiceUpload] // Use human-readable field name
          console.log('Voice file uploaded successfully:', voiceUpload.url)
        } catch (voiceError) {
          console.error('Voice file upload failed:', voiceError)
          // Don't fail the whole request, just log the error
        }
      }
      
      if (imageFile && imageFile.size > 0) {
        console.log('Uploading image file to Baserow...', imageFile.name, imageFile.size)
        try {
          const imageUpload = await baserowAPI.uploadFile(imageFile)
          fileUpdates.uploadedImageUrl = [imageUpload] // Use human-readable field name
          console.log('Image file uploaded successfully:', imageUpload.url)
        } catch (imageError) {
          console.error('Image file upload failed:', imageError)
          // Don't fail the whole request, just log the error
        }
      }
      
      if (videoFile && videoFile.size > 0) {
        console.log('Uploading video file to Baserow...', videoFile.name, videoFile.size)
        try {
          const videoUpload = await baserowAPI.uploadFile(videoFile)
          fileUpdates.uploadedVideoUrl = [videoUpload] // Use human-readable field name
          console.log('Video file uploaded successfully:', videoUpload.url)
        } catch (videoError) {
          console.error('Video file upload failed:', videoError)
          // Don't fail the whole request, just log the error
        }
      }

      // Step 3: Update record with file references if any files were uploaded
      if (Object.keys(fileUpdates).length > 0) {
        console.log('Updating record with file references:', fileUpdates)
        try {
          await baserowAPI.updateContentIdea(contentIdeasTableId, result.id, fileUpdates)
          console.log('Record updated with file references successfully')
        } catch (updateError) {
          console.error('Failed to update record with file references:', updateError)
          // Don't fail the whole request, just log the error
        }
      } else {
        console.log('No files to upload')
      }

      return NextResponse.json({
        success: true,
        id: result.id,
        data: result,
        files: fileUpdates
      })
    } catch (baserowError) {
      console.error('Baserow API Error Details:', {
        error: baserowError,
        message: baserowError instanceof Error ? baserowError.message : 'Unknown error',
        stack: baserowError instanceof Error ? baserowError.stack : undefined,
        sentData: contentIdeaData,
        tableId: contentIdeasTableId,
        clientConfig: {
          hasToken: !!clientConfig.baserow.token,
          databaseId: clientConfig.baserow.databaseId,
          baseUrl: process.env.BASEROW_API_URL
        }
      })
      
      const errorMessage = baserowError instanceof Error ? baserowError.message : 'Unknown Baserow error'
      
      return NextResponse.json({
        error: 'Baserow API failed',
        details: errorMessage,
        sentData: contentIdeaData,
        config: {
          tableId: contentIdeasTableId,
          baseUrl: process.env.BASEROW_API_URL,
          hasToken: !!clientConfig.baserow.token,
          databaseId: clientConfig.baserow.databaseId
        }
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Error creating content idea:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json(
      { error: 'Failed to create content idea', details: errorMessage },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { clientId } = await params
    const clientConfig = await getClientConfigForAPI(clientId)

    if (!clientConfig) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    const baserowAPI = new BaserowAPI(
      clientConfig.baserow.token,
      clientConfig.baserow.databaseId,
      clientConfig.fieldMappings
    )
    const contentIdeasTableId = clientConfig.baserow.tables.contentIdeas

    if (!contentIdeasTableId) {
      return NextResponse.json({ results: [] })
    }

    // Add debug parameter to test table structure
    const url = new URL(request.url)
    const debug = url.searchParams.get('debug')
    const filter = url.searchParams.get('filter')
    const test = url.searchParams.get('test')
    
    if (test === 'connection') {
      // Test basic connection and configuration
      return NextResponse.json({
        clientId,
        config: {
          hasToken: !!clientConfig.baserow.token,
          databaseId: clientConfig.baserow.databaseId,
          tableId: contentIdeasTableId,
          baseUrl: process.env.BASEROW_API_URL
        },
        testData: {
          title: 'Test Content Idea',
          idea_type: 'Social Media Post',
          priority: 'Medium',
          status: 'Idea'
        }
      })
    }
    
    if (debug === 'structure') {
      const structure = await baserowAPI.getTableStructure(contentIdeasTableId)
      return NextResponse.json({ 
        tableId: contentIdeasTableId,
        structure: structure,
        config: {
          baseUrl: process.env.BASEROW_API_URL,
          hasToken: !!clientConfig.baserow.token,
          databaseId: clientConfig.baserow.databaseId
        }
      })
    }

    try {
      console.log('Attempting to fetch from Baserow...')
      const filters = filter ? { filter_type: filter } : undefined
      const result = await baserowAPI.getContentIdeas(contentIdeasTableId, filters)
      console.log('Raw Baserow result count:', result.count)

      // Use dynamic field mapping to convert Baserow data to human-readable format
      const mappedResults = result.results?.map((row: any) => {
        // Use BaserowAPI's mapFieldsFromBaserow method for proper field mapping
        const mappedRow = baserowAPI.mapFieldsFromBaserow(row, 'contentIdeas')
        
        return {
          id: row.id,
          title: mappedRow.contentidea || '',
          idea_type: mappedRow.ideatype || '',
          description: mappedRow.description || '',
          source_type: mappedRow.information_source || '',
          source_url: mappedRow.sourceurl || '',
          target_audience: mappedRow.targetaudience || '',
          priority: mappedRow.priority || 'Medium',
          status: mappedRow.status || 'Idea',
          due_date: mappedRow.duedate || '',
          client_notes: mappedRow.clientnotes || '',
          voice_file_url: mappedRow.voicefileurl || '',
          created_date: mappedRow.duedate_alt || '',
          order: row.order,
          // Add additional mapped fields
          platforms: mappedRow.platforms || [],
          number_of_posts: mappedRow.number_of_posts || '',
          hook_focus: mappedRow.hook_focus || '',
          cta: mappedRow.cta || '',
          source_content: mappedRow.sourcecontent || '',
          content_strategy: mappedRow.contentstrategy || '',
          content_type_strategy: mappedRow.contenttypestrategy || [],
          primary_objective: mappedRow.primaryobjectiveoptions || ''
        }
      }) || []

      console.log('Mapped results count:', mappedResults.length)

      return NextResponse.json({
        count: result.count,
        results: mappedResults
      })
    } catch (fetchError) {
      console.error('Error fetching from Baserow:', fetchError)
      return NextResponse.json({
        error: 'Failed to fetch content ideas',
        details: fetchError instanceof Error ? fetchError.message : 'Unknown error',
        results: []
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Error fetching content ideas:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json(
      { error: 'Failed to fetch content ideas', details: errorMessage },
      { status: 500 }
    )
  }
}