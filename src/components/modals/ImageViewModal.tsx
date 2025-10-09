'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Download, X, ExternalLink } from 'lucide-react'

interface ImageIdea {
  id: string
  imageId: string
  image?: string
  imagePrompt?: string
  imageScene?: string
  imageType?: string
  imageStyle?: string
  imageModel?: string
  imageSize?: string
  imageStatus?: string
  referenceUrl?: string
  createdAt?: string
  updatedAt?: string
}

interface ImageViewModalProps {
  isOpen: boolean
  onClose: () => void
  imageIdea: ImageIdea | null
}

export default function ImageViewModal({ isOpen, onClose, imageIdea }: ImageViewModalProps) {
  if (!imageIdea) return null

  // Helper function to get the correct image URL from either format
  const getImageUrl = (image: any): string | null => {
    if (typeof image === 'string' && image.trim()) {
      // Modern Management & new clients format: direct URL string
      return image;
    } else if (image && Array.isArray(image) && image.length > 0 && image[0].url) {
      // Legacy Willie Hoop format: array of file objects
      return image[0].url;
    }
    return null;
  }

  const handleDownload = async () => {
    const imageUrl = getImageUrl(imageIdea.image)
    if (!imageUrl) return

    try {
      // Fetch the image
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `image-${imageIdea.imageId || 'download'}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading image:', error)
      alert('Failed to download image. Please try again.')
    }
  }

  const handleOpenInNewTab = () => {
    const imageUrl = getImageUrl(imageIdea.image)
    if (imageUrl) {
      window.open(imageUrl, '_blank')
    }
  }

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Image #{imageIdea.imageId || 'Unknown'}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleDownload} disabled={!getImageUrl(imageIdea.image)}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button variant="outline" size="sm" onClick={handleOpenInNewTab} disabled={!getImageUrl(imageIdea.image)}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Open
              </Button>
              <Button variant="outline" size="sm" onClick={onClose}>
                <X className="h-4 w-4 mr-2" />
                Close
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-6">
          {/* Image Display */}
          <div className="flex justify-center">
            {(() => {
              const imageUrl = getImageUrl(imageIdea.image);
              
              return imageUrl ? (
                <div className="relative max-w-full max-h-96">
                  <img
                    src={imageUrl}
                    alt={`Image ${imageIdea.imageId}`}
                    className="max-w-full max-h-96 object-contain rounded-lg shadow-lg"
                  />
                </div>
              ) : (
                <div className="w-96 h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500">No image available</p>
                </div>
              );
            })()}
          </div>

          {/* Image Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column - Basic Info */}
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-3">Basic Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Image ID</label>
                    <p className="text-sm">{imageIdea.imageId || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">Status</label>
                    <div className="mt-1">
                      {imageIdea.imageStatus ? (
                        <Badge className={getStatusColor(imageIdea.imageStatus)}>
                          {imageIdea.imageStatus}
                        </Badge>
                      ) : (
                        <span className="text-sm text-gray-500">N/A</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Type</label>
                    <div className="mt-1">
                      {imageIdea.imageType ? (
                        <Badge className={getTypeColor(imageIdea.imageType)}>
                          {imageIdea.imageType}
                        </Badge>
                      ) : (
                        <span className="text-sm text-gray-500">N/A</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Style</label>
                    <p className="text-sm">{imageIdea.imageStyle || 'N/A'}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Model</label>
                    <p className="text-sm">{imageIdea.imageModel || 'N/A'}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Size</label>
                    <p className="text-sm">{imageIdea.imageSize || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Content */}
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-3">Content Details</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Prompt</label>
                    <p className="text-sm bg-gray-50 p-3 rounded border">
                      {imageIdea.imagePrompt || 'No prompt provided'}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Scene Description</label>
                    <p className="text-sm bg-gray-50 p-3 rounded border">
                      {imageIdea.imageScene || 'No scene description'}
                    </p>
                  </div>

                  {imageIdea.referenceUrl && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Reference URL</label>
                      <p className="text-sm">
                        <a 
                          href={imageIdea.referenceUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline break-all"
                        >
                          {imageIdea.referenceUrl}
                        </a>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-lg mb-3">Metadata</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <label className="font-medium text-gray-600">Created</label>
                <p>{imageIdea.createdAt ? new Date(imageIdea.createdAt).toLocaleString() : 'N/A'}</p>
              </div>
              <div>
                <label className="font-medium text-gray-600">Last Updated</label>
                <p>{imageIdea.updatedAt ? new Date(imageIdea.updatedAt).toLocaleString() : 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
