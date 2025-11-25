'use client'

import { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Badge } from '@/components/ui/badge'
import { 
  Mail, 
  FileText, 
  Mic, 
  Link, 
  Upload, 
  X, 
  Image as ImageIcon,
  Save,
  Eye,
  Plus,
  Edit
} from 'lucide-react'
import { EMAIL_TYPES, EMAIL_STATUS, EmailSection, EmailMediaStructure } from '@/lib/types/content'
import MediaSectionBuilder from '@/components/forms/MediaSectionBuilder'

interface EmailIdeaFormProps {
  clientId: string
  initialData?: any
  onSave?: (data: any) => void
  onCancel?: () => void
}

interface EmailIdeaFormData {
  emailIdeaName: string
  emailType: 'Welcome' | 'Promotional' | 'Newsletter'
  contentSource: 'text' | 'voice' | 'url'
  emailTextIdea: string
  emailUrlIdea: string
  voiceFile?: File
  status: string
}

export default function EmailIdeaForm({ 
  clientId, 
  initialData, 
  onSave, 
  onCancel 
}: EmailIdeaFormProps) {
  // Parse initial sections from emailTextIdea if it exists
  const parseInitialSections = (): EmailSection[] => {
    if (initialData?.emailTextIdea) {
      try {
        const parsed = JSON.parse(initialData.emailTextIdea)
        if (parsed && parsed.sections && Array.isArray(parsed.sections)) {
          return parsed.sections
        }
      } catch (e) {
        // Not JSON, treat as old format
      }
    }
    return []
  }

  const [sections, setSections] = useState<EmailSection[]>(parseInitialSections())
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [generatedEmail, setGeneratedEmail] = useState<string>(initialData?.generatedHtml || '')
  const [showPreview, setShowPreview] = useState(false)
  const [previewMode, setPreviewMode] = useState<'preview' | 'html' | 'edit'>('preview')
  const [editedHtml, setEditedHtml] = useState<string>(initialData?.generatedHtml || '')
  const [pollingRecordId, setPollingRecordId] = useState<string | null>(null)
  const [generationStatus, setGenerationStatus] = useState<string>('')
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Parse initial content source from emailTextIdea if it's JSON
  const parseInitialContentSource = (): { type: 'text' | 'voice' | 'url', value: string } => {
    if (initialData?.emailTextIdea) {
      try {
        const parsed = JSON.parse(initialData.emailTextIdea)
        if (parsed && parsed.contentSource) {
          return parsed.contentSource
        }
      } catch (e) {
        // Not JSON, treat as old format
        if (initialData.emailUrlIdea) {
          return { type: 'url', value: initialData.emailUrlIdea }
        }
        return { type: 'text', value: initialData.emailTextIdea }
      }
    }
    if (initialData?.emailUrlIdea) {
      return { type: 'url', value: initialData.emailUrlIdea }
    }
    return { type: 'text', value: initialData?.emailTextIdea || '' }
  }

  const initialContentSource = parseInitialContentSource()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<EmailIdeaFormData>({
    defaultValues: {
      emailIdeaName: initialData?.emailIdeaName || '',
      emailType: (initialData?.emailType && ['Welcome', 'Promotional', 'Newsletter'].includes(initialData.emailType)) 
        ? initialData.emailType 
        : 'Welcome',
      contentSource: initialContentSource.type,
      emailTextIdea: initialContentSource.value,
      emailUrlIdea: initialContentSource.type === 'url' ? initialContentSource.value : '',
      status: initialData?.status || 'Draft'
    }
  })

  const watchedContentSource = watch('contentSource')
  const watchedEmailType = watch('emailType')

  // Polling function to check email generation status
  const startPollingForCompletion = (recordId: string) => {
    setPollingRecordId(recordId)
    setGenerationStatus('Generating')
    
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/baserow/${clientId}/email-ideas/${recordId}`)
        if (response.ok) {
          const data = await response.json()
          const status = data.status || 'Draft'
          
          setGenerationStatus(status)
          
          if (status === 'Generated') {
            setGeneratedEmail(data.generatedHtml || '')
            setShowPreview(true)
            setPollingRecordId(null)
            clearInterval(pollInterval)
            alert('Email generation completed! Check the preview below.')
          } else if (status === 'Failed') {
            setPollingRecordId(null)
            clearInterval(pollInterval)
            alert('Email generation failed. Please try again.')
          }
        }
      } catch (error) {
        console.error('Error polling for completion:', error)
      }
    }, 10000) // Poll every 10 seconds
    
    // Stop polling after 10 minutes
    setTimeout(() => {
      clearInterval(pollInterval)
      if (pollingRecordId === recordId) {
        setPollingRecordId(null)
        setGenerationStatus('')
        alert('Email generation is taking longer than expected. Please check back later.')
      }
    }, 600000) // 10 minutes
  }


  const handleSaveEditedHtml = async () => {
    if (!initialData?.id) {
      alert('No email idea ID found')
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`/api/baserow/${clientId}/email-ideas/${initialData.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          generatedhtml: editedHtml
        })
      })

      if (response.ok) {
        // Update the generated email state
        setGeneratedEmail(editedHtml)
        alert('Email HTML updated successfully!')
        // Refresh the parent component
        onSave?.(initialData)
      } else {
        const errorData = await response.json()
        alert(`Failed to update email: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error saving edited HTML:', error)
      alert('Failed to save changes. Please try again.')
    } finally {
      setLoading(false)
    }
  }


  // Handle form submission
  const onSubmit = async (data: EmailIdeaFormData) => {
    try {
      setLoading(true)

      // Validate sections - must have at least one section
      if (sections.length === 0) {
        alert('Please add at least one section to your email.')
        return
      }

      // Build the JSON structure to store in emailTextIdea
      const contentSourceValue = watchedContentSource === 'url' 
        ? data.emailUrlIdea 
        : data.emailTextIdea

      const emailMediaStructure: EmailMediaStructure = {
        emailType: data.emailType,
        sections: sections.sort((a, b) => a.order - b.order),
        contentSource: {
          type: data.contentSource,
          value: contentSourceValue
        }
      }

      // Convert to JSON string for storage
      const emailTextIdeaJson = JSON.stringify(emailMediaStructure)

      // Create email idea in Baserow
      // Only include fields with actual values - don't send empty strings or arrays
      const emailIdeaData: any = {
        emailideaname: data.emailIdeaName,
        emailtype: data.emailType,
        emailtextidea: emailTextIdeaJson, // Store JSON structure here
        status: data.status || 'Draft'
      }
      
      // Only include optional fields if they have values
      // Note: We're not sending hook, cta, emailurlidea, templates, or images anymore
      // as they're no longer used in the new structure

      console.log('Sending email idea data to API:', emailIdeaData)
      console.log('Email Media Structure:', emailMediaStructure)

      const response = await fetch(`/api/baserow/${clientId}/email-ideas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailIdeaData)
      })

      if (response.ok) {
        const result = await response.json()
        
        // Send to n8n workflow for email generation
        await generateEmailWithWorkflow(result.id, emailMediaStructure)
        
        onSave?.(result)
      } else {
        // Get detailed error information from the response
        const errorText = await response.text()
        console.error('API Error Response (raw):', errorText)
        
        let errorData: any = {}
        try {
          errorData = JSON.parse(errorText)
          console.error('API Error Response (parsed):', errorData)
        } catch (e) {
          console.error('Failed to parse error response as JSON:', e)
          errorData = { error: errorText }
        }
        
        // Log detailed error information
        console.error('API Error Details:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData.error,
          details: errorData.details,
          fieldErrors: errorData.details
        })
        
        // Build a more detailed error message
        let errorMessage = errorData.error || 'Failed to create email idea'
        if (errorData.details) {
          if (typeof errorData.details === 'string') {
            errorMessage += `: ${errorData.details}`
          } else if (typeof errorData.details === 'object') {
            // Format field-specific errors
            const fieldErrors = Object.entries(errorData.details)
              .map(([field, errors]: [string, any]) => {
                const errorMessages = Array.isArray(errors) 
                  ? errors.map((e: any) => e.error || e.message || String(e)).join(', ')
                  : String(errors)
                return `${field}: ${errorMessages}`
              })
              .join('; ')
            errorMessage += `. Field errors: ${fieldErrors}`
          }
        }
        
        throw new Error(`API Error (${response.status}): ${errorMessage}`)
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      
      // Show more detailed error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      alert(`Error creating email idea: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  // Generate email with n8n workflow
  const generateEmailWithWorkflow = async (emailIdeaId: string, emailMediaStructure: EmailMediaStructure) => {
    try {
      setGenerating(true)

      console.log('Sending email media structure to workflow:', emailMediaStructure)

      const workflowData = new FormData()
      workflowData.append('emailIdeaId', emailIdeaId)
      workflowData.append('clientId', clientId)
      
      // Send the complete JSON structure
      workflowData.append('emailMediaStructure', JSON.stringify(emailMediaStructure))
      
      // Also send individual fields for easier access in workflow
      workflowData.append('emailType', emailMediaStructure.emailType)
      workflowData.append('contentSourceType', emailMediaStructure.contentSource.type)
      workflowData.append('contentSourceValue', emailMediaStructure.contentSource.value)
      workflowData.append('sectionsCount', emailMediaStructure.sections.length.toString())
      
      // Send sections data
      emailMediaStructure.sections.forEach((section, index) => {
        workflowData.append(`section_${index}`, JSON.stringify(section))
      })

      const response = await fetch('/api/webhooks/n8n/email-idea-generation', {
        method: 'POST',
        body: workflowData
      })

      // Read response body once (as text first, then parse if JSON)
      const responseText = await response.text()
      
      // Check if response is HTML (error page)
      if (responseText.trim().startsWith('<!DOCTYPE html>') || responseText.trim().startsWith('<html')) {
        console.error('Server returned HTML error page instead of JSON')
        console.error('Response status:', response.status)
        console.error('Response headers:', Object.fromEntries(response.headers.entries()))
        
        // Try to extract error message from HTML if possible
        const errorMatch = responseText.match(/<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s)
        if (errorMatch) {
          try {
            const nextData = JSON.parse(errorMatch[1])
            const errorInfo = nextData?.props?.pageProps?.err || nextData?.err
            if (errorInfo?.message) {
              throw new Error(`Server error: ${errorInfo.message}. Please restart the development server.`)
            }
          } catch (e) {
            // Ignore parsing errors
          }
        }
        
        throw new Error('Server error: The API returned an HTML error page. This usually means the server needs to be restarted. Please check the server console for details.')
      }
      
      console.log('Workflow response text:', responseText.substring(0, 200) + '...')
      
      if (response.ok) {
        let result
        try {
          result = JSON.parse(responseText)
        } catch (e) {
          // If not JSON, treat as plain text
          result = { message: responseText }
        }
        
        console.log('Workflow response:', result)
        
        if (result.status === 'Generating') {
          // Start polling for completion
          startPollingForCompletion(result.recordId)
          alert('Email generation started! This may take a few minutes. You can close this form and check back later.')
        } else {
          // Immediate completion (shouldn't happen with new implementation)
          setGeneratedEmail(result.generatedHtml || '')
          setShowPreview(true)
        }
      } else {
        // Get error details from response
        let errorMessage = 'Workflow generation failed'
        try {
          const errorData = JSON.parse(responseText)
          errorMessage = errorData.error || errorData.message || errorMessage
          console.error('Workflow error response:', errorData)
        } catch (e) {
          // If not JSON, use the text as error message (but truncate if too long)
          errorMessage = responseText.length > 200 
            ? responseText.substring(0, 200) + '...' 
            : responseText || errorMessage
          console.error('Workflow error text (truncated):', errorMessage)
        }
        throw new Error(errorMessage)
      }
    } catch (error) {
      console.error('Error generating email:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      alert(`Error generating email: ${errorMessage}`)
    } finally {
      setGenerating(false)
    }
  }


  if (showPreview && generatedEmail) {
    const isCurrentEmail = initialData?.generatedHtml === generatedEmail
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold">
                {isCurrentEmail ? 'Current Email Preview' : 'Generated Email Preview'}
              </h2>
              {isCurrentEmail ? (
                <Badge variant="outline" className="bg-gray-100 text-gray-700">
                  Current Version
                </Badge>
              ) : (
                <Badge variant="default" className="bg-green-100 text-green-700">
                  Newly Generated
                </Badge>
              )}
            </div>
            {isCurrentEmail && (
              <p className="text-sm text-gray-600 mt-1">
                This is the currently saved email. You can edit it directly or make changes below and generate a new version.
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              <X className="h-4 w-4 mr-2" />
              Back to Form
            </Button>
            {!isCurrentEmail && (
              <Button onClick={() => onSave?.({ generatedEmail })}>
                <Save className="h-4 w-4 mr-2" />
                Save Email
              </Button>
            )}
          </div>
        </div>

        {/* Mode Selection Tabs */}
        <div className="flex items-center gap-2 border-b">
          <Button
            variant={previewMode === 'preview' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setPreviewMode('preview')}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button
            variant={previewMode === 'html' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setPreviewMode('html')}
          >
            <FileText className="h-4 w-4 mr-2" />
            HTML
          </Button>
          {isCurrentEmail && (
            <Button
              variant={previewMode === 'edit' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setPreviewMode('edit')}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit HTML
            </Button>
          )}
        </div>
        
        <Card>
          <CardContent className="p-6">
            {previewMode === 'preview' && (
              <div 
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: editedHtml }}
              />
            )}
            {previewMode === 'html' && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono overflow-auto max-h-96">
                  {editedHtml}
                </pre>
              </div>
            )}
            {previewMode === 'edit' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Edit HTML</h3>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditedHtml(generatedEmail)}
                    >
                      Reset
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveEditedHtml}
                      disabled={loading}
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </div>
                <Textarea
                  value={editedHtml}
                  onChange={(e) => setEditedHtml(e.target.value)}
                  className="min-h-[400px] font-mono text-sm"
                  placeholder="Edit the HTML content here..."
                />
                <div className="text-sm text-gray-600">
                  <strong>Preview:</strong> Changes will be reflected in the Preview tab
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Create Email Idea</h2>
          <p className="text-muted-foreground">Create a new email marketing campaign</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Basic Information
              </CardTitle>
              {generatedEmail && (
                <div className="flex items-center gap-2">
                  {generationStatus === 'Generating' && (
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      Generating...
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowPreview(true)}
                    className="flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    View Current Email
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="emailIdeaName">Email Idea Name *</Label>
                <Input
                  id="emailIdeaName"
                  {...register('emailIdeaName', { required: 'Email idea name is required' })}
                  placeholder="Enter email idea name"
                />
                {errors.emailIdeaName && (
                  <p className="text-sm text-red-500 mt-1">{errors.emailIdeaName.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="emailType">Email Type *</Label>
                <Select 
                  value={watch('emailType')} 
                  onValueChange={(value) => setValue('emailType', value as 'Welcome' | 'Promotional' | 'Newsletter')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select email type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(EMAIL_TYPES).map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.emailType && (
                  <p className="text-sm text-red-500 mt-1">{errors.emailType.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Media Section Builder */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Media Sections
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Build your email structure by adding sections. Each section can include images, videos, and content.
            </p>
          </CardHeader>
          <CardContent>
            <MediaSectionBuilder
              sections={sections}
              onSectionsChange={setSections}
              clientId={clientId}
            />
          </CardContent>
        </Card>

        {/* Content Source */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Content Source
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Choose Content Source</Label>
                            <RadioGroup
                value={watch('contentSource')}
                onValueChange={(value) => setValue('contentSource', value as any)}
                className="mt-2"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="text" id="text" />
                    <Label htmlFor="text" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Text Content
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="voice" id="voice" />
                    <Label htmlFor="voice" className="flex items-center gap-2">
                      <Mic className="h-4 w-4" />
                      Voice Note
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="url" id="url" />
                    <Label htmlFor="url" className="flex items-center gap-2">
                      <Link className="h-4 w-4" />
                      URL
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {/* Content Input Based on Selection */}
            {watchedContentSource === 'text' && (
              <div>
                <Label htmlFor="emailTextIdea">Email Text Content</Label>
                <Textarea
                  id="emailTextIdea"
                  {...register('emailTextIdea')}
                  placeholder="Enter your email text content"
                  rows={6}
                />
              </div>
            )}

            {watchedContentSource === 'voice' && (
              <div>
                <Label>Voice Note</Label>
                <div className="mt-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) setValue('voiceFile', file)
                    }}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Select Voice File
                  </Button>
                  {watch('voiceFile') && (
                    <span className="ml-2 text-sm text-green-600">
                      ✓ {watch('voiceFile')?.name}
                    </span>
                  )}
                </div>
              </div>
            )}

            {watchedContentSource === 'url' && (
              <div>
                <Label htmlFor="emailUrlIdea">URL</Label>
                <Input
                  id="emailUrlIdea"
                  {...register('emailUrlIdea')}
                  placeholder="Enter URL"
                  type="url"
                />
              </div>
            )}
          </CardContent>
        </Card>


        {/* Submit Button */}
        <div className="flex justify-center">
          <Button
            type="submit"
            disabled={loading || generating}
            className="w-full max-w-md"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Creating Email Idea...
              </>
            ) : generating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Generating Email...
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Create & Generate Email
              </>
            )}
          </Button>
        </div>

        {/* Generation Status Indicator */}
        {generationStatus && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center space-x-3">
                {generationStatus === 'Generating' && (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500" />
                    <span className="text-blue-600 font-medium">
                      Email generation in progress... This may take a few minutes.
                    </span>
                  </>
                )}
                {generationStatus === 'Generated' && (
                  <>
                    <div className="rounded-full h-5 w-5 bg-green-500 flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-green-600 font-medium">
                      Email generation completed!
                    </span>
                  </>
                )}
                {generationStatus === 'Failed' && (
                  <>
                    <div className="rounded-full h-5 w-5 bg-red-500 flex items-center justify-center">
                      <span className="text-white text-xs">✗</span>
                    </div>
                    <span className="text-red-600 font-medium">
                      Email generation failed. Please try again.
                    </span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </form>

    </div>
  )
}
