'use client'

import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  X, 
  Upload, 
  Sparkles,
  AlertCircle,
  CheckCircle,
  Trash2
} from 'lucide-react'
import { 
  BRAND_ASSET_TYPES,
  BRAND_ASSET_PLATFORMS,
  BRAND_ASSET_CONTENT_TYPES
} from '@/lib/types/content'
import { z } from 'zod'

const generateAssetSchema = z.object({
  assetName: z.string().min(1, 'Asset name is required').max(200, 'Asset name must be less than 200 characters'),
  platform: z.enum(['Facebook', 'Instagram', 'X', 'LinkedIn', 'Blog', 'Email', 'Website', 'Print', 'Universal']),
  contentType: z.enum(['Social Media Post', 'Story', 'Reel', 'Blog Post', 'Email Campaign', 'General']),
  assetType: z.enum(['Brand Voice', 'Visual Asset', 'Template', 'Guidelines']),
  fileUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
})

type GenerateAssetFormData = z.infer<typeof generateAssetSchema> & {
  file?: File
}

interface GenerateBrandAssetFormProps {
  onSubmit: (data: GenerateAssetFormData) => void
  onClose: () => void
  isLoading?: boolean
}

export default function GenerateBrandAssetForm({
  onSubmit,
  onClose,
  isLoading = false
}: GenerateBrandAssetFormProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<GenerateAssetFormData>({
    resolver: zodResolver(generateAssetSchema),
         defaultValues: {
       assetName: '',
       platform: 'Universal',
       contentType: 'General',
       assetType: 'Brand Voice',
       fileUrl: '',
       notes: ''
     }
  })

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file size (max 50MB for AI processing)
    if (file.size > 50 * 1024 * 1024) {
      setUploadError('File size must be less than 50MB')
      return
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      'application/pdf', 'text/plain', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'video/mp4', 'video/avi', 'video/mov', 'video/wmv',
      'audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/aac'
    ]
    
    if (!allowedTypes.includes(file.type)) {
      setUploadError('File type not supported. Please upload an image, PDF, document, video, or audio file.')
      return
    }

    setUploadError(null)
    setUploadedFile(file)
  }

  const handleRemoveFile = () => {
    setUploadedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const onFormSubmit = (data: GenerateAssetFormData) => {
    // Include the uploaded file in the form data
    const formDataWithFile = {
      ...data,
      file: uploadedFile || undefined
    }
    onSubmit(formDataWithFile)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-purple-600" />
            Generate Brand Asset with AI
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Provide basic information and let AI create your brand asset
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

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Asset Information</CardTitle>
            <CardDescription>
              Provide the essential details for AI generation
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
                        {type}
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
                  value={watch('platform')} 
                  onValueChange={(value) => setValue('platform', value as any)}
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

             <div className="space-y-2">
               <Label htmlFor="notes">Additional Context & Notes</Label>
               <Textarea
                 id="notes"
                 placeholder="Provide additional context, specific requirements, or special instructions for the AI..."
                 className="min-h-[100px]"
                 {...register('notes')}
               />
               <p className="text-xs text-gray-500">
                 Optional: Add context, requirements, or special instructions to help AI generate better content
               </p>
               {errors.notes && (
                 <p className="text-sm text-red-600">{errors.notes.message}</p>
               )}
             </div>
          </CardContent>
        </Card>

        {/* File Upload */}
        <Card>
          <CardHeader>
            <CardTitle>Reference File (Optional)</CardTitle>
            <CardDescription>
              Upload a file to help AI understand your brand better
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Upload File</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 relative">
                {uploadedFile ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">
                          {uploadedFile.name}
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
                      PDF, Word docs, Images, Videos, Audio files up to 50MB
                    </p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileUpload}
                  accept="image/*,.pdf,.doc,.docx,.txt,video/*,audio/*"
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
              <Label htmlFor="fileUrl">External File URL (Optional)</Label>
              <Input
                id="fileUrl"
                placeholder="https://example.com/brand-asset.pdf"
                {...register('fileUrl')}
              />
              {errors.fileUrl && (
                <p className="text-sm text-red-600">{errors.fileUrl.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* AI Processing Info */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Sparkles className="h-5 w-5" />
              AI Processing Information
            </CardTitle>
          </CardHeader>
                     <CardContent className="text-sm text-blue-700">
             <ul className="space-y-2">
               <li>• A brand asset will be created immediately with your basic information</li>
               <li>• The AI will analyze your input, notes, and any uploaded files</li>
               <li>• The asset will be enhanced with detailed content based on your context</li>
               <li>• The asset will be updated automatically once AI processing is complete</li>
               <li>• You can view the asset in the list while it's being processed</li>
             </ul>
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
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isSubmitting || isLoading ? (
              <>
                <Sparkles className="h-4 w-4 mr-2 animate-pulse" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate with AI
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
