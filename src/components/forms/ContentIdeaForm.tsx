'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Upload, Mic, StopCircle, Image, X, FileText, Video } from 'lucide-react'

const contentIdeaSchema = z.object({
    contentIdea: z.string().min(1, 'Content idea is required'),

    // Social Media specific fields
    platforms: z.array(z.string()).min(1, 'At least one platform is required'),
    informationSource: z.string().optional(),

    // Dynamic fields based on information source
    sourceUrl: z.string().optional(),
    sourceContent: z.string().optional(),

    // Common fields for all information sources
    numberOfPosts: z.number().min(1, 'Number of posts must be at least 1').max(10, 'Maximum 10 posts allowed').optional(),
    targetAudience: z.string().optional(),
    hookFocus: z.string().optional(),
    cta: z.string().optional(),

    // New strategy fields
    contentStrategy: z.string().optional(),
    contentTypeStrategy: z.array(z.string()).optional(),
    primaryObjective: z.string().optional(),
    productUvp: z.string().optional(),

    // Optional fields
    priority: z.enum(['High', 'Medium', 'Low']),
    additionalNotes: z.string().optional()
})

type ContentIdeaFormData = z.infer<typeof contentIdeaSchema>

interface ContentIdeaFormProps {
    onSubmit: (data: ContentIdeaFormData & { voiceFile?: File; imageFile?: File; videoFile?: File }) => Promise<void>
    onClose: () => void
    clientId: string
    contentType: string
    initialData?: any
    isEditing?: boolean
}

export default function ContentIdeaForm({ onSubmit, onClose, clientId, contentType, initialData, isEditing = false }: ContentIdeaFormProps) {
    console.log('DEBUG: ContentIdeaForm rendered with props:', {
        onSubmitType: typeof onSubmit,
        onCloseType: typeof onClose,
        clientId,
        contentType,
        initialData,
        isEditing
    })
    console.log('DEBUG: ContentIdeaForm - onSubmit prop value:', onSubmit)
    console.log('DEBUG: ContentIdeaForm - onSubmit prop stringified:', JSON.stringify(onSubmit, null, 2))
    console.log('DEBUG: ContentIdeaForm - Component is being rendered')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isRecording, setIsRecording] = useState(false)
    const [voiceFile, setVoiceFile] = useState<File | null>(null)
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [videoFile, setVideoFile] = useState<File | null>(null)
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
    const [productUvps, setProductUvps] = useState<Array<{ id: string; name: string }>>([])
    const [loadingUvps, setLoadingUvps] = useState(false)

    const form = useForm<ContentIdeaFormData>({
        resolver: zodResolver(contentIdeaSchema),
        defaultValues: {
            contentIdea: '',
            platforms: [],
            informationSource: '',
            sourceUrl: '',
            sourceContent: '',
            numberOfPosts: 1,
            targetAudience: '',
            hookFocus: '',
            cta: '',
            priority: 'Medium',
            additionalNotes: '',
            contentStrategy: '',
            contentTypeStrategy: [],
            primaryObjective: '',
            productUvp: ''
        }
    })

    // Fetch Product UVPs
    useEffect(() => {
        const fetchProductUvps = async () => {
            setLoadingUvps(true)
            try {
                const response = await fetch(`/api/baserow/${clientId}/product-uvps`)
                if (response.ok) {
                    const data = await response.json()
                    const uvps = data.productUVPs || data.results || []
                    setProductUvps(uvps.map((uvp: any) => ({
                        id: uvp.id?.toString() || '',
                        name: uvp['Product/Service Name'] || uvp.productServiceName || 'Unnamed Product'
                    })))
                }
            } catch (error) {
                console.error('Error fetching Product UVPs:', error)
            } finally {
                setLoadingUvps(false)
            }
        }
        
        fetchProductUvps()
    }, [clientId])

    // Populate form with initial data when editing
    useEffect(() => {
        if (isEditing && initialData) {
            console.log('DEBUG: Populating form with initial data:', initialData)
            
            // Map Baserow field names to form field names
            const formData = {
                contentIdea: initialData.title || initialData.content_idea || '',
                platforms: initialData.platforms || [],
                informationSource: initialData.information_source || initialData.informationSource || '',
                sourceUrl: initialData.source_url || initialData.sourceUrl || '',
                sourceContent: initialData.source_content || initialData.sourceContent || '',
                numberOfPosts: initialData.number_of_posts || initialData.numberOfPosts || 1,
                targetAudience: initialData.target_audience || initialData.targetAudience || '',
                hookFocus: initialData.hook_focus || initialData.hookFocus || '',
                cta: initialData.cta || '',
                priority: initialData.priority || 'Medium',
                additionalNotes: initialData.additional_notes || initialData.additionalNotes || '',
                contentStrategy: initialData.content_strategy || initialData.contentStrategy || '',
                contentTypeStrategy: initialData.content_type_strategy || initialData.contentTypeStrategy || [],
                primaryObjective: initialData.primary_objective || initialData.primaryObjective || '',
                productUvp: initialData.product_uvp || initialData.productUvp || initialData['Product UVP']?.[0]?.id || ''
            }
            
            console.log('DEBUG: Mapped form data:', formData)
            
            // Reset form with the initial data
            form.reset(formData)
        }
    }, [isEditing, initialData, form])

    const selectedInformationSource = form.watch('informationSource')

    // New field options
    const contentStrategyOptions = [
        { value: 'Awareness & Positioning', label: 'Awareness & Positioning' },
        { value: 'Promotion & Sales', label: 'Promotion & Sales' },
        { value: 'Engagement & Community Building', label: 'Engagement & Community Building' },
        { value: 'Retention & Customer Loyalty', label: 'Retention & Customer Loyalty' },
        { value: 'Market & Trend Commentary', label: 'Market & Trend Commentary' },
        { value: 'Partnership & B2B Networking', label: 'Partnership & B2B Networking' },
        { value: 'Educational & Value-First Marketing', label: 'Educational & Value-First Marketing' },
        { value: 'Inspirational & Motivational Content', label: 'Inspirational & Motivational Content' },
        { value: 'Behind-the-Scenes & Transparency', label: 'Behind-the-Scenes & Transparency' },
        { value: 'Crisis Communication & Reputation Management', label: 'Crisis Communication & Reputation Management' },
        { value: 'Seasonal & Event-Driven Marketing', label: 'Seasonal & Event-Driven Marketing' },
        { value: 'User-Generated & Social Proof Content', label: 'User-Generated & Social Proof Content' }
    ]

    const contentTypeStrategyOptions = [
        { value: 'Brand Positioning & Values', label: 'Brand Positioning & Values' },
        { value: 'Thought Leadership & Industry Insights', label: 'Thought Leadership & Industry Insights' },
        { value: 'Educational How-To & Tutorials', label: 'Educational How-To & Tutorials' },
        { value: 'Explainer Content & FAQs', label: 'Explainer Content & FAQs' },
        { value: 'Industry Trend Analysis & Commentary', label: 'Industry Trend Analysis & Commentary' },
        { value: 'Product/Service Advertisement', label: 'Product/Service Advertisement' },
        { value: 'Special Offer & Discount Campaign', label: 'Special Offer & Discount Campaign' },
        { value: 'Feature Spotlight & Deep Dive', label: 'Feature Spotlight & Deep Dive' },
        { value: 'Comparison & Competitive Analysis', label: 'Comparison & Competitive Analysis' },
        { value: 'Urgency & Scarcity-Driven Content', label: 'Urgency & Scarcity-Driven Content' },
        { value: 'Interactive Polls & Surveys', label: 'Interactive Polls & Surveys' },
        { value: 'User-Generated Content Campaign', label: 'User-Generated Content Campaign' },
        { value: 'Community Building & Networking', label: 'Community Building & Networking' },
        { value: 'Contest & Giveaway Promotion', label: 'Contest & Giveaway Promotion' },
        { value: 'Q&A & Live Discussion', label: 'Q&A & Live Discussion' },
        { value: 'Customer Success Story & Case Study', label: 'Customer Success Story & Case Study' },
        { value: 'Product Tips & Advanced Usage', label: 'Product Tips & Advanced Usage' },
        { value: 'Customer Appreciation & Milestones', label: 'Customer Appreciation & Milestones' },
        { value: 'Testimonial & Review Showcase', label: 'Testimonial & Review Showcase' },
        { value: 'Onboarding & Support Content', label: 'Onboarding & Support Content' },
        { value: 'Breaking News & Reactive Marketing', label: 'Breaking News & Reactive Marketing' },
        { value: 'Seasonal & Holiday Tie-ins', label: 'Seasonal & Holiday Tie-ins' },
        { value: 'Event Promotion & Live Coverage', label: 'Event Promotion & Live Coverage' },
        { value: 'Public Relations & Announcements', label: 'Public Relations & Announcements' },
        { value: 'Partnership & Collaboration Invitation', label: 'Partnership & Collaboration Invitation' }
    ]

    const primaryObjectiveOptions = [
        { value: 'Build Brand Awareness & Recognition', label: 'Build Brand Awareness & Recognition' },
        { value: 'Generate Leads & Drive Conversions', label: 'Generate Leads & Drive Conversions' },
        { value: 'Educate & Inform Target Audience', label: 'Educate & Inform Target Audience' },
        { value: 'Increase Engagement & Community Building', label: 'Increase Engagement & Community Building' },
        { value: 'Establish Thought Leadership & Authority', label: 'Establish Thought Leadership & Authority' },
        { value: 'Drive Website Traffic & Click-throughs', label: 'Drive Website Traffic & Click-throughs' },
        { value: 'Boost Customer Retention & Loyalty', label: 'Boost Customer Retention & Loyalty' },
        { value: 'Support & Nurture Existing Customers', label: 'Support & Nurture Existing Customers' },
        { value: 'Attract Strategic Partnerships & Collaborations', label: 'Attract Strategic Partnerships & Collaborations' },
        { value: 'Create Viral Content & Expand Reach', label: 'Create Viral Content & Expand Reach' }
    ]

    // Content type options
    const contentTypes = [
        { value: 'blog_post', label: 'Blog Post' },
        { value: 'social_media_post', label: 'Social Media Post' },
        { value: 'video_content', label: 'Video Content' },
        { value: 'email_campaign', label: 'Email Campaign' },
        { value: 'product_uvp', label: 'Product UVP' },
        { value: 'content_focus_plan', label: 'Content Focus Plan' },
        { value: 'image_content', label: 'Image/Graphic Content' },
        { value: 'voice_content', label: 'Voice/Audio Content' },
        { value: 'other', label: 'Other' }
    ]

    // Dynamic source options based on content type
    const getSourceOptions = (contentType: string) => {
        switch (contentType) {
            case 'blog_post':
                return [
                    { value: 'url', label: 'Create from URL/Article' },
                    { value: 'manual', label: 'Provide topic/idea manually' },
                    { value: 'voice', label: 'Voice note explanation' }
                ]
            case 'social_media_post':
                return [
                    { value: 'manual', label: 'Provide idea manually' },
                    { value: 'url', label: 'Base on URL/Reference' },
                    { value: 'voice', label: 'Voice note explanation' },
                    { value: 'image', label: 'Create from image' }
                ]
            case 'video_content':
                return [
                    { value: 'manual', label: 'Provide script/concept' },
                    { value: 'voice', label: 'Voice note explanation' },
                    { value: 'url', label: 'Base on reference content' }
                ]
            case 'email_campaign':
                return [
                    { value: 'manual', label: 'Provide campaign details' },
                    { value: 'template', label: 'Use existing template' },
                    { value: 'voice', label: 'Voice note explanation' }
                ]
            case 'product_uvp':
                return [
                    { value: 'manual', label: 'Provide product details' },
                    { value: 'voice', label: 'Voice explanation of product' }
                ]
            case 'content_focus_plan':
                return [
                    { value: 'manual', label: 'Provide focus plan details' },
                    { value: 'voice', label: 'Voice explanation of strategy' }
                ]
            default:
                return [
                    { value: 'manual', label: 'Provide details manually' },
                    { value: 'voice', label: 'Voice note explanation' },
                    { value: 'url', label: 'Reference URL' }
                ]
        }
    }

    // Voice recording functions
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const recorder = new MediaRecorder(stream)
            const chunks: Blob[] = []

            recorder.ondataavailable = (e) => chunks.push(e.data)
            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'audio/webm' })
                const file = new File([blob], `voice-note-${Date.now()}.webm`, { type: 'audio/webm' })
                setVoiceFile(file)
                stream.getTracks().forEach(track => track.stop())
            }

            recorder.start()
            setMediaRecorder(recorder)
            setIsRecording(true)
        } catch (error) {
            console.error('Error starting recording:', error)
            alert('Unable to access microphone. Please check permissions.')
        }
    }

    const stopRecording = () => {
        if (mediaRecorder) {
            mediaRecorder.stop()
            setIsRecording(false)
            setMediaRecorder(null)
        }
    }

    const handleSubmit = async (data: ContentIdeaFormData) => {
        console.log('DEBUG: handleSubmit called with data:', data)
        console.log('DEBUG: handleSubmit - onSubmit prop type:', typeof onSubmit)
        console.log('DEBUG: handleSubmit - onSubmit prop value:', onSubmit)
        console.log('Form data being submitted:', data)
        console.log('Selected information source:', selectedInformationSource)
        console.log('Voice file:', voiceFile)
        console.log('Image file:', imageFile)
        console.log('Video file:', videoFile)

        // Transform URL to add https:// if missing
        let transformedData = { ...data }
        if (transformedData.sourceUrl && transformedData.sourceUrl.trim()) {
            const url = transformedData.sourceUrl.trim()
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                transformedData.sourceUrl = `https://${url}`
            }
        }

        setIsSubmitting(true)
        console.log('DEBUG: About to call onSubmit with data:', {
            ...transformedData,
            voiceFile: voiceFile || undefined,
            imageFile: imageFile || undefined,
            videoFile: videoFile || undefined
        })
        
        try {
            console.log('DEBUG: About to call onSubmit prop with data:', {
                ...transformedData,
                voiceFile: voiceFile || undefined,
                imageFile: imageFile || undefined,
                videoFile: videoFile || undefined
            })
            console.log('DEBUG: onSubmit prop type:', typeof onSubmit)
            console.log('DEBUG: onSubmit prop value:', onSubmit)
            
            if (typeof onSubmit === 'function') {
                await onSubmit({
                    ...transformedData,
                    voiceFile: voiceFile || undefined,
                    imageFile: imageFile || undefined,
                    videoFile: videoFile || undefined
                })
                console.log('DEBUG: onSubmit completed successfully')
            } else {
                console.error('DEBUG: onSubmit prop is not a function:', onSubmit)
            }
        } catch (error) {
            console.error('Error submitting form:', error)
            console.error('Error details:', {
                message: error.message,
                stack: error.stack
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>
                    {isEditing ? 'Edit Social Media Content Idea' : 'Create Social Media Content Idea'}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={(e) => {
                        console.log('DEBUG: Form submit event triggered')
                        form.handleSubmit(handleSubmit)(e)
                    }} className="space-y-6">

                        {/* Content Idea - Main input */}
                        <FormField<ContentIdeaFormData>
                            control={form.control}
                            name="contentIdea"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Content Idea</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Describe your content idea..."
                                            className="min-h-[80px]"
                                            value={field.value || ''}
                                            onChange={field.onChange}
                                            onBlur={field.onBlur}
                                            name={field.name}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Content Type Header - Show selected type */}
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <h3 className="text-lg font-semibold text-blue-900 flex items-center gap-2">
                                <Image className="h-5 w-5" />
                                Social Media Content Idea
                            </h3>
                            <p className="text-blue-700 text-sm mt-1">
                                Create engaging social media content for your audience
                            </p>
                        </div>

                        {/* Platform Multi-Selection */}
                        <FormField<ContentIdeaFormData>
                            control={form.control}
                            name="platforms"
                            render={({ field }) => {
                                const platformOptions = [
                                    { value: 'Facebook', label: 'Facebook' },
                                    { value: 'Instagram', label: 'Instagram' },
                                    { value: 'X', label: 'X' },
                                    { value: 'LinkedIn', label: 'LinkedIn' },
                                    { value: 'Pinterest', label: 'Pinterest' },
                                    { value: 'Snapchat', label: 'Snapchat' },
                                    { value: 'Reddit', label: 'Reddit' }
                                ]

                                const selectedPlatforms = Array.isArray(field.value) ? field.value : []

                                const togglePlatform = (platform: string) => {
                                    const newPlatforms = selectedPlatforms.includes(platform)
                                        ? selectedPlatforms.filter(p => p !== platform)
                                        : [...selectedPlatforms, platform]
                                    field.onChange(newPlatforms)
                                }

                                return (
                                    <FormItem>
                                        <FormLabel>Social Media Platforms</FormLabel>
                                        <FormControl>
                                            <div className="space-y-3">
                                                {/* Selected platforms display */}
                                                {selectedPlatforms.length > 0 && (
                                                    <div className="flex flex-wrap gap-2">
                                                        {selectedPlatforms.map(platform => {
                                                            const option = platformOptions.find(opt => opt.value === platform)
                                                            return (
                                                                <Badge key={platform} variant="secondary" className="flex items-center gap-1">
                                                                    {option?.label}
                                                                    <X
                                                                        className="h-3 w-3 cursor-pointer hover:text-red-500"
                                                                        onClick={() => togglePlatform(platform)}
                                                                    />
                                                                </Badge>
                                                            )
                                                        })}
                                                    </div>
                                                )}

                                                {/* Platform selection dropdown */}
                                                <Select onValueChange={togglePlatform}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Add platforms..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {platformOptions
                                                            .filter(option => !selectedPlatforms.includes(option.value))
                                                            .map(option => (
                                                                <SelectItem key={option.value} value={option.value}>
                                                                    {option.label}
                                                                </SelectItem>
                                                            ))
                                                        }
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )
                            }}
                        />

                        {/* Information Source Selection */}
                        <FormField<ContentIdeaFormData>
                            control={form.control}
                            name="informationSource"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Provide Information As</FormLabel>
                                    <FormControl>
                                        <RadioGroup
                                            onValueChange={field.onChange}
                                            value={typeof field.value === 'string' ? field.value : ''}
                                            className="grid grid-cols-2 gap-3"
                                        >
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="voice_note" id="voice_note" />
                                                <Label htmlFor="voice_note" className="flex items-center gap-2 cursor-pointer">
                                                    <Mic className="h-4 w-4" />
                                                    Voice Note
                                                </Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="url" id="url" />
                                                <Label htmlFor="url" className="flex items-center gap-2 cursor-pointer">
                                                    <Upload className="h-4 w-4" />
                                                    URL
                                                </Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="image" id="image" />
                                                <Label htmlFor="image" className="flex items-center gap-2 cursor-pointer">
                                                    <Image className="h-4 w-4" />
                                                    Image
                                                </Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="text_idea" id="text_idea" />
                                                <Label htmlFor="text_idea" className="flex items-center gap-2 cursor-pointer">
                                                    <FileText className="h-4 w-4" />
                                                    Text Idea
                                                </Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="video" id="video" />
                                                <Label htmlFor="video" className="flex items-center gap-2 cursor-pointer">
                                                    <Video className="h-4 w-4" />
                                                    Video Upload
                                                </Label>
                                            </div>
                                        </RadioGroup>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Dynamic Fields Based on Information Source */}
                        {true && (
                            <div className="space-y-6 p-4 bg-gray-50 rounded-lg">
                                <h3 className="font-semibold text-gray-900">Content Details</h3>

                                {/* Source-specific fields */}
                                {selectedInformationSource === 'url' && (
                                    <FormField<ContentIdeaFormData>
                                        control={form.control}
                                        name="sourceUrl"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Reference URL</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="example.com or https://example.com"
                                                        type="text"
                                                        value={field.value || ''}
                                                        onChange={field.onChange}
                                                        onBlur={field.onBlur}
                                                        name={field.name}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}

                                {selectedInformationSource === 'voice_note' && (
                                    <div className="space-y-4">
                                        <Label>Voice Note</Label>
                                        <div className="flex flex-col gap-4">
                                            {/* Record Voice Note */}
                                            <div className="flex items-center gap-4">
                                                {!isRecording ? (
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={startRecording}
                                                        className="flex items-center gap-2"
                                                    >
                                                        <Mic className="h-4 w-4" />
                                                        Start Recording
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        onClick={stopRecording}
                                                        className="flex items-center gap-2"
                                                    >
                                                        <StopCircle className="h-4 w-4" />
                                                        Stop Recording
                                                    </Button>
                                                )}
                                                {isRecording && (
                                                    <span className="text-sm text-red-500 animate-pulse">Recording...</span>
                                                )}
                                            </div>

                                            {/* Upload Voice File */}
                                            <div className="text-center">
                                                <span className="text-sm text-muted-foreground">or</span>
                                            </div>

                                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                                                <div className="text-center">
                                                    <Upload className="mx-auto h-8 w-8 text-gray-400" />
                                                    <div className="mt-2">
                                                        <label htmlFor="voice-upload" className="cursor-pointer">
                                                            <span className="text-sm font-medium text-gray-900">
                                                                Upload voice note
                                                            </span>
                                                            <input
                                                                id="voice-upload"
                                                                name="voice-upload"
                                                                type="file"
                                                                className="sr-only"
                                                                accept="audio/*"
                                                                onChange={(e) => {
                                                                    if (e.target.files && e.target.files[0]) {
                                                                        setVoiceFile(e.target.files[0])
                                                                    }
                                                                }}
                                                            />
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>

                                            {voiceFile && (
                                                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                                    <p className="text-sm text-green-800">
                                                        Voice file: {voiceFile.name}
                                                    </p>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setVoiceFile(null)}
                                                        className="text-red-600 hover:text-red-800"
                                                    >
                                                        Remove
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {selectedInformationSource === 'image' && (
                                    <div className="space-y-4">
                                        <Label>Upload Image</Label>
                                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                                            <div className="text-center">
                                                <Image className="mx-auto h-8 w-8 text-gray-400" />
                                                <div className="mt-2">
                                                    <label htmlFor="image-upload" className="cursor-pointer">
                                                        <span className="text-sm font-medium text-gray-900">
                                                            Upload image
                                                        </span>
                                                        <input
                                                            id="image-upload"
                                                            name="image-upload"
                                                            type="file"
                                                            className="sr-only"
                                                            accept="image/*"
                                                            onChange={(e) => {
                                                                if (e.target.files && e.target.files[0]) {
                                                                    setImageFile(e.target.files[0])
                                                                }
                                                            }}
                                                        />
                                                    </label>
                                                </div>
                                            </div>
                                        </div>

                                        {imageFile && (
                                            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                                <p className="text-sm text-green-800">
                                                    Image file: {imageFile.name}
                                                </p>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setImageFile(null)}
                                                    className="text-red-600 hover:text-red-800"
                                                >
                                                    Remove
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {selectedInformationSource === 'text_idea' && (
                                    <FormField<ContentIdeaFormData>
                                        control={form.control}
                                        name="sourceContent"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Source Content</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Paste or type the text content you want to transform into social media posts (e.g., blog excerpt, product description, news article, etc.)"
                                                        className="min-h-[120px]"
                                                        value={field.value || ''}
                                                        onChange={field.onChange}
                                                        onBlur={field.onBlur}
                                                        name={field.name}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}

                                {selectedInformationSource === 'video' && (
                                    <div className="space-y-4">
                                        <Label>Upload Video</Label>
                                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                                            <div className="text-center">
                                                <Video className="mx-auto h-8 w-8 text-gray-400" />
                                                <div className="mt-2">
                                                    <label htmlFor="video-upload" className="cursor-pointer">
                                                        <span className="text-sm font-medium text-gray-900">
                                                            Upload video
                                                        </span>
                                                        <input
                                                            id="video-upload"
                                                            name="video-upload"
                                                            type="file"
                                                            className="sr-only"
                                                            accept="video/*"
                                                            onChange={(e) => {
                                                                if (e.target.files && e.target.files[0]) {
                                                                    setVideoFile(e.target.files[0])
                                                                }
                                                            }}
                                                        />
                                                    </label>
                                                </div>
                                            </div>
                                        </div>

                                        {videoFile && (
                                            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                                <p className="text-sm text-green-800">
                                                    Video file: {videoFile.name}
                                                </p>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setVideoFile(null)}
                                                    className="text-red-600 hover:text-red-800"
                                                >
                                                    Remove
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Common fields for all information sources */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField<ContentIdeaFormData>
                                        control={form.control}
                                        name="numberOfPosts"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Number of Posts</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        max="10"
                                                        placeholder="1"
                                                        value={field.value || 1}
                                                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                                                        onBlur={field.onBlur}
                                                        name={field.name}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField<ContentIdeaFormData>
                                        control={form.control}
                                        name="targetAudience"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Target Audience</FormLabel>
                                                <Select onValueChange={field.onChange} value={typeof field.value === 'string' ? field.value : ''}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select audience" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="young_adults">Young Adults (18-25)</SelectItem>
                                                        <SelectItem value="millennials">Millennials (26-40)</SelectItem>
                                                        <SelectItem value="gen_x">Gen X (41-55)</SelectItem>
                                                        <SelectItem value="professionals">Working Professionals</SelectItem>
                                                        <SelectItem value="entrepreneurs">Entrepreneurs & Business Owners</SelectItem>
                                                        <SelectItem value="students">Students</SelectItem>
                                                        <SelectItem value="parents">Parents & Families</SelectItem>
                                                        <SelectItem value="general_audience">General Audience</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField<ContentIdeaFormData>
                                    control={form.control}
                                    name="hookFocus"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Hook/Focus</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="What's the main hook or focus of this content? What will grab attention?"
                                                    className="min-h-[80px]"
                                                    value={field.value || ''}
                                                    onChange={field.onChange}
                                                    onBlur={field.onBlur}
                                                    name={field.name}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField<ContentIdeaFormData>
                                    control={form.control}
                                    name="cta"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Call to Action (CTA)</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="What action should users take? (e.g., Visit our website, Sign up, Comment below)"
                                                    value={field.value || ''}
                                                    onChange={field.onChange}
                                                    onBlur={field.onBlur}
                                                    name={field.name}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* New Strategy Fields */}
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-gray-900">Content Strategy</h3>
                                    
                                    {/* Content Strategy */}
                                    <FormField<ContentIdeaFormData>
                                        control={form.control}
                                        name="contentStrategy"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Content Strategy</FormLabel>
                                                <Select onValueChange={field.onChange} value={typeof field.value === 'string' ? field.value : ''}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select content strategy" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {contentStrategyOptions.map((option) => (
                                                            <SelectItem key={option.value} value={option.value}>
                                                                {option.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Content Type Strategy */}
                                    <FormField<ContentIdeaFormData>
                                        control={form.control}
                                        name="contentTypeStrategy"
                                        render={({ field }) => {
                                            const selectedStrategies = Array.isArray(field.value) ? field.value : []

                                            const toggleStrategy = (strategy: string) => {
                                                const newStrategies = selectedStrategies.includes(strategy)
                                                    ? selectedStrategies.filter(s => s !== strategy)
                                                    : [...selectedStrategies, strategy]
                                                field.onChange(newStrategies)
                                            }

                                            return (
                                                <FormItem>
                                                    <FormLabel>Content Type Strategy</FormLabel>
                                                    <FormControl>
                                                        <div className="space-y-3">
                                                            {/* Selected strategies display */}
                                                            {selectedStrategies.length > 0 && (
                                                                <div className="flex flex-wrap gap-2">
                                                                    {selectedStrategies.map(strategy => {
                                                                        const option = contentTypeStrategyOptions.find(opt => opt.value === strategy)
                                                                        return (
                                                                            <Badge key={strategy} variant="secondary" className="flex items-center gap-1">
                                                                                {option?.label}
                                                                                <X
                                                                                    className="h-3 w-3 cursor-pointer hover:text-red-500"
                                                                                    onClick={() => toggleStrategy(strategy)}
                                                                                />
                                                                            </Badge>
                                                                        )
                                                                    })}
                                                                </div>
                                                            )}

                                                            {/* Strategy selection dropdown */}
                                                            <Select onValueChange={toggleStrategy}>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Add content type strategies..." />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {contentTypeStrategyOptions
                                                                        .filter(option => !selectedStrategies.includes(option.value))
                                                                        .map(option => (
                                                                            <SelectItem key={option.value} value={option.value}>
                                                                                {option.label}
                                                                            </SelectItem>
                                                                        ))
                                                                    }
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )
                                        }}
                                    />

                                    {/* Primary Objective */}
                                    <FormField<ContentIdeaFormData>
                                        control={form.control}
                                        name="primaryObjective"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Primary Objective</FormLabel>
                                                <Select onValueChange={field.onChange} value={typeof field.value === 'string' ? field.value : ''}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select primary objective" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {primaryObjectiveOptions.map((option) => (
                                                            <SelectItem key={option.value} value={option.value}>
                                                                {option.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Product UVP */}
                                    <FormField<ContentIdeaFormData>
                                        control={form.control}
                                        name="productUvp"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Product/Service UVP (Optional)</FormLabel>
                                                <Select 
                                                    onValueChange={(value) => {
                                                        // Convert "none" back to empty string
                                                        field.onChange(value === 'none' ? '' : value)
                                                    }} 
                                                    value={field.value || 'none'} 
                                                    disabled={loadingUvps}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder={loadingUvps ? "Loading products..." : "Select product/service"} />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="none">None</SelectItem>
                                                        {productUvps.map((uvp) => (
                                                            <SelectItem key={uvp.id} value={uvp.id}>
                                                                {uvp.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Additional Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField<ContentIdeaFormData>
                                control={form.control}
                                name="priority"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Priority</FormLabel>
                                        <Select onValueChange={field.onChange} value={typeof field.value === 'string' ? field.value : 'Medium'}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select priority" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="High">High</SelectItem>
                                                <SelectItem value="Medium">Medium</SelectItem>
                                                <SelectItem value="Low">Low</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField<ContentIdeaFormData>
                            control={form.control}
                            name="additionalNotes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Additional Notes (Optional)</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Any additional context, requirements, or notes..."
                                            value={field.value || ''}
                                            onChange={field.onChange}
                                            onBlur={field.onBlur}
                                            name={field.name}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Form Actions */}
                        <div className="flex gap-4">
                            <Button type="submit" disabled={isSubmitting} className="flex-1">
                                {isSubmitting ? (isEditing ? 'Updating Content Idea...' : 'Creating Content Idea...') : (isEditing ? 'Update Content Idea' : 'Create Content Idea')}
                            </Button>
                            <Button type="button" variant="outline" onClick={onClose}>
                                Cancel
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}