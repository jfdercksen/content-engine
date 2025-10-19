'use client'

import { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  X, 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  Palette, 
  Type, 
  Layout, 
  Mic,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Trash2
} from 'lucide-react'
import { 
  BrandAssetFormData, 
  brandAssetFormSchema,
  BrandAsset,
  BRAND_ASSET_TYPES,
  BRAND_ASSET_STATUS,
  BRAND_ASSET_PRIORITY,
  BRAND_ASSET_PLATFORMS,
  BRAND_ASSET_CONTENT_TYPES
} from '@/lib/types/content'

interface BrandAssetFormProps {
  onSubmit: (data: BrandAssetFormData) => void
  onClose: () => void
  initialData?: Partial<BrandAsset>
  isEditing?: boolean
  isLoading?: boolean
}

export default function BrandAssetForm({
  onSubmit,
  onClose,
  initialData,
  isEditing = false,
  isLoading = false
}: BrandAssetFormProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(initialData?.fileUrl || null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<BrandAssetFormData>({
    resolver: zodResolver(brandAssetFormSchema),
    defaultValues: {
      assetName: initialData?.assetName || '',
      platform: initialData?.platform || ['Universal'],
      contentType: initialData?.contentType || 'General',
      assetType: initialData?.assetType || 'Brand Voice',
      assetInformation: initialData?.assetInformation || '',
      brandVoiceGuidelines: initialData?.brandVoiceGuidelines || '',
      approvedHashtags: initialData?.approvedHashtags || '',
      toneStylePreferences: initialData?.toneStylePreferences || '',
      forbiddenWordsTopics: initialData?.forbiddenWordsTopics || '',
      platformSpecificRules: initialData?.platformSpecificRules || '',
      fileUrl: initialData?.fileUrl || '',
      status: initialData?.status || 'Active',
      priority: initialData?.priority || 'Medium',
      notes: initialData?.notes || ''
    }
  })

  // Populate form when editing
  useEffect(() => {
    if (isEditing && initialData) {
      console.log('📝 Populating form with initialData:', initialData)
      reset({
        assetName: initialData.assetName || '',
        platform: initialData.platform || ['Universal'],
        contentType: initialData.contentType || 'General',
        assetType: initialData.assetType || 'Brand Voice',
        assetInformation: initialData.assetInformation || '',
        brandVoiceGuidelines: initialData.brandVoiceGuidelines || '',
        approvedHashtags: initialData.approvedHashtags || '',
        toneStylePreferences: initialData.toneStylePreferences || '',
        forbiddenWordsTopics: initialData.forbiddenWordsTopics || '',
        platformSpecificRules: initialData.platformSpecificRules || '',
        fileUrl: initialData.fileUrl || '',
        status: initialData.status || 'Active',
        priority: initialData.priority || 'Medium',
        notes: initialData.notes || ''
      })
    }
  }, [isEditing, initialData, reset])

  const watchedAssetType = watch('assetType')
  const watchedPlatform = watch('platform')
  const watchedFileUrl = watch('fileUrl')

  const getAssetTypeIcon = (assetType: string) => {
    switch (assetType.toLowerCase()) {
      case 'brand voice': return <Mic className="h-5 w-5 text-purple-600" />
      case 'visual asset': return <ImageIcon className="h-5 w-5 text-green-600" />
      case 'template': return <Layout className="h-5 w-5 text-blue-600" />
      case 'guidelines': return <FileText className="h-5 w-5 text-orange-600" />
      default: return <FileText className="h-5 w-5 text-gray-500" />
    }
  }

  const getAssetTypeDescription = (assetType: string) => {
    switch (assetType.toLowerCase()) {
      case 'brand voice': return 'Define your brand\'s tone, style, and messaging guidelines'
      case 'visual asset': return 'Images, graphics, and visual elements for your brand'
      case 'template': return 'Reusable templates for consistent content creation'
      case 'guidelines': return 'Brand guidelines and standards documentation'
      default: return 'Brand asset for your content creation'
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size must be less than 10MB')
      return
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      'application/pdf', 'text/plain', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
    
    if (!allowedTypes.includes(file.type)) {
      setUploadError('File type not supported. Please upload an image, PDF, or document file.')
      return
    }

    setUploadError(null)
    setUploadedFile(file)

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setFilePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setFilePreview(null)
    }
  }

  const handleRemoveFile = () => {
    setUploadedFile(null)
    setFilePreview(null)
    setValue('fileUrl', '')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const onFormSubmit = (data: BrandAssetFormData) => {
    console.log('🚀 Form submit triggered')
    console.log('📋 Form data:', data)
    console.log('🔧 Is editing:', isEditing)
    console.log('📎 Uploaded file:', uploadedFile)
    
    // Include the uploaded file in the form data
    const formDataWithFile = {
      ...data,
      file: uploadedFile || undefined
    }
    
    console.log('📤 Submitting data:', formDataWithFile)
    onSubmit(formDataWithFile)
  }

  const isImageFile = (url: string) => {
    return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">
            {isEditing ? 'Edit Brand Asset' : 'Create Brand Asset'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {isEditing ? 'Update your brand asset information' : 'Add a new asset to your brand library'}
          </p>
        </div>
        <Button 
          variant="ghost" 
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onClose()
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Section */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getAssetTypeIcon(watchedAssetType)}
                  Basic Information
                </CardTitle>
                <CardDescription>
                  {getAssetTypeDescription(watchedAssetType)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="assetName">Asset Name *</Label>
                  <Input
                    id="assetName"
                    placeholder="e.g., Primary Logo, Brand Voice Guidelines, Color Palette"
                    {...register('assetName')}
                  />
                  {errors.assetName && (
                    <p className="text-sm text-red-600">{errors.assetName.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="assetType">Asset Type *</Label>
                    <Select 
                      value={watch('assetType')} 
                      onValueChange={(value) => setValue('assetType', value as any)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select asset type" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(BRAND_ASSET_TYPES).map((type) => (
                          <SelectItem key={type} value={type}>
                            <div className="flex items-center gap-2">
                              {getAssetTypeIcon(type)}
                              {type}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.assetType && (
                      <p className="text-sm text-red-600">{errors.assetType.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="platform">Platform *</Label>
                    <Select 
                      value={Array.isArray(watch('platform')) ? watch('platform')[0] : watch('platform')} 
                      onValueChange={(value) => setValue('platform', [value] as any)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select platform" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(BRAND_ASSET_PLATFORMS).map((platform) => (
                          <SelectItem key={platform} value={platform}>
                            {platform}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.platform && (
                      <p className="text-sm text-red-600">{errors.platform.message}</p>
                    )}
                  </div>
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
                        {Object.values(BRAND_ASSET_CONTENT_TYPES).map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                  </Select>
                  {errors.contentType && (
                    <p className="text-sm text-red-600">{errors.contentType.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Asset Information */}
            <Card>
              <CardHeader>
                <CardTitle>Asset Information</CardTitle>
                <CardDescription>
                  Provide detailed information about this brand asset
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="assetInformation">Asset Information</Label>
                  <Textarea
                    id="assetInformation"
                    placeholder="Describe the asset, provide guidelines, or include the actual content..."
                    className="min-h-[120px]"
                    {...register('assetInformation')}
                  />
                  <p className="text-xs text-gray-500">
                    General information about this brand asset, its purpose, and usage guidelines.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brandVoiceGuidelines">Brand Voice Guidelines</Label>
                  <Textarea
                    id="brandVoiceGuidelines"
                    placeholder="Define your brand's tone, style, and messaging guidelines..."
                    className="min-h-[120px]"
                    {...register('brandVoiceGuidelines')}
                  />
                  <p className="text-xs text-gray-500">
                    Specific guidelines for maintaining consistent brand voice across all content.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="approvedHashtags">Approved Hashtags</Label>
                  <Textarea
                    id="approvedHashtags"
                    placeholder="List approved hashtags for social media content..."
                    className="min-h-[80px]"
                    {...register('approvedHashtags')}
                  />
                  <p className="text-xs text-gray-500">
                    Hashtags that are approved for use in social media content.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="toneStylePreferences">Tone & Style Preferences</Label>
                  <Textarea
                    id="toneStylePreferences"
                    placeholder="Define preferred tone and style for content..."
                    className="min-h-[80px]"
                    {...register('toneStylePreferences')}
                  />
                  <p className="text-xs text-gray-500">
                    Preferred tone, style, and approach for content creation.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="forbiddenWordsTopics">Forbidden Words/Topics</Label>
                  <Textarea
                    id="forbiddenWordsTopics"
                    placeholder="List words, phrases, or topics to avoid..."
                    className="min-h-[80px]"
                    {...register('forbiddenWordsTopics')}
                  />
                  <p className="text-xs text-gray-500">
                    Words, phrases, or topics that should be avoided in content.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="platformSpecificRules">Platform-Specific Rules</Label>
                  <Textarea
                    id="platformSpecificRules"
                    placeholder="Define rules specific to each platform..."
                    className="min-h-[120px]"
                    {...register('platformSpecificRules')}
                  />
                  <p className="text-xs text-gray-500">
                    Rules and guidelines specific to different platforms (Facebook, Instagram, etc.).
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Additional notes, usage instructions, or context..."
                    className="min-h-[80px]"
                    {...register('notes')}
                  />
                </div>
              </CardContent>
            </Card>

            {/* File Upload */}
            <Card>
              <CardHeader>
                <CardTitle>File Upload</CardTitle>
                <CardDescription>
                  Upload a file or provide an external URL for this asset
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* File Upload */}
                <div className="space-y-2">
                  <Label>Upload File</Label>
                                     <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 relative">
                     {uploadedFile || filePreview ? (
                       <div className="space-y-3">
                         {filePreview && isImageFile(filePreview) && (
                           <div className="flex justify-center">
                             <img 
                               src={filePreview} 
                               alt="Preview" 
                               className="max-w-xs max-h-48 object-contain rounded-lg"
                             />
                           </div>
                         )}
                         <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                           <div className="flex items-center gap-2">
                             <CheckCircle className="h-4 w-4 text-green-600" />
                             <span className="text-sm font-medium">
                               {uploadedFile ? uploadedFile.name : 'Current file'}
                             </span>
                           </div>
                           <Button
                             type="button"
                             variant="ghost"
                             size="sm"
                             onClick={handleRemoveFile}
                           >
                             <Trash2 className="h-4 w-4" />
                           </Button>
                         </div>
                       </div>
                     ) : (
                       <div className="text-center">
                         <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                         <p className="text-sm text-gray-600 mb-2">
                           Click to upload or drag and drop
                         </p>
                         <p className="text-xs text-gray-500">
                           Images, PDFs, and documents up to 10MB
                         </p>
                       </div>
                     )}
                     <input
                       ref={fileInputRef}
                       type="file"
                       onChange={handleFileUpload}
                       accept="image/*,.pdf,.doc,.docx,.txt"
                       className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                     />
                   </div>
                  {uploadError && (
                    <div className="flex items-center gap-2 text-sm text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      {uploadError}
                    </div>
                  )}
                </div>

                {/* External URL */}
                <div className="space-y-2">
                  <Label htmlFor="fileUrl">External File URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="fileUrl"
                      placeholder="https://example.com/brand-asset.pdf"
                      {...register('fileUrl')}
                    />
                    {watchedFileUrl && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(watchedFileUrl, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  {errors.fileUrl && (
                    <p className="text-sm text-red-600">{errors.fileUrl.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Status & Priority */}
            <Card>
              <CardHeader>
                <CardTitle>Status & Priority</CardTitle>
                <CardDescription>
                  Set the availability and importance of this asset
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status *</Label>
                    <Select 
                      value={watch('status')} 
                      onValueChange={(value) => setValue('status', value as any)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(BRAND_ASSET_STATUS).map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.status && (
                      <p className="text-sm text-red-600">{errors.status.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority *</Label>
                    <Select 
                      value={watch('priority')} 
                      onValueChange={(value) => setValue('priority', value as any)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(BRAND_ASSET_PRIORITY).map((priority) => (
                          <SelectItem key={priority} value={priority}>
                            {priority}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.priority && (
                      <p className="text-sm text-red-600">{errors.priority.message}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-4 pt-6 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onClose()
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || isLoading}
              >
                {isSubmitting || isLoading ? 'Saving...' : (isEditing ? 'Update Asset' : 'Create Asset')}
              </Button>
            </div>
          </form>
        </div>

        {/* Preview Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getAssetTypeIcon(watchedAssetType)}
                Asset Preview
              </CardTitle>
              <CardDescription>
                How this asset will appear in your library
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-lg bg-gray-50">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {getAssetTypeIcon(watchedAssetType)}
                    <h4 className="font-medium truncate">
                      {watch('assetName') || 'Asset Name'}
                    </h4>
                  </div>
                  <Badge variant="outline">
                    {watch('priority')}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{watchedAssetType}</Badge>
                    <Badge variant="secondary">{watchedPlatform}</Badge>
                  </div>
                  
                                     {watch('assetInformation') && (
                     <p className="text-sm text-gray-700">
                       {watch('assetInformation').substring(0, 150)}
                       {watch('assetInformation').length > 150 ? '...' : ''}
                     </p>
                   )}
                  
                  {(uploadedFile || watchedFileUrl) && (
                    <div className="flex items-center gap-1 text-xs text-blue-600">
                      <ExternalLink className="h-3 w-3" />
                      <span>File attached</span>
                    </div>
                  )}
                  
                  <Badge variant="outline" className="text-xs">
                    {watch('status')}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Usage Guidelines */}
          <Card>
            <CardHeader>
              <CardTitle>Usage Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <strong>Platform:</strong> {Array.isArray(watchedPlatform) ? watchedPlatform.join(', ') : watchedPlatform}
                <p className="text-gray-600">
                  This asset will be available for {Array.isArray(watchedPlatform) && watchedPlatform.includes('Universal') ? 'all platforms' : Array.isArray(watchedPlatform) ? watchedPlatform.join(', ') : watchedPlatform} content.
                </p>
              </div>
              
              <div>
                <strong>Asset Type:</strong> {watchedAssetType}
                <p className="text-gray-600">
                  {getAssetTypeDescription(watchedAssetType)}
                </p>
              </div>
              
              <div>
                <strong>Priority:</strong> {watch('priority')}
                <p className="text-gray-600">
                  {watch('priority') === 'High' && 'This asset will be prioritized in content generation.'}
                  {watch('priority') === 'Medium' && 'This asset will be used when appropriate.'}
                  {watch('priority') === 'Low' && 'This asset will be used as a fallback option.'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}