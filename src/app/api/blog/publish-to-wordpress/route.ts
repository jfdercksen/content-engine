import { NextRequest, NextResponse } from 'next/server'
import { getClientConfigForAPI } from '@/lib/utils/getClientConfigForAPI'
import { getWebhookUrl } from '@/lib/utils/getWebhookUrl'
import { SettingsManager } from '@/lib/config/settingsManager'

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
      hasImage: !!blogPost.featured_image_url
    })

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
      featuredImage: blogPost.featured_image_url ? {
        url: blogPost.featured_image_url,
        alt: blogPost.featured_image_alt || blogPost.title || '',
        caption: blogPost.featured_image_alt || '',
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

