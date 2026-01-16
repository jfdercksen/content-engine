import { NextRequest, NextResponse } from 'next/server'
import { getVideoStudioClient } from '@/lib/videoStudio/baserowClient'
import {
  VIDEO_FIELDS,
  VIDEO_STUDIO_TABLES,
} from '@/lib/videoStudio/constants'

export async function POST(
  req: NextRequest,
  { params }: { params: { clientId: string } }
) {
  try {
    const { clientId } = params
    const body = await req.json()
    const {
      campaignName,
      contentId,
      videoType,
      script,
      videoDescription,
      musicPrompt,
      ttsVoice,
      videoDuration,
      productType,
      targetAudience,
      imageGenerator,
      generativeStyle,
    } = body || {}

    if (!campaignName) {
      return NextResponse.json(
        { error: 'campaignName is required' },
        { status: 400 }
      )
    }

    const client = await getVideoStudioClient(clientId)

    const payload: Record<string, any> = {
      [VIDEO_FIELDS.campaignName]: campaignName,
      [VIDEO_FIELDS.contentId]: contentId || '',
      [VIDEO_FIELDS.videoType]: videoType || '',
      [VIDEO_FIELDS.script]: script || '',
      [VIDEO_FIELDS.videoDescription]: videoDescription || '',
      [VIDEO_FIELDS.musicPrompt]: musicPrompt || '',
      [VIDEO_FIELDS.ttsVoice]: ttsVoice || '',
      [VIDEO_FIELDS.progressLog]: `Created at ${new Date().toISOString()}`,
    }

    if (videoDuration) payload['Video Duration'] = videoDuration
    if (productType) payload['Product Type'] = productType
    if (targetAudience) payload['Target Audience'] = targetAudience
    if (imageGenerator) payload[VIDEO_FIELDS.imageGenerator] = imageGenerator
    if (generativeStyle) payload[VIDEO_FIELDS.generativeStyle] = generativeStyle

    const record = await client.createVideo(
      VIDEO_STUDIO_TABLES.videos,
      payload
    )

    return NextResponse.json({ success: true, id: record.id, record })
  } catch (error: any) {
    console.error('Error creating video studio project:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to create project' },
      { status: 500 }
    )
  }
}


