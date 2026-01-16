import { NextRequest, NextResponse } from 'next/server'
import { getVideoStudioClient } from '@/lib/videoStudio/baserowClient'
import {
  SCENE_FIELDS,
  VIDEO_FIELDS,
  VIDEO_STUDIO_TABLES,
} from '@/lib/videoStudio/constants'
import { getVideoStudioConfig } from '@/lib/videoStudio/config'

type Stage =
  | 'script'
  | 'tts'
  | 'scenes'
  | 'images'
  | 'clips'
  | 'combine'
  | 'vo'
  | 'captions'
  | 'music'
  | 'final'

const stageStatusField: Record<Stage, string | undefined> = {
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

const doneLabel = 'Done'

async function appendProgress(
  client: ReturnType<typeof getVideoStudioClient>,
  projectId: string,
  message: string
) {
  const record = await client.getVideoById(
    VIDEO_STUDIO_TABLES.videos,
    projectId
  )
  const prev = record?.[VIDEO_FIELDS.progressLog] || ''
  const next = `${new Date().toISOString()} | ${message}`
  return prev ? `${prev}\n${next}` : next
}

async function upsertScenes(
  client: ReturnType<typeof getVideoStudioClient>,
  projectId: string,
  scenes: any[]
) {
  for (const scene of scenes) {
    const payload: Record<string, any> = {
      [SCENE_FIELDS.videos]: [projectId],
    }

    if (scene.description) payload[SCENE_FIELDS.description] = scene.description
    if (scene.imagePrompt) payload[SCENE_FIELDS.imagePrompt] = scene.imagePrompt
    if (scene.animationPrompt)
      payload[SCENE_FIELDS.animationPrompt] = scene.animationPrompt
    if (scene.soundEffectPrompt)
      payload[SCENE_FIELDS.soundEffectPrompt] = scene.soundEffectPrompt
    if (scene.externalImageUrl)
      payload[SCENE_FIELDS.externalImageUrl] = scene.externalImageUrl
    if (scene.externalVideoUrl)
      payload[SCENE_FIELDS.externalVideoUrl] = scene.externalVideoUrl
    if (scene.duration !== undefined)
      payload[SCENE_FIELDS.duration] = scene.duration
    if (scene.scriptSegment)
      payload[SCENE_FIELDS.scriptSegment] = scene.scriptSegment
    if (scene.generationStatus)
      payload[SCENE_FIELDS.generationStatus] = scene.generationStatus

    // File fields: expect arrays from n8n
    if (scene.image) payload[SCENE_FIELDS.image] = scene.image
    if (scene.videoClip) payload[SCENE_FIELDS.videoClip] = scene.videoClip
    if (scene.videoSoundFx)
      payload[SCENE_FIELDS.videoSoundFx] = scene.videoSoundFx

    if (scene.id) {
      await client.updateVideo(VIDEO_STUDIO_TABLES.scenes, scene.id, payload)
    } else {
      await client.createVideo(VIDEO_STUDIO_TABLES.scenes, payload)
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { projectId, stage, data, scenes, clientId } = body || {}

    if (!clientId || !projectId || !stage) {
      return NextResponse.json(
        { error: 'clientId, projectId and stage are required' },
        { status: 400 }
      )
    }

    const cfg = await getVideoStudioConfig(clientId)
    if (cfg.callbackSecret) {
      const header = req.headers.get('x-video-studio-secret')
      if (header !== cfg.callbackSecret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const client = await getVideoStudioClient(clientId)
    const update: Record<string, any> = {}
    const statusField = stageStatusField[stage as Stage]

    if (statusField) update[statusField] = doneLabel

    // Map common video fields from data
    if (data) {
      if (data.script) update[VIDEO_FIELDS.script] = data.script
      if (data.videoDescription)
        update[VIDEO_FIELDS.videoDescription] = data.videoDescription
      if (data.ttsVoice) update[VIDEO_FIELDS.ttsVoice] = data.ttsVoice
      if (data.ttsAudio) update[VIDEO_FIELDS.ttsAudio] = data.ttsAudio
      if (data.captionsUrl) update[VIDEO_FIELDS.captionsUrl] = data.captionsUrl
      if (data.captionedVideo)
        update[VIDEO_FIELDS.captionedVideo] = data.captionedVideo
      if (data.rawVideoUrl) update[VIDEO_FIELDS.rawVideoUrl] = data.rawVideoUrl
      if (data.finalVideoUrl)
        update[VIDEO_FIELDS.finalVideoUrl] = data.finalVideoUrl
      if (data.videoVoiceMusicUrl)
        update[VIDEO_FIELDS.videoVoiceMusicUrl] = data.videoVoiceMusicUrl
      if (data.videoCaptionsUrl)
        update[VIDEO_FIELDS.videoCaptionsUrl] = data.videoCaptionsUrl
      if (data.finalVideoFile)
        update[VIDEO_FIELDS.finalVideoFile] = data.finalVideoFile
      if (data.imageGenerator)
        update[VIDEO_FIELDS.imageGenerator] = data.imageGenerator
      if (data.generativeStyle)
        update[VIDEO_FIELDS.generativeStyle] = data.generativeStyle
      if (data.videoStatus) update[VIDEO_FIELDS.videoStatus] = data.videoStatus
      if (data.finalStatus) update[VIDEO_FIELDS.finalStatus] = data.finalStatus
      if (data.musicStatus) update[VIDEO_FIELDS.musicStatus] = data.musicStatus
      if (data.imagesStatus)
        update[VIDEO_FIELDS.imagesStatus] = data.imagesStatus
    }

    const progressLog = await appendProgress(
      client,
      projectId,
      `Stage ${stage}: ${data?.message || 'completed'}`
    )
    update[VIDEO_FIELDS.progressLog] = progressLog

    await client.updateVideo(VIDEO_STUDIO_TABLES.videos, projectId, update)

    if (Array.isArray(scenes) && scenes.length > 0) {
      await upsertScenes(client, projectId, scenes)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error handling video studio callback:', error)
    return NextResponse.json(
      { error: error?.message || 'Callback failed' },
      { status: 500 }
    )
  }
}


