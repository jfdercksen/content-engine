'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { X, Video as VideoIcon, Settings, Sparkles, Type, Image as ImageIcon, Upload, Package, FolderOpen } from 'lucide-react'
import { 
  VideoFormData, 
  VideoType, 
  VideoModel, 
  AspectRatio, 
  VideoPlatform,
  CaptionPosition,
  VIDEO_TYPE_TO_MODELS,
  PLATFORM_TO_ASPECT_RATIO
} from '@/lib/types/video'
import ImageBrowserModal from '@/components/modals/ImageBrowserModal'
import type { Image } from '@/lib/types/content'

interface VideoGenerationFormProps {
  onSubmit: (data: VideoFormData) => void
  onClose: () => void
  initialData?: Partial<VideoFormData>
  clientId: string
}

// Form validation schema
const videoFormSchema = z.object({
  videoPrompt: z.string().min(10, 'Video prompt must be at least 10 characters'),
  videoType: z.enum([
    'Text-to-Video',
    'Image-to-Video',
    'Storyboard',
    'Multi-Scene Process',
    'UGC Ad',
    'Social Post Video'
  ] as const),
  model: z.enum([
    'Sora 2',
    'Veo 3.1',
    'Veo 3.1 Fast',
    'Kling Video',
    'NanoBanana + Veo 3.1',
    'fal.ai'
  ] as const),
  aspectRatio: z.enum([
    '9:16 (Vertical)',
    '16:9 (Landscape)',
    '1:1 (Square)',
    '4:5 (Portrait)'
  ] as const),
  duration: z.number().min(1).max(60),
  platform: z.enum(['Facebook', 'Instagram', 'Twitter', 'LinkedIn', 'TikTok', 'YouTube'] as const).optional(),
  useCaptions: z.boolean().optional(),
  captionText: z.string().optional(),
  captionPosition: z.enum(['Top', 'Center', 'Bottom'] as const).optional(),
  // UGC Ad fields
  product: z.string().optional(),
  productPhotoUrl: z.string().url().optional().or(z.literal('')),
  icp: z.string().optional(),
  productFeatures: z.string().optional(),
  videoSetting: z.string().optional(),
  // Reference image fields
  referenceImageUrl: z.string().url().optional().or(z.literal(''))
})

export default function VideoGenerationForm({
  onSubmit,
  onClose,
  initialData,
  clientId
}: VideoGenerationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedPlatform, setSelectedPlatform] = useState<VideoPlatform | undefined>(initialData?.platform)
  
  // Image-to-Video state
  const [referenceImage, setReferenceImage] = useState<File | null>(null)
  const [referenceImagePreview, setReferenceImagePreview] = useState<string | null>(null)
  const [selectedReferenceImageId, setSelectedReferenceImageId] = useState<string | null>(null)
  
  // UGC Ad state
  const [productPhoto, setProductPhoto] = useState<File | null>(null)
  const [productPhotoPreview, setProductPhotoPreview] = useState<string | null>(null)
  const [selectedProductPhotoId, setSelectedProductPhotoId] = useState<string | null>(null)
  
  // Image Browser state
  const [showImageBrowser, setShowImageBrowser] = useState(false)
  const [browsingFor, setBrowsingFor] = useState<'reference' | 'product' | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<VideoFormData>({
    resolver: zodResolver(videoFormSchema),
    defaultValues: {
      videoPrompt: initialData?.videoPrompt || '',
      videoType: initialData?.videoType || 'Text-to-Video',
      model: initialData?.model || 'Sora 2',
      aspectRatio: initialData?.aspectRatio || '16:9 (Landscape)',
      duration: initialData?.duration || 10,
      platform: initialData?.platform,
      useCaptions: initialData?.useCaptions || false,
      captionText: initialData?.captionText || '',
      captionPosition: initialData?.captionPosition || 'Bottom',
      // UGC Ad fields
      product: initialData?.product || '',
      productPhotoUrl: initialData?.productPhotoUrl || '',
      icp: initialData?.icp || '',
      productFeatures: initialData?.productFeatures || '',
      videoSetting: initialData?.videoSetting || '',
      // Reference image fields
      referenceImageUrl: initialData?.referenceImageUrl || ''
    }
  })

  const watchedValues = watch()
  const videoType = watch('videoType')
  const model = watch('model')
  const useCaptions = watch('useCaptions')

  // Get available models for selected video type
  const availableModels = VIDEO_TYPE_TO_MODELS[videoType] || []

  // Handle platform change - auto-set aspect ratio
  const handlePlatformChange = (platform: VideoPlatform) => {
    setSelectedPlatform(platform)
    setValue('platform', platform)
    
    // Auto-set aspect ratio based on platform
    const recommendedAspectRatio = PLATFORM_TO_ASPECT_RATIO[platform]
    setValue('aspectRatio', recommendedAspectRatio)
  }

  // Handle video type change - auto-select compatible model
  const handleVideoTypeChange = (type: VideoType) => {
    setValue('videoType', type)
    
    // Auto-select first available model for this type
    const availableModelsForType = VIDEO_TYPE_TO_MODELS[type]
    if (availableModelsForType && availableModelsForType.length > 0) {
      setValue('model', availableModelsForType[0])
    }
  }

  // Handle reference image upload
  const handleReferenceImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setReferenceImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setReferenceImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Handle product photo upload
  const handleProductPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setProductPhoto(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setProductPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Handle image selection from browser
  const handleSelectImageFromBrowser = (image: Partial<Image>) => {
    console.log('Selected image from browser:', image)
    
    let imageId: string = ''
    let imageUrl: string = ''
    
    if (typeof image === 'string') {
      imageId = image
    } else if (image?.id) {
      imageId = String(image.id)
      
      // Try multiple ways to get the image URL (matching ImageBrowserModal logic)
      const imageObj = image as any
      
      // First try imageLinkUrl (capital L - matches ImageBrowserModal)
      if (imageObj.imageLinkUrl && typeof imageObj.imageLinkUrl === 'string' && imageObj.imageLinkUrl.trim() !== '') {
        imageUrl = imageObj.imageLinkUrl
        console.log('Got image URL from imageLinkUrl:', imageUrl)
      }
      // Then try image array
      else if (imageObj.image && Array.isArray(imageObj.image) && imageObj.image.length > 0 && imageObj.image[0].url) {
        imageUrl = imageObj.image[0].url
        console.log('Got image URL from image[0].url:', imageUrl)
      }
      // Fallback to imagelinkurl (lowercase)
      else if (imageObj.imagelinkurl && typeof imageObj.imagelinkurl === 'string') {
        imageUrl = imageObj.imagelinkurl
        console.log('Got image URL from imagelinkurl (lowercase):', imageUrl)
      }
    }
    
    if (!imageId) {
      console.error('No image ID found in selected image:', image)
      return
    }

    if (!imageUrl || imageUrl.trim() === '') {
      console.warn('No valid image URL found, image will not preview. Image object:', image)
      alert('This image does not have a valid URL and cannot be previewed.')
      return
    }

    console.log('Processing selection for:', browsingFor, 'ID:', imageId, 'URL:', imageUrl)

    if (browsingFor === 'reference') {
      setSelectedReferenceImageId(imageId)
      setReferenceImagePreview(imageUrl)
      setReferenceImage(null) // Clear uploaded file
      setValue('referenceImageId', imageId)
      setValue('referenceImageUrl', imageUrl)
      console.log('✅ Set reference image preview to:', imageUrl)
    } else if (browsingFor === 'product') {
      setSelectedProductPhotoId(imageId)
      setProductPhotoPreview(imageUrl)
      setProductPhoto(null) // Clear uploaded file
      setValue('productPhotoUrl', imageUrl)
      console.log('✅ Set product photo preview to:', imageUrl)
    }
    
    setShowImageBrowser(false)
    setBrowsingFor(null)
  }

  const onFormSubmit = async (data: VideoFormData) => {
    setIsSubmitting(true)
    try {
      // Get current form values (includes setValue updates)
      const allFormValues = watch()
      
      console.log('📋 All form values:', {
        product: allFormValues.product,
        productPhotoUrl: allFormValues.productPhotoUrl,
        icp: allFormValues.icp,
        productFeatures: allFormValues.productFeatures,
        videoSetting: allFormValues.videoSetting,
        referenceImageUrl: allFormValues.referenceImageUrl
      })
      
      // Add uploaded files and selected image IDs to form data
      const formData: VideoFormData = {
        ...data,
        ...allFormValues, // Include all watched values (captures setValue updates)
        referenceImage: referenceImage || undefined,
        referenceImageId: selectedReferenceImageId || undefined,
        referenceImageUrl: allFormValues.referenceImageUrl || data.referenceImageUrl || '',
        productPhoto: productPhoto || undefined,
        productPhotoUrl: allFormValues.productPhotoUrl || data.productPhotoUrl || '',
        // Ensure UGC fields are explicitly included (even if empty)
        product: allFormValues.product || data.product || '',
        icp: allFormValues.icp || data.icp || '',
        productFeatures: allFormValues.productFeatures || data.productFeatures || '',
        videoSetting: allFormValues.videoSetting || data.videoSetting || ''
      }
      console.log('📤 Submitting video form data:', {
        videoType: formData.videoType,
        model: formData.model,
        product: formData.product,
        productPhotoUrl: formData.productPhotoUrl,
        icp: formData.icp,
        productFeatures: formData.productFeatures,
        videoSetting: formData.videoSetting
      })
      await onSubmit(formData)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-purple-50 to-blue-50">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <VideoIcon className="h-6 w-6 text-purple-600" />
            Video Generation Studio
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Create stunning videos with AI
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="hover:bg-white"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Form Content - Scrollable */}
      <div className="flex-1 overflow-y-auto p-6">
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          
          {/* Video Type & Model Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Video Type & AI Model
              </CardTitle>
              <CardDescription>
                Choose the type of video and AI model for generation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Video Type */}
              <div className="space-y-2">
                <Label htmlFor="videoType">Video Type</Label>
                <Select
                  value={watchedValues.videoType}
                  onValueChange={(value) => handleVideoTypeChange(value as VideoType)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select video type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Text-to-Video">Text to Video</SelectItem>
                    <SelectItem value="Image-to-Video">Image to Video</SelectItem>
                    <SelectItem value="UGC Ad">UGC Product Ad</SelectItem>
                    <SelectItem value="Social Post Video">Social Post Video</SelectItem>
                    <SelectItem value="Storyboard">Storyboard (Multi-Scene)</SelectItem>
                  </SelectContent>
                </Select>
                {errors.videoType && (
                  <p className="text-sm text-red-600">{errors.videoType.message}</p>
                )}
              </div>

              {/* AI Model */}
              <div className="space-y-2">
                <Label htmlFor="model">AI Model</Label>
                <Select
                  value={watchedValues.model}
                  onValueChange={(value) => setValue('model', value as VideoModel)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select AI model" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableModels.map((modelOption) => (
                      <SelectItem key={modelOption} value={modelOption}>
                        {modelOption}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.model && (
                  <p className="text-sm text-red-600">{errors.model.message}</p>
                )}
                <p className="text-xs text-gray-500">
                  Available models for {videoType}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Video Prompt */}
          <Card>
            <CardHeader>
              <CardTitle>Video Prompt</CardTitle>
              <CardDescription>
                Describe the video you want to generate
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="videoPrompt">Prompt</Label>
                <Textarea
                  id="videoPrompt"
                  {...register('videoPrompt')}
                  placeholder="A cinematic shot of a mountain landscape at sunrise with golden light breaking through clouds..."
                  rows={4}
                  className="resize-none"
                />
                {errors.videoPrompt && (
                  <p className="text-sm text-red-600">{errors.videoPrompt.message}</p>
                )}
                <p className="text-xs text-gray-500">
                  {watchedValues.videoPrompt?.length || 0} characters
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Image-to-Video Section */}
          {videoType === 'Image-to-Video' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Reference Image
                </CardTitle>
                <CardDescription>
                  Upload an image to animate into a video
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="referenceImage">Reference Image</Label>
                  
                  <div className="flex gap-2">
                    <Input
                      id="referenceImage"
                      type="file"
                      accept="image/*"
                      onChange={handleReferenceImageUpload}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setBrowsingFor('reference')
                        setShowImageBrowser(true)
                      }}
                      className="flex items-center gap-2 whitespace-nowrap"
                    >
                      <FolderOpen className="w-4 h-4" />
                      Browse Images
                    </Button>
                  </div>
                  
                  {referenceImagePreview && (
                    <div className="mt-2">
                      <img
                        src={referenceImagePreview}
                        alt="Reference preview"
                        className="w-full max-w-md h-auto rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setReferenceImage(null)
                          setReferenceImagePreview(null)
                          setSelectedReferenceImageId(null)
                          setValue('referenceImageUrl', undefined)
                          setValue('referenceImageId', undefined)
                        }}
                        className="mt-2"
                      >
                        Remove Image
                      </Button>
                    </div>
                  )}
                  <p className="text-xs text-gray-500">
                    Upload a new image or browse from your Image Ideas library
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* UGC Ad Section */}
          {videoType === 'UGC Ad' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Product Information
                </CardTitle>
                <CardDescription>
                  Provide product details for your UGC ad
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Product Name */}
                <div className="space-y-2">
                  <Label htmlFor="product">Product Name</Label>
                  <Input
                    id="product"
                    {...register('product')}
                    placeholder="e.g., Smartwatch Pro X"
                  />
                  <p className="text-xs text-gray-500">
                    The name of your product
                  </p>
                </div>

                {/* Product Photo */}
                <div className="space-y-2">
                  <Label htmlFor="productPhoto">Product Photo</Label>
                  
                  <div className="flex gap-2">
                    <Input
                      id="productPhoto"
                      type="file"
                      accept="image/*"
                      onChange={handleProductPhotoUpload}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setBrowsingFor('product')
                        setShowImageBrowser(true)
                      }}
                      className="flex items-center gap-2 whitespace-nowrap"
                    >
                      <FolderOpen className="w-4 h-4" />
                      Browse Images
                    </Button>
                  </div>
                  
                  {productPhotoPreview && (
                    <div className="mt-2">
                      <img
                        src={productPhotoPreview}
                        alt="Product preview"
                        className="w-full max-w-md h-auto rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setProductPhoto(null)
                          setProductPhotoPreview(null)
                          setSelectedProductPhotoId(null)
                          setValue('productPhotoUrl', undefined)
                        }}
                        className="mt-2"
                      >
                        Remove Photo
                      </Button>
                    </div>
                  )}
                  <p className="text-xs text-gray-500">
                    Upload a new photo or browse from your Image Ideas library
                  </p>
                </div>

                {/* ICP (Ideal Customer Profile) */}
                <div className="space-y-2">
                  <Label htmlFor="icp">Ideal Customer Profile (ICP)</Label>
                  <Textarea
                    id="icp"
                    {...register('icp')}
                    placeholder="e.g., Fitness enthusiasts aged 25-40 who want to track their health goals..."
                    rows={3}
                  />
                  <p className="text-xs text-gray-500">
                    Who is your target audience?
                  </p>
                </div>

                {/* Product Features */}
                <div className="space-y-2">
                  <Label htmlFor="productFeatures">Key Product Features</Label>
                  <Textarea
                    id="productFeatures"
                    {...register('productFeatures')}
                    placeholder="e.g., Heart rate monitoring, Sleep tracking, 7-day battery life, Water resistant..."
                    rows={3}
                  />
                  <p className="text-xs text-gray-500">
                    List the main features and benefits
                  </p>
                </div>

                {/* Video Setting */}
                <div className="space-y-2">
                  <Label htmlFor="videoSetting">Video Setting/Style</Label>
                  <Select
                    value={watchedValues.videoSetting}
                    onValueChange={(value) => setValue('videoSetting', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select video style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Casual Selfie">Casual Selfie</SelectItem>
                      <SelectItem value="Product Demo">Product Demo</SelectItem>
                      <SelectItem value="Testimonial">Testimonial</SelectItem>
                      <SelectItem value="Unboxing">Unboxing</SelectItem>
                      <SelectItem value="Lifestyle">Lifestyle</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    The style of your UGC video
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Video Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Video Settings
              </CardTitle>
              <CardDescription>
                Configure aspect ratio, duration, and platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Platform (Optional - helps set aspect ratio) */}
              <div className="space-y-2">
                <Label htmlFor="platform">Target Platform (Optional)</Label>
                <Select
                  value={selectedPlatform}
                  onValueChange={(value) => handlePlatformChange(value as VideoPlatform)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select platform (auto-sets aspect ratio)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Facebook">Facebook (1:1)</SelectItem>
                    <SelectItem value="Instagram">Instagram (9:16)</SelectItem>
                    <SelectItem value="TikTok">TikTok (9:16)</SelectItem>
                    <SelectItem value="YouTube">YouTube (16:9)</SelectItem>
                    <SelectItem value="LinkedIn">LinkedIn (16:9)</SelectItem>
                    <SelectItem value="Twitter">Twitter (16:9)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Aspect Ratio */}
              <div className="space-y-2">
                <Label htmlFor="aspectRatio">Aspect Ratio</Label>
                <Select
                  value={watchedValues.aspectRatio}
                  onValueChange={(value) => setValue('aspectRatio', value as AspectRatio)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select aspect ratio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="9:16 (Vertical)">9:16 Vertical (TikTok, Reels)</SelectItem>
                    <SelectItem value="16:9 (Landscape)">16:9 Landscape (YouTube)</SelectItem>
                    <SelectItem value="1:1 (Square)">1:1 Square (Instagram)</SelectItem>
                    <SelectItem value="4:5 (Portrait)">4:5 Portrait (Instagram)</SelectItem>
                  </SelectContent>
                </Select>
                {errors.aspectRatio && (
                  <p className="text-sm text-red-600">{errors.aspectRatio.message}</p>
                )}
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (seconds)</Label>
                <Input
                  id="duration"
                  type="number"
                  {...register('duration', { valueAsNumber: true })}
                  min={1}
                  max={60}
                  placeholder="10"
                />
                {errors.duration && (
                  <p className="text-sm text-red-600">{errors.duration.message}</p>
                )}
                <p className="text-xs text-gray-500">
                  Recommended: 5-15 seconds for social media
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Captions (Optional) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="h-5 w-5" />
                Captions (Optional)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="useCaptions"
                  checked={useCaptions}
                  onCheckedChange={(checked) => setValue('useCaptions', !!checked)}
                />
                <Label htmlFor="useCaptions" className="cursor-pointer">
                  Add text captions to video
                </Label>
              </div>

              {useCaptions && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="captionText">Caption Text</Label>
                    <Textarea
                      id="captionText"
                      {...register('captionText')}
                      placeholder="Your caption text here..."
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="captionPosition">Caption Position</Label>
                    <Select
                      value={watchedValues.captionPosition}
                      onValueChange={(value) => setValue('captionPosition', value as CaptionPosition)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select position" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Top">Top</SelectItem>
                        <SelectItem value="Center">Center</SelectItem>
                        <SelectItem value="Bottom">Bottom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

        </form>
      </div>

      {/* Footer with Actions */}
      <div className="border-t p-6 bg-gray-50 flex justify-between items-center">
        <div className="text-sm text-gray-600">
          {videoType} • {model} • {watchedValues.aspectRatio}
        </div>
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit(onFormSubmit)}
            disabled={isSubmitting}
            className="min-w-[140px]"
          >
            {isSubmitting ? (
              <>
                <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <VideoIcon className="w-4 h-4 mr-2" />
                Generate Video
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Image Browser Modal */}
      <ImageBrowserModal
        isOpen={showImageBrowser}
        clientId={clientId}
        onSelectImage={handleSelectImageFromBrowser}
        onClose={() => {
          setShowImageBrowser(false)
          setBrowsingFor(null)
        }}
      />
    </div>
  )
}

