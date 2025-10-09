'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Plus, X, Upload, Image as ImageIcon } from 'lucide-react'
import { EMAIL_IMAGE_POSITIONS } from '@/lib/types/content'

interface ImageSlot {
  id: string
  position: string
  file?: File
  generatedUrl?: string
}

export default function TestDynamicImagesPage() {
  const [imageSlots, setImageSlots] = useState<ImageSlot[]>([])

  const addImageSlot = () => {
    const newSlot: ImageSlot = {
      id: `image-${Date.now()}`,
      position: '',
      file: undefined,
      generatedUrl: undefined
    }
    setImageSlots([...imageSlots, newSlot])
  }

  const removeImageSlot = (id: string) => {
    setImageSlots(imageSlots.filter(slot => slot.id !== id))
  }

  const updateSlotPosition = (id: string, position: string) => {
    setImageSlots(imageSlots.map(slot => 
      slot.id === id ? { ...slot, position } : slot
    ))
  }

  const handleFileUpload = (id: string, file: File) => {
    setImageSlots(imageSlots.map(slot => 
      slot.id === id ? { ...slot, file } : slot
    ))
  }

  const handleImageGeneration = (id: string) => {
    // Simulate image generation
    const generatedUrl = `https://via.placeholder.com/400x200?text=Generated+Image+${id.slice(-4)}`
    setImageSlots(imageSlots.map(slot => 
      slot.id === id ? { ...slot, generatedUrl } : slot
    ))
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Dynamic Image Slots Test</h1>
        <p className="text-muted-foreground">
          Test the new dynamic image slot system for email templates
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Email Template Images</CardTitle>
            <Button onClick={addImageSlot} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Image
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {imageSlots.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No images added yet. Click "Add Image" to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {imageSlots.map((slot, index) => (
                <div key={slot.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <Label className="font-medium">Image {index + 1}</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeImageSlot(slot.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Position Selection */}
                  <div className="mb-4">
                    <Label htmlFor={`position-${slot.id}`}>Image Position</Label>
                    <Select
                      value={slot.position}
                      onValueChange={(value) => updateSlotPosition(slot.id, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select image position..." />
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
                  
                  {/* Image Source */}
                  <div className="space-y-2">
                    <Label>Image Source</Label>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const input = document.createElement('input')
                          input.type = 'file'
                          input.accept = 'image/*'
                          input.onchange = (e) => {
                            const files = (e.target as HTMLInputElement).files
                            if (files && files[0]) {
                              handleFileUpload(slot.id, files[0])
                            }
                          }
                          input.click()
                        }}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Image
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleImageGeneration(slot.id)}
                      >
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Generate Image
                      </Button>
                    </div>
                    
                    {/* Status Indicators */}
                    {slot.file && (
                      <div className="text-sm text-green-600">
                        ✓ File selected: {slot.file.name}
                      </div>
                    )}
                    {slot.generatedUrl && (
                      <div className="text-sm text-green-600">
                        ✓ Image generated
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Total Images:</span>
              <Badge variant="secondary">{imageSlots.length}</Badge>
            </div>
            <div className="flex justify-between">
              <span>With Position:</span>
              <Badge variant="secondary">
                {imageSlots.filter(slot => slot.position).length}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>With Files:</span>
              <Badge variant="secondary">
                {imageSlots.filter(slot => slot.file).length}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Generated:</span>
              <Badge variant="secondary">
                {imageSlots.filter(slot => slot.generatedUrl).length}
              </Badge>
            </div>
          </div>
          
          {imageSlots.length > 0 && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Image Slots Data:</h4>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(imageSlots, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
