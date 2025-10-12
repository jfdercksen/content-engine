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
    console.log('📋 Step 1 data (raw):', { companyName, industry, companySize })
    
    // For select fields in Baserow, we need to send empty strings to avoid validation errors
    // The user can update these later or we can add proper option mapping
    console.log('ℹ️ Using empty strings for select fields to avoid validation errors')

    // Check if client already exists
    const existingClient = await ClientInformationManager.getClientInfo(clientId)
    if (existingClient) {
      console.log('⚠️ Client already exists:', clientId)
      return NextResponse.json(
        { error: `Client "${companyName}" already exists. Please use a different name.` },
        { status: 409 }
      )
    }

    // Create initial client information record with MINIMAL fields only
    // We'll add more fields in Steps 2-5 via updates
    const success = await ClientInformationManager.createClientInfo({
      clientId,
      companyName,
      displayName: companyName,
      // Only send non-empty, non-select fields
      foundedYear: foundedYear || null,
      websiteUrl: websiteUrl || '',
      timezone: 'UTC',
      primaryBrandColor: '#3B82F6',
      secondaryBrandColor: '#10B981',
      // All other fields left undefined - won't be sent to Baserow
      industry: '',
      companySize: '',
      blogUrl: '',
      facebookUrl: '',
      instagramHandle: '',
      linkedinUrl: '',
      xHandle: '',
      tiktokHandle: '',
      country: '',
      city: '',
      primaryContactName: '',
      primaryContactEmail: '',
      primaryContactPhone: '',
      targetAudience: '',
      mainCompetitors: '',
      businessGoals: '',
      brandVoice: '',
      postingFrequency: '',
      languages: '',
      onboardingStatus: '', // Empty - won't be sent to Baserow (select field)
      accountManager: '',
      monthlyBudget: null
    })

    console.log('✅ Minimal record created - only essential non-select fields sent')

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

