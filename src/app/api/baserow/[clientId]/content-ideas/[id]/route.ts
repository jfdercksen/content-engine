import { NextRequest, NextResponse } from 'next/server'
import { BaserowAPI } from '@/lib/baserow/api'
import { getClientConfigForAPI } from '@/lib/utils/getClientConfigForAPI'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string; id: string }> }
) {
  try {
    const { clientId, id } = await params
    const clientConfig = await getClientConfigForAPI(clientId)

    if (!clientConfig) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    const contentIdeasTableId = clientConfig.baserow.tables.contentIdeas

    if (!contentIdeasTableId) {
      return NextResponse.json(
        { error: 'Content Ideas table not configured' },
        { status: 500 }
      )
    }

    const baserowAPI = new BaserowAPI(
      clientConfig.baserow.token,
      clientConfig.baserow.databaseId,
      clientConfig.fieldMappings
    )
    const result = await baserowAPI.getContentIdeaById(contentIdeasTableId, id)

    if (!result) {
      return NextResponse.json(
        { error: 'Content idea not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('Error fetching content idea:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json(
      { error: 'Failed to fetch content idea', details: errorMessage },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string; id: string }> }
) {
  try {
    console.log('=== PUT CONTENT IDEA API START ===')
    const { clientId, id } = await params
    console.log('Client ID:', clientId, 'ID:', id)
    
    const clientConfig = await getClientConfigForAPI(clientId)
    console.log('Client config found:', !!clientConfig)

    if (!clientConfig) {
      console.log('ERROR: Client not found')
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    const contentIdeasTableId = clientConfig.baserow.tables.contentIdeas
    console.log('Content ideas table ID:', contentIdeasTableId)

    if (!contentIdeasTableId) {
      console.log('ERROR: Content Ideas table not configured')
      return NextResponse.json(
        { error: 'Content Ideas table not configured' },
        { status: 500 }
      )
    }

    // Handle both JSON and FormData for file uploads
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
          voice: voiceFile?.name || 'none',
          image: imageFile?.name || 'none',
          video: videoFile?.name || 'none'
        })
        
        // Extract form fields
        for (const [key, value] of formDataRequest.entries()) {
          if (!['voiceFile', 'imageFile', 'videoFile'].includes(key)) {
            formData[key] = value
          }
        }
      } else {
        // Handle JSON (no files)
        console.log('Processing JSON request...')
        formData = await request.json()
      }
    } catch (parseError) {
      console.error('Error parsing request:', parseError)
      throw new Error('Failed to parse request data')
    }

    console.log('=== UPDATE CONTENT IDEA DEBUG ===')
    console.log('Updating content idea:', id, 'with data:', formData)
    console.log('Client config baserow:', {
      token: clientConfig.baserow.token ? 'present' : 'missing',
      databaseId: clientConfig.baserow.databaseId,
      fieldMappings: clientConfig.fieldMappings ? 'present' : 'missing'
    })

    // Helper functions to map form values to Baserow select option values (same as CREATE endpoint)
    const mapSourceType = (type: string) => {
      const mapping: { [key: string]: string } = {
        'voice_note': 'Voice Note',
        'url': 'URL',
        'image': 'Image',
        'text_idea': 'Manual',
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

    const mapContentTypeStrategy = (strategies: string[] | string) => {
      // Form sends exact values that match Baserow select options
      return strategies
    }

    const mapPrimaryObjective = (objective: string) => {
      // Form sends exact values that match Baserow select options
      return objective
    }

    const baserowAPI = new BaserowAPI(
      clientConfig.baserow.token,
      clientConfig.baserow.databaseId,
      clientConfig.fieldMappings
    )
    console.log('BaserowAPI initialized successfully')

    // Prepare content idea data for Baserow using exact UI field names with proper mapping
    const contentIdeaData: any = {
      'Content Idea': formData.contentIdea || formData.title,
      'Idea Type': 'Social Media Post',
      'Priority': formData.priority || 'Medium',
    }

    // Add optional fields with proper mapping
    if (formData.targetAudience || formData.target_audience) {
      const audienceValue = formData.targetAudience || formData.target_audience
      contentIdeaData['Target Audience'] = mapTargetAudience(audienceValue)
    }

    if (formData.informationSource || formData.source_type) {
      const sourceValue = formData.informationSource || formData.source_type
      contentIdeaData['Information Source'] = mapSourceType(sourceValue)
    }

    if (formData.platforms) {
      contentIdeaData['Platforms'] = Array.isArray(formData.platforms) ? formData.platforms[0] : formData.platforms
    }

    if (formData.sourceUrl || formData.source_url) {
      contentIdeaData['Source URL'] = formData.sourceUrl || formData.source_url
    }

    if (formData.sourceContent || formData.source_content) {
      contentIdeaData['Source Content'] = formData.sourceContent || formData.source_content
    }

    if (formData.numberOfPosts || formData.number_of_posts) {
      contentIdeaData['Number of Posts'] = formData.numberOfPosts || formData.number_of_posts || 1
    }

    if (formData.hookFocus || formData.hook_focus) {
      contentIdeaData['Hook Focus'] = formData.hookFocus || formData.hook_focus
    }

    if (formData.cta) {
      contentIdeaData['CTA'] = formData.cta
    }

    if (formData.contentStrategy || formData.content_strategy) {
      contentIdeaData['Content Strategy'] = formData.contentStrategy || formData.content_strategy
    }

    if (formData.contentTypeStrategy || formData.content_type_strategy) {
      const strategyValue = formData.contentTypeStrategy || formData.content_type_strategy
      const mappedStrategy = mapContentTypeStrategy(strategyValue)
      contentIdeaData['Content Type Strategy'] = Array.isArray(mappedStrategy) ? mappedStrategy[0] : mappedStrategy
    }

    if (formData.primaryObjective || formData.primary_objective) {
      const objectiveValue = formData.primaryObjective || formData.primary_objective
      contentIdeaData['Primary Objective'] = mapPrimaryObjective(objectiveValue)
    }

    if (formData.additionalNotes || formData.additional_notes) {
      contentIdeaData['Additional Notes'] = formData.additionalNotes || formData.additional_notes
    }

    if (formData.productUvp || formData.product_uvp) {
      const uvpValue = formData.productUvp || formData.product_uvp
      // Product UVP is a link_row field, so send as an array of IDs
      contentIdeaData['Product UVP'] = uvpValue ? [parseInt(uvpValue)] : []
    }

    // Remove undefined values and empty strings
    Object.keys(contentIdeaData).forEach(key => {
      if (contentIdeaData[key] === undefined || contentIdeaData[key] === '') {
        delete contentIdeaData[key]
      }
    })
    
    console.log('Content idea data after cleanup:', contentIdeaData)

    // Step 1: Update the record
    console.log('About to call updateContentIdea with:', { contentIdeasTableId, id, contentIdeaData })
    let result: any
    try {
      result = await baserowAPI.updateContentIdea(contentIdeasTableId, id, contentIdeaData)
      console.log('Baserow record updated successfully:', result.id)
    } catch (updateError) {
      console.error('Error updating Baserow record:', updateError)
      throw updateError
    }

    // Step 2: Upload files to Baserow and link them to the record
    const fileUpdates: any = {}
    
    if (voiceFile && voiceFile.size > 0) {
      console.log('Uploading voice file to Baserow...', voiceFile.name, voiceFile.size)
      try {
        const voiceUpload = await baserowAPI.uploadFile(voiceFile)
        fileUpdates.voiceFileUrl = [voiceUpload]
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
        fileUpdates.imageFileUrl = [imageUpload]
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
        fileUpdates.videoFileUrl = [videoUpload]
        console.log('Video file uploaded successfully:', videoUpload.url)
      } catch (videoError) {
        console.error('Video file upload failed:', videoError)
        // Don't fail the whole request, just log the error
      }
    }

    // Step 3: Update the record with file URLs if any files were uploaded
    if (Object.keys(fileUpdates).length > 0) {
      console.log('Updating record with file URLs:', fileUpdates)
      await baserowAPI.updateContentIdea(contentIdeasTableId, id, fileUpdates)
    }

    return NextResponse.json({
      success: true,
      id: result.id,
      data: result
    })

  } catch (error) {
    console.error('=== PUT CONTENT IDEA API ERROR ===')
    console.error('Error type:', typeof error)
    console.error('Error:', error)
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error')
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack')
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json(
      { error: 'Failed to update content idea', details: errorMessage },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string; id: string }> }
) {
  try {
    const { clientId, id } = await params
    const clientConfig = await getClientConfigForAPI(clientId)

    if (!clientConfig) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    const contentIdeasTableId = clientConfig.baserow.tables.contentIdeas

    if (!contentIdeasTableId) {
      return NextResponse.json(
        { error: 'Content Ideas table not configured' },
        { status: 500 }
      )
    }

    const baserowAPI = new BaserowAPI(
      clientConfig.baserow.token,
      clientConfig.baserow.databaseId,
      clientConfig.fieldMappings
    )
    await baserowAPI.deleteContentIdea(contentIdeasTableId, id)

    return NextResponse.json({
      success: true,
      message: 'Content idea deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting content idea:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json(
      { error: 'Failed to delete content idea', details: errorMessage },
      { status: 500 }
    )
  }
}
