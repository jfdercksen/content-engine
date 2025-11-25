'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  X, 
  GripVertical, 
  Image as ImageIcon, 
  Video,
  Upload,
  Eye
} from 'lucide-react'
import ImageBrowserModal from '@/components/modals/ImageBrowserModal'
import { EmailSection, EmailSectionType, EmailBodyType, EmailMediaType } from '@/lib/types/content'

interface MediaSectionBuilderProps {
  sections: EmailSection[]
  onSectionsChange: (sections: EmailSection[]) => void
  clientId: string
}

export default function MediaSectionBuilder({
  sections,
  onSectionsChange,
  clientId
}: MediaSectionBuilderProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [showImageBrowser, setShowImageBrowser] = useState(false)
  const [browsingForSection, setBrowsingForSection] = useState<string | null>(null)

  const addSection = (type: EmailSectionType) => {
    const newSection: EmailSection = {
      id: `section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      order: sections.length,
      media: {
        type: null,
        url: null,
        imageId: null,
        altText: null
      },
      // Default values based on type
      ...(type === 'header' && { hook: '', ctaButton: null }),
      ...(type === 'body' && { 
        bodyType: 'text', 
        bodyText: null,
        productName: null,
        productDescription: null,
        productCtaButton: null
      }),
      ...(type === 'cta' && { ctaUrl: '', ctaButtonName: '', ctaDescription: '' })
    }
    onSectionsChange([...sections, newSection])
  }

  const removeSection = (id: string) => {
    const updated = sections.filter(s => s.id !== id)
      .map((s, index) => ({ ...s, order: index }))
    onSectionsChange(updated)
  }

  const updateSection = (id: string, updates: Partial<EmailSection>) => {
    onSectionsChange(sections.map(s => s.id === id ? { ...s, ...updates } : s))
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null) return

    if (draggedIndex !== index) {
      const newSections = [...sections]
      const draggedSection = newSections[draggedIndex]
      newSections.splice(draggedIndex, 1)
      newSections.splice(index, 0, draggedSection)
      
      // Update order values
      const reordered = newSections.map((s, idx) => ({ ...s, order: idx }))
      onSectionsChange(reordered)
      setDraggedIndex(index)
    }
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  const handleBrowseImages = (sectionId: string) => {
    setBrowsingForSection(sectionId)
    setShowImageBrowser(true)
  }

  const handleSelectImageFromBrowser = (image: any) => {
    if (browsingForSection) {
      updateSection(browsingForSection, {
        media: {
          type: 'image',
          url: image.imageLinkUrl || image.url || '',
          imageId: image.id,
          altText: image.captionText || image.imagePrompt || ''
        }
      })
    }
    setShowImageBrowser(false)
    setBrowsingForSection(null)
  }

  const getSectionTypeLabel = (type: EmailSectionType) => {
    switch (type) {
      case 'header': return 'Header'
      case 'body': return 'Body'
      case 'cta': return 'CTA'
      default: return type
    }
  }

  const getSectionTypeColor = (type: EmailSectionType) => {
    switch (type) {
      case 'header': return 'bg-blue-100 text-blue-800'
      case 'body': return 'bg-green-100 text-green-800'
      case 'cta': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-4">
      {/* Sections List */}
      {sections.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            <p>No sections added yet. Click the buttons below to add sections.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sections.sort((a, b) => a.order - b.order).map((section, index) => (
            <Card
              key={section.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className="cursor-move hover:shadow-md transition-shadow"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-5 w-5 text-gray-400" />
                    <Badge className={getSectionTypeColor(section.type)}>
                      {getSectionTypeLabel(section.type)}
                    </Badge>
                    <span className="text-sm text-gray-500">Section {index + 1}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSection(section.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Header Section Fields */}
                {section.type === 'header' && (
                  <>
                    <div>
                      <Label htmlFor={`hook-${section.id}`}>
                        Hook <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        id={`hook-${section.id}`}
                        value={section.hook || ''}
                        onChange={(e) => updateSection(section.id, { hook: e.target.value })}
                        placeholder="Enter email hook"
                        rows={3}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor={`header-cta-${section.id}`}>CTA Button (Optional)</Label>
                      <Input
                        id={`header-cta-${section.id}`}
                        value={section.ctaButton || ''}
                        onChange={(e) => updateSection(section.id, { ctaButton: e.target.value || null })}
                        placeholder="Enter CTA button text"
                      />
                    </div>
                  </>
                )}

                {/* Body Section Fields */}
                {section.type === 'body' && (
                  <>
                    <div>
                      <Label htmlFor={`body-type-${section.id}`}>Body Type</Label>
                      <Select
                        value={section.bodyType || 'text'}
                        onValueChange={(value) => updateSection(section.id, { 
                          bodyType: value as EmailBodyType,
                          // Reset fields when switching type
                          bodyText: value === 'text' ? section.bodyText : null,
                          productName: value === 'product' ? section.productName : null,
                          productDescription: value === 'product' ? section.productDescription : null,
                          productCtaButton: value === 'product' ? section.productCtaButton : null
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="product">Product/Service</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {section.bodyType === 'text' && (
                      <div>
                        <Label htmlFor={`body-text-${section.id}`}>Body Text (Guidance for AI)</Label>
                        <Textarea
                          id={`body-text-${section.id}`}
                          value={section.bodyText || ''}
                          onChange={(e) => updateSection(section.id, { bodyText: e.target.value || null })}
                          placeholder="Enter body text guidance for AI"
                          rows={4}
                        />
                      </div>
                    )}

                    {section.bodyType === 'product' && (
                      <>
                        <div>
                          <Label htmlFor={`product-name-${section.id}`}>
                            Product/Service Name <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id={`product-name-${section.id}`}
                            value={section.productName || ''}
                            onChange={(e) => updateSection(section.id, { productName: e.target.value || null })}
                            placeholder="Enter product/service name"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor={`product-description-${section.id}`}>Description (Optional)</Label>
                          <Textarea
                            id={`product-description-${section.id}`}
                            value={section.productDescription || ''}
                            onChange={(e) => updateSection(section.id, { productDescription: e.target.value || null })}
                            placeholder="Enter product/service description"
                            rows={3}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`product-cta-${section.id}`}>CTA Button (Optional)</Label>
                          <Input
                            id={`product-cta-${section.id}`}
                            value={section.productCtaButton || ''}
                            onChange={(e) => updateSection(section.id, { productCtaButton: e.target.value || null })}
                            placeholder="Enter CTA button text"
                          />
                        </div>
                      </>
                    )}
                  </>
                )}

                {/* CTA Section Fields */}
                {section.type === 'cta' && (
                  <>
                    <div>
                      <Label htmlFor={`cta-url-${section.id}`}>
                        CTA URL <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id={`cta-url-${section.id}`}
                        type="url"
                        value={section.ctaUrl || ''}
                        onChange={(e) => updateSection(section.id, { ctaUrl: e.target.value })}
                        placeholder="https://example.com"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor={`cta-button-name-${section.id}`}>
                        Button Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id={`cta-button-name-${section.id}`}
                        value={section.ctaButtonName || ''}
                        onChange={(e) => updateSection(section.id, { ctaButtonName: e.target.value })}
                        placeholder="Enter button text"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor={`cta-description-${section.id}`}>
                        Description <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        id={`cta-description-${section.id}`}
                        value={section.ctaDescription || ''}
                        onChange={(e) => updateSection(section.id, { ctaDescription: e.target.value })}
                        placeholder="Enter CTA description"
                        rows={3}
                        required
                      />
                    </div>
                  </>
                )}

                {/* Media Section (Common for all section types) */}
                <div className="pt-4 border-t">
                  <Label className="mb-2 block">Media (Optional)</Label>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Select
                        value={section.media.type || ''}
                        onValueChange={(value) => updateSection(section.id, {
                          media: {
                            ...section.media,
                            type: value === 'none' ? null : (value as EmailMediaType),
                            // Clear media if changing type
                            url: value === 'none' ? null : section.media.url,
                            imageId: value === 'none' ? null : section.media.imageId
                          }
                        })}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select media type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="image">Image</SelectItem>
                          <SelectItem value="video">Video</SelectItem>
                        </SelectContent>
                      </Select>
                      {section.media.type === 'image' && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleBrowseImages(section.id)}
                        >
                          <ImageIcon className="h-4 w-4 mr-2" />
                          Browse
                        </Button>
                      )}
                    </div>

                    {section.media.type && (
                      <>
                        <div>
                          <Label htmlFor={`media-url-${section.id}`}>
                            {section.media.type === 'image' ? 'Image' : 'Video'} URL
                          </Label>
                          <Input
                            id={`media-url-${section.id}`}
                            type="url"
                            value={section.media.url || ''}
                            onChange={(e) => updateSection(section.id, {
                              media: { ...section.media, url: e.target.value || null, imageId: null }
                            })}
                            placeholder={`Enter ${section.media.type} URL`}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`media-alt-${section.id}`}>Alt Text (Optional)</Label>
                          <Input
                            id={`media-alt-${section.id}`}
                            value={section.media.altText || ''}
                            onChange={(e) => updateSection(section.id, {
                              media: { ...section.media, altText: e.target.value || null }
                            })}
                            placeholder="Enter alt text"
                          />
                        </div>
                        {section.media.url && (
                          <div className="p-2 bg-gray-50 rounded border">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              {section.media.type === 'image' ? (
                                <ImageIcon className="h-4 w-4" />
                              ) : (
                                <Video className="h-4 w-4" />
                              )}
                              <span className="truncate">{section.media.url}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => updateSection(section.id, {
                                  media: { ...section.media, url: null, imageId: null }
                                })}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                        {section.media.imageId && (
                          <div className="p-2 bg-blue-50 rounded border border-blue-200">
                            <div className="flex items-center justify-between text-sm text-blue-700">
                              <div className="flex items-center gap-2">
                                <ImageIcon className="h-4 w-4" />
                                <span>Selected from database</span>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => updateSection(section.id, {
                                  media: { ...section.media, imageId: null, url: null }
                                })}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Section Buttons - At the bottom for easy access */}
      <div className="flex flex-wrap gap-2 pt-2 border-t">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => addSection('header')}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Header
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => addSection('body')}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Body
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => addSection('cta')}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add CTA
        </Button>
      </div>

      {/* Image Browser Modal */}
      <ImageBrowserModal
        isOpen={showImageBrowser}
        onClose={() => {
          setShowImageBrowser(false)
          setBrowsingForSection(null)
        }}
        onSelectImage={handleSelectImageFromBrowser}
        clientId={clientId}
      />
    </div>
  )
}

