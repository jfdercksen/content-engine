'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const EMAIL_IMAGE_POSITIONS = {
  'header': 'Header Image',
  'body1': 'Body Image 1',
  'body2': 'Body Image 2',
  'footer': 'Footer Image',
  'logo': 'Company Logo'
}

export default function TestCompleteFlow() {
  const [imageSlots, setImageSlots] = useState<Array<{
    id: string,
    position: string,
    file?: File,
    uploadedUrl?: string
  }>>([])
  const [testResult, setTestResult] = useState<any>(null)
  const [testing, setTesting] = useState(false)

  const addImageSlot = () => {
    const newSlot = {
      id: `image-${Date.now()}`,
      position: '',
      file: undefined,
      uploadedUrl: undefined
    }
    setImageSlots([...imageSlots, newSlot])
  }

  const removeImageSlot = (id: string) => {
    setImageSlots(imageSlots.filter(s => s.id !== id))
  }

  const updateSlotPosition = (id: string, position: string) => {
    const updatedSlots = imageSlots.map(s => 
      s.id === id ? { ...s, position } : s
    )
    setImageSlots(updatedSlots)
  }

  const handleFileSelect = (id: string, file: File) => {
    const updatedSlots = imageSlots.map(s => 
      s.id === id ? { ...s, file } : s
    )
    setImageSlots(updatedSlots)
  }

  const uploadImageFiles = async (slots: Array<{id: string, position: string, file?: File}>) => {
    const uploadedSlots = []
    
    for (const slot of slots) {
      if (slot.file && slot.position) {
        try {
          console.log(`Uploading file for position ${slot.position}:`, slot.file.name, slot.file.size)
          const formData = new FormData()
          formData.append('imageFile', slot.file)
          formData.append('clientId', 'modern-management')
          formData.append('position', slot.position)
          
          console.log('Sending upload request to /api/upload/image')
          const response = await fetch('/api/upload/image', {
            method: 'POST',
            body: formData
          })
          
          console.log('Upload response status:', response.status)
          if (response.ok) {
            const result = await response.json()
            console.log('Upload successful, result:', result)
            uploadedSlots.push({
              ...slot,
              uploadedUrl: result.url
            })
            console.log(`Image uploaded for position ${slot.position}:`, result.url)
          } else {
            const errorText = await response.text()
            console.error(`Failed to upload image for position ${slot.position}:`, errorText)
            uploadedSlots.push(slot)
          }
        } catch (error) {
          console.error(`Error uploading image for position ${slot.position}:`, error)
          uploadedSlots.push(slot)
        }
      } else {
        uploadedSlots.push(slot)
      }
    }
    
    return uploadedSlots
  }

  const saveImagesToBaserow = async (slots: Array<{id: string, position: string, uploadedUrl?: string}>) => {
    const imageIds = []
    
    for (const slot of slots) {
      if (slot.uploadedUrl && slot.position) {
        try {
          console.log('Creating image record in Baserow for position:', slot.position)
          
          const response = await fetch('/api/baserow/modern-management/images', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              imagePrompt: `Image for ${slot.position}`,
              imageStatus: 'Generated',
              imageType: 'Email Template',
              imageScene: slot.position,
              imageStyle: 'Professional',
              imageModel: 'Uploaded',
              imageSize: 'Standard',
              captionText: `Image for ${slot.position} position`,
              emailImages: slot.position,
              image: slot.uploadedUrl
            })
          })
          
          if (response.ok) {
            const result = await response.json()
            imageIds.push(result.id)
            console.log(`Image saved to Baserow for position ${slot.position}:`, result.id)
          } else {
            const errorText = await response.text()
            console.error(`Failed to save image to Baserow for position ${slot.position}:`, errorText)
          }
        } catch (error) {
          console.error(`Error saving image to Baserow for position ${slot.position}:`, error)
        }
      }
    }
    
    return imageIds
  }

  const testCompleteFlow = async () => {
    setTesting(true)
    try {
      console.log('Starting complete flow test...')
      console.log('Image slots before upload:', imageSlots)

      // Step 1: Upload images
      const uploadedSlots = await uploadImageFiles(imageSlots)
      console.log('Uploaded slots:', uploadedSlots)

      // Step 2: Save images to Baserow
      const imageIds = await saveImagesToBaserow(uploadedSlots)
      console.log('Image IDs from Baserow:', imageIds)

      // Step 3: Create email idea with image links
      const emailIdeaData = {
        emailIdeaName: 'Test Email with Images',
        emailType: 'Promotional Emails',
        hook: 'Test Hook',
        cta: 'Test CTA',
        emailTextIdea: 'Test content with images',
        status: 'Draft',
        templates: ['2'],
        selectedTemplateId: '2',
        selectedTemplateName: 'Promotional Emails',
        contentSource: 'text',
        useUrlAsCta: false,
        useVideoInEmail: false,
        images: imageIds // Link to the created images
      }

      console.log('Creating email idea with data:', emailIdeaData)
      
      const formData = new FormData()
      Object.entries(emailIdeaData).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          formData.append(key, JSON.stringify(value))
        } else {
          formData.append(key, value as string)
        }
      })
      formData.append('clientId', 'modern-management')

      const response = await fetch('/api/baserow/modern-management/email-ideas', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        setTestResult({
          success: true,
          emailIdea: result,
          uploadedSlots,
          imageIds,
          formDataEntries: Array.from(formData.entries())
        })
        console.log('Test completed successfully:', result)
      } else {
        const error = await response.text()
        setTestResult({
          success: false,
          error,
          uploadedSlots,
          imageIds,
          formDataEntries: Array.from(formData.entries())
        })
        console.error('Test failed:', error)
      }
    } catch (error) {
      console.error('Test error:', error)
      setTestResult({
        success: false,
        error: error,
        uploadedSlots: imageSlots
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Test Complete Image Upload and Baserow Save Flow</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Image Slots</Label>
              <p className="text-sm text-muted-foreground">
                Add images to test the complete flow
              </p>
            </div>
            <Button onClick={addImageSlot} variant="outline">
              Add Image Slot
            </Button>
          </div>

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
                    Remove
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Position</Label>
                    <Select
                      value={slot.position}
                      onValueChange={(value) => updateSlotPosition(slot.id, value)}
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

                  <div>
                    <Label>Image File</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileSelect(slot.id, e.target.files[0])
                        }
                      }}
                    />
                  </div>
                </div>

                {slot.file && (
                  <div className="mt-2 text-sm text-green-600">
                    ✓ File selected: {slot.file.name}
                  </div>
                )}
              </div>
            ))}
          </div>

          <Button 
            onClick={testCompleteFlow} 
            disabled={imageSlots.length === 0 || testing}
            className="w-full"
          >
            {testing ? 'Testing...' : 'Test Complete Flow'}
          </Button>

          {testResult && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">Test Result:</h3>
              <pre className="text-sm overflow-auto max-h-96">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
