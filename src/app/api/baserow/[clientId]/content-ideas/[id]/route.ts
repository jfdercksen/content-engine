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

    const baserowAPI = new BaserowAPI(
      clientConfig.baserow.token,
      clientConfig.baserow.databaseId,
      clientConfig.fieldMappings
    )

    // Prepare content idea data for Baserow
    const contentIdeaData: any = {
      title: formData.contentIdea || formData.title,
      idea_type: 'social_media_post',
      description: formData.contentIdea || formData.description,
      priority: formData.priority || 'Medium',
      status: formData.status || 'Draft',
      target_audience: formData.targetAudience || formData.target_audience,
      source_type: formData.informationSource || formData.source_type,
      platforms: formData.platforms ? JSON.stringify(formData.platforms) : '',
      source_url: formData.sourceUrl || formData.source_url,
      source_content: formData.sourceContent || formData.source_content,
      number_of_posts: formData.numberOfPosts || formData.number_of_posts || 1,
      hook_focus: formData.hookFocus || formData.hook_focus,
      cta: formData.cta,
      content_strategy: formData.contentStrategy || formData.content_strategy,
      content_type_strategy: formData.contentTypeStrategy ? JSON.stringify(formData.contentTypeStrategy) : '',
      primary_objective: formData.primaryObjective || formData.primary_objective,
      additional_notes: formData.additionalNotes || formData.additional_notes
    }

    // Remove undefined values
    Object.keys(contentIdeaData).forEach(key => {
      if (contentIdeaData[key] === undefined) {
        delete contentIdeaData[key]
      }
    })

    console.log('Content idea data prepared:', contentIdeaData)

    // Step 1: Update the record
    const result = await baserowAPI.updateContentIdea(contentIdeasTableId, id, contentIdeaData)
    console.log('Baserow record updated:', result.id)

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
    console.error('Error updating content idea:', error)
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
