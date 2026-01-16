'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Search, Image as ImageIcon, Check, X } from 'lucide-react'
import { Image } from '@/lib/types/content'

interface ImageBrowserModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectImage: (image: Partial<Image>) => void
  clientId: string
  selectedPosition?: string
  refreshTrigger?: number
}

export default function ImageBrowserModal({ 
  isOpen, 
  onClose, 
  onSelectImage, 
  clientId,
  selectedPosition,
  refreshTrigger = 0
}: ImageBrowserModalProps) {
  const [images, setImages] = useState<Partial<Image>[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedImage, setSelectedImage] = useState<Partial<Image> | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchImages()
    }
  }, [isOpen, clientId, refreshTrigger])

  const fetchImages = async () => {
    try {
      setLoading(true)
      const ts = Date.now()
      const response = await fetch(`/api/baserow/${clientId}/images?_t=${ts}`)
      if (response.ok) {
        const data = await response.json()
        console.log('Fetched images data:', data)
        console.log('Images array:', data.results)
        console.log('Number of images:', data.results?.length || 0)
        
        // Log the first image to see the data structure
        if (data.results && data.results.length > 0) {
          console.log('First image structure:', data.results[0])
          console.log('First image ID:', data.results[0].id)
          console.log('First image imageId:', data.results[0].imageId)
          console.log('First image imageType:', data.results[0].imageType)
          console.log('First image imageStatus:', data.results[0].imageStatus)
          console.log('First image imageStyle:', data.results[0].imageStyle)
        }
        
        setImages(data.results || [])
      } else {
        console.error('Failed to fetch images:', response.status, response.statusText)
        const errorText = await response.text()
        console.error('Error response:', errorText)
      }
    } catch (error) {
      console.error('Error fetching images:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredImages = images.filter(image => {
    // If no search term, show all images
    if (!searchTerm.trim()) {
      return true
    }
    
    // Otherwise, filter by search term
    const searchLower = searchTerm.toLowerCase()
    
    // Helper function to safely get string value from field
    const getStringValue = (field: any) => {
      if (typeof field === 'object' && field !== null && 'value' in field) {
        return field.value
      }
      return field
    }
    
    return (
      (image.imageId && String(image.imageId).toLowerCase().includes(searchLower)) ||
      (image.imagePrompt && String(image.imagePrompt).toLowerCase().includes(searchLower)) ||
      (image.imageScene && String(image.imageScene).toLowerCase().includes(searchLower)) ||
      (image.imageType && String(getStringValue(image.imageType)).toLowerCase().includes(searchLower)) ||
      (image.imageStyle && String(getStringValue(image.imageStyle)).toLowerCase().includes(searchLower))
    )
  })

  // Debug logging
  console.log('Total images:', images.length)
  console.log('Filtered images:', filteredImages.length)
  console.log('Search term:', searchTerm)

  const handleSelectImage = () => {
    if (selectedImage) {
      console.log('ImageBrowserModal: Calling onSelectImage with:', selectedImage)
      onSelectImage(selectedImage)
      onClose()
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Accepted': return 'bg-green-100 text-green-800'
      case 'Rejected': return 'bg-red-100 text-red-800'
      case 'Pending': return 'bg-yellow-100 text-yellow-800'
      case 'Draft': return 'bg-gray-100 text-gray-800'
      case 'Generated': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Select Any Image from Database
            {selectedPosition && (
              <Badge variant="outline" className="ml-2">
                For: {selectedPosition}
              </Badge>
            )}
          </DialogTitle>
          <p className="text-sm text-gray-600 mt-2">
            Choose any image from your database. The image will be used for the selected position.
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Search */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search images by ID, prompt, scene, type, or style (optional)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={fetchImages} disabled={loading}>
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>

          {/* Images Grid */}
          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredImages.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-gray-500">
                <div className="text-center">
                  <ImageIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No images found</p>
                  <p className="text-sm">Try adjusting your search terms</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredImages.map((image, index) => (
                  <Card 
                    key={image.id || `image-${index}`}
                    className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                      selectedImage?.id === image.id 
                        ? 'ring-2 ring-blue-500 bg-blue-50' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedImage(image)}
                  >
                    <CardContent className="p-3">
                      <div className="aspect-square mb-3 bg-gray-100 rounded-lg overflow-hidden">
                        {(() => {
                          const imageUrl = image.imageLinkUrl || (image.image && image.image.length > 0 ? image.image[0].url : null)
                          console.log('ImageBrowserModal: Processing image:', image.id, 'imageUrl:', imageUrl, 'image.image:', image.image)
                          
                          // Ensure we have a valid, non-empty string URL
                          if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim() !== '') {
                            return (
                              <img
                                src={imageUrl}
                                alt={image.imageId || 'Image'}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  console.log('ImageBrowserModal: Image failed to load:', imageUrl)
                                  const target = e.target as HTMLImageElement
                                  target.style.display = 'none'
                                  const fallback = target.nextElementSibling as HTMLElement
                                  if (fallback) {
                                    fallback.classList.remove('hidden')
                                  }
                                }}
                              />
                            )
                          }
                          
                          // Show placeholder if no valid image URL
                          return (
                            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                              <ImageIcon className="h-8 w-8" />
                            </div>
                          )
                        })()}
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm truncate" title={String(image.imageId || 'Untitled Image')}>
                          Image #{String(image.imageId || 'Unknown')}
                        </h4>
                        
                        {image.imageType && (
                          <Badge variant="outline" className="text-xs">
                            {typeof image.imageType === 'object' ? image.imageType?.value || 'Unknown' : image.imageType}
                          </Badge>
                        )}
                        
                        {image.imageStatus && (
                          <Badge className={`text-xs ${getStatusColor(typeof image.imageStatus === 'object' ? image.imageStatus?.value || 'Unknown' : image.imageStatus)}`}>
                            {typeof image.imageStatus === 'object' ? image.imageStatus?.value || 'Unknown' : image.imageStatus}
                          </Badge>
                        )}
                        
                        {image.imageStyle && (
                          <Badge variant="outline" className="text-xs">
                            {typeof image.imageStyle === 'object' ? image.imageStyle?.value || 'Unknown' : image.imageStyle}
                          </Badge>
                        )}
                        
                        {image.createdAt && (
                          <p className="text-xs text-gray-500">
                            {new Date(image.createdAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-gray-600">
              {selectedImage ? (
                <span>Selected: <strong>Image #{String(selectedImage.imageId || 'Unknown')}</strong></span>
              ) : (
                <span>Select an image to continue</span>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button 
                onClick={handleSelectImage}
                disabled={!selectedImage}
              >
                <Check className="h-4 w-4 mr-2" />
                Select Image
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
