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
    FileDown,
    Building2,
    Mail
} from 'lucide-react'
import { toast } from 'sonner'

interface SettingsData {
    settings: {
        webhooks?: Record<string, string>
        integrations?: Record<string, string>
        mailchimp?: Record<string, string>
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
    
    // Client Information
    const [clientInfo, setClientInfo] = useState({
        industry: '',
        companySize: '',
        accountManager: '',
        monthlyBudget: ''
    })

    const [webhooks, setWebhooks] = useState({
        social_media_processor: '',
        image_generator: '',
        blog_processor: '',
        email_processor: '',
        mailchimp: '',
        uvp_creation: '',
        wordpress_publisher: ''
    })

    const [integrations, setIntegrations] = useState({
        openai_api_key: '',
        replicate_api_token: '',
        anthropic_api_key: ''
    })

    const [mailchimp, setMailchimp] = useState({
        api_key: '',
        server_url: '',
        server_prefix: '',
        default_audience_id: '',
        default_from_name: '',
        default_from_email: '',
        default_reply_to_email: ''
    })

    const [wordpress, setWordpress] = useState({
        site_url: '',
        app_password: '',
        username: '',
        publishing_enabled: false
    })

    const [aiSettings, setAiSettings] = useState({
        default_model: 'gpt-4',
        temperature: '0.7',
        max_tokens: '2000',
        content_tone: 'professional',
        preferred_content_types: ''
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
            mailchimp: 'https://n8n.aiautomata.co.za/webhook/mailchimp',
            uvp_creation: 'https://n8n.aiautomata.co.za/webhook/uvp_creation',
            wordpress_publisher: 'https://n8n.aiautomata.co.za/webhook/blog_post'
        })

        setAiSettings({
            default_model: 'gpt-4',
            temperature: '0.7',
            max_tokens: '2000',
            content_tone: 'Professional',
            preferred_content_types: 'Blog Posts, Social Media, Email Marketing'
        })

        setPublishing({
            auto_publish: false,
            default_time: '09:00',
            timezone: 'UTC',
            require_approval: true
        })

        // Client info left empty - user can fill in
        setClientInfo({
            industry: '',
            companySize: '',
            accountManager: '',
            monthlyBudget: ''
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

            // Populate Mailchimp settings
            if (data.settings?.mailchimp) {
                setMailchimp(prev => ({ ...prev, ...data.settings.mailchimp }))
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
                        Mailchimp: mailchimp,
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
            
            // Save client information to Client Information table (3232)
            if (clientInfo.industry || clientInfo.companySize || clientInfo.accountManager || clientInfo.monthlyBudget) {
                console.log('📋 Updating client information...')
                const clientInfoResponse = await fetch(`/api/admin/clients/${clientId}/update-info`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        step: 6, // Post-onboarding
                        data: {
                            industry: clientInfo.industry,
                            companySize: clientInfo.companySize,
                            accountManager: clientInfo.accountManager,
                            monthlyBudget: clientInfo.monthlyBudget ? parseInt(clientInfo.monthlyBudget) : null
                        }
                    })
                })

                if (!clientInfoResponse.ok) {
                    console.error('⚠️ Failed to save client information, continuing with settings...')
                } else {
                    console.log('✅ Client information updated')
                }
            }
            
            // Save settings and preferences to tables 1061 & 1062
            const response = await fetch(`/api/settings/${clientId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    settings: {
                        Webhooks: webhooks,
                        Integrations: integrations,
                        Mailchimp: mailchimp,
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

            console.log('✅ Settings and preferences saved successfully')
            
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
                {/* Client Information */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-indigo-600" />
                            <CardTitle>Client Information</CardTitle>
                        </div>
                        <CardDescription>
                            Company details and business information
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="industry">Industry</Label>
                                <select
                                    id="industry"
                                    value={clientInfo.industry}
                                    onChange={(e) => setClientInfo(prev => ({ ...prev, industry: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select Industry</option>
                                    <option value="Automotive">Automotive</option>
                                    <option value="Software/SaaS">Software/SaaS</option>
                                    <option value="Professional Services">Professional Services</option>
                                    <option value="Manufacturing">Manufacturing</option>
                                    <option value="Healthcare">Healthcare</option>
                                    <option value="Financial Services">Financial Services</option>
                                    <option value="E-commerce/Retail">E-commerce/Retail</option>
                                    <option value="Real Estate">Real Estate</option>
                                    <option value="Education">Education</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="companySize">Company Size</Label>
                                <select
                                    id="companySize"
                                    value={clientInfo.companySize}
                                    onChange={(e) => setClientInfo(prev => ({ ...prev, companySize: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select Company Size</option>
                                    <option value="1-10 employees">1-10 employees</option>
                                    <option value="11-50 employees">11-50 employees</option>
                                    <option value="51-200 employees">51-200 employees</option>
                                    <option value="201-500 employees">201-500 employees</option>
                                    <option value="501+ employees">501+ employees</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="accountManager">Account Manager</Label>
                                <Input
                                    id="accountManager"
                                    value={clientInfo.accountManager}
                                    onChange={(e) => setClientInfo(prev => ({ ...prev, accountManager: e.target.value }))}
                                    placeholder="John Smith"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="monthlyBudget">Monthly Budget (USD)</Label>
                                <Input
                                    id="monthlyBudget"
                                    type="number"
                                    value={clientInfo.monthlyBudget}
                                    onChange={(e) => setClientInfo(prev => ({ ...prev, monthlyBudget: e.target.value }))}
                                    placeholder="5000"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

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
                            <Label htmlFor="mailchimp">Mailchimp</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="mailchimp"
                                    value={webhooks.mailchimp}
                                    onChange={(e) => setWebhooks(prev => ({ ...prev, mailchimp: e.target.value }))}
                                    placeholder="https://n8n.aiautomata.co.za/webhook/mailchimp"
                                />
                                {webhooks.mailchimp && (
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => copyToClipboard(webhooks.mailchimp, 'mailchimp')}
                                    >
                                        {copied === 'mailchimp' ? (
                                            <Check className="h-4 w-4 text-green-600" />
                                        ) : (
                                            <Copy className="h-4 w-4" />
                                        )}
                                    </Button>
                                )}
                            </div>
                            <p className="text-xs text-gray-500">Webhook for creating draft emails in Mailchimp</p>
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
                        <div className="space-y-2">
                            <Label htmlFor="wordpress_publisher">WordPress Publisher</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="wordpress_publisher"
                                    value={webhooks.wordpress_publisher}
                                    onChange={(e) => setWebhooks(prev => ({ ...prev, wordpress_publisher: e.target.value }))}
                                    placeholder="https://n8n.aiautomata.co.za/webhook/blog_post"
                                />
                                {webhooks.wordpress_publisher && (
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => copyToClipboard(webhooks.wordpress_publisher, 'wordpress_publisher')}
                                    >
                                        {copied === 'wordpress_publisher' ? (
                                            <Check className="h-4 w-4 text-green-600" />
                                        ) : (
                                            <Copy className="h-4 w-4" />
                                        )}
                                    </Button>
                                )}
                            </div>
                            <p className="text-xs text-gray-500">Webhook for publishing approved blogs to WordPress</p>
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

                {/* Mailchimp Integration */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Mail className="h-5 w-5 text-orange-600" />
                            <CardTitle>Mailchimp Integration</CardTitle>
                        </div>
                        <CardDescription>
                            Configure Mailchimp API credentials for email campaign creation
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Setup Instructions Banner */}
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-3">
                            <div className="flex items-start gap-3">
                                <Mail className="h-5 w-5 text-orange-600 mt-0.5" />
                                <div className="flex-1 space-y-2">
                                    <h4 className="font-medium text-orange-900">How to Get Your Mailchimp API Key</h4>
                                    <ol className="text-sm text-orange-700 space-y-1 list-decimal list-inside">
                                        <li>Log into your Mailchimp account</li>
                                        <li>Go to: <strong>Account → Extras → API keys</strong></li>
                                        <li>Click <strong>"Create A Key"</strong></li>
                                        <li>Copy the API key (format: xxxxxxxx-us1, xxxxxxxx-us2, etc.)</li>
                                        <li>Paste it in the field below</li>
                                        <li>The server prefix (us1, us2, etc.) will be extracted automatically</li>
                                    </ol>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="mailchimp_api_key">Mailchimp API Key</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="mailchimp_api_key"
                                    type="password"
                                    value={mailchimp.api_key}
                                    onChange={(e) => {
                                        const apiKey = e.target.value
                                        setMailchimp(prev => {
                                            // Extract server prefix from API key (format: xxxxxxxx-us1)
                                            const prefixMatch = apiKey.match(/-([a-z0-9]+)$/)
                                            const serverPrefix = prefixMatch ? prefixMatch[1] : prev.server_prefix
                                            const serverUrl = serverPrefix ? `https://${serverPrefix}.api.mailchimp.com/3.0` : prev.server_url
                                            
                                            return {
                                                ...prev,
                                                api_key: apiKey,
                                                server_prefix: serverPrefix,
                                                server_url: serverUrl
                                            }
                                        })
                                    }}
                                    placeholder="xxxxxxxx-us1"
                                />
                                {mailchimp.api_key && (
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => copyToClipboard(mailchimp.api_key, 'mailchimp_api_key')}
                                    >
                                        {copied === 'mailchimp_api_key' ? (
                                            <Check className="h-4 w-4 text-green-600" />
                                        ) : (
                                            <Copy className="h-4 w-4" />
                                        )}
                                    </Button>
                                )}
                            </div>
                            <p className="text-xs text-gray-500">
                                Your Mailchimp API key (format: xxxxxxxx-us1). The server prefix will be extracted automatically.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="mailchimp_server_url">Mailchimp Server URL</Label>
                            <Input
                                id="mailchimp_server_url"
                                type="url"
                                value={mailchimp.server_url}
                                onChange={(e) => setMailchimp(prev => ({ ...prev, server_url: e.target.value }))}
                                placeholder="https://us1.api.mailchimp.com/3.0"
                            />
                            <p className="text-xs text-gray-500">
                                Mailchimp API server URL (auto-filled from API key, or enter manually)
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="mailchimp_server_prefix">Server Prefix</Label>
                            <Input
                                id="mailchimp_server_prefix"
                                value={mailchimp.server_prefix}
                                onChange={(e) => {
                                    const prefix = e.target.value
                                    setMailchimp(prev => ({
                                        ...prev,
                                        server_prefix: prefix,
                                        server_url: prefix ? `https://${prefix}.api.mailchimp.com/3.0` : prev.server_url
                                    }))
                                }}
                                placeholder="us1"
                            />
                            <p className="text-xs text-gray-500">
                                Mailchimp server prefix (us1, us2, etc.) - extracted from API key automatically
                            </p>
                        </div>

                        <div className="border-t pt-4 space-y-4">
                            <h4 className="font-medium text-gray-900">Default Email Settings</h4>
                            <p className="text-sm text-gray-500">These will be used as defaults when creating email campaigns</p>
                            
                            <div className="space-y-2">
                                <Label htmlFor="mailchimp_default_audience_id">Default Audience/List ID</Label>
                                <Input
                                    id="mailchimp_default_audience_id"
                                    value={mailchimp.default_audience_id}
                                    onChange={(e) => setMailchimp(prev => ({ ...prev, default_audience_id: e.target.value }))}
                                    placeholder="abc123def456"
                                />
                                <p className="text-xs text-gray-500">
                                    Default Mailchimp audience/list ID to send emails to
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="mailchimp_default_from_name">Default From Name</Label>
                                <Input
                                    id="mailchimp_default_from_name"
                                    value={mailchimp.default_from_name}
                                    onChange={(e) => setMailchimp(prev => ({ ...prev, default_from_name: e.target.value }))}
                                    placeholder="John from Company"
                                />
                                <p className="text-xs text-gray-500">
                                    Default sender display name for email campaigns
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="mailchimp_default_from_email">Default From Email</Label>
                                <Input
                                    id="mailchimp_default_from_email"
                                    type="email"
                                    value={mailchimp.default_from_email}
                                    onChange={(e) => setMailchimp(prev => ({ ...prev, default_from_email: e.target.value }))}
                                    placeholder="noreply@example.com"
                                />
                                <p className="text-xs text-gray-500">
                                    Default sender email address (must be verified in Mailchimp)
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="mailchimp_default_reply_to_email">Default Reply-To Email</Label>
                                <Input
                                    id="mailchimp_default_reply_to_email"
                                    type="email"
                                    value={mailchimp.default_reply_to_email}
                                    onChange={(e) => setMailchimp(prev => ({ ...prev, default_reply_to_email: e.target.value }))}
                                    placeholder="support@example.com"
                                />
                                <p className="text-xs text-gray-500">
                                    Default reply-to email address (optional, defaults to from email if empty)
                                </p>
                            </div>
                        </div>

                        {/* Connection Status */}
                        {mailchimp.api_key && mailchimp.server_url && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                                <Check className="h-4 w-4 text-green-600" />
                                <span className="text-sm text-green-700 font-medium">Mailchimp integration configured</span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* WordPress Publishing */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Globe className="h-5 w-5 text-blue-600" />
                            <CardTitle>WordPress Publishing</CardTitle>
                        </div>
                        <CardDescription>
                            Configure WordPress connection for automated blog publishing via REST API
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Setup Instructions Banner */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                            <div className="flex items-start gap-3">
                                <FileDown className="h-5 w-5 text-blue-600 mt-0.5" />
                                <div className="flex-1 space-y-2">
                                    <h4 className="font-medium text-blue-900">How to Generate Application Password</h4>
                                    <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                                        <li>Log into your WordPress site as an admin</li>
                                        <li>Go to: <strong>Users → Your Profile</strong></li>
                                        <li>Scroll to <strong>"Application Passwords"</strong> section</li>
                                        <li>Enter a name: <strong>"Content Engine"</strong></li>
                                        <li>Click <strong>"Add New Application Password"</strong></li>
                                        <li>Copy the password (shown only once!)</li>
                                        <li>Paste it in the field below</li>
                                    </ol>
                                    <div className="flex gap-2 mt-3">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => window.open('/WORDPRESS_APP_PASSWORD_SETUP.md', '_blank')}
                                            className="text-blue-600 border-blue-300 hover:bg-blue-100"
                                        >
                                            <FileDown className="mr-2 h-4 w-4" />
                                            Complete Setup Guide
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Enable/Disable Toggle */}
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="space-y-0.5">
                                <Label htmlFor="wordpress_enabled" className="text-base font-medium">Enable WordPress Publishing</Label>
                                <p className="text-sm text-gray-500">Allow publishing content directly to WordPress via REST API</p>
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
                            <p className="text-xs text-gray-500">WordPress admin username</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="app_password">Application Password</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="app_password"
                                    type="password"
                                    value={wordpress.app_password}
                                    onChange={(e) => setWordpress(prev => ({ ...prev, app_password: e.target.value }))}
                                    placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
                                    className="flex-1"
                                />
                                {wordpress.app_password && (
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => copyToClipboard(wordpress.app_password, 'app_password')}
                                    >
                                        {copied === 'app_password' ? (
                                            <Check className="h-4 w-4 text-green-600" />
                                        ) : (
                                            <Copy className="h-4 w-4" />
                                        )}
                                    </Button>
                                )}
                            </div>
                            <p className="text-xs text-gray-500">
                                Generate in WordPress: Users → Your Profile → Application Passwords
                            </p>
                        </div>

                        {/* Connection Status */}
                        {wordpress.site_url && wordpress.app_password && wordpress.username && (
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
                                    <option value="Professional">Professional</option>
                                    <option value="Casual">Casual</option>
                                    <option value="Friendly">Friendly</option>
                                    <option value="Authoritative">Authoritative</option>
                                    <option value="Playful">Playful</option>
                                </select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="preferred_content_types">Preferred Content Types</Label>
                            <Input
                                id="preferred_content_types"
                                value={aiSettings.preferred_content_types}
                                onChange={(e) => setAiSettings(prev => ({ ...prev, preferred_content_types: e.target.value }))}
                                placeholder="Blog Posts, Social Media, Email Marketing, Video Scripts"
                            />
                            <p className="text-xs text-gray-500">Comma-separated list of content types you create</p>
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
