'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Mic, MicOff, Upload, X } from 'lucide-react'

export interface BlogRequestFormData {
  blogTopic: string
  inputType: 'Text' | 'URL' | 'Voice Note'
  focusedKeywords: string
  contentGoal: string
  additionalContext: string
  voiceNoteFile?: File
  recordedAudio?: Blob
}

interface BlogRequestFormProps {
  onSubmit: (data: BlogRequestFormData) => void
  isLoading?: boolean
  clientId?: string
}

export default function BlogRequestForm({ onSubmit, isLoading = false, clientId = 'modern-management' }: BlogRequestFormProps) {
  const [formData, setFormData] = useState<BlogRequestFormData>({
    blogTopic: '',
    inputType: 'Text',
    focusedKeywords: '',
    contentGoal: '',
    additionalContext: ''
  })

  const [errors, setErrors] = useState<Partial<BlogRequestFormData>>({})
  const [isRecording, setIsRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [audioChunks, setAudioChunks] = useState<Blob[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleInputChange = (field: keyof BlogRequestFormData, value: string | File | Blob) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<BlogRequestFormData> = {}
    
    if (!formData.blogTopic.trim()) {
      newErrors.blogTopic = 'Blog topic is required'
    }
    
    if (!formData.focusedKeywords.trim()) {
      newErrors.focusedKeywords = 'Focused keywords are required'
    }
    
    if (!formData.contentGoal.trim()) {
      newErrors.contentGoal = 'Content goal is required'
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
        const audioBlob = new Blob(chunks, { type: 'audio/webm' })
        handleInputChange('recordedAudio', audioBlob)
        stream.getTracks().forEach(track => track.stop())
      }
      
      recorder.start()
      setMediaRecorder(recorder)
      setAudioChunks(chunks)
      setIsRecording(true)
    } catch (error) {
      console.error('Error accessing microphone:', error)
      alert('Could not access microphone. Please check your permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop()
      setIsRecording(false)
      setMediaRecorder(null)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleInputChange('voiceNoteFile', file)
    }
  }

  const clearAudio = () => {
    handleInputChange('recordedAudio', undefined)
    handleInputChange('voiceNoteFile', undefined)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const hasAudioFile = formData.voiceNoteFile || formData.recordedAudio

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Blog Post Request</CardTitle>
        <CardDescription>
          Provide your blog topic and requirements. Our AI will research keywords and create your blog post.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Blog Topic */}
          <div className="space-y-2">
            <Label htmlFor="blogTopic">Blog Topic *</Label>
            <Input
              id="blogTopic"
              value={formData.blogTopic}
              onChange={(e) => handleInputChange('blogTopic', e.target.value)}
              placeholder="What should your blog post be about?"
              className={errors.blogTopic ? 'border-red-500' : ''}
            />
            {errors.blogTopic && <p className="text-sm text-red-500">{errors.blogTopic}</p>}
          </div>

          {/* Input Type */}
          <div className="space-y-2">
            <Label htmlFor="inputType">Input Type *</Label>
            <Select 
              value={formData.inputType} 
              onValueChange={(value: 'Text' | 'URL' | 'Voice Note') => handleInputChange('inputType', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Text">Text</SelectItem>
                <SelectItem value="URL">URL</SelectItem>
                <SelectItem value="Voice Note">Voice Note</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Focused Keywords */}
          <div className="space-y-2">
            <Label htmlFor="focusedKeywords">Focused Keywords *</Label>
            <Input
              id="focusedKeywords"
              value={formData.focusedKeywords}
              onChange={(e) => handleInputChange('focusedKeywords', e.target.value)}
              placeholder="Enter keywords separated by commas (e.g., digital marketing, SEO, content strategy)"
              className={errors.focusedKeywords ? 'border-red-500' : ''}
            />
            {errors.focusedKeywords && <p className="text-sm text-red-500">{errors.focusedKeywords}</p>}
          </div>

          {/* Content Goal */}
          <div className="space-y-2">
            <Label htmlFor="contentGoal">Content Goal *</Label>
            <Textarea
              id="contentGoal"
              value={formData.contentGoal}
              onChange={(e) => handleInputChange('contentGoal', e.target.value)}
              placeholder="What do you want to achieve with this blog post? (e.g., educate readers, drive traffic, generate leads)"
              rows={3}
              className={errors.contentGoal ? 'border-red-500' : ''}
            />
            {errors.contentGoal && <p className="text-sm text-red-500">{errors.contentGoal}</p>}
          </div>

          {/* Additional Context */}
          <div className="space-y-2">
            <Label htmlFor="additionalContext">Additional Context (Optional)</Label>
            <Textarea
              id="additionalContext"
              value={formData.additionalContext}
              onChange={(e) => handleInputChange('additionalContext', e.target.value)}
              placeholder="Any additional information, tone preferences, or specific points to include..."
              rows={3}
            />
          </div>

          {/* Voice Note Section */}
          {formData.inputType === 'Voice Note' && (
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
              <Label>Voice Note</Label>
              
              {/* Recording Controls */}
              <div className="flex items-center gap-4">
                {!isRecording ? (
                  <Button
                    type="button"
                    onClick={startRecording}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Mic className="h-4 w-4" />
                    Start Recording
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={stopRecording}
                    variant="destructive"
                    className="flex items-center gap-2"
                  >
                    <MicOff className="h-4 w-4" />
                    Stop Recording
                  </Button>
                )}
                
                <Button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Upload File
                </Button>
                
                {hasAudioFile && (
                  <Button
                    type="button"
                    onClick={clearAudio}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Clear
                  </Button>
                )}
              </div>
              
              {/* File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              
              {/* Audio Status */}
              {isRecording && (
                <div className="flex items-center gap-2 text-red-600">
                  <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                  <span className="text-sm">Recording...</span>
                </div>
              )}
              
              {hasAudioFile && (
                <div className="text-sm text-green-600">
                  ✓ Audio file ready for upload
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="min-w-[120px]"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                'Create Blog Post'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
