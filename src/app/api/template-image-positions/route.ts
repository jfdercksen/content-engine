import { NextRequest, NextResponse } from 'next/server'

// Function to extract image positions from HTML template
const extractImagePositions = (htmlTemplate: string): string[] => {
  const positions: string[] = []
  
  // Look for img tags with alt text that might indicate position
  const imgTagRegex = /<img[^>]*alt="([^"]*)"[^>]*>/gi
  let match
  
  while ((match = imgTagRegex.exec(htmlTemplate)) !== null) {
    const altText = match[1]
    if (altText && !altText.includes('placeholder')) {
      positions.push(altText)
    }
  }
  
  // Look for placeholder text in src attributes
  const placeholderRegex = /placeholder\.com\/[^?]*\?text=([^&"]*)/gi
  while ((match = placeholderRegex.exec(htmlTemplate)) !== null) {
    const placeholderText = decodeURIComponent(match[1].replace(/\+/g, ' '))
    positions.push(placeholderText)
  }
  
  // Look for common image position patterns in comments
  const commentRegex = /<!--\s*([^:]*)\s*Image\s*-->/gi
  while ((match = commentRegex.exec(htmlTemplate)) !== null) {
    const commentText = match[1].trim()
    if (commentText) {
      positions.push(`${commentText} Image`)
    }
  }
  
  return [...new Set(positions)] // Remove duplicates
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      )
    }
    
    // Fetch templates from Baserow
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/baserow/${clientId}/templates`)
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch templates' },
        { status: 500 }
      )
    }
    
    const data = await response.json()
    const templates = data.results || []
    
    // Analyze each template for image positions
    const templateAnalysis = templates.map((template: any) => {
      const htmlTemplate = template.htmlTemplate || ''
      const imagePositions = extractImagePositions(htmlTemplate)
      
      return {
        templateId: template.templateId,
        templateName: template.templateName,
        imagePositions,
        count: imagePositions.length,
        sampleHtml: htmlTemplate.substring(0, 500) + '...'
      }
    })
    
    // Get all unique image positions across all templates
    const allPositions = new Set<string>()
    templateAnalysis.forEach(analysis => {
      analysis.imagePositions.forEach(position => allPositions.add(position))
    })
    
    return NextResponse.json({
      success: true,
      templates: templateAnalysis,
      allUniquePositions: Array.from(allPositions).sort(),
      totalTemplates: templates.length,
      totalUniquePositions: allPositions.size
    })
    
  } catch (error) {
    console.error('Error analyzing template image positions:', error)
    return NextResponse.json(
      { error: 'Failed to analyze template image positions' },
      { status: 500 }
    )
  }
}
