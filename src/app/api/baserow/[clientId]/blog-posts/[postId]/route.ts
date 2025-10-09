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

    return NextResponse.json(blogPost)
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
    console.log('Request body:', body)

    const baserowAPI = new BaserowAPI(
      clientConfig.baserow.token,
      clientConfig.baserow.databaseId,
      clientConfig.fieldMappings
    )

    console.log('Updating blog post with table ID:', clientConfig.baserow.tables.blogPosts)
    const updatedBlogPost = await baserowAPI.updateBlogPost(
      clientConfig.baserow.tables.blogPosts,
      postId,
      body
    )

    console.log('Blog post updated successfully:', updatedBlogPost)
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
