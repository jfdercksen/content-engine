import { NextRequest, NextResponse } from 'next/server'

// Function to detect image placeholders in template HTML (same as in EmailIdeaForm)
const detectImagePlaceholders = (htmlTemplate: string): string[] => {
  const placeholders: string[] = []
  
  // Comprehensive pattern matching for various placeholder formats
  const patterns = [
    // Handlebars-style placeholders
    /{{image\.(header|footer|cta|body_\d+|promo_\d+|hero|banner|sidebar|main|featured|gallery_\d+|section_\d+|block_\d+)}}/gi,
    /{{img\.(header|footer|cta|body_\d+|promo_\d+|hero|banner|sidebar|main|featured|gallery_\d+|section_\d+|block_\d+)}}/gi,
    /{{placeholder\.(header|footer|cta|body_\d+|promo_\d+|hero|banner|sidebar|main|featured|gallery_\d+|section_\d+|block_\d+)}}/gi,
    /{{image_(header|footer|cta|body_\d+|promo_\d+|hero|banner|sidebar|main|featured|gallery_\d+|section_\d+|block_\d+)}}/gi,
    /{{img_(header|footer|cta|body_\d+|promo_\d+|hero|banner|sidebar|main|featured|gallery_\d+|section_\d+|block_\d+)}}/gi,
    
    // Bracket-style placeholders
    /\[IMAGE_(HEADER|FOOTER|CTA|BODY_\d+|PROMO_\d+|HERO|BANNER|SIDEBAR|MAIN|FEATURED|GALLERY_\d+|SECTION_\d+|BLOCK_\d+)\]/gi,
    /\[IMG_(HEADER|FOOTER|CTA|BODY_\d+|PROMO_\d+|HERO|BANNER|SIDEBAR|MAIN|FEATURED|GALLERY_\d+|SECTION_\d+|BLOCK_\d+)\]/gi,
    /\[PLACEHOLDER_(HEADER|FOOTER|CTA|BODY_\d+|PROMO_\d+|HERO|BANNER|SIDEBAR|MAIN|FEATURED|GALLERY_\d+|SECTION_\d+|BLOCK_\d+)\]/gi,
    
    // PHP-style placeholders
    /\$image_(header|footer|cta|body_\d+|promo_\d+|hero|banner|sidebar|main|featured|gallery_\d+|section_\d+|block_\d+)/gi,
    /\$img_(header|footer|cta|body_\d+|promo_\d+|hero|banner|sidebar|main|featured|gallery_\d+|section_\d+|block_\d+)/gi,
    
    // Generic image placeholders
    /{{image\d+}}/gi,
    /{{img\d+}}/gi,
    /\[IMAGE\d+\]/gi,
    /\[IMG\d+\]/gi,
    
    // CSS class-based detection
    /class="[^"]*image-(header|footer|cta|body|promo|hero|banner|sidebar|main|featured|gallery|section|block)[^"]*"/gi,
    /class="[^"]*img-(header|footer|cta|body|promo|hero|banner|sidebar|main|featured|gallery|section|block)[^"]*"/gi,
    
    // ID-based detection
    /id="[^"]*image-(header|footer|cta|body|promo|hero|banner|sidebar|main|featured|gallery|section|block)[^"]*"/gi,
    /id="[^"]*img-(header|footer|cta|body|promo|hero|banner|sidebar|main|featured|gallery|section|block)[^"]*"/gi,
    
    // Data attribute detection
    /data-image="(header|footer|cta|body|promo|hero|banner|sidebar|main|featured|gallery|section|block)"/gi,
    /data-img="(header|footer|cta|body|promo|hero|banner|sidebar|main|featured|gallery|section|block)"/gi,
    
    // Comment-based placeholders
    /<!--\s*IMAGE\s*:\s*(header|footer|cta|body|promo|hero|banner|sidebar|main|featured|gallery|section|block)\s*-->/gi,
    /<!--\s*IMG\s*:\s*(header|footer|cta|body|promo|hero|banner|sidebar|main|featured|gallery|section|block)\s*-->/gi,
    
    // HTML img tags with specific src patterns
    /<img[^>]*src="[^"]*placeholder[^"]*"[^>]*>/gi,
    /<img[^>]*src="[^"]*image[^"]*"[^>]*>/gi,
    /<img[^>]*src="[^"]*img[^"]*"[^>]*>/gi,
    
    // Additional patterns for common email template structures
    /{{hero_image}}/gi,
    /{{banner_image}}/gi,
    /{{logo}}/gi,
    /{{signature}}/gi,
    /{{product_image}}/gi,
    /{{testimonial_image}}/gi,
    /{{team_image}}/gi,
    /{{event_image}}/gi,
    /{{offer_image}}/gi,
    /{{newsletter_image}}/gi,
    
    // Div-based image containers
    /<div[^>]*class="[^"]*image-container[^"]*"[^>]*>/gi,
    /<div[^>]*class="[^"]*img-container[^"]*"[^>]*>/gi,
    /<div[^>]*class="[^"]*image-placeholder[^"]*"[^>]*>/gi,
    /<div[^>]*class="[^"]*img-placeholder[^"]*"[^>]*>/gi,
    
    // Background image patterns
    /background-image:\s*url\([^)]*placeholder[^)]*\)/gi,
    /background-image:\s*url\([^)]*image[^)]*\)/gi,
    /background-image:\s*url\([^)]*img[^)]*\)/gi
  ]
  
  patterns.forEach(pattern => {
    const matches = htmlTemplate.match(pattern)
    if (matches) {
      // Extract the actual placeholder name from the match
      matches.forEach(match => {
        // Clean up the placeholder name
        let cleanName = match
          .replace(/[{}[\]]/g, '') // Remove brackets
          .replace(/<!--\s*|\s*-->/g, '') // Remove HTML comments
          .replace(/class="[^"]*"|id="[^"]*"|data-[^=]*="[^"]*"/g, '') // Remove HTML attributes
          .replace(/<[^>]*>/g, '') // Remove HTML tags
          .replace(/^\s*IMAGE\s*:\s*|\s*IMG\s*:\s*/gi, '') // Remove prefixes
          .trim()
        
        if (cleanName) {
          placeholders.push(cleanName)
        }
      })
    }
  })
  
  // Look for common image-related words in the HTML
  const imageKeywords = [
    'header-image', 'footer-image', 'hero-image', 'banner-image', 'featured-image',
    'main-image', 'sidebar-image', 'gallery-image', 'promo-image', 'cta-image',
    'section-image', 'block-image', 'content-image', 'brand-image', 'logo-image',
    'header_img', 'footer_img', 'hero_img', 'banner_img', 'featured_img',
    'main_img', 'sidebar_img', 'gallery_img', 'promo_img', 'cta_img',
    'section_img', 'block_img', 'content_img', 'brand_img', 'logo_img',
    'hero_image', 'banner_image', 'logo', 'signature', 'product_image',
    'testimonial_image', 'team_image', 'event_image', 'offer_image', 'newsletter_image'
  ]
  
  imageKeywords.forEach(keyword => {
    if (htmlTemplate.toLowerCase().includes(keyword.toLowerCase())) {
      placeholders.push(keyword.replace(/_/g, '-'))
    }
  })
  
  // Look for numbered image placeholders (image1, image2, etc.)
  const numberedMatches = htmlTemplate.match(/image\d+|img\d+/gi)
  if (numberedMatches) {
    placeholders.push(...numberedMatches)
  }
  
  // Remove duplicates and sort
  const uniquePlaceholders = [...new Set(placeholders)]
  
  // If no placeholders found, create default ones based on common email structure
  if (uniquePlaceholders.length === 0) {
    console.log('No image placeholders detected, creating default ones')
    uniquePlaceholders.push(
      'Header',
      'Body 1', 
      'Body 2',
      'CTA',
      'Footer'
    )
  }
  
  console.log('Detected image placeholders:', uniquePlaceholders)
  return uniquePlaceholders
}

export async function POST(request: NextRequest) {
  try {
    const { htmlTemplate } = await request.json()

    if (!htmlTemplate) {
      return NextResponse.json(
        { error: 'HTML template is required' },
        { status: 400 }
      )
    }

    const placeholders = detectImagePlaceholders(htmlTemplate)

    return NextResponse.json({
      success: true,
      placeholders,
      count: placeholders.length,
      template: htmlTemplate.substring(0, 500) + '...' // Show first 500 chars for reference
    })

  } catch (error) {
    console.error('Error testing image detection:', error)
    return NextResponse.json(
      { error: 'Failed to test image detection' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  // Return example templates and expected placeholders
  const examples = [
    {
      name: "Handlebars Template",
      template: `
        <div class="email-template">
          <div class="header">
            <img src="{{image.header}}" alt="Header Image" />
          </div>
          <div class="body">
            <img src="{{image.body_1}}" alt="Body Image 1" />
            <img src="{{image.body_2}}" alt="Body Image 2" />
          </div>
          <div class="cta">
            <img src="{{image.cta}}" alt="CTA Image" />
          </div>
          <div class="footer">
            <img src="{{image.footer}}" alt="Footer Image" />
          </div>
        </div>
      `,
      expectedPlaceholders: ['image.header', 'image.body_1', 'image.body_2', 'image.cta', 'image.footer']
    },
    {
      name: "Bracket Template",
      template: `
        <div class="email-template">
          <div class="header">
            <img src="[IMAGE_HEADER]" alt="Header Image" />
          </div>
          <div class="body">
            <img src="[IMAGE_BODY_1]" alt="Body Image 1" />
            <img src="[IMAGE_BODY_2]" alt="Body Image 2" />
          </div>
          <div class="cta">
            <img src="[IMAGE_CTA]" alt="CTA Image" />
          </div>
        </div>
      `,
      expectedPlaceholders: ['IMAGE_HEADER', 'IMAGE_BODY_1', 'IMAGE_BODY_2', 'IMAGE_CTA']
    },
    {
      name: "CSS Class Template",
      template: `
        <div class="email-template">
          <div class="image-header">
            <img src="placeholder.jpg" alt="Header" />
          </div>
          <div class="image-body">
            <img src="placeholder.jpg" alt="Body" />
          </div>
          <div class="image-cta">
            <img src="placeholder.jpg" alt="CTA" />
          </div>
        </div>
      `,
      expectedPlaceholders: ['image-header', 'image-body', 'image-cta']
    }
  ]

  return NextResponse.json({
    success: true,
    examples,
    instructions: {
      title: "How to Structure Your Email Templates for Better Image Detection",
      tips: [
        "Use consistent placeholder naming: {{image.header}}, {{image.body_1}}, etc.",
        "Or use bracket format: [IMAGE_HEADER], [IMAGE_BODY_1], etc.",
        "Add CSS classes like 'image-header', 'image-body' for automatic detection",
        "Use HTML comments: <!-- IMAGE: header --> for explicit marking",
        "Include data attributes: data-image='header' for additional detection",
        "The system will automatically detect and create upload slots for all found placeholders"
      ]
    }
  })
}
