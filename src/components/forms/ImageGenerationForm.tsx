'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { imageFormSchema, ImageFormData, IMAGE_TYPES, IMAGE_STYLES, IMAGE_MODELS, IMAGE_SIZES, CAPTION_FONT_STYLES, CAPTION_FONT_SIZES, CAPTION_POSITIONS } from '@/lib/types/content'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { X, Image as ImageIcon, Upload, Link, Type, Settings } from 'lucide-react'

interface ImageGenerationFormProps {
  onSubmit: (data: ImageFormData) => void
  onClose: () => void
  initialData?: ImageFormData
  postText?: string // Text from the social media post to generate initial prompt
  clientId: string
}

export default function ImageGenerationForm({
  onSubmit,
  onClose,
  initialData,
  postText,
  clientId
}: ImageGenerationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRegeneratingPrompt, setIsRegeneratingPrompt] = useState(false)
  const [referenceImageFile, setReferenceImageFile] = useState<File | null>(null)
  const [referenceImagePreview, setReferenceImagePreview] = useState<string>('')

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid }
  } = useForm<ImageFormData>({
    resolver: zodResolver(imageFormSchema),
    defaultValues: {
      imagePrompt: 'Professional business image',
      imageType: IMAGE_TYPES.NEW_IMAGE,
      imageScene: '',
      imageStyle: IMAGE_STYLES.PHOTOREALISTIC,
      imageModel: IMAGE_MODELS.OPENAI_GPT_IMAGE_1,
      imageSize: IMAGE_SIZES.SQUARE_1024,
      useReferenceImage: false,
      useCaptions: false,
      captionText: '',
      captionFontStyle: CAPTION_FONT_STYLES.ARIAL,
      captionFontSize: CAPTION_FONT_SIZES.MEDIUM,
      captionPosition: CAPTION_POSITIONS.BOTTOM_CENTER,
      referenceUrl: '',
      ...initialData
    }
  })

  // Watch form values
  const watchedValues = watch()

  // Generate initial prompt from post text
  useEffect(() => {
    if (postText && !initialData?.imagePrompt) {
      const generatedPrompt = generateImagePromptFromPost(postText)
      setValue('imagePrompt', generatedPrompt)
    }
  }, [postText, initialData, setValue])

  // Handle reference image file change
  const handleReferenceImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    console.log('Reference image file selected:', file?.name, file?.size)
    if (file) {
      setReferenceImageFile(file)
      console.log('Reference image file set in state:', file.name)
      const reader = new FileReader()
      reader.onload = (e) => {
        setReferenceImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Generate image prompt from post text
  const generateImagePromptFromPost = (text: string): string => {
    // Clean and process the text
    const cleanText = text
      .replace(/[^\w\s]/g, ' ') // Remove special characters but keep spaces
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim()
    
    // Take more words and create a meaningful prompt
    const words = cleanText.split(' ').slice(0, 50) // Take first 50 words
    const keyWords = words.filter(word => 
      word.length > 2 && 
      !['the', 'and', 'for', 'with', 'this', 'that', 'have', 'will', 'from', 'they', 'are', 'you', 'your', 'can', 'get', 'all', 'off', 'august', 'special'].includes(word.toLowerCase())
    )
    
    // Create a more descriptive prompt
    const mainContent = keyWords.slice(0, 20).join(' ')
    return `Professional business image featuring: ${mainContent} - modern corporate style, clean design, professional atmosphere`
  }

  // Generate alternative prompt variations
  const generateAlternativePrompt = (text: string): string => {
    // Clean the text first
    const cleanText = text
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    
    const words = cleanText.split(' ').slice(0, 40)
    const keyWords = words.filter(word => 
      word.length > 2 && 
      !['the', 'and', 'for', 'with', 'this', 'that', 'have', 'will', 'from', 'they', 'are', 'you', 'your', 'can', 'get', 'all', 'off', 'august', 'special'].includes(word.toLowerCase())
    )
    
    const mainContent = keyWords.slice(0, 25).join(' ')
    
    const variations = [
      `Modern business concept illustration: ${mainContent} - sleek corporate design`,
      `Corporate visual representation: ${mainContent} - professional business environment`,
      `Professional marketing image: ${mainContent} - modern advertising concept`,
      `Business success visualization: ${mainContent} - achievement and growth theme`,
      `Corporate branding concept: ${mainContent} - brand identity and recognition`,
      `Professional workplace scene: ${mainContent} - office environment and collaboration`,
      `Business innovation illustration: ${mainContent} - technology and progress theme`,
      `Corporate achievement visual: ${mainContent} - success and excellence concept`
    ]
    
    // Return a random variation
    return variations[Math.floor(Math.random() * variations.length)]
  }

  const handleRegeneratePrompt = () => {
    if (postText) {
      setIsRegeneratingPrompt(true)
      // Simulate a small delay for better UX
      setTimeout(() => {
        const newPrompt = generateAlternativePrompt(postText)
        setValue('imagePrompt', newPrompt)
        setIsRegeneratingPrompt(false)
      }, 300)
    }
  }

  const onFormSubmit = async (data: ImageFormData) => {
    try {
      setIsSubmitting(true)
      console.log('=== IMAGE GENERATION FORM DEBUG ===')
      console.log('Submitting image generation form:', data)
      console.log('Form errors:', errors)
      console.log('Form isValid:', isValid)
      console.log('Watched values:', watchedValues)
      console.log('Form data keys:', Object.keys(data))
      console.log('Form data values:', Object.values(data))

      // Ensure all required fields are present
      const completeData = {
        ...data,
        imagePrompt: data.imagePrompt || 'Professional business image',
        imageType: data.imageType || IMAGE_TYPES.NEW_IMAGE,
        imageStyle: data.imageStyle || IMAGE_STYLES.PHOTOREALISTIC,
        imageModel: data.imageModel || IMAGE_MODELS.OPENAI_GPT_IMAGE_1,
        imageSize: data.imageSize || IMAGE_SIZES.SQUARE_1024,
        imageScene: data.imageScene || '',
        useReferenceImage: data.useReferenceImage || false,
        useCaptions: data.useCaptions || false,
        captionText: data.captionText || '',
        captionFontStyle: data.captionFontStyle || CAPTION_FONT_STYLES.ARIAL,
        captionFontSize: data.captionFontSize || CAPTION_FONT_SIZES.MEDIUM,
        captionPosition: data.captionPosition || CAPTION_POSITIONS.BOTTOM_CENTER,
        referenceUrl: data.referenceUrl || ''
      }

      console.log('Complete form data:', completeData)
      console.log('Reference image file state:', referenceImageFile)
      console.log('Reference image file exists:', !!referenceImageFile)
      console.log('Reference image file name:', referenceImageFile?.name)

      // If we have a reference image file, send as FormData
      if (referenceImageFile) {
        console.log('Creating FormData with reference image file')
        const formData = new FormData()
        
        // Add all form fields
        Object.keys(completeData).forEach(key => {
          if (completeData[key as keyof ImageFormData] !== undefined && completeData[key as keyof ImageFormData] !== null) {
            formData.append(key, String(completeData[key as keyof ImageFormData]))
          }
        })
        
        // Add the file
        formData.append('referenceImage', referenceImageFile)
        
        console.log('FormData entries:')
        for (const [key, value] of formData.entries()) {
          console.log(`${key}:`, value instanceof File ? `File: ${value.name} (${value.size} bytes)` : value)
        }
        
        console.log('Sending FormData with file:', referenceImageFile.name)
        await onSubmit(formData as any)
      } else {
        // No file, send as JSON
        console.log('No reference image file found, sending JSON data')
        console.log('Sending JSON data:', completeData)
        await onSubmit(completeData)
      }
    } catch (error) {
      console.error('Error submitting image generation form:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Generate Image</h2>
          <p className="text-muted-foreground">
            Create an AI-generated image for your social media post
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        {/* Image Prompt Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Image Prompt
            </CardTitle>
            <CardDescription>
              Describe the image you want to generate. This will be used by the AI model.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="imagePrompt">Image Prompt</Label>
              <Textarea
                id="imagePrompt"
                placeholder="Describe the image you want to generate..."
                className="min-h-[100px]"
                {...register('imagePrompt')}
              />
              {errors.imagePrompt && (
                <p className="text-sm text-red-500 mt-1">{errors.imagePrompt.message}</p>
              )}
              
              {/* Regenerate Prompt Button */}
              {postText && (
                <div className="mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRegeneratePrompt}
                    disabled={isRegeneratingPrompt}
                    className="flex items-center gap-2"
                  >
                    <ImageIcon className="h-4 w-4" />
                    {isRegeneratingPrompt ? 'Generating...' : 'Regenerate Prompt'}
                  </Button>
                  <p className="text-xs text-gray-500 mt-1">
                    Click to generate a new prompt based on your post content
                  </p>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="imageScene">Image Scene/Instructions (Optional)</Label>
              <Textarea
                id="imageScene"
                placeholder="Additional scene details or specific instructions..."
                className="min-h-[80px]"
                {...register('imageScene')}
              />
              {errors.imageScene && (
                <p className="text-sm text-red-500 mt-1">{errors.imageScene.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Image Settings Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Image Settings
            </CardTitle>
            <CardDescription>
              Configure the style, model, and size for image generation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="imageType">Image Type</Label>
                <Select
                  value={watchedValues.imageType}
                  onValueChange={(value) => setValue('imageType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select image type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(IMAGE_TYPES).map(([key, value]) => (
                      <SelectItem key={key} value={value}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.imageType && (
                  <p className="text-sm text-red-500 mt-1">{errors.imageType.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="imageStyle">Image Style</Label>
                <Select
                  value={watchedValues.imageStyle}
                  onValueChange={(value) => setValue('imageStyle', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select image style" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(IMAGE_STYLES).map(([key, value]) => (
                      <SelectItem key={key} value={value}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.imageStyle && (
                  <p className="text-sm text-red-500 mt-1">{errors.imageStyle.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="imageModel">Image Model</Label>
                <Select
                  value={watchedValues.imageModel}
                  onValueChange={(value) => setValue('imageModel', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select image model" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(IMAGE_MODELS).map(([key, value]) => (
                      <SelectItem key={key} value={value}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.imageModel && (
                  <p className="text-sm text-red-500 mt-1">{errors.imageModel.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="imageSize">Image Size</Label>
                <Select
                  value={watchedValues.imageSize}
                  onValueChange={(value) => setValue('imageSize', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select image size" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(IMAGE_SIZES).map(([key, value]) => (
                      <SelectItem key={key} value={value}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.imageSize && (
                  <p className="text-sm text-red-500 mt-1">{errors.imageSize.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reference Image Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Reference Image
            </CardTitle>
            <CardDescription>
              Optionally provide a reference image to guide the generation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="useReferenceImage"
                checked={watchedValues.useReferenceImage}
                onCheckedChange={(checked) => setValue('useReferenceImage', checked)}
              />
              <Label htmlFor="useReferenceImage">Use reference image</Label>
            </div>

            {watchedValues.useReferenceImage && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="referenceImage">Upload Reference Image</Label>
                  <Input
                    id="referenceImage"
                    type="file"
                    accept="image/*"
                    onChange={handleReferenceImageChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="referenceUrl">Or provide image URL</Label>
                  <Input
                    id="referenceUrl"
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    {...register('referenceUrl')}
                    className="mt-1"
                  />
                  {errors.referenceUrl && (
                    <p className="text-sm text-red-500 mt-1">{errors.referenceUrl.message}</p>
                  )}
                </div>

                {referenceImagePreview && (
                  <div>
                    <Label>Reference Image Preview</Label>
                    <div className="mt-2">
                      <img
                        src={referenceImagePreview}
                        alt="Reference preview"
                        className="max-w-xs rounded-lg border"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Captions Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Type className="h-5 w-5" />
              Image Captions
            </CardTitle>
            <CardDescription>
              Add text captions to the generated image.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="useCaptions"
                checked={watchedValues.useCaptions}
                onCheckedChange={(checked) => setValue('useCaptions', checked)}
              />
              <Label htmlFor="useCaptions">Add captions to image</Label>
            </div>

            {watchedValues.useCaptions && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="captionText">Caption Text</Label>
                  <Input
                    id="captionText"
                    placeholder="Enter caption text..."
                    {...register('captionText')}
                  />
                  {errors.captionText && (
                    <p className="text-sm text-red-500 mt-1">{errors.captionText.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="captionFontStyle">Font Style</Label>
                    <Select
                      value={watchedValues.captionFontStyle}
                      onValueChange={(value) => setValue('captionFontStyle', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select font style" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(CAPTION_FONT_STYLES).map(([key, value]) => (
                          <SelectItem key={key} value={value}>
                            {value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.captionFontStyle && (
                      <p className="text-sm text-red-500 mt-1">{errors.captionFontStyle.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="captionFontSize">Font Size</Label>
                    <Select
                      value={watchedValues.captionFontSize}
                      onValueChange={(value) => setValue('captionFontSize', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select font size" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(CAPTION_FONT_SIZES).map(([key, value]) => (
                          <SelectItem key={key} value={value}>
                            {value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.captionFontSize && (
                      <p className="text-sm text-red-500 mt-1">{errors.captionFontSize.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="captionPosition">Caption Position</Label>
                    <Select
                      value={watchedValues.captionPosition}
                      onValueChange={(value) => setValue('captionPosition', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select position" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(CAPTION_POSITIONS).map(([key, value]) => (
                          <SelectItem key={key} value={value}>
                            {value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.captionPosition && (
                      <p className="text-sm text-red-500 mt-1">{errors.captionPosition.message}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
                     <Button 
             type="submit" 
             disabled={isSubmitting}
             className="min-w-[120px]"
           >
            {isSubmitting ? 'Generating...' : 'Generate Image'}
          </Button>
        </div>
      </form>
    </div>
  )
}
