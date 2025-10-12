import { NextRequest, NextResponse } from 'next/server'
import { ClientInformationManager } from '@/lib/config/clientInformationManager'

/**
 * Update client information - Steps 2-4 of onboarding
 * Updates existing record in Client Information table (3232)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { clientId } = await params
    const body = await request.json()
    const { step, data } = body

    if (!clientId || !step || !data) {
      return NextResponse.json(
        { error: 'Missing required fields: clientId, step, data' },
        { status: 400 }
      )
    }

    console.log(`🔄 Updating client info for ${clientId} - Step ${step}`)
    console.log('📋 Update data:', JSON.stringify(data, null, 2))

    // Get existing client info
    const existingInfo = await ClientInformationManager.getClientInfo(clientId)
    if (!existingInfo) {
      return NextResponse.json(
        { error: `Client "${clientId}" not found. Please complete Step 1 first.` },
        { status: 404 }
      )
    }

    // Merge new data with existing info
    const updatedInfo = {
      ...existingInfo,
      ...data,
      onboardingStatus: `Step ${step} Complete`
    }

    // Update in Baserow
    const success = await ClientInformationManager.updateClientInfo(clientId, updatedInfo)

    if (!success) {
      throw new Error('Failed to update client information')
    }

    console.log(`✅ Step ${step} data saved successfully for ${clientId}`)

    return NextResponse.json({
      success: true,
      clientId,
      message: `Step ${step} saved successfully`,
      step
    })

  } catch (error) {
    console.error('❌ Error updating client info:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update client information', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

