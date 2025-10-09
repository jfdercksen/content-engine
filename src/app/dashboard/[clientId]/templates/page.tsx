'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useClientConfig } from '@/hooks/useClientConfig'
import ClientHeader from '@/components/layout/ClientHeader'
import ClientOnly from '@/components/ClientOnly'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, FileCode, Search, Filter, MoreHorizontal, Eye, Edit, Copy } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Template, TEMPLATE_TYPES, TEMPLATE_CATEGORIES } from '@/lib/types/content'

export default function TemplatesPage() {
  const params = useParams()
  const clientId = params.clientId as string
  const { clientConfig, isLoading: configLoading, error: configError } = useClientConfig(clientId)

  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)

  // Move useEffect to the top to avoid hooks order issues
  useEffect(() => {
    if (clientConfig) {
      fetchTemplates()
    }
  }, [clientConfig])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/baserow/${clientId}/templates`)
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.results || [])
      } else {
        console.error('Failed to fetch templates')
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.templateName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === 'all' || template.templateType === typeFilter
    const matchesCategory = categoryFilter === 'all' || template.templateCategory === categoryFilter

    return matchesSearch && matchesType && matchesCategory
  })

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Email': return 'bg-blue-100 text-blue-800'
      case 'Blog': return 'bg-green-100 text-green-800'
      case 'Social Media': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Welcome': return 'bg-yellow-100 text-yellow-800'
      case 'Promotional': return 'bg-orange-100 text-orange-800'
      case 'Newsletter': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handlePreviewTemplate = (template: Template) => {
    setSelectedTemplate(template)
  }

  const handleDuplicateTemplate = async (template: Template) => {
    // TODO: Implement duplicate functionality
    console.log('Duplicate template:', template)
  }

  // Conditional rendering based on client config state
  if (configLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading client configuration...</p>
          </div>
        </div>
      </div>
    )
  }

  if (configError || !clientConfig) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Client Not Found</h1>
          <p className="text-gray-600 mb-6">
            {configError || `The client "${clientId}" could not be found.`}
          </p>
          <button 
            onClick={() => window.history.back()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <ClientOnly fallback={
      <div className="container mx-auto py-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    }>
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Templates</h1>
            <p className="text-muted-foreground">
              Manage email and content templates for {clientConfig.name}
            </p>
          </div>
          <Button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Template
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <FileCode className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Templates</p>
                  <p className="text-2xl font-bold">{templates.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Email</p>
                  <p className="text-2xl font-bold">
                    {templates.filter(template => template.templateType === 'Email').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Blog</p>
                  <p className="text-2xl font-bold">
                    {templates.filter(template => template.templateType === 'Blog').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Social Media</p>
                  <p className="text-2xl font-bold">
                    {templates.filter(template => template.templateType === 'Social Media').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search templates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.values(TEMPLATE_TYPES).map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Object.values(TEMPLATE_CATEGORIES).map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Templates Grid */}
        <Card>
          <CardHeader>
            <CardTitle>Templates ({filteredTemplates.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-48 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="text-center py-8">
                <FileCode className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || typeFilter !== 'all' || categoryFilter !== 'all' 
                    ? 'Try adjusting your filters' 
                    : 'Get started by creating your first template'}
                </p>
                {!searchTerm && typeFilter === 'all' && categoryFilter === 'all' && (
                  <Button onClick={() => setShowCreateForm(true)}>
                    Create Template
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTemplates.map((template) => (
                  <Card key={template.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-lg truncate">
                            {template.templateName}
                          </h3>
                          <div className="flex items-center gap-1">
                            {template.isActive && (
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {template.templateType && (
                            <Badge className={getTypeColor(template.templateType)}>
                              {template.templateType}
                            </Badge>
                          )}
                          {template.templateCategory && (
                            <Badge className={getCategoryColor(template.templateCategory)}>
                              {template.templateCategory}
                            </Badge>
                          )}
                        </div>

                        <div className="text-sm text-gray-600">
                          <p>ID: {template.templateId}</p>
                          {template.lastModified && (
                            <p>Modified: {template.lastModified}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handlePreviewTemplate(template)}
                            className="flex-1"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Preview
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDuplicateTemplate(template)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Template Preview Modal */}
        {selectedTemplate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">{selectedTemplate.templateName}</h2>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedTemplate(null)}
                >
                  Close
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {selectedTemplate.templateType && (
                    <Badge className={getTypeColor(selectedTemplate.templateType)}>
                      {selectedTemplate.templateType}
                    </Badge>
                  )}
                  {selectedTemplate.templateCategory && (
                    <Badge className={getCategoryColor(selectedTemplate.templateCategory)}>
                      {selectedTemplate.templateCategory}
                    </Badge>
                  )}
                  {selectedTemplate.isActive && (
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  )}
                </div>

                {selectedTemplate.htmlTemplate ? (
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <h3 className="font-semibold mb-2">HTML Template</h3>
                    <pre className="text-sm overflow-x-auto whitespace-pre-wrap">
                      {selectedTemplate.htmlTemplate}
                    </pre>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No HTML template content available
                  </div>
                )}

                {selectedTemplate.cssStyles && (
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <h3 className="font-semibold mb-2">CSS Styles</h3>
                    <pre className="text-sm overflow-x-auto whitespace-pre-wrap">
                      {selectedTemplate.cssStyles}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </ClientOnly>
  )
}
