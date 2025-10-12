/**
 * Client Information Manager
 * 
 * Manages client business information for workflows and personalization
 * Table: Client Information (3232) in Client Info base (233)
 */

export interface ClientInformation {
    clientId: string
    companyName: string
    displayName: string
    industry: string
    companySize: string
    foundedYear?: number
    websiteUrl?: string
    blogUrl?: string
    facebookUrl?: string
    instagramHandle?: string
    linkedinUrl?: string
    xHandle?: string
    tiktokHandle?: string
    country: string
    city?: string
    timezone: string
    primaryContactName?: string
    primaryContactEmail?: string
    primaryContactPhone?: string
    targetAudience?: string
    mainCompetitors?: string
    businessGoals?: string
    brandVoice?: string
    postingFrequency?: string
    languages?: string
    primaryBrandColor?: string
    secondaryBrandColor?: string
    logo?: any
    onboardingStatus: string
    accountManager?: string
    monthlyBudget?: number
}

interface BaserowClientInfo {
    id: number
    'Client ID': string
    'Company Name': string
    'Display Name': string
    'Industry': string
    'Company Size': string
    'Founded Year': number
    'Website URL': string
    'Blog URL': string
    'Facebook URL': string
    'Instagram Handle': string
    'LinkedIn URL': string
    'X Handle': string
    'TikTok Handle': string
    'Country': string
    'City': string
    'Timezone': string
    'Primary Contact Name': string
    'Primary Contact Email': string
    'Primary Contact Phone': string
    'Target Audience': string
    'Main Competitors': string
    'Business Goals': string
    'Brand Voice': string
    'Posting Frequency': string
    'Languages': string
    'Primary Brand Color': string
    'Secondary Brand Color': string
    'Logo': any
    'Onboarding Status': string
    'Account Manager': string
    'Monthly Budget': number
    'Created on': string
    'Last modified': string
}

export class ClientInformationManager {
    private static baserowToken = process.env.BASEROW_MODERN_MANAGEMENT_TOKEN || 'SXe0k6Btm7i28uZP5mp8hr5KPBoWsiE1'
    private static baseUrl = process.env.BASEROW_API_URL || 'https://baserow.aiautomata.co.za'
    private static clientInfoTableId = process.env.BASEROW_CLIENT_INFORMATION_TABLE_ID || '3232'
    private static onboardingWebhookUrl = process.env.WEBHOOK_ONBOARDING || 'https://n8n.aiautomata.co.za/webhook/onboarding'

    /**
     * Create client information record
     */
    static async createClientInfo(clientInfo: ClientInformation): Promise<boolean> {
        try {
            console.log(`➕ Creating client information for: ${clientInfo.clientId}`)
            console.log(`🌐 Baserow URL: ${this.baseUrl}`)
            console.log(`📋 Table ID: ${this.clientInfoTableId}`)
            console.log(`🔑 Token configured: ${this.baserowToken ? 'Yes' : 'No'}`)
            
            const requestUrl = `${this.baseUrl}/api/database/rows/table/${this.clientInfoTableId}/?user_field_names=true`
            console.log(`📡 Full request URL: ${requestUrl}`)

            const response = await fetch(
                requestUrl,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Token ${this.baserowToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        'Client ID': clientInfo.clientId,
                        'Company Name': clientInfo.companyName,
                        'Display Name': clientInfo.displayName,
                        // Only include non-empty values to avoid select field validation errors
                        ...(clientInfo.industry && { 'Industry': clientInfo.industry }),
                        ...(clientInfo.companySize && { 'Company Size': clientInfo.companySize }),
                        ...(clientInfo.foundedYear && { 'Founded Year': clientInfo.foundedYear }),
                        ...(clientInfo.websiteUrl && { 'Website URL': clientInfo.websiteUrl }),
                        ...(clientInfo.blogUrl && { 'Blog URL': clientInfo.blogUrl }),
                        ...(clientInfo.facebookUrl && { 'Facebook URL': clientInfo.facebookUrl }),
                        ...(clientInfo.instagramHandle && { 'Instagram Handle': clientInfo.instagramHandle }),
                        ...(clientInfo.linkedinUrl && { 'LinkedIn URL': clientInfo.linkedinUrl }),
                        ...(clientInfo.xHandle && { 'X Handle': clientInfo.xHandle }),
                        ...(clientInfo.tiktokHandle && { 'TikTok Handle': clientInfo.tiktokHandle }),
                        ...(clientInfo.country && { 'Country': clientInfo.country }),
                        ...(clientInfo.city && { 'City': clientInfo.city }),
                        'Timezone': clientInfo.timezone || 'UTC',
                        ...(clientInfo.primaryContactName && { 'Primary Contact Name': clientInfo.primaryContactName }),
                        ...(clientInfo.primaryContactEmail && { 'Primary Contact Email': clientInfo.primaryContactEmail }),
                        ...(clientInfo.primaryContactPhone && { 'Primary Contact Phone': clientInfo.primaryContactPhone }),
                        ...(clientInfo.targetAudience && { 'Target Audience': clientInfo.targetAudience }),
                        ...(clientInfo.mainCompetitors && { 'Main Competitors': clientInfo.mainCompetitors }),
                        ...(clientInfo.businessGoals && { 'Business Goals': clientInfo.businessGoals }),
                        ...(clientInfo.brandVoice && { 'Brand Voice': clientInfo.brandVoice }),
                        ...(clientInfo.postingFrequency && { 'Posting Frequency': clientInfo.postingFrequency }),
                        ...(clientInfo.languages && { 'Languages': clientInfo.languages }),
                        'Primary Brand Color': clientInfo.primaryBrandColor || '#3B82F6',
                        'Secondary Brand Color': clientInfo.secondaryBrandColor || '#10B981',
                        'Onboarding Status': clientInfo.onboardingStatus || 'Pending',
                        ...(clientInfo.accountManager && { 'Account Manager': clientInfo.accountManager }),
                        ...(clientInfo.monthlyBudget && { 'Monthly Budget': clientInfo.monthlyBudget }),
                    }),
                }
            )

            console.log(`📊 Response status: ${response.status} ${response.statusText}`)
            
            if (!response.ok) {
                const errorText = await response.text()
                console.error('❌ Failed to create client info')
                console.error('❌ Response status:', response.status, response.statusText)
                console.error('❌ Response body:', errorText)
                
                let errorData
                try {
                    errorData = JSON.parse(errorText)
                    console.error('❌ Error details:', JSON.stringify(errorData, null, 2))
                } catch (e) {
                    console.error('❌ Could not parse error response as JSON')
                }
                
                throw new Error(`Failed to create client info: ${response.statusText} - ${errorText}`)
            }

            const result = await response.json()
            console.log(`✅ Client information created successfully`)
            console.log(`✅ Baserow record ID: ${result.id}`)

            // Send to onboarding webhook
            await this.sendToOnboardingWebhook(clientInfo, result)

            return true
        } catch (error) {
            console.error('Error creating client information:', error)
            throw error
        }
    }

    /**
     * Get client information
     */
    static async getClientInfo(clientId: string): Promise<ClientInformation | null> {
        try {
            const response = await fetch(
                `${this.baseUrl}/api/database/rows/table/${this.clientInfoTableId}/?user_field_names=true&size=200`,
                {
                    headers: {
                        'Authorization': `Token ${this.baserowToken}`,
                        'Content-Type': 'application/json',
                    },
                }
            )

            if (!response.ok) {
                throw new Error(`Failed to fetch client info: ${response.statusText}`)
            }

            const data = await response.json()
            const clientRow = data.results.find((row: BaserowClientInfo) => row['Client ID'] === clientId)

            if (!clientRow) {
                return null
            }

            return this.parseBaserowRow(clientRow)
        } catch (error) {
            console.error('Error fetching client information:', error)
            return null
        }
    }

    /**
     * Update client information
     */
    static async updateClientInfo(clientId: string, updates: Partial<ClientInformation>): Promise<boolean> {
        try {
            // First, get the existing record ID
            const response = await fetch(
                `${this.baseUrl}/api/database/rows/table/${this.clientInfoTableId}/?user_field_names=true&size=200`,
                {
                    headers: {
                        'Authorization': `Token ${this.baserowToken}`,
                        'Content-Type': 'application/json',
                    },
                }
            )

            if (!response.ok) {
                throw new Error(`Failed to fetch client info: ${response.statusText}`)
            }

            const data = await response.json()
            const existingRow = data.results.find((row: BaserowClientInfo) => row['Client ID'] === clientId)

            if (!existingRow) {
                return false
            }

            // Prepare update data
            const updateData: any = {}
            if (updates.companyName) updateData['Company Name'] = updates.companyName
            if (updates.displayName) updateData['Display Name'] = updates.displayName
            if (updates.industry) updateData['Industry'] = updates.industry
            if (updates.companySize) updateData['Company Size'] = updates.companySize
            if (updates.foundedYear) updateData['Founded Year'] = updates.foundedYear
            if (updates.websiteUrl !== undefined) updateData['Website URL'] = updates.websiteUrl
            if (updates.blogUrl !== undefined) updateData['Blog URL'] = updates.blogUrl
            if (updates.facebookUrl !== undefined) updateData['Facebook URL'] = updates.facebookUrl
            if (updates.instagramHandle !== undefined) updateData['Instagram Handle'] = updates.instagramHandle
            if (updates.linkedinUrl !== undefined) updateData['LinkedIn URL'] = updates.linkedinUrl
            if (updates.xHandle !== undefined) updateData['X Handle'] = updates.xHandle
            if (updates.tiktokHandle !== undefined) updateData['TikTok Handle'] = updates.tiktokHandle
            if (updates.country) updateData['Country'] = updates.country
            if (updates.city !== undefined) updateData['City'] = updates.city
            if (updates.timezone) updateData['Timezone'] = updates.timezone
            if (updates.primaryContactName !== undefined) updateData['Primary Contact Name'] = updates.primaryContactName
            if (updates.primaryContactEmail !== undefined) updateData['Primary Contact Email'] = updates.primaryContactEmail
            if (updates.primaryContactPhone !== undefined) updateData['Primary Contact Phone'] = updates.primaryContactPhone
            if (updates.targetAudience !== undefined) updateData['Target Audience'] = updates.targetAudience
            if (updates.mainCompetitors !== undefined) updateData['Main Competitors'] = updates.mainCompetitors
            if (updates.businessGoals !== undefined) updateData['Business Goals'] = updates.businessGoals
            if (updates.brandVoice !== undefined) updateData['Brand Voice'] = updates.brandVoice
            if (updates.postingFrequency !== undefined) updateData['Posting Frequency'] = updates.postingFrequency
            if (updates.languages !== undefined) updateData['Languages'] = updates.languages
            if (updates.primaryBrandColor !== undefined) updateData['Primary Brand Color'] = updates.primaryBrandColor
            if (updates.secondaryBrandColor !== undefined) updateData['Secondary Brand Color'] = updates.secondaryBrandColor
            if (updates.onboardingStatus) updateData['Onboarding Status'] = updates.onboardingStatus
            if (updates.accountManager !== undefined) updateData['Account Manager'] = updates.accountManager
            if (updates.monthlyBudget !== undefined) updateData['Monthly Budget'] = updates.monthlyBudget

            // Update in Baserow
            const updateResponse = await fetch(
                `${this.baseUrl}/api/database/rows/table/${this.clientInfoTableId}/${existingRow.id}/?user_field_names=true`,
                {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Token ${this.baserowToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(updateData),
                }
            )

            if (!updateResponse.ok) {
                throw new Error(`Failed to update client info: ${updateResponse.statusText}`)
            }

            console.log(`✅ Client information updated: ${clientId}`)
            return true
        } catch (error) {
            console.error('Error updating client information:', error)
            return false
        }
    }

    /**
     * Send client information to onboarding webhook
     */
    private static async sendToOnboardingWebhook(clientInfo: ClientInformation, baserowRecord: any): Promise<void> {
        try {
            console.log(`📡 Sending client info to onboarding webhook...`)

            const webhookPayload = {
                event: 'client_onboarding',
                timestamp: new Date().toISOString(),
                client: {
                    id: clientInfo.clientId,
                    companyName: clientInfo.companyName,
                    displayName: clientInfo.displayName,
                    industry: clientInfo.industry,
                    companySize: clientInfo.companySize,
                    foundedYear: clientInfo.foundedYear,
                    websiteUrl: clientInfo.websiteUrl,
                    blogUrl: clientInfo.blogUrl,
                    socialMedia: {
                        facebook: clientInfo.facebookUrl,
                        instagram: clientInfo.instagramHandle,
                        linkedin: clientInfo.linkedinUrl,
                        x: clientInfo.xHandle,
                        tiktok: clientInfo.tiktokHandle
                    },
                    location: {
                        country: clientInfo.country,
                        city: clientInfo.city,
                        timezone: clientInfo.timezone
                    },
                    contact: {
                        name: clientInfo.primaryContactName,
                        email: clientInfo.primaryContactEmail,
                        phone: clientInfo.primaryContactPhone
                    },
                    business: {
                        targetAudience: clientInfo.targetAudience,
                        mainCompetitors: clientInfo.mainCompetitors,
                        businessGoals: clientInfo.businessGoals
                    },
                    branding: {
                        brandVoice: clientInfo.brandVoice,
                        postingFrequency: clientInfo.postingFrequency,
                        languages: clientInfo.languages,
                        primaryColor: clientInfo.primaryBrandColor,
                        secondaryColor: clientInfo.secondaryBrandColor
                    },
                    meta: {
                        onboardingStatus: clientInfo.onboardingStatus,
                        accountManager: clientInfo.accountManager,
                        monthlyBudget: clientInfo.monthlyBudget
                    }
                },
                baserowRecordId: baserowRecord.id
            }

            console.log('📤 Webhook payload:', JSON.stringify(webhookPayload, null, 2))

            const webhookResponse = await fetch(this.onboardingWebhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(webhookPayload)
            })

            if (!webhookResponse.ok) {
                console.error(`⚠️ Onboarding webhook failed: ${webhookResponse.statusText}`)
            } else {
                console.log(`✅ Client info sent to onboarding webhook successfully`)
            }
        } catch (error) {
            console.error('⚠️ Error sending to onboarding webhook (non-critical):', error)
            // Don't throw - webhook is optional
        }
    }

    /**
     * Parse Baserow row into ClientInformation
     */
    private static parseBaserowRow(row: BaserowClientInfo): ClientInformation {
        return {
            clientId: row['Client ID'],
            companyName: row['Company Name'],
            displayName: row['Display Name'],
            industry: row['Industry'],
            companySize: row['Company Size'],
            foundedYear: row['Founded Year'],
            websiteUrl: row['Website URL'],
            blogUrl: row['Blog URL'],
            facebookUrl: row['Facebook URL'],
            instagramHandle: row['Instagram Handle'],
            linkedinUrl: row['LinkedIn URL'],
            xHandle: row['X Handle'],
            tiktokHandle: row['TikTok Handle'],
            country: row['Country'],
            city: row['City'],
            timezone: row['Timezone'],
            primaryContactName: row['Primary Contact Name'],
            primaryContactEmail: row['Primary Contact Email'],
            primaryContactPhone: row['Primary Contact Phone'],
            targetAudience: row['Target Audience'],
            mainCompetitors: row['Main Competitors'],
            businessGoals: row['Business Goals'],
            brandVoice: row['Brand Voice'],
            postingFrequency: row['Posting Frequency'],
            languages: row['Languages'],
            primaryBrandColor: row['Primary Brand Color'],
            secondaryBrandColor: row['Secondary Brand Color'],
            logo: row['Logo'],
            onboardingStatus: row['Onboarding Status'],
            accountManager: row['Account Manager'],
            monthlyBudget: row['Monthly Budget']
        }
    }
}

