import { NextRequest, NextResponse } from 'next/server'
import { getVideoStudioClient } from '@/lib/videoStudio/baserowClient'
import {
  VIDEO_FIELDS,
  VIDEO_STUDIO_TABLES,
  VIDEO_STUDIO_WEBHOOK_URL,
} from '@/lib/videoStudio/constants'

const stageStatusField: Record<string, string> = {
  script: VIDEO_FIELDS.scriptStatus,
  tts: VIDEO_FIELDS.ttsStatus,
  scenes: VIDEO_FIELDS.imagesStatus,
  images: VIDEO_FIELDS.imagesStatus,
  clips: VIDEO_FIELDS.videoStatus,
  combine: VIDEO_FIELDS.videoStatus,
  vo: VIDEO_FIELDS.videoStatus,
  captions: VIDEO_FIELDS.videoStatus,
  music: VIDEO_FIELDS.musicStatus,
  final: VIDEO_FIELDS.finalStatus,
}

const generatingLabel = 'Generating'

async function appendProgressLog(
  client: ReturnType<typeof getVideoStudioClient>,
  recordId: string,
  message: string
) {
  const record = await client.getVideoById(
    VIDEO_STUDIO_TABLES.videos,
    recordId
  )
  const previous = record?.[VIDEO_FIELDS.progressLog] || ''
  const nextEntry = `${new Date().toISOString()} | ${message}`
  const combined = previous ? `${previous}\n${nextEntry}` : nextEntry
  return combined
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await req.json()
    const { stage, payload } = body || {}

    if (!stage) {
      return NextResponse.json(
        { error: 'stage is required' },
        { status: 400 }
      )
    }

    const client = getVideoStudioClient()
    const statusField = stageStatusField[stage]
    const update: Record<string, any> = {}

    if (statusField) {
      update[statusField] = generatingLabel
    }

    const progressLog = await appendProgressLog(
      client,
      id,
      `Stage ${stage}: queued`
    )
    update[VIDEO_FIELDS.progressLog] = progressLog

    await client.updateVideo(VIDEO_STUDIO_TABLES.videos, id, update)

    // Call n8n webhook
    await fetch(VIDEO_STUDIO_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: id,
        stage,
        payload: payload || {},
      }),
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error triggering stage:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to trigger stage' },
      { status: 500 }
    )
  }
}


