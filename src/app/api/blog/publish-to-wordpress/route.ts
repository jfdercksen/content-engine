import { NextRequest, NextResponse } from 'next/server'
import { getClientConfigForAPI } from '@/lib/utils/getClientConfigForAPI'
import { getWebhookUrl } from '@/lib/utils/getWebhookUrl'
import { SettingsManager } from '@/lib/config/settingsManager'
import { BaserowAPI } from '@/lib/baserow/api'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { clientId, blogPostId } = body

    if (!clientId || !blogPostId) {
      return NextResponse.json(
        { error: 'clientId and blogPostId are required' },
        { status: 400 }
      )
    }

    console.log(`📤 Publishing blog post ${blogPostId} to WordPress for client ${clientId}`)

    // Get client configuration
    const clientConfig = await getClientConfigForAPI(clientId)
    if (!clientConfig) {
      return NextResponse.json(
        { error: `Client configuration not found for ${clientId}` },
        { status: 404 }
      )
    }

    // Fetch blog post data
    const blogPostResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/baserow/${clientId}/blog-posts/${blogPostId}`
    )

    if (!blogPostResponse.ok) {
      throw new Error(`Failed to fetch blog post: ${blogPostResponse.statusText}`)
    }

    const blogPost = await blogPostResponse.json()
    console.log('📝 Blog post data fetched:', { 
      title: blogPost.title, 
      status: blogPost.status,
      hasImage: !!blogPost.featured_image_url,
      hasLinkedImage: !!blogPost.featured_image
    })

    // Extract featured image from linked image if available
    let featuredImageUrl = blogPost.featured_image_url || ''
    let featuredImageAlt = blogPost.featured_image_alt || ''
    
    // If we have a linked image, fetch it and extract the URL
    if (blogPost.featured_image && !featuredImageUrl) {
      try {
        const baserowAPI = new BaserowAPI(
          clientConfig.baserow.token,
          clientConfig.baserow.databaseId,
          clientConfig.fieldMappings
        )
        
        // Extract image ID(s) from the linked field
        const imageIds = Array.isArray(blogPost.featured_image) 
          ? blogPost.featured_image.map((img: any) => img.id || img.value || img)
          : [blogPost.featured_image.id || blogPost.featured_image.value || blogPost.featured_image]
        
        if (imageIds.length > 0 && imageIds[0]) {
          const imageId = imageIds[0]
          console.log('📸 Fetching linked featured image:', imageId)
          
          // Fetch the image record
          const imagesTableId = clientConfig.baserow.tables.images
          if (imagesTableId) {
            const imagesResult = await baserowAPI.getImages(imagesTableId, {})
            const linkedImage = imagesResult.results?.find((img: any) => 
              img.id === imageId || img.id === imageId.toString() || img.id.toString() === imageId.toString()
            )
            
            if (linkedImage) {
              // Extract image URL - try imageLinkUrl first, then image field
              if (linkedImage.imageLinkUrl) {
                featuredImageUrl = linkedImage.imageLinkUrl
              } else if (linkedImage.image) {
                if (Array.isArray(linkedImage.image) && linkedImage.image.length > 0) {
                  featuredImageUrl = linkedImage.image[0].url || linkedImage.image[0]
                } else if (typeof linkedImage.image === 'string') {
                  featuredImageUrl = linkedImage.image
                }
              }
              
              // Extract alt text from caption or prompt
              featuredImageAlt = linkedImage.captionText || linkedImage.imagePrompt || blogPost.title || ''
              
              console.log('✅ Extracted featured image from linked record:', {
                url: featuredImageUrl,
                alt: featuredImageAlt
              })
            }
          }
        }
      } catch (error) {
        console.error('⚠️ Error fetching linked featured image:', error)
        // Continue without image if fetch fails
      }
    }

    // Get WordPress settings from client settings
    const { settings, preferences } = await SettingsManager.getAllClientConfig(clientId)
    const wordpressConfig = {
      siteUrl: settings.wordpress?.site_url || '',
      username: settings.wordpress?.username || '',
      appPassword: settings.wordpress?.app_password || '',
    }

    console.log('🔧 WordPress config:', {
      siteUrl: wordpressConfig.siteUrl,
      username: wordpressConfig.username,
      hasAppPassword: !!wordpressConfig.appPassword
    })

    // Get WordPress publisher webhook URL
    const webhookUrl = await getWebhookUrl(clientId, 'wordpress_publisher')
    if (!webhookUrl) {
      return NextResponse.json(
        { error: 'WordPress publisher webhook not configured' },
        { status: 500 }
      )
    }

    console.log('📡 WordPress webhook URL:', webhookUrl)

    // Prepare payload for WordPress publishing
    const payload = {
      // Client Info
      clientId: clientId,
      clientName: clientConfig.name,

      // Blog Post Data
      blogPost: {
        id: blogPost.id,
        title: blogPost.title || '',
        content: blogPost.content || '',
        excerpt: blogPost.meta_description || '',
        slug: blogPost.slug || '',
        focusKeyword: blogPost.focus_keyword || '',
        metaDescription: blogPost.meta_description || '',
        metaTitle: blogPost.meta_title || '',
        category: blogPost.category || '',
        tags: blogPost.tags ? blogPost.tags.split(',').map((t: string) => t.trim()) : [],
        status: 'publish', // Always publish when this endpoint is called
        scheduledDate: blogPost.scheduled_publish_date || new Date().toISOString(),
      },

      // Featured Image
      featuredImage: featuredImageUrl ? {
        url: featuredImageUrl,
        alt: featuredImageAlt || blogPost.title || '',
        caption: featuredImageAlt || '',
      } : null,

      // WordPress Configuration
      wordpress: wordpressConfig,

      // SEO Data
      seo: {
        focusKeyword: blogPost.focus_keyword || '',
        secondaryKeywords: blogPost.secondary_keywords ? 
          blogPost.secondary_keywords.split(',').map((k: string) => k.trim()) : [],
        metaTitle: blogPost.meta_title || blogPost.title || '',
        metaDescription: blogPost.meta_description || '',
        seoScore: blogPost.seo_score || 0,
        readabilityScore: blogPost.readability_score || 0,
      },

      // Additional Data
      metadata: {
        authorId: blogPost.author_id || '1',
        wordCount: blogPost.word_count || 0,
        internalLinks: blogPost.internal_links || '',
        externalSources: blogPost.external_sources || '',
      }
    }

    console.log('📦 Sending payload to WordPress webhook:', {
      title: payload.blogPost.title,
      hasContent: !!payload.blogPost.content,
      hasFeaturedImage: !!payload.featuredImage,
      wordpressConfigured: !!(wordpressConfig.siteUrl && wordpressConfig.appPassword && wordpressConfig.username)
    })

    // Send to WordPress webhook
    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text()
      console.error('❌ WordPress webhook error:', errorText)
      throw new Error(`WordPress webhook failed: ${webhookResponse.statusText}`)
    }

    const webhookResult = await webhookResponse.json()
    console.log('✅ WordPress webhook response:', webhookResult)

    return NextResponse.json({
      success: true,
      message: 'Blog post sent to WordPress publishing workflow',
      webhookResult,
    })

  } catch (error) {
    console.error('❌ Error publishing to WordPress:', error)
    return NextResponse.json(
      {
        error: 'Failed to publish to WordPress',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

