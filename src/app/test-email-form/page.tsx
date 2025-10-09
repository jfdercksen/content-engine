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

export default function TestEmailForm() {
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
          const formData = new FormData()
          formData.append('imageFile', slot.file)
          formData.append('clientId', 'modern-management')
          formData.append('position', slot.position)
          
          const response = await fetch('/api/upload/image', {
            method: 'POST',
            body: formData
          })
          
          if (response.ok) {
            const result = await response.json()
            uploadedSlots.push({
              ...slot,
              uploadedUrl: result.url
            })
            console.log(`Image uploaded for position ${slot.position}:`, result.url)
          } else {
            console.error(`Failed to upload image for position ${slot.position}`)
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

  const testCompleteFlow = async () => {
    setTesting(true)
    try {
      console.log('Starting complete flow test...')
      console.log('Image slots before upload:', imageSlots)

      // Upload images
      const uploadedSlots = await uploadImageFiles(imageSlots)
      console.log('Uploaded slots:', uploadedSlots)

      // Create test form data
      const formData = new FormData()
      formData.append('emailIdeaName', 'Test Email with Images')
      formData.append('emailType', 'Promotional Emails')
      formData.append('hook', 'Test Hook')
      formData.append('cta', 'Test CTA')
      formData.append('emailTextIdea', 'Test content')
      formData.append('status', 'Draft')
      formData.append('templates', JSON.stringify(['2']))
      formData.append('selectedTemplateId', '2')
      formData.append('selectedTemplateName', 'Promotional Emails')
      formData.append('contentSource', 'text')
      formData.append('useUrlAsCta', 'false')
      formData.append('useVideoInEmail', 'false')
      formData.append('clientId', 'modern-management')
      formData.append('recordId', '999') // Test record ID

      // Add image slots data
      formData.append('imageSlotsCount', uploadedSlots.length.toString())
      uploadedSlots.forEach((slot, index) => {
        if (slot.position) {
          formData.append(`imageSlot_${index}_position`, slot.position)
          if (slot.uploadedUrl) {
            formData.append(`imageSlot_${index}_uploadedUrl`, slot.uploadedUrl)
          }
          if (slot.file?.name) {
            formData.append(`imageSlot_${index}_fileName`, slot.file.name)
          }
        }
      })

      // Send to webhook
      const response = await fetch('/api/webhooks/n8n/email-idea-generation', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        setTestResult({
          success: true,
          result,
          uploadedSlots,
          formDataEntries: Array.from(formData.entries())
        })
        console.log('Test completed successfully:', result)
      } else {
        const error = await response.text()
        setTestResult({
          success: false,
          error,
          uploadedSlots,
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
          <CardTitle>Test Email Form with Images</CardTitle>
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
