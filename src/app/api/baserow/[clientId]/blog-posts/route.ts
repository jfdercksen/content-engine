import { NextRequest, NextResponse } from 'next/server'
import { getClientConfigForAPI } from '@/lib/utils/getClientConfigForAPI'
import { BaserowAPI } from '@/lib/baserow/api'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { clientId } = await params
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
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

    const blogPostsTableId = clientConfig.baserow.tables.blogPosts
    if (!blogPostsTableId) {
      return NextResponse.json(
        { error: 'Blog Posts table not found for this client' },
        { status: 404 }
      )
    }

    // Initialize Baserow API
    const baserowAPI = new BaserowAPI(
      clientConfig.baserow.token,
      clientConfig.baserow.databaseId,
      clientConfig.fieldMappings
    )

    // Get blog posts from Baserow
    const blogPosts = await baserowAPI.getBlogPosts(blogPostsTableId)

    return NextResponse.json({
      success: true,
      count: blogPosts.count,
      results: blogPosts.results,
      next: blogPosts.next,
      previous: blogPosts.previous
    })

  } catch (error) {
    console.error('Blog posts fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch blog posts' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { clientId } = await params
    const body = await request.json()

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
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

    const blogPostsTableId = clientConfig.baserow.tables.blogPosts
    if (!blogPostsTableId) {
      return NextResponse.json(
        { error: 'Blog Posts table not found for this client' },
        { status: 404 }
      )
    }

    // Initialize Baserow API
    const baserowAPI = new BaserowAPI(
      clientConfig.baserow.token,
      clientConfig.baserow.databaseId,
      clientConfig.fieldMappings
    )

    // Create new blog post
    const newBlogPost = await baserowAPI.createBlogPost(blogPostsTableId, body)

    return NextResponse.json({
      success: true,
      data: newBlogPost
    })

  } catch (error) {
    console.error('Blog post creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create blog post' },
      { status: 500 }
    )
  }
}