'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Edit3, Eye, Save, X } from 'lucide-react'

export interface BlogPostFormData {
  id?: number
  title: string
  slug: string
  content: string
  meta_title: string
  meta_description: string
  focus_keyword: string
  secondary_keywords: string
  status: string
  seo_score: number
  word_count: number
  readability_score: number
  scheduled_publish_date: string
  author_id: string
  featured_image_prompt: string
  featured_image_url?: string
  featured_image_alt?: string
  alt_texts: string
  internal_links: string
  external_sources: string
  category: string
  tags: string
  processing_log: string
}

interface BlogPostFormProps {
  initialData?: BlogPostFormData
  onSubmit: (data: BlogPostFormData) => void
  onCancel: () => void
  isLoading?: boolean
  mode: 'create' | 'edit' | 'view'
}

const statusOptions = [
  { value: 'Draft', label: 'Draft', color: 'gray' },
  { value: 'Review', label: 'Review', color: 'yellow' },
  { value: 'Published', label: 'Published', color: 'green' },
  { value: 'Scheduled', label: 'Scheduled', color: 'blue' }
]

const categoryOptions = [
  { value: 'Business Strategy', label: 'Business Strategy' },
  { value: 'Leadership', label: 'Leadership' },
  { value: 'Management', label: 'Management' },
  { value: 'Technology', label: 'Technology' }
]

export default function BlogPostForm({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isLoading = false,
  mode = 'edit'
}: BlogPostFormProps) {
  const [formData, setFormData] = useState<BlogPostFormData>(
    initialData ? {
      id: initialData.id,
      title: initialData.title || '',
      slug: initialData.slug || '',
      content: initialData.content || '',
      meta_title: initialData.meta_title || '',
      meta_description: initialData.meta_description || '',
      focus_keyword: initialData.focus_keyword || '',
      secondary_keywords: initialData.secondary_keywords || '',
      status: initialData.status || 'Draft',
      seo_score: initialData.seo_score || 0,
      word_count: initialData.word_count || 0,
      readability_score: initialData.readability_score || 0,
      scheduled_publish_date: initialData.scheduled_publish_date || '',
      author_id: initialData.author_id || '',
      featured_image_prompt: initialData.featured_image_prompt || '',
      featured_image_url: initialData.featured_image_url || '',
      featured_image_alt: initialData.featured_image_alt || '',
      alt_texts: initialData.alt_texts || '',
      internal_links: initialData.internal_links || '',
      external_sources: initialData.external_sources || '',
      category: initialData.category || '',
      tags: initialData.tags || '',
      processing_log: initialData.processing_log || ''
    } : {
      title: '',
      slug: '',
      content: '',
      meta_title: '',
      meta_description: '',
      focus_keyword: '',
      secondary_keywords: '',
      status: 'Draft',
      seo_score: 0,
      word_count: 0,
      readability_score: 0,
      scheduled_publish_date: '',
      author_id: '',
      featured_image_prompt: '',
      featured_image_url: '',
      featured_image_alt: '',
      alt_texts: '',
      internal_links: '',
      external_sources: '',
      category: '',
      tags: '',
      processing_log: ''
    }
  )

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleInputChange = (field: keyof BlogPostFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Content is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    onSubmit(formData)
  }

  const getStatusBadgeColor = (status: string) => {
    const option = statusOptions.find(opt => opt.value === status)
    return option?.color || 'gray'
  }

  const isReadOnly = mode === 'view'

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {mode === 'create' && <Edit3 className="h-5 w-5" />}
              {mode === 'edit' && <Edit3 className="h-5 w-5" />}
              {mode === 'view' && <Eye className="h-5 w-5" />}
              {mode === 'create' ? 'Create Blog Post' : mode === 'edit' ? 'Edit Blog Post' : 'View Blog Post'}
            </CardTitle>
            <CardDescription>
              {mode === 'create' && 'Create a new blog post'}
              {mode === 'edit' && 'Edit the blog post details'}
              {mode === 'view' && 'View blog post information'}
            </CardDescription>
          </div>
          {mode === 'view' && (
            <Badge variant="outline" className={`bg-${getStatusBadgeColor(formData.status)}-100`}>
              {formData.status}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter blog post title"
                className={errors.title ? 'border-red-500' : ''}
                readOnly={isReadOnly}
              />
              {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => handleInputChange('slug', e.target.value)}
                placeholder="URL-friendly slug"
                readOnly={isReadOnly}
              />
            </div>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Content *</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              placeholder="Write your blog post content here..."
              rows={8}
              className={errors.content ? 'border-red-500' : ''}
              readOnly={isReadOnly}
            />
            {errors.content && <p className="text-sm text-red-500">{errors.content}</p>}
          </div>

          {/* SEO Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="meta_title">Meta Title</Label>
              <Input
                id="meta_title"
                value={formData.meta_title}
                onChange={(e) => handleInputChange('meta_title', e.target.value)}
                placeholder="SEO meta title"
                readOnly={isReadOnly}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="focus_keyword">Focus Keyword</Label>
              <Input
                id="focus_keyword"
                value={formData.focus_keyword}
                onChange={(e) => handleInputChange('focus_keyword', e.target.value)}
                placeholder="Primary SEO keyword"
                readOnly={isReadOnly}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="meta_description">Meta Description</Label>
            <Textarea
              id="meta_description"
              value={formData.meta_description}
              onChange={(e) => handleInputChange('meta_description', e.target.value)}
              placeholder="SEO meta description (160 characters max)"
              rows={2}
              readOnly={isReadOnly}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="secondary_keywords">Secondary Keywords</Label>
              <Input
                id="secondary_keywords"
                value={formData.secondary_keywords}
                onChange={(e) => handleInputChange('secondary_keywords', e.target.value)}
                placeholder="Additional keywords"
                readOnly={isReadOnly}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleInputChange('category', value)}
                disabled={isReadOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => handleInputChange('tags', e.target.value)}
                placeholder="Comma-separated tags"
                readOnly={isReadOnly}
              />
            </div>
          </div>

          {/* Status and Publishing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange('status', value)}
                disabled={isReadOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduled_publish_date">Scheduled Publish Date</Label>
              <Input
                id="scheduled_publish_date"
                type="date"
                value={formData.scheduled_publish_date}
                onChange={(e) => handleInputChange('scheduled_publish_date', e.target.value)}
                readOnly={isReadOnly}
              />
            </div>
          </div>

          {/* SEO Scores (Read-only) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="seo_score">SEO Score</Label>
              <Input
                id="seo_score"
                type="number"
                value={formData.seo_score}
                readOnly
                className="bg-gray-50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="word_count">Word Count</Label>
              <Input
                id="word_count"
                type="number"
                value={formData.word_count}
                readOnly
                className="bg-gray-50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="readability_score">Readability Score</Label>
              <Input
                id="readability_score"
                type="number"
                value={formData.readability_score}
                readOnly
                className="bg-gray-50"
              />
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-2">
            <Label htmlFor="featured_image_prompt">Featured Image Prompt</Label>
            <Textarea
              id="featured_image_prompt"
              value={formData.featured_image_prompt}
              onChange={(e) => handleInputChange('featured_image_prompt', e.target.value)}
              placeholder="AI prompt for featured image generation"
              rows={2}
              readOnly={isReadOnly}
            />
          </div>

          {/* Featured Image */}
          <div className="space-y-2">
            <Label htmlFor="featured_image_url">Featured Image URL</Label>
            <Input
              id="featured_image_url"
              value={formData.featured_image_url || ''}
              onChange={(e) => handleInputChange('featured_image_url', e.target.value)}
              placeholder="https://example.com/image.jpg or upload/generate image"
              readOnly={isReadOnly}
            />
            {formData.featured_image_url && (
              <div className="mt-2 border rounded-lg p-2">
                <img 
                  src={formData.featured_image_url} 
                  alt={formData.featured_image_alt || 'Featured image'} 
                  className="w-full max-w-md rounded"
                  onError={(e) => {
                    e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23ddd" width="400" height="300"/%3E%3Ctext x="50%" y="50%" text-anchor="middle" fill="%23999"%3EImage not found%3C/text%3E%3C/svg%3E'
                  }}
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="featured_image_alt">Featured Image Alt Text</Label>
            <Input
              id="featured_image_alt"
              value={formData.featured_image_alt || ''}
              onChange={(e) => handleInputChange('featured_image_alt', e.target.value)}
              placeholder="Describe the image for SEO and accessibility"
              readOnly={isReadOnly}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="alt_texts">Alt Texts</Label>
              <Input
                id="alt_texts"
                value={formData.alt_texts}
                onChange={(e) => handleInputChange('alt_texts', e.target.value)}
                placeholder="Alt text for images"
                readOnly={isReadOnly}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="author_id">Author ID</Label>
              <Input
                id="author_id"
                value={formData.author_id}
                onChange={(e) => handleInputChange('author_id', e.target.value)}
                placeholder="Author identifier"
                readOnly={isReadOnly}
              />
            </div>
          </div>

          {/* Processing Log (Read-only) */}
          <div className="space-y-2">
            <Label htmlFor="processing_log">Processing Log</Label>
            <Textarea
              id="processing_log"
              value={formData.processing_log}
              readOnly
              rows={3}
              className="bg-gray-50"
            />
          </div>

          {/* Action Buttons */}
          {!isReadOnly && (
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
              >
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? 'Saving...' : mode === 'create' ? 'Create Post' : 'Save Changes'}
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}