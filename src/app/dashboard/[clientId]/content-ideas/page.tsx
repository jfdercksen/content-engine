'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useClientConfig } from '@/hooks/useClientConfig'
import ContentIdeaForm from '@/components/forms/ContentIdeaForm'
import ClientHeader from '@/components/layout/ClientHeader'
import StatsCards from '@/components/dashboard/StatsCards'
import ContentIdeasTable from '@/components/tables/ContentIdeasTable'
import SocialMediaContentTable from '@/components/tables/SocialMediaContentTable'
import BrandAssetsTable from '@/components/tables/BrandAssetsTable'
import ClientOnly from '@/components/ClientOnly'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Image, Video, Mail, Lightbulb, ArrowLeft, MessageSquare, Palette, TrendingUp } from 'lucide-react'

export default function ContentIdeasPage() {
    const params = useParams()
    const router = useRouter()
    const clientId = params.clientId as string
    const [contentIdeas, setContentIdeas] = useState<any[]>([])
    const [socialMediaContent, setSocialMediaContent] = useState<any[]>([])
    const [brandAssets, setBrandAssets] = useState<any[]>([])
    const [showForm, setShowForm] = useState(false)
    const [selectedContentType, setSelectedContentType] = useState<string | null>(null)
    // Remove unused state variables
    const [isLoading, setIsLoading] = useState(true)
    const [isLoadingRelated, setIsLoadingRelated] = useState(false)
    // Add new state for social media content modal
    const [showSocialMediaModal, setShowSocialMediaModal] = useState(false)
    const [selectedIdeaForSocialMedia, setSelectedIdeaForSocialMedia] = useState<any>(null)
    const [socialMediaContentForIdea, setSocialMediaContentForIdea] = useState<any[]>([])
    const [isLoadingSocialMedia, setIsLoadingSocialMedia] = useState(false)
    const { clientConfig, isLoading: configLoading, error: configError } = useClientConfig(clientId)

    useEffect(() => {
        fetchContentIdeas()
        fetchSocialMediaContent()
        fetchBrandAssets()
    }, [clientId])

    const fetchContentIdeas = async () => {
        try {
            setIsLoading(true)
            const response = await fetch(`/api/baserow/${clientId}/content-ideas`)
            const data = await response.json()
            
            // Enhance content ideas with related data counts
            const enhancedIdeas = await Promise.all(
                (data.results || []).map(async (idea: any) => {
                    try {
                        // Fetch social media content count for this idea
                        const socialResponse = await fetch(`/api/baserow/${clientId}/content-ideas/${idea.id}/social-media-content`)
                        const socialData = await socialResponse.json()
                        const socialCount = socialData.results?.length || 0
                        
                        // For now, we'll simulate brand assets count and generation status
                        // In a real implementation, this would come from the API
                        return {
                            ...idea,
                            socialMediaContentCount: socialCount,
                            brandAssetsCount: 0, // Will be updated from API later
                            generationStatus: socialCount > 0 ? 'completed' : 'none',
                            lastGenerated: socialCount > 0 ? '2025-08-11T14:31:04.291567Z' : undefined // Use static date to prevent hydration mismatch
                        }
                    } catch (error) {
                        console.error('Error fetching related data for idea:', idea.id, error)
                        return {
                            ...idea,
                            socialMediaContentCount: 0,
                            brandAssetsCount: 0,
                            generationStatus: 'none'
                        }
                    }
                })
            )
            
            setContentIdeas(enhancedIdeas)
        } catch (error) {
            console.error('Error fetching content ideas:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const fetchSocialMediaContent = async () => {
        try {
            const response = await fetch(`/api/baserow/${clientId}/social-media-content`)
            const data = await response.json()
            setSocialMediaContent(data.results || [])
        } catch (error) {
            console.error('Error fetching social media content:', error)
        }
    }

    const fetchBrandAssets = async () => {
        try {
            const response = await fetch(`/api/baserow/${clientId}/brand-assets`)
            const data = await response.json()
            setBrandAssets(data.results || [])
        } catch (error) {
            console.error('Error fetching brand assets:', error)
        }
    }

    const contentTypes = [
        {
            id: 'social_media_post',
            title: 'Social Media Idea',
            description: 'Create engaging social media content',
            icon: Image,
            color: 'bg-blue-500',
            available: true
        },
        {
            id: 'blog_post',
            title: 'Blog Post Idea',
            description: 'Write compelling blog articles',
            icon: FileText,
            color: 'bg-green-500',
            available: false
        },
        {
            id: 'video_content',
            title: 'Video Idea',
            description: 'Plan video content strategy',
            icon: Video,
            color: 'bg-red-500',
            available: false
        },
        {
            id: 'email_campaign',
            title: 'Email Campaign Idea',
            description: 'Design email marketing campaigns',
            icon: Mail,
            color: 'bg-purple-500',
            available: false
        },
        {
            id: 'product_uvp',
            title: 'Product UVP Idea',
            description: 'Define unique value propositions',
            icon: Lightbulb,
            color: 'bg-yellow-500',
            available: false
        }
    ]

    const handleContentTypeSelect = (contentType: string) => {
        if (contentType === 'social_media_post') {
            setSelectedContentType(contentType)
            setShowForm(true)
        } else {
            alert('This content type is coming soon!')
        }
    }

    const handleCreateIdea = async (formData: any) => {
        console.log('DEBUG: handleCreateIdea called with formData:', formData)
        console.log('DEBUG: handleCreateIdea function is being executed')
        try {
            let voiceFileUrl = ''

            // Upload voice file if provided
            if (formData.voiceFile) {
                const uploadFormData = new FormData()
                uploadFormData.append('voiceFile', formData.voiceFile)
                uploadFormData.append('clientId', clientId)
                uploadFormData.append('ideaId', 'temp-' + Date.now())

                const uploadResponse = await fetch('/api/upload/voice-note', {
                    method: 'POST',
                    body: uploadFormData
                })

                if (uploadResponse.ok) {
                    const uploadResult = await uploadResponse.json()
                    voiceFileUrl = uploadResult.fileUrl
                }
            }

            // Save to Baserow
            console.log('DEBUG: About to call Baserow API with data:', {
                ...formData,
                contentType: selectedContentType,
                voiceFileUrl
            })
            
            const createResponse = await fetch(`/api/baserow/${clientId}/content-ideas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    contentType: selectedContentType,
                    voiceFileUrl
                })
            })

            if (!createResponse.ok) {
                throw new Error('Failed to create content idea')
            }

            const newIdea = await createResponse.json()
            console.log('DEBUG: New idea created:', newIdea)
            console.log('DEBUG: New idea ID:', newIdea.id)

            // Trigger n8n webhook (don't send secret from client-side)
            console.log('DEBUG: About to trigger webhook...')
            try {
                console.log('DEBUG: formData contents:', formData)
                console.log('DEBUG: formData.ideaId:', formData.ideaId)
                
                // Check if formData contains ideaId that would overwrite newIdea.id
                const { ideaId: formDataIdeaId, ...formDataWithoutIdeaId } = formData
                console.log('DEBUG: formData ideaId (if any):', formDataIdeaId)
                
                const webhookPayload = {
                    clientId,
                    ideaId: newIdea.id,
                    ...formDataWithoutIdeaId, // Use formData without ideaId to prevent overwriting
                    contentType: selectedContentType,
                    voiceFileUrl
                }
                console.log('DEBUG: Webhook payload being sent:', webhookPayload)
                console.log('DEBUG: Final webhook payload ideaId:', webhookPayload.ideaId)
                
                const webhookResponse = await fetch('/api/webhooks/n8n/content-idea-created', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(webhookPayload)
                })

                if (webhookResponse.ok) {
                    const webhookResult = await webhookResponse.json()
                    console.log('n8n webhook result:', webhookResult)
                } else {
                    console.warn('n8n webhook failed, but content idea was created')
                }
            } catch (webhookError) {
                console.warn('n8n webhook error, but content idea was created:', webhookError)
            }

            // Refresh the list and close form
            await fetchContentIdeas()
            setShowForm(false)
            setSelectedContentType(null)

            // Show success message (you can add a toast notification here)
            alert('Content idea created successfully!')

        } catch (error) {
            console.error('Error creating content idea:', error)
            console.error('Error details:', {
                message: error.message,
                stack: error.stack
            })
            alert('Error creating content idea. Please try again.')
        }
    }

    const handleViewIdea = async (idea: any) => {
        // Navigate to social media content page with the ideaId as a query parameter
        console.log('DEBUG: handleViewIdea called with idea:', idea)
        console.log('DEBUG: Navigating to:', `/dashboard/${clientId}/social-media-content?ideaId=${idea.id}`)
        router.push(`/dashboard/${clientId}/social-media-content?ideaId=${idea.id}`)
    }

    const handleViewBrandAssets = (ideaId: string) => {
        // Navigate to brand assets page
        router.push(`/dashboard/${clientId}/brand-assets`)
    }

    const handleRegenerateContent = async (ideaId: string) => {
        try {
            // Find the idea to get its details
            const idea = contentIdeas.find((i: any) => i.id === ideaId)
            if (!idea) return

            // Update the idea's generation status to processing
            setContentIdeas(prev => prev.map((i: any) => 
                i.id === ideaId 
                    ? { ...i, generationStatus: 'processing' }
                    : i
            ))

            // Trigger n8n webhook for regeneration
            const webhookResponse = await fetch('/api/webhooks/n8n/content-idea-created', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    clientId,
                    ideaId: ideaId,
                    title: idea.title,
                    description: idea.description,
                    contentType: 'social_media_post',
                    regenerate: true
                })
            })

            if (webhookResponse.ok) {
                // Update status to completed after a delay (simulated)
                setTimeout(() => {
                    setContentIdeas(prev => prev.map((i: any) => 
                        i.id === ideaId 
                            ? { 
                                ...i, 
                                generationStatus: 'completed',
                                lastGenerated: new Date().toISOString(), // This is OK since it's client-side only
                                socialMediaContentCount: (i.socialMediaContentCount || 0) + 1
                            }
                            : i
                    ))
                    fetchSocialMediaContent() // Refresh social media content
                }, 3000)
                
                alert('Content regeneration started! This may take a few moments.')
            } else {
                // Update status back to previous state on error
                setContentIdeas(prev => prev.map((i: any) => 
                    i.id === ideaId 
                        ? { ...i, generationStatus: i.socialMediaContentCount > 0 ? 'completed' : 'none' }
                        : i
                ))
                alert('Failed to start content regeneration. Please try again.')
            }
        } catch (error) {
            console.error('Error regenerating content:', error)
            alert('Error regenerating content. Please try again.')
        }
    }

    // Remove unused functions
    if (!clientConfig) {
        return <div>Client not found</div>
    }



    return (
        <ClientOnly fallback={
            <div className="container mx-auto py-6">
                <div className="animate-pulse space-y-6">
                    <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-24 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-48 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        }>
            <div className="container mx-auto py-6 space-y-6">
                {/* Client Header */}
                <ClientHeader
                    clientConfig={clientConfig}
                    hideNewButton={true}
                />

                {/* Stats Cards */}
                <StatsCards contentIdeas={contentIdeas} />

                {/* Content Type Selection */}
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-gray-900">Create New Content Idea</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        {contentTypes.map((type) => (
                            <Card 
                                key={type.id}
                                className={`cursor-pointer transition-all hover:shadow-lg ${
                                    type.available 
                                        ? 'hover:scale-105' 
                                        : 'opacity-60 cursor-not-allowed'
                                }`}
                                onClick={() => handleContentTypeSelect(type.id)}
                            >
                                <CardContent className="p-6 text-center space-y-4">
                                    <div className={`w-12 h-12 ${type.color} rounded-lg flex items-center justify-center mx-auto`}>
                                        <type.icon className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{type.title}</h3>
                                        <p className="text-sm text-gray-500 mt-1">{type.description}</p>
                                        {!type.available && (
                                            <p className="text-xs text-gray-400 mt-2">Coming Soon</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Content Ideas Table/Grid */}
                <ContentIdeasTable
                    contentIdeas={contentIdeas}
                    isLoading={isLoading}
                    onCreateFirst={() => {}} // Remove this functionality since we have buttons above
                    onViewIdea={handleViewIdea}
                    onViewBrandAssets={handleViewBrandAssets}
                    onRegenerateContent={handleRegenerateContent}
                    clientPrimaryColor={clientConfig.branding.primaryColor}
                    showEnhancedFeatures={true}
                />

                {/* Quick Access to Related Content */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MessageSquare className="h-5 w-5" />
                                Recent Social Media Content
                            </CardTitle>
                            <CardDescription>
                                Latest generated social media posts
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {socialMediaContent.length > 0 ? (
                                <div className="space-y-3">
                                    {socialMediaContent.slice(0, 3).map((content: any) => (
                                        <div key={content.id} className="p-3 bg-gray-50 rounded-lg">
                                            <p className="font-medium text-sm">{content.platform}</p>
                                            <p className="text-xs text-gray-600 truncate">{content.hook}</p>
                                        </div>
                                    ))}
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={() => router.push(`/dashboard/${clientId}/social-media-content`)}
                                        className="w-full"
                                    >
                                        View All Posts
                                    </Button>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500">No social media content yet</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Palette className="h-5 w-5" />
                                Brand Assets
                            </CardTitle>
                            <CardDescription>
                                Available brand resources
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {brandAssets.length > 0 ? (
                                <div className="space-y-3">
                                    {brandAssets.slice(0, 3).map((asset: any) => (
                                        <div key={asset.id} className="p-3 bg-gray-50 rounded-lg">
                                            <p className="font-medium text-sm">{asset.assetName}</p>
                                            <p className="text-xs text-gray-600">{asset.assetType} • {asset.platform}</p>
                                        </div>
                                    ))}
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={() => router.push(`/dashboard/${clientId}/brand-assets`)}
                                        className="w-full"
                                    >
                                        Manage Assets
                                    </Button>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500">No brand assets yet</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Form Modal */}
                {showForm && selectedContentType && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                            <ContentIdeaForm
                                onSubmit={async (data) => {
                                    console.log('DEBUG: ContentIdeaForm onSubmit prop called with data:', data)
                                    console.log('DEBUG: handleCreateIdea function type:', typeof handleCreateIdea)
                                    await handleCreateIdea(data)
                                }}
                                onClose={() => {
                                    setShowForm(false)
                                    setSelectedContentType(null)
                                }}
                                clientId={clientId}
                                contentType={selectedContentType}
                            />
                        </div>
                    </div>
                )}

                {/* Social Media Content Modal */}
                {showSocialMediaModal && selectedIdeaForSocialMedia && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg max-w-6xl w-full max-h-[95vh] overflow-y-auto">
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-4">
                                        <Button 
                                            variant="ghost" 
                                            onClick={() => {
                                                setShowSocialMediaModal(false)
                                                setSelectedIdeaForSocialMedia(null)
                                                setSocialMediaContentForIdea([])
                                            }}
                                            className="flex items-center gap-2"
                                        >
                                            <ArrowLeft className="h-4 w-4" />
                                            Back
                                        </Button>
                                        <div>
                                            <h2 className="text-2xl font-bold">
                                                Generated Posts for "{selectedIdeaForSocialMedia.title}"
                                            </h2>
                                            <p className="text-sm text-gray-500">
                                                View and manage social media content for this idea
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {isLoadingSocialMedia ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                                        <span className="ml-2">Loading posts...</span>
                                    </div>
                                ) : socialMediaContentForIdea.length === 0 ? (
                                    <Card>
                                        <CardContent className="flex flex-col items-center justify-center py-12">
                                            <MessageSquare className="h-12 w-12 text-gray-400 mb-4" />
                                            <h3 className="text-lg font-medium text-gray-900 mb-2">No posts generated yet</h3>
                                            <p className="text-gray-500 text-center mb-4">
                                                This content idea hasn't generated any social media posts yet.
                                            </p>
                                            <Button
                                                onClick={() => {
                                                    setShowSocialMediaModal(false)
                                                    setSelectedIdeaForSocialMedia(null)
                                                    // Trigger regeneration for this idea
                                                    handleRegenerateContent(selectedIdeaForSocialMedia.id)
                                                }}
                                                style={{ backgroundColor: clientConfig.branding.primaryColor }}
                                                className="hover:opacity-90"
                                            >
                                                <TrendingUp className="h-4 w-4 mr-2" />
                                                Generate Posts
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    <SocialMediaContentTable
                                        socialMediaContent={socialMediaContentForIdea}
                                        isLoading={isLoadingSocialMedia}
                                        onEdit={(content) => {
                                            // Handle edit - this will be implemented in step 2
                                            console.log('Edit content:', content)
                                        }}
                                        onView={(content) => {
                                            // Handle view - this will be implemented in step 2
                                            console.log('View content:', content)
                                        }}
                                        onStatusUpdate={(contentId, status) => {
                                            // Handle status update - this will be implemented in step 2
                                            console.log('Update status:', contentId, status)
                                        }}
                                        clientPrimaryColor={clientConfig.branding.primaryColor}
                                        showContentIdea={false}
                                        contentIdeaTitle={selectedIdeaForSocialMedia.title}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </ClientOnly>
    )
}