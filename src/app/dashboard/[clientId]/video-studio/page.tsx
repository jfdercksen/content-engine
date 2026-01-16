'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

const stages = [
  'script',
  'tts',
  'scenes',
  'images',
  'clips',
  'combine',
  'vo',
  'captions',
  'music',
  'final',
] as const

export default function VideoStudioPage() {
  const params = useParams()
  const clientId = params?.clientId as string

  const [createForm, setCreateForm] = useState({
    campaignName: '',
    contentId: '',
    videoType: 'From user idea',
    videoDescription: '',
    videoDuration: '10s',
  })
  const [triggerForm, setTriggerForm] = useState({
    projectId: '',
    stage: 'script' as (typeof stages)[number],
    payload: '{}',
  })
  const [message, setMessage] = useState<string | null>(null)

  const handleCreate = async () => {
    setMessage(null)
    const res = await fetch(
      `/api/video-studio/${clientId}/projects`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      }
    )
    const data = await res.json()
    if (res.ok) {
      setMessage(`Created project id ${data.id}`)
      setTriggerForm((p) => ({ ...p, projectId: data.id }))
    } else {
      setMessage(`Error: ${data.error}`)
    }
  }

  const handleTrigger = async () => {
    setMessage(null)
    let parsedPayload: any = {}
    try {
      parsedPayload = JSON.parse(triggerForm.payload || '{}')
    } catch (e) {
      setMessage('Payload must be valid JSON')
      return
    }
    const res = await fetch(
      `/api/video-studio/${clientId}/projects/${triggerForm.projectId}/trigger`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: triggerForm.stage,
          payload: parsedPayload,
        }),
      }
    )
    const data = await res.json()
    if (res.ok) {
      setMessage(`Triggered stage ${triggerForm.stage}`)
    } else {
      setMessage(`Error: ${data.error}`)
    }
  }

  return (
    <div className="container mx-auto py-10 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Video Studio</h1>
          <p className="text-muted-foreground">
            Multi-stage short video builder. Each stage triggers the n8n webhook
            and updates the Video Studio DB.
          </p>
          <p className="text-sm text-muted-foreground">
            Webhook: <code>https://n8n.aiautomata.co.za/webhook/short_video</code>
          </p>
        </div>
        <Link className="text-sm text-blue-600 hover:underline" href="/dashboard">
          Back to dashboard
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-6 space-y-3">
          <h2 className="text-xl font-semibold">Stage 1: Create Script, Title & Description</h2>
          <div className="space-y-2">
            <label className="text-sm">Campaign Name</label>
            <input
              className="w-full rounded border px-3 py-2"
              value={createForm.campaignName}
              onChange={(e) =>
                setCreateForm((p) => ({ ...p, campaignName: e.target.value }))
              }
              placeholder="Campaign Name"
            />
            <label className="text-sm">Content ID (link to post)</label>
            <input
              className="w-full rounded border px-3 py-2"
              value={createForm.contentId}
              onChange={(e) =>
                setCreateForm((p) => ({ ...p, contentId: e.target.value }))
              }
              placeholder="Content/Post ID"
            />
            <label className="text-sm">Video Type</label>
            <select
              className="w-full rounded border px-3 py-2"
              value={createForm.videoType}
              onChange={(e) =>
                setCreateForm((p) => ({ ...p, videoType: e.target.value }))
              }
            >
              <option>From user idea</option>
              <option>From transcript</option>
              <option>From script</option>
            </select>

            <label className="text-sm">The Main Topic (idea / transcript / script)</label>
            <textarea
              className="w-full rounded border px-3 py-2 h-24"
              value={createForm.videoDescription}
              onChange={(e) =>
                setCreateForm((p) => ({
                  ...p,
                  videoDescription: e.target.value,
                }))
              }
              placeholder="Provide the idea, transcript, or script here"
            />
            <label className="text-sm">Duration</label>
            <select
              className="w-full rounded border px-3 py-2"
              value={createForm.videoDuration}
              onChange={(e) =>
                setCreateForm((p) => ({ ...p, videoDuration: e.target.value }))
              }
            >
              <option value="10s">10s</option>
              <option value="30s">30s</option>
              <option value="1min">1 Minute</option>
              <option value="2min">2 Minutes</option>
            </select>
            <button
              className="mt-2 rounded bg-blue-600 px-4 py-2 text-white hover:opacity-90"
              onClick={handleCreate}
            >
              Create (Stage 1)
            </button>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6 space-y-3">
          <h2 className="text-xl font-semibold">Trigger Stage (manual)</h2>
          <div className="space-y-2">
            <label className="text-sm">Project ID</label>
            <input
              className="w-full rounded border px-3 py-2"
              value={triggerForm.projectId}
              onChange={(e) =>
                setTriggerForm((p) => ({ ...p, projectId: e.target.value }))
              }
              placeholder="project row id"
            />
            <label className="text-sm">Stage</label>
            <select
              className="w-full rounded border px-3 py-2"
              value={triggerForm.stage}
              onChange={(e) =>
                setTriggerForm((p) => ({
                  ...p,
                  stage: e.target.value as (typeof stages)[number],
                }))
              }
            >
              {stages.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <label className="text-sm">Payload (JSON)</label>
            <textarea
              className="w-full rounded border px-3 py-2 h-32 font-mono text-xs"
              value={triggerForm.payload}
              onChange={(e) =>
                setTriggerForm((p) => ({ ...p, payload: e.target.value }))
              }
              placeholder='{"key":"value"}'
            />
            <button
              className="mt-2 rounded bg-green-600 px-4 py-2 text-white hover:opacity-90"
              onClick={handleTrigger}
              disabled={!triggerForm.projectId}
            >
              Run Stage
            </button>
            <p className="text-xs text-muted-foreground">
              Payload is passed to n8n; include client-specific info you need
              downstream. Stages will update Baserow and Progress Log on callback.
            </p>
          </div>
        </div>
      </div>

      {message && (
        <div className="rounded border bg-muted p-3 text-sm">{message}</div>
      )}
    </div>
  )
}



