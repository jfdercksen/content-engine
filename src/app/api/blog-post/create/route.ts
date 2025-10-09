import { NextRequest, NextResponse } from 'next/server'
import { getClientConfigForAPI } from '@/lib/utils/getClientConfigForAPI'
import { BaserowAPI } from '@/lib/baserow/api'

interface BlogPostFormData {
  blogTopic: string
  inputType: 'Text' | 'URL' | 'Voice Note'
  focusedKeywords: string
  contentGoal: string
  additionalContext: string
  content?: string
  voiceNoteFile?: File
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== BLOG POST CREATE API CALLED ===')
    console.log('Request method:', request.method)
    console.log('Request headers:', Object.fromEntries(request.headers.entries()))
    
    // Handle both JSON and FormData requests
    let clientId: string
    let formData: BlogPostFormData
    let voiceNoteFile: File | null = null

    const contentType = request.headers.get('content-type')
    
    if (contentType?.includes('multipart/form-data')) {
      // Handle FormData (with file upload)
      const formDataRequest = await request.formData()
      clientId = formDataRequest.get('clientId') as string
      
      // Extract form fields
      formData = {
        blogTopic: formDataRequest.get('blogTopic') as string,
        inputType: formDataRequest.get('inputType') as 'Text' | 'URL' | 'Voice Note',
        focusedKeywords: formDataRequest.get('focusedKeywords') as string,
        contentGoal: formDataRequest.get('contentGoal') as string,
        additionalContext: formDataRequest.get('additionalContext') as string,
        content: formDataRequest.get('content') as string
      }
      
      // Extract voice note file if present
      const file = formDataRequest.get('voiceNoteFile') as File
      if (file && file.size > 0) {
        voiceNoteFile = file
      }
    } else {
      // Handle JSON request (no file upload)
      const body = await request.json()
      const requestData = body as { clientId: string; formData: BlogPostFormData }
      clientId = requestData.clientId
      formData = requestData.formData
    }

    if (!clientId || !formData) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get client configuration
    const clientConfig = await getClientConfigForAPI(clientId)
    if (!clientConfig) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    // Get webhook URL from environment
    const webhookUrl = process.env.N8N_BLOG_WORKFLOW_WEBHOOK_URL
    if (!webhookUrl) {
      return NextResponse.json(
        { error: 'Blog workflow webhook not configured' },
        { status: 500 }
      )
    }

    // First, save the blog request to Baserow
    let blogRequestRecord = null
    let blogPostRecord = null
    
    try {
      console.log('=== BLOG REQUEST SAVE DEBUG ===')
      console.log('Client config tables:', clientConfig.baserow.tables)
      console.log('Blog requests table ID:', clientConfig.baserow.tables.blogRequests)
      console.log('Field mappings for blogRequests:', clientConfig.fieldMappings?.blogRequests)
      
      const baserowAPI = new BaserowAPI(
        clientConfig.baserow.token,
        clientConfig.baserow.databaseId,
        clientConfig.fieldMappings
      )

      // Step 1: Create an empty blog post record first
      const blogPostData = {
        title: formData.blogTopic,
        slug: formData.blogTopic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
        content: '', // Will be filled by n8n workflow
        focus_keyword: formData.focusedKeywords,
        status: 'Draft', // Initial status
        seo_score: 0, // Will be filled by n8n workflow
        word_count: 0, // Will be filled by n8n workflow
        readability_score: 0, // Will be filled by n8n workflow
        // created_at is read-only (created_on) - automatically set by Baserow
        // updated_at is read-only (last_modified) - automatically set by Baserow
        scheduled_publish_date: null,
        author_id: clientId,
        processing_log: 'Blog post created, awaiting AI generation...'
        // Skip fields that might be select fields with no valid options
        // meta_title, meta_description, secondary_keywords, featured_image_prompt, 
        // alt_texts, internal_links, external_sources, category, tags
      }

      console.log('Creating blog post record first...')
      console.log('Blog post data:', blogPostData)
      console.log('Blog posts table ID:', clientConfig.baserow.tables.blogPosts)
      console.log('Blog posts field mappings:', clientConfig.fieldMappings?.blogPosts)
      
      try {
        blogPostRecord = await baserowAPI.createBlogPost(
          clientConfig.baserow.tables.blogPosts,
          blogPostData
        )
        console.log('✅ Blog post created successfully:', blogPostRecord)
      } catch (blogPostError) {
        console.error('❌ Blog post creation failed:', blogPostError)
        throw blogPostError
      }

      // Step 2: Create blog request record with link to blog post
      const blogRequestData = {
        input_type: formData.inputType,
        original_content: formData.blogTopic + (formData.content ? '\n\n' + formData.content : ''),
        processed_content: '', // Will be filled by n8n workflow
        // submission_timestamp is read-only (created_on) - automatically set by Baserow
        status: 'Pending',
        workflow_execution_id: '', // Will be filled by n8n workflow
        selected_keyword: formData.focusedKeywords,
        keyword_data: '', // Will be filled by n8n workflow
        content_length: 0, // Will be filled by n8n workflow
        error_message: '',
        blog_post_id: blogPostRecord.id // Link to the blog post record
        // completion_timestamp is a link_row field - skip when null
      }

      console.log('Creating blog request record with blog post link...')
      blogRequestRecord = await baserowAPI.createBlogRequest(
        clientConfig.baserow.tables.blogRequests,
        blogRequestData
      )

      console.log('✅ Blog request saved successfully:', blogRequestRecord)

    } catch (error) {
      console.error('Error saving blog request to Baserow:', error)
      // Continue with webhook even if Baserow save fails
    }

    // Prepare webhook payload (after blog request is saved)
    const webhookPayload = {
      // Client information
      clientId: clientId,
      clientName: clientConfig.displayName, // Use display name instead of internal name
      clientDisplayName: clientConfig.displayName,
      baserowToken: clientConfig.baserow.token,
      baserowDatabaseId: clientConfig.baserow.databaseId,
      
      // Table IDs
      blogRequestsTableId: clientConfig.baserow.tables.blogRequests,
      blogPostsTableId: clientConfig.baserow.tables.blogPosts,
      keywordResearchTableId: clientConfig.baserow.tables.keywordResearch,
      
      // Field mappings
      fieldMappings: clientConfig.fieldMappings,
      
      // Form data
      blogTopic: formData.blogTopic,
      inputType: formData.inputType,
      focusedKeywords: formData.focusedKeywords,
      contentGoal: formData.contentGoal,
      additionalContext: formData.additionalContext,
      
      // Content based on input type
      content: formData.content || '',
      
      // Voice note information
      hasVoiceNote: voiceNoteFile !== null || formData.inputType === 'Voice Note',
      voiceNoteFileName: voiceNoteFile?.name || null,
      voiceNoteFileSize: voiceNoteFile?.size || null,
      voiceNoteFileType: voiceNoteFile?.type || null,
      
      // Blog request and blog post record IDs (if successfully saved)
      blogRequestId: blogRequestRecord?.id || null,
      blogPostId: blogPostRecord?.id || null,
      
      // Metadata
      timestamp: new Date().toISOString(),
      status: 'processing'
    }

    console.log('Blog Post Creation - Webhook Payload:', {
      clientId,
      blogTopic: formData.blogTopic,
      inputType: formData.inputType,
      contentGoal: formData.contentGoal,
      blogRequestId: blogRequestRecord?.id,
      webhookUrl: webhookUrl.substring(0, 50) + '...'
    })

    console.log('Blog Post Creation - Full webhook URL:', webhookUrl)
    console.log('Blog Post Creation - Payload size:', JSON.stringify(webhookPayload).length)

    // Send to n8n webhook
    let webhookResult = null
    try {
      const webhookResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload)
      })

      if (!webhookResponse.ok) {
        const errorText = await webhookResponse.text()
        console.error('Webhook error:', errorText)
        console.error('Webhook status:', webhookResponse.status)
        console.error('Webhook statusText:', webhookResponse.statusText)
        
        // For now, continue without webhook (temporary workaround)
        console.log('⚠️ Webhook failed, but continuing with blog post creation...')
        webhookResult = { 
          error: 'Webhook not available',
          status: webhookResponse.status,
          message: errorText
        }
      } else {
        webhookResult = await webhookResponse.json()
        console.log('Blog Post Creation - Webhook Response:', webhookResult)
      }
    } catch (webhookError) {
      console.error('Webhook call failed:', webhookError)
      console.log('⚠️ Webhook call failed, but continuing with blog post creation...')
      webhookResult = { 
        error: 'Webhook call failed',
        message: webhookError.message
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Blog post creation initiated successfully',
      data: webhookResult
    })

  } catch (error) {
    console.error('Blog post creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
