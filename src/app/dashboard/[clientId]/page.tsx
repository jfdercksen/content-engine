'use client'

import { useParams, useRouter } from 'next/navigation'
import ClientOnly from '@/components/ClientOnly'
import { Card, CardContent } from '@/components/ui/card'
import {
    FileText,
    Image,
    Video,
    Mail,
    Lightbulb,
    ArrowRight,
    Palette,
    Settings,
    Sparkles,
    Loader2
} from 'lucide-react'
import { useClientConfig } from '@/hooks/useClientConfig'
import CalendarView from './calendar/CalendarView'

export default function DashboardPage() {
    const params = useParams()
    const router = useRouter()
    const clientId = params.clientId as string
    const { clientConfig, isLoading, error } = useClientConfig(clientId)

    // Finalization is now handled by the onboarding form on Step 5
    // No longer needed on dashboard mount

    const contentTypes = [
        {
            id: 'social-media',
            title: 'Social Media Ideas',
            description: 'Create engaging social media content',
            icon: Image,
            color: 'bg-blue-500',
            available: true,
            route: `/dashboard/${clientId}/social-media`
        },
        {
            id: 'blog-posts',
            title: 'Blog Posts',
            description: 'AI-powered blog content with keyword research',
            icon: FileText,
            color: 'bg-green-500',
            available: true,
            route: `/dashboard/${clientId}/blog-posts`
        },
        {
            id: 'email-ideas',
            title: 'Email Ideas',
            description: 'Create and manage email marketing campaigns',
            icon: Mail,
            color: 'bg-purple-500',
            available: true,
            route: `/dashboard/${clientId}/email-ideas`
        },
        {
            id: 'image-ideas',
            title: 'Image Ideas',
            description: 'Generate, combine, and manage image content',
            icon: Sparkles,
            color: 'bg-pink-500',
            available: true,
            route: `/dashboard/${clientId}/image-ideas`
        },
        {
            id: 'video-ideas',
            title: 'Video Ideas',
            description: 'Generate and manage AI-powered videos',
            icon: Video,
            color: 'bg-purple-500',
            available: true,
            route: `/dashboard/${clientId}/videos`
        },
        {
            id: 'product-uvp',
            title: 'Product UVPs',
            description: 'Define unique value propositions for your products',
            icon: Lightbulb,
            color: 'bg-yellow-500',
            available: true,
            route: `/dashboard/${clientId}/product-uvps`
        }
    ]

    const managementTools = [
        {
            id: 'brand-assets',
            title: 'Brand Assets',
            description: 'Manage brand guidelines, logos, and visual resources',
            icon: Palette,
            color: 'bg-indigo-500',
            available: true,
            route: `/dashboard/${clientId}/brand-assets`
        },
        {
            id: 'templates',
            title: 'Templates',
            description: 'Manage email and content templates',
            icon: FileText,
            color: 'bg-green-500',
            available: true,
            route: `/dashboard/${clientId}/templates`
        },
        {
            id: 'settings',
            title: 'Settings',
            description: 'Configure system preferences and integrations',
            icon: Settings,
            color: 'bg-gray-500',
            available: true,
            route: `/dashboard/${clientId}/settings`
        }
    ]

    const handleContentTypeSelect = (contentType: any) => {
        if (contentType.available) {
            console.log('Navigating to:', contentType.route)
            router.push(contentType.route)
        } else {
            alert('This content type is coming soon!')
        }
    }

    const handleManagementToolSelect = (tool: any) => {
        if (tool.available) {
            console.log('Navigating to:', tool.route)
            router.push(tool.route)
        } else {
            alert('This management tool is coming soon!')
        }
    }

    if (isLoading) {
        return (
            <div className="container mx-auto p-6">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
                        <p className="mt-4 text-gray-600">Loading client configuration...</p>
                    </div>
                </div>
            </div>
        )
    }

    if (error || !clientConfig) {
        return (
            <div className="container mx-auto p-6">
                <div className="text-center py-12">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Client Not Found</h1>
                    <p className="text-gray-600 mb-6">
                        {error || `The client "${clientId}" could not be found.`}
                    </p>
                    <button 
                        onClick={() => router.push('/admin/clients')}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                    >
                        Back to Client Management
                    </button>
                </div>
            </div>
        )
    }

    return (
        <ClientOnly fallback={
            <div className="container mx-auto py-6">
                <div className="animate-pulse space-y-6">
                    <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-48 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        }>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
                    <div>
                        <h1
                            className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2"
                            style={{ color: clientConfig.branding.primaryColor }}
                        >
                            Content Engine Dashboard
                        </h1>
                        <p className="text-sm sm:text-base text-muted-foreground">
                            Plan and launch content for {clientConfig.name}
                        </p>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-6 items-stretch lg:min-h-[80vh]">
                    {/* Calendar hero */}
                    <div className="w-full lg:flex-[2] min-w-0 flex min-h-[calc(100vh-220px)]">
                        <div className="h-full w-full">
                            <CalendarView clientId={clientId} embedded />
                        </div>
                    </div>

                    {/* Actions sidebar */}
                    <div className="w-full lg:flex-1 min-w-0 flex min-h-[calc(100vh-220px)]">
                        <Card className="w-full h-full min-h-full border-gray-200 shadow-sm flex flex-col overflow-hidden">
                            <CardContent className="p-4 sm:p-6 space-y-6 h-full flex flex-col flex-1 overflow-y-auto">
                            <div className="space-y-2">
                                <h2 className="text-base sm:text-lg font-semibold text-gray-900">Content Types</h2>
                                <p className="text-sm text-gray-600">Jump into creation flows.</p>
                                <div className="space-y-2 w-full">
                                    {contentTypes.map((type) => (
                                        <button
                                            key={type.id}
                                            onClick={() => handleContentTypeSelect(type)}
                                            className={`w-full rounded-lg border bg-white px-3 py-3 text-left transition hover:border-blue-200 hover:bg-blue-50 active:scale-[0.99] ${
                                                type.available ? '' : 'opacity-60 cursor-not-allowed'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3 w-full">
                                                <span className={`w-9 h-9 ${type.color} rounded-md inline-flex items-center justify-center shrink-0`}>
                                                    <type.icon className="h-4 w-4 text-white" />
                                                </span>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-semibold text-gray-900">{type.title}</div>
                                                    <div className="text-xs text-gray-500 line-clamp-2">{type.description}</div>
                                                </div>
                                                {type.available && <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0" />}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h2 className="text-base sm:text-lg font-semibold text-gray-900">Management Tools</h2>
                                <p className="text-sm text-gray-600">Configure assets & settings.</p>
                                <div className="space-y-2 w-full">
                                    {managementTools.map((tool) => (
                                        <button
                                            key={tool.id}
                                            onClick={() => handleManagementToolSelect(tool)}
                                            className={`w-full rounded-lg border bg-white px-3 py-3 text-left transition hover:border-indigo-200 hover:bg-indigo-50 active:scale-[0.99] ${
                                                tool.available ? '' : 'opacity-60 cursor-not-allowed'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3 w-full">
                                                <span className={`w-9 h-9 ${tool.color} rounded-md inline-flex items-center justify-center shrink-0`}>
                                                    <tool.icon className="h-4 w-4 text-white" />
                                                </span>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-semibold text-gray-900">{tool.title}</div>
                                                    <div className="text-xs text-gray-500 line-clamp-2">{tool.description}</div>
                                                </div>
                                                {tool.available && <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0" />}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3 rounded-lg border bg-gray-50 p-4">
                                <h3 className="text-sm font-semibold text-gray-900">Quick Overview</h3>
                                <div className="grid grid-cols-2 gap-3 text-center">
                                    <div>
                                        <div className="text-lg font-bold text-blue-600">3</div>
                                        <div className="text-[11px] text-gray-600 mt-1">Active Types</div>
                                    </div>
                                    <div>
                                        <div className="text-lg font-bold text-indigo-600">2</div>
                                        <div className="text-[11px] text-gray-600 mt-1">Tools</div>
                                    </div>
                                    <div>
                                        <div className="text-lg font-bold text-green-600">2</div>
                                        <div className="text-[11px] text-gray-600 mt-1">Coming Soon</div>
                                    </div>
                                    <div>
                                        <div className="text-lg font-bold text-purple-600">∞</div>
                                        <div className="text-[11px] text-gray-600 mt-1">Ideas</div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </ClientOnly>
    )
}