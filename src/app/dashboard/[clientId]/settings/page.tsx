'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { 
    Home, 
    ChevronRight, 
    Save, 
    RefreshCw, 
    Webhook, 
    Plug, 
    Sparkles, 
    Calendar, 
    Bell,
    Copy,
    Check,
    Globe,
    ExternalLink,
    FileDown
} from 'lucide-react'
import { toast } from 'sonner'

interface SettingsData {
    settings: {
        webhooks?: Record<string, string>
        integrations?: Record<string, string>
        wordpress?: Record<string, any>
    }
    preferences: {
        ai_settings?: Record<string, any>
        publishing?: Record<string, any>
        notifications?: Record<string, any>
    }
}

export default function SettingsPage() {
    const params = useParams()
    const router = useRouter()
    const clientId = params.clientId as string

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [copied, setCopied] = useState<string | null>(null)
    const [isFirstTime, setIsFirstTime] = useState(false)
    
    const [webhooks, setWebhooks] = useState({
        social_media_processor: '',
        image_generator: '',
        blog_processor: '',
        email_processor: '',
        uvp_creation: ''
    })

    const [integrations, setIntegrations] = useState({
        openai_api_key: '',
        replicate_api_token: '',
        anthropic_api_key: ''
    })

    const [wordpress, setWordpress] = useState({
        site_url: '',
        jwt_token: '',
        username: '',
        token_expiration: '',
        mcp_endpoint: '',
        publishing_enabled: false
    })

    const [aiSettings, setAiSettings] = useState({
        default_model: 'gpt-4',
        temperature: '0.7',
        max_tokens: '2000',
        content_tone: 'professional'
    })

    const [publishing, setPublishing] = useState({
        auto_publish_enabled: false,
        default_publish_time: '09:00',
        timezone: 'UTC',
        require_approval: true
    })

    const [notifications, setNotifications] = useState({
        email_alerts: '',
        slack_webhook: '',
        enable_digest: false,
        digest_schedule: 'daily'
    })

    useEffect(() => {
        // Check if this is first-time setup
        const urlParams = new URLSearchParams(window.location.search)
        const firstTime = urlParams.get('firstTime') === 'true' || sessionStorage.getItem('firstTimeSetup') === 'true'
        
        if (firstTime) {
            setIsFirstTime(true)
            sessionStorage.removeItem('firstTimeSetup') // Clear flag
            // Pre-populate with defaults instead of fetching
            loadDefaultSettings()
        } else {
            fetchSettings()
        }
    }, [clientId])

    const loadDefaultSettings = () => {
        console.log('📋 Loading default settings for first-time setup...')
        
        // Pre-populate with default values from environment
        setWebhooks({
            social_media_processor: 'https://n8n.aiautomata.co.za/webhook/social-media-processor',
            image_generator: 'https://n8n.aiautomata.co.za/webhook/image-generator-webhook',
            blog_processor: 'https://n8n.aiautomata.co.za/webhook/blog-creation-mvp',
            email_processor: 'https://n8n.aiautomata.co.za/webhook/email-processor',
            uvp_creation: 'https://n8n.aiautomata.co.za/webhook/uvp_creation'
        })

        setAiSettings({
            default_model: 'gpt-4',
            temperature: '0.7',
            max_tokens: '2000',
            content_tone: 'professional'
        })

        setPublishing({
            auto_publish: false,
            default_time: '09:00',
            timezone: 'UTC',
            require_approval: true
        })

        setLoading(false)
        console.log('✅ Default settings loaded')
    }

    const fetchSettings = async () => {
        try {
            setLoading(true)
            const response = await fetch(`/api/settings/${clientId}`)
            
            if (!response.ok) {
                // If no settings found, load defaults
                console.log('⚠️ No settings found, loading defaults...')
                loadDefaultSettings()
                return
            }

            const data: SettingsData = await response.json()

            // Populate webhooks
            if (data.settings?.webhooks) {
                setWebhooks(prev => ({ ...prev, ...data.settings.webhooks }))
            }

            // Populate integrations
            if (data.settings?.integrations) {
                setIntegrations(prev => ({ ...prev, ...data.settings.integrations }))
            }

            // Populate WordPress settings
            if (data.settings?.wordpress) {
                setWordpress(prev => ({ ...prev, ...data.settings.wordpress }))
            }

            // Populate AI settings
            if (data.preferences?.ai_settings) {
                setAiSettings(prev => ({ ...prev, ...data.preferences.ai_settings }))
            }

            // Populate publishing settings
            if (data.preferences?.publishing) {
                setPublishing(prev => ({ ...prev, ...data.preferences.publishing }))
            }

            // Populate notifications
            if (data.preferences?.notifications) {
                setNotifications(prev => ({ ...prev, ...data.preferences.notifications }))
            }
        } catch (error) {
            console.error('Error fetching settings:', error)
            toast.error('Failed to load settings')
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const response = await fetch(`/api/settings/${clientId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    settings: {
                        Webhooks: webhooks,
                        Integrations: integrations,
                        WordPress: wordpress
                    },
                    preferences: {
                        'AI Settings': aiSettings,
                        Publishing: publishing,
                        Notifications: notifications
                    }
                }),
            })

            if (!response.ok) {
                throw new Error('Failed to save settings')
            }

            toast.success('Settings saved successfully!')
        } catch (error) {
            console.error('Error saving settings:', error)
            toast.error('Failed to save settings. Please try again.')
        } finally {
            setSaving(false)
        }
    }

    const handleSaveAll = async () => {
        setSaving(true)
        try {
            console.log('💾 Saving all settings for first-time setup...')
            
            const response = await fetch(`/api/settings/${clientId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    settings: {
                        Webhooks: webhooks,
                        Integrations: integrations,
                        WordPress: wordpress
                    },
                    preferences: {
                        'AI Settings': aiSettings,
                        Publishing: publishing,
                        Notifications: notifications
                    }
                }),
            })

            if (!response.ok) {
                throw new Error('Failed to save settings')
            }

            console.log('✅ Settings saved successfully')
            
            toast.success('🎉 Setup Complete!', {
                description: 'All settings saved. Redirecting to dashboard...'
            })

            // Hide banner and redirect after short delay
            setTimeout(() => {
                setIsFirstTime(false)
                router.push(`/dashboard/${clientId}`)
            }, 1500)
            
        } catch (error) {
            console.error('Error saving settings:', error)
            toast.error('Failed to save settings', {
                description: 'Please try again or skip for now'
            })
        } finally {
            setSaving(false)
        }
    }

    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text)
        setCopied(field)
        toast.success('Copied to clipboard!')
        setTimeout(() => setCopied(null), 2000)
    }

    const maskSensitiveValue = (value: string) => {
        if (!value || value.length < 8) return value
        return value.substring(0, 8) + '•'.repeat(Math.min(value.length - 8, 20))
    }

    if (loading) {
        return (
            <div className="container mx-auto p-6">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading settings...</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header with Breadcrumb */}
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    {/* Breadcrumb */}
                    <div className="flex items-center text-sm text-gray-500 space-x-2">
                        <button
                            onClick={() => router.push(`/dashboard/${clientId}`)}
                            className="hover:text-gray-700 flex items-center"
                        >
                            <Home className="h-4 w-4 mr-1" />
                            Dashboard
                        </button>
                        <ChevronRight className="h-4 w-4" />
                        <span className="text-gray-900 font-medium">Settings</span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
                    <p className="text-gray-600">Configure your system preferences and integrations</p>
                </div>
                <Button onClick={() => router.push(`/dashboard/${clientId}`)} variant="outline">
                    <Home className="mr-2 h-4 w-4" />
                    Back to Dashboard
                </Button>
            </div>

            {/* First-Time Setup Banner */}
            {isFirstTime && (
                <Card className="border-blue-500 bg-blue-50">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center">
                                <Sparkles className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-blue-900">👋 Welcome! Complete Your Setup</CardTitle>
                                <CardDescription className="text-blue-700">
                                    Your workspace has been created successfully! Please review and save these settings to complete your setup.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 text-sm text-blue-800">
                            <p>✅ <strong>Step 1-4:</strong> Client information saved</p>
                            <p>✅ <strong>Step 5:</strong> Workspace created (base, tables, fields)</p>
                            <p>🔄 <strong>Final Step:</strong> Review settings below and click "Save All Settings"</p>
                        </div>
                        <div className="mt-4 flex gap-3">
                            <Button 
                                onClick={handleSaveAll}
                                className="bg-blue-600 hover:bg-blue-700"
                                disabled={saving}
                            >
                                {saving ? (
                                    <>
                                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Save All Settings
                                    </>
                                )}
                            </Button>
                            <Button 
                                onClick={() => {
                                    setIsFirstTime(false)
                                    router.push(`/dashboard/${clientId}`)
                                }}
                                variant="outline"
                            >
                                Skip for Now
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Settings Sections */}
            <div className="grid grid-cols-1 gap-6">
                {/* Webhook Integrations */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Webhook className="h-5 w-5 text-blue-600" />
                            <CardTitle>Webhook Integrations</CardTitle>
                        </div>
                        <CardDescription>
                            Configure webhook URLs for automated workflows
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="social_media_processor">Social Media Processor</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="social_media_processor"
                                    value={webhooks.social_media_processor}
                                    onChange={(e) => setWebhooks(prev => ({ ...prev, social_media_processor: e.target.value }))}
                                    placeholder="https://n8n.aiautomata.co.za/webhook/social-media-processor"
                                />
                                {webhooks.social_media_processor && (
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => copyToClipboard(webhooks.social_media_processor, 'social_media_processor')}
                                    >
                                        {copied === 'social_media_processor' ? (
                                            <Check className="h-4 w-4 text-green-600" />
                                        ) : (
                                            <Copy className="h-4 w-4" />
                                        )}
                                    </Button>
                                )}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="image_generator">Image Generator</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="image_generator"
                                    value={webhooks.image_generator}
                                    onChange={(e) => setWebhooks(prev => ({ ...prev, image_generator: e.target.value }))}
                                    placeholder="https://n8n.aiautomata.co.za/webhook/image-generator-webhook"
                                />
                                {webhooks.image_generator && (
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => copyToClipboard(webhooks.image_generator, 'image_generator')}
                                    >
                                        {copied === 'image_generator' ? (
                                            <Check className="h-4 w-4 text-green-600" />
                                        ) : (
                                            <Copy className="h-4 w-4" />
                                        )}
                                    </Button>
                                )}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="blog_processor">Blog Processor</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="blog_processor"
                                    value={webhooks.blog_processor}
                                    onChange={(e) => setWebhooks(prev => ({ ...prev, blog_processor: e.target.value }))}
                                    placeholder="https://n8n.aiautomata.co.za/webhook/blog-creation-mvp"
                                />
                                {webhooks.blog_processor && (
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => copyToClipboard(webhooks.blog_processor, 'blog_processor')}
                                    >
                                        {copied === 'blog_processor' ? (
                                            <Check className="h-4 w-4 text-green-600" />
                                        ) : (
                                            <Copy className="h-4 w-4" />
                                        )}
                                    </Button>
                                )}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email_processor">Email Processor</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="email_processor"
                                    value={webhooks.email_processor}
                                    onChange={(e) => setWebhooks(prev => ({ ...prev, email_processor: e.target.value }))}
                                    placeholder="https://n8n.aiautomata.co.za/webhook/email-processor"
                                />
                                {webhooks.email_processor && (
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => copyToClipboard(webhooks.email_processor, 'email_processor')}
                                    >
                                        {copied === 'email_processor' ? (
                                            <Check className="h-4 w-4 text-green-600" />
                                        ) : (
                                            <Copy className="h-4 w-4" />
                                        )}
                                    </Button>
                                )}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="uvp_creation">UVP Creation</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="uvp_creation"
                                    value={webhooks.uvp_creation}
                                    onChange={(e) => setWebhooks(prev => ({ ...prev, uvp_creation: e.target.value }))}
                                    placeholder="https://n8n.aiautomata.co.za/webhook/uvp_creation"
                                />
                                {webhooks.uvp_creation && (
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => copyToClipboard(webhooks.uvp_creation, 'uvp_creation')}
                                    >
                                        {copied === 'uvp_creation' ? (
                                            <Check className="h-4 w-4 text-green-600" />
                                        ) : (
                                            <Copy className="h-4 w-4" />
                                        )}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* API Integrations */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Plug className="h-5 w-5 text-purple-600" />
                            <CardTitle>API Integrations</CardTitle>
                        </div>
                        <CardDescription>
                            Configure third-party API keys (stored encrypted)
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="openai_api_key">OpenAI API Key</Label>
                            <Input
                                id="openai_api_key"
                                type="password"
                                value={integrations.openai_api_key}
                                onChange={(e) => setIntegrations(prev => ({ ...prev, openai_api_key: e.target.value }))}
                                placeholder="sk-..."
                            />
                            <p className="text-xs text-gray-500">Used for AI content generation</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="replicate_api_token">Replicate API Token</Label>
                            <Input
                                id="replicate_api_token"
                                type="password"
                                value={integrations.replicate_api_token}
                                onChange={(e) => setIntegrations(prev => ({ ...prev, replicate_api_token: e.target.value }))}
                                placeholder="r8_..."
                            />
                            <p className="text-xs text-gray-500">Used for image generation</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="anthropic_api_key">Anthropic API Key</Label>
                            <Input
                                id="anthropic_api_key"
                                type="password"
                                value={integrations.anthropic_api_key}
                                onChange={(e) => setIntegrations(prev => ({ ...prev, anthropic_api_key: e.target.value }))}
                                placeholder="sk-ant-..."
                            />
                            <p className="text-xs text-gray-500">Used for Claude AI models</p>
                        </div>
                    </CardContent>
                </Card>

                {/* WordPress Publishing */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Globe className="h-5 w-5 text-blue-600" />
                            <CardTitle>WordPress Publishing (MCP)</CardTitle>
                        </div>
                        <CardDescription>
                            Configure WordPress MCP integration for automated blog publishing
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Setup Instructions Banner */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                            <div className="flex items-start gap-3">
                                <FileDown className="h-5 w-5 text-blue-600 mt-0.5" />
                                <div className="flex-1 space-y-2">
                                    <h4 className="font-medium text-blue-900">WordPress MCP Plugin Required</h4>
                                    <p className="text-sm text-blue-700">
                                        Install the WordPress MCP plugin on your WordPress site to enable automated publishing.
                                    </p>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => window.open('https://github.com/Automattic/wordpress-mcp/releases/latest', '_blank')}
                                            className="text-blue-600 border-blue-300 hover:bg-blue-100"
                                        >
                                            <ExternalLink className="mr-2 h-4 w-4" />
                                            Download Plugin
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => window.open('/docs/wordpress-mcp-setup.md', '_blank')}
                                            className="text-blue-600 border-blue-300 hover:bg-blue-100"
                                        >
                                            <FileDown className="mr-2 h-4 w-4" />
                                            Setup Guide
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Enable/Disable Toggle */}
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="space-y-0.5">
                                <Label htmlFor="wordpress_enabled" className="text-base font-medium">Enable WordPress Publishing</Label>
                                <p className="text-sm text-gray-500">Allow publishing content directly to WordPress via MCP</p>
                            </div>
                            <Switch
                                id="wordpress_enabled"
                                checked={wordpress.publishing_enabled}
                                onCheckedChange={(checked) => setWordpress(prev => ({ ...prev, publishing_enabled: checked }))}
                            />
                        </div>

                        {/* WordPress Connection Settings */}
                        <div className="space-y-2">
                            <Label htmlFor="site_url">WordPress Site URL</Label>
                            <Input
                                id="site_url"
                                type="url"
                                value={wordpress.site_url}
                                onChange={(e) => setWordpress(prev => ({ ...prev, site_url: e.target.value }))}
                                placeholder="https://yourblog.com"
                            />
                            <p className="text-xs text-gray-500">The base URL of your WordPress site</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="wordpress_username">WordPress Username</Label>
                            <Input
                                id="wordpress_username"
                                value={wordpress.username}
                                onChange={(e) => setWordpress(prev => ({ ...prev, username: e.target.value }))}
                                placeholder="admin"
                            />
                            <p className="text-xs text-gray-500">Admin user who generated the JWT token</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="jwt_token">JWT Authentication Token</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="jwt_token"
                                    type="password"
                                    value={wordpress.jwt_token}
                                    onChange={(e) => setWordpress(prev => ({ ...prev, jwt_token: e.target.value }))}
                                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                                    className="flex-1"
                                />
                                {wordpress.jwt_token && (
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => copyToClipboard(wordpress.jwt_token, 'jwt_token')}
                                    >
                                        {copied === 'jwt_token' ? (
                                            <Check className="h-4 w-4 text-green-600" />
                                        ) : (
                                            <Copy className="h-4 w-4" />
                                        )}
                                    </Button>
                                )}
                            </div>
                            <p className="text-xs text-gray-500">
                                Generated from WordPress → Settings → WordPress MCP
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="token_expiration">Token Expiration Date</Label>
                            <Input
                                id="token_expiration"
                                type="datetime-local"
                                value={wordpress.token_expiration}
                                onChange={(e) => setWordpress(prev => ({ ...prev, token_expiration: e.target.value }))}
                            />
                            <p className="text-xs text-gray-500">When this token will expire (set when generating token)</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="mcp_endpoint">MCP Endpoint URL (Optional)</Label>
                            <Input
                                id="mcp_endpoint"
                                type="url"
                                value={wordpress.mcp_endpoint}
                                onChange={(e) => setWordpress(prev => ({ ...prev, mcp_endpoint: e.target.value }))}
                                placeholder="https://yourblog.com/wp-json/mcp/v1"
                            />
                            <p className="text-xs text-gray-500">
                                Leave empty to auto-generate from site URL
                            </p>
                        </div>

                        {/* Connection Status */}
                        {wordpress.site_url && wordpress.jwt_token && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                                <Check className="h-4 w-4 text-green-600" />
                                <span className="text-sm text-green-700 font-medium">WordPress connection configured</span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* AI Preferences */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-yellow-600" />
                            <CardTitle>AI Preferences</CardTitle>
                        </div>
                        <CardDescription>
                            Configure AI behavior and content generation settings
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="default_model">Default AI Model</Label>
                                <select
                                    id="default_model"
                                    value={aiSettings.default_model}
                                    onChange={(e) => setAiSettings(prev => ({ ...prev, default_model: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                >
                                    <option value="gpt-4">GPT-4</option>
                                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                                    <option value="claude-3-opus">Claude 3 Opus</option>
                                    <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="temperature">Temperature (Creativity)</Label>
                                <Input
                                    id="temperature"
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="2"
                                    value={aiSettings.temperature}
                                    onChange={(e) => setAiSettings(prev => ({ ...prev, temperature: e.target.value }))}
                                />
                                <p className="text-xs text-gray-500">0 = Focused, 2 = Creative</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="max_tokens">Max Response Length</Label>
                                <Input
                                    id="max_tokens"
                                    type="number"
                                    value={aiSettings.max_tokens}
                                    onChange={(e) => setAiSettings(prev => ({ ...prev, max_tokens: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="content_tone">Content Tone</Label>
                                <select
                                    id="content_tone"
                                    value={aiSettings.content_tone}
                                    onChange={(e) => setAiSettings(prev => ({ ...prev, content_tone: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                >
                                    <option value="professional">Professional</option>
                                    <option value="casual">Casual</option>
                                    <option value="friendly">Friendly</option>
                                    <option value="authoritative">Authoritative</option>
                                    <option value="playful">Playful</option>
                                </select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Publishing Settings */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-green-600" />
                            <CardTitle>Publishing Settings</CardTitle>
                        </div>
                        <CardDescription>
                            Configure content publishing and scheduling preferences
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="auto_publish">Auto-Publish Approved Content</Label>
                                <p className="text-xs text-gray-500">Automatically publish content when approved</p>
                            </div>
                            <Switch
                                id="auto_publish"
                                checked={publishing.auto_publish_enabled}
                                onCheckedChange={(checked) => setPublishing(prev => ({ ...prev, auto_publish_enabled: checked }))}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="require_approval">Require Content Approval</Label>
                                <p className="text-xs text-gray-500">All content needs approval before publishing</p>
                            </div>
                            <Switch
                                id="require_approval"
                                checked={publishing.require_approval}
                                onCheckedChange={(checked) => setPublishing(prev => ({ ...prev, require_approval: checked }))}
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="default_publish_time">Default Publish Time</Label>
                                <Input
                                    id="default_publish_time"
                                    type="time"
                                    value={publishing.default_publish_time}
                                    onChange={(e) => setPublishing(prev => ({ ...prev, default_publish_time: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="timezone">Timezone</Label>
                                <select
                                    id="timezone"
                                    value={publishing.timezone}
                                    onChange={(e) => setPublishing(prev => ({ ...prev, timezone: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                >
                                    <option value="UTC">UTC</option>
                                    <option value="America/New_York">Eastern Time</option>
                                    <option value="America/Chicago">Central Time</option>
                                    <option value="America/Los_Angeles">Pacific Time</option>
                                    <option value="Europe/London">London</option>
                                    <option value="Africa/Johannesburg">South Africa</option>
                                </select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Notifications */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Bell className="h-5 w-5 text-orange-600" />
                            <CardTitle>Notifications</CardTitle>
                        </div>
                        <CardDescription>
                            Configure notification preferences and alerts
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email_alerts">Email for Alerts</Label>
                            <Input
                                id="email_alerts"
                                type="email"
                                value={notifications.email_alerts}
                                onChange={(e) => setNotifications(prev => ({ ...prev, email_alerts: e.target.value }))}
                                placeholder="alerts@example.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="slack_webhook">Slack Webhook URL</Label>
                            <Input
                                id="slack_webhook"
                                value={notifications.slack_webhook}
                                onChange={(e) => setNotifications(prev => ({ ...prev, slack_webhook: e.target.value }))}
                                placeholder="https://hooks.slack.com/..."
                            />
                            <p className="text-xs text-gray-500">Receive notifications in Slack</p>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="enable_digest">Enable Daily Digest</Label>
                                <p className="text-xs text-gray-500">Receive summary of daily activities</p>
                            </div>
                            <Switch
                                id="enable_digest"
                                checked={notifications.enable_digest}
                                onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, enable_digest: checked }))}
                            />
                        </div>
                        {notifications.enable_digest && (
                            <div className="space-y-2">
                                <Label htmlFor="digest_schedule">Digest Schedule</Label>
                                <select
                                    id="digest_schedule"
                                    value={notifications.digest_schedule}
                                    onChange={(e) => setNotifications(prev => ({ ...prev, digest_schedule: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                >
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                </select>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Save Button */}
                <div className="flex justify-end gap-3 sticky bottom-6">
                    <Button
                        variant="outline"
                        onClick={() => router.push(`/dashboard/${clientId}`)}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        {saving ? (
                            <>
                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Save All Settings
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    )
}
