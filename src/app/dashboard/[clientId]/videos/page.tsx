'use client'

import { useState, useEffect } from 'react'
import { use } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Plus, Video as VideoIcon, RefreshCw, Filter, Play, Trash2, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { Video, VideoStatus, VideoType } from '@/lib/types/video'
import VideoGenerationForm from '@/components/forms/VideoGenerationForm'
import { VideoFormData } from '@/lib/types/video'

interface VideosPageProps {
  params: Promise<{
    clientId: string
  }>
}

export default function VideosPage({ params }: VideosPageProps) {
  const resolvedParams = use(params)
  const { clientId } = resolvedParams

  const [videos, setVideos] = useState<Video[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [filterStatus, setFilterStatus] = useState<VideoStatus | 'all'>('all')
  const [filterType, setFilterType] = useState<VideoType | 'all'>('all')

  // Fetch videos
  const fetchVideos = async () => {
    try {
      setIsLoading(true)
      
      let url = `/api/baserow/${clientId}/videos`
      const params = new URLSearchParams()
      
      if (filterStatus !== 'all') {
        params.append('videoStatus', filterStatus)
      }
      if (filterType !== 'all') {
        params.append('videoType', filterType)
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`
      }

      const response = await fetch(url)
      const data = await response.json()

      if (data.success) {
        setVideos(data.videos || [])
      } else {
        console.error('Failed to fetch videos:', data.error)
      }
    } catch (error) {
      console.error('Error fetching videos:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchVideos()
    
    // Poll for status updates every 10 seconds
    const interval = setInterval(fetchVideos, 10000)
    return () => clearInterval(interval)
  }, [clientId, filterStatus, filterType])

  // Handle video creation
  const handleCreateVideo = async (data: VideoFormData) => {
    try {
      // Check if we have files to upload
      const hasFiles = data.referenceImage || data.productPhoto
      
      let body: FormData | string
      let headers: HeadersInit = {}

      if (hasFiles) {
        // Use FormData for file uploads
        const formData = new FormData()
        
        // Add all fields to FormData
        Object.entries(data).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (key === 'referenceImage' || key === 'productPhoto') {
              // Add files
              if (value instanceof File) {
                formData.append(key, value)
              }
            } else {
              // Add regular fields
              formData.append(key, String(value))
            }
          }
        })
        
        body = formData
        // Don't set Content-Type header for FormData - browser will set it with boundary
      } else {
        // Use JSON for text-only requests
        headers = { 'Content-Type': 'application/json' }
        body = JSON.stringify(data)
      }

      const response = await fetch(`/api/baserow/${clientId}/videos`, {
        method: 'POST',
        headers,
        body
      })

      const result = await response.json()

      if (result.success) {
        alert('Video generation started! This may take a few minutes.')
        setShowCreateForm(false)
        await fetchVideos()
      } else {
        alert(`Error: ${result.error}`)
      }
    } catch (error) {
      console.error('Error creating video:', error)
      alert('Failed to create video. Please try again.')
    }
  }

  // Handle video deletion
  const handleDeleteVideo = async (videoId: number) => {
    if (!confirm('Are you sure you want to delete this video?')) {
      return
    }

    try {
      const response = await fetch(`/api/baserow/${clientId}/videos/${videoId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        alert('Video deleted successfully!')
        await fetchVideos()
      } else {
        alert(`Error: ${result.error}`)
      }
    } catch (error) {
      console.error('Error deleting video:', error)
      alert('Failed to delete video. Please try again.')
    }
  }

  // Get status badge color
  const getStatusBadgeVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'Completed':
        return 'default'
      case 'Failed':
        return 'destructive'
      case 'Pending':
      case 'Preparing':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle className="w-4 h-4" />
      case 'Failed':
        return <AlertCircle className="w-4 h-4" />
      case 'Pending':
      case 'Preparing':
        return <Clock className="w-4 h-4" />
      default:
        return <Loader2 className="w-4 h-4 animate-spin" />
    }
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <VideoIcon className="h-8 w-8 text-purple-600" />
            Video Ideas
          </h1>
          <p className="text-gray-600 mt-1">
            Generate and manage AI-powered videos
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={fetchVideos}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={() => setShowCreateForm(true)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Generate Video
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <div className="flex-1">
            <Label htmlFor="filterStatus" className="text-sm">Status</Label>
            <select
              id="filterStatus"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as VideoStatus | 'all')}
              className="w-full mt-1 px-3 py-2 border rounded-md"
            >
              <option value="all">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Generating Videos">Generating</option>
              <option value="Completed">Completed</option>
              <option value="Failed">Failed</option>
            </select>
          </div>
          <div className="flex-1">
            <Label htmlFor="filterType" className="text-sm">Type</Label>
            <select
              id="filterType"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as VideoType | 'all')}
              className="w-full mt-1 px-3 py-2 border rounded-md"
            >
              <option value="all">All Types</option>
              <option value="Text-to-Video">Text to Video</option>
              <option value="Image-to-Video">Image to Video</option>
              <option value="UGC Ad">UGC Ad</option>
              <option value="Social Post Video">Social Post</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Videos Grid */}
      {isLoading && videos.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      ) : videos.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <VideoIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No videos yet</h3>
            <p className="text-gray-600 mb-4">
              Generate your first AI video to get started
            </p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Generate Video
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <Card key={video.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <Badge variant={getStatusBadgeVariant(video.videoStatus?.value || 'Pending')} className="mb-2">
                      <span className="flex items-center gap-1">
                        {getStatusIcon(video.videoStatus?.value || 'Pending')}
                        {video.videoStatus?.value || 'Pending'}
                      </span>
                    </Badge>
                    <CardTitle className="text-base line-clamp-2">
                      {video.videoPrompt}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {video.videoType?.value || 'Video'} • {video.model?.value || 'AI'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Video Preview */}
                {video.videoUrl && video.videoStatus?.value === 'Completed' ? (
                  <div className="mb-4 bg-black rounded-lg overflow-hidden aspect-video">
                    <video
                      src={video.videoUrl}
                      controls
                      className="w-full h-full"
                      poster={video.thumbnailUrl || undefined}
                    >
                      Your browser does not support video playback.
                    </video>
                  </div>
                ) : (
                  <div className="mb-4 bg-gray-100 rounded-lg aspect-video flex items-center justify-center">
                    <VideoIcon className="w-12 h-12 text-gray-400" />
                  </div>
                )}

                {/* Video Info */}
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <span className="font-medium">{video.duration}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Aspect Ratio:</span>
                    <span className="font-medium">{video.aspectRatio?.value || 'N/A'}</span>
                  </div>
                  {video.platform && (
                    <div className="flex justify-between">
                      <span>Platform:</span>
                      <span className="font-medium">{video.platform.value}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Created:</span>
                    <span className="font-medium">
                      {new Date(video.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {video.videoUrl && video.videoStatus?.value === 'Completed' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => window.open(video.videoUrl, '_blank')}
                    >
                      <Play className="w-4 h-4 mr-1" />
                      Open
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteVideo(video.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* Error Message */}
                {video.errorMessage && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                    {video.errorMessage}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Video Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full h-[90vh] flex flex-col overflow-hidden">
            <VideoGenerationForm
              onSubmit={handleCreateVideo}
              onClose={() => setShowCreateForm(false)}
              clientId={clientId}
            />
          </div>
        </div>
      )}
    </div>
  )
}

