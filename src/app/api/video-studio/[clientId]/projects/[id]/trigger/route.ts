import { NextRequest, NextResponse } from 'next/server'
import { getVideoStudioClient } from '@/lib/videoStudio/baserowClient'
import {
  VIDEO_FIELDS,
  VIDEO_STUDIO_TABLES,
} from '@/lib/videoStudio/constants'
import { getVideoStudioConfig } from '@/lib/videoStudio/config'

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
  projectId: string,
  message: string
) {
  const record = await (await client).getVideoById(
    VIDEO_STUDIO_TABLES.videos,
    projectId
  )
  const previous = record?.[VIDEO_FIELDS.progressLog] || ''
  const nextEntry = `${new Date().toISOString()} | ${message}`
  return previous ? `${previous}\n${nextEntry}` : nextEntry
}

export async function POST(
  req: NextRequest,
  { params }: { params: { clientId: string; id: string } }
) {
  try {
    const { clientId, id } = params
    const body = await req.json()
    const { stage, payload } = body || {}

    if (!stage) {
      return NextResponse.json(
        { error: 'stage is required' },
        { status: 400 }
      )
    }

    const client = await getVideoStudioClient(clientId)
    const statusField = stageStatusField[stage]
    const update: Record<string, any> = {}

    if (statusField) {
      update[statusField] = generatingLabel
    }

    const progressLog = await appendProgressLog(
      Promise.resolve(client),
      id,
      `Stage ${stage}: queued`
    )
    update[VIDEO_FIELDS.progressLog] = progressLog

    await client.updateVideo(VIDEO_STUDIO_TABLES.videos, id, update)

    // Call n8n webhook
    const cfg = await getVideoStudioConfig(clientId)
    await fetch(cfg.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId,
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


