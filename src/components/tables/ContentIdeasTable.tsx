'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  FileText, 
  Image, 
  Video, 
  Mic, 
  Link, 
  Lightbulb, 
  Plus, 
  Eye, 
  MessageSquare, 
  Palette, 
  ExternalLink,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react'
import ClientOnly from '@/components/ClientOnly'

interface ContentIdea {
  id: string
  title?: string
  idea_type?: string | { id: number; value: string; color: string }
  description?: string
  priority?: 'High' | 'Medium' | 'Low' | { id: number; value: string; color: string }
  status?: string | { id: number; value: string; color: string }
  created_date?: string
  target_audience?: string | { id: number; value: string; color: string }
  source_type?: string | { id: number; value: string; color: string }
  // Enhanced fields for integration
  socialMediaContentCount?: number
  brandAssetsCount?: number
  generationStatus?: 'pending' | 'processing' | 'completed' | 'failed' | 'none'
  lastGenerated?: string
}

interface ContentIdeasTableProps {
  contentIdeas: ContentIdea[]
  isLoading: boolean
  onCreateFirst: () => void
  onViewIdea?: (idea: ContentIdea) => void
  onViewSocialContent?: (ideaId: string) => void
  onViewBrandAssets?: (ideaId: string) => void
  onRegenerateContent?: (ideaId: string) => void
  clientPrimaryColor: string
  showEnhancedFeatures?: boolean
}

export default function ContentIdeasTable({ 
  contentIdeas, 
  isLoading, 
  onCreateFirst, 
  onViewIdea,
  onViewSocialContent,
  onViewBrandAssets,
  onRegenerateContent,
  clientPrimaryColor,
  showEnhancedFeatures = true
}: ContentIdeasTableProps) {

  
  const getIdeaTypeIcon = (type?: string | any) => {
    if (!type) return <FileText className="h-4 w-4" />
    
    // Handle Baserow select field format
    let typeValue = typeof type === 'object' && type.value ? type.value : type
    
    // Convert display value back to internal format for icon matching
    switch (typeValue) {
      case 'Blog Post':
      case 'blog_post': 
        return <FileText className="h-4 w-4" />
      case 'Social Media Post':
      case 'social_media_post': 
        return <Image className="h-4 w-4" />
      case 'Video Content':
      case 'video_content': 
        return <Video className="h-4 w-4" />
      case 'Voice Content':
      case 'voice_content': 
        return <Mic className="h-4 w-4" />
      case 'Product UVP':
      case 'product_uvp': 
        return <Lightbulb className="h-4 w-4" />
      case 'Email Campaign':
      case 'email_campaign': 
        return <Link className="h-4 w-4" />
      default: 
        return <FileText className="h-4 w-4" />
    }
  }

  const getPriorityVariant = (priority?: string | any) => {
    const priorityValue = typeof priority === 'object' && priority.value ? priority.value : priority
    
    switch (priorityValue) {
      case 'High': return 'destructive'
      case 'Medium': return 'default'
      case 'Low': return 'secondary'
      default: return 'outline'
    }
  }

  const formatIdeaType = (type?: string | any) => {
    if (!type) return 'Content'
    
    // Handle Baserow select field format {id, value, color}
    if (typeof type === 'object' && type.value) {
      return type.value
    }
    
    // Handle string format
    if (typeof type === 'string') {
      return type.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ')
    }
    
    return 'Content'
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return ''
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return ''
    }
  }

  const getGenerationStatusIcon = (status?: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />
      case 'processing': return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-500" />
      default: return null
    }
  }

  const getGenerationStatusText = (status?: string) => {
    switch (status) {
      case 'pending': return 'Pending'
      case 'processing': return 'Generating...'
      case 'completed': return 'Generated'
      case 'failed': return 'Failed'
      default: return 'Not generated'
    }
  }

  const getGenerationStatusColor = (status?: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-50'
      case 'processing': return 'text-blue-600 bg-blue-50'
      case 'completed': return 'text-green-600 bg-green-50'
      case 'failed': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const handleCardClick = (idea: ContentIdea) => {
    console.log('DEBUG: handleCardClick called, onViewIdea function:', onViewIdea?.toString().substring(0, 100))
    if (onViewIdea) {
      onViewIdea(idea)
    }
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-3">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (contentIdeas.length === 0) {
    return (
      <div className="col-span-full text-center py-12">
        <div className="max-w-md mx-auto">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No content ideas yet
          </h3>
          <p className="text-gray-500 mb-6">
            Get started by creating your first content idea. Choose from various content types and input methods.
          </p>
          <button
            onClick={onCreateFirst}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white shadow-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2"
            style={{ backgroundColor: clientPrimaryColor }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Idea
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {contentIdeas.map((idea) => (
        <Card key={idea.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {getIdeaTypeIcon(idea.idea_type)}
                <CardTitle className="text-lg truncate">
                  {idea.title || 'Untitled'}
                </CardTitle>
              </div>
              <Badge variant={getPriorityVariant(idea.priority) as any}>
                {typeof idea.priority === 'object' && idea.priority?.value ? idea.priority.value : (idea.priority || 'Medium')}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{formatIdeaType(idea.idea_type)}</span>
              {idea.source_type && (
                <>
                  <span>•</span>
                  <span className="capitalize">
                    {typeof idea.source_type === 'object' && idea.source_type?.value ? idea.source_type.value : idea.source_type}
                  </span>
                </>
              )}
            </div>
            <CardDescription className="line-clamp-2">
              {idea.description || 'No description provided'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Status and Date Row */}
            <div className="flex items-center justify-between">
              <Badge variant="outline">
                {typeof idea.status === 'object' && idea.status?.value ? idea.status.value : (idea.status || 'Draft')}
              </Badge>
              <ClientOnly>
                <div className="text-sm text-muted-foreground">
                  {formatDate(idea.created_date)}
                </div>
              </ClientOnly>
            </div>

            {/* Target Audience */}
            {idea.target_audience && (
              <div className="text-xs text-muted-foreground">
                Target: {typeof idea.target_audience === 'object' && idea.target_audience?.value 
                  ? idea.target_audience.value 
                  : (typeof idea.target_audience === 'string' ? idea.target_audience.replace(/_/g, ' ') : idea.target_audience)
                }
              </div>
            )}

            {/* Enhanced Features */}
            {showEnhancedFeatures && (
              <>
                {/* Generation Status */}
                {idea.generationStatus && idea.generationStatus !== 'none' && (
                  <div className="flex items-center gap-2">
                    {getGenerationStatusIcon(idea.generationStatus)}
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getGenerationStatusColor(idea.generationStatus)}`}
                    >
                      {getGenerationStatusText(idea.generationStatus)}
                    </Badge>
                    {idea.lastGenerated && (
                      <ClientOnly>
                        <span className="text-xs text-gray-500">
                          {formatDate(idea.lastGenerated)}
                        </span>
                      </ClientOnly>
                    )}
                  </div>
                )}

                {/* Content Counts */}
                <div className="flex items-center gap-4 text-xs text-gray-600">
                  {typeof idea.socialMediaContentCount === 'number' && (
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      <span>{idea.socialMediaContentCount} posts</span>
                    </div>
                  )}
                  {typeof idea.brandAssetsCount === 'number' && (
                    <div className="flex items-center gap-1">
                      <Palette className="h-3 w-3" />
                      <span>{idea.brandAssetsCount} assets</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-1">
                    {onViewIdea && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCardClick(idea)}
                        className="h-8 px-2"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View Posts
                      </Button>
                    )}
                    
                    {onViewBrandAssets && idea.brandAssetsCount && idea.brandAssetsCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          onViewBrandAssets(idea.id)
                        }}
                        className="h-8 px-2"
                      >
                        <Palette className="h-3 w-3 mr-1" />
                        Assets
                      </Button>
                    )}
                  </div>

                  {onRegenerateContent && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onRegenerateContent(idea.id)
                      }}
                      className="h-8 px-2"
                      disabled={idea.generationStatus === 'processing'}
                    >
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {idea.generationStatus === 'processing' ? 'Generating...' : 'Generate'}
                    </Button>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

