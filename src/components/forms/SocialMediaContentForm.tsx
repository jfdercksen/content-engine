'use client'

import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { X, Calendar, Hash, MessageSquare, Target, Zap, TrendingUp, Image as ImageIcon, Sparkles, Eye, CheckCircle, XCircle, Upload } from 'lucide-react'
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
  const [uploadedImages, setUploadedImages] = useState<Partial<Image>[]>([])
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [enlargedImage, setEnlargedImage] = useState<{url: string, alt: string} | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
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
    console.log('=== IMAGE SELECTION DEBUG ===')
    console.log('Raw image data received:', image)
    
    // Extract the image URL properly
    let imageUrl = null
    if ((image as any).imageLinkUrl) {
      imageUrl = (image as any).imageLinkUrl
    } else if (image.image && Array.isArray(image.image) && image.image.length > 0) {
      imageUrl = image.image[0].url
    }
    
    console.log('Extracted imageUrl:', imageUrl)
    
    // Create the image object with the correct URL
    const imageWithUrl = {
      ...image,
      image: imageUrl, // Store the URL string directly
      imageUrl: imageUrl // Also store as imageUrl for compatibility
    } as any
    
    console.log('Image with URL:', imageWithUrl)
    
    // Add the image to the selected images array (avoid duplicates)
    setSelectedBrowsedImages(prev => {
      const exists = prev.some(img => img.id === image.id)
      if (exists) return prev
      return [...prev, imageWithUrl]
    })
    
    // Update the form with the selected image data
    setValue('imagePrompt', image.imagePrompt || '')
    console.log('Selected image from browser:', imageWithUrl)
    setShowImageBrowser(false)
  }

  const handleRemoveSelectedImage = (imageId: string) => {
    setSelectedBrowsedImages(prev => prev.filter(img => img.id !== imageId))
  }

  const handleUploadImage = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB')
      return
    }

    try {
      setIsUploadingImage(true)
      
      // Create FormData for upload
      const formData = new FormData()
      formData.append('imageFile', file)
      formData.append('position', 'Social Media Post')
      formData.append('clientId', clientId)

      console.log('Uploading image:', file.name, file.size, 'bytes')

      // Upload to the images API
      const response = await fetch(`/api/baserow/${clientId}/images`, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to upload image')
      }

      const result = await response.json()
      console.log('Image upload result:', result)

      // Add the uploaded image to our list
      const uploadedImage = {
        id: result.id,
        image: result.url,
        imageUrl: result.url,
        imagePrompt: `Uploaded image: ${file.name}`,
        imageStatus: 'Completed',
        imageType: 'Uploaded Image',
        imageScene: 'Social Media Post',
        imageStyle: 'Photorealistic',
        imageModel: 'Local Upload',
        imageSize: 'Original',
        imageLinkUrl: result.url,
        client_id: clientId,
        created_at: new Date().toISOString(),
        isUploaded: true
      }

      setUploadedImages(prev => [...prev, uploadedImage])
      
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      console.log('Image uploaded successfully:', uploadedImage)

    } catch (error) {
      console.error('Error uploading image:', error)
      alert(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleRemoveUploadedImage = (imageId: string) => {
    setUploadedImages(prev => prev.filter(img => img.id !== imageId))
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
    <div className="h-screen flex flex-col bg-gray-50 max-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Edit post' : 'Create post'}
          </h2>
          {contentIdeaTitle && (
            <Badge variant="outline" className="text-xs">
              {contentIdeaTitle}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
            Copy link
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Column - Editing Interface */}
        <div className="w-1/2 bg-white border-r border-gray-200 flex flex-col min-h-0">
          <form onSubmit={handleSubmit(onFormSubmit)} className="flex-1 flex flex-col min-h-0">
            {/* Platform Selection */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-xs font-bold">f</span>
                  </div>
                <Select 
                  value={watch('platform')} 
                  onValueChange={(value) => setValue('platform', value as any)}
                >
                    <SelectTrigger className="w-32 border-0 shadow-none font-medium">
                      <SelectValue placeholder="POST" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(SOCIAL_MEDIA_PLATFORMS).map((platform) => (
                      <SelectItem key={platform} value={platform}>
                        {platform}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                </div>
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs">📷</span>
                </div>
                <Button variant="ghost" size="sm" className="w-8 h-8 rounded-lg border border-gray-300 hover:bg-gray-50">
                  <span className="text-gray-400">+</span>
                </Button>
              </div>
              </div>

            {/* Content Editing Area */}
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-4">
                {/* Post Content */}
                <div className="space-y-3">
                  <Textarea
                    placeholder="What's on your mind?"
                    className="min-h-[200px] border-0 resize-none text-lg placeholder:text-gray-400 focus:ring-0 focus:border-0 p-0"
                    {...register('post')}
                  />
                  {errors.post && (
                    <p className="text-sm text-red-600">{errors.post.message?.toString()}</p>
                  )}
            </div>

            {/* Hook */}
            <div className="space-y-2">
              <Textarea
                    placeholder="Add a compelling hook..."
                    className="min-h-[60px] border border-gray-200 rounded-lg resize-none placeholder:text-gray-400"
                {...register('hook')}
              />
              {errors.hook && (
                <p className="text-sm text-red-600">{errors.hook.message?.toString()}</p>
              )}
            </div>

            {/* Call to Action */}
            <div className="space-y-2">
              <Input
                    placeholder="Call to action (e.g., Learn more, Sign up today)"
                    className="border border-gray-200 rounded-lg"
                {...register('cta')}
              />
              {errors.cta && (
                <p className="text-sm text-red-600">{errors.cta.message?.toString()}</p>
              )}
            </div>

            {/* Hashtags */}
            <div className="space-y-2">
              <Input
                    placeholder="Add hashtags..."
                    className="border border-gray-200 rounded-lg"
                {...register('hashtags')}
              />
            </div>
              </div>
            </div>

            {/* Attached Media Preview */}
            {(selectedBrowsedImages.length > 0 || generatedImages.length > 0 || uploadedImages.length > 0) && (
              <div className="p-4 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-medium text-gray-700">Attached Media</span>
                  </div>
                <div className="flex gap-2 overflow-x-auto">
                  {selectedBrowsedImages.map((image) => (
                    <div key={image.id} className="relative flex-shrink-0">
                      <img
                        src={image.image || (image as any).imageUrl || '/placeholder-image.jpg'}
                        alt={image.imagePrompt || 'Selected image'}
                        className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                        onError={(e) => {
                          console.log('Attached media image failed to load')
                          const target = e.target as HTMLImageElement
                          target.src = '/placeholder-image.jpg'
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white hover:bg-red-600 p-0"
                        onClick={() => handleRemoveSelectedImage(image.id || '')}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                  </div>
                  ))}
                  {generatedImages.map((image, index) => (
                    <div key={index} className="flex-shrink-0">
                      <img
                        src={image.image || (image as any).imageUrl || '/placeholder-image.jpg'}
                        alt={image.imagePrompt || 'Generated image'}
                        className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                        onError={(e) => {
                          console.log('Generated image failed to load')
                          const target = e.target as HTMLImageElement
                          target.src = '/placeholder-image.jpg'
                        }}
                    />
                  </div>
                  ))}
                  {uploadedImages.map((image) => (
                    <div key={image.id} className="relative flex-shrink-0">
                      <img
                        src={image.image || (image as any).imageUrl || '/placeholder-image.jpg'}
                        alt={image.imagePrompt || 'Uploaded image'}
                        className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                        onError={(e) => {
                          console.log('Uploaded image failed to load')
                          const target = e.target as HTMLImageElement
                          target.src = '/placeholder-image.jpg'
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white hover:bg-red-600 p-0"
                        onClick={() => handleRemoveUploadedImage(image.id || '')}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                  </div>
                  ))}
                </div>
                </div>
            )}

            {/* Action Icons */}
            <div className="p-4 border-t border-gray-100">
              <div className="flex items-center gap-4">
                      <Button
                        type="button"
                  variant="ghost"
                        size="sm"
                        onClick={() => setShowImageGeneration(true)}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
                      >
                  <ImageIcon className="w-4 h-4" />
                  <span className="text-sm">Generate</span>
                      </Button>
                      <Button
                        type="button"
                  variant="ghost"
                        size="sm"
                        onClick={handleBrowseImages}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
                      >
                  <Sparkles className="w-4 h-4" />
                  <span className="text-sm">Browse</span>
                      </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleUploadImage}
                  disabled={isUploadingImage}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
                >
                  {isUploadingImage ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  <span className="text-sm">{isUploadingImage ? 'Uploading...' : 'Upload'}</span>
                </Button>
                        <Button
                          type="button"
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
                >
                  <Hash className="w-4 h-4" />
                  <span className="text-sm">Hashtags</span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
                >
                  <Target className="w-4 h-4" />
                  <span className="text-sm">Location</span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
                >
                  <Zap className="w-4 h-4" />
                  <span className="text-sm">Link</span>
                        </Button>
                      </div>
                    </div>

            {/* Global Presets */}
            <div className="p-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Global presets</span>
                <Button variant="ghost" size="sm">
                  <span className="text-gray-400">▼</span>
                </Button>
                  </div>
            </div>

            {/* Bottom Controls */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button type="button" variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                    🗑️
                  </Button>
                  </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <Input
                      type="datetime-local"
                      className="w-48 border border-gray-300 rounded-lg text-sm"
                      {...register('scheduledTime')}
                    />
                  </div>
                  <Button type="button" variant="ghost" size="sm">
                    Duplicate ▼
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || isLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                  >
                    {isSubmitting || isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {isEditing ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      isEditing ? 'Update' : 'Create'
                    )}
              </Button>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Right Column - Preview */}
        <div className="w-1/2 bg-gray-50 flex flex-col min-h-0">
          {/* Preview Header */}
          <div className="p-4 bg-white border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs font-bold">f</span>
                </div>
                <span className="font-medium text-gray-900">Facebook</span>
                </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="text-gray-500">
                  Notes
                </Button>
                <Button variant="ghost" size="sm" className="text-gray-500">
                  <Eye className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-gray-500">
                  📱
                </Button>
                <Button variant="ghost" size="sm" className="text-gray-500">
                  🖥️
                </Button>
                </div>
                </div>
          </div>

          {/* Preview Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Profile Header */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">{clientName.charAt(0)}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{clientName}</h3>
                    <p className="text-sm text-gray-500">Just now</p>
                  </div>
                  </div>
                </div>
                
              {/* Post Content */}
              <div className="p-4">
                <div className="space-y-3">
                  {/* Hook */}
                  {watchedHook && (
                    <p className="text-gray-900 font-medium">
                      {formatPreviewText(watchedHook)}
                    </p>
                  )}
                  
                  {/* Main Post */}
                  {watchedPost && (
                    <p className="text-gray-900 leading-relaxed">
                      {formatPreviewText(watchedPost)}
                    </p>
                  )}

                  {/* Call to Action */}
                  {watchedCta && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-blue-800 font-medium text-sm">
                        {watchedCta}
                      </p>
                    </div>
                  )}

                  {/* Hashtags */}
                  {watchedHashtags && (
                    <div className="flex flex-wrap gap-1">
                      {watchedHashtags.split(' ').map((tag: string, index: number) => (
                        tag.trim() && (
                          <span key={index} className="text-blue-600 text-sm hover:underline cursor-pointer">
                            #{tag.trim()}
                          </span>
                        )
                      ))}
                </div>
                  )}

                  {/* Location/Event Info */}
                  {(watchedCta || watchedHashtags) && (
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Target className="w-4 h-4" />
                        <span>St Stithians College</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>This weekend!</span>
                      </div>
                  </div>
                )}
                      </div>
                    </div>

              {/* Main Image */}
              {(selectedBrowsedImages.length > 0 || generatedImages.length > 0 || uploadedImages.length > 0) && (
                <div className="relative">
                  <img
                    src={selectedBrowsedImages[0]?.image || (selectedBrowsedImages[0] as any)?.imageUrl || generatedImages[0]?.image || (generatedImages[0] as any)?.imageUrl || uploadedImages[0]?.image || (uploadedImages[0] as any)?.imageUrl || '/placeholder-image.jpg'}
                    alt={selectedBrowsedImages[0]?.imagePrompt || generatedImages[0]?.imagePrompt || uploadedImages[0]?.imagePrompt || 'Post image'}
                    className="w-full h-64 object-cover"
                    onError={(e) => {
                      console.log('Preview image failed to load')
                      const target = e.target as HTMLImageElement
                      target.src = '/placeholder-image.jpg'
                    }}
                  />
                  {/* Only show red banner if there's a CTA and a valid image */}
                  {watchedCta && (selectedBrowsedImages[0]?.image || (selectedBrowsedImages[0] as any)?.imageUrl || generatedImages[0]?.image || (generatedImages[0] as any)?.imageUrl || uploadedImages[0]?.image || (uploadedImages[0] as any)?.imageUrl) && (
                    <div className="absolute bottom-0 left-0 right-0 bg-red-600 text-white p-3">
                      <p className="text-center font-medium text-sm">
                        PLEASE JOIN US TODAY, TOMORROW AND SUNDAY FOR
                      </p>
                    </div>
                  )}
                  </div>
                )}

              {/* Engagement Bar */}
              <div className="p-3 border-t border-gray-100">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>👍 12 likes</span>
                  <span>💬 3 comments</span>
                  <span>🔄 1 share</span>
                    </div>
                          </div>
                        </div>

            {/* Character Count */}
            <div className="mt-4 max-w-md mx-auto">
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">Character Count</span>
                </div>
                <Badge variant={isOverLimit ? 'destructive' : 'secondary'}>
                  {characterCount} / {characterLimit}
                </Badge>
              </div>
              </div>
              </div>
        </div>
      </div>

      {/* Hidden file input for image upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

             {/* Image Generation Modal */}
       {showImageGeneration && (
             <ImageGenerationForm
               onSubmit={handleGenerateImage}
               onClose={() => setShowImageGeneration(false)}
          clientId={clientId}
          initialData={{
            imagePrompt: watch('imagePrompt') || '',
            imageType: 'Social Media Post',
            imageStyle: 'Modern',
            imageModel: 'DALL-E 3',
            imageSize: '1024x1024'
          }}
        />
      )}

      {/* Image Browser Modal */}
      {showImageBrowser && (
        <ImageBrowserModal
          clientId={clientId}
          onSelectImage={handleSelectBrowsedImage}
          onClose={() => setShowImageBrowser(false)}
          isOpen={showImageBrowser}
        />
       )}

       {/* Enlarged Image Modal */}
       {enlargedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={closeEnlargedImage}
        >
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
       )}
     </div>
   )
 }