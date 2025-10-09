'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useClientConfig } from '@/hooks/useClientConfig'
import SocialMediaContentTable from '@/components/tables/SocialMediaContentTable'
import SocialMediaContentForm from '@/components/forms/SocialMediaContentForm'
import ClientOnly from '@/components/ClientOnly'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Plus, MessageSquare, TrendingUp, Calendar, Users } from 'lucide-react'
import { SocialMediaContent, SocialMediaContentFormData } from '@/lib/types/content'

export default function SocialMediaContentPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.clientId as string
  const [socialMediaContent, setSocialMediaContent] = useState<SocialMediaContent[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingContent, setEditingContent] = useState<SocialMediaContent | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [filteredForIdea, setFilteredForIdea] = useState<string | null>(null)
  const [stats, setStats] = useState({
    total: 0,
    byPlatform: {} as Record<string, number>,
    byStatus: {} as Record<string, number>,
    scheduled: 0,
    published: 0
  })
  
  const { clientConfig, isLoading: configLoading, error: configError } = useClientConfig(clientId)

  useEffect(() => {
    fetchSocialMediaContent()
  }, [clientId])

  const fetchSocialMediaContent = async () => {
    try {
      setIsLoading(true)
      
      // Check if we have an ideaId in the URL query parameters
      const urlParams = new URLSearchParams(window.location.search)
      const ideaId = urlParams.get('ideaId')
      
      let apiUrl = `/api/baserow/${clientId}/social-media-content`
      if (ideaId) {
        // If ideaId is provided, fetch content specific to that idea
        apiUrl = `/api/baserow/${clientId}/content-ideas/${ideaId}/social-media-content`
        setFilteredForIdea(ideaId)
      } else {
        setFilteredForIdea(null)
      }
      
      const response = await fetch(apiUrl)
      
      if (!response.ok) {
        throw new Error('Failed to fetch social media content')
      }
      
      const data = await response.json()
      const content = data.results || []
      setSocialMediaContent(content)
      
      // Calculate stats
      const newStats = {
        total: content.length,
        byPlatform: {} as Record<string, number>,
        byStatus: {} as Record<string, number>,
        scheduled: 0,
        published: 0
      }
      
      content.forEach((item: SocialMediaContent) => {
        // Get display values for Baserow objects
        const platformValue = typeof item.platform === 'object' && item.platform && 'value' in item.platform ? (item.platform as any).value : item.platform
        const statusValue = typeof item.status === 'object' && item.status && 'value' in item.status ? (item.status as any).value : item.status
        
        // Platform stats
        newStats.byPlatform[platformValue] = (newStats.byPlatform[platformValue] || 0) + 1
        
        // Status stats
        newStats.byStatus[statusValue] = (newStats.byStatus[statusValue] || 0) + 1
        
        // Scheduled and published counts
        if (statusValue && typeof statusValue === 'string') {
          if (statusValue.toLowerCase() === 'scheduled') newStats.scheduled++
          if (statusValue.toLowerCase() === 'published') newStats.published++
        }
      })
      
      setStats(newStats)
    } catch (error) {
      console.error('Error fetching social media content:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateContent = async (formData: SocialMediaContentFormData) => {
    try {
      const response = await fetch(`/api/baserow/${clientId}/social-media-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error('Failed to create social media content')
      }

      await fetchSocialMediaContent()
      setShowForm(false)
      
      // Show success message
      alert('Social media content created successfully!')
    } catch (error) {
      console.error('Error creating social media content:', error)
      alert('Error creating social media content. Please try again.')
    }
  }

  const handleEditContent = async (formData: SocialMediaContentFormData) => {
    if (!editingContent) return

    console.log('=== HANDLE EDIT CONTENT DEBUG ===')
    console.log('Editing content ID:', editingContent.id)
    console.log('Client ID:', clientId)
    console.log('Form data received:', formData)
    console.log('API URL:', `/api/baserow/${clientId}/social-media-content/${editingContent.id}`)

    try {
      console.log('Making API call...')
      const response = await fetch(`/api/baserow/${clientId}/social-media-content/${editingContent.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      console.log('API response status:', response.status)
      console.log('API response ok:', response.ok)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('API error response:', errorText)
        throw new Error(`Failed to update social media content: ${response.status} - ${errorText}`)
      }

      const result = await response.json()
      console.log('API success response:', result)

      await fetchSocialMediaContent()
      setEditingContent(null)
      setShowForm(false)
      
      // Show success message
      alert('Social media content updated successfully!')
    } catch (error) {
      console.error('Error updating social media content:', error)
      alert(`Error updating social media content: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleStatusUpdate = async (contentId: string, status: string) => {
    try {
      const response = await fetch(`/api/baserow/${clientId}/social-media-content/${contentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      })

      if (!response.ok) {
        throw new Error('Failed to update status')
      }

      await fetchSocialMediaContent()
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Error updating status. Please try again.')
    }
  }

  const handleViewContent = (content: SocialMediaContent) => {
    // For now, just show an alert with content details
    // In the future, this could open a detailed view modal
    alert(`Viewing content: ${content.hook}\n\nPost: ${content.post.substring(0, 100)}...`)
  }

  const handleEditClick = (content: SocialMediaContent) => {
    setEditingContent(content)
    setShowForm(true)
  }

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
                <MessageSquare className="h-8 w-8" />
                Social Media Content
                {filteredForIdea && (
                  <Badge variant="secondary" className="ml-2">
                    Filtered for Content Idea
                  </Badge>
                )}
              </h1>
              <p className="text-muted-foreground">
                {filteredForIdea 
                  ? `Showing social media posts for content idea ${filteredForIdea}`
                  : `Manage and track social media posts for ${clientConfig.name}`
                }
              </p>
            </div>
          </div>
          <Button
            onClick={() => {
              setEditingContent(null)
              setShowForm(true)
            }}
            style={{ backgroundColor: clientConfig.branding.primaryColor }}
            className="hover:opacity-90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Content
          </Button>
        </div>

        {/* Clear Filter Button */}
        {filteredForIdea && (
          <div className="flex justify-end mb-4">
            <Button
              variant="outline"
              onClick={() => {
                router.push(`/dashboard/${clientId}/social-media-content`)
              }}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              View All Content
            </Button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Content</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                Across all platforms
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Published</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.published}</div>
              <p className="text-xs text-muted-foreground">
                Live content
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.scheduled}</div>
              <p className="text-xs text-muted-foreground">
                Ready to publish
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Platforms</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Object.keys(stats.byPlatform).length}</div>
              <p className="text-xs text-muted-foreground">
                Active platforms
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Platform Breakdown */}
        {Object.keys(stats.byPlatform).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Platform Breakdown</CardTitle>
              <CardDescription>
                Content distribution across social media platforms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {Object.entries(stats.byPlatform).map(([platform, count]) => (
                  <Badge key={platform} variant="secondary" className="flex items-center gap-1">
                    {platform}: {count}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Status Breakdown */}
        {Object.keys(stats.byStatus).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Status Overview</CardTitle>
              <CardDescription>
                Current status of all social media content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {Object.entries(stats.byStatus).map(([status, count]) => (
                  <Badge 
                    key={status} 
                    variant={status.toLowerCase() === 'published' ? 'default' : 'outline'}
                    className="flex items-center gap-1"
                  >
                    {status}: {count}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Social Media Content Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Social Media Content</CardTitle>
            <CardDescription>
              View, edit, and manage all your social media posts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SocialMediaContentTable
              socialMediaContent={socialMediaContent}
              isLoading={isLoading}
              onEdit={handleEditClick}
              onView={handleViewContent}
              onStatusUpdate={handleStatusUpdate}
              clientPrimaryColor={clientConfig.branding.primaryColor}
              showContentIdea={true}
            />
          </CardContent>
        </Card>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg w-full max-w-6xl max-h-[95vh] overflow-y-auto">
              <div className="p-6">
                <SocialMediaContentForm
                  onSubmit={editingContent ? handleEditContent : handleCreateContent}
                  onClose={() => {
                    setShowForm(false)
                    setEditingContent(null)
                  }}
                  initialData={editingContent || undefined}
                  contentIdeaId={
                    editingContent?.contentIdea 
                      ? (Array.isArray(editingContent.contentIdea) 
                          ? editingContent.contentIdea[0] 
                          : typeof editingContent.contentIdea === 'object' 
                            ? (editingContent.contentIdea as any)?.id 
                            : editingContent.contentIdea)
                      : undefined
                  }
                  isEditing={!!editingContent}
                  clientName={clientConfig.name}
                  clientId={clientId}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </ClientOnly>
  )
}