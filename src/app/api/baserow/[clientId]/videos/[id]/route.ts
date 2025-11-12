import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getVideoById, updateVideo, deleteVideo } from '@/lib/baserow/videosAPI'

// ==================== VALIDATION SCHEMA FOR UPDATES ====================

const videoUpdateSchema = z.object({
  videoStatus: z.enum([
    'Pending',
    'Preparing',
    'Generating Scenes',
    'Generating Images',
    'Generating Videos',
    'Processing Audio',
    'Finalizing',
    'Completed',
    'Failed'
  ]).optional(),
  videoUrl: z.string().url().optional().or(z.literal('')),
  thumbnailUrl: z.string().url().optional().or(z.literal('')),
  rawVideoUrl: z.string().url().optional().or(z.literal('')),
  processedVideoUrl: z.string().url().optional().or(z.literal('')),
  taskId: z.string().optional(),
  errorMessage: z.string().optional(),
  completedAt: z.string().optional(),
  metadata: z.string().optional(),
  
  // Allow any other fields for flexibility
}).passthrough()

// ==================== GET - SINGLE VIDEO ====================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string; id: string }> }
) {
  try {
    const { clientId, id } = await params
    console.log(`📹 GET /api/baserow/${clientId}/videos/${id} - Fetching video`)

    // Fetch video from shared table (with clientId verification)
    const video = await getVideoById(id, clientId)

    console.log(`✅ Video fetched: ${video.id}`)

    return NextResponse.json({
      success: true,
      video
    })

  } catch (error: any) {
    console.error('❌ Error fetching video:', error)
    
    // Handle 404 from Baserow
    if (error.message?.includes('404') || error.message?.includes('not found')) {
      return NextResponse.json(
        { success: false, error: 'Video not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch video'
      },
      { status: 500 }
    )
  }
}

// ==================== PATCH - UPDATE VIDEO ====================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string; id: string }> }
) {
  try {
    const { clientId, id } = await params
    console.log(`📹 PATCH /api/baserow/${clientId}/videos/${id} - Updating video`)

    // Parse and validate request body
    const body = await request.json()
    console.log('📝 Update data:', {
      id,
      fields: Object.keys(body),
      videoStatus: body.videoStatus
    })

    // Validate with Zod
    const validationResult = videoUpdateSchema.safeParse(body)
    if (!validationResult.success) {
      console.error('❌ Validation failed:', validationResult.error.errors)
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validationResult.error.errors
        },
        { status: 400 }
      )
    }

    const updateData = validationResult.data

    // Update video in shared table (with clientId verification)
    console.log('💾 Updating video record in shared Videos table...')
    const updatedVideo = await updateVideo(id, clientId, updateData)

    console.log('✅ Video updated:', updatedVideo.id)

    return NextResponse.json({
      success: true,
      video: updatedVideo,
      message: 'Video updated successfully'
    })

  } catch (error: any) {
    console.error('❌ Error updating video:', error)
    
    // Handle 404 from Baserow
    if (error.message?.includes('404') || error.message?.includes('not found')) {
      return NextResponse.json(
        { success: false, error: 'Video not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update video'
      },
      { status: 500 }
    )
  }
}

// ==================== DELETE - DELETE VIDEO ====================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string; id: string }> }
) {
  try {
    const { clientId, id } = await params
    console.log(`📹 DELETE /api/baserow/${clientId}/videos/${id} - Deleting video`)

    // Delete video from shared table (with clientId verification)
    console.log('🗑️ Deleting video from shared Videos table...')
    await deleteVideo(id, clientId)

    console.log('✅ Video deleted:', id)

    return NextResponse.json({
      success: true,
      message: 'Video deleted successfully'
    })

  } catch (error: any) {
    console.error('❌ Error deleting video:', error)
    
    // Handle 404 from Baserow
    if (error.message?.includes('404') || error.message?.includes('not found')) {
      return NextResponse.json(
        { success: false, error: 'Video not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete video'
      },
      { status: 500 }
    )
  }
}

