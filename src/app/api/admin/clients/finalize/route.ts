import { NextRequest, NextResponse } from 'next/server'
import { DatabaseClientConfig } from '@/lib/config/databaseClientConfig'
import { EnvironmentManager } from '@/lib/config/environmentManager'
import { ClientInformationManager } from '@/lib/config/clientInformationManager'

/**
 * Finalize client setup (Steps 7-10)
 * This endpoint completes the client setup after base/tables/fields are created
 * Use this if the main creation endpoint times out before completing these steps
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { clientId, clientConfig, clientInfo } = body

    if (!clientId || !clientConfig) {
      return NextResponse.json(
        { error: 'Missing required fields: clientId, clientConfig' },
        { status: 400 }
      )
    }

    console.log('🔄 Finalizing client setup for:', clientId)
    
    // Update status to in_progress
    const configWithStatus = { ...clientConfig, finalizationStatus: 'in_progress' }
    
    const results: any = {}

    // Step 7: Store client configuration in database
    try {
      console.log('Step 7: Storing client configuration...')
      await DatabaseClientConfig.addClient(configWithStatus)
      results.configurationSaved = true
      console.log('✅ Client configuration saved')
    } catch (error) {
      console.error('❌ Failed to save configuration:', error)
      results.configurationSaved = false
      results.configurationError = error instanceof Error ? error.message : 'Unknown error'
    }

    // Step 8: Store environment variables
    try {
      console.log('Step 8: Storing environment variables...')
      const envManager = new EnvironmentManager()
      
      // Store all table IDs
      for (const [tableName, tableId] of Object.entries(clientConfig.tables)) {
        const varName = `${tableName.toUpperCase()}_TABLE_ID`
        await EnvironmentManager.setVariable(clientId, varName, tableId as string)
      }
      
      // Store credentials
      await EnvironmentManager.setVariable(clientId, 'TOKEN', clientConfig.baserowToken)
      await EnvironmentManager.setVariable(clientId, 'DATABASE_ID', clientConfig.baserowDatabaseId)
      await EnvironmentManager.setVariable(clientId, 'WORKSPACE_ID', clientConfig.baserowWorkspaceId.toString())
      
      results.environmentVariablesSaved = true
      console.log('✅ Environment variables saved')
    } catch (error) {
      console.error('❌ Failed to save environment variables:', error)
      results.environmentVariablesSaved = false
      results.environmentVariablesError = error instanceof Error ? error.message : 'Unknown error'
    }

    // Step 9: Store client information
    if (clientInfo) {
      try {
        console.log('Step 9: Storing client information...')
        await ClientInformationManager.createClientInfo({
          clientId,
          companyName: clientInfo.companyName || clientConfig.displayName,
          displayName: clientConfig.displayName,
          industry: clientInfo.industry || '',
          companySize: clientInfo.companySize || '',
          foundedYear: clientInfo.foundedYear,
          websiteUrl: clientInfo.websiteUrl,
          blogUrl: clientInfo.blogUrl,
          facebookUrl: clientInfo.facebookUrl,
          instagramHandle: clientInfo.instagramHandle,
          linkedinUrl: clientInfo.linkedinUrl,
          xHandle: clientInfo.xHandle,
          tiktokHandle: clientInfo.tiktokHandle,
          country: clientInfo.country || '',
          city: clientInfo.city,
          timezone: clientInfo.timezone || 'UTC',
          primaryContactName: clientInfo.primaryContactName,
          primaryContactEmail: clientInfo.primaryContactEmail,
          primaryContactPhone: clientInfo.primaryContactPhone,
          targetAudience: clientInfo.targetAudience,
          mainCompetitors: clientInfo.mainCompetitors,
          businessGoals: clientInfo.businessGoals,
          brandVoice: clientInfo.brandVoice,
          postingFrequency: clientInfo.postingFrequency,
          languages: clientInfo.languages,
          primaryBrandColor: clientInfo.primaryBrandColor,
          secondaryBrandColor: clientInfo.secondaryBrandColor,
          onboardingStatus: 'Complete',
          accountManager: clientInfo.accountManager,
          monthlyBudget: clientInfo.monthlyBudget
        })
        results.clientInformationSaved = true
        console.log('✅ Client information saved')
      } catch (error) {
        console.error('❌ Failed to save client information:', error)
        results.clientInformationSaved = false
        results.clientInformationError = error instanceof Error ? error.message : 'Unknown error'
      }
    } else {
      results.clientInformationSaved = false
      results.clientInformationError = 'No client info provided'
    }

    // Step 10: Initialize settings
    try {
      console.log('Step 10: Initializing settings...')
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://content-engine-xi.vercel.app'
      const settingsResponse = await fetch(`${appUrl}/api/settings/${clientId}/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          webhooks: {
            social_media_processor: process.env.WEBHOOK_SOCIAL_MEDIA_PROCESSOR || 'https://n8n.aiautomata.co.za/webhook/social-media-processor',
            image_generator: process.env.WEBHOOK_IMAGE_GENERATOR || 'https://n8n.aiautomata.co.za/webhook/image-generator-webhook',
            blog_processor: process.env.WEBHOOK_BLOG_PROCESSOR || 'https://n8n.aiautomata.co.za/webhook/blog-creation-mvp',
            email_processor: process.env.WEBHOOK_EMAIL_PROCESSOR || 'https://n8n.aiautomata.co.za/webhook/email-processor',
            uvp_creation: process.env.WEBHOOK_UVP_CREATION || 'https://n8n.aiautomata.co.za/webhook/uvp_creation'
          }
        })
      })
      
      if (settingsResponse.ok) {
        results.settingsInitialized = true
        console.log('✅ Settings initialized')
      } else {
        results.settingsInitialized = false
        results.settingsError = `HTTP ${settingsResponse.status}: ${settingsResponse.statusText}`
      }
    } catch (error) {
      console.error('❌ Failed to initialize settings:', error)
      results.settingsInitialized = false
      results.settingsError = error instanceof Error ? error.message : 'Unknown error'
    }

    const allSuccess = results.configurationSaved && 
                       results.environmentVariablesSaved && 
                       results.clientInformationSaved && 
                       results.settingsInitialized

    // Update final status
    const finalStatus = allSuccess ? 'complete' : 'failed'
    try {
      await DatabaseClientConfig.updateClient(clientId, { finalizationStatus: finalStatus })
      console.log(`✅ Finalization status updated to: ${finalStatus}`)
    } catch (error) {
      console.error('⚠️ Could not update finalization status:', error)
    }

    return NextResponse.json({
      success: allSuccess,
      finalizationStatus: finalStatus,
      message: allSuccess 
        ? 'Client setup finalized successfully' 
        : 'Client setup partially completed - see details',
      results
    })

  } catch (error) {
    console.error('Error finalizing client setup:', error)
    return NextResponse.json(
      { 
        error: 'Failed to finalize client setup', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

