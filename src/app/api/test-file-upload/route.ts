import { NextRequest, NextResponse } from 'next/server'
import { BaserowAPI } from '@/lib/baserow/api'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('testFile') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    
    console.log('Test file upload - File details:', {
      name: file.name,
      size: file.size,
      type: file.type
    })
    
    // Test Baserow file upload
    const baserowAPI = new BaserowAPI('modern-management')
    
    console.log('Testing Baserow file upload...')
    const uploadResult = await baserowAPI.uploadFile(file)
    
    console.log('Baserow upload result:', uploadResult)
    
    return NextResponse.json({
      success: true,
      file: {
        name: file.name,
        size: file.size,
        type: file.type
      },
      baserowResult: uploadResult
    })
    
  } catch (error) {
    console.error('Test file upload error:', error)
    return NextResponse.json({
      error: 'File upload test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}