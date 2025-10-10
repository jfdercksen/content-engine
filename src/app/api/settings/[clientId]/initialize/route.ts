import { NextRequest, NextResponse } from 'next/server'
import { SettingsManager } from '@/lib/config/settingsManager'

/**
 * Initialize default settings and preferences for a client
 * This can be called when creating a new client or to populate settings from .env
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ clientId: string }> }
) {
    try {
        const { clientId } = await params
        const body = await request.json()

        console.log('Initializing settings for client:', clientId)

        const results: { success: boolean; message: string }[] = []

        // Initialize webhook URLs from environment or request body
        const webhooks = body.webhooks || {
            social_media_processor: process.env.WEBHOOK_SOCIAL_MEDIA_PROCESSOR || 'https://n8n.aiautomata.co.za/webhook/social-media-processor',
            image_generator: process.env.WEBHOOK_IMAGE_GENERATOR || 'https://n8n.aiautomata.co.za/webhook/image-generator-webhook',
            blog_processor: process.env.WEBHOOK_BLOG_PROCESSOR || 'https://n8n.aiautomata.co.za/webhook/blog-creation-mvp',
            email_processor: process.env.WEBHOOK_EMAIL_PROCESSOR || 'https://n8n.aiautomata.co.za/webhook/email-processor',
            uvp_creation: process.env.WEBHOOK_UVP_CREATION || 'https://n8n.aiautomata.co.za/webhook/uvp_creation'
        }

        // Set webhook URLs
        for (const [key, value] of Object.entries(webhooks)) {
            const success = await SettingsManager.setSetting(
                clientId,
                'Webhooks',
                key,
                value,
                `Webhook URL for ${key.replace(/_/g, ' ')}`,
                false
            )
            results.push({
                success,
                message: `Webhook ${key}: ${success ? 'initialized' : 'failed'}`
            })
        }

        // Initialize default AI settings
        const aiSettings = body.aiSettings || {
            default_model: 'gpt-4',
            temperature: '0.7',
            max_tokens: '2000',
            content_tone: 'professional'
        }

        for (const [key, value] of Object.entries(aiSettings)) {
            const dataType = typeof value === 'number' ? 'number' : 'text'
            const success = await SettingsManager.setPreference(
                clientId,
                'AI Settings',
                key,
                value,
                dataType,
                `AI setting for ${key.replace(/_/g, ' ')}`
            )
            results.push({
                success,
                message: `AI Setting ${key}: ${success ? 'initialized' : 'failed'}`
            })
        }

        // Initialize default publishing settings
        const publishingSettings = {
            auto_publish_enabled: false,
            default_publish_time: '09:00',
            timezone: 'UTC',
            require_approval: true
        }

        for (const [key, value] of Object.entries(publishingSettings)) {
            const dataType = typeof value === 'boolean' ? 'boolean' : 'text'
            const success = await SettingsManager.setPreference(
                clientId,
                'Publishing',
                key,
                value,
                dataType,
                `Publishing setting for ${key.replace(/_/g, ' ')}`
            )
            results.push({
                success,
                message: `Publishing Setting ${key}: ${success ? 'initialized' : 'failed'}`
            })
        }

        const allSuccessful = results.every(r => r.success)

        return NextResponse.json({
            success: allSuccessful,
            message: allSuccessful 
                ? 'Settings initialized successfully' 
                : 'Some settings failed to initialize',
            results
        })
    } catch (error) {
        console.error('Error initializing settings:', error)
        return NextResponse.json(
            { error: 'Failed to initialize settings' },
            { status: 500 }
        )
    }
}

