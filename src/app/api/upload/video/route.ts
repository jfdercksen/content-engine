import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('videoFile') as File
    const clientId = formData.get('clientId') as string

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      )
    }

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type.startsWith('video/')) {
      return NextResponse.json(
        { error: 'File must be a video file' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop() || 'mp4'
    const fileName = `video-${clientId}-temp-${timestamp}.${fileExtension}`
    
    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Create upload path
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'videos')
    
    // Ensure directory exists
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }
    
    const filePath = join(uploadDir, fileName)

    // Save file
    await writeFile(filePath, buffer)

    // Return file URL
    const fileUrl = `/uploads/videos/${fileName}`

    return NextResponse.json({
      success: true,
      fileUrl,
      fileName,
      fileSize: file.size,
      fileType: file.type,
      // Note: In a real implementation, you would extract video metadata and potentially transcribe audio
      // For now, we'll return a placeholder
      metadata: {
        duration: 'Video metadata will be extracted by the workflow...',
        transcription: 'Video transcription will be processed by the workflow...'
      }
    })

  } catch (error) {
    console.error('Error uploading video:', error)
    return NextResponse.json(
      { error: 'Failed to upload video' },
      { status: 500 }
    )
  }
}