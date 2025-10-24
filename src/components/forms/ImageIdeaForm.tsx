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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  X, 
  Image as ImageIcon, 
  Upload, 
  Link, 
  Mic, 
  MicOff, 
  Sparkles, 
  Eye, 
  CheckCircle, 
  XCircle,
  Plus,
  Trash2,
  Type
} from 'lucide-react'
import { 
  IMAGE_TYPES, 
  IMAGE_STYLES, 
  IMAGE_MODELS, 
  IMAGE_SIZES,
  IMAGE_STATUS,
  CAPTION_FONT_STYLES,
  CAPTION_FONT_SIZES,
  CAPTION_POSITIONS
} from '@/lib/types/content'
import ImageBrowserModal from '@/components/modals/ImageBrowserModal'

// Image Idea Form Data Schema (using Images table fields)
interface ImageIdeaFormData {
  imagePrompt?: string
  imageScene?: string
  imageType?: string
  imageStyle?: string
  imageModel?: string
  imageSize?: string
  referenceUrl?: string
  operationType: 'generate' | 'combine' | 'edit'
  selectedImages?: string[]
  uploadedImages?: File[]
  imageStatus?: string
  // Caption fields
  useCaptions?: boolean
  captionText?: string
  captionFontStyle?: string
  captionFontSize?: string
  captionPosition?: string
}

// Operation types for radio selection
const OPERATION_TYPES = {
  GENERATE: 'generate',
  COMBINE: 'combine',
  EDIT: 'edit'
} as const

interface ImageIdeaFormProps {
  onSubmit: (data: ImageIdeaFormData) => Promise<{ success: boolean; recordId?: string; data?: any }>
  onClose: () => void
  initialData?: Partial<ImageIdeaFormData>
  isEditing?: boolean
  isLoading?: boolean
  clientId: string
}

export default function ImageIdeaForm({
  onSubmit,
  onClose,
  initialData,
  isEditing = false,
  isLoading = false,
  clientId
}: ImageIdeaFormProps) {
  const [operationType, setOperationType] = useState<'generate' | 'combine' | 'edit'>('generate')
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const [uploadedImages, setUploadedImages] = useState<File[]>([])
  const [referenceImageFile, setReferenceImageFile] = useState<File | null>(null)
  const [voiceNoteFile, setVoiceNoteFile] = useState<File | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [showImageBrowser, setShowImageBrowser] = useState(false)
  const [browsingForOperation, setBrowsingForOperation] = useState<'combine' | 'edit' | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([])
  const [recordingTime, setRecordingTime] = useState(0)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid }
  } = useForm<ImageIdeaFormData>({
    defaultValues: {
      imagePrompt: '',
      imageScene: '',
      imageType: IMAGE_TYPES.NEW_IMAGE,
      imageStyle: IMAGE_STYLES.PHOTOREALISTIC,
      imageModel: IMAGE_MODELS.OPENAI_GPT_IMAGE_1,
      imageSize: IMAGE_SIZES.SQUARE_1024,
      referenceUrl: '',
      operationType: 'generate',
      imageStatus: IMAGE_STATUS.GENERATING,
      // Caption defaults
      useCaptions: false,
      captionText: '',
      captionFontStyle: CAPTION_FONT_STYLES.ARIAL,
      captionFontSize: CAPTION_FONT_SIZES.MEDIUM,
      captionPosition: CAPTION_POSITIONS.BOTTOM_CENTER,
      ...initialData
    }
  })

  // Watch form values
  const watchedValues = watch()

  // Set initial operation type from initial data
  useEffect(() => {
    if (initialData?.operationType) {
      setOperationType(initialData.operationType)
    }
  }, [initialData])

  // Cleanup recording on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorder && isRecording) {
        mediaRecorder.stop()
        if ((mediaRecorder as any).timer) {
          clearInterval((mediaRecorder as any).timer)
        }
      }
    }
  }, [mediaRecorder, isRecording])

  // Handle operation type change
  const handleOperationTypeChange = (value: string) => {
    const newOperationType = value as 'generate' | 'combine' | 'edit'
    setOperationType(newOperationType)
    setValue('operationType', newOperationType)
    
    // Clear selections when changing operation type
    if (newOperationType === 'generate') {
      setSelectedImages([])
      setUploadedImages([])
    }
  }


  // Handle voice note file change
  const handleVoiceNoteChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setVoiceNoteFile(file)
    }
  }


  // Start voice recording
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

  // Stop voice recording
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

  // Toggle recording
  const toggleRecording = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  // Format recording time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Handle image upload for combine/edit operations
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setUploadedImages(prev => [...prev, ...files])
  }

  // Remove uploaded image
  const removeUploadedImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index))
  }

  // Handle browse images for combine/edit
  const handleBrowseImages = (operation: 'combine' | 'edit') => {
    setBrowsingForOperation(operation)
    setShowImageBrowser(true)
  }

  // Handle image selection from browser
  const handleSelectImageFromBrowser = (image: any) => {
    console.log('ImageIdeaForm: Received image from browser:', image)
    if (browsingForOperation) {
      // Extract the imageId from the image object
      const imageId = String(image.imageId || image.id)
      console.log('ImageIdeaForm: Extracted imageId:', imageId)
      setSelectedImages(prev => [...prev, imageId])
      setShowImageBrowser(false)
      setBrowsingForOperation(null)
    }
  }

  // Remove selected image
  const removeSelectedImage = (imageId: string) => {
    setSelectedImages(prev => prev.filter(id => id !== imageId))
  }

  // Handle form submission
  const onFormSubmit = async (data: ImageIdeaFormData) => {
    try {
      setIsSubmitting(true)
      
      // First, create the image idea record
      const formData = {
        ...data,
        operationType,
        selectedImages: operationType === 'combine' || operationType === 'edit' ? selectedImages : undefined,
        uploadedImages: operationType === 'combine' || operationType === 'edit' ? uploadedImages : undefined,
        // For combine/edit operations, use the first uploaded image as reference image
        referenceImage: operationType === 'combine' || operationType === 'edit' ? 
          (uploadedImages && uploadedImages.length > 0 ? uploadedImages[0] : undefined) : 
          referenceImageFile,
        voiceNote: voiceNoteFile // Include voice note file
      }
      
      // Call the parent onSubmit to create the record and trigger webhook
      const result = await onSubmit(formData)
      console.log('ImageIdeaForm: API result:', result)
      
      // The webhook is now handled by the /api/baserow/[clientId]/image-ideas endpoint
      // No need to call triggerImageGeneration separately
      
    } catch (error) {
      console.error('Error submitting form:', error)
    } finally {
      setIsSubmitting(false)
    }
  }


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-2xl font-bold">
              {isEditing ? 'Edit Image Idea' : 'Create New Image Idea'}
            </CardTitle>
            <CardDescription>
              {isEditing ? 'Update your image idea details' : 'Create a new image idea with your specifications'}
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="imageStatus">Status</Label>
                <Select {...register('imageStatus')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(IMAGE_STATUS).map(([key, value]) => (
                      <SelectItem key={key} value={value}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>


            {/* Image Settings - Available for All Operations */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Image Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="imageStyle">Image Style</Label>
                  <Select {...register('imageStyle')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select style" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(IMAGE_STYLES).map(([key, value]) => (
                        <SelectItem key={key} value={value}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="imageModel">Image Model</Label>
                  <Select {...register('imageModel')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(IMAGE_MODELS).map(([key, value]) => (
                        <SelectItem key={key} value={value}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="imageSize">Image Size</Label>
                  <Select {...register('imageSize')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(IMAGE_SIZES).map(([key, value]) => (
                        <SelectItem key={key} value={value}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Image Captions Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Type className="h-5 w-5" />
                Image Captions
              </h3>
              <p className="text-sm text-gray-600">
                Add text captions to the generated image.
              </p>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="useCaptions"
                  checked={watch('useCaptions')}
                  onCheckedChange={(checked) => setValue('useCaptions', checked)}
                />
                <Label htmlFor="useCaptions">Add captions to image</Label>
              </div>

              {watch('useCaptions') && (
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
                        value={watch('captionFontStyle')}
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
                        value={watch('captionFontSize')}
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
                        value={watch('captionPosition')}
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
            </div>

            {/* Image Notes - Available for All Operations */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Image Notes</h3>
              
              {/* Text Note */}
              <div className="space-y-2">
                <Label htmlFor="imagePrompt">Text Note</Label>
                <Textarea
                  id="imagePrompt"
                  {...register('imagePrompt')}
                  placeholder="Describe the image you want to create, including details about the scene, style, composition, etc..."
                  rows={4}
                />
              </div>
              
              {/* Voice Note */}
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
            </div>


            {/* Operation Type Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Image Creation Method</h3>
              
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
            </div>



            {/* Combine Images Section */}
            {operationType === 'combine' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Combine Images</h3>
                <p className="text-sm text-gray-600">
                  Select existing images and upload new ones to combine them.
                </p>
                
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
              </div>
            )}

            {/* Edit Image Section */}
            {operationType === 'edit' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Edit Existing Image</h3>
                <p className="text-sm text-gray-600">
                  Select an existing image and upload new images to edit it.
                </p>
                
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
              </div>
            )}


            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={!isValid || isLoading || isSubmitting}
                className="min-w-[120px]"
              >
                {isLoading || isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    {isEditing ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    {isEditing ? 'Update Image Idea' : 'Create Image Idea'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

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
