import { NextRequest, NextResponse } from 'next/server'
import { DatabaseClientConfig } from '@/lib/config/databaseClientConfig'
import { EnvironmentManager } from '@/lib/config/environmentManager'
import { ClientInformationManager } from '@/lib/config/clientInformationManager'

/**
 * Finalize client setup - Step 5 of progressive onboarding
 * Creates the Baserow workspace (base, tables, fields) and saves all configuration
 * This is called after Steps 1-4 have saved client information progressively
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { clientId } = body

    if (!clientId) {
      return NextResponse.json(
        { error: 'Missing required field: clientId' },
        { status: 400 }
      )
    }

    console.log('🚀 Step 5: Finalizing client setup for:', clientId)
    
    // Get existing client info from Steps 1-4
    const clientInfo = await ClientInformationManager.getClientInfo(clientId)
    if (!clientInfo) {
      return NextResponse.json(
        { error: 'Client information not found. Please complete Steps 1-4 first.' },
        { status: 404 }
      )
    }

    console.log('✅ Found client info from previous steps')
    console.log('📋 Creating workspace for:', clientInfo.displayName)

    // Update status
    await ClientInformationManager.updateClientInfo(clientId, {
      ...clientInfo,
      onboardingStatus: 'Creating Workspace'
    })

    // Call the create route to build the workspace
    // This will create base, tables, and fields
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://content-engine-xi.vercel.app'
    const createResponse = await fetch(`${appUrl}/api/admin/clients/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clientName: clientId,
        displayName: clientInfo.displayName,
        clientInfo: clientInfo,
        skipClientInfoSteps: true // We already have client info from Steps 1-4
      })
    })

    if (!createResponse.ok) {
      const error = await createResponse.json()
      throw new Error(`Workspace creation failed: ${error.error || 'Unknown error'}`)
    }

    const createResult = await createResponse.json()
    console.log('✅ Workspace created successfully')

    // Update final status
    await ClientInformationManager.updateClientInfo(clientId, {
      ...clientInfo,
      onboardingStatus: 'Complete'
    })

    return NextResponse.json({
      success: true,
      clientId,
      clientConfig: createResult.clientConfig,
      message: 'Client setup completed successfully!',
      step: 5
    })

  } catch (error) {
    console.error('❌ Error finalizing client setup:', error)
    
    // Update status to failed
    try {
      const { clientId } = await request.json()
      const clientInfo = await ClientInformationManager.getClientInfo(clientId)
      if (clientInfo) {
        await ClientInformationManager.updateClientInfo(clientId, {
          ...clientInfo,
          onboardingStatus: 'Failed - Workspace Creation Error'
        })
      }
    } catch (statusError) {
      console.error('Could not update error status:', statusError)
    }

    return NextResponse.json(
      { 
        error: 'Failed to finalize client setup', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
