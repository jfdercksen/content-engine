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

        console.log('🔧 Initializing settings for client:', clientId)
        console.log('📋 Request body:', JSON.stringify(body, null, 2))
        console.log('🌐 Environment check:')
        console.log('  - BASEROW_API_URL:', process.env.BASEROW_API_URL || 'https://baserow.aiautomata.co.za')
        console.log('  - BASEROW_MODERN_MANAGEMENT_TOKEN:', process.env.BASEROW_MODERN_MANAGEMENT_TOKEN ? '***set***' : '***NOT SET***')

        const results: { success: boolean; message: string }[] = []

        // Initialize webhook URLs from environment or request body
        const webhooks = body.webhooks || {
            social_media_processor: process.env.WEBHOOK_SOCIAL_MEDIA_PROCESSOR || 'https://n8n.aiautomata.co.za/webhook/social-media-processor',
            image_generator: process.env.WEBHOOK_IMAGE_GENERATOR || 'https://n8n.aiautomata.co.za/webhook/image-generator-webhook',
            blog_processor: process.env.WEBHOOK_BLOG_PROCESSOR || 'https://n8n.aiautomata.co.za/webhook/blog-creation-mvp',
            email_processor: process.env.WEBHOOK_EMAIL_PROCESSOR || 'https://n8n.aiautomata.co.za/webhook/email-processor',
            uvp_creation: process.env.WEBHOOK_UVP_CREATION || 'https://n8n.aiautomata.co.za/webhook/uvp_creation',
            wordpress_publisher: process.env.WEBHOOK_WORDPRESS_PUBLISHER || 'https://n8n.aiautomata.co.za/webhook/blog_post'
        }

        // Set webhook URLs
        console.log('📡 Setting webhook URLs...')
        for (const [key, value] of Object.entries(webhooks)) {
            console.log(`  - Setting webhook: ${key} = ${value}`)
            try {
                const success = await SettingsManager.setSetting(
                    clientId,
                    'Webhooks',
                    key,
                    value,
                    `Webhook URL for ${key.replace(/_/g, ' ')}`,
                    false
                )
                console.log(`  ${success ? '✅' : '❌'} Webhook ${key}: ${success ? 'success' : 'failed'}`)
                results.push({
                    success,
                    message: `Webhook ${key}: ${success ? 'initialized' : 'failed'}`
                })
            } catch (webhookError) {
                console.error(`  ❌ Error setting webhook ${key}:`, webhookError)
                results.push({
                    success: false,
                    message: `Webhook ${key}: error - ${webhookError}`
                })
            }
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

        // Initialize WordPress settings (empty by default, client fills in)
        console.log('🔧 Initializing WordPress settings...')
        const wordpressSettings = body.wordpress || {
            site_url: '',
            username: '',
            app_password: '',
            publishing_enabled: false
        }

        for (const [key, value] of Object.entries(wordpressSettings)) {
            try {
                const dataType = typeof value === 'boolean' ? 'boolean' : 'text'
                const success = await SettingsManager.setSetting(
                    clientId,
                    'WordPress',
                    key,
                    value,
                    `WordPress ${key.replace(/_/g, ' ')}`,
                    false
                )
                console.log(`  ${success ? '✅' : '❌'} WordPress ${key}: ${success ? 'success' : 'failed'}`)
                results.push({
                    success,
                    message: `WordPress ${key}: ${success ? 'initialized' : 'failed'}`
                })
            } catch (wpError) {
                console.error(`  ❌ Error setting WordPress ${key}:`, wpError)
                results.push({
                    success: false,
                    message: `WordPress ${key}: error - ${wpError}`
                })
            }
        }

        const allSuccessful = results.every(r => r.success)
        const failedCount = results.filter(r => !r.success).length

        console.log('📊 Settings initialization summary:')
        console.log(`  - Total: ${results.length}`)
        console.log(`  - Successful: ${results.length - failedCount}`)
        console.log(`  - Failed: ${failedCount}`)
        
        if (failedCount > 0) {
            console.log('❌ Failed settings:')
            results.filter(r => !r.success).forEach(r => {
                console.log(`  - ${r.message}`)
            })
        }

        return NextResponse.json({
            success: allSuccessful,
            message: allSuccessful 
                ? 'Settings initialized successfully' 
                : `Some settings failed to initialize (${failedCount}/${results.length} failed)`,
            results
        })
    } catch (error: any) {
        console.error('❌ Error initializing settings:', error)
        console.error('❌ Error message:', error?.message)
        console.error('❌ Error stack:', error?.stack)
        return NextResponse.json(
            { 
                error: 'Failed to initialize settings',
                message: error?.message || 'Unknown error'
            },
            { status: 500 }
        )
    }
}

