'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useClientConfig } from '@/hooks/useClientConfig'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BlogPostCard } from '@/components/cards/BlogPostCard'
import { ViewToggle } from '@/components/ui/view-toggle'
import { 
  Plus, 
  Search, 
  FileText, 
  Calendar, 
  Tag, 
  Eye, 
  Edit, 
  Trash2,
  ArrowLeft,
  Loader2
} from 'lucide-react'

interface BlogPost {
  id: string
  title: string
  slug: string
  status: string
  created_at: string
  updated_at: string
  focus_keyword: string
  secondary_keywords: string
  seo_score: number
  word_count: number
  readability_score: number
  category: string
  tags: string
}

interface BlogPostFilters {
  status: string
  category: string
}

export default function BlogPostsPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.clientId as string
  
  const { clientConfig, isLoading: configLoading, error: configError } = useClientConfig(clientId)
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')
  const [filters, setFilters] = useState<BlogPostFilters>({
    status: 'all',
    category: 'all'
  })

  useEffect(() => {
    if (clientConfig) {
      fetchBlogPosts()
    }
  }, [clientConfig])

  const fetchBlogPosts = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/baserow/${clientId}/blog-posts`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch blog posts')
      }
      
      const data = await response.json()
      setBlogPosts(data.results || [])
    } catch (error) {
      console.error('Error fetching blog posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'published': return 'bg-green-100 text-green-800'
      case 'scheduled': return 'bg-blue-100 text-blue-800'
      case 'archived': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredBlogPosts = blogPosts.filter(post => {
    const matchesSearch = post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.focus_keyword?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filters.status === 'all' || post.status === filters.status
    const matchesCategory = filters.category === 'all' || post.category === filters.category
    
    return matchesSearch && matchesStatus && matchesCategory
  })

  const statusOptions = ['all', 'draft', 'published', 'scheduled', 'archived']
  const categories = [...new Set(blogPosts.map(post => post.category).filter(Boolean))]

  if (configLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading client configuration...</p>
          </div>
        </div>
      </div>
    )
  }

  if (configError || !clientConfig) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              {configError || 'Client not found'}
            </p>
            <Button 
              onClick={() => router.back()} 
              className="mt-4"
              variant="outline"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Button 
              onClick={() => router.push(`/dashboard/${clientId}`)} 
              variant="outline" 
              size="sm"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Blog Posts</h1>
              <p className="text-gray-600 mt-1">
                Manage your AI-generated blog content
              </p>
            </div>
          </div>
          <Button 
            onClick={() => router.push(`/dashboard/${clientId}/blog-posts/create`)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Blog Post
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Posts</p>
                  <p className="text-2xl font-bold">{blogPosts.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Badge className="bg-green-100 text-green-800">Published</Badge>
                <div>
                  <p className="text-sm text-gray-600">Published</p>
                  <p className="text-2xl font-bold">
                    {blogPosts.filter(post => post.status === 'published').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Badge className="bg-gray-100 text-gray-800">Draft</Badge>
                <div>
                  <p className="text-sm text-gray-600">Drafts</p>
                  <p className="text-2xl font-bold">
                    {blogPosts.filter(post => post.status === 'draft').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Avg. SEO Score</p>
                  <p className="text-2xl font-bold">
                    {blogPosts.length > 0 
                      ? Math.round(blogPosts.reduce((sum, post) => sum + (post.seo_score || 0), 0) / blogPosts.length)
                      : 0
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search blog posts by title or keyword..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(status => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <ViewToggle view={viewMode} onViewChange={setViewMode} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Blog Posts List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading blog posts...</p>
          </div>
        </div>
      ) : filteredBlogPosts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Blog Posts Found</h3>
            <p className="text-gray-600 mb-4">
              {blogPosts.length === 0 
                ? "You haven't created any blog posts yet."
                : "No blog posts match your current filters."
              }
            </p>
            {blogPosts.length === 0 && (
              <Button 
                onClick={() => router.push(`/dashboard/${clientId}/blog-posts/create`)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Blog Post
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBlogPosts.map((post) => (
            <BlogPostCard
              key={post.id}
              post={post}
              onView={(id) => router.push(`/dashboard/${clientId}/blog-posts/${id}`)}
              onEdit={(id) => router.push(`/dashboard/${clientId}/blog-posts/${id}`)}
            />
          ))}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredBlogPosts.map((post) => (
            <Card key={post.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {post.title || 'Untitled Blog Post'}
                      </h3>
                      <Badge className={getStatusColor(post.status)}>
                        {post.status || 'Draft'}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        <span>{post.focus_keyword || 'No keyword'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span>{post.word_count || 0} words</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{post.created_at ? new Date(post.created_at).toLocaleDateString() : 'No date'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">SEO Score:</span>
                        <span className={post.seo_score >= 80 ? 'text-green-600' : post.seo_score >= 60 ? 'text-yellow-600' : 'text-red-600'}>
                          {post.seo_score || 0}
                        </span>
                      </div>
                    </div>

                    {post.secondary_keywords && (
                      <div className="mb-3">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Keywords:</span> {post.secondary_keywords}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => router.push(`/dashboard/${clientId}/blog-posts/${post.id}`)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => router.push(`/dashboard/${clientId}/blog-posts/${post.id}`)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}