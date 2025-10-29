'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useClientConfig } from '@/hooks/useClientConfig'

import ClientOnly from '@/components/ClientOnly'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Sparkles, Search, Filter, MoreHorizontal, ArrowLeft, Eye, Edit, Image as ImageIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { IMAGE_TYPES, IMAGE_STYLES, IMAGE_STATUS } from '@/lib/types/content'
import ImageIdeaForm from '@/components/forms/ImageIdeaForm'
import ImageViewModal from '@/components/modals/ImageViewModal'
import { ImageIdeaCard } from '@/components/cards/ImageIdeaCard'
import { ViewToggle } from '@/components/ui/view-toggle'

// Image interface (using Images table structure)
interface ImageIdea {
  id: string
  imageId: string
  imagePrompt?: string
  imageScene?: string
  imageType?: string
  imageStyle?: string
  imageModel?: string
  imageSize?: string
  referenceUrl?: string
  image?: string // Main image field
  imageStatus?: string
  createdAt?: string
  updatedAt?: string
  imagePrompt?: string
}

export default function ImageIdeasPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.clientId as string
  const { clientConfig, isLoading: configLoading, error: configError } = useClientConfig(clientId)

  const [imageIdeas, setImageIdeas] = useState<ImageIdea[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingImageIdea, setEditingImageIdea] = useState<ImageIdea | null>(null)
  const [viewingImageIdea, setViewingImageIdea] = useState<ImageIdea | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Move useEffect to the top to avoid hooks order issues
  useEffect(() => {
    if (clientConfig) {
      fetchImageIdeas()
    }
  }, [refreshTrigger, clientConfig])

  const fetchImageIdeas = async () => {
    try {
      console.log('fetchImageIdeas: Starting fetch from Images table...')
      setLoading(true)
      const response = await fetch(`/api/baserow/${clientId}/images`)
      if (response.ok) {
        const data = await response.json()
        console.log('fetchImageIdeas: Fetched data from Images table:', data)
        console.log('fetchImageIdeas: Results count:', data.results?.length || 0)
        
        // Handle case where table doesn't exist yet
        if (data.error === 'Table not found') {
          console.log('fetchImageIdeas: Images table not found, showing empty state')
          setImageIdeas([])
        } else {
          setImageIdeas(data.results || [])
        }
        
        console.log('fetchImageIdeas: State updated with', data.results?.length || 0, 'items')
      } else {
        console.error('fetchImageIdeas: Failed to fetch image ideas')
        setImageIdeas([])
      }
    } catch (error) {
      console.error('fetchImageIdeas: Error fetching image ideas:', error)
      setImageIdeas([])
    } finally {
      setLoading(false)
      console.log('fetchImageIdeas: Loading set to false')
    }
  }

  const filteredImageIdeas = imageIdeas.filter(idea => {
    // Helper function to safely get string value from field (handles objects from single select fields)
    const getStringValue = (value: any): string => {
      if (typeof value === 'string') return value
      if (typeof value === 'number') return String(value)
      if (value && typeof value === 'object' && value.value) return value.value
      return ''
    }

    const matchesSearch = getStringValue(idea.imageId).toLowerCase().includes(searchTerm.toLowerCase()) ||
                         getStringValue(idea.imagePrompt).toLowerCase().includes(searchTerm.toLowerCase()) ||
                         getStringValue(idea.imageScene).toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || getStringValue(idea.imageStatus) === statusFilter
    const matchesType = typeFilter === 'all' || getStringValue(idea.imageType) === typeFilter
    // Remove operation filter since we're using Images table now
    const matchesOperation = true

    return matchesSearch && matchesStatus && matchesType && matchesOperation
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft': return 'bg-gray-100 text-gray-800'
      case 'Generating': return 'bg-blue-100 text-blue-800'
      case 'Generated': return 'bg-green-100 text-green-800'
      case 'Failed': return 'bg-red-100 text-red-800'
      case 'Approved': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'New Image': return 'bg-blue-100 text-blue-800'
      case 'Reference Image': return 'bg-orange-100 text-orange-800'
      case 'Combined Image': return 'bg-green-100 text-green-800'
      case 'Edited Image': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }


  const handleSaveImageIdea = async (imageIdeaData: any) => {
    try {
      console.log('handleSaveImageIdea: Saving image idea:', imageIdeaData)
      
      const formData = new FormData()
      
      // Add source identifier to distinguish from Social Media Post generation
      formData.append('source', 'image_ideas')
      
      // Add all form fields
      Object.entries(imageIdeaData).forEach(([key, value]) => {
        if (key === 'selectedImages' && Array.isArray(value)) {
          value.forEach((imageId: string) => formData.append('selectedImages', imageId))
        } else if (key === 'uploadedImages' && Array.isArray(value)) {
          value.forEach((file: File) => formData.append('uploadedImages', file))
        } else if (key === 'referenceImage' && value instanceof File) {
          formData.append('referenceImage', value)
        } else if (key === 'voiceNote' && value instanceof File) {
          formData.append('voiceNote', value)
        } else if (value !== undefined && value !== null) {
          formData.append(key, String(value))
        }
      })

      const response = await fetch(`/api/baserow/${clientId}/image-ideas`, {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        console.log('handleSaveImageIdea: Image idea saved successfully:', result)
        console.log('handleSaveImageIdea: Record ID from API:', result.data?.id)
        
        setShowCreateForm(false)
        setRefreshTrigger(prev => prev + 1)
        
        // Return the result to the form for webhook processing
        return result
      } else {
        const errorData = await response.json()
        console.error('handleSaveImageIdea: Failed to save image idea:', errorData)
        alert('Failed to save image idea. Please try again.')
        return { success: false, error: errorData }
      }
    } catch (error) {
      console.error('handleSaveImageIdea: Error saving image idea:', error)
      alert('Error saving image idea. Please try again.')
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  const handleEditImageIdea = async (imageIdeaData: any) => {
    try {
      console.log('handleEditImageIdea: Updating image idea:', imageIdeaData)
      
      const response = await fetch(`/api/baserow/${clientId}/image-ideas/${editingImageIdea?.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(imageIdeaData),
      })

      if (response.ok) {
        console.log('handleEditImageIdea: Image idea updated successfully')
        setEditingImageIdea(null)
        setRefreshTrigger(prev => prev + 1)
      } else {
        const errorData = await response.json()
        console.error('handleEditImageIdea: Failed to update image idea:', errorData)
        alert('Failed to update image idea. Please try again.')
      }
    } catch (error) {
      console.error('handleEditImageIdea: Error updating image idea:', error)
      alert('Error updating image idea. Please try again.')
    }
  }

  const handleDeleteImageIdea = async (imageIdeaId: string) => {
    if (confirm('Are you sure you want to delete this image idea?')) {
      try {
        const response = await fetch(`/api/baserow/${clientId}/image-ideas/${imageIdeaId}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          console.log('handleDeleteImageIdea: Image idea deleted successfully')
          setRefreshTrigger(prev => prev + 1)
        } else {
          console.error('handleDeleteImageIdea: Failed to delete image idea')
          alert('Failed to delete image idea. Please try again.')
        }
      } catch (error) {
        console.error('handleDeleteImageIdea: Error deleting image idea:', error)
        alert('Error deleting image idea. Please try again.')
      }
    }
  }

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1)
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
            onClick={() => router.push(`/dashboard/${clientId}`)}
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
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/dashboard/${clientId}`)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center space-x-2">
                <Sparkles className="h-8 w-8" style={{ color: clientConfig.branding.primaryColor }} />
                <span>Image Ideas</span>
              </h1>
              <p className="text-muted-foreground">
                Generate, combine, and manage image content for {clientConfig.name}
              </p>
            </div>
          </div>
          <Button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center space-x-2"
            style={{ backgroundColor: clientConfig.branding.primaryColor }}
          >
            <Plus className="h-4 w-4" />
            <span>Create Image Idea</span>
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Filters</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search image ideas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {Object.entries(IMAGE_STATUS).map(([key, value]) => (
                      <SelectItem key={key} value={value}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Image Type</label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {Object.entries(IMAGE_TYPES).map(([key, value]) => (
                      <SelectItem key={key} value={value}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">View Mode</label>
                <ViewToggle view={viewMode} onViewChange={setViewMode} />
              </div>

            </div>
          </CardContent>
        </Card>

        {/* Image Ideas Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-20 bg-gray-200 rounded mb-4"></div>
                  <div className="flex space-x-2">
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                    <div className="h-6 bg-gray-200 rounded w-20"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredImageIdeas.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Sparkles className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Image Ideas Found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                  ? 'No image ideas match your current filters.'
                  : 'Get started by creating your first image idea.'}
              </p>
              <div className="space-y-2">
                <Button
                  onClick={() => setShowCreateForm(true)}
                  className="flex items-center space-x-2"
                  style={{ backgroundColor: clientConfig.branding.primaryColor }}
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Image Idea</span>
                </Button>
                <p className="text-xs text-gray-500">
                  Note: If you see errors, the Image Ideas table may need to be created in Baserow first.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : viewMode === 'cards' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredImageIdeas.map((idea) => (
              <ImageIdeaCard
                key={idea.id}
                image={{
                  id: idea.id,
                  imageprompt: idea.imagePrompt,
                  imagetype: idea.imageType,
                  imagestyle: idea.imageStyle,
                  imagestatus: typeof idea.imageStatus === 'string' ? idea.imageStatus : idea.imageStatus?.value || '',
                  image: idea.image,
                  referenceurl: idea.referenceUrl
                }}
                onView={() => setViewingImageIdea(idea)}
                onEdit={() => { setEditingImageIdea(idea); setShowCreateForm(true); }}
                onDelete={handleDeleteImageIdea}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredImageIdeas.map((idea) => (
              <Card key={idea.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2">
                        Image #{String(idea.imageId || 'N/A')}
                      </CardTitle>
                      <p className="text-sm text-gray-500 mt-1">
                        {idea.imagePrompt && typeof idea.imagePrompt === 'string' 
                          ? idea.imagePrompt.substring(0, 50) + '...' 
                          : 'No description'}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Image Preview */}
                  {(() => {
                    // Handle both formats: direct URL string (Modern Management & new clients) or array of file objects (old Willie Hoop)
                    let imageUrl = null;
                    
                    if (typeof idea.image === 'string' && idea.image.trim()) {
                      // Modern Management & new clients format: direct URL string
                      imageUrl = idea.image;
                    } else if (idea.image && Array.isArray(idea.image) && idea.image.length > 0 && idea.image[0].url) {
                      // Legacy Willie Hoop format: array of file objects
                      imageUrl = idea.image[0].url;
                    }
                    
                    return imageUrl ? (
                      <div 
                        className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => setViewingImageIdea(idea)}
                      >
                        <img 
                          src={imageUrl} 
                          alt={`Image ${idea.imageId || idea.id}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-gray-400" />
                      </div>
                    );
                  })()}

                  {/* Description */}
                  <div className="space-y-2">
                    {idea.imagePrompt && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        <strong>Prompt:</strong> {idea.imagePrompt}
                      </p>
                    )}
                    {idea.imageScene && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        <strong>Scene:</strong> {idea.imageScene}
                      </p>
                    )}
                    {idea.imagePrompt && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        <strong>Notes:</strong> {idea.imagePrompt}
                      </p>
                    )}
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2">
                    {idea.imageStatus && (
                      <Badge className={getStatusColor(typeof idea.imageStatus === 'string' ? idea.imageStatus : idea.imageStatus?.value || '')}>
                        {typeof idea.imageStatus === 'string' ? idea.imageStatus : idea.imageStatus?.value || ''}
                      </Badge>
                    )}
                    {idea.imageType && (
                      <Badge className={getTypeColor(typeof idea.imageType === 'string' ? idea.imageType : idea.imageType?.value || '')}>
                        {typeof idea.imageType === 'string' ? idea.imageType : idea.imageType?.value || ''}
                      </Badge>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex justify-between items-center pt-2">
                    <div className="text-xs text-gray-500">
                      {idea.createdAt && new Date(idea.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex space-x-2">
                      {idea.image && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setViewingImageIdea(idea)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setEditingImageIdea(idea)}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create/Edit Form Modal */}
        {showCreateForm && (
          <ImageIdeaForm
            onSubmit={handleSaveImageIdea}
            onClose={() => setShowCreateForm(false)}
            clientId={clientId}
            isLoading={loading}
          />
        )}

        {editingImageIdea && (
          <ImageIdeaForm
            onSubmit={handleEditImageIdea}
            onClose={() => setEditingImageIdea(null)}
            initialData={editingImageIdea}
            isEditing={true}
            clientId={clientId}
            isLoading={loading}
          />
        )}

        {/* Image View Modal */}
        <ImageViewModal
          isOpen={!!viewingImageIdea}
          onClose={() => setViewingImageIdea(null)}
          imageIdea={viewingImageIdea}
        />
      </div>
    </ClientOnly>
  )
}
