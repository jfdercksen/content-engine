'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { X, Plus, Save } from 'lucide-react'

interface TemplateImageConfigFormProps {
  clientId: string
  onSave?: () => void
  onCancel?: () => void
}

interface Template {
  id: number
  templateId: number
  templateName: string
  templateCategory: string
}

interface ImageConfig {
  templateId: number
  imageSlots: string[]
  description?: string
}

export default function TemplateImageConfigForm({ 
  clientId, 
  onSave, 
  onCancel 
}: TemplateImageConfigFormProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null)
  const [imageSlots, setImageSlots] = useState<string[]>(['Header', 'Body 1', 'CTA', 'Footer'])
  const [description, setDescription] = useState<string>('')
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchTemplates()
    fetchAvailableSlots()
  }, [])

  const fetchTemplates = async () => {
    try {
      const response = await fetch(`/api/baserow/${clientId}/templates`)
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.results || [])
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    }
  }

  const fetchAvailableSlots = async () => {
    try {
      const response = await fetch('/api/template-image-config?action=slots')
      if (response.ok) {
        const data = await response.json()
        setAvailableSlots(data.availableSlots || [])
      }
    } catch (error) {
      console.error('Error fetching available slots:', error)
    }
  }

  const handleTemplateSelect = async (templateId: number) => {
    setSelectedTemplate(templateId)
    
    try {
      const response = await fetch(`/api/template-image-config?templateId=${templateId}`)
      if (response.ok) {
        const data = await response.json()
        setImageSlots(data.config.imageSlots || ['Header', 'Body 1', 'CTA', 'Footer'])
        setDescription(data.config.description || '')
      }
    } catch (error) {
      console.error('Error fetching template config:', error)
      setImageSlots(['Header', 'Body 1', 'CTA', 'Footer'])
      setDescription('')
    }
  }

  const addImageSlot = () => {
    setImageSlots([...imageSlots, ''])
  }

  const removeImageSlot = (index: number) => {
    setImageSlots(imageSlots.filter((_, i) => i !== index))
  }

  const updateImageSlot = (index: number, value: string) => {
    const newSlots = [...imageSlots]
    newSlots[index] = value
    setImageSlots(newSlots)
  }

  const handleSave = async () => {
    if (!selectedTemplate) return

    setLoading(true)
    try {
      const config: ImageConfig = {
        templateId: selectedTemplate,
        imageSlots: imageSlots.filter(slot => slot.trim() !== ''),
        description: description.trim() || undefined
      }

      const response = await fetch('/api/template-image-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })

      if (response.ok) {
        onSave?.()
      } else {
        console.error('Failed to save template image configuration')
      }
    } catch (error) {
      console.error('Error saving template image configuration:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Template Image Configuration</h2>
          <p className="text-muted-foreground">
            Configure how many image slots each template needs
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading || !selectedTemplate}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : 'Save Configuration'}
          </Button>
        </div>
      </div>

      {/* Template Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Template</CardTitle>
        </CardHeader>
        <CardContent>
          <Select onValueChange={(value) => handleTemplateSelect(Number(value))}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a template to configure" />
            </SelectTrigger>
            <SelectContent>
              {templates.map((template) => (
                <SelectItem key={template.id} value={template.templateId.toString()}>
                  {template.templateName} ({template.templateCategory})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Image Slots Configuration */}
      {selectedTemplate && (
        <Card>
          <CardHeader>
            <CardTitle>Image Slots Configuration</CardTitle>
            <p className="text-sm text-muted-foreground">
              Define which image slots this template requires
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Description */}
            <div>
              <Label htmlFor="description">Configuration Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Standard 4-image template with header, body, CTA, and footer images"
              />
            </div>

            {/* Image Slots */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Image Slots</Label>
                <Button type="button" variant="outline" size="sm" onClick={addImageSlot}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Slot
                </Button>
              </div>
              
              <div className="space-y-2">
                {imageSlots.map((slot, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Select 
                      value={slot} 
                      onValueChange={(value) => updateImageSlot(index, value)}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select image slot type" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableSlots.map((availableSlot) => (
                          <SelectItem key={availableSlot} value={availableSlot}>
                            {availableSlot}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeImageSlot(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold mb-2">Configuration Preview</h4>
              <div className="flex flex-wrap gap-2">
                {imageSlots.filter(slot => slot.trim() !== '').map((slot, index) => (
                  <Badge key={index} variant="secondary">
                    {slot}
                  </Badge>
                ))}
              </div>
              {description && (
                <p className="text-sm text-gray-600 mt-2">{description}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
