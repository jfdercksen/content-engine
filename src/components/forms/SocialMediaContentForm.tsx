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
import { X, Calendar, Hash, MessageSquare, Target, Zap, TrendingUp, Image as ImageIcon, Sparkles, Eye, CheckCircle, XCircle, Upload, Trash2 } from 'lucide-react'
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
  const [imageBrowserRefresh, setImageBrowserRefresh] = useState(0)
  const [showImageBrowser, setShowImageBrowser] = useState(false)
  const [generatedImages, setGeneratedImages] = useState<Image[]>([])
  const [selectedImage, setSelectedImage] = useState<Image | null>(null)
  const [selectedBrowsedImages, setSelectedBrowsedImages] = useState<Partial<Image>[]>([])
  const [uploadedImages, setUploadedImages] = useState<Partial<Image>[]>([])
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [enlargedImage, setEnlargedImage] = useState<{url: string, alt: string} | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Function to fetch image data by IDs
  const fetchImageData = async (imageIds: (string | number)[]) => {
    try {
      console.log('Fetching image data for IDs:', imageIds)
      const response = await fetch(`/api/baserow/${clientId}/images`)
      
      if (response.ok) {
        const result = await response.json()
        console.log('Fetched all image data:', result)
        
        if (result.results && result.results.length > 0) {
          // Filter to only include the images we need based on the IDs
          const filteredImages = result.results.filter((img: any) => {
            const imgId = String(img.id)
            const match = imageIds.some(id => String(id) === imgId)
            console.log(`Checking image ${imgId} against [${imageIds}]: ${match}`)
            return match
          })
          
          console.log('Filtered images for IDs:', imageIds, 'Found:', filteredImages)
          
          const fetchedImages = filteredImages.map((img: any) => {
            // Extract URL from Baserow file field array
            const imageUrl =
              img.image && Array.isArray(img.image) && img.image.length > 0 && img.image[0].url
                ? img.image[0].url
                : (typeof img.image === 'string' ? img.image : img.imageLinkUrl)

            return {
              id: String(img.id),
              image: imageUrl,
              imageUrl: imageUrl,
              imagePrompt: img.imagePrompt || img.imageprompt || `Image ${img.id}`,
              imageStatus: img.imageStatus || img.imagestatus || 'Completed',
              imageType: img.imageType || img.imagetype || 'Generated',
              imageScene: img.imageScene || img.imagescene || 'Social Media Post',
              imageStyle: img.imageStyle || img.imagestyle || 'Photorealistic',
              imageModel: img.imageModel || img.imagemodel || 'Generated',
              imageSize: img.imageSize || img.imagesize || 'Original',
              imageLinkUrl: img.imageLinkUrl || img.image,
              client_id: img.client_id,
              created_at: img.created_at || img.createdAt,
            }
          })
          
          console.log('Updating selectedBrowsedImages with fetched data:', fetchedImages)
          setSelectedBrowsedImages(fetchedImages)
        }
      } else {
        console.error('Failed to fetch image data:', response.status)
      }
    } catch (error) {
      console.error('Error fetching image data:', error)
    }
  }
  
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
    console.log('Full initialData object:', JSON.stringify(initialData, null, 2))
    
    // Debug: Check if images are in different field names
    console.log('=== CHECKING ALL POSSIBLE IMAGE FIELDS ===')
    console.log('initialData.images:', initialData?.images)
    console.log('initialData.image:', initialData?.image)
    console.log('initialData.selectedImages:', (initialData as any)?.selectedImages)
    
    // Check all field names that might contain images
    Object.keys(initialData || {}).forEach(key => {
      if (key.toLowerCase().includes('image')) {
        console.log(`Field "${key}":`, (initialData as any)[key])
      }
    })
    
    if (initialData?.images && Array.isArray(initialData.images) && initialData.images.length > 0) {
      console.log('Initializing selectedBrowsedImages from initialData.images:', initialData.images)
      
      // Check if images are just IDs (strings/numbers) or full image objects
      const firstImage = initialData.images[0]
      const isIdArray = typeof firstImage === 'string' || typeof firstImage === 'number'
      
      if (isIdArray) {
        console.log('Images array contains IDs, fetching image data...')
        // Images are just IDs, we need to fetch the actual image data
        // For now, create placeholder objects with the IDs
        const placeholderImages = (initialData.images as unknown as (string | number)[]).map((id: string | number) => ({
          id: String(id),
          image: undefined, // Will be populated when image data is fetched
          imagePrompt: `Image ${id}`,
          imageStatus: 'Unknown'
        } as Partial<Image>))
        
        console.log('Created placeholder images:', placeholderImages)
        setSelectedBrowsedImages(placeholderImages)
        
        // Fetch the actual image data for these IDs
        fetchImageData(initialData.images as unknown as (string | number)[])
      } else {
        // Images are full objects, convert them as before
        const convertedImages = initialData.images.map((img: any) => {
          // Extract image URL from various possible field structures
          let imageUrl = null
          
          // Handle Baserow file field format (array of file objects)
          if (img.image && Array.isArray(img.image) && img.image.length > 0 && img.image[0].url) {
            imageUrl = img.image[0].url
          } else if (typeof img.image === 'string') {
            imageUrl = img.image
          } else if (img.imageLinkUrl) {
            imageUrl = img.imageLinkUrl
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
        
        console.log('Converted images for selectedBrowsedImages:', convertedImages)
        setSelectedBrowsedImages(convertedImages)
      }
      
      // Also check if any of the existing images are uploaded images
      // (they would have isUploaded: true or imageModel: 'Local Upload')
      const uploadedImagesFromData = initialData.images.filter((img: any) => 
        img.imagemodel === 'Local Upload' || 
        img.imageModel === 'Local Upload' || 
        img.imageType === 'Uploaded Image' ||
        img.imagetype === 'Uploaded Image'
      )
      
      if (uploadedImagesFromData.length > 0) {
        console.log('Found uploaded images in initialData:', uploadedImagesFromData)
        const convertedUploadedImages = uploadedImagesFromData.map((img: any) => ({
          id: img.id,
          image: img.image || img.imageLinkUrl,
          imageUrl: img.image || img.imageLinkUrl,
          imagePrompt: img.imagePrompt || img.imageprompt || `Uploaded image: ${img.id}`,
          imageStatus: img.imageStatus || img.imagestatus || 'Completed',
          imageType: img.imageType || img.imagetype || 'Uploaded Image',
          imageScene: img.imageScene || img.imagescene || 'Social Media Post',
          imageStyle: img.imageStyle || img.imagestyle || 'Photorealistic',
          imageModel: img.imageModel || img.imagemodel || 'Local Upload',
          imageSize: img.imageSize || img.imagesize || 'Original',
          imageLinkUrl: img.imageLinkUrl || img.image,
          client_id: img.client_id,
          created_at: img.created_at || img.createdAt,
          isUploaded: true
        }))
        
        setUploadedImages(convertedUploadedImages)
        console.log('Set uploadedImages to:', convertedUploadedImages)
      }
    } else {
      // Reset if no images in initial data
      setSelectedBrowsedImages([])
      setUploadedImages([])
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
    console.log('Uploaded images:', uploadedImages)
    console.log('Selected image IDs being sent:', selectedBrowsedImages.map(img => img.id).filter(Boolean))
    console.log('Uploaded image IDs being sent:', uploadedImages.map(img => img.id).filter(Boolean))
    
    // Combine all selected images (browsed + uploaded)
    const allSelectedImages = [...selectedBrowsedImages, ...uploadedImages]
    
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
                    : String(cleanedData.contentIdea || '')
              )
      ),
      // Add all selected images to the form data (both browsed and uploaded)
      images: allSelectedImages
        .map(img => String(img.id))
        .filter(id => id && id !== 'undefined'),
      selectedImages: allSelectedImages
        .map(img => String(img.id))
        .filter(id => id && id !== 'undefined'),
    } as SocialMediaContentFormData
    
    console.log('🔍 CRITICAL: Sending images to API:', processedData.images)
    console.log('🔍 CRITICAL: allSelectedImages:', allSelectedImages)
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
        // If it's already FormData, add all the complete payload fields
        imageData.append('source', 'social_media_post')
        imageData.append('operationType', 'generate')
        imageData.append('imageStatus', 'Generating')
        imageData.append('imageScene', 'Social Media Post')
        imageData.append('referenceUrl', imageData.get('referenceUrl') || '')
        imageData.append('selectedImages', JSON.stringify([]))
        imageData.append('socialMediaContent', String(initialData?.id || ''))
        imageData.append('isNewPost', String(!initialData?.id)) // Flag to indicate if this is for a new post
        imageData.append('contentIdea', String(contentIdeaId || ''))
        imageData.append('postContent', postContent)
        imageData.append('hookContent', hookContent)
        imageData.append('combinedContent', combinedContent)
        imageData.append('platform', watch('platform') || '')
        imageData.append('contentType', watch('contentType') || '')
        
        // Ensure imagePrompt is set if not already present
        if (!imageData.get('imagePrompt')) {
          imageData.append('imagePrompt', combinedContent || 'Social media post image')
        }
        
        console.log('Sending FormData with complete payload and file upload')
        response = await fetch(`/api/baserow/${clientId}/image-ideas`, {
          method: 'POST',
          body: imageData
        })
      } else {
        // If it's JSON data, prepare it properly with complete payload structure
        const imageFormData: any = {
          ...imageData,
          // Add source identifier to distinguish from Image Ideas section
          source: 'social_media_post',
          // Don't override operationType, imageStatus, etc. - use the values from imageData
          operationType: imageData.operationType || 'generate',
          imageStatus: imageData.imageStatus || 'Generating',
          imageScene: imageData.imageScene || 'Social Media Post',
          referenceUrl: imageData.referenceUrl || '',
          selectedImages: imageData.selectedImages || [],
          uploadedImages: imageData.uploadedImages || [],
          voiceNote: imageData.voiceNote || null,
          // Add social media context - use post ID if available, otherwise indicate it's for a new post
          socialMediaContent: initialData?.id || null,
          isNewPost: !initialData?.id, // Flag to indicate if this is for a new post
          contentIdea: contentIdeaId || undefined,
          // Add post context for better prompt generation
          postContent: postContent,
          hookContent: hookContent,
          combinedContent: combinedContent,
          platform: watch('platform'),
          contentType: watch('contentType'),
          // Ensure all required fields are present
          imagePrompt: imageData.imagePrompt || combinedContent || 'Social media post image',
          imageType: imageData.imageType || 'Social Media Post',
          imageStyle: imageData.imageStyle || 'Modern',
          imageModel: imageData.imageModel || 'DALL-E 3',
          imageSize: imageData.imageSize || '1024x1024'
        }
        
        console.log('contentIdeaId:', contentIdeaId)
        console.log('Final imageFormData with complete payload:', imageFormData)
        
        // Send JSON to image-ideas endpoint for generation
        response = await fetch(`/api/baserow/${clientId}/image-ideas`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(imageFormData)
        })
        
        console.log('API Response status:', response.status)
        console.log('API Response headers:', Object.fromEntries(response.headers.entries()))
      }

      if (!response.ok) {
        // Get the error details from the response
        const errorData = await response.json()
        console.error('API Error Response:', errorData)
        console.error('API Error Details:', errorData.details)
        console.error('API Error Status:', response.status)
        
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
    console.log('Image keys:', Object.keys(image))
    
    // Extract the image URL properly - check multiple possible sources
    let imageUrl = null
    
    console.log('Checking imageLinkUrl:', (image as any).imageLinkUrl)
    console.log('Checking image field:', image.image)
    console.log('Image.image type:', typeof image.image)
    console.log('Image.image is array:', Array.isArray(image.image))
    
    // Check imageLinkUrl first
    if ((image as any).imageLinkUrl) {
      imageUrl = (image as any).imageLinkUrl
      console.log('Found imageUrl from imageLinkUrl:', imageUrl)
    }
    // Check image array - handle both direct array and nested structure
    else if (image.image && Array.isArray(image.image) && image.image.length > 0) {
      const firstImageItem = image.image[0]
      console.log('First image item:', firstImageItem)
      console.log('First image item type:', typeof firstImageItem)
      console.log('First image item keys:', firstImageItem ? Object.keys(firstImageItem) : 'N/A')
      
      if (typeof firstImageItem === 'object' && firstImageItem.url) {
        imageUrl = firstImageItem.url
        console.log('Found imageUrl from image array item.url:', imageUrl)
      } else if (typeof firstImageItem === 'string') {
        imageUrl = firstImageItem
        console.log('Found imageUrl from image array string:', imageUrl)
      }
    }
    // Check if image is already a string
    else if (typeof image.image === 'string') {
      imageUrl = image.image
      console.log('Found imageUrl from string image:', imageUrl)
    }
    // Check for any other possible URL fields
    else if ((image as any).url) {
      imageUrl = (image as any).url
      console.log('Found imageUrl from url field:', imageUrl)
    }
    // Check for nested image structure
    else if ((image as any).image && typeof (image as any).image === 'object' && (image as any).image.url) {
      imageUrl = (image as any).image.url
      console.log('Found imageUrl from nested image.url:', imageUrl)
    }
    
    console.log('Final extracted imageUrl:', imageUrl)
    console.log('imageUrl type:', typeof imageUrl)
    console.log('imageUrl length:', imageUrl?.length)
    
    // Validate the URL
    if (!imageUrl || typeof imageUrl !== 'string' || imageUrl.trim() === '') {
      console.error('No valid image URL found!')
      alert('Error: No valid image URL found. Please try selecting a different image.')
      return
    }
    
    // Create the image object with the correct URL
    const imageWithUrl = {
      ...image,
      image: imageUrl, // Store the URL string directly
      imageUrl: imageUrl // Also store as imageUrl for compatibility
    } as any
    
    console.log('Image with URL created:', imageWithUrl)
    console.log('Image with URL keys:', Object.keys(imageWithUrl))
    
    // Add the image to the selected images array (avoid duplicates)
    setSelectedBrowsedImages(prev => {
      const exists = prev.some(img => img.id === image.id)
      if (exists) {
        console.log('Image already exists, not adding duplicate')
        return prev
      }
      console.log('Adding new image to selectedBrowsedImages')
      return [...prev, imageWithUrl]
    })
    
    // Update the form with the selected image data
    setValue('imagePrompt', image.imagePrompt || '')
    console.log('Selected image from browser:', imageWithUrl)
    console.log('Current selectedBrowsedImages after update:', [...selectedBrowsedImages, imageWithUrl])
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
      if (isEditing && initialData?.id) {
        formData.append('socialMediaContentId', String(initialData.id))
      }

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
      setImageBrowserRefresh(prev => prev + 1)
      
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white rounded-t-lg">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Edit Post' : 'Create New Post'}
          </h2>
          {contentIdeaTitle && (
              <Badge variant="outline" className="text-sm px-3 py-1">
                {contentIdeaTitle}
              </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
              Copy link
          </Button>
            <Button variant="ghost" size="sm" onClick={onClose} className="hover:bg-gray-100">
              <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Column - Form */}
          <div className="w-1/2 bg-gray-50 border-r border-gray-200 flex flex-col min-h-0">
            <form onSubmit={handleSubmit(onFormSubmit)} className="flex-1 flex flex-col min-h-0">
              {/* Scrollable Content Area */}
              <div className="flex-1 overflow-y-auto p-6 min-h-0">
        <div className="space-y-6">
                  {/* Platform & Status Selection */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Post Settings</h3>
            <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="platform" className="text-sm font-medium text-gray-700 mb-2 block">
                          Platform
                        </Label>
                <Select 
                  value={watch('platform')} 
                  onValueChange={(value) => setValue('platform', value as any)}
                >
                          <SelectTrigger className="w-full">
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
              </div>
                      <div>
                        <Label htmlFor="status" className="text-sm font-medium text-gray-700 mb-2 block">
                          Status
                        </Label>
                <Select 
                          value={watch('status')} 
                          onValueChange={(value) => setValue('status', value as any)}
                >
                          <SelectTrigger className="w-full">
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
            </div>
                  </div>
                  {/* Main Content Section */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Content</h3>
                    <div className="space-y-4">
            {/* Hook */}
                      <div>
                        <Label htmlFor="hook" className="text-sm font-medium text-gray-700 mb-2 block">
                          Hook
                        </Label>
              <Textarea
                          placeholder="Add a compelling hook to grab attention..."
                          className="min-h-[100px] border border-gray-300 rounded-lg resize-y placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                {...register('hook')}
              />
              {errors.hook && (
                          <p className="text-sm text-red-600 mt-1">{errors.hook.message?.toString()}</p>
              )}
            </div>

                      {/* Main Post */}
                      <div>
                        <Label htmlFor="post" className="text-sm font-medium text-gray-700 mb-2 block">
                          Post Content
                        </Label>
              <Textarea
                          placeholder="Write your main post content here..."
                          className="min-h-[200px] border border-gray-300 rounded-lg resize-y placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                {...register('post')}
              />
              {errors.post && (
                          <p className="text-sm text-red-600 mt-1">{errors.post.message?.toString()}</p>
              )}
            </div>

            {/* Call to Action */}
                      <div>
                        <Label htmlFor="cta" className="text-sm font-medium text-gray-700 mb-2 block">
                          Call to Action
                        </Label>
              <Input
                          placeholder="e.g., Learn more, Sign up today, Book now..."
                          className="border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                {...register('cta')}
              />
              {errors.cta && (
                          <p className="text-sm text-red-600 mt-1">{errors.cta.message?.toString()}</p>
              )}
            </div>

            {/* Hashtags */}
                      <div>
                        <Label htmlFor="hashtags" className="text-sm font-medium text-gray-700 mb-2 block">
                          Hashtags
                        </Label>
              <Input
                          placeholder="#hashtag1 #hashtag2 #hashtag3"
                          className="border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                {...register('hashtags')}
              />
            </div>
              </div>
            </div>

                  {/* Strategy Section */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Strategy</h3>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="angle" className="text-sm font-medium text-gray-700 mb-2 block">
                          Angle
                        </Label>
                        <Textarea
                          placeholder="e.g., Educational, Promotional, Behind-the-scenes"
                          className="min-h-[80px] border border-gray-300 rounded-lg resize-y focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      {...register('angle')}
                    />
                  </div>
                      <div>
                        <Label htmlFor="intent" className="text-sm font-medium text-gray-700 mb-2 block">
                          Intent
                        </Label>
                        <Textarea
                          placeholder="e.g., Drive traffic, Build awareness, Generate leads"
                          className="min-h-[80px] border border-gray-300 rounded-lg resize-y focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      {...register('intent')}
                    />
                  </div>
                      <div>
                        <Label htmlFor="psychologicalTrigger" className="text-sm font-medium text-gray-700 mb-2 block">
                          Psychological Trigger
                        </Label>
                        <Textarea
                          placeholder="e.g., Urgency, Social proof, Fear of missing out"
                          className="min-h-[80px] border border-gray-300 rounded-lg resize-y focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      {...register('psychologicalTrigger')}
                    />
                  </div>
                      <div>
                        <Label htmlFor="engagementObjective" className="text-sm font-medium text-gray-700 mb-2 block">
                          Engagement Objective
                        </Label>
                        <Textarea
                          placeholder="e.g., Likes, Comments, Shares, Clicks"
                          className="min-h-[80px] border border-gray-300 rounded-lg resize-y focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    {...register('engagementObjective')}
                  />
                      </div>
                    </div>
                </div>

                  {/* Media Section */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Media</h3>
                
                {/* Media Action Buttons */}
                <div className="flex gap-3 mb-4">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowImageGeneration(true)}
                        className="flex items-center gap-2"
                      >
                    <ImageIcon className="w-4 h-4" />
                    Generate
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleBrowseImages}
                    className="flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    Browse
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleUploadImage}
                    disabled={isUploadingImage}
                    className="flex items-center gap-2"
                  >
                    {isUploadingImage ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    {isUploadingImage ? 'Uploading...' : 'Upload'}
                      </Button>
                </div>

                {/* Attached Media Preview */}
                {(selectedBrowsedImages.length > 0 || generatedImages.length > 0 || uploadedImages.length > 0) && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Attached Media</h4>
                    <div className="flex gap-3 overflow-x-auto pb-2">
                      {/* Combined display of all images */}
                      {[...selectedBrowsedImages, ...generatedImages, ...uploadedImages].map((image, index) => {
                    console.log(`=== ATTACHED MEDIA IMAGE ${index} DEBUG ===`)
                    console.log('Image:', image)
                    console.log('Image keys:', Object.keys(image))
                    console.log('Image.image:', image.image)
                    console.log('Image.imageUrl:', (image as any).imageUrl)
                    
                    // Debug the array contents
                    if (Array.isArray(image.image) && image.image.length > 0) {
                      console.log('Image.image[0]:', image.image[0])
                      console.log('Image.image[0] keys:', Object.keys(image.image[0]))
                    }
                    if (Array.isArray((image as any).imageUrl) && (image as any).imageUrl.length > 0) {
                      console.log('Image.imageUrl[0]:', (image as any).imageUrl[0])
                      console.log('Image.imageUrl[0] keys:', Object.keys((image as any).imageUrl[0]))
                    }
                    
                    // Extract image URL from Baserow format
                    let displayImageUrl = null

                    console.log('🔍 Extracting URL for image:', image.id, 'image.image:', image.image)

                    // Priority 1: Check if imageLinkUrl is a direct URL string
                    if ((image as any).imageLinkUrl && typeof (image as any).imageLinkUrl === 'string') {
                      displayImageUrl = (image as any).imageLinkUrl
                      console.log('✅ Using imageLinkUrl:', displayImageUrl)
                    }
                    // Priority 2: Extract from Baserow file field array
                    else if (image.image && Array.isArray(image.image) && image.image.length > 0) {
                      if (image.image[0] && typeof image.image[0] === 'object' && (image.image[0] as any).url) {
                        displayImageUrl = (image.image[0] as any).url
                        console.log('✅ Using image[0].url:', displayImageUrl)
                      }
                    }
                    // Priority 3: Check if image is already a URL string
                    else if (typeof image.image === 'string' && image.image.startsWith('http')) {
                      displayImageUrl = image.image
                      console.log('✅ Using direct image string:', displayImageUrl)
                    }
                    // Priority 4: Check imageUrl field
                    else if ((image as any).imageUrl && typeof (image as any).imageUrl === 'string') {
                      displayImageUrl = (image as any).imageUrl
                      console.log('✅ Using imageUrl:', displayImageUrl)
                    }

                    console.log('🎯 Final displayImageUrl:', displayImageUrl)
                    
                    return (
                      <div key={image.id || index} className="relative flex-shrink-0">
                        <img
                          src={displayImageUrl || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNCAyNEg0MFY0MEgyNFYyNFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTI4IDI4SDM2VjM2SDI4VjI4WiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+'}
                          alt={image.imagePrompt || 'Selected image'}
                          className="w-16 h-16 rounded-lg object-cover border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => {
                            if (displayImageUrl) {
                              handleImageClick(displayImageUrl, image.imagePrompt || 'Selected image')
                            }
                          }}
                          onLoad={() => {
                            console.log(`Attached media image ${index} loaded successfully:`, displayImageUrl)
                          }}
                          onError={(e) => {
                            console.log(`Attached media image ${index} failed to load:`, displayImageUrl)
                            const target = e.target as HTMLImageElement
                            // Use a data URI placeholder instead of a file that might not exist
                            target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNCAyNEg0MFY0MEgyNFYyNFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTI4IDI4SDM2VjM2SDI4VjI4WiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+'
                          }}
                        />
                        {/* Show remove button for browsed and uploaded images */}
                        {(selectedBrowsedImages.includes(image) || uploadedImages.includes(image)) && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white hover:bg-red-600 p-0"
                            onClick={() => {
                              if (selectedBrowsedImages.includes(image)) {
                                handleRemoveSelectedImage(image.id || '')
                              } else if (uploadedImages.includes(image)) {
                                handleRemoveUploadedImage(image.id || '')
                              }
                            }}
                          >
                            <X className="w-3 h-3" />
                        </Button>
                                  )}
                                </div>
                    )
                  })}
                              </div>
                            </div>
                )}
                      </div>

                  {/* Scheduling Section */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Scheduling</h3>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Label htmlFor="scheduledTime" className="text-sm font-medium text-gray-700 mb-2 block">
                      Schedule Date & Time
                    </Label>
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-gray-500" />
                    <Input
                      type="datetime-local"
                        className="flex-1 border border-gray-300 rounded-lg text-sm cursor-pointer focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      {...register('scheduledTime')}
                                />
                              </div>
                             </div>
                           </div>
                         </div>
                    </div>
                  </div>

              {/* Bottom Controls */}
              <div className="p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
                  <Button type="button" variant="outline" size="sm" className="text-red-600 hover:text-red-700 border-red-200">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>

                        <Button
                type="submit" 
                disabled={isSubmitting || isLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
                >
                  {isSubmitting || isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {isEditing ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    isEditing ? 'Update Post' : 'Create Post'
                  )}
                        </Button>
                      </div>
                    </div>
          </form>
                  </div>

          {/* Right Column - Preview */}
          <div className="w-1/2 bg-gray-50 flex flex-col">
            {/* Preview Header */}
            <div className="p-6 bg-white border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm font-bold">f</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{getDisplayValue(watch('platform')) || 'Facebook'}</h3>
                    <p className="text-sm text-gray-500">Post Preview</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                    <Eye className="w-4 h-4 mr-1" />
                    Preview
                  </Button>
                  <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                    📱
                  </Button>
                  <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
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
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{clientName}</h3>
                    <p className="text-sm text-gray-500">Just now</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={
                        watch('status') === 'Published' ? 'default' :
                        watch('status') === 'Scheduled' ? 'secondary' :
                        watch('status') === 'In Review' ? 'outline' :
                        'destructive'
                      }
                      className="text-xs"
                    >
                      {watch('status') || 'Draft'}
                    </Badge>
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
                      {watchedHashtags && (
                        <div className="flex items-center gap-1">
                          <Hash className="w-4 h-4" />
                          <span>Social Media Post</span>
                  </div>
                )}
                      {watch('scheduledTime') && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(watch('scheduledTime')).toLocaleDateString()}</span>
                </div>
                      )}
                  </div>
                )}
                      </div>
                    </div>

              {/* Main Image */}
              {(selectedBrowsedImages.length > 0 || generatedImages.length > 0 || uploadedImages.length > 0) && (
                <div className="relative">
                  {(() => {
                    // Get the first image from all combined images
                    const allImages = [...selectedBrowsedImages, ...generatedImages, ...uploadedImages]
                    const firstImage = allImages[0]
                    
                    console.log('=== PREVIEW IMAGE DEBUG ===')
                    console.log('selectedBrowsedImages:', selectedBrowsedImages)
                    console.log('generatedImages:', generatedImages)
                    console.log('uploadedImages:', uploadedImages)
                    console.log('allImages:', allImages)
                    console.log('firstImage:', firstImage)
                    
                    if (firstImage) {
                      console.log('firstImage keys:', Object.keys(firstImage))
                      console.log('firstImage.image:', firstImage.image)
                      console.log('firstImage.imageUrl:', (firstImage as any).imageUrl)
                      
                    // Debug the array contents
                    if (Array.isArray(firstImage.image) && firstImage.image.length > 0) {
                      console.log('firstImage.image[0]:', firstImage.image[0])
                      console.log('firstImage.image[0] keys:', Object.keys(firstImage.image[0]))
                      console.log('firstImage.image[0].url:', firstImage.image[0].url)
                      console.log('typeof firstImage.image[0]:', typeof firstImage.image[0])
                      console.log('firstImage.image[0] has url?:', 'url' in firstImage.image[0])
                    }
                    if (Array.isArray((firstImage as any).imageUrl) && (firstImage as any).imageUrl.length > 0) {
                      console.log('firstImage.imageUrl[0]:', (firstImage as any).imageUrl[0])
                      console.log('firstImage.imageUrl[0] keys:', Object.keys((firstImage as any).imageUrl[0]))
                      console.log('firstImage.imageUrl[0].url:', (firstImage as any).imageUrl[0].url)
                    }
                    }
                    
                    // Extract image URL - direct approach
                    let previewImageUrl = null
                    if (firstImage) {
                      console.log('=== STARTING URL EXTRACTION ===')
                      
                      // Try direct access first
                      if (Array.isArray(firstImage.image) && firstImage.image.length > 0 && (firstImage.image[0] as any)?.url) {
                        previewImageUrl = (firstImage.image[0] as any).url
                        console.log('Extracted from firstImage.image[0].url:', previewImageUrl)
                      } else if (Array.isArray((firstImage as any).imageUrl) && (firstImage as any).imageUrl.length > 0 && (firstImage as any).imageUrl[0]?.url) {
                        previewImageUrl = (firstImage as any).imageUrl[0].url
                        console.log('Extracted from firstImage.imageUrl[0].url:', previewImageUrl)
                      } else if ((firstImage as any).imageLinkUrl) {
                        previewImageUrl = (firstImage as any).imageLinkUrl
                        console.log('Extracted from imageLinkUrl:', previewImageUrl)
                      } else if (typeof firstImage.image === 'string') {
                        previewImageUrl = firstImage.image
                        console.log('Extracted from string image:', previewImageUrl)
                      } else if ((firstImage as any).url) {
                        previewImageUrl = (firstImage as any).url
                        console.log('Extracted from url field:', previewImageUrl)
                      }
                    }
                    
                    console.log('Final previewImageUrl after extraction:', previewImageUrl)
                    
                    console.log('Extracted previewImageUrl:', previewImageUrl)
                    
                    return (
                      <>
                        <img
                          src={previewImageUrl || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgdmlld0JveD0iMCAwIDI1NiAyNTYiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyNTYiIGhlaWdodD0iMjU2IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik05NiA5NkgxNjBWMTYwSDk2Vjk2WiIgZmlsbD0iIzlDQTNBRiIvPgo8cGF0aCBkPSJNMTEyIDExMkgxNDRWMTQ0SDExMlYxMTJaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4='}
                          alt={firstImage?.imagePrompt || 'Post image'}
                          className="w-full h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => {
                            if (previewImageUrl) {
                              handleImageClick(previewImageUrl, firstImage?.imagePrompt || 'Post image')
                            }
                          }}
                          onLoad={() => {
                            console.log('Preview image loaded successfully:', previewImageUrl)
                          }}
                          onError={(e) => {
                            console.log('Preview image failed to load:', previewImageUrl)
                            const target = e.target as HTMLImageElement
                            // Use a data URI placeholder instead of a file that might not exist
                            target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgdmlld0JveD0iMCAwIDI1NiAyNTYiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyNTYiIGhlaWdodD0iMjU2IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik05NiA5NkgxNjBWMTYwSDk2Vjk2WiIgZmlsbD0iIzlDQTNBRiIvPgo8cGF0aCBkPSJNMTEyIDExMkgxNDRWMTQ0SDExMlYxMTJaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4='
                          }}
                        />
                      </>
                    )
                  })()}
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
         <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full h-[90vh] flex flex-col overflow-hidden">
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
            </div>
          </div>
        )}

        {/* Image Browser Modal */}
        {showImageBrowser && (
          <ImageBrowserModal
            clientId={clientId}
            onSelectImage={handleSelectBrowsedImage}
            onClose={() => setShowImageBrowser(false)}
            isOpen={showImageBrowser}
            refreshTrigger={imageBrowserRefresh}
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
    </div>
     </div>
   )
 }