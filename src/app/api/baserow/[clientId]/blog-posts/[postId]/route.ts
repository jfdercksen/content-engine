import { NextRequest, NextResponse } from 'next/server'
import { getClientConfigForAPI } from '@/lib/utils/getClientConfigForAPI'
import { BaserowAPI } from '@/lib/baserow/api'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string; postId: string }> }
) {
  try {
    const { clientId, postId } = await params
    const clientConfig = await getClientConfigForAPI(clientId)

    if (!clientConfig) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const baserowAPI = new BaserowAPI(
      clientConfig.baserow.token,
      clientConfig.baserow.databaseId,
      clientConfig.fieldMappings
    )

    const blogPost = await baserowAPI.getBlogPostById(
      clientConfig.baserow.tables.blogPosts,
      postId
    )

    // Map fields from Baserow format to display format
    const record = blogPost

    console.log('Mapped blog post record:', record)
    console.log('Record featured_image field:', record.featured_image)

    // Extract featured_image field - check both mapped name and raw Baserow field IDs
    let featuredImageField: any = record.featured_image || record.featuredImage
    
    // If not found in mapped fields, check raw Baserow fields (field_XXXXX format)
    // Auto-detect the featured_image field ID once to find the correct field
    if (!featuredImageField) {
      console.log('Checking raw Baserow fields for featured_image...')
      console.log('Available record keys:', Object.keys(record).filter(k => k.startsWith('field_')))
      try {
        const detectedFieldId = await baserowAPI['findFeaturedImageFieldId'](clientConfig.baserow.tables.blogPosts)
        if (detectedFieldId) {
          const fieldKey = `field_${detectedFieldId}`
          console.log(`Looking for featured_image field: ${fieldKey}`)
          
          // Check if the field exists in the record (even if empty/null)
          if (fieldKey in record) {
            const fieldValue = record[fieldKey]
            console.log(`✅ Found featured_image field: ${fieldKey}, value:`, fieldValue)
            featuredImageField = fieldValue
            // Map it to the expected field name for consistency
            record.featured_image = fieldValue
          } else {
            console.log(`⚠️ Featured image field ${fieldKey} not found in record`)
            console.log('All field_ keys in record:', Object.keys(record).filter(k => k.startsWith('field_')))
            
            // Fallback: check all field_ fields for link_row arrays (including empty ones)
            for (const [key, value] of Object.entries(record)) {
              if (key.startsWith('field_')) {
                const fieldId = key.replace('field_', '')
                if (String(detectedFieldId) === fieldId) {
                  console.log(`✅ Found featured_image field by ID match: ${key}`)
                  featuredImageField = value
                  record.featured_image = value
                  break
                }
              }
            }
            
            // If still not found, check for arrays that look like link_row fields
            if (!featuredImageField) {
              for (const [key, value] of Object.entries(record)) {
                if (key.startsWith('field_') && Array.isArray(value) && value.length > 0) {
                  const firstItem = (value as any[])[0]
                  if (firstItem && (firstItem.id || firstItem.value)) {
                    const fieldId = key.replace('field_', '')
                    if (String(detectedFieldId) === fieldId) {
                      console.log(`✅ Found featured_image field by fallback: ${key}`)
                      featuredImageField = value
                      record.featured_image = value
                      break
                    }
                  }
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Error detecting featured_image field:', error)
        // Fallback: just find the first field_ that looks like a link_row array
        for (const [key, value] of Object.entries(record)) {
          if (key.startsWith('field_') && Array.isArray(value) && value.length > 0) {
            const firstItem = (value as any[])[0]
            if (firstItem && (firstItem.id || firstItem.value)) {
              console.log(`⚠️ Using fallback field as featured_image: ${key}`)
              featuredImageField = value
              record.featured_image = value
              break
            }
          }
        }
      }
    }

    // If there are linked images in featured_image, fetch their details (same as social media)
    if (featuredImageField) {
      console.log('=== LINKED FEATURED IMAGE DEBUG ===')
      console.log('featuredImageField:', featuredImageField)
      console.log('typeof featuredImageField:', typeof featuredImageField)
      console.log('Array.isArray(featuredImageField):', Array.isArray(featuredImageField))
      
      // Extract image ID(s) from the linked field
      let imageId: number | string | null = null
      
      if (typeof featuredImageField === 'string' && featuredImageField.trim() !== '') {
        // If featured_image is a string (ID), convert it to an array with the ID
        console.log('Featured image field contains string ID:', featuredImageField)
        imageId = parseInt(featuredImageField)
      } else if (Array.isArray(featuredImageField) && featuredImageField.length > 0) {
        // If it's an array, get the first item (for single link_row, there should only be one)
        const firstItem = featuredImageField[0]
        imageId = firstItem?.id || firstItem?.value || firstItem
        console.log('Featured image field contains array, extracted ID:', imageId)
      } else if (typeof featuredImageField === 'object' && featuredImageField !== null) {
        // If it's an object, extract the ID
        imageId = (featuredImageField as any).id || (featuredImageField as any).value || featuredImageField
        console.log('Featured image field contains object, extracted ID:', imageId)
      } else if (typeof featuredImageField === 'number') {
        imageId = featuredImageField
        console.log('Featured image field is a number:', imageId)
      }
      
      if (imageId) {
        try {
          // Get the Images table ID from client config
          const imagesTableId = clientConfig.baserow.tables.images
          if (imagesTableId) {
            console.log('Fetching featured image with ID:', imageId)
            
            // Fetch all images and filter on our side since Baserow filtering isn't working
            const allImagesResult = await baserowAPI.getImages(imagesTableId, {})
            console.log('All images fetched:', allImagesResult.results?.length || 0)
            
            // Find the linked image by ID
            const linkedImage = allImagesResult.results?.find((img: any) => {
              const isMatch = img.id === imageId || img.id === parseInt(String(imageId), 10) || 
                             String(img.id) === String(imageId)
              if (isMatch) {
                console.log(`✅ Found linked featured image: ID ${img.id}`)
              }
              return isMatch
            })
            
            if (linkedImage) {
              // Extract image URL and alt text from the linked image
              // Check imageLinkUrl first (string URL), then check if image is an array with file objects
              let imageUrl = ''
              if (linkedImage.imageLinkUrl && typeof linkedImage.imageLinkUrl === 'string') {
                imageUrl = linkedImage.imageLinkUrl
              } else if (linkedImage.imagelinkurl && typeof linkedImage.imagelinkurl === 'string') {
                imageUrl = linkedImage.imagelinkurl
              } else if (Array.isArray(linkedImage.image) && linkedImage.image.length > 0) {
                // image is an array of file objects - extract URL from first file
                const firstFile = linkedImage.image[0]
                imageUrl = firstFile?.url || ''
              } else if (linkedImage.image && typeof linkedImage.image === 'string') {
                // image is a string URL
                imageUrl = linkedImage.image
              }
              
              const imageAlt = linkedImage.captionText || linkedImage.imagePrompt || 
                             linkedImage.captiontext || linkedImage.imageprompt || 
                             record.featured_image_alt || record.title || ''
              
              console.log('Extracted image URL:', imageUrl)
              console.log('Extracted image alt:', imageAlt)
              console.log('linkedImage.image type:', typeof linkedImage.image, Array.isArray(linkedImage.image))
              console.log('linkedImage.imageLinkUrl:', linkedImage.imageLinkUrl)
              
              // Update the record with the image URL and alt text
              record.featured_image_url = imageUrl
              record.featured_image_alt = imageAlt
              
              // Also keep the linked image ID
              record.featured_image = imageId
              
              console.log('Updated blog post with linked image data')
            } else {
              console.warn(`⚠️ Linked featured image not found with ID: ${imageId}`)
            }
          }
        } catch (error) {
          console.error('Error fetching linked featured image:', error)
          // Don't fail the request if image fetch fails
        }
      }
    }

    return NextResponse.json(record)
  } catch (error) {
    console.error('Error fetching blog post:', error)
    return NextResponse.json(
      { error: 'Failed to fetch blog post' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string; postId: string }> }
) {
  try {
    const { clientId, postId } = await params
    console.log('PATCH request for blog post:', { clientId, postId })
    
    const clientConfig = await getClientConfigForAPI(clientId)
    console.log('Client config found:', !!clientConfig)

    if (!clientConfig) {
      console.error('Client not found:', clientId)
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const body = await request.json()
    console.log('📝 PATCH blog post - Request body:', JSON.stringify(body, null, 2))
    console.log('📝 Featured image in request:', body.featured_image, 'Type:', typeof body.featured_image)

    // Format featured_image as array for link_row field
    // Baserow link_row fields expect an array of IDs
    if (body.featured_image !== undefined && body.featured_image !== null) {
      if (Array.isArray(body.featured_image)) {
        // Already an array, ensure all values are numbers
        body.featured_image = body.featured_image.map((id: any) => 
          typeof id === 'string' ? parseInt(id, 10) : id
        ).filter((id: any) => !isNaN(id))
      } else {
        // Single value, convert to array
        const imageId = typeof body.featured_image === 'string' 
          ? parseInt(body.featured_image, 10) 
          : body.featured_image
        if (!isNaN(imageId)) {
          body.featured_image = [imageId]
        } else {
          // Invalid ID, set to empty array to clear the link
          body.featured_image = []
        }
      }
      console.log('✅ Formatted featured_image for link_row field:', body.featured_image)
    } else {
      console.log('⚠️ featured_image is undefined or null, skipping')
    }

    const baserowAPI = new BaserowAPI(
      clientConfig.baserow.token,
      clientConfig.baserow.databaseId,
      clientConfig.fieldMappings
    )

    console.log('Updating blog post with table ID:', clientConfig.baserow.tables.blogPosts)
    const imagesTableId = clientConfig.baserow.tables.images
    const updatedBlogPost = await baserowAPI.updateBlogPost(
      clientConfig.baserow.tables.blogPosts,
      postId,
      body,
      imagesTableId
    )

    console.log('Blog post updated successfully:', updatedBlogPost)

    // Auto-publish to WordPress if status is "Approved" or "Published" and has scheduled date
    if ((body.status === 'Approved' || body.status === 'Published') && body.scheduled_publish_date) {
      console.log('🚀 Auto-publishing to WordPress: status=' + body.status + ', scheduledDate=', body.scheduled_publish_date)
      
      // Trigger WordPress publishing in background (non-blocking)
      fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/blog/publish-to-wordpress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId,
          blogPostId: postId,
        }),
      }).catch(error => {
        console.error('❌ Error triggering WordPress publish:', error)
        // Don't fail the update if publishing fails
      })
      
      console.log('✅ WordPress publishing triggered in background')
    }

    return NextResponse.json(updatedBlogPost)
  } catch (error) {
    console.error('Error updating blog post:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { 
        error: 'Failed to update blog post',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string; postId: string }> }
) {
  try {
    const { clientId, postId } = await params
    const clientConfig = await getClientConfigForAPI(clientId)

    if (!clientConfig) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const baserowAPI = new BaserowAPI(
      clientConfig.baserow.token,
      clientConfig.baserow.databaseId,
      clientConfig.fieldMappings
    )

    await baserowAPI.deleteBlogPost(
      clientConfig.baserow.tables.blogPosts,
      postId
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting blog post:', error)
    return NextResponse.json(
      { error: 'Failed to delete blog post' },
      { status: 500 }
    )
  }
}
