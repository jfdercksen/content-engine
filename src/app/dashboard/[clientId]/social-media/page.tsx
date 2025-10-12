'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Plus, ArrowLeft, Image as ImageIcon, MessageSquare, Palette, TrendingUp } from 'lucide-react'
import { useClientConfig } from '@/hooks/useClientConfig'
import ContentIdeaForm from '@/components/forms/ContentIdeaForm'
import SocialMediaContentForm from '@/components/forms/SocialMediaContentForm'
import ClientOnly from '@/components/ClientOnly'
import ContentIdeasTable from '@/components/tables/ContentIdeasTable'
import SocialMediaContentTable from '@/components/tables/SocialMediaContentTable'
import StatsCards from '@/components/dashboard/StatsCards'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ViewToggle } from '@/components/ui/view-toggle'

interface BaserowField {
    id: number;
    value: string;
    color: string;
}

interface BaseContentIdea {
    id: string;
    title?: string;
    idea_type?: string | BaserowField;
    description?: string;
    priority?: 'High' | 'Medium' | 'Low' | BaserowField;
    status?: string | BaserowField;
    target_audience?: string | BaserowField;
    source_type?: string | BaserowField;
    socialMediaContentCount?: number;
    brandAssetsCount?: number;
    generationStatus?: 'pending' | 'processing' | 'completed' | 'failed' | 'none';
    lastGenerated?: string;
    [key: string]: any;
}

interface ContentIdeaState extends BaseContentIdea {
    content_type?: string;
}

export default function SocialMediaPage() {
    const params = useParams();
    const router = useRouter();

    const clientId = params.clientId as string;
    const { clientConfig, isLoading: configLoading, error: configError } = useClientConfig(clientId);
    const [contentIdeas, setContentIdeas] = useState<ContentIdeaState[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
    const [relatedSocialContent, setRelatedSocialContent] = useState<any[]>([]);
    const [isLoadingRelated, setIsLoadingRelated] = useState(false);
    // Add new state for social media content modal
    const [showSocialMediaModal, setShowSocialMediaModal] = useState(false)
    const [selectedIdeaForSocialMedia, setSelectedIdeaForSocialMedia] = useState<any>(null)
    const [socialMediaContentForIdea, setSocialMediaContentForIdea] = useState<any[]>([])
    const [isLoadingSocialMedia, setIsLoadingSocialMedia] = useState(false)
    // Add state for edit modal
    const [showEditModal, setShowEditModal] = useState(false)
    const [editingContent, setEditingContent] = useState<any>(null)
    const [isUpdatingContent, setIsUpdatingContent] = useState(false)

    // Move useEffect to the top to avoid hooks order issues
    useEffect(() => {
        if (clientConfig) {
            fetchContentIdeas()
        }
    }, [clientId, clientConfig])

    // Helper function to safely get values from Baserow fields
    const getBaserowFieldValue = (field: any): string => {
        if (field === undefined || field === null) return '';
        if (typeof field === 'object' && 'value' in field) {
            return field.value;
        }
        return String(field);
    };

    // Process an idea for display while preserving Baserow data structure
    const processIdea = (idea: ContentIdeaState): ContentIdeaState => {
        const processed = { ...idea };
        
        if (processed.idea_type && typeof processed.idea_type === 'object' && 'value' in (processed.idea_type as any)) {
            processed.idea_type = (processed.idea_type as BaserowField).value;
        }
        
        if (processed.priority && typeof processed.priority === 'object' && 'value' in (processed.priority as any)) {
            const priorityValue = (processed.priority as BaserowField).value;
            processed.priority = priorityValue as 'High' | 'Medium' | 'Low';
        }
        
        if (processed.status && typeof processed.status === 'object' && 'value' in (processed.status as any)) {
            processed.status = (processed.status as BaserowField).value;
        }
        
        if (processed.target_audience && typeof processed.target_audience === 'object' && 'value' in (processed.target_audience as any)) {
            processed.target_audience = (processed.target_audience as BaserowField).value;
        }
        
        if (processed.source_type && typeof processed.source_type === 'object' && 'value' in (processed.source_type as any)) {
            processed.source_type = (processed.source_type as BaserowField).value;
        }
        
        return processed;
    };


    const fetchContentIdeas = async () => {
        try {
            setIsLoading(true)
            const response = await fetch(`/api/baserow/${clientId}/content-ideas?filter=social_media_post`)
            const data = await response.json()

            // For this page we only need social media ideas
            const socialMediaIdeas = data.results || []
            setContentIdeas(socialMediaIdeas)
        } catch (error) {
            console.error('Error fetching content ideas:', error)
            setContentIdeas([])
        } finally {
            setIsLoading(false)
        }
    }

    const handleCreateIdea = async (formData: any) => {
        try {
            // Prepare FormData for possible file uploads
            const apiFormData = new FormData()
            Object.keys(formData).forEach((key) => {
                const value = (formData as any)[key]
                if (value !== undefined && value !== null && !['voiceFile', 'imageFile', 'videoFile'].includes(key)) {
                    if (Array.isArray(value)) {
                        apiFormData.append(key, JSON.stringify(value))
                    } else {
                        apiFormData.append(key, value)
                    }
                }
            })

            // Add content type
            apiFormData.append('contentType', 'social_media_post')

            // Add files if they exist
            if (formData.voiceFile) apiFormData.append('voiceFile', formData.voiceFile)
            if (formData.imageFile) apiFormData.append('imageFile', formData.imageFile)
            if (formData.videoFile) apiFormData.append('videoFile', formData.videoFile)

            // Decide request payload based on whether files exist
            const hasFiles = !!(formData.voiceFile || formData.imageFile || formData.videoFile)
            let createResponse: Response

            if (hasFiles) {
                createResponse = await fetch(`/api/baserow/${clientId}/content-ideas`, {
                    method: 'POST',
                    body: apiFormData,
                })
            } else {
                const dataToSend = { ...formData, contentType: 'social_media_post' }
                createResponse = await fetch(`/api/baserow/${clientId}/content-ideas`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dataToSend),
                })
            }

            if (!createResponse.ok) throw new Error('Failed to create social media idea')

            const newIdea = await createResponse.json()

            // Trigger n8n webhook (non-blocking)
            try {
                await fetch('/api/webhooks/n8n/content-idea-created', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        clientId,
                        ideaId: newIdea.id,
                        ...formData,
                        contentType: 'social_media_post',
                        baserow: {
                            databaseId: clientConfig.baserow.databaseId,
                            tableId: clientConfig.baserow.tables.contentIdeas,
                            recordId: newIdea.id,
                            baseUrl: process.env.BASEROW_API_URL || 'https://baserow.aiautomata.co.za',
                        },
                        files: newIdea.files || {},
                    }),
                })
            } catch (webhookError) {
                console.warn('n8n webhook error (non-blocking):', webhookError)
            }

            await fetchContentIdeas()
            setShowForm(false)
            alert('Social media idea created successfully!')
        } catch (error) {
            console.error('Error creating social media idea:', error)
            alert('Error creating social media idea. Please try again.')
        }
    }

    const handleViewIdea = async (idea: any) => {
        console.log('DEBUG: handleViewIdea called with idea:', idea)
        
        // Instead of opening the 3-tab modal, go directly to social media content
        setSelectedIdeaForSocialMedia(idea)
        setShowSocialMediaModal(true)
        setIsLoadingSocialMedia(true)
        
        console.log('DEBUG: Modal state set - showSocialMediaModal should be true')
        console.log('DEBUG: selectedIdeaForSocialMedia set to:', idea)
        
        try {
            // Fetch social media content for this specific idea
            const apiUrl = `/api/baserow/${clientId}/social-media-content?contentIdea=${idea.id}&debug=true`
            console.log('DEBUG: Making fetch request to:', apiUrl)
            
            const response = await fetch(apiUrl)
            console.log('DEBUG: Fetch response status:', response.status)
            console.log('DEBUG: Fetch response ok:', response.ok)
            
            if (response.ok) {
                const data = await response.json()
                console.log('DEBUG: Fetch response data:', data)
                
                // Debug: Check content idea field values using dynamic field mapping
                if (data.results && data.results.length > 0) {
                    const contentIdeaFieldId = clientConfig?.fieldMappings?.socialMediaContent?.contentidea
                    const fieldKey = contentIdeaFieldId ? `field_${contentIdeaFieldId}` : 'field_unknown'
                    
                    console.log('DEBUG: Checking content idea field values in first 5 posts:')
                    console.log('DEBUG: Using field key:', fieldKey)
                    
                    data.results.slice(0, 5).forEach((post: any, index: number) => {
                        const contentIdeaField = post[fieldKey]
                        console.log(`  Post ${index + 1} (ID: ${post.id}): ${fieldKey} =`, contentIdeaField)
                        console.log(`  Post ${index + 1} (ID: ${post.id}): contentIdea =`, post.contentIdea)
                        
                        // Expand the objects to see their structure
                        if (contentIdeaField && Array.isArray(contentIdeaField) && contentIdeaField.length > 0) {
                            console.log(`  Post ${index + 1} ${fieldKey} details:`, JSON.stringify(contentIdeaField[0], null, 2))
                        }
                        if (post.contentIdea && Array.isArray(post.contentIdea) && post.contentIdea.length > 0) {
                            console.log(`  Post ${index + 1} contentIdea details:`, JSON.stringify(post.contentIdea[0], null, 2))
                        }
                    })
                    
                            // Filter posts that are linked to the selected content idea
        console.log('DEBUG: Filtering posts for content idea:', idea.id)
        
        // Get the content idea field ID from client configuration (reuse the one declared above)
        if (!contentIdeaFieldId) {
          console.error('Content idea field ID not found in client configuration')
          setSocialMediaContentForIdea([])
          return
        }
        
        // Reuse the fieldKey from the debug section above
        console.log('DEBUG: Using field key for content idea:', fieldKey)
        
        const filteredPosts = data.results.filter((post: any) => {
          // Check if the post is linked to the selected content idea using dynamic field mapping
          const contentIdeaField = post[fieldKey]
          const isLinked = contentIdeaField && Array.isArray(contentIdeaField) && 
            contentIdeaField.some((item: any) => item.id === idea.id)
          
          console.log(`DEBUG: Post ${post.id} linked to idea ${idea.id}:`, isLinked)
          console.log(`DEBUG: Post ${post.id} content idea field (${fieldKey}):`, contentIdeaField)
          return isLinked
        })
        
        console.log('DEBUG: Filtered posts count:', filteredPosts.length)
        setSocialMediaContentForIdea(filteredPosts)
                } else {
                    setSocialMediaContentForIdea([])
                    console.log('DEBUG: No social media content available')
                }
                
                console.log('DEBUG: Loading finished, modal should be visible')
            } else {
                console.error('Failed to fetch social media content for idea:', idea.id)
                console.error('Response status:', response.status)
                console.error('Response status text:', response.statusText)
                setSocialMediaContentForIdea([])
            }
        } catch (error) {
            console.error('Error fetching social media content:', error)
            setSocialMediaContentForIdea([])
        } finally {
            setIsLoadingSocialMedia(false)
            console.log('DEBUG: Loading finished, modal should be visible')
        }
    }

    const fetchRelatedSocialContent = async (ideaId: string) => {
        try {
            setIsLoadingRelated(true)
            console.log('Fetching related social media content for idea:', ideaId)
            
            const response = await fetch(`/api/baserow/${clientId}/content-ideas/${ideaId}/social-media-content`)
            
            if (!response.ok) {
                throw new Error(`Failed to fetch related content: ${response.status} ${response.statusText}`)
            }
            
            const data = await response.json()
            console.log('Related social media content response:', data)
            
            setRelatedSocialContent(data.results || [])
            
            // Update the content idea with the actual count
            const actualCount = data.count || data.results?.length || 0
            setContentIdeas(prev => prev.map((idea: any) => 
                idea.id === ideaId 
                    ? { ...idea, socialMediaContentCount: actualCount }
                    : idea
            ) as ContentIdeaState[])
        } catch (error) {
            console.error('Error fetching related social media content:', error)
            setRelatedSocialContent([])
        } finally {
            setIsLoadingRelated(false)
        }
    }

    const handleViewSocialContent = (ideaId: string) => {
        // Navigate to social media content page with filter for this idea
        router.push(`/dashboard/${clientId}/social-media-content?ideaId=${ideaId}`)
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
                                lastGenerated: new Date().toISOString(),
                                socialMediaContentCount: (i.socialMediaContentCount || 0) + 1
                            }
                            : i
                    ))
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

    const handleEditContent = async (content: any) => {
        console.log('DEBUG: handleEditContent called with content:', content)
        try {
            // Fetch fresh data with linked images
            const apiUrl = `/api/baserow/${clientId}/social-media-content/${content.id}?t=${Date.now()}`
            console.log('DEBUG: Fetching from API URL:', apiUrl)
            
            const response = await fetch(apiUrl)
            console.log('DEBUG: API response status:', response.status)
            console.log('DEBUG: API response ok:', response.ok)
            
            if (response.ok) {
                const data = await response.json()
                console.log('DEBUG: Fetched content data:', data)
                console.log('DEBUG: Data.data field_7193:', data.data?.field_7193)
                console.log('DEBUG: Data.data images:', data.data?.images)
                
                setEditingContent(data.data)
                setShowEditModal(true)
                console.log('DEBUG: Set editingContent and showEditModal to true')
            } else {
                console.error('Failed to fetch content for editing')
                // Fallback to using the table data
                setEditingContent(content)
                setShowEditModal(true)
                console.log('DEBUG: Using fallback data, set editingContent and showEditModal to true')
            }
        } catch (error) {
            console.error('Error fetching content for editing:', error)
            // Fallback to using the table data
            setEditingContent(content)
            setShowEditModal(true)
            console.log('DEBUG: Error fallback, set editingContent and showEditModal to true')
        }
    }

    const handleUpdateContent = async (formData: any) => {
        try {
            setIsUpdatingContent(true)
            
            console.log('📝 Updating content:', editingContent.id)
            console.log('📝 Form data:', formData)
            
            const response = await fetch(`/api/baserow/${clientId}/social-media-content/${editingContent.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            })

            console.log('📡 Response status:', response.status)

            if (response.ok) {
                const result = await response.json()
                console.log('✅ Update successful:', result)
                
                // Update the content in the local state
                setSocialMediaContentForIdea(prev => prev.map(content => 
                    content.id === editingContent.id 
                        ? { ...content, ...formData }
                        : content
                ))
                
                setShowEditModal(false)
                setEditingContent(null)
                alert('Content updated successfully!')
            } else {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
                console.error('❌ API Error:', errorData)
                throw new Error(errorData.error || `Failed to update content (${response.status})`)
            }
        } catch (error: any) {
            console.error('❌ Error updating content:', error)
            alert(`Error updating content: ${error.message || 'Please try again.'}`)
        } finally {
            setIsUpdatingContent(false)
        }
    }

    // Conditional rendering based on client config state
    if (configLoading) {
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

    if (configError || !clientConfig) {
        return (
            <div className="container mx-auto p-6">
                <div className="text-center py-12">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Client Not Found</h1>
                    <p className="text-gray-600 mb-6">
                        {configError || `The client "${clientId}" could not be found.`}
                    </p>
                    <button 
                        onClick={() => router.push(`/dashboard/${clientId}`)}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                    >
                        Back to Dashboard
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
                {/* Header with Back Button */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <Button 
                            variant="ghost" 
                            onClick={() => router.push(`/dashboard/${clientId}`)}
                            className="flex items-center gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Dashboard
                        </Button>
                        <div className="h-6 w-px bg-gray-300"></div>
                        <div>
                            <h1 
                                className="text-3xl font-bold flex items-center gap-3" 
                                style={{ color: clientConfig.branding.primaryColor }}
                            >
                                <ImageIcon className="h-8 w-8" />
                                Social Media Ideas
                            </h1>
                            <p className="text-muted-foreground">
                                Create and manage social media content for {clientConfig.name}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <ViewToggle view={viewMode} onViewChange={setViewMode} />
                        <Button
                            variant="outline"
                            onClick={() => router.push(`/dashboard/${clientId}/brand-assets`)}
                            className="flex items-center gap-2"
                        >
                            <Palette className="h-4 w-4" />
                            Brand Assets
                        </Button>
                        <Button
                            onClick={() => setShowForm(true)}
                            style={{ backgroundColor: clientConfig.branding.primaryColor }}
                            className="hover:opacity-90"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            New Social Media Idea
                        </Button>
                    </div>
                </div>

                {/* Process content ideas for display */}
                {(() => {
                    const processedIdeas = contentIdeas.map((idea) => ({
                        ...idea,
                        idea_type: idea.idea_type || '',
                        priority: idea.priority || 'Medium',
                        status: idea.status || '',
                        target_audience: idea.target_audience || '',
                        source_type: idea.source_type || ''
                    }))

                    return (
                        <>
                            {/* Stats Cards */}
                            <StatsCards contentIdeas={processedIdeas.map(idea => processIdea(idea)) as any} />

                            {/* Content Ideas Table/Grid */}
                            <ContentIdeasTable
                                contentIdeas={processedIdeas}
                                isLoading={isLoading}
                                onCreateFirst={() => setShowForm(true)}
                                onViewIdea={handleViewIdea}
                                onViewSocialContent={handleViewSocialContent}
                                onViewBrandAssets={handleViewBrandAssets}
                                onRegenerateContent={handleRegenerateContent}
                                clientPrimaryColor={clientConfig.branding.primaryColor}
                                showEnhancedFeatures={true}
                            />
                        </>
                    )
                })()}

                {/* Form Modal */}
                {showForm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                            <ContentIdeaForm
                                onSubmit={handleCreateIdea}
                                onClose={() => setShowForm(false)}
                                clientId={clientId}
                                contentType="social_media_post"
                            />
                        </div>
                    </div>
                )}



                {/* Social Media Content Modal */}
                {(() => {
                    console.log('DEBUG: Modal conditions check - showSocialMediaModal:', showSocialMediaModal, 'selectedIdeaForSocialMedia:', !!selectedIdeaForSocialMedia)
                    return null
                })()}
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
                                             <p className="text-sm text-muted-foreground">
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
                                    <>
                                        {console.log('DEBUG: Rendering SocialMediaContentTable with', socialMediaContentForIdea.length, 'posts')}
                                        <SocialMediaContentTable
                                            socialMediaContent={socialMediaContentForIdea}
                                            isLoading={isLoadingSocialMedia}
                                            onEdit={handleEditContent}
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
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit Social Media Content Modal */}
                {showEditModal && editingContent && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg max-w-6xl w-full max-h-[95vh] overflow-y-auto">
                            <SocialMediaContentForm
                                initialData={editingContent}
                                onSubmit={handleUpdateContent}
                                onClose={() => {
                                    setShowEditModal(false)
                                    setEditingContent(null)
                                }}
                                contentIdeaId={selectedIdeaForSocialMedia?.id}
                                contentIdeaTitle={selectedIdeaForSocialMedia?.title}
                                isEditing={true}
                                isLoading={isUpdatingContent}
                                clientId={clientId}
                                clientName={clientConfig.name}
                            />
                        </div>
                    </div>
                )}
            </div>
        </ClientOnly>
    )
}