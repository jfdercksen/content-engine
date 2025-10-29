'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { imageFormSchema, ImageFormData, Image, IMAGE_TYPES, IMAGE_STYLES, IMAGE_MODELS, IMAGE_SIZES, CAPTION_FONT_STYLES, CAPTION_FONT_SIZES, CAPTION_POSITIONS } from '@/lib/types/content'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { X, Image as ImageIcon, Upload, Link, Type, Settings, Mic, MicOff, Sparkles, Eye, CheckCircle, Plus, Trash2 } from 'lucide-react'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import ImageBrowserModal from '@/components/modals/ImageBrowserModal'

interface ImageGenerationFormProps {
  onSubmit: (data: ImageFormData) => void
  onClose: () => void
  initialData?: ImageFormData
  postText?: string // Text from the social media post to generate initial prompt
  clientId: string
}

// Operation types for radio selection
const OPERATION_TYPES = {
  GENERATE: 'generate',
  COMBINE: 'combine',
  EDIT: 'edit'
} as const

export default function ImageGenerationForm({
  onSubmit,
  onClose,
  initialData,
  postText,
  clientId
}: ImageGenerationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRegeneratingPrompt, setIsRegeneratingPrompt] = useState(false)
  
  // Enhanced state variables from ImageIdeaForm
  const [operationType, setOperationType] = useState<'generate' | 'combine' | 'edit'>('generate')
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const [uploadedImages, setUploadedImages] = useState<File[]>([])
  const [voiceNoteFile, setVoiceNoteFile] = useState<File | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [showImageBrowser, setShowImageBrowser] = useState(false)
  const [browsingForOperation, setBrowsingForOperation] = useState<'combine' | 'edit' | null>(null)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([])
  const [recordingTime, setRecordingTime] = useState(0)

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


  // Enhanced handlers from ImageIdeaForm
  const handleOperationTypeChange = (value: string) => {
    setOperationType(value as 'generate' | 'combine' | 'edit')
    // Clear selections when changing operation type
    if (value === 'generate') {
      setSelectedImages([])
      setUploadedImages([])
    }
  }

  const handleVoiceNoteChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setVoiceNoteFile(file)
    }
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setUploadedImages(prev => [...prev, ...files])
  }

  const removeUploadedImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleBrowseImages = (operation: 'combine' | 'edit') => {
    setBrowsingForOperation(operation)
    setShowImageBrowser(true)
  }

  const handleSelectImageFromBrowser = (image: Partial<Image>) => {
    // Extract the image ID from the image object
    // Handle both string IDs and object with id property
    let imageId: string = ''
    
    if (typeof image === 'string') {
      imageId = image
    } else if (image?.id) {
      // Convert to string if it's a number
      imageId = String(image.id)
    }
    
    if (!imageId) {
      console.error('No image ID found in selected image:', image)
      return
    }
    
    if (browsingForOperation && !selectedImages.includes(imageId)) {
      setSelectedImages(prev => [...prev, imageId])
    }
    setShowImageBrowser(false)
    setBrowsingForOperation(null)
  }

  const removeSelectedImage = (imageId: string) => {
    setSelectedImages(prev => prev.filter(id => id !== imageId))
  }

  // Voice recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks: Blob[] = []

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      }

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        const file = new File([blob], `voice-note-${Date.now()}.webm`, { type: 'audio/webm' })
        setVoiceNoteFile(file)
        setRecordedChunks([])
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop())
      }

      recorder.start()
      setMediaRecorder(recorder)
      setRecordedChunks(chunks)
      setIsRecording(true)
      setRecordingTime(0)

      // Start recording timer
      const timer = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

      // Store timer reference for cleanup
      ;(recorder as any).timer = timer

    } catch (error) {
      console.error('Error starting recording:', error)
      alert('Unable to access microphone. Please check your permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop()
      setIsRecording(false)
      
      // Clear timer
      if ((mediaRecorder as any).timer) {
        clearInterval((mediaRecorder as any).timer)
      }
    }
  }

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
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
        referenceUrl: data.referenceUrl || '',
        // Enhanced fields
        operationType: operationType,
        selectedImages: operationType === 'combine' || operationType === 'edit' ? selectedImages : [],
        uploadedImages: operationType === 'combine' || operationType === 'edit' ? uploadedImages : [],
        voiceNote: voiceNoteFile,
        imageStatus: 'Generating'
      }

      console.log('Complete form data:', completeData)

      // Check if we have any files to upload
      const hasFiles = voiceNoteFile || uploadedImages.length > 0
      
      if (hasFiles) {
        console.log('Creating FormData with files')
        const formData = new FormData()
        
        // Add all form fields
        Object.keys(completeData).forEach(key => {
          const value = completeData[key as keyof ImageFormData]
          if (value !== undefined && value !== null) {
            if (key === 'selectedImages' && Array.isArray(value)) {
              value.forEach((imageId: string) => formData.append('selectedImages', imageId))
            } else if (key === 'uploadedImages' && Array.isArray(value)) {
              value.forEach((file: File) => formData.append('uploadedImages', file))
            } else if (key === 'useCaptions' || key === 'isNewPost' || key === 'useReferenceImage') {
              // Handle boolean fields
              formData.append(key, String(value))
            } else if (typeof value !== 'object' || value instanceof File) {
              formData.append(key, String(value))
            }
          }
        })
        
        // Add files
        if (voiceNoteFile) {
          formData.append('voiceNote', voiceNoteFile)
        }
        
        console.log('FormData entries:')
        for (const [key, value] of formData.entries()) {
          console.log(`${key}:`, value instanceof File ? `File: ${value.name} (${value.size} bytes)` : value)
        }
        
        console.log('Sending FormData with files')
        await onSubmit(formData as any)
      } else {
        // No files, send as JSON
        console.log('No files found, sending JSON data')
        console.log('Sending JSON data:', completeData)
        console.log('JSON data keys:', Object.keys(completeData))
        console.log('JSON data values:', Object.values(completeData))
        await onSubmit(completeData)
      }
    } catch (error) {
      console.error('Error submitting image generation form:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header - Fixed */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white flex-shrink-0">
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

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">

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

            {/* Voice Note Section */}
            <div className="space-y-2">
              <Label htmlFor="voiceNote">Voice Note (Optional)</Label>
              <div className="space-y-3">
                {/* File Upload */}
                <Input
                  id="voiceNote"
                  type="file"
                  accept="audio/*,video/*"
                  onChange={handleVoiceNoteChange}
                  className="flex-1"
                />
                
                {/* Recording Controls */}
                <div className="flex items-center space-x-4">
                  <Button
                    type="button"
                    variant={isRecording ? "destructive" : "outline"}
                    size="sm"
                    onClick={toggleRecording}
                    disabled={isSubmitting}
                  >
                    {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    {isRecording ? 'Stop Recording' : 'Record Voice Note'}
                  </Button>
                  
                  {isRecording && (
                    <div className="flex items-center space-x-2 text-sm text-red-600">
                      <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                      <span>Recording: {formatTime(recordingTime)}</span>
                    </div>
                  )}
                </div>
                
                {/* Show current voice note file */}
                {voiceNoteFile && (
                  <div className="flex items-center space-x-2 p-2 bg-green-50 border border-green-200 rounded">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-800">
                      Voice note ready: {voiceNoteFile.name}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setVoiceNoteFile(null)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Operation Type Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Image Creation Method
            </CardTitle>
            <CardDescription>
              Choose how you want to create your image.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={operationType} onValueChange={handleOperationTypeChange}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={OPERATION_TYPES.GENERATE} id="generate" />
                <Label htmlFor="generate" className="flex items-center space-x-2">
                  <Sparkles className="h-4 w-4" />
                  <span>Generate New Image (from prompts/voice notes)</span>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={OPERATION_TYPES.COMBINE} id="combine" />
                <Label htmlFor="combine" className="flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>Combine Images (existing + upload new)</span>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={OPERATION_TYPES.EDIT} id="edit" />
                <Label htmlFor="edit" className="flex items-center space-x-2">
                  <ImageIcon className="h-4 w-4" />
                  <span>Edit Existing Image (existing + upload new)</span>
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Combine Images Section */}
        {operationType === 'combine' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Combine Images
              </CardTitle>
              <CardDescription>
                Select existing images and upload new ones to combine them.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Existing Images</Label>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleBrowseImages('combine')}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Browse Existing Images
                  </Button>
                  
                  {selectedImages.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedImages.map((imageId) => (
                        <Badge key={imageId} variant="secondary" className="flex items-center space-x-1">
                          <span>Image #{imageId}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSelectedImage(imageId)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Upload New Images</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                  />
                  
                  {uploadedImages.length > 0 && (
                    <div className="space-y-2">
                      {uploadedImages.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <span className="text-sm">{file.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeUploadedImage(index)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Edit Image Section */}
        {operationType === 'edit' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Edit Existing Image
              </CardTitle>
              <CardDescription>
                Select an existing image and upload new images to edit it.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Base Image to Edit</Label>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleBrowseImages('edit')}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Select Base Image
                  </Button>
                  
                  {selectedImages.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedImages.map((imageId) => (
                        <Badge key={imageId} variant="secondary" className="flex items-center space-x-1">
                          <span>Image #{imageId}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSelectedImage(imageId)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Upload Additional Images</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                  />
                  
                  {uploadedImages.length > 0 && (
                    <div className="space-y-2">
                      {uploadedImages.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <span className="text-sm">{file.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeUploadedImage(index)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
      </form>
        </div>
      </div>

      {/* Fixed Bottom Actions */}
      <div className="p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="min-w-[120px]"
            onClick={handleSubmit(onFormSubmit)}
          >
            {isSubmitting ? 'Generating...' : 'Generate Image'}
          </Button>
        </div>
      </div>

      {/* Image Browser Modal */}
      {showImageBrowser && (
        <ImageBrowserModal
          isOpen={showImageBrowser}
          onClose={() => {
            setShowImageBrowser(false)
            setBrowsingForOperation(null)
          }}
          onSelectImage={handleSelectImageFromBrowser}
          clientId={clientId}
        />
      )}
    </div>
  )
}
