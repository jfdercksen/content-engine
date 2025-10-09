'use client';

import React, { useState } from 'react';
import BlogRequestForm from '@/components/forms/BlogRequestForm';

interface BlogRequestData {
  input_type: 'text' | 'voice_note' | 'url';
  content: string;
  submission_timestamp: string;
}

export default function BlogPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    success: boolean;
    message: string;
    data?: any;
  } | null>(null);

  const handleBlogRequest = async (data: BlogRequestData) => {
    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      console.log('📝 Submitting blog request:', data);

      const response = await fetch('/api/blog/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        setSubmitResult({
          success: true,
          message: 'Blog request submitted successfully!',
          data: result.data
        });
        console.log('✅ Blog request successful:', result);
      } else {
        setSubmitResult({
          success: false,
          message: result.error || 'Failed to submit blog request'
        });
        console.error('❌ Blog request failed:', result);
      }
    } catch (error) {
      console.error('❌ Blog request error:', error);
      setSubmitResult({
        success: false,
        message: 'Network error. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Blog Post Creator
          </h1>
          <p className="text-gray-600">
            Create professional blog posts with AI-powered content generation
          </p>
        </div>

        {/* Success/Error Messages */}
        {submitResult && (
          <div className={`mb-6 p-4 rounded-lg ${
            submitResult.success 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <div className="flex items-center">
              {submitResult.success ? (
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              <span className="font-medium">{submitResult.message}</span>
            </div>
            
            {submitResult.success && submitResult.data && (
              <div className="mt-2 text-sm">
                <p>Content length: {submitResult.data.content_length} characters</p>
                <p>Input type: {submitResult.data.input_type}</p>
                <p>Submitted at: {new Date(submitResult.data.submission_timestamp).toLocaleString()}</p>
              </div>
            )}
          </div>
        )}

        {/* Blog Request Form */}
        <BlogRequestForm onSubmit={handleBlogRequest} />

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            How it works:
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-800">
            <li>Choose how you want to provide your content (text, voice, or URL)</li>
            <li>Enter your blog idea or reference material</li>
            <li>Our AI will analyze your content and generate keyword suggestions</li>
            <li>We'll create a professional blog post with SEO optimization</li>
            <li>You'll receive the complete blog post ready for publishing</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

