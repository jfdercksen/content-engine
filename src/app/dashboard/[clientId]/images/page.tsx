'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useClientConfig } from '@/hooks/useClientConfig'
import ClientOnly from '@/components/ClientOnly'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Image as ImageIcon, Filter, Search, Plus, CheckCircle, XCircle, Eye, X, Trash2 } from 'lucide-react'
import { Image, IMAGE_STATUS, IMAGE_TYPES, IMAGE_STYLES } from '@/lib/types/content'

export default function ImagesPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.clientId as string
  const [images, setImages] = useState<Image[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [styleFilter, setStyleFilter] = useState('')
  const [selectedImage, setSelectedImage] = useState<Image | null>(null)
  const [showImageModal, setShowImageModal] = useState(false)

  const { clientConfig, isLoading: configLoading, error: configError } = useClientConfig(clientId)

  useEffect(() => {
    fetchImages()
  }, [clientId])

  const fetchImages = async () => {
    try {
      setIsLoading(true)
      
      // Build query parameters
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (statusFilter) params.append('status', statusFilter)
      if (typeFilter) params.append('imageType', typeFilter)
      if (styleFilter) params.append('imageStyle', styleFilter)
      
      const queryString = params.toString()
      const url = `/api/baserow/${clientId}/images${queryString ? `?${queryString}` : ''}`
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error('Failed to fetch images')
      }
      
      const data = await response.json()
      setImages(data.results || [])
    } catch (error) {
      console.error('Error fetching images:', error)
      setImages([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleAcceptImage = async (imageId: string) => {
    try {
      const response = await fetch(`/api/baserow/${clientId}/images/${imageId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          imageStatus: 'Accepted',
          acceptedAt: new Date().toISOString()
        })
      })

      if (response.ok) {
        // Refresh the images list
        await fetchImages()
        alert('Image accepted successfully!')
      } else {
        throw new Error('Failed to accept image')
      }
    } catch (error) {
      console.error('Error accepting image:', error)
      alert('Error accepting image. Please try again.')
    }
  }

  const handleRejectImage = async (imageId: string) => {
    try {
      const response = await fetch(`/api/baserow/${clientId}/images/${imageId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          imageStatus: 'Rejected'
        })
      })

      if (response.ok) {
        // Refresh the images list
        await fetchImages()
        alert('Image rejected successfully!')
      } else {
        throw new Error('Failed to reject image')
      }
    } catch (error) {
      console.error('Error rejecting image:', error)
      alert('Error rejecting image. Please try again.')
    }
  }

  const handleDeleteImage = async (imageId: string) => {
    if (!confirm('Are you sure you want to delete this image? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/baserow/${clientId}/images/${imageId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        // Refresh the images list
        await fetchImages()
        alert('Image deleted successfully!')
      } else {
        throw new Error('Failed to delete image')
      }
    } catch (error) {
      console.error('Error deleting image:', error)
      alert('Error deleting image. Please try again.')
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Accepted':
        return 'default'
      case 'Rejected':
        return 'destructive'
      case 'Completed':
        return 'secondary'
      case 'Generating':
        return 'outline'
      case 'Failed':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const filteredImages = images.filter(image => {
    const matchesSearch = !searchTerm || 
      image.imagePrompt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      image.imageScene?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = !statusFilter || image.imageStatus === statusFilter
    const matchesType = !typeFilter || image.imageType === typeFilter
    const matchesStyle = !styleFilter || image.imageStyle === styleFilter
    
    return matchesSearch && matchesStatus && matchesType && matchesStyle
  })

  if (!clientConfig) {
    return <div>Client not found</div>
  }

  return (
    <ClientOnly fallback={
      <div className="container mx-auto py-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    }>
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => router.push(`/dashboard/${clientId}`)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <div className="h-6 w-px bg-gray-300"></div>
            <div>
              <h1 
                className="text-3xl font-bold flex items-center gap-3" 
                style={{ color: clientConfig.branding.primaryColor }}
              >
                <ImageIcon className="h-8 w-8" />
                Generated Images
              </h1>
              <p className="text-muted-foreground">
                Manage and review AI-generated images for {clientConfig.name}
              </p>
            </div>
          </div>
          <Button
            onClick={() => router.push(`/dashboard/${clientId}/social-media-content`)}
            style={{ backgroundColor: clientConfig.branding.primaryColor }}
            className="hover:opacity-90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Content
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search images..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  {Object.values(IMAGE_STATUS).map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  {Object.values(IMAGE_TYPES).map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={styleFilter} onValueChange={setStyleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Styles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Styles</SelectItem>
                  {Object.values(IMAGE_STYLES).map((style) => (
                    <SelectItem key={style} value={style}>
                      {style}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button onClick={fetchImages} variant="outline">
                Apply Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Images Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading images...</p>
          </div>
        ) : filteredImages.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Images Found
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || statusFilter || typeFilter || styleFilter 
                  ? 'Try adjusting your filters to see more images.'
                  : 'No images have been generated yet. Create some content to generate images!'
                }
              </p>
              <Button
                onClick={() => router.push(`/dashboard/${clientId}/social-media-content`)}
                style={{ backgroundColor: clientConfig.branding.primaryColor }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Content
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredImages.map((image) => (
              <Card key={image.id} className="overflow-hidden">
                <CardContent className="p-0">
                  {/* Image */}
                  <div className="relative aspect-square bg-gray-100">
                    {image.image ? (
                      <img
                        src={image.image && image.image.length > 0 ? image.image[0].url : ''}
                        alt={image.imagePrompt || 'Generated image'}
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => {
                          setSelectedImage(image)
                          setShowImageModal(true)
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <ImageIcon className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                    
                    {/* Status Badge */}
                    <div className="absolute top-2 right-2">
                      <Badge variant={getStatusBadgeVariant(image.imageStatus)}>
                        {image.imageStatus}
                      </Badge>
                    </div>
                  </div>

                  {/* Image Details */}
                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="font-medium text-sm line-clamp-2">
                        {image.imagePrompt || 'No prompt provided'}
                      </h3>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-xs">
                        {image.imageType}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {image.imageStyle}
                      </Badge>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedImage(image)
                          setShowImageModal(true)
                        }}
                        className="flex-1"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      
                      {image.imageStatus === 'Completed' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAcceptImage(image.id)}
                            className="flex-1"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Accept
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRejectImage(image.id)}
                            className="flex-1"
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteImage(image.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Image Detail Modal */}
        {showImageModal && selectedImage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Image Details</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowImageModal(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-4">
                  {/* Image */}
                  {selectedImage.image && (
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={selectedImage.image && selectedImage.image.length > 0 ? selectedImage.image[0].url : ''}
                        alt={selectedImage.imagePrompt || 'Generated image'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Status:</span>
                      <Badge variant={getStatusBadgeVariant(selectedImage.imageStatus)} className="ml-2">
                        {selectedImage.imageStatus}
                      </Badge>
                    </div>
                    <div>
                      <span className="font-medium">Type:</span>
                      <span className="ml-2">{selectedImage.imageType}</span>
                    </div>
                    <div>
                      <span className="font-medium">Style:</span>
                      <span className="ml-2">{selectedImage.imageStyle}</span>
                    </div>
                    <div>
                      <span className="font-medium">Model:</span>
                      <span className="ml-2">{selectedImage.imageModel}</span>
                    </div>
                    <div>
                      <span className="font-medium">Size:</span>
                      <span className="ml-2">{selectedImage.imageSize}</span>
                    </div>
                    <div>
                      <span className="font-medium">Created:</span>
                      <span className="ml-2">
                        {selectedImage.createdAt ? new Date(selectedImage.createdAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Prompt */}
                  <div>
                    <span className="font-medium">Prompt:</span>
                    <p className="mt-1 text-sm text-gray-600">{selectedImage.imagePrompt}</p>
                  </div>

                  {/* Scene */}
                  {selectedImage.imageScene && (
                    <div>
                      <span className="font-medium">Scene/Instructions:</span>
                      <p className="mt-1 text-sm text-gray-600">{selectedImage.imageScene}</p>
                    </div>
                  )}

                  {/* Caption */}
                  {selectedImage.captionText && (
                    <div>
                      <span className="font-medium">Caption:</span>
                      <p className="mt-1 text-sm text-gray-600">{selectedImage.captionText}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t">
                    {selectedImage.imageStatus === 'Completed' && (
                      <>
                        <Button
                          onClick={() => {
                            handleAcceptImage(selectedImage.id)
                            setShowImageModal(false)
                          }}
                          className="flex-1"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Accept Image
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            handleRejectImage(selectedImage.id)
                            setShowImageModal(false)
                          }}
                          className="flex-1"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject Image
                        </Button>
                      </>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => {
                        handleDeleteImage(selectedImage.id)
                        setShowImageModal(false)
                      }}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Image
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ClientOnly>
  )
}
