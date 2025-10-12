import { NextRequest, NextResponse } from 'next/server'
import { ClientInformationManager } from '@/lib/config/clientInformationManager'

/**
 * Initialize a new client - Step 1 of onboarding
 * Creates initial record in Client Information table (3232)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { companyName, industry, companySize, foundedYear, websiteUrl } = body

    if (!companyName) {
      return NextResponse.json(
        { error: 'Company name is required' },
        { status: 400 }
      )
    }

    // Generate client ID from company name
    const clientId = companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')

    console.log('🆕 Initializing new client:', clientId)
    console.log('📋 Step 1 data:', { companyName, industry, companySize })

    // Check if client already exists
    const existingClient = await ClientInformationManager.getClientInfo(clientId)
    if (existingClient) {
      console.log('⚠️ Client already exists:', clientId)
      return NextResponse.json(
        { error: `Client "${companyName}" already exists. Please use a different name.` },
        { status: 409 }
      )
    }

    // Create initial client information record
    const success = await ClientInformationManager.createClientInfo({
      clientId,
      companyName,
      displayName: companyName,
      industry: industry || '',
      companySize: companySize || '',
      foundedYear: foundedYear || null,
      websiteUrl: websiteUrl || '',
      onboardingStatus: 'Step 1 Complete',
      // Empty fields for now - will be filled in later steps
      blogUrl: '',
      facebookUrl: '',
      instagramHandle: '',
      linkedinUrl: '',
      xHandle: '',
      tiktokHandle: '',
      country: '',
      city: '',
      timezone: 'UTC',
      primaryContactName: '',
      primaryContactEmail: '',
      primaryContactPhone: '',
      targetAudience: '',
      mainCompetitors: '',
      businessGoals: '',
      brandVoice: '',
      postingFrequency: '',
      languages: '',
      primaryBrandColor: '#3B82F6',
      secondaryBrandColor: '#10B981',
      accountManager: '',
      monthlyBudget: null
    })

    if (!success) {
      throw new Error('Failed to create client information record')
    }

    console.log('✅ Client initialized successfully:', clientId)

    return NextResponse.json({
      success: true,
      clientId,
      message: 'Company details saved successfully',
      step: 1
    })

  } catch (error) {
    console.error('❌ Error initializing client:', error)
    return NextResponse.json(
      { 
        error: 'Failed to initialize client', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

