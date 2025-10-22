'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  Facebook, 
  Instagram, 
  Twitter, 
  Linkedin, 
  Youtube, 
  Eye, 
  Edit, 
  Calendar,
  Hash,
  MessageSquare,
  TrendingUp,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  RefreshCw,
  Trash2
} from 'lucide-react'
import { SocialMediaContent, SocialMediaContentFilters } from '@/lib/types/content'
import ClientOnly from '@/components/ClientOnly'

interface SocialMediaContentTableProps {
  socialMediaContent: SocialMediaContent[]
  isLoading: boolean
  onEdit?: (content: SocialMediaContent) => void
  onView?: (content: SocialMediaContent) => void
  onStatusUpdate?: (contentId: string, status: string) => void
  onDelete?: (content: SocialMediaContent) => void
  clientPrimaryColor: string
  showContentIdea?: boolean
  contentIdeaTitle?: string
}

// Component to display generated images
function GeneratedImageDisplay({ content }: { content: SocialMediaContent }) {
  // Helper function to get display value from Baserow select fields
  const getDisplayValue = (field: string | any) => {
    return typeof field === 'object' && field?.value ? field.value : field || ''
  }

  // Debug the content object
  console.log('GeneratedImageDisplay - Full content object:', content)
  console.log('GeneratedImageDisplay - content keys:', Object.keys(content))
  console.log('GeneratedImageDisplay - content.images:', content.images)
  
  // Use images from the mapped field name
  // content.images contains the actual image objects with proper field mapping
  const images = content.images || []
  
  console.log('GeneratedImageDisplay - final images array:', images)
  console.log('GeneratedImageDisplay - images array length:', images.length)
  if (images.length > 0) {
    console.log('GeneratedImageDisplay - first image object:', images[0])
    console.log('GeneratedImageDisplay - first image keys:', Object.keys(images[0]))
    console.log('GeneratedImageDisplay - first image image field:', images[0].image)
  }

  // Check if we have valid image data
  // images[0].image should be an array of file objects with URL
  const hasValidImageData = images.length > 0 && 
    images[0].image && 
    Array.isArray(images[0].image) && 
    images[0].image.length > 0 && 
    images[0].image[0].url

  // Check if we have basic reference objects (id, value, order) - these are link references
  const hasReferenceData = images.length > 0 && 
    images[0].id !== undefined && 
    (images[0].value !== undefined || images[0].order !== undefined)

  if (images.length === 0) {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <ImageIcon className="h-3 w-3" />
        No images
      </div>
    )
  }

  // If we have reference data but not full image data, show that images are linked
  if (!hasValidImageData && hasReferenceData) {
    return (
      <div className="flex items-center gap-2 text-xs text-blue-600">
        <ImageIcon className="h-3 w-3" />
        {images.length} image{images.length !== 1 ? 's' : ''} linked (ID{images.length !== 1 ? 's' : ''}: {(images && Array.isArray(images) ? images.map((img: any) => img.id) : []).join(', ')})
      </div>
    )
  }

      return (
    <div className="space-y-2">
             {(images && Array.isArray(images)) ? images.map((image) => {
         // Extract image URL from various possible field structures
         let imageUrl = null
         
         // Check if image URL is already processed (from API mapping)
         if (image.image) {
           if (Array.isArray(image.image) && image.image.length > 0) {
             imageUrl = image.image[0]?.url || image.image[0]?.name || image.image[0]
           } else if (typeof image.image === 'string') {
             imageUrl = image.image
           } else {
             imageUrl = image.image
           }
         }
         
         console.log('Rendering image:', image.id, 'imageUrl:', imageUrl)
         return (
           <div key={image.id || `image-${Math.random()}`} className="flex items-center gap-2">
             {imageUrl ? ( // Main Image field
               <div className="relative">
                 <img 
                   src={imageUrl} 
                   alt="Generated content"
                   className="w-12 h-12 object-cover rounded border"
                   onError={(e) => {
                     e.currentTarget.style.display = 'none'
                   }}
                 />
              <Badge 
                variant="secondary" 
                className="absolute -top-1 -right-1 text-xs px-1 py-0"
              >
                {getDisplayValue(image.imagestatus) || 'Unknown'} {/* Image Status */}
              </Badge>
            </div>
          ) : (
            <div className="w-12 h-12 bg-gray-100 rounded border flex items-center justify-center">
              <ImageIcon className="h-4 w-4 text-gray-400" />
            </div>
          )}
                     <div className="text-xs">
             <div className="font-medium">{getDisplayValue(image.imageprompt) || 'Untitled'}</div> {/* Image Prompt */}
             <div className="text-gray-500">{getDisplayValue(image.imagestatus) || 'Processing'}</div> {/* Status */}
           </div>
         </div>
       )
       }) : null}
    </div>
  )
}

export default function SocialMediaContentTable({
  socialMediaContent,
  isLoading,
  onEdit,
  onView,
  onStatusUpdate,
  onDelete,
  clientPrimaryColor,
  showContentIdea = true,
  contentIdeaTitle
}: SocialMediaContentTableProps) {
  const [filteredContent, setFilteredContent] = useState<SocialMediaContent[]>(socialMediaContent)
  const [filters, setFilters] = useState<SocialMediaContentFilters>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards')

  useEffect(() => {
    let filtered = socialMediaContent

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(content => 
        content.post.toLowerCase().includes(searchTerm.toLowerCase()) ||
        content.hook.toLowerCase().includes(searchTerm.toLowerCase()) ||
        content.hashtags.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply platform filter
    if (filters.platform) {
      filtered = filtered.filter(content => getDisplayValue(content.platform) === filters.platform)
    }

    // Apply status filter
    if (filters.status) {
      filtered = filtered.filter(content => getDisplayValue(content.status) === filters.status)
    }

    // Apply content type filter
    if (filters.contentType) {
      filtered = filtered.filter(content => getDisplayValue(content.contentType) === filters.contentType)
    }

    setFilteredContent(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }, [socialMediaContent, searchTerm, filters])

  const getPlatformIcon = (platform: string | any) => {
    // Handle Baserow select field format {id, value, color}
    const platformValue = typeof platform === 'object' && platform?.value ? platform.value : platform
    
    if (!platformValue || typeof platformValue !== 'string') {
      return <MessageSquare className="h-4 w-4 text-gray-500" />
    }
    
    switch (platformValue.toLowerCase()) {
      case 'facebook': return <Facebook className="h-4 w-4 text-blue-600" />
      case 'instagram': return <Instagram className="h-4 w-4 text-pink-600" />
      case 'x': 
      case 'twitter': return <Twitter className="h-4 w-4 text-blue-400" />
      case 'linkedin': return <Linkedin className="h-4 w-4 text-blue-700" />
      case 'youtube': return <Youtube className="h-4 w-4 text-red-600" />
      default: return <MessageSquare className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusVariant = (status: string | any) => {
    // Handle Baserow select field format {id, value, color}
    const statusValue = typeof status === 'object' && status?.value ? status.value : status
    
    if (!statusValue || typeof statusValue !== 'string') {
      return 'secondary'
    }
    
    switch (statusValue.toLowerCase()) {
      case 'published': return 'default'
      case 'approved': return 'secondary'
      case 'scheduled': return 'outline'
      case 'draft': return 'secondary'
      case 'ready for review': return 'outline'
      case 'in review': return 'outline'
      default: return 'secondary'
    }
  }

  const getStatusColor = (status: string | any) => {
    // Handle Baserow select field format {id, value, color}
    const statusValue = typeof status === 'object' && status?.value ? status.value : status
    
    if (!statusValue || typeof statusValue !== 'string') {
      return 'text-gray-600 bg-gray-50'
    }
    
    switch (statusValue.toLowerCase()) {
      case 'published': return 'text-green-600 bg-green-50'
      case 'approved': return 'text-blue-600 bg-blue-50'
      case 'scheduled': return 'text-orange-600 bg-orange-50'
      case 'draft': return 'text-gray-600 bg-gray-50'
      case 'ready for review': return 'text-yellow-600 bg-yellow-50'
      case 'in review': return 'text-pink-600 bg-pink-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }



  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return ''
    }
  }

  const getDisplayValue = (field: string | any) => {
    // Handle Baserow select field format {id, value, color}
    return typeof field === 'object' && field?.value ? field.value : field || ''
  }

  const truncateText = (text: string | undefined | null, maxLength: number = 100) => {
    if (!text || typeof text !== 'string') return ''
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  // Pagination
  const totalPages = Math.ceil(filteredContent.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentContent = filteredContent.slice(startIndex, endIndex)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (socialMediaContent.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No social media content yet
        </h3>
        <p className="text-gray-500 mb-6">
          {contentIdeaTitle 
            ? `No social media content has been generated for "${contentIdeaTitle}" yet.`
            : 'Social media content will appear here once generated from content ideas.'
          }
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            Social Media Content
            {contentIdeaTitle && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                for "{contentIdeaTitle}"
              </span>
            )}
          </h3>
          <p className="text-sm text-gray-500">
            {filteredContent.length} of {socialMediaContent.length} posts
          </p>
        </div>
        
        {/* View Mode Toggle */}
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('table')}
          >
            Table
          </Button>
          <Button
            variant={viewMode === 'cards' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('cards')}
          >
            Cards
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search posts, hooks, or hashtags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Select value={filters.platform || 'all'} onValueChange={(value) => 
          setFilters(prev => ({ ...prev, platform: value === 'all' ? undefined : value }))
        }>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Platform" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Platforms</SelectItem>
            <SelectItem value="Facebook">Facebook</SelectItem>
            <SelectItem value="Instagram">Instagram</SelectItem>
            <SelectItem value="X">X (Twitter)</SelectItem>
            <SelectItem value="LinkedIn">LinkedIn</SelectItem>
            <SelectItem value="YouTube">YouTube</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.status || 'all'} onValueChange={(value) => 
          setFilters(prev => ({ ...prev, status: value === 'all' ? undefined : value }))
        }>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Draft">Draft</SelectItem>
            <SelectItem value="Ready for Review">Ready for Review</SelectItem>
            <SelectItem value="Approved">Approved</SelectItem>
            <SelectItem value="Scheduled">Scheduled</SelectItem>
            <SelectItem value="Published">Published</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.contentType || 'all'} onValueChange={(value) => 
          setFilters(prev => ({ ...prev, contentType: value === 'all' ? undefined : value }))
        }>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Content Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Post">Post</SelectItem>
            <SelectItem value="Story">Story</SelectItem>
            <SelectItem value="Reel">Reel</SelectItem>
            <SelectItem value="Video">Video</SelectItem>
            <SelectItem value="Carousel">Carousel</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Content Display */}
      {viewMode === 'table' ? (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Platform</TableHead>
                <TableHead>Content</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Strategy</TableHead>
                <TableHead>Images</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentContent.map((content) => (
                <TableRow key={content.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getPlatformIcon(content.platform)}
                      <span className="font-medium">{getDisplayValue(content.platform)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-sm">
                    <div className="space-y-2">
                      <div>
                        <p className="font-medium text-sm text-gray-900">
                          {truncateText(content.hook, 60)}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {truncateText(content.post, 100)}
                        </p>
                      </div>
                      {content.cta && (
                        <div className="bg-blue-50 border border-blue-200 rounded px-2 py-1">
                          <p className="text-xs text-blue-800 font-medium">
                            {truncateText(content.cta, 40)}
                          </p>
                        </div>
                      )}
                      {content.hashtags && (
                        <p className="text-xs text-blue-600">
                          {truncateText(content.hashtags, 50)}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {getDisplayValue(content.contentType)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={getStatusVariant(content.status) as any}
                      className={`text-xs ${getStatusColor(content.status)}`}
                    >
                      {getDisplayValue(content.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="space-y-1 text-xs">
                      {content.angle && (
                        <div className="flex items-center gap-1">
                          <span className="font-medium text-gray-700">Angle:</span>
                          <span className="text-gray-600">{truncateText(content.angle, 20)}</span>
                        </div>
                      )}
                      {content.intent && (
                        <div className="flex items-center gap-1">
                          <span className="font-medium text-gray-700">Intent:</span>
                          <span className="text-gray-600">{truncateText(content.intent, 25)}</span>
                        </div>
                      )}
                      {content.psychologicalTrigger && (
                        <div className="flex items-center gap-1">
                          <span className="font-medium text-gray-700">Trigger:</span>
                          <span className="text-gray-600">{truncateText(content.psychologicalTrigger, 15)}</span>
                        </div>
                      )}
                      {content.engagementObjective && (
                        <div className="flex items-center gap-1">
                          <span className="font-medium text-gray-700">Objective:</span>
                          <span className="text-gray-600">{truncateText(content.engagementObjective, 20)}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <GeneratedImageDisplay content={content} />
                  </TableCell>
                  <TableCell>
                    <ClientOnly fallback={<div className="text-sm text-gray-500">Loading...</div>}>
                      <div className="text-sm text-gray-500">
                        {content.scheduledTime ? formatDate(content.scheduledTime) : 'Not scheduled'}
                      </div>
                    </ClientOnly>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {onView && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onView(content)}
                          className="h-8 w-8 p-0"
                          title="View post details"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      )}
                      {onEdit && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            console.log('DEBUG: Edit button clicked for content:', content)
                            onEdit(content)
                          }}
                          className="h-8 w-8 p-0"
                          title="Edit post"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
                              onDelete(content)
                            }
                          }}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                          title="Delete post"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentContent.map((content) => (
            <Card key={content.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getPlatformIcon(content.platform)}
                    <CardTitle className="text-base">{getDisplayValue(content.platform)}</CardTitle>
                  </div>
                  <Badge 
                    variant={getStatusVariant(content.status) as any}
                    className={getStatusColor(content.status)}
                  >
                    {getDisplayValue(content.status)}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{getDisplayValue(content.contentType)}</Badge>
                  {content.characterCount && (
                    <span className="text-xs text-gray-500">
                      {content.characterCount} chars
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium text-sm mb-1">Hook:</p>
                  <p className="text-sm text-gray-700">{truncateText(content.hook, 100)}</p>
                </div>
                
                <div>
                  <p className="font-medium text-sm mb-1">Post:</p>
                  <p className="text-sm text-gray-700">{truncateText(content.post, 120)}</p>
                </div>

                {content.hashtags && (
                  <div className="flex items-center gap-1">
                    <Hash className="h-3 w-3 text-blue-600" />
                    <p className="text-xs text-blue-600">{truncateText(content.hashtags, 50)}</p>
                  </div>
                )}

                {content.scheduledTime && (
                  <ClientOnly>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />
                      {formatDate(content.scheduledTime)}
                    </div>
                  </ClientOnly>
                )}

                {/* Generated Images */}
                <div>
                  <p className="font-medium text-sm mb-2">Generated Images:</p>
                  <GeneratedImageDisplay content={content} />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <TrendingUp className="h-3 w-3" />
                    {content.engagementPrediction || 'N/A'}
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {onView && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView(content)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    {onEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(content)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
                            onDelete(content)
                          }
                        }}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredContent.length)} of {filteredContent.length} results
          </p>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}