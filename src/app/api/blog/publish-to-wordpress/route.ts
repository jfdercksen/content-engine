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

    // Fetch blog post data directly using BaserowAPI
    const baserowAPI = new BaserowAPI(
      clientConfig.baserow.token,
      clientConfig.baserow.databaseId,
      clientConfig.fieldMappings
    )
    
    const blogPostsTableId = clientConfig.baserow.tables.blogPosts
    if (!blogPostsTableId) {
      return NextResponse.json(
        { error: 'Blog Posts table not configured' },
        { status: 500 }
      )
    }
    
    let blogPost
    try {
      blogPost = await baserowAPI.getBlogPostById(blogPostsTableId, blogPostId)
    } catch (error) {
      console.error('❌ Error fetching blog post:', error)
      throw new Error(`Failed to fetch blog post: ${error instanceof Error ? error.message : 'Not Found'}`)
    }
    
    if (!blogPost) {
      throw new Error('Blog post not found')
    }
    console.log('📝 Blog post data fetched:', { 
      title: blogPost.title, 
      status: blogPost.status,
      hasImage: !!blogPost.featured_image_url,
      hasLinkedImage: !!blogPost.featured_image,
      featured_image: blogPost.featured_image,
      featured_image_url: blogPost.featured_image_url,
      allFieldKeys: Object.keys(blogPost).filter(k => k.startsWith('field_') || k.includes('image')).slice(0, 10)
    })

    // Extract featured image from linked image if available
    let featuredImageUrl = blogPost.featured_image_url || ''
    let featuredImageAlt = blogPost.featured_image_alt || ''
    
    // Extract featured_image field - check both mapped name and raw Baserow field IDs
    // (Same logic as GET route to handle cases where field isn't in mappings)
    let featuredImageField: any = blogPost.featured_image || blogPost.featuredImage
    
    // If not found in mapped fields, check raw Baserow fields (field_XXXXX format)
    if (!featuredImageField) {
      console.log('Checking raw Baserow fields for featured_image in publish endpoint...')
      try {
        const detectedFieldId = await baserowAPI['findFeaturedImageFieldId'](blogPostsTableId)
        if (detectedFieldId) {
          const fieldKey = `field_${detectedFieldId}`
          console.log(`Looking for featured_image field: ${fieldKey}`)
          
          // Check if the field exists in the record (even if empty/null)
          if (fieldKey in blogPost) {
            featuredImageField = blogPost[fieldKey]
            console.log(`✅ Found featured_image field: ${fieldKey}`, featuredImageField)
          } else {
            // Fallback: check all field_ fields for link_row arrays
            for (const [key, value] of Object.entries(blogPost)) {
              if (key.startsWith('field_')) {
                const fieldId = key.replace('field_', '')
                if (String(detectedFieldId) === fieldId) {
                  console.log(`✅ Found featured_image field by ID match: ${key}`)
                  featuredImageField = value
                  break
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Error detecting featured_image field in publish endpoint:', error)
      }
    }
    
    // If we have a linked image, always fetch it to ensure we have the latest URL
    // This is important because the URL might not be saved in featured_image_url field
    if (featuredImageField) {
      try {
        // Extract image ID(s) from the linked field
        let imageId: number | string | null = null
        
        if (Array.isArray(featuredImageField)) {
          // If it's an array, get the first item
          const firstItem = featuredImageField[0]
          imageId = firstItem?.id || firstItem?.value || firstItem
          console.log('Featured image field contains array, extracted ID:', imageId)
        } else if (typeof featuredImageField === 'object' && featuredImageField !== null) {
          // If it's an object, extract the ID
          imageId = (featuredImageField as any).id || (featuredImageField as any).value || featuredImageField
          console.log('Featured image field contains object, extracted ID:', imageId)
        } else if (typeof featuredImageField === 'string' && featuredImageField.trim() !== '') {
          // If it's a string (ID), convert it to a number
          imageId = parseInt(featuredImageField, 10)
          console.log('Featured image field contains string ID:', imageId)
        } else if (typeof featuredImageField === 'number') {
          // If it's a number, use it directly
          imageId = featuredImageField
          console.log('Featured image field is a number:', imageId)
        }
        
        if (!imageId) {
          console.warn('⚠️ Could not extract image ID from featured_image field:', {
            field: featuredImageField,
            fieldType: typeof featuredImageField,
            isArray: Array.isArray(featuredImageField)
          })
        } else {
          console.log('📸 Fetching linked featured image:', imageId)
          
          // Fetch the image record
          const imagesTableId = clientConfig.baserow.tables.images
          if (imagesTableId) {
            const imagesResult = await baserowAPI.getImages(imagesTableId, {})
            const linkedImage = imagesResult.results?.find((img: any) => {
              const imgId = img.id?.toString() || String(img.id)
              const searchId = imageId?.toString() || String(imageId)
              return imgId === searchId
            })
            
            if (linkedImage) {
              // Extract image URL - try multiple formats (same logic as GET route)
              let extractedUrl = ''
              
              // Check imageLinkUrl first (string URL)
              if (linkedImage.imageLinkUrl && typeof linkedImage.imageLinkUrl === 'string' && linkedImage.imageLinkUrl.trim() !== '') {
                extractedUrl = linkedImage.imageLinkUrl
              } else if (linkedImage.imagelinkurl && typeof linkedImage.imagelinkurl === 'string' && linkedImage.imagelinkurl.trim() !== '') {
                // Try imagelinkurl (lowercase)
                extractedUrl = linkedImage.imagelinkurl
              } else if (Array.isArray(linkedImage.image) && linkedImage.image.length > 0) {
                // image is an array of file objects - extract URL from first file
                const firstFile = linkedImage.image[0]
                extractedUrl = firstFile?.url || ''
              } else if (linkedImage.image && typeof linkedImage.image === 'string') {
                // image is a string URL
                extractedUrl = linkedImage.image
              } else if (linkedImage.imageUrl && typeof linkedImage.imageUrl === 'string') {
                // Try imageUrl directly
                extractedUrl = linkedImage.imageUrl
              }
              
              // Use extracted URL if we got one, otherwise keep existing URL
              if (extractedUrl && extractedUrl.trim() !== '') {
                featuredImageUrl = extractedUrl
                console.log('✅ Extracted featured image URL from linked record:', featuredImageUrl)
              } else {
                console.log('⚠️ Linked image found but no URL extracted, using existing URL:', featuredImageUrl)
                console.log('linkedImage.image type:', typeof linkedImage.image, Array.isArray(linkedImage.image))
                console.log('linkedImage.imageLinkUrl:', linkedImage.imageLinkUrl)
              }
              
              // Extract alt text from caption or prompt (only if not already set)
              if (!featuredImageAlt || featuredImageAlt.trim() === '') {
                featuredImageAlt = linkedImage.captionText || linkedImage.imagePrompt || 
                                 linkedImage.captiontext || linkedImage.imageprompt ||
                                 blogPost.title || ''
              }
              
              console.log('✅ Featured image processed:', {
                url: featuredImageUrl,
                alt: featuredImageAlt,
                linkedImageId: imageId
              })
            } else {
              console.warn('⚠️ Linked image ID not found in images table:', imageId)
            }
          }
        }
      } catch (error) {
        console.error('⚠️ Error fetching linked featured image:', error)
        // Continue with existing URL if fetch fails
      }
    } else {
      console.warn('⚠️ No featured_image field found in blog post - checking for field_ keys:', 
        Object.keys(blogPost).filter(k => k.startsWith('field_')).slice(0, 5))
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
      featuredImageUrl: payload.featuredImage?.url || 'none',
      featuredImageAlt: payload.featuredImage?.alt || 'none',
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

