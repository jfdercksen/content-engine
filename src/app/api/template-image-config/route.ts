import { NextRequest, NextResponse } from 'next/server'
import { TEMPLATE_IMAGE_CONFIGS, TemplateImageConfig } from '@/lib/types/content'

// GET: Get image configuration for a specific template or available slots
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('templateId')
    const action = searchParams.get('action')

    if (action === 'slots') {
      // Return all available image slot options
      const availableSlots = [
        'Header', 'Footer', 'CTA', 'Hero', 'Banner', 'Logo', 'Signature',
        'Body 1', 'Body 2', 'Body 3',
        'Promo 1', 'Promo 2', 'Promo 3', 'Promo 4', 'Promo 5', 'Promo 6',
        'Gallery 1', 'Gallery 2', 'Gallery 3', 'Gallery 4', 'Gallery 5', 'Gallery 6',
        'Product 1', 'Product 2', 'Product 3', 'Product 4', 'Product 5', 'Product 6',
        'Team 1', 'Team 2', 'Team 3', 'Team 4',
        'Testimonial 1', 'Testimonial 2', 'Testimonial 3',
        'Event 1', 'Event 2', 'Event 3',
        'Offer 1', 'Offer 2', 'Offer 3',
        'Newsletter', 'Social', 'Brand'
      ]

      return NextResponse.json({
        success: true,
        availableSlots
      })
    }

    if (templateId) {
      const config = TEMPLATE_IMAGE_CONFIGS.find(
        config => config.templateId === parseInt(templateId)
      )

      if (!config) {
        // Return default configuration if none found
        return NextResponse.json({
          success: true,
          config: {
            templateId: parseInt(templateId),
            imageSlots: ['Header', 'Body 1', 'CTA', 'Footer'],
            description: 'Default 4-image template configuration'
          }
        })
      }

      return NextResponse.json({
        success: true,
        config
      })
    }

    // Default: return all template configurations
    return NextResponse.json({
      success: true,
      configs: TEMPLATE_IMAGE_CONFIGS
    })

  } catch (error) {
    console.error('Error getting template image config:', error)
    return NextResponse.json(
      { error: 'Failed to get template image configuration' },
      { status: 500 }
    )
  }
}

// POST: Create or update image configuration for a template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { templateId, imageSlots, description } = body

    if (!templateId || !imageSlots || !Array.isArray(imageSlots)) {
      return NextResponse.json(
        { error: 'Template ID and image slots array are required' },
        { status: 400 }
      )
    }

    // In a real app, you would save this to your database
    // For now, we'll just return success
    const newConfig: TemplateImageConfig = {
      templateId: parseInt(templateId),
      imageSlots,
      description
    }

    return NextResponse.json({
      success: true,
      config: newConfig,
      message: 'Template image configuration saved successfully'
    })

  } catch (error) {
    console.error('Error saving template image config:', error)
    return NextResponse.json(
      { error: 'Failed to save template image configuration' },
      { status: 500 }
    )
  }
}


