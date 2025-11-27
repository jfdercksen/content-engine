import { NextRequest, NextResponse } from 'next/server'
import { emailIdeasFieldMapping } from '@/lib/baserow/fieldMappings'

export async function POST(request: NextRequest) {
  console.log('🚀 Email idea generation webhook called - START')
  
  try {
    // Dynamic imports to avoid module loading issues
    const { getClientConfigForAPI } = await import('@/lib/utils/getClientConfigForAPI')
    const { BaserowAPI } = await import('@/lib/baserow/api')
    
    // Parse form data
    const formData = await request.formData()
    
    // Extract new structure data
    const emailIdeaId = formData.get('emailIdeaId') as string
    const clientId = formData.get('clientId') as string
    const emailMediaStructureJson = formData.get('emailMediaStructure') as string
    const emailType = formData.get('emailType') as string
    const contentSourceType = formData.get('contentSourceType') as string
    const contentSourceValue = formData.get('contentSourceValue') as string
    const sectionsCount = formData.get('sectionsCount') as string
    
    // Parse emailMediaStructure JSON
    let emailMediaStructure: any = null
    if (emailMediaStructureJson) {
      try {
        emailMediaStructure = JSON.parse(emailMediaStructureJson)
      } catch (e) {
        console.error('Failed to parse emailMediaStructure:', e)
      }
    }
    
    // Extract individual sections from FormData
    const sections: any[] = []
    if (sectionsCount) {
      const count = parseInt(sectionsCount)
      for (let i = 0; i < count; i++) {
        const sectionJson = formData.get(`section_${i}`) as string
        if (sectionJson) {
          try {
            const section = JSON.parse(sectionJson)
            sections.push(section)
          } catch (e) {
            console.error(`Failed to parse section_${i}:`, e)
          }
        }
      }
    }
    
    // Use emailMediaStructure if available, otherwise build from individual fields
    if (!emailMediaStructure && emailType) {
      emailMediaStructure = {
        emailType: emailType,
        sections: sections.length > 0 ? sections : [],
        contentSource: {
          type: contentSourceType || 'text',
          value: contentSourceValue || ''
        }
      }
    }

    // Get client ID - use from form data or default
    const finalClientId = clientId || 'modern-management'
    
    // Get client configuration (same as working route)
    const clientConfig = await getClientConfigForAPI(finalClientId)
    if (!clientConfig) {
      console.error('❌ Client configuration not found for:', finalClientId)
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }
    
    console.log('✅ Client config found for:', finalClientId)

    // Get base URL from env or use default
    const baserowBaseUrl = process.env.BASEROW_BASE_URL || process.env.BASEROW_API_URL || 'https://baserow.aiautomata.co.za'

    console.log('Client config:', {
      name: clientConfig.name,
      hasBaserow: !!clientConfig.baserow,
      databaseId: clientConfig.baserow?.databaseId,
      hasToken: !!clientConfig.baserow?.token
    })

    // Fetch image URLs for sections that have imageId but no URL
    const allSections = emailMediaStructure?.sections || sections || []
    const imagesTableId = clientConfig.baserow?.tables?.images
    
    if (imagesTableId) {
      const sectionsNeedingUrls = allSections.filter((s: any) => 
        s.media?.imageId && !s.media?.url
      )
      
      if (sectionsNeedingUrls.length > 0) {
        console.log(`📸 Fetching ${sectionsNeedingUrls.length} image URL(s) from Baserow...`)
        
        for (const section of sectionsNeedingUrls) {
          try {
            const imageId = section.media.imageId
            const imageResponse = await fetch(
              `${baserowBaseUrl}/api/database/rows/table/${imagesTableId}/${imageId}/?user_field_names=true`,
              {
                headers: {
                  'Authorization': `Token ${clientConfig.baserow.token}`,
                  'Content-Type': 'application/json',
                },
              }
            )
            
            if (imageResponse.ok) {
              const imageData = await imageResponse.json()
              
              // Log available fields for debugging
              console.log(`🔍 Image ${imageId} fields:`, Object.keys(imageData))
              
              // Extract URL - check "Image" field first (capital I, array format)
              let imageUrl = ''
              
              // Method 1: Check "Image" field (capital I) - array format: [{ url: "..." }]
              if (imageData.Image && Array.isArray(imageData.Image) && imageData.Image[0]?.url) {
                imageUrl = imageData.Image[0].url
                console.log(`✅ Found URL in Image[0].url`)
              }
              // Method 2: Check "image" field (lowercase) - array format
              else if (imageData.image && Array.isArray(imageData.image) && imageData.image[0]?.url) {
                imageUrl = imageData.image[0].url
                console.log(`✅ Found URL in image[0].url`)
              }
              // Method 3: Check "Image Link URL" field
              else if (imageData['Image Link URL']) {
                imageUrl = imageData['Image Link URL']
                console.log(`✅ Found URL in Image Link URL`)
              }
              // Method 4: Check imageLinkUrl (camelCase)
              else if (imageData.imageLinkUrl) {
                imageUrl = imageData.imageLinkUrl
                console.log(`✅ Found URL in imageLinkUrl`)
              }
              // Method 5: Check nested image.url
              else if (imageData.image?.url) {
                imageUrl = imageData.image.url
                console.log(`✅ Found URL in image.url`)
              }
              // Method 6: Check direct url field
              else if (imageData.url) {
                imageUrl = imageData.url
                console.log(`✅ Found URL in url`)
              }
              // Method 7: Check field IDs (common Baserow field IDs for images)
              else {
                // Try common field ID patterns
                const fieldKeys = Object.keys(imageData).filter(k => k.startsWith('field_'))
                for (const fieldKey of fieldKeys) {
                  const fieldValue = imageData[fieldKey]
                  if (Array.isArray(fieldValue) && fieldValue[0]?.url) {
                    imageUrl = fieldValue[0].url
                    console.log(`✅ Found URL in ${fieldKey}[0].url`)
                    break
                  }
                }
              }
              
              // Extract alt text
              const altText = imageData['Caption Text'] || 
                            imageData.captionText || 
                            imageData.imagePrompt || 
                            imageData.altText || 
                            ''
              
              if (imageUrl) {
                section.media.url = imageUrl
                if (altText && !section.media.altText) {
                  section.media.altText = altText
                }
                console.log(`✅ Fetched image URL for imageId ${imageId}: ${imageUrl.substring(0, 50)}...`)
              } else {
                console.warn(`⚠️ Image ${imageId} found but no URL available. Available fields:`, Object.keys(imageData))
                console.warn(`⚠️ Image data sample:`, JSON.stringify(imageData, null, 2).substring(0, 500))
              }
            } else {
              console.error(`❌ Failed to fetch image ${imageId}: ${imageResponse.statusText}`)
            }
          } catch (imageError) {
            console.error(`⚠️ Error fetching image ${section.media.imageId}:`, imageError)
            // Continue with other images
          }
        }
      }
    }

    // Extract product names from body sections and fetch Product UVP details
    const productSections = allSections.filter(
      (s: any) => s.type === 'body' && s.bodyType === 'product' && s.productName
    )
    const productNames = productSections.map((s: any) => s.productName).filter(Boolean)
    
    console.log('=== Product UVP Fetching ===')
    console.log('Product sections found:', productSections.length)
    console.log('Product names:', productNames)
    
    let productUvpDataArray: any[] = []
    if (productNames.length > 0 && clientConfig.baserow?.tables?.productUvps) {
      try {
        const productUvpsTableId = clientConfig.baserow.tables.productUvps
        
        // Fetch all product UVPs directly
        const uvpsResponse = await fetch(
          `${baserowBaseUrl}/api/database/rows/table/${productUvpsTableId}/?user_field_names=true`,
          {
            headers: {
              'Authorization': `Token ${clientConfig.baserow.token}`,
              'Content-Type': 'application/json',
            },
          }
        )
        
        if (!uvpsResponse.ok) {
          throw new Error(`Failed to fetch Product UVPs: ${uvpsResponse.statusText}`)
        }
        
        const uvpsData = await uvpsResponse.json()
        const allUvps = uvpsData.results || []
        console.log(`Found ${allUvps.length} total Product UVPs in database`)
        
        // Match product names to UVPs
        for (const productName of productNames) {
          const matchingUvp = allUvps.find((uvp: any) => {
            const uvpName = uvp['Product/Service Name'] || uvp.productServiceName || ''
            return uvpName.toLowerCase().trim() === productName.toLowerCase().trim()
          })
          
          if (matchingUvp) {
            const uvpData = {
              id: matchingUvp.id,
              productName: matchingUvp['Product/Service Name'] || matchingUvp.productServiceName || '',
              productUrl: matchingUvp['Product/Service URL'] || matchingUvp.productUrl || '',
              customerType: matchingUvp['Customer Type'] || matchingUvp.customerType || '',
              industryCategory: matchingUvp['Industry Category'] || matchingUvp.industryCategory || '',
              problemSolved: matchingUvp['Problem Solved'] || matchingUvp.problemSolved || '',
              keyDifferentiator: matchingUvp['Key Differentiator'] || matchingUvp.keyDifferentiator || '',
              uvp: matchingUvp['UVP'] || matchingUvp.uvp || '',
              // Baserow metadata
              baserow: {
                tableId: productUvpsTableId,
                recordId: matchingUvp.id
              }
            }
            productUvpDataArray.push(uvpData)
            console.log(`✅ Matched Product UVP for "${productName}":`, uvpData.id)
          } else {
            console.log(`⚠️ No Product UVP found for "${productName}"`)
          }
        }
        
        console.log(`✅ Fetched ${productUvpDataArray.length} Product UVP(s)`)
      } catch (uvpError) {
        console.error('⚠️ Error fetching Product UVP details:', uvpError)
        // Continue without UVP data if fetch fails
      }
    }

    // Validate required baserow config
    if (!clientConfig.baserow) {
      console.error('❌ Baserow config not found for client:', finalClientId)
      return NextResponse.json({ 
        error: 'Baserow configuration not found for this client' 
      }, { status: 500 })
    }

    if (!clientConfig.baserow.databaseId || !clientConfig.baserow.token) {
      console.error('❌ Incomplete Baserow config:', {
        hasDatabaseId: !!clientConfig.baserow.databaseId,
        hasToken: !!clientConfig.baserow.token
      })
      return NextResponse.json({ 
        error: 'Incomplete Baserow configuration' 
      }, { status: 500 })
    }

    // Fetch email idea record to get Mailchimp fields (subject line, from name, from email, etc.)
    let emailIdeaRecord: any = null
    let mailchimpFieldIds: Record<string, string> = {} // Store discovered Mailchimp field IDs
    
    if (emailIdeaId && clientConfig.baserow.tables?.emailIdeas) {
      try {
        const emailIdeasTableId = clientConfig.baserow.tables.emailIdeas
        
        // Fetch email idea record with readable field names
        const emailIdeaResponse = await fetch(
          `${baserowBaseUrl}/api/database/rows/table/${emailIdeasTableId}/${emailIdeaId}/?user_field_names=true`,
          {
            headers: {
              'Authorization': `Token ${clientConfig.baserow.token}`,
              'Content-Type': 'application/json',
            },
          }
        )
        
        if (emailIdeaResponse.ok) {
          emailIdeaRecord = await emailIdeaResponse.json()
          console.log('✅ Fetched email idea record for Mailchimp fields')
        } else {
          console.warn('⚠️ Could not fetch email idea record:', emailIdeaResponse.statusText)
        }
        
        // Fetch table fields to discover Mailchimp field IDs
        try {
          const tableFieldsResponse = await fetch(
            `${baserowBaseUrl}/api/database/fields/table/${emailIdeasTableId}/`,
            {
              headers: {
                'Authorization': `Token ${clientConfig.baserow.token}`,
                'Content-Type': 'application/json',
              },
            }
          )
          
          if (tableFieldsResponse.ok) {
            const tableFields = await tableFieldsResponse.json()
            
            // Map Mailchimp field names to field IDs
            const mailchimpFieldNamePatterns = {
              subjectLine: ['Subject Line', 'subjectLine', 'subject_line', 'Subject'],
              previewText: ['Preview Text', 'previewText', 'preview_text', 'Preview'],
              fromName: ['From Name', 'fromName', 'from_name', 'From'],
              fromEmail: ['From Email', 'fromEmail', 'from_email', 'From Email Address'],
              replyToEmail: ['Reply-To Email', 'replyToEmail', 'reply_to_email', 'Reply To', 'ReplyTo'],
              mailchimpCampaignId: ['Mailchimp Campaign ID', 'mailchimpCampaignId', 'mailchimp_campaign_id', 'Campaign ID'],
              mailchimpCampaignUrl: ['Mailchimp Campaign URL', 'mailchimpCampaignUrl', 'mailchimp_campaign_url', 'Campaign URL'],
              mailchimpSegmentId: ['Mailchimp Segment ID', 'mailchimpSegmentId', 'mailchimp_segment_id', 'Segment ID'],
              mailchimpSentDate: ['Mailchimp Sent Date', 'mailchimpSentDate', 'mailchimp_sent_date', 'Sent Date']
            }
            
            for (const [key, patterns] of Object.entries(mailchimpFieldNamePatterns)) {
              for (const pattern of patterns) {
                const field = tableFields.find((f: any) => 
                  f.name === pattern || 
                  f.name?.toLowerCase() === pattern.toLowerCase()
                )
                if (field) {
                  mailchimpFieldIds[key] = field.id
                  console.log(`✅ Found Mailchimp field: ${key} -> ${field.id} (${field.name})`)
                  break
                }
              }
            }
          }
        } catch (fieldError) {
          console.error('⚠️ Error fetching table fields for Mailchimp field discovery:', fieldError)
          // Continue without field discovery
        }
      } catch (error) {
        console.error('⚠️ Error fetching email idea record:', error)
        // Continue without email idea record
      }
    }

    // Extract Mailchimp-related fields from email idea record
    const getFieldValue = (fieldName: string, altNames?: string[]): string | null => {
      if (!emailIdeaRecord) return null
      
      // Try exact match first
      if (emailIdeaRecord[fieldName]) {
        const value = emailIdeaRecord[fieldName]
        return typeof value === 'string' ? value : (value?.value || value || null)
      }
      
      // Try alternative names
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

    // Prepare n8n payload with new structure
    const n8nPayload = {
      client_id: finalClientId,
      base_id: clientConfig.baserow.databaseId,
      table_id: clientConfig.baserow.tables?.emailIdeas || "730", // Email Ideas table ID
      event: "email_idea_generation",
      timestamp: new Date().toISOString(),
      clientId: finalClientId,
      client: {
        name: clientConfig.name || finalClientId,
        id: finalClientId
      },
      tables: {
        emailIdeas: {
          id: clientConfig.baserow.tables?.emailIdeas || "730",
          recordId: emailIdeaId || null
        },
        brandAssets: {
          id: clientConfig.baserow.tables?.brandAssets || ''
        },
        images: {
          id: clientConfig.baserow.tables?.images || ''
        },
        templates: {
          id: clientConfig.baserow.tables?.templates || ''
        }
      },
      baserow: {
        baseUrl: baserowBaseUrl,
        databaseId: clientConfig.baserow.databaseId,
        token: clientConfig.baserow.token,
        tableId: clientConfig.baserow.tables?.emailIdeas || "730",
        recordId: emailIdeaId || null
      },
      // Mailchimp Configuration (from client settings)
      mailchimp: clientConfig.mailchimp ? {
        apiKey: clientConfig.mailchimp.apiKey || null,
        serverUrl: clientConfig.mailchimp.serverUrl || null,
        serverPrefix: clientConfig.mailchimp.serverPrefix || null,
        defaultAudienceId: clientConfig.mailchimp.defaultAudienceId || null,
        defaultFromName: clientConfig.mailchimp.defaultFromName || null,
        defaultFromEmail: clientConfig.mailchimp.defaultFromEmail || null,
        defaultReplyToEmail: clientConfig.mailchimp.defaultReplyToEmail || null
      } : null,
      // Email Campaign Details (from email idea record)
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
      // New email structure (use updated sections with fetched URLs)
      emailMediaStructure: {
        ...emailMediaStructure,
        sections: allSections
      },
      emailType: emailType,
      contentSource: {
        type: contentSourceType || emailMediaStructure?.contentSource?.type || 'text',
        value: contentSourceValue || emailMediaStructure?.contentSource?.value || ''
      },
      sections: allSections,
      sectionsCount: sections.length || emailMediaStructure?.sections?.length || 0,
      // Product UVP information (if products are in sections)
      productUVPs: productUvpDataArray,
      productUVPsCount: productUvpDataArray.length,
      hasProductUVPs: productUvpDataArray.length > 0,
      // Metadata
      emailIdeaId: emailIdeaId,
      metadata: {
        createdAt: new Date().toISOString(),
        source: "content-engine-app",
        version: "2.0", // Updated version for new structure
        contentType: "email_idea"
      }
    }

    // Add Product UVPs table info if available
    if (clientConfig.baserow.tables.productUvps) {
      (n8nPayload.tables as any).productUvps = {
        id: clientConfig.baserow.tables.productUvps
      }
    }

    // Prepare email ideas field mappings for the workflow
    // Get client-specific mappings if available, otherwise use defaults
    const clientEmailIdeaMappings: Record<string, any> = (clientConfig.fieldMappings?.emailIdeas as Record<string, any>) || {}
    
    // Create both forward (fieldId -> fieldName) and reverse (fieldName -> fieldId) mappings
    const emailIdeasFieldMappings: Record<string, string> = {}
    const emailIdeasReverseMappings: Record<string, string> = {}
    
    // Start with default mappings
    for (const [fieldId, fieldName] of Object.entries(emailIdeasFieldMapping)) {
      emailIdeasFieldMappings[fieldId] = fieldName as string
      emailIdeasReverseMappings[fieldName as string] = fieldId
    }
    
    // Override with client-specific mappings if they exist
    // Client mappings might be in format: { "fieldName": "field_XXXXX" } or { "fieldName": number }
    for (const [fieldName, fieldId] of Object.entries(clientEmailIdeaMappings)) {
      const fieldIdValue = String(fieldId)
      if (fieldIdValue.startsWith('field_')) {
        emailIdeasFieldMappings[fieldIdValue] = fieldName
        emailIdeasReverseMappings[fieldName] = fieldIdValue
      } else if (!isNaN(Number(fieldId))) {
        // Handle numeric field IDs
        const fieldIdStr = `field_${fieldId}`
        emailIdeasFieldMappings[fieldIdStr] = fieldName
        emailIdeasReverseMappings[fieldName] = fieldIdStr
      }
    }
    
    // Build common fields using dynamic mappings (no hardcoded fallbacks)
    // Try multiple field name variations to find the correct mapping
    const findFieldId = (possibleNames: string[]): string | null => {
      for (const name of possibleNames) {
        if (emailIdeasReverseMappings[name]) {
          return emailIdeasReverseMappings[name]
        }
      }
      return null
    }
    
    const generatedHtmlFieldId = findFieldId(['generatedHtml', 'generatedhtml', 'generated_html', 'generatedHtml'])
    const statusFieldId = findFieldId(['status', 'Status'])
    const emailIdeaNameFieldId = findFieldId(['emailIdeaName', 'emailideaname', 'email_idea_name', 'emailIdeaName'])
    const emailTypeFieldId = findFieldId(['emailType', 'emailtype', 'email_type', 'emailType'])
    const emailTextIdeaFieldId = findFieldId(['emailTextIdea', 'emailtextidea', 'email_text_idea', 'emailTextIdea'])
    
    // Mailchimp field IDs - use discovered IDs first, then try to find in mappings
    const subjectLineFieldId = mailchimpFieldIds.subjectLine || findFieldId(['subjectLine', 'subjectline', 'subject_line', 'Subject Line'])
    const previewTextFieldId = mailchimpFieldIds.previewText || findFieldId(['previewText', 'previewtext', 'preview_text', 'Preview Text'])
    const fromNameFieldId = mailchimpFieldIds.fromName || findFieldId(['fromName', 'fromname', 'from_name', 'From Name'])
    const fromEmailFieldId = mailchimpFieldIds.fromEmail || findFieldId(['fromEmail', 'fromemail', 'from_email', 'From Email'])
    const replyToEmailFieldId = mailchimpFieldIds.replyToEmail || findFieldId(['replyToEmail', 'replytoemail', 'reply_to_email', 'Reply-To Email'])
    const mailchimpCampaignIdFieldId = mailchimpFieldIds.mailchimpCampaignId || findFieldId(['mailchimpCampaignId', 'mailchimpcampaignid', 'mailchimp_campaign_id', 'Mailchimp Campaign ID'])
    const mailchimpCampaignUrlFieldId = mailchimpFieldIds.mailchimpCampaignUrl || findFieldId(['mailchimpCampaignUrl', 'mailchimpcampaignurl', 'mailchimp_campaign_url', 'Mailchimp Campaign URL'])
    const mailchimpSegmentIdFieldId = mailchimpFieldIds.mailchimpSegmentId || findFieldId(['mailchimpSegmentId', 'mailchimpsegmentid', 'mailchimp_segment_id', 'Mailchimp Segment ID'])
    const mailchimpSentDateFieldId = mailchimpFieldIds.mailchimpSentDate || findFieldId(['mailchimpSentDate', 'mailchimpsentdate', 'mailchimp_sent_date', 'Mailchimp Sent Date'])
    
    // Add field mappings directly to payload so workflow can update fields
    // This allows the workflow to know which Baserow field IDs correspond to which fields
    ;(n8nPayload as any).emailIdeasFieldMappings = {
      // Forward mapping: field_XXXXX -> fieldName
      fieldIdToName: emailIdeasFieldMappings,
      // Reverse mapping: fieldName -> field_XXXXX  
      nameToFieldId: emailIdeasReverseMappings,
      // Common field IDs that workflow will need (for easy access) - only include if found
      commonFields: {
        ...(generatedHtmlFieldId && { generatedHtml: generatedHtmlFieldId }),
        ...(statusFieldId && { status: statusFieldId }),
        ...(emailIdeaNameFieldId && { emailIdeaName: emailIdeaNameFieldId }),
        ...(emailTypeFieldId && { emailType: emailTypeFieldId }),
        ...(emailTextIdeaFieldId && { emailTextIdea: emailTextIdeaFieldId })
      },
      // Mailchimp field IDs - these allow the workflow to update Mailchimp fields after generating the email
      mailchimpFields: {
        ...(subjectLineFieldId && { subjectLine: subjectLineFieldId }),
        ...(previewTextFieldId && { previewText: previewTextFieldId }),
        ...(fromNameFieldId && { fromName: fromNameFieldId }),
        ...(fromEmailFieldId && { fromEmail: fromEmailFieldId }),
        ...(replyToEmailFieldId && { replyToEmail: replyToEmailFieldId }),
        ...(mailchimpCampaignIdFieldId && { mailchimpCampaignId: mailchimpCampaignIdFieldId }),
        ...(mailchimpCampaignUrlFieldId && { mailchimpCampaignUrl: mailchimpCampaignUrlFieldId }),
        ...(mailchimpSegmentIdFieldId && { mailchimpSegmentId: mailchimpSegmentIdFieldId }),
        ...(mailchimpSentDateFieldId && { mailchimpSentDate: mailchimpSentDateFieldId })
      }
    }
    
    console.log('=== Email Ideas Field Mappings ===')
    console.log('Field mappings added to payload:', {
      totalFields: Object.keys(emailIdeasFieldMappings).length,
      clientMappingsUsed: Object.keys(clientEmailIdeaMappings).length > 0,
      commonFields: (n8nPayload as any).emailIdeasFieldMappings.commonFields,
      mailchimpFields: (n8nPayload as any).emailIdeasFieldMappings.mailchimpFields
    })
    
    if (!generatedHtmlFieldId) {
      console.warn('⚠️ Generated HTML field ID not found in mappings. Available field names:', Object.keys(emailIdeasReverseMappings))
    }
    
    if (!subjectLineFieldId) {
      console.warn('⚠️ Subject Line field ID not found. The workflow may not be able to update the subject line field.')
    } else {
      console.log('✅ Subject Line field ID found:', subjectLineFieldId, '- Workflow can update this field')
    }
    
    console.log('=== N8N Payload ===')
    console.log('Payload (without token):', JSON.stringify({
      ...n8nPayload,
      baserow: { ...n8nPayload.baserow, token: '***REDACTED***' }
    }, null, 2))

    // Use the record ID from the form data (record should already be created)
    const finalRecordId = emailIdeaId || null
    
    if (!finalRecordId) {
      console.error('❌ No emailIdeaId provided - record must be created first')
      return NextResponse.json({ 
        error: 'Email idea ID is required. Record must be created before workflow processing.',
        receivedData: {
          emailIdeaId: emailIdeaId,
          clientId: finalClientId,
          hasEmailMediaStructure: !!emailMediaStructure
        }
      }, { status: 400 })
    }
    
    console.log('Using email idea ID from form data:', finalRecordId)

    // Update the n8n payload with the record ID
    if (n8nPayload.tables?.emailIdeas) {
      n8nPayload.tables.emailIdeas.recordId = finalRecordId
    }
    if (n8nPayload.baserow) {
      n8nPayload.baserow.recordId = finalRecordId
    }
    n8nPayload.emailIdeaId = finalRecordId
    console.log('Updated n8n payload with record ID:', finalRecordId)

    // Send to n8n webhook
    console.log('All environment variables:', {
      N8N_CONTENT_IDEA_WEBHOOK_URL: process.env.N8N_CONTENT_IDEA_WEBHOOK_URL,
      N8N_EMAIL_IDEA_WEBHOOK_URL: process.env.N8N_EMAIL_IDEA_WEBHOOK_URL,
      NODE_ENV: process.env.NODE_ENV,
      BASEROW_BASE_URL: process.env.BASEROW_BASE_URL
    })
    
    // Get webhook URL - use environment variable or default (simplified to avoid module loading issues)
    const n8nWebhookUrl = process.env.N8N_EMAIL_IDEA_WEBHOOK_URL 
      || process.env.WEBHOOK_EMAIL_PROCESSOR 
      || 'https://n8n.aiautomata.co.za/webhook/email-processor'
    
    console.log('✅ Step 9: Webhook URL determined:', n8nWebhookUrl)

    console.log('Sending email idea generation request to n8n with record ID:', finalRecordId)
    console.log('Updated n8n payload:', n8nPayload)
    console.log('Email webhook payload token:', n8nPayload.baserow.token)
    console.log('Email webhook payload token length:', n8nPayload.baserow.token?.length)

    // Update status to "Generating" before sending to n8n
    const emailIdeasTableId = clientConfig.baserow.tables?.emailIdeas || "730"
    if (finalRecordId && emailIdeasTableId) {
      try {
        const baserowAPI = new BaserowAPI(
          clientConfig.baserow.token,
          clientConfig.baserow.databaseId,
          clientConfig.fieldMappings
        )
        
        await baserowAPI.updateEmailIdea(emailIdeasTableId, finalRecordId, {
          status: 'Generating'
        })
        console.log('Updated email idea status to "Generating"')
      } catch (error) {
        console.error('Error updating status to Generating:', error)
        // Don't fail the request if status update fails
      }
    }

    console.log('✅ Step 10: Making request to n8n webhook:', n8nWebhookUrl)
    console.log('📦 Payload size:', JSON.stringify(n8nPayload).length, 'bytes')
    
    // Send to n8n asynchronously (fire-and-forget)
    fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(n8nPayload)
    }).then(async (n8nResponse) => {
      console.log('✅ Step 11: N8N webhook responded with status:', n8nResponse.status)
      
      if (n8nResponse.ok) {
        const n8nResult = await n8nResponse.json()
        console.log('N8N response:', n8nResult)

        // Extract generated HTML from n8n response
        const generatedHtml = n8nResult.generatedHtml || n8nResult.html || ''

        // Update the record with generated HTML and status
        if (finalRecordId && emailIdeasTableId) {
          try {
            const baserowAPI = new BaserowAPI(
              clientConfig.baserow.token,
              clientConfig.baserow.databaseId,
              clientConfig.fieldMappings || {}
            )
            
            await baserowAPI.updateEmailIdea(emailIdeasTableId, finalRecordId, {
              generatedHtml: generatedHtml,
              status: 'Generated'
            })
            console.log('Email idea updated with generated HTML and status')
          } catch (error) {
            console.error('Error updating record with generated HTML:', error)
          }
        }
      } else {
        const errorText = await n8nResponse.text()
        console.error('N8N webhook failed:', n8nResponse.status, errorText)
        
        // Update status to "Failed" if n8n fails
        if (finalRecordId && emailIdeasTableId) {
          try {
            const baserowAPI = new BaserowAPI(
              clientConfig.baserow.token,
              clientConfig.baserow.databaseId,
              clientConfig.fieldMappings || {}
            )
            
            await baserowAPI.updateEmailIdea(emailIdeasTableId, finalRecordId, {
              status: 'Failed'
            })
          } catch (error) {
            console.error('Error updating status to Failed:', error)
          }
        }
      }
    }).catch(async (error) => {
      console.error('Error sending to n8n webhook:', error)
      
      // Update status to "Failed" if there's an error
      if (finalRecordId && emailIdeasTableId) {
        try {
          const baserowAPI = new BaserowAPI(
            clientConfig.baserow.token,
            clientConfig.baserow.databaseId,
            clientConfig.fieldMappings || {}
          )
          
          await baserowAPI.updateEmailIdea(emailIdeasTableId, finalRecordId, {
            status: 'Failed'
          })
        } catch (updateError) {
          console.error('Error updating status to Failed:', updateError)
        }
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
    console.error('❌ Error in email idea generation webhook:', error)
    
    // Log full error details
    if (error instanceof Error) {
      console.error('Error name:', error.name)
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    } else {
      console.error('Non-Error object:', JSON.stringify(error, null, 2))
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    const errorStack = error instanceof Error ? error.stack : undefined
    
    // Return a proper JSON error response
    return NextResponse.json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? errorStack : undefined,
      timestamp: new Date().toISOString()
    }, { 
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
}
