'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Eye, Download, Copy, Mail, Calendar, Tag, ExternalLink, RefreshCw } from 'lucide-react'
import { EmailIdea } from '@/lib/types/content'

interface EmailPreviewModalProps {
  emailIdea: EmailIdea | null
  isOpen: boolean
  onClose: () => void
  onRefresh?: () => void
}

export default function EmailPreviewModal({ emailIdea, isOpen, onClose, onRefresh }: EmailPreviewModalProps) {
  const [viewMode, setViewMode] = useState<'preview' | 'html'>('preview')

  if (!emailIdea) return null

  const handleCopyHtml = async () => {
    if (emailIdea.generatedHtml) {
      try {
        await navigator.clipboard.writeText(emailIdea.generatedHtml)
        // You could add a toast notification here
        console.log('HTML copied to clipboard')
      } catch (err) {
        console.error('Failed to copy HTML:', err)
      }
    }
  }

  const handleDownloadHtml = () => {
    if (emailIdea.generatedHtml) {
      const blob = new Blob([emailIdea.generatedHtml], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${emailIdea.emailIdeaName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft': return 'bg-gray-100 text-gray-800'
      case 'Generating': return 'bg-blue-100 text-blue-800'
      case 'Generated': return 'bg-green-100 text-green-800'
      case 'Failed': return 'bg-red-100 text-red-800'
      case 'Send': return 'bg-green-100 text-green-800'
      case 'Approved': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Welcome & Onboarding Emails': return 'bg-blue-100 text-blue-800'
      case 'Promotional Emails': return 'bg-orange-100 text-orange-800'
      case 'Newsletter / Content Emails': return 'bg-green-100 text-green-800'
      case 'Lead Nurture / Drip Emails': return 'bg-purple-100 text-purple-800'
      case 'Event or Launch Emails': return 'bg-red-100 text-red-800'
      case 'Transactional Emails': return 'bg-gray-100 text-gray-800'
      case 'Re-Engagement Emails': return 'bg-yellow-100 text-yellow-800'
      case 'Customer Loyalty & Upsell Emails': return 'bg-pink-100 text-pink-800'
      case 'Survey & Feedback Emails': return 'bg-indigo-100 text-indigo-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Preview: {emailIdea.emailIdeaName}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-3">
          {/* Email Info Header - Compact */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              {emailIdea.status && (
                <Badge className={getStatusColor(emailIdea.status)}>
                  {emailIdea.status}
                </Badge>
              )}
              {emailIdea.emailType && (
                <Badge className={getTypeColor(emailIdea.emailType)}>
                  {emailIdea.emailType}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              {emailIdea.lastModified}
            </div>
          </div>

          {/* Email Content */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'preview' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('preview')}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
                <Button
                  variant={viewMode === 'html' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('html')}
                >
                  <Tag className="h-4 w-4 mr-2" />
                  HTML
                </Button>
              </div>
              
              {emailIdea.generatedHtml && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyHtml}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy HTML
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadHtml}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              )}
            </div>

            <div className="flex-1 border-2 border-gray-200 rounded-lg overflow-hidden bg-white">
              {emailIdea.generatedHtml ? (
                viewMode === 'preview' ? (
                  <div className="h-full overflow-auto">
                    <iframe
                      srcDoc={emailIdea.generatedHtml}
                      className="w-full h-full border-0 min-h-[600px]"
                      title="Email Preview"
                      sandbox="allow-same-origin"
                    />
                  </div>
                ) : (
                  <div className="h-full overflow-auto p-4 bg-gray-50">
                    <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                      {emailIdea.generatedHtml}
                    </pre>
                  </div>
                )
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <Mail className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">No Generated Email</p>
                    <p className="text-sm">
                      {emailIdea.status === 'Generating' 
                        ? 'Email is being generated... This may take a few minutes.' 
                        : emailIdea.status === 'Failed'
                        ? 'Email generation failed. Please try generating again.'
                        : 'This email idea has not been generated yet. Click Edit to generate the email.'}
                    </p>
                    {emailIdea.status === 'Generating' && (
                      <div className="mt-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                        {onRefresh && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={onRefresh}
                            className="mt-2"
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Check Status
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
