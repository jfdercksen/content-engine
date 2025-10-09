'use client'

import { useParams, useRouter } from 'next/navigation'
import ClientHeader from '@/components/layout/ClientHeader'
import ClientOnly from '@/components/ClientOnly'
import { Card, CardContent } from '@/components/ui/card'
import { FileText, Image, Video, Mail, Lightbulb, ArrowRight, Palette, Settings, Sparkles } from 'lucide-react'
import { useClientConfig } from '@/hooks/useClientConfig'

export default function DashboardPage() {
    const params = useParams()
    const router = useRouter()
    const clientId = params.clientId as string
    const { clientConfig, isLoading, error } = useClientConfig(clientId)

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
            id: 'video-content',
            title: 'Video Ideas',
            description: 'Plan video content strategy',
            icon: Video,
            color: 'bg-red-500',
            available: false,
            route: `/dashboard/${clientId}/video-content`
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
            available: false,
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
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
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
            <div className="container mx-auto py-6 space-y-6">
                {/* Client Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 
                            className="text-3xl font-bold mb-2" 
                            style={{ color: clientConfig.branding.primaryColor }}
                        >
                            Content Engine Dashboard
                        </h1>
                        <p className="text-muted-foreground">
                            Choose a content type to get started with {clientConfig.name}
                        </p>
                    </div>
                </div>

                {/* Content Type Selection */}
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-gray-900">Content Types</h2>
                    <p className="text-gray-600">Create and manage different types of content for your brand</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {contentTypes.map((type) => (
                            <Card 
                                key={type.id}
                                className={`cursor-pointer transition-all hover:shadow-lg ${
                                    type.available 
                                        ? 'hover:scale-105 border-2 hover:border-blue-200' 
                                        : 'opacity-60 cursor-not-allowed'
                                }`}
                                onClick={() => handleContentTypeSelect(type)}
                            >
                                <CardContent className="p-6 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className={`w-12 h-12 ${type.color} rounded-lg flex items-center justify-center`}>
                                            <type.icon className="h-6 w-6 text-white" />
                                        </div>
                                        {type.available && (
                                            <ArrowRight className="h-5 w-5 text-gray-400" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 text-lg">{type.title}</h3>
                                        <p className="text-sm text-gray-500 mt-1">{type.description}</p>
                                        {!type.available && (
                                            <p className="text-xs text-gray-400 mt-2 font-medium">Coming Soon</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Management Tools */}
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-gray-900">Management Tools</h2>
                    <p className="text-gray-600">Manage your brand assets and system configuration</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {managementTools.map((tool) => (
                            <Card 
                                key={tool.id}
                                className={`cursor-pointer transition-all hover:shadow-lg ${
                                    tool.available 
                                        ? 'hover:scale-105 border-2 hover:border-indigo-200' 
                                        : 'opacity-60 cursor-not-allowed'
                                }`}
                                onClick={() => handleManagementToolSelect(tool)}
                            >
                                <CardContent className="p-6 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className={`w-12 h-12 ${tool.color} rounded-lg flex items-center justify-center`}>
                                            <tool.icon className="h-6 w-6 text-white" />
                                        </div>
                                        {tool.available && (
                                            <ArrowRight className="h-5 w-5 text-gray-400" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 text-lg">{tool.title}</h3>
                                        <p className="text-sm text-gray-500 mt-1">{tool.description}</p>
                                        {!tool.available && (
                                            <p className="text-xs text-gray-400 mt-2 font-medium">Coming Soon</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="mt-12 bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Overview</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                        <div>
                            <div className="text-2xl font-bold text-blue-600">3</div>
                            <div className="text-sm text-gray-600">Active Content Types</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-indigo-600">2</div>
                            <div className="text-sm text-gray-600">Management Tools</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-green-600">2</div>
                            <div className="text-sm text-gray-600">Coming Soon</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-purple-600">∞</div>
                            <div className="text-sm text-gray-600">Possibilities</div>
                        </div>
                    </div>
                </div>
            </div>
        </ClientOnly>
    )
}