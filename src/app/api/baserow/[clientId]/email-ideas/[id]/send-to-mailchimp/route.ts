import { NextRequest, NextResponse } from 'next/server'
import { getClientConfigForAPI } from '@/lib/utils/getClientConfigForAPI'
import { SettingsManager } from '@/lib/config/settingsManager'
import { BaserowAPI } from '@/lib/baserow/api'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string; id: string }> }
) {
  try {
    const { clientId, id } = await params
    
    console.log('📧 Send to Mailchimp request:', { clientId, emailIdeaId: id })
    
    // Get client configuration
    const clientConfig = await getClientConfigForAPI(clientId)
    if (!clientConfig) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }
    
    // Get Mailchimp webhook URL from settings
    const mailchimpWebhookUrl = await SettingsManager.getSetting(clientId, 'Webhooks', 'mailchimp')
    if (!mailchimpWebhookUrl) {
      return NextResponse.json(
        { error: 'Mailchimp webhook URL not configured. Please configure it in Settings.' },
        { status: 400 }
      )
    }
    
    // Get email idea record
    const emailIdeasTableId = clientConfig.baserow.tables?.emailIdeas
    if (!emailIdeasTableId) {
      return NextResponse.json(
        { error: 'Email Ideas table not configured' },
        { status: 500 }
      )
    }
    
    const baserowAPI = new BaserowAPI(
      clientConfig.baserow.token,
      clientConfig.baserow.databaseId,
      clientConfig.fieldMappings || {}
    )
    
    const emailIdea = await baserowAPI.getEmailIdeaById(emailIdeasTableId, id)
    if (!emailIdea) {
      return NextResponse.json(
        { error: 'Email idea not found' },
        { status: 404 }
      )
    }
    
    // Check if email has generated HTML
    const generatedHtml = emailIdea.generatedHtml || emailIdea.generatedhtml || ''
    if (!generatedHtml) {
      return NextResponse.json(
        { error: 'Email has not been generated yet. Please generate the email first.' },
        { status: 400 }
      )
    }
    
    // Get base URL
    const baserowBaseUrl = process.env.BASEROW_BASE_URL || process.env.BASEROW_API_URL || 'https://baserow.aiautomata.co.za'
    
    // Fetch full email idea record to get all fields including Mailchimp fields
    const emailIdeaResponse = await fetch(
      `${baserowBaseUrl}/api/database/rows/table/${emailIdeasTableId}/${id}/?user_field_names=true`,
      {
        headers: {
          'Authorization': `Token ${clientConfig.baserow.token}`,
          'Content-Type': 'application/json',
        },
      }
    )
    
    if (!emailIdeaResponse.ok) {
      throw new Error(`Failed to fetch email idea: ${emailIdeaResponse.statusText}`)
    }
    
    const emailIdeaRecord = await emailIdeaResponse.json()
    
    // Helper to get field value
    const getFieldValue = (fieldName: string, altNames?: string[]): string | null => {
      if (emailIdeaRecord[fieldName]) {
        const value = emailIdeaRecord[fieldName]
        return typeof value === 'string' ? value : (value?.value || value || null)
      }
      if (altNames) {
        for (const altName of altNames) {
          if (emailIdeaRecord[altName]) {
            const value = emailIdeaRecord[altName]
            return typeof value === 'string' ? value : (value?.value || value || null)
          }
        }
      }
      return null
    }
    
    // Prepare Mailchimp payload
    const mailchimpPayload = {
      client_id: clientId,
      base_id: clientConfig.baserow.databaseId,
      table_id: emailIdeasTableId,
      event: "send_to_mailchimp",
      timestamp: new Date().toISOString(),
      clientId: clientId,
      client: {
        name: clientConfig.name || clientId,
        id: clientId
      },
      tables: {
        emailIdeas: {
          id: emailIdeasTableId,
          recordId: id
        }
      },
      baserow: {
        baseUrl: baserowBaseUrl,
        databaseId: clientConfig.baserow.databaseId,
        token: clientConfig.baserow.token,
        tableId: emailIdeasTableId,
        recordId: id
      },
      mailchimp: clientConfig.mailchimp ? {
        apiKey: clientConfig.mailchimp.apiKey || null,
        serverUrl: clientConfig.mailchimp.serverUrl || null,
        serverPrefix: clientConfig.mailchimp.serverPrefix || null,
        defaultAudienceId: clientConfig.mailchimp.defaultAudienceId || null,
        defaultFromName: clientConfig.mailchimp.defaultFromName || null,
        defaultFromEmail: clientConfig.mailchimp.defaultFromEmail || null,
        defaultReplyToEmail: clientConfig.mailchimp.defaultReplyToEmail || null
      } : null,
      emailCampaign: {
        subjectLine: getFieldValue('Subject Line', ['subjectLine', 'subject']) || '',
        previewText: getFieldValue('Preview Text', ['previewText', 'preview']) || null,
        fromName: getFieldValue('From Name', ['fromName', 'from_name']) || clientConfig.mailchimp?.defaultFromName || '',
        fromEmail: getFieldValue('From Email', ['fromEmail', 'from_email']) || clientConfig.mailchimp?.defaultFromEmail || '',
        replyToEmail: getFieldValue('Reply-To Email', ['replyToEmail', 'reply_to_email', 'replyTo']) || clientConfig.mailchimp?.defaultReplyToEmail || null,
        audienceId: getFieldValue('Mailchimp Audience ID', ['mailchimpAudienceId', 'audienceId']) || clientConfig.mailchimp?.defaultAudienceId || null,
        segmentId: getFieldValue('Mailchimp Segment ID', ['mailchimpSegmentId', 'segmentId']) || null,
        scheduledDate: getFieldValue('Mailchimp Scheduled Date', ['mailchimpScheduledDate', 'scheduledDate']) || null
      },
      generatedHtml: generatedHtml,
      emailIdeaId: id,
      metadata: {
        createdAt: new Date().toISOString(),
        source: "content-engine-app",
        version: "2.0",
        contentType: "email_idea"
      }
    }
    
    console.log('📧 Sending to Mailchimp webhook:', mailchimpWebhookUrl)
    
    // Send to Mailchimp webhook
    const mailchimpResponse = await fetch(mailchimpWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mailchimpPayload)
    })
    
    if (!mailchimpResponse.ok) {
      const errorText = await mailchimpResponse.text()
      console.error('❌ Mailchimp webhook failed:', mailchimpResponse.status, errorText)
      return NextResponse.json(
        { error: `Failed to send to Mailchimp: ${errorText}` },
        { status: mailchimpResponse.status }
      )
    }
    
    const mailchimpResult = await mailchimpResponse.json()
    console.log('✅ Mailchimp webhook response:', mailchimpResult)
    
    // Update email idea with Mailchimp campaign info
    const mailchimpUpdates: any = {}
    
    if (mailchimpResult.mailchimpCampaignId) {
      mailchimpUpdates.mailchimpCampaignId = mailchimpResult.mailchimpCampaignId
    }
    if (mailchimpResult.mailchimpCampaignUrl) {
      mailchimpUpdates.mailchimpCampaignUrl = mailchimpResult.mailchimpCampaignUrl
    }
    if (mailchimpResult.mailchimpSegmentId) {
      mailchimpUpdates.mailchimpSegmentId = mailchimpResult.mailchimpSegmentId
    }
    if (mailchimpResult.mailchimpSentDate) {
      mailchimpUpdates.mailchimpSentDate = mailchimpResult.mailchimpSentDate
    }
    
    // Update status if provided
    if (mailchimpResult.status) {
      mailchimpUpdates.status = mailchimpResult.status
    } else {
      mailchimpUpdates.status = 'Draft Created'
    }
    
    if (Object.keys(mailchimpUpdates).length > 0) {
      await baserowAPI.updateEmailIdea(emailIdeasTableId, id, mailchimpUpdates)
      console.log('✅ Email idea updated with Mailchimp campaign info')
    }
    
    return NextResponse.json({
      success: true,
      message: 'Email sent to Mailchimp successfully',
      mailchimpCampaignId: mailchimpResult.mailchimpCampaignId,
      mailchimpCampaignUrl: mailchimpResult.mailchimpCampaignUrl
    })
    
  } catch (error) {
    console.error('❌ Error sending to Mailchimp:', error)
    return NextResponse.json(
      { 
        error: 'Failed to send to Mailchimp',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

