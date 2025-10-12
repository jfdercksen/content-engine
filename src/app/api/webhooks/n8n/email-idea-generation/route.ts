import { NextRequest, NextResponse } from 'next/server'
import { getClientConfig } from '@/lib/config/clients'

export async function POST(request: NextRequest) {
  try {
    console.log('Email idea generation webhook called')
    const formData = await request.formData()
    
    // Extract form data
    const emailIdeaName = formData.get('emailIdeaName') as string
    const emailType = formData.get('emailType') as string
    const hook = formData.get('hook') as string
    const cta = formData.get('cta') as string
    const emailTextIdea = formData.get('emailTextIdea') as string
    const emailUrlIdea = formData.get('emailUrlIdea') as string
    const status = formData.get('status') as string
    const templates = formData.get('templates') as string
    const selectedTemplateId = formData.get('templateId') as string
    const selectedTemplateName = formData.get('selectedTemplateName') as string
    const emailIdeaId = formData.get('emailIdeaId') as string
    
    // Extract new content source fields
    const contentSource = formData.get('contentSource') as string
    const useUrlAsCta = formData.get('useUrlAsCta') as string
    const useVideoInEmail = formData.get('useVideoInEmail') as string
    
    // Extract image slots data
    const imageSlotsCount = formData.get('imageCount') as string
    const imageSlots: any[] = []
    
    if (imageSlotsCount) {
      const count = parseInt(imageSlotsCount)
      for (let i = 0; i < count; i++) {
        const position = formData.get(`image_${i}_position`) as string
        const imageId = formData.get(`image_${i}_id`) as string
        const imageUrl = formData.get(`image_${i}_url`) as string
        
        if (position) {
          imageSlots.push({
            position,
            imageId,
            imageUrl,
            finalUrl: imageUrl
          })
        }
      }
    }
    
    // Extract voice and video files
    const voiceFiles: any[] = []
    const videoFiles: any[] = []
    
    // Get all voice files
    const voiceFileEntries = formData.getAll('emailVoiceIdea')
    voiceFileEntries.forEach((entry, index) => {
      if (entry instanceof File) {
        voiceFiles.push({
          name: entry.name,
          size: entry.size,
          type: entry.type,
          index
        })
      }
    })
    
    // Get all video files
    const videoFileEntries = formData.getAll('emailVideoIdea')
    videoFileEntries.forEach((entry, index) => {
      if (entry instanceof File) {
        videoFiles.push({
          name: entry.name,
          size: entry.size,
          type: entry.type,
          index
        })
      }
    })
    
    console.log('Extracted form data:', {
      emailIdeaName,
      emailType,
      hook,
      cta,
      emailTextIdea,
      emailUrlIdea,
      status,
      templates,
      selectedTemplateId,
      selectedTemplateName,
      emailIdeaId,
      contentSource,
      useUrlAsCta,
      useVideoInEmail,
      imageSlotsCount,
      imageSlots,
      voiceFiles: voiceFiles.length,
      videoFiles: videoFiles.length
    })
    
    console.log('Template details:', {
      templatesRaw: templates,
      templatesParsed: templates ? JSON.parse(templates) : [],
      selectedTemplateId,
      selectedTemplateName
    })
    
    // Get client ID from the request URL or form data
    const clientId = formData.get('clientId') as string || 'modern-management'
    console.log('Client ID:', clientId)
    const clientConfig = getClientConfig(clientId)
    
    if (!clientConfig) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    console.log('Client config:', {
      name: clientConfig.name,
      hasBaserow: !!clientConfig.baserow,
      baseUrl: clientConfig.baserow?.baseUrl,
      databaseId: clientConfig.baserow?.databaseId,
      hasToken: !!clientConfig.baserow?.token
    })

    // Prepare n8n payload similar to content ideas
    const n8nPayload = {
      client_id: clientId,
      base_id: clientConfig.baserow.databaseId,
      table_id: "730", // Email Ideas table ID
      event: "email_idea_generation",
      timestamp: new Date().toISOString(),
      clientId: clientId,
      client: {
        name: clientConfig.name,
        id: clientId
      },
      tables: {
        emailIdeas: {
          id: "730",
          recordId: null // Will be set after creation
        },
        templates: {
          id: "731" // Templates table ID
        }
      },
      baserow: {
        baseUrl: clientConfig.baserow.baseUrl,
        databaseId: clientConfig.baserow.databaseId,
        token: clientConfig.baserow.token,
        tableId: "730",
        recordId: null
      },
      emailIdea: {
        emailIdeaName,
        emailType,
        hook,
        cta,
        emailTextIdea,
        emailUrlIdea,
        status,
        templates: templates ? JSON.parse(templates) : [],
        selectedTemplateId,
        selectedTemplateName,
        contentSource,
        useUrlAsCta: useUrlAsCta === 'true',
        useVideoInEmail: useVideoInEmail === 'true',
        imageSlots,
        voiceFiles,
        videoFiles
      },
      metadata: {
        createdAt: new Date().toISOString(),
        source: "content-engine-app",
        version: "1.0",
        contentType: "email_idea"
      }
    }

    // Use the record ID from the form data if available, otherwise create a new record
    let finalRecordId = emailIdeaId
    
    if (!finalRecordId) {
      // Create the email idea record FIRST (before sending to n8n)
      try {
        const createResponse = await fetch(`${clientConfig.baserow.baseUrl}/api/database/rows/table/730/`, {
          method: 'POST',
          headers: {
            'Authorization': `Token ${clientConfig.baserow.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            field_7199: emailIdeaName,
            field_7200: emailType,
            field_7202: hook,
            field_7203: cta,
            field_7211: emailTextIdea,
            field_7212: emailUrlIdea,
            field_7216: new Date().toISOString().split('T')[0],
            field_7223: '', // Empty initially
            field_7224: templates ? JSON.parse(templates) : []
          })
        })

        if (createResponse.ok) {
          const createResult = await createResponse.json()
          finalRecordId = createResult.id
          console.log('Email idea created in Baserow with ID:', finalRecordId)
        } else {
          console.error('Failed to create record in Baserow:', await createResponse.text())
        }
      } catch (error) {
        console.error('Error creating record in Baserow:', error)
      }
    } else {
      console.log('Using record ID from form data:', finalRecordId)
    }

    // Update the n8n payload with the record ID
    if (finalRecordId) {
      n8nPayload.tables.emailIdeas.recordId = finalRecordId
      n8nPayload.baserow.recordId = finalRecordId
      console.log('Updated n8n payload with record ID:', finalRecordId)
    }

    // Send to n8n webhook
    console.log('All environment variables:', {
      N8N_CONTENT_IDEA_WEBHOOK_URL: process.env.N8N_CONTENT_IDEA_WEBHOOK_URL,
      N8N_EMAIL_IDEA_WEBHOOK_URL: process.env.N8N_EMAIL_IDEA_WEBHOOK_URL,
      NODE_ENV: process.env.NODE_ENV,
      BASEROW_BASE_URL: process.env.BASEROW_BASE_URL
    })
    
    // Get webhook URL from client settings or environment
    const { getWebhookUrl } = await import('@/lib/utils/getWebhookUrl')
    const n8nWebhookUrl = await getWebhookUrl(clientId, 'email_processor')
    
    if (!n8nWebhookUrl) {
      console.error('❌ Email webhook URL not configured')
      return NextResponse.json({ 
        error: 'Email webhook URL not configured. Please configure in Settings.' 
      }, { status: 500 })
    }
    
    console.log('📡 Using email webhook:', n8nWebhookUrl)

    console.log('Sending email idea generation request to n8n with record ID:', finalRecordId)
    console.log('Updated n8n payload:', n8nPayload)
    console.log('Email webhook payload token:', n8nPayload.baserow.token)
    console.log('Email webhook payload token length:', n8nPayload.baserow.token?.length)

    // Update status to "Generating" before sending to n8n
    if (finalRecordId && clientConfig?.baserow?.baseUrl) {
      try {
        await fetch(`${clientConfig.baserow.baseUrl}/api/database/rows/table/730/${finalRecordId}/`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Token ${clientConfig.baserow.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            field_7215: 'Generating' // Update status to "Generating"
          })
        })
        console.log('Updated email idea status to "Generating"')
      } catch (error) {
        console.error('Error updating status to Generating:', error)
      }
    }

    console.log('Making request to n8n webhook...')
    
    // Send to n8n asynchronously (fire-and-forget)
    fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(n8nPayload)
    }).then(async (n8nResponse) => {
      console.log('N8N response status:', n8nResponse.status)
      
      if (n8nResponse.ok) {
        const n8nResult = await n8nResponse.json()
        console.log('N8N response:', n8nResult)

        // Extract generated HTML from n8n response
        const generatedHtml = n8nResult.generatedHtml || n8nResult.html || ''

        // Update the record with generated HTML and status
        if (finalRecordId && clientConfig?.baserow?.baseUrl) {
          try {
            const updateResponse = await fetch(`${clientConfig.baserow.baseUrl}/api/database/rows/table/730/${finalRecordId}/`, {
              method: 'PATCH',
              headers: {
                'Authorization': `Token ${clientConfig.baserow.token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                field_7223: generatedHtml, // Update with generated HTML
                field_7215: 'Generated' // Update status to "Generated"
              })
            })

            if (updateResponse.ok) {
              console.log('Email idea updated with generated HTML and status')
            } else {
              console.error('Failed to update record with generated HTML:', await updateResponse.text())
            }
          } catch (error) {
            console.error('Error updating record with generated HTML:', error)
          }
        }
      } else {
        const errorText = await n8nResponse.text()
        console.error('N8N webhook failed:', n8nResponse.status, errorText)
        
        // Update status to "Failed" if n8n fails
        if (finalRecordId && clientConfig?.baserow?.baseUrl) {
          try {
            await fetch(`${clientConfig.baserow.baseUrl}/api/database/rows/table/730/${finalRecordId}/`, {
              method: 'PATCH',
              headers: {
                'Authorization': `Token ${clientConfig.baserow.token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                field_7215: 'Failed' // Update status to "Failed"
              })
            })
          } catch (error) {
            console.error('Error updating status to Failed:', error)
          }
        }
      }
    }).catch((error) => {
      console.error('Error sending to n8n webhook:', error)
      
      // Update status to "Failed" if there's an error
      if (finalRecordId && clientConfig?.baserow?.baseUrl) {
        fetch(`${clientConfig.baserow.baseUrl}/api/database/rows/table/730/${finalRecordId}/`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Token ${clientConfig.baserow.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            field_7215: 'Failed' // Update status to "Failed"
          })
        }).catch(updateError => {
          console.error('Error updating status to Failed:', updateError)
        })
      }
    })

    // Return immediately without waiting for n8n completion
    return NextResponse.json({
      success: true,
      recordId: finalRecordId,
      message: 'Email generation started. Please check back in a few minutes.',
      status: 'Generating'
    })

  } catch (error) {
    console.error('Error in email idea generation webhook:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
