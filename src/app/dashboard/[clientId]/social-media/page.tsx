'use client'

import { useState, useEffect, useRef } from 'react'
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
import { SocialMediaContent } from '@/lib/types/content'

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
    const [editingIdea, setEditingIdea] = useState<any>(null);
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
    // Add state to preserve pagination when updating posts
    const [currentPostPage, setCurrentPostPage] = useState(1)
    // Use ref to track the current page value (to avoid stale closures)
    const currentPostPageRef = useRef(1)
    // Use ref to track if we're in the middle of refreshing (to prevent page reset)
    const isRefreshingRef = useRef(false)
    const pageToRestoreRef = useRef<number | null>(null)
    
    // Keep ref in sync with state
    useEffect(() => {
        currentPostPageRef.current = currentPostPage
        console.log('📄 DEBUG: currentPostPageRef updated to:', currentPostPage)
    }, [currentPostPage])

    // Move useEffect to the top to avoid hooks order issues
    useEffect(() => {
        if (clientConfig) {
            fetchContentIdeas()
        }
    }, [clientId, clientConfig])

    // Debug: Monitor page state changes to track when it resets
    useEffect(() => {
        const stackTrace = new Error().stack
        console.log('📄 DEBUG: currentPostPage changed to:', currentPostPage, 'pageToRestoreRef:', pageToRestoreRef.current)
        if (currentPostPage === 1 && pageToRestoreRef.current && pageToRestoreRef.current > 1) {
            console.warn('⚠️ WARNING: Page was reset to 1 but we had preserved page:', pageToRestoreRef.current)
            console.warn('⚠️ Restoring page to:', pageToRestoreRef.current)
            // Restore the page if it was reset incorrectly
            setCurrentPostPage(pageToRestoreRef.current)
        }
    }, [currentPostPage])

    // Restore page after posts are updated (if we're in the middle of a refresh)
    useEffect(() => {
        // Check both refs and sessionStorage for the page to restore
        const sessionStorageKey = selectedIdeaForSocialMedia?.id 
            ? `preservePage_${selectedIdeaForSocialMedia.id}` 
            : null
        
        const sessionPage = sessionStorageKey && typeof window !== 'undefined'
            ? parseInt(sessionStorage.getItem(sessionStorageKey) || '0', 10)
            : 0
        
        const refPage = pageToRestoreRef.current
        
        const pageToRestore = refPage || sessionPage || 0
        
        if ((pageToRestore > 0 || isRefreshingRef.current) && socialMediaContentForIdea.length > 0) {
            const itemsPerPage = 10
            const totalPages = Math.ceil(socialMediaContentForIdea.length / itemsPerPage)
            const validPage = pageToRestore > totalPages ? Math.max(1, totalPages) : pageToRestore
            
            console.log('🔄 RESTORE PAGE EFFECT: refPage:', refPage, 'sessionPage:', sessionPage, 'pageToRestore:', pageToRestore, 'current:', currentPostPage, 'valid:', validPage, 'total pages:', totalPages, 'posts:', socialMediaContentForIdea.length)
            
            // If current page doesn't match what we want, restore it
            if (validPage > 0 && validPage <= totalPages && currentPostPage !== validPage) {
                console.log('✅ RESTORE PAGE EFFECT: Setting page from', currentPostPage, 'to', validPage)
                setCurrentPostPage(validPage)
                currentPostPageRef.current = validPage
                
                // Clear sessionStorage after restoring
                if (sessionStorageKey && typeof window !== 'undefined') {
                    setTimeout(() => {
                        sessionStorage.removeItem(sessionStorageKey)
                    }, 500)
                }
            } else if (currentPostPage === validPage) {
                console.log('✅ RESTORE PAGE EFFECT: Page already correct:', validPage)
                // Clear refs if page is already correct
                if (refPage) {
                    setTimeout(() => {
                        pageToRestoreRef.current = null
                        isRefreshingRef.current = false
                        if (sessionStorageKey && typeof window !== 'undefined') {
                            sessionStorage.removeItem(sessionStorageKey)
                        }
                        console.log('✅ RESTORE PAGE EFFECT: Cleared refs')
                    }, 500)
                }
            }
        }
    }, [socialMediaContentForIdea.length, currentPostPage, selectedIdeaForSocialMedia?.id])


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
            setEditingIdea(null)
            alert('Social media idea created successfully!')
        } catch (error) {
            console.error('Error creating social media idea:', error)
            alert('Error creating social media idea. Please try again.')
        }
    }

    const handleUpdateIdea = async (formData: any) => {
        try {
            if (!editingIdea) return
            
            console.log('Updating social media idea:', editingIdea.id, formData)
            
            // Prepare FormData for possible file uploads (similar to create)
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
            let updateResponse: Response

            if (hasFiles) {
                updateResponse = await fetch(`/api/baserow/${clientId}/content-ideas/${editingIdea.id}`, {
                    method: 'PUT',
                    body: apiFormData,
                })
            } else {
                const dataToSend = { ...formData, contentType: 'social_media_post' }
                updateResponse = await fetch(`/api/baserow/${clientId}/content-ideas/${editingIdea.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dataToSend),
                })
            }

            if (!updateResponse.ok) throw new Error('Failed to update social media idea')

            const updatedIdea = await updateResponse.json()
            console.log('Updated idea:', updatedIdea)

            await fetchContentIdeas()
            setShowForm(false)
            setEditingIdea(null)
            alert('Social media idea updated successfully!')
        } catch (error) {
            console.error('Error updating social media idea:', error)
            alert('Error updating social media idea. Please try again.')
        }
    }

    const handleEditIdea = (idea: any) => {
        console.log('DEBUG: handleEditIdea called with idea:', idea)
        setEditingIdea(idea)
        setShowForm(true)
    }

    const handleViewIdea = async (idea: any, resetPage: boolean = true) => {
        console.log('DEBUG: handleViewIdea called with idea:', idea, 'resetPage:', resetPage, 'isRefreshing:', isRefreshingRef.current)
        
        // Instead of opening the 3-tab modal, go directly to social media content
        const isNewIdea = selectedIdeaForSocialMedia?.id !== idea.id
        
        // NEVER reset page if we're in the middle of refreshing (updating a post)
        if (isRefreshingRef.current) {
            console.log('🚫 DEBUG: Blocked page reset in handleViewIdea because we\'re refreshing')
            resetPage = false
        }
        
        // Reset to first page only if it's a new idea AND resetPage is true AND we're not refreshing
        if (isNewIdea && resetPage && !isRefreshingRef.current && pageToRestoreRef.current === null) {
            console.log('🔄 DEBUG: Resetting page to 1 for new idea')
            setCurrentPostPage(1)
            currentPostPageRef.current = 1
        } else if (isRefreshingRef.current || pageToRestoreRef.current !== null) {
            console.log('🚫 DEBUG: Prevented page reset - isRefreshing:', isRefreshingRef.current, 'pageToRestore:', pageToRestoreRef.current)
        }
        
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

    // Function to refresh posts for an idea without resetting pagination
    const refreshPostsForIdea = async (idea: any, preservePage: number = 1) => {
        console.log('DEBUG: refreshPostsForIdea called for idea:', idea.id, 'preserve page:', preservePage)
        setIsLoadingSocialMedia(true)
        
        try {
            const apiUrl = `/api/baserow/${clientId}/social-media-content?contentIdea=${idea.id}&debug=true`
            const response = await fetch(apiUrl)
            
            if (response.ok) {
                const data = await response.json()
                
                if (data.results && data.results.length > 0) {
                    const contentIdeaFieldId = clientConfig?.fieldMappings?.socialMediaContent?.contentidea
                    const fieldKey = contentIdeaFieldId ? `field_${contentIdeaFieldId}` : 'field_unknown'
                    
                    const filteredPosts = data.results.filter((post: any) => {
                        const contentIdeaField = post[fieldKey]
                        return contentIdeaField && Array.isArray(contentIdeaField) && 
                            contentIdeaField.some((item: any) => item.id === idea.id)
                    })
                    
                    console.log('🔄 DEBUG: Refreshing posts - preserved page:', preservePage, ', filtered posts:', filteredPosts.length)
                    
                    // Calculate valid page based on new post count (10 posts per page)
                    const itemsPerPage = 10
                    const totalPages = Math.ceil(filteredPosts.length / itemsPerPage)
                    const validPage = preservePage > totalPages ? Math.max(1, totalPages) : preservePage
                    
                    console.log('📄 DEBUG: Page calculation - preserved:', preservePage, 'total pages:', totalPages, 'valid page:', validPage)
                    
                    console.log('🔄 DEBUG: About to update posts and preserve page:', validPage, 'current state:', currentPostPage)
                    
                    // Store the page to restore in ref and sessionStorage for safety
                    pageToRestoreRef.current = validPage
                    isRefreshingRef.current = true
                    if (typeof window !== 'undefined') {
                        sessionStorage.setItem(`preservePage_${idea.id}`, validPage.toString())
                    }
                    
                    console.log('📌 RESTORE: Setting page to:', validPage, 'currentPostPage:', currentPostPage)
                    
                    // CRITICAL: Set page state IMMEDIATELY and SYNCHRONOUSLY before updating posts
                    // This prevents the table from resetting to page 1 when it receives new content
                    console.log('📌 RESTORE: Setting page state IMMEDIATELY to:', validPage)
                    setCurrentPostPage(validPage)
                    currentPostPageRef.current = validPage
                    
                    // Also store in sessionStorage immediately
                    if (typeof window !== 'undefined') {
                        sessionStorage.setItem(`preservePage_${idea.id}`, validPage.toString())
                    }
                    
                    // Now update posts - the table should maintain the page we just set
                    setSocialMediaContentForIdea(filteredPosts)
                    
                    // Verify page is still correct after state updates, restore if needed
                    setTimeout(() => {
                        const savedPage = typeof window !== 'undefined' 
                            ? parseInt(sessionStorage.getItem(`preservePage_${idea.id}`) || String(validPage), 10)
                            : validPage
                        
                        console.log('📄 RESTORE VERIFY: Saved page:', savedPage, 'currentPostPage:', currentPostPage, 'validPage:', validPage)
                        
                        if (currentPostPageRef.current !== savedPage) {
                            console.log('⚠️ RESTORE VERIFY: Page was reset! Restoring to:', savedPage)
                            setCurrentPostPage(savedPage)
                            currentPostPageRef.current = savedPage
                        } else {
                            console.log('✅ RESTORE VERIFY: Page is correct:', savedPage)
                        }
                        
                        // Clear refresh flags after verification
                        isRefreshingRef.current = false
                        pageToRestoreRef.current = null
                    }, 100)
                } else {
                    setSocialMediaContentForIdea([])
                    // Only reset page if we're not preserving it
                    if (!isRefreshingRef.current && pageToRestoreRef.current === null) {
                        setCurrentPostPage(1)
                        currentPostPageRef.current = 1
                    }
                }
            } else {
                console.error('Failed to refresh posts for idea:', idea.id)
                setSocialMediaContentForIdea([])
                // Only reset page if we're not preserving it
                if (!isRefreshingRef.current && pageToRestoreRef.current === null) {
                    setCurrentPostPage(1)
                    currentPostPageRef.current = 1
                }
            }
        } catch (error) {
            console.error('Error refreshing posts for idea:', error)
            setSocialMediaContentForIdea([])
            // Only reset page if we're not preserving it
            if (!isRefreshingRef.current && pageToRestoreRef.current === null) {
                setCurrentPostPage(1)
                currentPostPageRef.current = 1
            }
        } finally {
            setIsLoadingSocialMedia(false)
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

    const handleDeleteIdea = async (idea: any) => {
        if (!confirm(`Are you sure you want to delete "${idea.title || 'this content idea'}"? This action cannot be undone.`)) {
            return
        }

        try {
            console.log('🗑️ Deleting content idea:', idea.id)
            
            const response = await fetch(`/api/baserow/${clientId}/content-ideas/${idea.id}`, {
                method: 'DELETE',
            })

            if (response.ok) {
                console.log('✅ Content idea deleted successfully')
                
                // Remove the idea from the local state
                setContentIdeas(prev => prev.filter((i: any) => i.id !== idea.id))
                
                alert('Content idea deleted successfully!')
            } else {
                const errorData = await response.json()
                console.error('❌ Delete failed:', errorData)
                alert(`Failed to delete content idea: ${errorData.error || 'Unknown error'}`)
            }
        } catch (error) {
            console.error('❌ Error deleting content idea:', error)
            alert('An error occurred while deleting the content idea.')
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

    const handleDeleteContent = async (content: SocialMediaContent) => {
        try {
            console.log('🗑️ Deleting content:', content.id)
            
            const response = await fetch(`/api/baserow/${clientId}/social-media-content/${content.id}`, {
                method: 'DELETE'
            })
            
            if (response.ok) {
                console.log('✅ Content deleted successfully')
                
                // Remove from local state
                setSocialMediaContentForIdea(prev => prev.filter(c => c.id !== content.id))
                
                alert('Post deleted successfully!')
            } else {
                const errorData = await response.json()
                console.error('❌ Delete failed:', errorData)
                alert(`Failed to delete post: ${errorData.error || 'Unknown error'}`)
            }
        } catch (error) {
            console.error('❌ Error deleting content:', error)
            alert('An error occurred while deleting the post.')
        }
    }

    const handleUpdateContent = async (formData: any) => {
        try {
            setIsUpdatingContent(true)
            
            // Check if we're creating new content or updating existing
            const isCreating = !editingContent?.id
            
            // Preserve current page before refresh (only for updates, not creates)
            // Use ref to get the latest value (avoid stale closures)
            const preservedPage = !isCreating ? currentPostPageRef.current : 1
            
            console.log(isCreating ? '📝 Creating content' : '📝 Updating content:', editingContent?.id)
            console.log('📝 Form data received:', formData)
            console.log('📝 Selected idea for social media:', selectedIdeaForSocialMedia)
            console.log('📝 Preserving page:', preservedPage, 'currentPostPage state:', currentPostPage, 'currentPostPageRef:', currentPostPageRef.current)
            
            // Store the page to restore in ref and sessionStorage immediately
            if (!isCreating) {
                pageToRestoreRef.current = preservedPage
                isRefreshingRef.current = true
                // Store in sessionStorage as backup in case refs are lost
                if (typeof window !== 'undefined') {
                    sessionStorage.setItem(`preservePage_${selectedIdeaForSocialMedia?.id}`, preservedPage.toString())
                }
                console.log('📌 DEBUG: Stored preserved page in ref:', preservedPage, 'and sessionStorage')
            }
            
            // Prepare the post data with content idea link for new posts
            const postData = {
                ...formData,
                contentIdea: selectedIdeaForSocialMedia?.id, // Link to the content idea
                contentIdeaTitle: selectedIdeaForSocialMedia?.title
            }
            
            console.log('📝 Post data to send:', postData)
            
            const url = isCreating 
                ? `/api/baserow/${clientId}/social-media-content`
                : `/api/baserow/${clientId}/social-media-content/${editingContent.id}`
            
            const method = isCreating ? 'POST' : 'PATCH'
            
            console.log('📡 Request URL:', url)
            console.log('📡 Request method:', method)
            
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(postData)
            })

            console.log('📡 Response status:', response.status)
            console.log('📡 Response ok:', response.ok)

            if (response.ok) {
                const result = await response.json()
                console.log('✅ Success:', result)
                
                if (isCreating) {
                    // For new content, refresh the posts list (reset to page 1)
                    setCurrentPostPage(1)
                    await handleViewIdea(selectedIdeaForSocialMedia, true)
                    alert('Post created successfully!')
                } else {
                    // For existing content, refetch posts but preserve the current page
                    console.log('🔄 UPDATE FLOW: Starting post refresh, preservedPage:', preservedPage, 'currentPostPage:', currentPostPage, 'currentPostPageRef:', currentPostPageRef.current)
                    
                    if (selectedIdeaForSocialMedia) {
                        // Ensure we have the correct page before refreshing
                        const pageToUse = preservedPage > 1 ? preservedPage : currentPostPageRef.current
                        console.log('🔄 UPDATE FLOW: Starting update - preservedPage:', preservedPage, 'pageToUse:', pageToUse, 'currentPostPage state:', currentPostPage, 'currentPostPageRef:', currentPostPageRef.current)
                        
                        // CRITICAL: Set page state and ref IMMEDIATELY and SYNCHRONOUSLY before any async operations
                        // This must happen before refreshPostsForIdea is called
                        currentPostPageRef.current = pageToUse
                        setCurrentPostPage(pageToUse)
                        
                        // Store in sessionStorage as backup
                        if (typeof window !== 'undefined') {
                            sessionStorage.setItem(`preservePage_${selectedIdeaForSocialMedia.id}`, pageToUse.toString())
                        }
                        
                        console.log('🔄 UPDATE FLOW: Page state set to:', pageToUse, 'ref updated to:', currentPostPageRef.current)
                        
                        // Set refresh flag to prevent page resets during refresh
                        isRefreshingRef.current = true
                        pageToRestoreRef.current = pageToUse
                        
                        // Refresh posts without resetting page
                        await refreshPostsForIdea(selectedIdeaForSocialMedia, pageToUse)
                        
                        // Verify and restore page after refresh completes
                        setTimeout(() => {
                            const savedPage = typeof window !== 'undefined' 
                                ? parseInt(sessionStorage.getItem(`preservePage_${selectedIdeaForSocialMedia.id}`) || String(pageToUse), 10)
                                : pageToUse
                            
                            console.log('🔄 UPDATE FLOW: Post-refresh verification - savedPage:', savedPage, 'currentPostPage:', currentPostPage, 'currentPostPageRef:', currentPostPageRef.current)
                            
                            if (currentPostPageRef.current !== savedPage || currentPostPage !== savedPage) {
                                console.log('⚠️ UPDATE FLOW: Page mismatch detected! Restoring to:', savedPage)
                                currentPostPageRef.current = savedPage
                                setCurrentPostPage(savedPage)
                            } else {
                                console.log('✅ UPDATE FLOW: Page is correct after refresh:', savedPage)
                            }
                            
                            // Clear refresh flags
                            isRefreshingRef.current = false
                            pageToRestoreRef.current = null
                        }, 200)
                    } else {
                        // If no idea selected, just refresh the general list
                        await fetchSocialMediaContent()
                    }
                    alert('Content updated successfully!')
                }
                
                // Don't close modal immediately - wait a moment for page to be restored
                setTimeout(() => {
                    console.log('🔒 DEBUG: Closing modal, currentPostPage:', currentPostPage)
                setShowEditModal(false)
                setEditingContent(null)
                }, 100)
            } else {
                // Try to get error response text first
                const responseText = await response.text()
                console.error('❌ Raw error response:', responseText)
                
                let errorData
                try {
                    errorData = JSON.parse(responseText)
                } catch (e) {
                    errorData = { error: responseText || 'Unknown error' }
                }
                
                console.error('❌ API Error:', errorData)
                console.error('❌ Full error details:', {
                    status: response.status,
                    statusText: response.statusText,
                    errorData
                })
                
                throw new Error(errorData.error || errorData.message || `Failed to ${isCreating ? 'create' : 'update'} content (${response.status})`)
            }
        } catch (error: any) {
            console.error('❌ Error in handleUpdateContent:', error)
            console.error('❌ Error stack:', error.stack)
            alert(`Error ${editingContent?.id ? 'updating' : 'creating'} content: ${error.message || 'Please try again.'}`)
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
                                onEditIdea={handleEditIdea}
                                onDeleteIdea={handleDeleteIdea}
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
                                onSubmit={editingIdea ? handleUpdateIdea : handleCreateIdea}
                                onClose={() => {
                                    setShowForm(false)
                                    setEditingIdea(null)
                                }}
                                clientId={clientId}
                                contentType="social_media_post"
                                initialData={editingIdea}
                                isEditing={!!editingIdea}
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
                                    <Button
                                        onClick={() => {
                                            setEditingContent(null)
                                            setShowEditModal(true)
                                        }}
                                        style={{ backgroundColor: clientConfig.branding.primaryColor }}
                                        className="hover:opacity-90 flex items-center gap-2"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Create Post
                                    </Button>
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
                                        {console.log('📊 DEBUG: Rendering table - currentPostPage:', currentPostPage, 'posts count:', socialMediaContentForIdea.length, 'pageToRestoreRef:', pageToRestoreRef.current)}
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
                                            currentPage={currentPostPage}
                                            onPageChange={(page) => {
                                                console.log('📄 DEBUG: Table onPageChange called - requested:', page, 'current state:', currentPostPage, 'isRefreshing:', isRefreshingRef.current)
                                                // Only allow page changes if we're not in the middle of a refresh
                                                if (!isRefreshingRef.current || page === pageToRestoreRef.current) {
                                                    setCurrentPostPage(page)
                                                } else {
                                                    console.log('🚫 DEBUG: Blocked page change during refresh - requested:', page, 'preserved:', pageToRestoreRef.current)
                                                }
                                            }}
                                            onDelete={handleDeleteContent}
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

                {/* Create/Edit Social Media Content Modal */}
                {showEditModal && (
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
                                isEditing={!!editingContent?.id}
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