'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useClientConfig } from '@/hooks/useClientConfig'
import BlogPostForm, { BlogPostFormData } from '@/components/forms/BlogPostForm'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Edit, Eye, Save, X, Send } from 'lucide-react'
import { toast } from 'sonner'

export default function BlogPostDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { clientConfig, isLoading: configLoading, error: configError } = useClientConfig(params.clientId as string)
  
  const [blogPost, setBlogPost] = useState<BlogPostFormData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const postId = params.postId as string

  useEffect(() => {
    if (!clientConfig || !postId) return

    const fetchBlogPost = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch(`/api/baserow/${clientConfig.id}/blog-posts/${postId}`)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch blog post: ${response.statusText}`)
        }

        const data = await response.json()
        setBlogPost(data)
      } catch (err) {
        console.error('Error fetching blog post:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch blog post')
      } finally {
        setIsLoading(false)
      }
    }

    fetchBlogPost()
  }, [clientConfig, postId])

  const handleSave = async (formData: BlogPostFormData) => {
    if (!clientConfig || !postId) return

    try {
      setIsSaving(true)
      setError(null)

      console.log('💾 Saving blog post with data:', JSON.stringify(formData, null, 2))
      console.log('💾 Featured image value:', formData.featured_image, 'Type:', typeof formData.featured_image)

      const response = await fetch(`/api/baserow/${clientConfig.id}/blog-posts/${postId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`Failed to update blog post: ${response.statusText}${errorData.details ? ` - ${errorData.details}` : ''}`)
      }

      const updatedBlogPost = await response.json()
      setBlogPost(updatedBlogPost)
      setIsEditing(false)
    } catch (err) {
      console.error('Error updating blog post:', err)
      setError(err instanceof Error ? err.message : 'Failed to update blog post')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setError(null)
  }

  const handlePublishToWordPress = async () => {
    if (!clientConfig || !postId) return

    try {
      setIsPublishing(true)
      
      toast.info('Publishing to WordPress...', { duration: 3000 })

      const response = await fetch('/api/blog/publish-to-wordpress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: clientConfig.id,
          blogPostId: postId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.details || 'Failed to publish to WordPress')
      }

      const result = await response.json()
      console.log('WordPress publish result:', result)
      
      toast.success('Blog post published to WordPress successfully!', { duration: 5000 })
    } catch (err) {
      console.error('Error publishing to WordPress:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to publish to WordPress')
    } finally {
      setIsPublishing(false)
    }
  }

  if (configLoading || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    )
  }

  if (configError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{configError}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
            <Button 
              variant="outline" 
              onClick={() => router.push(`/dashboard/${clientConfig?.id}/blog-posts`)}
              className="mt-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Blog Posts
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!blogPost) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Blog Post Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>The requested blog post could not be found.</p>
            <Button 
              variant="outline" 
              onClick={() => router.push(`/dashboard/${clientConfig?.id}/blog-posts`)}
              className="mt-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Blog Posts
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/${clientConfig?.id}/blog-posts`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{blogPost.title || 'Untitled'}</h1>
            <p className="text-gray-600">
              {isEditing ? 'Editing blog post' : 'Viewing blog post'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <>
              <Badge variant="outline" className="mr-2">
                {blogPost.status}
              </Badge>
              
              {/* Publish to WordPress button - show if approved/published and has scheduled date */}
              {(blogPost.status === 'Approved' || blogPost.status === 'Published') && blogPost.scheduled_publish_date && (
                <Button 
                  onClick={handlePublishToWordPress}
                  disabled={isPublishing}
                  variant="default"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isPublishing ? 'Publishing...' : 'Publish to WordPress'}
                </Button>
              )}
              
              <Button onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={handleCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Blog Post Form */}
      <BlogPostForm
        initialData={blogPost}
        onSubmit={handleSave}
        onCancel={handleCancel}
        isLoading={isSaving}
        mode={isEditing ? 'edit' : 'view'}
        clientId={clientConfig.id}
      />
    </div>
  )
}
