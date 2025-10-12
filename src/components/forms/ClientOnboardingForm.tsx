'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
    Building2, 
    Globe, 
    MapPin, 
    Target, 
    Palette, 
    CheckCircle2,
    ArrowRight,
    ArrowLeft
} from 'lucide-react'

const onboardingSchema = z.object({
    // Basic Information
    companyName: z.string().min(1, 'Company name is required'),
    displayName: z.string().min(1, 'Display name is required'),
    industry: z.string().optional(),
    companySize: z.string().optional(),
    foundedYear: z.number().optional(),
    
    // Online Presence
    websiteUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
    blogUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
    facebookUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
    instagramHandle: z.string().optional(),
    linkedinUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
    xHandle: z.string().optional(),
    tiktokHandle: z.string().optional(),
    
    // Location & Contact
    country: z.string().min(1, 'Country is required'),
    city: z.string().optional(),
    timezone: z.string().min(1, 'Timezone is required'),
    primaryContactName: z.string().optional(),
    primaryContactEmail: z.string().email('Must be a valid email').optional().or(z.literal('')),
    primaryContactPhone: z.string().optional(),
    
    // Business Details
    targetAudience: z.string().optional(),
    mainCompetitors: z.string().optional(),
    businessGoals: z.string().optional(),
    
    // Content Preferences
    brandVoice: z.string().optional(),
    postingFrequency: z.string().optional(),
    languages: z.string().optional(),
    primaryBrandColor: z.string().optional(),
    secondaryBrandColor: z.string().optional(),
    accountManager: z.string().optional(),
    monthlyBudget: z.number().optional(),
})

type OnboardingFormData = z.infer<typeof onboardingSchema>

interface ClientOnboardingFormProps {
    onSuccess: (clientId: string) => void
}

export default function ClientOnboardingForm({ onSuccess }: ClientOnboardingFormProps) {
    const [currentStep, setCurrentStep] = useState(1)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const totalSteps = 5

    const {
        register,
        handleSubmit,
        formState: { errors },
        trigger,
        watch,
        getValues
    } = useForm<OnboardingFormData>({
        resolver: zodResolver(onboardingSchema),
        defaultValues: {
            companySize: '11-50 employees',
            country: 'South Africa',
            timezone: 'Africa/Johannesburg',
            brandVoice: 'Professional',
            postingFrequency: '3x per week',
            languages: 'English',
            primaryBrandColor: '#3B82F6',
            secondaryBrandColor: '#10B981'
        }
    })

    const handleNext = async () => {
        const fieldsToValidate = getFieldsForStep(currentStep)
        const isValid = await trigger(fieldsToValidate as any)
        
        if (!isValid) {
            return
        }

        // Save data for current step before moving to next
        setIsSubmitting(true)
        
        try {
            const formData = getValues()
            
            if (currentStep === 1) {
                // Step 1: Initialize client
                console.log('💾 Saving Step 1: Company Details...')
                const response = await fetch('/api/admin/clients/init', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        companyName: formData.companyName,
                        industry: formData.industry,
                        companySize: formData.companySize,
                        foundedYear: formData.foundedYear,
                        websiteUrl: formData.websiteUrl
                    })
                })

                if (!response.ok) {
                    const error = await response.json()
                    throw new Error(error.error || 'Failed to save company details')
                }

                const result = await response.json()
                console.log('✅ Step 1 saved, clientId:', result.clientId)
                
                // Store clientId for subsequent steps
                sessionStorage.setItem('onboardingClientId', result.clientId)
                
            } else if (currentStep >= 2 && currentStep <= 4) {
                // Steps 2-4: Update client info
                const clientId = sessionStorage.getItem('onboardingClientId')
                if (!clientId) {
                    throw new Error('Client ID not found. Please restart from Step 1.')
                }

                console.log(`💾 Saving Step ${currentStep}...`)
                
                let updateData: any = {}
                
                if (currentStep === 2) {
                    // Online Presence
                    updateData = {
                        websiteUrl: formData.websiteUrl,
                        blogUrl: formData.blogUrl,
                        facebookUrl: formData.facebookUrl,
                        instagramHandle: formData.instagramHandle,
                        linkedinUrl: formData.linkedinUrl,
                        xHandle: formData.xHandle,
                        tiktokHandle: formData.tiktokHandle
                    }
                } else if (currentStep === 3) {
                    // Location & Contact
                    updateData = {
                        country: formData.country,
                        city: formData.city,
                        timezone: formData.timezone,
                        primaryContactName: formData.primaryContactName,
                        primaryContactEmail: formData.primaryContactEmail,
                        primaryContactPhone: formData.primaryContactPhone
                    }
                } else if (currentStep === 4) {
                    // Business Details
                    updateData = {
                        targetAudience: formData.targetAudience,
                        mainCompetitors: formData.mainCompetitors,
                        businessGoals: formData.businessGoals,
                        accountManager: formData.accountManager,
                        monthlyBudget: formData.monthlyBudget
                    }
                }

                const response = await fetch(`/api/admin/clients/${clientId}/update-info`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        step: currentStep,
                        data: updateData
                    })
                })

                if (!response.ok) {
                    const error = await response.json()
                    throw new Error(error.error || `Failed to save Step ${currentStep}`)
                }

                console.log(`✅ Step ${currentStep} saved`)
            }

            // Move to next step
            setCurrentStep(prev => Math.min(prev + 1, totalSteps))
            
        } catch (error) {
            console.error('Error saving step:', error)
            alert(`Failed to save step: ${error instanceof Error ? error.message : 'Unknown error'}`)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handlePrevious = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1))
    }

    const handleFinalSubmit = async (data: OnboardingFormData) => {
        setIsSubmitting(true)
        
        try {
            const clientId = sessionStorage.getItem('onboardingClientId')
            if (!clientId) {
                throw new Error('Client ID not found. Please restart onboarding from Step 1.')
            }

            console.log('🎯 Step 5: Creating workspace and finalizing setup...')

            // Update client info with final branding data first
            const response = await fetch(`/api/admin/clients/${clientId}/update-info`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    step: 5,
                    data: {
                        brandVoice: data.brandVoice,
                        postingFrequency: data.postingFrequency,
                        languages: data.languages,
                        primaryBrandColor: data.primaryBrandColor,
                        secondaryBrandColor: data.secondaryBrandColor
                    }
                })
            })

            if (!response.ok) {
                throw new Error('Failed to save branding preferences')
            }

            console.log('✅ Branding preferences saved')

            // Now create the workspace (this will take ~60 seconds)
            console.log('🏗️ Creating Baserow workspace (this may take up to 60 seconds)...')
            
            const createResponse = await fetch('/api/admin/clients/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientName: clientId,
                    displayName: data.displayName || data.companyName,
                    clientInfo: null, // Already saved in Steps 1-4
                    skipClientInfoSteps: true
                })
            })

            if (!createResponse.ok) {
                const error = await createResponse.json()
                throw new Error(error.error || 'Failed to create workspace')
            }

            const result = await createResponse.json()
            console.log('✅ Workspace created successfully:', result)

            // Clear onboarding data
            sessionStorage.removeItem('onboardingClientId')

            // Call success callback
            onSuccess(clientId)
            
        } catch (error) {
            console.error('Error completing onboarding:', error)
            alert(`Failed to complete onboarding: ${error instanceof Error ? error.message : 'Unknown error'}`)
        } finally {
            setIsSubmitting(false)
        }
    }

    const getFieldsForStep = (step: number) => {
        switch (step) {
            case 1:
                return ['companyName', 'displayName', 'industry', 'companySize', 'foundedYear']
            case 2:
                return ['websiteUrl', 'blogUrl', 'facebookUrl', 'instagramHandle', 'linkedinUrl', 'xHandle', 'tiktokHandle']
            case 3:
                return ['country', 'city', 'timezone', 'primaryContactName', 'primaryContactEmail', 'primaryContactPhone']
            case 4:
                return ['targetAudience', 'mainCompetitors', 'businessGoals']
            case 5:
                return ['brandVoice', 'postingFrequency', 'languages', 'primaryBrandColor', 'secondaryBrandColor', 'accountManager', 'monthlyBudget']
            default:
                return []
        }
    }

    const renderStepIndicator = () => (
        <div className="flex items-center justify-between mb-8">
            {[1, 2, 3, 4, 5].map((step) => (
                <div key={step} className="flex items-center flex-1">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                        currentStep >= step 
                            ? 'bg-blue-600 border-blue-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-500'
                    }`}>
                        {currentStep > step ? <CheckCircle2 className="h-5 w-5" /> : step}
                    </div>
                    {step < 5 && (
                        <div className={`flex-1 h-0.5 mx-2 ${
                            currentStep > step ? 'bg-blue-600' : 'bg-gray-300'
                        }`} />
                    )}
                </div>
            ))}
        </div>
    )

    return (
        <form onSubmit={handleSubmit(handleFinalSubmit)} className="space-y-6">
            {renderStepIndicator()}

            {/* Step 1: Company Details */}
            {currentStep === 1 && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-blue-600" />
                            <CardTitle>Company Details</CardTitle>
                        </div>
                        <CardDescription>Tell us about the company</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="companyName">Company Name *</Label>
                                <Input
                                    id="companyName"
                                    {...register('companyName')}
                                    placeholder="JAC Middelburg"
                                />
                                {errors.companyName && (
                                    <p className="text-sm text-red-600">{errors.companyName.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="displayName">Display Name *</Label>
                                <Input
                                    id="displayName"
                                    {...register('displayName')}
                                    placeholder="JAC Middelburg"
                                />
                                {errors.displayName && (
                                    <p className="text-sm text-red-600">{errors.displayName.message}</p>
                                )}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="industry">Industry</Label>
                                <Input
                                    id="industry"
                                    {...register('industry')}
                                    placeholder="e.g., Automotive"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="companySize">Company Size</Label>
                                <select
                                    id="companySize"
                                    {...register('companySize')}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                >
                                    <option value="1-10 employees">1-10 employees</option>
                                    <option value="11-50 employees">11-50 employees</option>
                                    <option value="51-200 employees">51-200 employees</option>
                                    <option value="201-500 employees">201-500 employees</option>
                                    <option value="500+ employees">500+ employees</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="foundedYear">Founded Year</Label>
                                <Input
                                    id="foundedYear"
                                    type="number"
                                    {...register('foundedYear', { valueAsNumber: true })}
                                    placeholder="2010"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Step 2: Online Presence */}
            {currentStep === 2 && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Globe className="h-5 w-5 text-blue-600" />
                            <CardTitle>Online Presence</CardTitle>
                        </div>
                        <CardDescription>Where can we find you online?</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="websiteUrl">Website URL</Label>
                                <Input
                                    id="websiteUrl"
                                    {...register('websiteUrl')}
                                    placeholder="https://example.com"
                                />
                                {errors.websiteUrl && (
                                    <p className="text-sm text-red-600">{errors.websiteUrl.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="blogUrl">Blog URL</Label>
                                <Input
                                    id="blogUrl"
                                    {...register('blogUrl')}
                                    placeholder="https://example.com/blog"
                                />
                                {errors.blogUrl && (
                                    <p className="text-sm text-red-600">{errors.blogUrl.message}</p>
                                )}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="facebookUrl">Facebook Page URL</Label>
                            <Input
                                id="facebookUrl"
                                {...register('facebookUrl')}
                                placeholder="https://facebook.com/yourpage"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="instagramHandle">Instagram Handle</Label>
                                <Input
                                    id="instagramHandle"
                                    {...register('instagramHandle')}
                                    placeholder="@yourcompany"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="xHandle">X (Twitter) Handle</Label>
                                <Input
                                    id="xHandle"
                                    {...register('xHandle')}
                                    placeholder="@yourcompany"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
                                <Input
                                    id="linkedinUrl"
                                    {...register('linkedinUrl')}
                                    placeholder="https://linkedin.com/company/yourcompany"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tiktokHandle">TikTok Handle</Label>
                                <Input
                                    id="tiktokHandle"
                                    {...register('tiktokHandle')}
                                    placeholder="@yourcompany"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Step 3: Location & Contact */}
            {currentStep === 3 && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-blue-600" />
                            <CardTitle>Location & Contact</CardTitle>
                        </div>
                        <CardDescription>Where are you located and how can we reach you?</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="country">Country *</Label>
                                <select
                                    id="country"
                                    {...register('country')}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                >
                                    <option value="South Africa">South Africa</option>
                                    <option value="United States">United States</option>
                                    <option value="United Kingdom">United Kingdom</option>
                                    <option value="Australia">Australia</option>
                                    <option value="Canada">Canada</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="city">City</Label>
                                <Input
                                    id="city"
                                    {...register('city')}
                                    placeholder="Middelburg"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="timezone">Timezone *</Label>
                                <select
                                    id="timezone"
                                    {...register('timezone')}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                >
                                    <option value="Africa/Johannesburg">South Africa (SAST)</option>
                                    <option value="UTC">UTC</option>
                                    <option value="America/New_York">Eastern Time (ET)</option>
                                    <option value="America/Chicago">Central Time (CT)</option>
                                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                                    <option value="Europe/London">London (GMT)</option>
                                    <option value="Australia/Sydney">Sydney (AEST)</option>
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="primaryContactName">Primary Contact Name</Label>
                                <Input
                                    id="primaryContactName"
                                    {...register('primaryContactName')}
                                    placeholder="John Smith"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="primaryContactEmail">Primary Contact Email</Label>
                                <Input
                                    id="primaryContactEmail"
                                    type="email"
                                    {...register('primaryContactEmail')}
                                    placeholder="contact@example.com"
                                />
                                {errors.primaryContactEmail && (
                                    <p className="text-sm text-red-600">{errors.primaryContactEmail.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="primaryContactPhone">Primary Contact Phone</Label>
                                <Input
                                    id="primaryContactPhone"
                                    {...register('primaryContactPhone')}
                                    placeholder="+27 12 345 6789"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Step 4: Business Details */}
            {currentStep === 4 && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Target className="h-5 w-5 text-blue-600" />
                            <CardTitle>Business Details</CardTitle>
                        </div>
                        <CardDescription>Help us understand your business better</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="targetAudience">Target Audience</Label>
                            <Textarea
                                id="targetAudience"
                                {...register('targetAudience')}
                                placeholder="Describe your ideal customers... e.g., Car buyers in Mpumalanga, ages 25-55"
                                rows={3}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="mainCompetitors">Main Competitors</Label>
                            <Textarea
                                id="mainCompetitors"
                                {...register('mainCompetitors')}
                                placeholder="List your main competitors..."
                                rows={3}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="businessGoals">Business Goals</Label>
                            <Textarea
                                id="businessGoals"
                                {...register('businessGoals')}
                                placeholder="What are your main business goals? e.g., Increase brand awareness, Generate leads, etc."
                                rows={3}
                            />
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Step 5: Content & Branding */}
            {currentStep === 5 && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Palette className="h-5 w-5 text-blue-600" />
                            <CardTitle>Content & Branding Preferences</CardTitle>
                        </div>
                        <CardDescription>Define your content strategy and brand identity</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="brandVoice">Brand Voice</Label>
                                <select
                                    id="brandVoice"
                                    {...register('brandVoice')}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                >
                                    <option value="Professional">Professional</option>
                                    <option value="Casual">Casual</option>
                                    <option value="Friendly">Friendly</option>
                                    <option value="Authoritative">Authoritative</option>
                                    <option value="Playful">Playful</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="postingFrequency">Posting Frequency</Label>
                                <Input
                                    id="postingFrequency"
                                    {...register('postingFrequency')}
                                    placeholder="e.g., 3x per week, Daily, etc."
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="languages">Languages</Label>
                                <Input
                                    id="languages"
                                    {...register('languages')}
                                    placeholder="e.g., English, Afrikaans"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="accountManager">Account Manager</Label>
                                <Input
                                    id="accountManager"
                                    {...register('accountManager')}
                                    placeholder="Your name"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="primaryBrandColor">Primary Brand Color</Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="color"
                                        {...register('primaryBrandColor')}
                                        className="w-20 h-10"
                                    />
                                    <Input
                                        {...register('primaryBrandColor')}
                                        placeholder="#3B82F6"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="secondaryBrandColor">Secondary Brand Color</Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="color"
                                        {...register('secondaryBrandColor')}
                                        className="w-20 h-10"
                                    />
                                    <Input
                                        {...register('secondaryBrandColor')}
                                        placeholder="#10B981"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="monthlyBudget">Monthly Budget ($)</Label>
                                <Input
                                    id="monthlyBudget"
                                    type="number"
                                    {...register('monthlyBudget', { valueAsNumber: true })}
                                    placeholder="1000"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center pt-6">
                <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentStep === 1 || isSubmitting}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Previous
                </Button>

                <div className="text-sm text-gray-500">
                    Step {currentStep} of {totalSteps}
                </div>

                {currentStep < totalSteps ? (
                    <Button
                        type="button"
                        onClick={handleNext}
                        disabled={isSubmitting}
                    >
                        Next
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                ) : (
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Creating Workspace (may take 60 seconds)...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Complete Setup & Create Workspace
                            </>
                        )}
                    </Button>
                )}
            </div>

            {/* Progress Summary */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                    {currentStep === 1 && "Let's start with your company details"}
                    {currentStep === 2 && "Where can people find you online?"}
                    {currentStep === 3 && "Where are you located and who should we contact?"}
                    {currentStep === 4 && "Tell us about your business and goals"}
                    {currentStep === 5 && "Final step: Define your content strategy"}
                </p>
            </div>
        </form>
    )
}

