'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { X, Calendar, Hash, MessageSquare, Target, Zap, TrendingUp, Image as ImageIcon, Sparkles, Eye, CheckCircle, XCircle } from 'lucide-react'
import { 
  SocialMediaContentFormData, 
  socialMediaContentFormSchema,
  SocialMediaContent,
  SOCIAL_MEDIA_PLATFORMS,
  SOCIAL_MEDIA_CONTENT_TYPES,
  SOCIAL_MEDIA_STATUS,
  ImageFormData,
  Image
} from '@/lib/types/content'
import ImageGenerationForm from './ImageGenerationForm'
import ImageBrowserModal from '@/components/modals/ImageBrowserModal'

interface SocialMediaContentFormProps {
  onSubmit: (data: SocialMediaContentFormData) => void
  onClose: () => void
  initialData?: Partial<SocialMediaContent>
  contentIdeaId?: string
  contentIdeaTitle?: string
  isEditing?: boolean
  isLoading?: boolean
  clientName?: string
  clientId?: string
}

export default function SocialMediaContentForm({
  onSubmit,
  onClose,
  initialData,
  contentIdeaId,
  contentIdeaTitle,
  isEditing = false,
  isLoading = false,
  clientName = 'Your Brand',
  clientId = 'modern-management'
}: SocialMediaContentFormProps) {
  const [characterCount, setCharacterCount] = useState(0)
  const [previewMode, setPreviewMode] = useState(false)
  const [showImageGeneration, setShowImageGeneration] = useState(false)
  const [showImageBrowser, setShowImageBrowser] = useState(false)
  const [generatedImages, setGeneratedImages] = useState<Image[]>([])
  const [selectedImage, setSelectedImage] = useState<Image | null>(null)
  const [selectedBrowsedImages, setSelectedBrowsedImages] = useState<Partial<Image>[]>([])
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [enlargedImage, setEnlargedImage] = useState<{url: string, alt: string} | null>(null)
  
  // Debug: Log initialData to see if there are any issues
  useEffect(() => {
    if (initialData) {
      console.log('=== INITIAL DATA DEBUG ===')
      console.log('initialData:', initialData)
      Object.keys(initialData).forEach(key => {
        console.log(`InitialData Key: "${key}", Value: ${(initialData as any)[key]}, Type: ${typeof (initialData as any)[key]}`)
      })
      
      // Special debug for image data
      if (initialData.images) {
        console.log('=== IMAGES DATA DEBUG ===')
        console.log('Images data:', initialData.images)
        console.log('Images type:', typeof initialData.images)
        console.log('Is array:', Array.isArray(initialData.images))
        if (Array.isArray(initialData.images)) {
          initialData.images.forEach((img: any, index: number) => {
            console.log(`Image ${index}:`, img)
            console.log(`Image ${index} keys:`, Object.keys(img))
          })
        } else if (typeof initialData.images === 'object') {
          console.log('Images object keys:', Object.keys(initialData.images))
        }
      }
      
      // Also check the old image field for debugging
      if (initialData.image) {
        console.log('=== OLD IMAGE FIELD DEBUG ===')
        console.log('Old image field data:', initialData.image)
      }
    }
  }, [initialData])

  // Initialize selected browsed images from initialData
  useEffect(() => {
    console.log('=== SELECTED IMAGES INITIALIZATION DEBUG ===')
    console.log('initialData?.images:', initialData?.images)
    console.log('Is array:', Array.isArray(initialData?.images))
    console.log('Length:', initialData?.images?.length)
    
    if (initialData?.images && Array.isArray(initialData.images) && initialData.images.length > 0) {
      console.log('Initializing selectedBrowsedImages from initialData.images:', initialData.images)
      
      // Convert the images data to the format expected by selectedBrowsedImages
      const convertedImages = (initialData.images && Array.isArray(initialData.images)) 
        ? initialData.images.map((img: any) => {
        // Extract image URL from various possible field structures
        let imageUrl = null
        
        // Check if image URL is already processed (from API mapping)
        if (img.image) {
          imageUrl = img.image
        }
        
        console.log('Converting image:', img.id, 'imageUrl:', imageUrl)
        
        return {
          id: img.id,
          image: imageUrl,
          imageId: img.imageid,
          imagePrompt: img.imageprompt,
          imageType: img.imagetype,
          imageScene: img.imagescene,
          imageStyle: img.imagestyle,
          imageStatus: img.imagestatus,
          createdAt: img.createdAt,
          // Handle any additional fields that might be present
          ...(img.imageLinkUrl && { imageLinkUrl: img.imageLinkUrl })
        }
      }).filter(img => img.id) // Only include images with valid IDs
        : []
      
      console.log('Converted images for selectedBrowsedImages:', convertedImages)
      setSelectedBrowsedImages(convertedImages)
    } else {
      // Reset if no images in initial data
      setSelectedBrowsedImages([])
    }
  }, [initialData])
  
  const getDisplayValue = (field: any) => {
    // Debug: Log the field being processed
    console.log('getDisplayValue called with:', field, 'Type:', typeof field)
    
    // Handle null/undefined
    if (field === null || field === undefined) {
      console.log('getDisplayValue: returning empty string for null/undefined')
      return ''
    }
    
    // Handle string/number directly
    if (typeof field === 'string' || typeof field === 'number') {
      console.log('getDisplayValue: returning string for string/number:', String(field))
      return String(field)
    }
    
    // Handle Baserow select field format {id, value, color}
    if (typeof field === 'object' && field !== null) {
      console.log('getDisplayValue: processing object:', field)
      if ('value' in field && field.value !== undefined) {
        console.log('getDisplayValue: returning value from object:', String(field.value))
        return String(field.value)
      }
      if ('id' in field && field.id !== undefined) {
        console.log('getDisplayValue: returning id from object:', String(field.id))
        return String(field.id)
      }
      // If it's an object but doesn't have value or id, try to stringify it
      console.log('getDisplayValue: object without value/id, stringifying:', JSON.stringify(field))
      return JSON.stringify(field)
    }
    
    // Handle arrays (like link_row fields)
    if (Array.isArray(field) && field.length > 0) {
      console.log('getDisplayValue: processing array:', field)
      const firstItem = field[0]
      if (typeof firstItem === 'object' && firstItem !== null) {
        if ('value' in firstItem && firstItem.value !== undefined) {
          console.log('getDisplayValue: returning value from array item:', String(firstItem.value))
          return String(firstItem.value)
        }
        if ('id' in firstItem && firstItem.id !== undefined) {
          console.log('getDisplayValue: returning id from array item:', String(firstItem.id))
          return String(firstItem.id)
        }
      }
      console.log('getDisplayValue: returning stringified first array item:', String(firstItem))
      return String(firstItem)
    }
    
    // Fallback: convert to string
    console.log('getDisplayValue: fallback string conversion:', String(field))
    return String(field)
  }

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<any>({
    resolver: zodResolver(socialMediaContentFormSchema),
    defaultValues: {
      hook: initialData?.hook || '',
      post: initialData?.post || '',
      cta: initialData?.cta || '',
      hashtags: initialData?.hashtags || '',
      platform: getDisplayValue(initialData?.platform) || 'Facebook',
      contentType: getDisplayValue(initialData?.contentType) || 'Image',
      imagePrompt: initialData?.imagePrompt || '',
      angle: initialData?.angle || '',
      intent: initialData?.intent || '',
      contentTheme: initialData?.contentTheme || '',
      psychologicalTrigger: initialData?.psychologicalTrigger || '',
      engagementObjective: initialData?.engagementObjective || '',
      status: getDisplayValue(initialData?.status) || 'In Review',
      scheduledTime: initialData?.scheduledTime || '',
      contentIdea: String(contentIdeaId || (
        // Handle Baserow link_row field format
        Array.isArray(initialData?.contentIdea) && initialData.contentIdea.length > 0
          ? (initialData.contentIdea[0] as any)?.id || (initialData.contentIdea[0] as any)?.value || ''
          : typeof initialData?.contentIdea === 'object' && initialData.contentIdea && 'id' in (initialData.contentIdea as any)
            ? (initialData.contentIdea as any).id
            : typeof initialData?.contentIdea === 'number'
              ? initialData.contentIdea
              : initialData?.contentIdea || ''
      ))
    }
  })

  // Debug: Log form default values
  useEffect(() => {
    console.log('=== FORM DEFAULT VALUES DEBUG ===')
    const defaultValues = {
      hook: initialData?.hook || '',
      post: initialData?.post || '',
      cta: initialData?.cta || '',
      hashtags: initialData?.hashtags || '',
      platform: getDisplayValue(initialData?.platform) || 'Facebook',
      contentType: getDisplayValue(initialData?.contentType) || 'Image',
      imagePrompt: initialData?.imagePrompt || '',
      angle: initialData?.angle || '',
      intent: initialData?.intent || '',
      contentTheme: initialData?.contentTheme || '',
      psychologicalTrigger: initialData?.psychologicalTrigger || '',
      engagementObjective: initialData?.engagementObjective || '',
      status: getDisplayValue(initialData?.status) || 'In Review',
      scheduledTime: initialData?.scheduledTime || '',
      contentIdea: contentIdeaId || (
        Array.isArray(initialData?.contentIdea) && initialData.contentIdea.length > 0
          ? String((initialData.contentIdea[0] as any)?.id || (initialData.contentIdea[0] as any)?.value || '')
          : typeof initialData?.contentIdea === 'object' && initialData.contentIdea && 'id' in (initialData.contentIdea as any)
            ? String((initialData.contentIdea as any).id)
            : typeof initialData?.contentIdea === 'number'
              ? String(initialData.contentIdea)
              : initialData?.contentIdea || ''
      )
    }
    
    console.log('Default values:', defaultValues)
    Object.keys(defaultValues).forEach(key => {
      console.log(`Default value for "${key}": ${defaultValues[key as keyof typeof defaultValues]}, Type: ${typeof defaultValues[key as keyof typeof defaultValues]}`)
    })
  }, [initialData, contentIdeaId])

  const watchedPost = watch('post')
  const watchedHook = watch('hook')
  const watchedCta = watch('cta')
  const watchedHashtags = watch('hashtags')
  const watchedPlatform = watch('platform')

  useEffect(() => {
    const totalLength = (watchedPost?.length || 0) + (watchedHook?.length || 0) + (watchedCta?.length || 0)
    setCharacterCount(totalLength)
  }, [watchedPost, watchedHook, watchedCta])

  const getCharacterLimit = (platform: string | any) => {
    // Handle Baserow select field format {id, value, color}
    const platformValue = typeof platform === 'object' && platform?.value ? platform.value : platform
    
    if (!platformValue || typeof platformValue !== 'string') {
      return 2000
    }
    
    switch (platformValue.toLowerCase()) {
      case 'twitter':
      case 'x': return 280
      case 'facebook': return 2000
      case 'instagram': return 2200
      case 'linkedin': return 3000
      case 'youtube': return 5000
      default: return 2000
    }
  }

  const characterLimit = getCharacterLimit(watchedPlatform)
  const isOverLimit = characterCount > characterLimit

  const onFormSubmit = (data: any) => {
    console.log('=== FORM SUBMISSION DEBUG ===')
    console.log('SocialMediaContentForm: onFormSubmit called with data:', data)
    console.log('SocialMediaContentForm: isEditing:', isEditing)
    console.log('SocialMediaContentForm: contentIdeaId:', contentIdeaId)
    console.log('SocialMediaContentForm: onSubmit function type:', typeof onSubmit)
    console.log('Form errors:', errors)
    console.log('Form state - isSubmitting:', isSubmitting)
    console.log('Form state - isLoading:', isLoading)
    console.log('Form state - isOverLimit:', isOverLimit)
    console.log('Character count:', characterCount, 'Limit:', characterLimit)
    
    // Debug: Log all form data keys and their types
    console.log('=== FORM DATA DEBUG ===')
    Object.keys(data).forEach(key => {
      console.log(`Key: "${key}", Value: ${data[key]}, Type: ${typeof data[key]}`)
    })
    
    // Check for any empty string keys or problematic data
    console.log('=== DATA VALIDATION DEBUG ===')
    const problematicKeys = Object.keys(data).filter(key => {
      const value = data[key]
      return key === '' || 
             (typeof value === 'number' && key !== 'characterCount') ||
             value === undefined ||
             value === null
    })
    
    if (problematicKeys.length > 0) {
      console.warn('Problematic keys found:', problematicKeys)
      problematicKeys.forEach(key => {
        console.warn(`Problematic key: "${key}", Value: ${data[key]}, Type: ${typeof data[key]}`)
      })
    }
    
    // Remove any empty string keys before processing
    const cleanData = { ...data }
    if ('' in cleanData) {
      console.warn('Removing empty string key from data')
      delete cleanData['']
    }
    
    // Clean the data to ensure all values are strings where expected
    const cleanedData = Object.keys(cleanData).reduce((acc, key) => {
      const value = cleanData[key]
      
      // Skip undefined, null, or empty string keys
      if (key === '' || key === undefined || key === null) {
        console.warn('Skipping invalid key:', key)
        return acc
      }
      
      if (key === 'contentIdea') {
        // Handle contentIdea specifically
        if (typeof value === 'number') {
          acc[key] = String(value)
        } else if (typeof value === 'object' && value && 'id' in value) {
          acc[key] = String(value.id)
        } else {
          acc[key] = value || ''
        }
      } else if (typeof value === 'number') {
        // Convert any other numbers to strings
        acc[key] = String(value)
      } else if (value === undefined || value === null) {
        // Convert undefined/null to empty string
        acc[key] = ''
      } else {
        acc[key] = value
      }
      return acc
    }, {} as any)
    
    console.log('Cleaned data:', cleanedData)
    console.log('Selected browsed images:', selectedBrowsedImages)
    console.log('Selected image IDs being sent:', selectedBrowsedImages.map(img => img.id).filter(Boolean))
    
    const processedData = {
      ...cleanedData,
      contentIdea: (
        // Handle contentIdeaId - extract ID if it's an object
        typeof contentIdeaId === 'object' && contentIdeaId && 'id' in contentIdeaId
          ? String((contentIdeaId as any).id)
          : typeof contentIdeaId === 'string'
            ? contentIdeaId
            : (
                // Fallback to data.contentIdea if contentIdeaId is not available
                typeof cleanedData.contentIdea === 'object' && cleanedData.contentIdea && 'id' in cleanedData.contentIdea
                  ? String((cleanedData.contentIdea as any).id)
                  : typeof cleanedData.contentIdea === 'number'
                    ? String(cleanedData.contentIdea)
                    : cleanedData.contentIdea
              )
      ),
      // Add selected images to the form data
      selectedImages: selectedBrowsedImages.map(img => img.id).filter(Boolean)
    } as SocialMediaContentFormData
    
    console.log('Processed data being sent to onSubmit:', processedData)
    
    try {
      onSubmit(processedData)
      console.log('onSubmit called successfully')
    } catch (error) {
      console.error('Error calling onSubmit:', error)
    }
  }

  // Image generation handlers
  const handleGenerateImage = async (imageData: ImageFormData | FormData) => {
    try {
      setIsGeneratingImage(true)
      console.log('Generating image with data:', imageData)

      // Get the current post content for prompt generation
      const postContent = watch('post') || ''
      const hookContent = watch('hook') || ''
      const combinedContent = `${hookContent} ${postContent}`.trim()

      // Call the image generation API
      let response: Response
      
      if (imageData instanceof FormData) {
        // If it's already FormData, add the social media content ID
        imageData.append('socialMediaContent', String(initialData?.id || ''))
        console.log('Sending FormData with file upload')
        response = await fetch(`/api/baserow/${clientId}/images`, {
          method: 'POST',
          body: imageData
        })
      } else {
        // If it's JSON data, prepare it properly
        const imageFormData: any = {
          ...imageData,
          socialMediaContent: initialData?.id || undefined
        }
        
        // Only remove undefined values for optional fields, keep required fields
        const requiredFields = ['imagePrompt', 'imageType', 'imageStyle', 'imageModel', 'imageSize']
        Object.keys(imageFormData).forEach(key => {
          if (imageFormData[key] === undefined && !requiredFields.includes(key)) {
            delete imageFormData[key]
          }
        })
        
        console.log('contentIdeaId:', contentIdeaId)
        console.log('Final imageFormData:', imageFormData)
        
        // Send JSON
        response = await fetch(`/api/baserow/${clientId}/images`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(imageFormData)
        })
      }

      if (!response.ok) {
        // Get the error details from the response
        const errorData = await response.json()
        console.error('API Error Response:', errorData)
        
        // Show specific error message
        const errorMessage = errorData.error || 'Failed to generate image'
        const details = errorData.details ? `\n\nDetails: ${JSON.stringify(errorData.details, null, 2)}` : ''
        alert(`Error: ${errorMessage}${details}`)
        
        throw new Error(`Failed to generate image: ${errorMessage}`)
      }

      const result = await response.json()
      console.log('Image generation result:', result)

      // Add the new image to the list
      setGeneratedImages(prev => [...prev, result.data])
      
      // Close the image generation modal
      setShowImageGeneration(false)
      
      alert('Image generation started! Check the Images page to see the result.')
    } catch (error) {
      console.error('Error generating image:', error)
      alert('Error generating image. Please try again.')
    } finally {
      setIsGeneratingImage(false)
    }
  }

  const handleSelectImage = (image: Image) => {
    setSelectedImage(image)
    // Update the form with the selected image URL
    setValue('imagePrompt', image.imagePrompt || '')
  }

  const handleBrowseImages = () => {
    setShowImageBrowser(true)
  }

  const handleSelectBrowsedImage = (image: Partial<Image>) => {
    // Add the image to the selected images array (avoid duplicates)
    setSelectedBrowsedImages(prev => {
      const exists = prev.some(img => img.id === image.id)
      if (exists) return prev
      return [...prev, image]
    })
    
    // Update the form with the selected image data
    setValue('imagePrompt', image.imagePrompt || '')
    console.log('Selected image from browser:', image)
    setShowImageBrowser(false)
  }

  const handleRemoveSelectedImage = (imageId: string) => {
    setSelectedBrowsedImages(prev => prev.filter(img => img.id !== imageId))
  }

  const handleImageClick = (imageUrl: string, altText: string) => {
    setEnlargedImage({ url: imageUrl, alt: altText })
  }

  const closeEnlargedImage = () => {
    setEnlargedImage(null)
  }

  // Debug validation errors
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      console.log('Form validation errors:', errors)
      
      // Check for empty string keys in errors
      const emptyStringErrors = Object.keys(errors).filter(key => key === '')
      if (emptyStringErrors.length > 0) {
        console.error('Found empty string key in validation errors:', errors)
      }
    }
  }, [errors])

  const formatPreviewText = (text: string) => {
    return text.split('\n').map((line, index) => (
      <span key={index}>
        {line}
        {index < text.split('\n').length - 1 && <br />}
      </span>
    ))
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">
            {isEditing ? 'Edit Social Media Content' : 'Create Social Media Content'}
          </h2>
          {contentIdeaTitle && (
            <p className="text-sm text-gray-500 mt-1">
              For content idea: "{contentIdeaTitle}"
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={previewMode ? 'default' : 'outline'}
            onClick={() => setPreviewMode(!previewMode)}
          >
            {previewMode ? 'Edit' : 'Preview'}
          </Button>
          <Button variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Section */}
        <div className="space-y-6">
          <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
            {/* Platform and Content Type */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="platform">Platform *</Label>
                <Select 
                  value={watch('platform')} 
                  onValueChange={(value) => setValue('platform', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(SOCIAL_MEDIA_PLATFORMS).map((platform) => (
                      <SelectItem key={platform} value={platform}>
                        {platform}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.platform && (
                  <p className="text-sm text-red-600">{errors.platform.message?.toString()}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contentType">Content Type *</Label>
                <Select 
                  value={watch('contentType')} 
                  onValueChange={(value) => setValue('contentType', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select content type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(SOCIAL_MEDIA_CONTENT_TYPES).map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.contentType && (
                  <p className="text-sm text-red-600">{errors.contentType.message?.toString()}</p>
                )}
              </div>
            </div>

            {/* Hook */}
            <div className="space-y-2">
              <Label htmlFor="hook">Hook *</Label>
              <Textarea
                id="hook"
                placeholder="Write an attention-grabbing hook..."
                className="min-h-[80px]"
                {...register('hook')}
              />
              {errors.hook && (
                <p className="text-sm text-red-600">{errors.hook.message?.toString()}</p>
              )}
            </div>

            {/* Post Content */}
            <div className="space-y-2">
              <Label htmlFor="post">Post Content *</Label>
              <Textarea
                id="post"
                placeholder="Write your main post content..."
                className="min-h-[120px]"
                {...register('post')}
              />
              {errors.post && (
                <p className="text-sm text-red-600">{errors.post.message?.toString()}</p>
              )}
            </div>

            {/* Call to Action */}
            <div className="space-y-2">
              <Label htmlFor="cta">Call to Action *</Label>
              <Input
                id="cta"
                placeholder="e.g., 'Learn more', 'Sign up today', 'Comment below'"
                {...register('cta')}
              />
              {errors.cta && (
                <p className="text-sm text-red-600">{errors.cta.message?.toString()}</p>
              )}
            </div>

            {/* Hashtags */}
            <div className="space-y-2">
              <Label htmlFor="hashtags">Hashtags</Label>
              <Input
                id="hashtags"
                placeholder="#marketing #socialmedia #business"
                {...register('hashtags')}
              />
              <p className="text-xs text-gray-500">
                Separate hashtags with spaces
              </p>
            </div>

            {/* Character Count */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">Character Count</span>
              </div>
              <Badge variant={isOverLimit ? 'destructive' : 'secondary'}>
                {characterCount} / {characterLimit}
              </Badge>
            </div>

            {/* Advanced Fields */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Content Strategy</CardTitle>
                <CardDescription>
                  Define the strategic elements of your content
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="angle">Angle</Label>
                    <Input
                      id="angle"
                      placeholder="e.g., Educational, Inspirational, Behind-the-scenes"
                      {...register('angle')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="intent">Intent</Label>
                    <Input
                      id="intent"
                      placeholder="e.g., Drive traffic, Increase engagement, Build awareness"
                      {...register('intent')}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contentTheme">Content Theme</Label>
                    <Input
                      id="contentTheme"
                      placeholder="e.g., Productivity, Innovation, Success"
                      {...register('contentTheme')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="psychologicalTrigger">Psychological Trigger</Label>
                    <Input
                      id="psychologicalTrigger"
                      placeholder="e.g., FOMO, Social proof, Curiosity"
                      {...register('psychologicalTrigger')}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="engagementObjective">Engagement Objective</Label>
                  <Input
                    id="engagementObjective"
                    placeholder="e.g., Comments, Shares, Clicks, Saves"
                    {...register('engagementObjective')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="imagePrompt">Image Prompt</Label>
                  <div className="flex gap-2">
                    <Textarea
                      id="imagePrompt"
                      placeholder="Describe the ideal image for this post..."
                      className="min-h-[60px] flex-1"
                      {...register('imagePrompt')}
                    />
                    <div className="flex flex-col gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowImageGeneration(true)}
                        disabled={isGeneratingImage}
                        className="whitespace-nowrap"
                      >
                        <Sparkles className="h-4 w-4 mr-1" />
                        {isGeneratingImage ? 'Generating...' : 'Generate Image'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleBrowseImages}
                        className="whitespace-nowrap"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Browse Images
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Selected Images Display */}
                {selectedBrowsedImages.length > 0 && (
                  <div className="space-y-2">
                    <Label>Selected Images</Label>
                    <div className="border rounded-lg p-4 bg-blue-50">
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {selectedBrowsedImages.map((image, index) => (
                          <div key={image.id || index} className="relative group">
                            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                              {(image.image || (image as any).imageLinkUrl) ? (
                                <img
                                  src={(image.image && image.image.length > 0 ? image.image[0].url : '') || (image as any).imageLinkUrl}
                                  alt={`Selected image ${index + 1}`}
                                  className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={() => handleImageClick(image.image || (image as any).imageLinkUrl || '', `Selected image ${index + 1}`)}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                  <ImageIcon className="h-8 w-8" />
                                </div>
                              )}
                              {/* Remove button */}
                              <button
                                type="button"
                                onClick={() => handleRemoveSelectedImage(image.id || '')}
                                className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                            <div className="mt-1 text-xs text-center">
                              <p className="font-medium truncate">Image #{(image as any).imageId || 'Unknown'}</p>
                              {image.imageType && (
                                <p className="text-gray-500 truncate">{typeof image.imageType === 'object' ? (image.imageType as any).value : image.imageType}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 text-sm text-gray-600">
                        <p>💡 <strong>Tip:</strong> These images are linked to your post. Click to view full size, or click the × to remove.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Linked Image Display */}
                {initialData?.images ? (
                  <div className="space-y-2">
                    <Label>Generated Images</Label>
                    <div className="border rounded-lg p-4 bg-gray-50">
                      {Array.isArray(initialData.images) && initialData.images.length > 0 ? (
                        // Handle array of linked images
                        <div className="space-y-3">
                          {(initialData.images && Array.isArray(initialData.images)) 
                            ? initialData.images.map((imageItem: any, index: number) => (
                            <div key={index} className="flex items-start gap-3">
                                                             {(imageItem as any).image && Array.isArray((imageItem as any).image) && (imageItem as any).image.length > 0 && (
                                 <div className="flex-shrink-0">
                                   <img 
                                     src={(imageItem as any).image && (imageItem as any).image.length > 0 ? (imageItem as any).image[0].url : ''} 
                                     alt={`Generated image ${index + 1}`}
                                     className="w-32 h-32 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
                                     onClick={() => handleImageClick(
                                       (imageItem as any).image[0].url || (imageItem as any).image[0], 
                                       `Generated image ${index + 1}`
                                     )}
                                   />
                                 </div>
                               )}
                              <div className="flex-1 min-w-0">
                                                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant={
                                  getDisplayValue((imageItem as any).imageStatus) === 'Completed' || 
                                  getDisplayValue((imageItem as any).imagestatus) === 'Completed' ||
                                  getDisplayValue((imageItem as any).status) === 'Completed' 
                                    ? 'default' 
                                    : 'secondary'
                                }>
                                  {getDisplayValue((imageItem as any).imageStatus) || 
                                   getDisplayValue((imageItem as any).imagestatus) || 
                                   getDisplayValue((imageItem as any).status) || 
                                   'Unknown'}
                                </Badge>
                                  {getDisplayValue((imageItem as any).imagePrompt) && (
                                    <span className="text-sm text-gray-600">
                                      "{getDisplayValue((imageItem as any).imagePrompt)}"
                                    </span>
                                  )}
                                </div>
                                {getDisplayValue((imageItem as any).captionText) && (
                                  <p className="text-sm text-gray-700">{getDisplayValue((imageItem as any).captionText)}</p>
                                )}
                              </div>
                            </div>
                          ))
                            : []
                        }
                        </div>
                                             ) : typeof initialData.images === 'object' && initialData.images ? (
                         // Handle single linked image object
                         <div className="flex items-start gap-3">
                                                       {(initialData.images as any).image && Array.isArray((initialData.images as any).image) && (initialData.images as any).image.length > 0 && (
                              <div className="flex-shrink-0">
                                <img 
                                  src={(initialData.images as any).image && (initialData.images as any).image.length > 0 ? (initialData.images as any).image[0].url : ''} 
                                  alt="Generated image"
                                  className="w-32 h-32 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={() => handleImageClick(
                                    (initialData.images as any).image[0].url || (initialData.images as any).image[0], 
                                    "Generated image"
                                  )}
                                />
                              </div>
                            )}
                           <div className="flex-1 min-w-0">
                                                       <div className="flex items-center gap-2 mb-2">
                             <Badge variant={
                               getDisplayValue((initialData.images as any).imageStatus) === 'Completed' || 
                               getDisplayValue((initialData.images as any).imagestatus) === 'Completed' ||
                               getDisplayValue((initialData.images as any).status) === 'Completed' 
                                 ? 'default' 
                                 : 'secondary'
                             }>
                               {getDisplayValue((initialData.images as any).imageStatus) || 
                                getDisplayValue((initialData.images as any).imagestatus) || 
                                getDisplayValue((initialData.images as any).status) || 
                                'Unknown'}
                             </Badge>
                               {getDisplayValue((initialData.images as any).imagePrompt) && (
                                 <span className="text-sm text-gray-600">
                                   "{getDisplayValue((initialData.images as any).imagePrompt)}"
                                 </span>
                               )}
                             </div>
                             {getDisplayValue((initialData.images as any).captionText) && (
                               <p className="text-sm text-gray-700">{getDisplayValue((initialData.images as any).captionText)}</p>
                             )}
                           </div>
                         </div>
                      ) : (
                        <p className="text-sm text-gray-500">No image data available</p>
                      )}
                    </div>
                  </div>
                ) : (
                  // No linked image - show option to generate
                  <div className="space-y-2">
                    <Label>Generated Image</Label>
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <div className="text-center py-8">
                        <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-sm text-gray-500 mb-4">No image has been generated for this post yet.</p>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowImageGeneration(true)}
                          disabled={isGeneratingImage}
                        >
                          <Sparkles className="h-4 w-4 mr-2" />
                          {isGeneratingImage ? 'Generating...' : 'Generate Image'}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Status and Scheduling */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Publishing</CardTitle>
                <CardDescription>
                  Set the status and schedule for this content
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select 
                      value={watch('status')} 
                      onValueChange={(value) => setValue('status', value as any)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(SOCIAL_MEDIA_STATUS).map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="scheduledTime">Scheduled Time</Label>
                    <Input
                      id="scheduledTime"
                      type="datetime-local"
                      {...register('scheduledTime')}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-4 pt-6 border-t">
              {/* Debug info */}
              <div className="text-xs text-gray-500 mr-auto">
                {isOverLimit && <span className="text-red-500">Over character limit ({characterCount}/{characterLimit})</span>}
                {isSubmitting && <span className="text-blue-500">Submitting...</span>}
                {isLoading && <span className="text-blue-500">Loading...</span>}
                {Object.keys(errors).length > 0 && <span className="text-red-500">Form has errors</span>}
              </div>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || isLoading}
                // Temporarily disabled character limit check for debugging
                // disabled={isSubmitting || isLoading || isOverLimit}
                onClick={() => {
                  console.log('Submit button clicked!')
                  console.log('Form state - isSubmitting:', isSubmitting)
                  console.log('Form state - isLoading:', isLoading)
                  console.log('Form state - isOverLimit:', isOverLimit)
                  console.log('Character count:', characterCount, 'Limit:', characterLimit)
                  console.log('Form errors:', errors)
                  console.log('Form is valid:', Object.keys(errors).length === 0)
                }}
              >
                {isSubmitting || isLoading ? 'Saving...' : (isEditing ? 'Update Content' : 'Create Content')}
              </Button>
            </div>
          </form>
        </div>

        {/* Preview Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
                             <CardTitle className="flex items-center gap-2">
                 <MessageSquare className="h-5 w-5" />
                 Preview - {String(watchedPlatform || 'Unknown Platform')}
               </CardTitle>
               <CardDescription>
                 How your content will appear on {String(watchedPlatform || 'Unknown Platform')}
               </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Hook Preview */}
              {watchedHook && (
                <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                  <p className="font-semibold text-blue-900 text-sm mb-1">Hook:</p>
                  <p className="text-blue-800">{formatPreviewText(watchedHook)}</p>
                </div>
              )}

              {/* Post Preview */}
              {watchedPost && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-semibold text-gray-900 text-sm mb-1">Post:</p>
                  <p className="text-gray-800 whitespace-pre-wrap">{formatPreviewText(watchedPost)}</p>
                </div>
              )}

              {/* CTA Preview */}
              {watchedCta && (
                <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
                  <p className="font-semibold text-green-900 text-sm mb-1">Call to Action:</p>
                  <p className="text-green-800 font-medium">{watchedCta}</p>
                </div>
              )}

              {/* Hashtags Preview */}
              {watchedHashtags && (
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="font-semibold text-purple-900 text-sm mb-1">Hashtags:</p>
                  <p className="text-purple-700">{watchedHashtags}</p>
                </div>
              )}

              {/* Platform-specific preview styling */}
              <div className="mt-6 p-4 border rounded-lg bg-white shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                  <div>
                    <p className="font-semibold text-sm">{clientName}</p>
                    <p className="text-xs text-gray-500">Just now</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {watchedHook && (
                    <p className="font-medium">{watchedHook}</p>
                  )}
                  {watchedPost && (
                    <p className="whitespace-pre-wrap">{watchedPost}</p>
                  )}
                  {watchedCta && (
                    <p className="font-medium text-blue-600">{watchedCta}</p>
                  )}
                  {watchedHashtags && (
                    <p className="text-blue-600 text-sm">{watchedHashtags}</p>
                  )}
                </div>

                {watch('imagePrompt') && (
                  <div className="mt-3 p-3 bg-gray-100 rounded-lg flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Image will be generated</span>
                  </div>
                )}

                {/* Selected Browsed Images Preview */}
                {selectedBrowsedImages.length > 0 && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-blue-900">
                        {selectedBrowsedImages.length} {selectedBrowsedImages.length === 1 ? 'Image' : 'Images'} Attached
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedBrowsedImages.map((image, index) => (
                        <div key={image.id || index} className="relative">
                          {(image.image || (image as any).imageLinkUrl) ? (
                            <img
                              src={(image.image && image.image.length > 0 ? image.image[0].url : '') || (image as any).imageLinkUrl}
                              alt={`Attached image ${index + 1}`}
                              className="w-full h-32 object-cover rounded"
                            />
                          ) : (
                            <div className="w-full h-32 bg-gray-100 rounded flex items-center justify-center">
                              <ImageIcon className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                          {image.imagePrompt && (
                            <p className="text-xs text-blue-700 mt-1 truncate">{image.imagePrompt}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Selected Image Preview */}
                {selectedImage && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-blue-900">Selected Image</span>
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedImage(null)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    {selectedImage.image && (
                      <img
                        src={selectedImage.image && selectedImage.image.length > 0 ? selectedImage.image[0].url : ''}
                        alt="Selected image"
                        className="w-full h-32 object-cover rounded"
                      />
                    )}
                    <p className="text-xs text-blue-700 mt-1">{selectedImage.imagePrompt}</p>
                  </div>
                )}

                {/* Generated Images List */}
                {generatedImages.length > 0 && (
                  <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-green-900">Generated Images</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setGeneratedImages([])}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {generatedImages.slice(0, 4).map((image, index) => (
                        <div
                          key={index}
                          className="relative cursor-pointer group"
                          onClick={() => handleSelectImage(image)}
                        >
                          {image.image && (
                            <img
                              src={image.image && image.image.length > 0 ? image.image[0].url : ''}
                              alt={`Generated image ${index + 1}`}
                              className="w-full h-20 object-cover rounded border-2 border-transparent group-hover:border-blue-400"
                            />
                          )}
                          <div className="absolute top-1 right-1">
                            <Badge variant="secondary" className="text-xs">
                              {image.imageStatus}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Content Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Content Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Character Count</span>
                <Badge variant={isOverLimit ? 'destructive' : 'secondary'}>
                  {characterCount}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Platform Limit</span>
                <Badge variant="outline">{characterLimit}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Hashtag Count</span>
                <Badge variant="outline">
                  {watchedHashtags ? watchedHashtags.split('#').length - 1 : 0}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

             {/* Image Generation Modal */}
       {showImageGeneration && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
           <div className="bg-white rounded-lg w-full max-w-4xl max-h-[95vh] overflow-y-auto">
             <ImageGenerationForm
               onSubmit={handleGenerateImage}
               onClose={() => setShowImageGeneration(false)}
               postText={watch('post') || ''}
                              clientId={typeof contentIdeaId === 'string' ? contentIdeaId.split('/')[0] : 'modern-management'}
             />
           </div>
         </div>
       )}

       {/* Image Browser Modal */}
       <ImageBrowserModal
        isOpen={showImageBrowser}
        onClose={() => setShowImageBrowser(false)}
        onSelectImage={handleSelectBrowsedImage}
        clientId={clientId}
      />

       {/* Enlarged Image Modal */}
       {enlargedImage && (
         <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50" onClick={closeEnlargedImage}>
           <div className="relative max-w-4xl max-h-[90vh] flex items-center justify-center">
             <button
               onClick={closeEnlargedImage}
               className="absolute top-4 right-4 z-10 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 transition-all"
             >
               <X className="h-6 w-6 text-gray-800" />
             </button>
             <img
               src={enlargedImage.url}
               alt={enlargedImage.alt}
               className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
               onClick={(e) => e.stopPropagation()}
             />
           </div>
         </div>
       )}
     </div>
   )
 }