'use client'

import { useState } from 'react'
import TemplateImageConfigForm from '@/components/forms/TemplateImageConfigForm'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Settings, Eye } from 'lucide-react'

export default function TestTemplateConfigPage() {
  const [showConfigForm, setShowConfigForm] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null)
  const [templateConfig, setTemplateConfig] = useState<any>(null)

  const testTemplateConfig = async (templateId: number) => {
    try {
      const response = await fetch(`/api/template-image-config?templateId=${templateId}`)
      if (response.ok) {
        const data = await response.json()
        setTemplateConfig(data.config)
        setSelectedTemplateId(templateId)
      }
    } catch (error) {
      console.error('Error testing template config:', error)
    }
  }

  const handleConfigSave = () => {
    setShowConfigForm(false)
    // Refresh the test if we have a selected template
    if (selectedTemplateId) {
      testTemplateConfig(selectedTemplateId)
    }
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Template Image Configuration Test</h1>
        <p className="text-muted-foreground mb-8">
          This page demonstrates the new simple template image configuration system.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        <Button onClick={() => setShowConfigForm(true)}>
          <Settings className="h-4 w-4 mr-2" />
          Configure Template Images
        </Button>
        <Button variant="outline" onClick={() => testTemplateConfig(1)}>
          <Eye className="h-4 w-4 mr-2" />
          Test Template 1
        </Button>
        <Button variant="outline" onClick={() => testTemplateConfig(2)}>
          <Eye className="h-4 w-4 mr-2" />
          Test Template 2
        </Button>
        <Button variant="outline" onClick={() => testTemplateConfig(3)}>
          <Eye className="h-4 w-4 mr-2" />
          Test Template 3
        </Button>
      </div>

      {/* Configuration Form */}
      {showConfigForm && (
        <div className="border rounded-lg p-4 bg-gray-50">
          <TemplateImageConfigForm
            clientId="client1"
            onSave={handleConfigSave}
            onCancel={() => setShowConfigForm(false)}
          />
        </div>
      )}

      {/* Test Results */}
      {templateConfig && (
        <Card>
          <CardHeader>
            <CardTitle>Template Configuration Test Results</CardTitle>
            <p className="text-sm text-muted-foreground">
              Template ID: {selectedTemplateId}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Image Slots Required:</h4>
              <div className="flex flex-wrap gap-2">
                {templateConfig.imageSlots.map((slot: string, index: number) => (
                  <Badge key={index} variant="secondary">
                    {slot}
                  </Badge>
                ))}
              </div>
            </div>
            
            {templateConfig.description && (
              <div>
                <h4 className="font-semibold mb-2">Description:</h4>
                <p className="text-sm text-gray-600">{templateConfig.description}</p>
              </div>
            )}

            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">How This Works:</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Each template has a predefined set of image slots</li>
                <li>• When creating an email idea, the system knows exactly how many images are needed</li>
                <li>• No complex HTML parsing or placeholder detection required</li>
                <li>• Easy to configure and maintain</li>
                <li>• Reliable and predictable results</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Benefits Section */}
      <Card>
        <CardHeader>
          <CardTitle>Why This Approach is Better</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-red-600 mb-2">❌ Old Complex Approach:</h4>
              <ul className="text-sm space-y-1">
                <li>• Complex regex patterns to detect placeholders</li>
                <li>• Unreliable HTML parsing</li>
                <li>• Missed placeholders due to different formats</li>
                <li>• Hard to maintain and debug</li>
                <li>• Template HTML must follow strict conventions</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-green-600 mb-2">✅ New Simple Approach:</h4>
              <ul className="text-sm space-y-1">
                <li>• Manual configuration per template</li>
                <li>• 100% reliable - no guessing</li>
                <li>• Easy to understand and maintain</li>
                <li>• Works with any HTML template format</li>
                <li>• Clear documentation of what each template needs</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use This System</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">1. Configure Templates:</h4>
              <p className="text-sm text-gray-600">
                Use the "Configure Template Images" button to set up which image slots each template needs.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">2. Create Email Ideas:</h4>
              <p className="text-sm text-gray-600">
                When creating an email idea, the system will automatically show the correct number of image upload slots based on the selected template.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">3. Upload Images:</h4>
              <p className="text-sm text-gray-600">
                Users can upload or generate images for each required slot, knowing exactly what's needed.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
