import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('voiceFile') as File
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
    if (!file.type.startsWith('audio/')) {
      return NextResponse.json(
        { error: 'File must be an audio file' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop() || 'webm'
    const fileName = `voice-${clientId}-temp-${timestamp}.${fileExtension}`
    
    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Create upload path
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'voice-notes')
    
    // Ensure directory exists
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }
    
    const filePath = join(uploadDir, fileName)

    // Save file
    await writeFile(filePath, buffer)

    // Return file URL
    const fileUrl = `/uploads/voice-notes/${fileName}`

    return NextResponse.json({
      success: true,
      fileUrl,
      fileName,
      fileSize: file.size,
      fileType: file.type,
      // Note: In a real implementation, you would call a transcription service here
      // For now, we'll return a placeholder
      transcription: 'Voice transcription will be processed by the workflow...'
    })

  } catch (error) {
    console.error('Error uploading voice note:', error)
    return NextResponse.json(
      { error: 'Failed to upload voice note' },
      { status: 500 }
    )
  }
}