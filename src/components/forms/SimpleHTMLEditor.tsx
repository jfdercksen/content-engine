'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Save, Eye, FileText, X, Send, ChevronRight, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'

interface SimpleHTMLEditorProps {
  clientId: string
  emailIdeaId: string
  initialHtml: string
  emailIdeaName?: string
  status?: string
  subjectLine?: string
  fromName?: string
  fromEmail?: string
  replyToEmail?: string
  mailchimpCampaignId?: string
  mailchimpCampaignUrl?: string
  onSave?: () => void
  onCancel?: () => void
  onSendToMailchimp?: (id: string) => void
}

export default function SimpleHTMLEditor({
  clientId,
  emailIdeaId,
  initialHtml,
  emailIdeaName,
  status: initialStatus,
  subjectLine: initialSubjectLine,
  fromName: initialFromName,
  fromEmail: initialFromEmail,
  replyToEmail: initialReplyToEmail,
  mailchimpCampaignId,
  mailchimpCampaignUrl,
  onSave,
  onCancel,
  onSendToMailchimp
}: SimpleHTMLEditorProps) {
  const [html, setHtml] = useState(initialHtml)
  const [status, setStatus] = useState(initialStatus || 'Draft')
  const [subjectLine, setSubjectLine] = useState(initialSubjectLine || '')
  const [fromName, setFromName] = useState(initialFromName || '')
  const [fromEmail, setFromEmail] = useState(initialFromEmail || '')
  const [replyToEmail, setReplyToEmail] = useState(initialReplyToEmail || '')
  const [saving, setSaving] = useState(false)
  const [viewMode, setViewMode] = useState<'split' | 'preview' | 'editor'>('split')
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    setHtml(initialHtml)
    setStatus(initialStatus || 'Draft')
    setSubjectLine(initialSubjectLine || '')
    setFromName(initialFromName || '')
    setFromEmail(initialFromEmail || '')
    setReplyToEmail(initialReplyToEmail || '')
  }, [initialHtml, initialStatus, initialSubjectLine, initialFromName, initialFromEmail, initialReplyToEmail])

  const handleSave = async () => {
    try {
      setSaving(true)
      const response = await fetch(`/api/baserow/${clientId}/email-ideas/${emailIdeaId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          generatedHtml: html,
          status,
          subjectLine,
          fromName,
          fromEmail,
          replyToEmail
        })
      })

      if (response.ok) {
        toast.success('Email saved successfully!')
        onSave?.()
      } else {
        const errorData = await response.json()
        toast.error(`Failed to save: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error saving email:', error)
      toast.error('Failed to save email')
    } finally {
      setSaving(false)
    }
  }

  const canSendToMailchimp = status === 'Approved' && html && html.trim().length > 0

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-white">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b bg-white">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-xl font-bold">Edit Email</h2>
            <p className="text-sm text-muted-foreground">
              {emailIdeaName || 'Email Idea'}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2"
          >
            {showSettings ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            Settings
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {status && (
            <Badge variant="outline" className={status === 'Approved' ? 'bg-green-100 text-green-800' : ''}>
              {status}
            </Badge>
          )}
          {canSendToMailchimp && onSendToMailchimp && (
            <Button 
              onClick={() => onSendToMailchimp(emailIdeaId)}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              <Send className="h-4 w-4 mr-2" />
              Send to Mailchimp
            </Button>
          )}
          <div className="flex gap-2 border-l pl-2 ml-2">
            <Button
              variant={viewMode === 'split' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('split')}
            >
              <Eye className="h-4 w-4 mr-1" />
              Split
            </Button>
            <Button
              variant={viewMode === 'preview' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('preview')}
            >
              <Eye className="h-4 w-4 mr-1" />
              Preview
            </Button>
            <Button
              variant={viewMode === 'editor' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('editor')}
            >
              <FileText className="h-4 w-4 mr-1" />
              Editor
            </Button>
          </div>
          <Button variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="border-b bg-gray-50 p-4">
          <div className="grid grid-cols-2 gap-4 max-w-4xl">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Generated">Generated</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Sent">Sent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subjectLine">Subject Line</Label>
              <Input
                id="subjectLine"
                value={subjectLine}
                onChange={(e) => setSubjectLine(e.target.value)}
                placeholder="Email subject line"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fromName">From Name</Label>
              <Input
                id="fromName"
                value={fromName}
                onChange={(e) => setFromName(e.target.value)}
                placeholder="Sender name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fromEmail">From Email</Label>
              <Input
                id="fromEmail"
                type="email"
                value={fromEmail}
                onChange={(e) => setFromEmail(e.target.value)}
                placeholder="sender@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="replyToEmail">Reply-To Email</Label>
              <Input
                id="replyToEmail"
                type="email"
                value={replyToEmail}
                onChange={(e) => setReplyToEmail(e.target.value)}
                placeholder="reply@example.com"
              />
            </div>
            {mailchimpCampaignId && (
              <div className="space-y-2">
                <Label>Mailchimp Campaign</Label>
                <div className="text-sm text-gray-600">
                  {mailchimpCampaignUrl ? (
                    <a href={mailchimpCampaignUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      View Campaign
                    </a>
                  ) : (
                    <span>ID: {mailchimpCampaignId}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Split View */}
        {viewMode === 'split' && (
          <>
            {/* Left: HTML Editor */}
            <div className="w-1/2 border-r overflow-y-auto bg-gray-50">
              <div className="p-4">
                <div className="mb-2">
                  <h3 className="text-sm font-medium text-gray-700">HTML Editor</h3>
                  <p className="text-xs text-gray-500">Edit the HTML code directly</p>
                </div>
                <Textarea
                  value={html}
                  onChange={(e) => setHtml(e.target.value)}
                  className="min-h-[calc(100vh-12rem)] font-mono text-sm"
                  placeholder="Enter HTML content..."
                />
              </div>
            </div>
            {/* Right: Live Preview */}
            <div className="w-1/2 overflow-y-auto bg-white">
              <div className="p-4">
                <div className="mb-2">
                  <h3 className="text-sm font-medium text-gray-700">Live Preview</h3>
                  <p className="text-xs text-gray-500">Changes update in real-time</p>
                </div>
                <div className="border-2 border-gray-200 rounded-lg overflow-hidden bg-white">
                  <div className="bg-gray-50 p-2 border-b text-xs text-gray-600 text-center">
                    Email Preview
                  </div>
                  <div className="p-4">
                    {html ? (
                      <iframe
                        srcDoc={html}
                        className="w-full min-h-[600px] border-0"
                        title="Email Preview"
                        sandbox="allow-same-origin"
                      />
                    ) : (
                      <div className="min-h-[600px] flex items-center justify-center text-gray-400">
                        <p>No HTML content to preview</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Preview Only */}
        {viewMode === 'preview' && (
          <div className="w-full overflow-y-auto bg-white">
            <div className="p-6">
              <div className="border-2 border-gray-200 rounded-lg overflow-hidden bg-white">
                <div className="bg-gray-50 p-2 border-b text-xs text-gray-600 text-center">
                  Email Preview
                </div>
                <div className="p-4">
                  {html ? (
                    <iframe
                      srcDoc={html}
                      className="w-full min-h-[calc(100vh-10rem)] border-0"
                      title="Email Preview"
                      sandbox="allow-same-origin"
                    />
                  ) : (
                    <div className="min-h-[600px] flex items-center justify-center text-gray-400">
                      <p>No HTML content to preview</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Editor Only */}
        {viewMode === 'editor' && (
          <div className="w-full overflow-y-auto bg-gray-50">
            <div className="p-4">
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700">HTML Editor</h3>
                <p className="text-xs text-gray-500">Edit the HTML code directly</p>
              </div>
              <Textarea
                value={html}
                onChange={(e) => setHtml(e.target.value)}
                className="min-h-[calc(100vh-12rem)] font-mono text-sm"
                placeholder="Enter HTML content..."
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

