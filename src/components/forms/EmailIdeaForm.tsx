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
import { EMAIL_TYPES, EMAIL_STATUS, EMAIL_IMAGE_POSITIONS, TEMPLATE_IMAGE_CONFIGS } from '@/lib/types/content'
import ImageBrowserModal from '@/components/modals/ImageBrowserModal'

interface EmailIdeaFormProps {
  clientId: string
  initialData?: any
  onSave?: (data: any) => void
  onCancel?: () => void
}

interface EmailIdeaFormData {
  emailIdeaName: string
  emailType: string
  hook: string
  cta: string
  contentSource: 'text' | 'voice' | 'url'
  emailTextIdea: string
  emailUrlIdea: string
  voiceFile?: File
  status: string
  templateId?: string
}

interface ImageSlot {
  id: string
  position: string
  file?: File
  uploadedImageId?: string
  uploadedUrl?: string
  isUploading: boolean
}

export default function EmailIdeaForm({ 
  clientId, 
  initialData, 
  onSave, 
  onCancel 
}: EmailIdeaFormProps) {
  const [templates, setTemplates] = useState<any[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [imageSlots, setImageSlots] = useState<ImageSlot[]>([])
  const [generatedEmail, setGeneratedEmail] = useState<string>(initialData?.generatedHtml || '')
  const [showPreview, setShowPreview] = useState(false)
  const [previewMode, setPreviewMode] = useState<'preview' | 'html' | 'edit'>('preview')
  const [editedHtml, setEditedHtml] = useState<string>(initialData?.generatedHtml || '')
  const [showImageBrowser, setShowImageBrowser] = useState(false)
  const [browsingForSlot, setBrowsingForSlot] = useState<string | null>(null)
  const [pollingRecordId, setPollingRecordId] = useState<string | null>(null)
  const [generationStatus, setGenerationStatus] = useState<string>('')
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<EmailIdeaFormData>({
    defaultValues: {
      emailIdeaName: initialData?.emailIdeaName || '',
      emailType: initialData?.emailType || '',
      hook: initialData?.hook || '',
      cta: initialData?.cta || '',
      contentSource: initialData?.emailTextIdea ? 'text' : initialData?.emailUrlIdea ? 'url' : 'text',
      emailTextIdea: initialData?.emailTextIdea || '',
      emailUrlIdea: initialData?.emailUrlIdea || '',
      status: initialData?.status || 'Draft',
      templateId: initialData?.templates?.[0] || ''
    }
  })

  const watchedContentSource = watch('contentSource')

  // Fetch templates on component mount
  useEffect(() => {
    fetchTemplates()
  }, [])

  // Set selected template when templates are loaded and we have initial data
  useEffect(() => {
    if (templates.length > 0 && initialData?.templates?.[0] && !selectedTemplate) {
      const templateId = initialData.templates[0]
      const template = templates.find(t => t.templateId.toString() === templateId.toString())
      if (template) {
        setSelectedTemplate(template)
        setValue('templateId', templateId)
        
        // Create image slots based on template configuration
        const templateConfig = TEMPLATE_IMAGE_CONFIGS.find(config => config.templateId.toString() === templateId.toString())
        if (templateConfig) {
          const slots: ImageSlot[] = templateConfig.imageSlots.map((position, index) => ({
            id: `slot-${index}`,
            position: position,
            isUploading: false,
            // If we have existing images, try to match them to slots
            uploadedImageId: initialData?.images?.[index] || undefined
          }))
          setImageSlots(slots)
        }
      }
    }
  }, [templates, initialData, selectedTemplate, setValue])

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

  const fetchTemplates = async () => {
    try {
      const response = await fetch(`/api/baserow/${clientId}/templates`)
      if (response.ok) {
        const data = await response.json()
        console.log('Fetched templates:', data.results)
        setTemplates(data.results || [])
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    }
  }

  // Handle template selection
  const handleTemplateSelect = (templateId: string) => {
    console.log('handleTemplateSelect called with:', templateId)
    console.log('Available templates:', templates)
    
    const template = templates.find(t => t.templateId.toString() === templateId)
    console.log('Template selected:', { templateId, template, allTemplates: templates })
    
    setSelectedTemplate(template || null)
    setValue('templateId', templateId)
    
    // Create image slots based on template configuration
    const templateConfig = TEMPLATE_IMAGE_CONFIGS.find(config => config.templateId.toString() === templateId)
    if (templateConfig) {
      const newImageSlots: ImageSlot[] = templateConfig.imageSlots.map((position, index) => ({
        id: `template-${templateId}-${position.toLowerCase().replace(/\s+/g, '-')}`,
        position: position,
        isUploading: false
      }))
      setImageSlots(newImageSlots)
      console.log('Created image slots for template:', templateConfig.templateId, newImageSlots)
    } else {
      // Clear existing image slots if no template config found
      setImageSlots([])
      console.log('No template config found for template ID:', templateId)
    }
  }

  // Add new image slot
  const addImageSlot = () => {
    const newSlot: ImageSlot = {
      id: `image-${Date.now()}`,
      position: '',
      isUploading: false
    }
    setImageSlots([...imageSlots, newSlot])
  }

  // Remove image slot
  const removeImageSlot = (id: string) => {
    setImageSlots(imageSlots.filter(slot => slot.id !== id))
  }

  // Handle file selection for image slot
  const handleImageFileSelect = (slotId: string, file: File) => {
    setImageSlots(prev => prev.map(slot => 
      slot.id === slotId ? { ...slot, file } : slot
    ))
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

  const handleBrowseImages = (slotId: string) => {
    setBrowsingForSlot(slotId)
    setShowImageBrowser(true)
  }

  const handleSelectImageFromBrowser = (image: any) => {
    if (browsingForSlot) {
      setImageSlots(prev => prev.map(slot => 
        slot.id === browsingForSlot 
          ? { 
              ...slot, 
              uploadedImageId: image.id,
              uploadedUrl: image.imageLinkUrl,
              file: undefined // Clear any uploaded file
            } 
          : slot
      ))
    }
    setShowImageBrowser(false)
    setBrowsingForSlot(null)
  }

  // Upload image to Baserow
  const uploadImageToBaserow = async (slot: ImageSlot): Promise<{ id: string, url: string } | null> => {
    if (!slot.file || !slot.position) return null

    try {
      setImageSlots(prev => prev.map(s => 
        s.id === slot.id ? { ...s, isUploading: true } : s
      ))

      const formData = new FormData()
      formData.append('imageFile', slot.file)
      formData.append('position', slot.position)
      formData.append('clientId', clientId)

      const response = await fetch(`/api/baserow/${clientId}/images`, {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        return { id: result.id, url: result.url }
      } else {
        throw new Error('Upload failed')
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      return null
    } finally {
      setImageSlots(prev => prev.map(s => 
        s.id === slot.id ? { ...s, isUploading: false } : s
      ))
    }
  }

  // Handle form submission
  const onSubmit = async (data: EmailIdeaFormData) => {
    try {
      setLoading(true)

      // First, upload all images and collect selected images
      const uploadedImages = []
      const selectedImages = []
      
      for (const slot of imageSlots) {
        if (slot.file && slot.position) {
          // Upload new file
          const result = await uploadImageToBaserow(slot)
          if (result) {
            uploadedImages.push({
              position: slot.position,
              imageId: result.id,
              url: result.url
            })
          }
        } else if (slot.uploadedImageId && slot.position) {
          // Use existing image from database
          selectedImages.push({
            position: slot.position,
            imageId: slot.uploadedImageId,
            url: slot.uploadedUrl
          })
        }
      }
      
      // Combine uploaded and selected images
      const allImages = [...uploadedImages, ...selectedImages]

      // Create email idea in Baserow
      // Map form field names to API field names
      const emailIdeaData = {
        emailideaname: data.emailIdeaName,
        emailtype: data.emailType,
        hook: data.hook,
        cta: data.cta,
        emailtextidea: data.emailTextIdea,
        emailurlidea: data.emailUrlIdea,
        emailvideoidea: data.emailVideoIdea,
        emailimageidea: data.emailImageIdea,
        status: data.status,
        templates: selectedTemplate?.templateId ? [selectedTemplate.templateId] : [],
        images: allImages.map(img => img.imageId)
      }

      console.log('Sending email idea data to API:', emailIdeaData)
      console.log('Selected template state:', selectedTemplate)

      const response = await fetch(`/api/baserow/${clientId}/email-ideas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailIdeaData)
      })

      if (response.ok) {
        const result = await response.json()
        
        // Send to n8n workflow for email generation
        await generateEmailWithWorkflow(result.id, emailIdeaData, allImages)
        
        onSave?.(result)
      } else {
        // Get detailed error information from the response
        const errorData = await response.json().catch(() => ({}))
        console.error('API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        })
        
        const errorMessage = errorData.error || errorData.details || 'Failed to create email idea'
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
  const generateEmailWithWorkflow = async (emailIdeaId: string, data: any, images: any[]) => {
    try {
      setGenerating(true)

      // Get the template data that was actually used in the form submission
      const templateId = selectedTemplate?.templateId
      const templateName = selectedTemplate?.templateName
      const templatesArray = templateId ? [templateId] : []

      console.log('Template data for webhook:', { templateId, templateName, templatesArray })

      const workflowData = new FormData()
      workflowData.append('emailIdeaId', emailIdeaId)
      workflowData.append('clientId', clientId)
      workflowData.append('emailIdeaName', data.emailIdeaName)
      workflowData.append('emailType', data.emailType)
      workflowData.append('hook', data.hook)
      workflowData.append('cta', data.cta)
      workflowData.append('contentSource', data.contentSource || 'text')
      workflowData.append('emailTextIdea', data.emailTextIdea || '')
      workflowData.append('emailUrlIdea', data.emailUrlIdea || '')
      workflowData.append('templateId', templateId?.toString() || '')
      workflowData.append('selectedTemplateName', templateName || '')
      workflowData.append('templates', JSON.stringify(templatesArray))
      workflowData.append('status', data.status || 'Draft')
      
      // Add image data
      workflowData.append('imageCount', images.length.toString())
      images.forEach((img, index) => {
        workflowData.append(`image_${index}_position`, img.position)
        workflowData.append(`image_${index}_id`, img.imageId)
        workflowData.append(`image_${index}_url`, img.url)
      })

      const response = await fetch('/api/webhooks/n8n/email-idea-generation', {
        method: 'POST',
        body: workflowData
      })

      if (response.ok) {
        const result = await response.json()
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
        throw new Error('Workflow generation failed')
      }
    } catch (error) {
      console.error('Error generating email:', error)
      alert('Email generated but there was an issue with the workflow.')
    } finally {
      setGenerating(false)
    }
  }

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.currentTarget.classList.add('border-blue-500', 'bg-blue-50')
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50')
  }

  const handleDrop = (e: React.DragEvent, slotId: string) => {
    e.preventDefault()
    e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50')
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0 && files[0].type.startsWith('image/')) {
      handleImageFileSelect(slotId, files[0])
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
                  onValueChange={(value) => setValue('emailType', value)}
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
            
            <div>
              <Label htmlFor="hook">Hook *</Label>
              <Textarea
                id="hook"
                {...register('hook', { required: 'Hook is required' })}
                placeholder="Enter your email hook"
                rows={3}
              />
              {errors.hook && (
                <p className="text-sm text-red-500 mt-1">{errors.hook.message}</p>
                )}
            </div>
            
            <div>
              <Label htmlFor="cta">Call to Action (CTA) *</Label>
              <Textarea
                id="cta"
                {...register('cta', { required: 'CTA is required' })}
                placeholder="Enter your call to action"
                rows={3}
              />
              {errors.cta && (
                <p className="text-sm text-red-500 mt-1">{errors.cta.message}</p>
                )}
            </div>
          </CardContent>
        </Card>

        {/* Template Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Email Template
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Select Template</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                {templates.map((template) => (
                  <div
                    key={template.id}
                                         className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                       selectedTemplate?.templateId?.toString() === template.templateId?.toString()
                         ? 'border-blue-500 bg-blue-50'
                         : 'border-gray-200 hover:border-gray-300'
                     }`}
                                         onClick={() => {
                       console.log('Template clicked:', template)
                       console.log('Template ID field:', template.templateId)
                       console.log('Template ID type:', typeof template.templateId)
                       console.log('Full template object:', template)
                       handleTemplateSelect(template.templateId.toString())
                     }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{template.templateName}</h3>
                                             {selectedTemplate?.templateId?.toString() === template.templateId?.toString() && (
                         <Badge className="bg-blue-500 text-white">Selected</Badge>
                       )}
                    </div>
                    <p className="text-sm text-gray-600">{template.templateCategory}</p>
                  </div>
                ))}
              </div>
            </div>
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

        {/* Image Management */}
        {selectedTemplate && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Template Images
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {imageSlots.length > 0 && imageSlots[0].id.startsWith('template-') 
                  ? `Required images for "${selectedTemplate?.templateName}" template. Upload images or remove slots you don't need.`
                  : 'Add images for your email template. Drag & drop or click to select.'
                }
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                type="button"
                variant="outline"
                onClick={addImageSlot}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Image Slot
              </Button>
              
              <div className="space-y-4">
                {imageSlots.map((slot) => (
                  <div key={slot.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex-1">
                        <Label>Image Position</Label>
                        <Select
                          value={slot.position}
                          onValueChange={(value) => {
                            setImageSlots(prev => prev.map(s => 
                              s.id === slot.id ? { ...s, position: value } : s
                            ))
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select position..." />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(EMAIL_IMAGE_POSITIONS).map(([key, value]) => (
                              <SelectItem key={key} value={value}>
                                {value}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeImageSlot(slot.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {slot.position && (
                      <div
                        ref={dropZoneRef}
                        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                          slot.file ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-gray-400'
                        }`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, slot.id)}
                      >
                        {slot.file ? (
                          <div className="space-y-2">
                            <div className="text-green-600 font-medium">
                              ✓ {slot.file.name}
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const input = document.createElement('input')
                                input.type = 'file'
                                input.accept = 'image/*'
                                input.onchange = (e) => {
                                  const file = (e.target as HTMLInputElement).files?.[0]
                                  if (file) handleImageFileSelect(slot.id, file)
                                }
                                input.click()
                              }}
                            >
                              Change Image
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Upload className="h-8 w-8 mx-auto text-gray-400" />
                            <div className="text-sm text-gray-600">
                              Drag & drop an image here, or{' '}
                              <button
                                type="button"
                                className="text-blue-600 hover:text-blue-800 underline"
                                onClick={() => {
                                  const input = document.createElement('input')
                                  input.type = 'file'
                                  input.accept = 'image/*'
                                  input.onchange = (e) => {
                                    const file = (e.target as HTMLInputElement).files?.[0]
                                    if (file) handleImageFileSelect(slot.id, file)
                                  }
                                  input.click()
                                }}
                              >
                                click to select
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Browse Images Button */}
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Or select from existing images:</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleBrowseImages(slot.id)}
                        >
                          <ImageIcon className="h-4 w-4 mr-2" />
                          Browse Images
                        </Button>
                      </div>
                      {slot.uploadedImageId && (
                        <div className="mt-2 p-2 bg-blue-50 rounded border">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-blue-700">
                              ✓ Selected from database
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setImageSlots(prev => prev.map(s => 
                                  s.id === slot.id 
                                    ? { ...s, uploadedImageId: undefined, uploadedUrl: undefined }
                                    : s
                                ))
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

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

      {/* Image Browser Modal */}
      <ImageBrowserModal
        isOpen={showImageBrowser}
        onClose={() => {
          setShowImageBrowser(false)
          setBrowsingForSlot(null)
        }}
        onSelectImage={handleSelectImageFromBrowser}
        clientId={clientId}
        selectedPosition={browsingForSlot ? imageSlots.find(s => s.id === browsingForSlot)?.position : undefined}
      />
    </div>
  )
}
