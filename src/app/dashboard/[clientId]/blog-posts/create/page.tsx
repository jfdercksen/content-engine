'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useClientConfig } from '@/hooks/useClientConfig'
import BlogRequestForm, { BlogRequestFormData } from '@/components/forms/BlogRequestForm'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, FileText, CheckCircle } from 'lucide-react'

export default function CreateBlogPostPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.clientId as string
  
  const { clientConfig, isLoading: configLoading, error: configError } = useClientConfig(clientId)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionSuccess, setSubmissionSuccess] = useState(false)
  const [submissionError, setSubmissionError] = useState<string | null>(null)

  const handleFormSubmit = async (formData: BlogRequestFormData) => {
    console.log('=== PAGE HANDLE FORM SUBMIT CALLED ===')
    console.log('Form data received:', formData)
    console.log('Client ID:', clientId)
    
    setIsSubmitting(true)
    setSubmissionError(null)

    try {
      // Check if we have a voice note file to upload
      const hasVoiceNoteFile = formData.voiceNoteFile || formData.recordedAudio
      
      let response: Response
      
      if (hasVoiceNoteFile) {
        // Use FormData for file upload
        const submitData = new FormData()
        submitData.append('clientId', clientId)
        submitData.append('blogTopic', formData.blogTopic)
        submitData.append('inputType', formData.inputType)
        submitData.append('focusedKeywords', formData.focusedKeywords)
        submitData.append('contentGoal', formData.contentGoal)
        submitData.append('additionalContext', formData.additionalContext)
        
        // Add voice note file
        if (formData.voiceNoteFile) {
          submitData.append('voiceNoteFile', formData.voiceNoteFile)
        } else if (formData.recordedAudio) {
          // Convert Blob to File for recorded audio
          const audioFile = new File([formData.recordedAudio], 'voice-note.webm', {
            type: formData.recordedAudio.type || 'audio/webm'
          })
          submitData.append('voiceNoteFile', audioFile)
        }
        
        response = await fetch('/api/blog-post/create', {
          method: 'POST',
          body: submitData
        })
      } else {
        // Use JSON for non-file submissions
        console.log('Making JSON API call...')
        response = await fetch('/api/blog-post/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            clientId,
            formData
          })
        })
        console.log('API response status:', response.status)
        console.log('API response ok:', response.ok)
      }

      const result = await response.json()
      console.log('API response result:', result)

      if (!response.ok) {
        console.error('API call failed:', result)
        throw new Error(result.error || 'Failed to create blog post')
      }

      console.log('API call successful, setting success state...')
      setSubmissionSuccess(true)
      
      // Redirect to blog posts list after 3 seconds
      setTimeout(() => {
        router.push(`/dashboard/${clientId}/blog-posts`)
      }, 3000)

    } catch (error) {
      console.error('Blog post creation error:', error)
      setSubmissionError(error instanceof Error ? error.message : 'An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (configLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading client configuration...</p>
          </div>
        </div>
      </div>
    )
  }

  if (configError || !clientConfig) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              {configError || 'Client not found'}
            </p>
            <Button 
              onClick={() => router.back()} 
              className="mt-4"
              variant="outline"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (submissionSuccess) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-green-100 rounded-full w-fit">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-green-600">Blog Post Created!</CardTitle>
            <CardDescription>
              Your blog post request has been submitted successfully.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              Our AI is now researching keywords and creating your blog post. 
              This process may take a few minutes.
            </p>
            <p className="text-sm text-gray-500">
              You'll be redirected to the blog posts page shortly...
            </p>
            <Button 
              onClick={() => router.push(`/dashboard/${clientId}/blog-posts`)}
              className="w-full"
            >
              <FileText className="mr-2 h-4 w-4" />
              View Blog Posts
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button 
            onClick={() => router.back()} 
            variant="outline" 
            size="sm"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create Blog Post</h1>
            <p className="text-gray-600 mt-1">
              Generate AI-powered blog content with keyword research
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <BlogRequestForm
        onSubmit={handleFormSubmit}
        isLoading={isSubmitting}
        clientId={clientId}
      />

      {/* Error Message */}
      {submissionError && (
        <Card className="mt-6 max-w-2xl mx-auto border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{submissionError}</p>
            <Button 
              onClick={() => setSubmissionError(null)}
              className="mt-4"
              variant="outline"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card className="mt-8 max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-lg">How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
              1
            </div>
            <div>
              <p className="font-medium">Submit Your Request</p>
              <p className="text-sm text-gray-600">Fill out the form with your blog topic and requirements</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
              2
            </div>
            <div>
              <p className="font-medium">AI Keyword Research</p>
              <p className="text-sm text-gray-600">Our AI researches optimal keywords using Serper API</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
              3
            </div>
            <div>
              <p className="font-medium">Content Generation</p>
              <p className="text-sm text-gray-600">AI creates your blog post using brand assets and selected keywords</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
              4
            </div>
            <div>
              <p className="font-medium">Review & Edit</p>
              <p className="text-sm text-gray-600">View your blog post with keyword data and make any adjustments</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
