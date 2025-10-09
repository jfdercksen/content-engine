'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Search, RefreshCw, Eye } from 'lucide-react'

interface TemplateAnalysis {
  templateId: number
  templateName: string
  imagePositions: string[]
  count: number
  sampleHtml: string
}

interface AnalysisResult {
  templates: TemplateAnalysis[]
  allUniquePositions: string[]
  totalTemplates: number
  totalUniquePositions: number
}

export default function TestTemplatePositionsPage() {
  const [clientId, setClientId] = useState('modern-management')
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const analyzeTemplates = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/template-image-positions?clientId=${clientId}`)
      if (response.ok) {
        const data = await response.json()
        setAnalysis(data)
      } else {
        console.error('Failed to analyze templates')
      }
    } catch (error) {
      console.error('Error analyzing templates:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (clientId) {
      analyzeTemplates()
    }
  }, [clientId])

  const filteredPositions = analysis?.allUniquePositions.filter(position =>
    position.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Template Image Positions Analysis</h1>
        <p className="text-muted-foreground">
          Analyze what image positions are actually used in your email templates
        </p>
      </div>

      {/* Client ID Input */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="clientId">Client ID</Label>
              <Input
                id="clientId"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="Enter client ID"
              />
            </div>
            <Button onClick={analyzeTemplates} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Analyzing...' : 'Analyze Templates'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {analysis && (
        <>
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Analysis Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{analysis.totalTemplates}</div>
                  <div className="text-sm text-blue-800">Total Templates</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{analysis.totalUniquePositions}</div>
                  <div className="text-sm text-green-800">Unique Image Positions</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {analysis.templates.reduce((sum, t) => sum + t.count, 0)}
                  </div>
                  <div className="text-sm text-purple-800">Total Images Found</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* All Unique Positions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>All Unique Image Positions</CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search positions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {filteredPositions.map((position, index) => (
                  <Badge key={index} variant="secondary" className="text-sm">
                    {position}
                  </Badge>
                ))}
                {filteredPositions.length === 0 && (
                  <p className="text-muted-foreground">No positions found matching "{searchTerm}"</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Template Details */}
          <Card>
            <CardHeader>
              <CardTitle>Template Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analysis.templates.map((template) => (
                  <div key={template.templateId} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold">{template.templateName}</h3>
                        <p className="text-sm text-muted-foreground">ID: {template.templateId}</p>
                      </div>
                      <Badge variant="outline">{template.count} images</Badge>
                    </div>
                    
                    {template.imagePositions.length > 0 ? (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {template.imagePositions.map((position, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {position}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground mb-3">No image positions detected</p>
                    )}
                    
                    <details className="text-sm">
                      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                        <Eye className="h-4 w-4 inline mr-1" />
                        View HTML Sample
                      </summary>
                      <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-auto max-h-32">
                        {template.sampleHtml}
                      </pre>
                    </details>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
