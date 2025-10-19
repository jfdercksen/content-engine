'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useClientConfig } from '@/hooks/useClientConfig'
import BrandAssetsTable from '@/components/tables/BrandAssetsTable'
import BrandAssetForm from '@/components/forms/BrandAssetForm'
import GenerateBrandAssetForm from '@/components/forms/GenerateBrandAssetForm'
import ClientOnly from '@/components/ClientOnly'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft, 
  Plus, 
  Palette, 
  TrendingUp, 
  Archive, 
  Users,
  FileText,
  Image as ImageIcon,
  Type,
  Layout,
  Mic,
  AlertTriangle,
  Sparkles
} from 'lucide-react'
import { BrandAsset, BrandAssetFormData } from '@/lib/types/content'

export default function BrandAssetsPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.clientId as string
  const [brandAssets, setBrandAssets] = useState<BrandAsset[]>([])
  const [showForm, setShowForm] = useState(false)
  const [showGenerateForm, setShowGenerateForm] = useState(false)
  const [editingAsset, setEditingAsset] = useState<BrandAsset | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    byPlatform: {} as Record<string, number>,
    byAssetType: {} as Record<string, number>,
    byStatus: {} as Record<string, number>,
    byPriority: {} as Record<string, number>,
    active: 0,
    highPriority: 0
  })
  
  const { clientConfig, isLoading: configLoading, error: configError } = useClientConfig(clientId)

  // Move useEffect to the top to avoid hooks order issues
  useEffect(() => {
    if (clientConfig) {
      fetchBrandAssets()
    }
  }, [clientId, clientConfig])

  const fetchBrandAssets = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/baserow/${clientId}/brand-assets`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch brand assets')
      }
      
      const data = await response.json()
      const assets = data.results || []
      setBrandAssets(assets)
      
      // Calculate stats
      const newStats = {
        total: assets.length,
        byPlatform: {} as Record<string, number>,
        byAssetType: {} as Record<string, number>,
        byStatus: {} as Record<string, number>,
        byPriority: {} as Record<string, number>,
        active: 0,
        highPriority: 0
      }
      
      assets.forEach((asset: any) => {
        // Use the mapped field names (lowercase) that the API provides
        const platformValue = asset.platform
        const assetTypeValue = asset.assettype
        const statusValue = asset.status
        const priorityValue = asset.priority
        
        // Platform stats
        newStats.byPlatform[platformValue] = (newStats.byPlatform[platformValue] || 0) + 1
        
        // Asset type stats
        newStats.byAssetType[assetTypeValue] = (newStats.byAssetType[assetTypeValue] || 0) + 1
        
        // Status stats
        newStats.byStatus[statusValue] = (newStats.byStatus[statusValue] || 0) + 1
        
        // Priority stats
        newStats.byPriority[priorityValue] = (newStats.byPriority[priorityValue] || 0) + 1
        
        // Active and high priority counts
        if (statusValue && statusValue.toLowerCase() === 'active') newStats.active++
        if (priorityValue && priorityValue.toLowerCase() === 'high') newStats.highPriority++
      })
      
      setStats(newStats)
    } catch (error) {
      console.error('Error fetching brand assets:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Map form field names to API field names
  const mapFormDataToApiFields = (formData: BrandAssetFormData) => {
    return {
      assetname: formData.assetName,
      platform: formData.platform,
      contenttype: formData.contentType,
      assettype: formData.assetType,
      assetinformation: formData.assetInformation,
      brandvoiceguidelines: formData.brandVoiceGuidelines,
      approvedhashtags: formData.approvedHashtags,
      'tone/stylepreferences': formData.toneStylePreferences,
      'forbiddenwords/topics': formData.forbiddenWordsTopics,
      'platform-specificrules': formData.platformSpecificRules,
      assetnotes: formData.notes,
      fileurl: formData.fileUrl,
      file: formData.file,
      status: formData.status,
      priority: formData.priority
    }
  }

  const handleCreateAsset = async (formData: BrandAssetFormData) => {
    try {
      // Send original form data to API route (API route will handle mapping)
      
      // If there's a file, we need to use FormData
      let requestBody: any
      let headers: any = {}

      if (formData.file) {
        const formDataObj = new FormData()
        Object.entries(formData).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (key === 'file' && value instanceof File) {
              formDataObj.append(key, value)
            } else {
              formDataObj.append(key, value.toString())
            }
          }
        })
        requestBody = formDataObj
      } else {
        headers['Content-Type'] = 'application/json'
        requestBody = JSON.stringify(formData)
      }

      const response = await fetch(`/api/baserow/${clientId}/brand-assets`, {
        method: 'POST',
        headers,
        body: requestBody
      })

      if (!response.ok) {
        throw new Error('Failed to create brand asset')
      }

      await fetchBrandAssets()
      setShowForm(false)
      
      // Show success message
      alert('Brand asset created successfully!')
    } catch (error) {
      console.error('Error creating brand asset:', error)
      alert('Error creating brand asset. Please try again.')
    }
  }

  const handleEditAsset = async (formData: BrandAssetFormData) => {
    console.log('🔄 handleEditAsset called')
    console.log('📝 Editing asset ID:', editingAsset?.id)
    console.log('📋 Form data received:', formData)
    
    if (!editingAsset) {
      console.error('❌ No editing asset found!')
      return
    }

    try {
      // Send original form data to API route (API route will handle mapping)
      
      // If there's a file, we need to use FormData
      let requestBody: any
      let headers: any = {}

      if (formData.file) {
        console.log('📎 File detected, using FormData')
        const formDataObj = new FormData()
        Object.entries(formData).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (key === 'file' && value instanceof File) {
              formDataObj.append(key, value)
            } else {
              formDataObj.append(key, value.toString())
            }
          }
        })
        requestBody = formDataObj
      } else {
        console.log('📝 No file, using JSON')
        headers['Content-Type'] = 'application/json'
        requestBody = JSON.stringify(formData)
      }

      console.log('🌐 Sending PATCH request to:', `/api/baserow/${clientId}/brand-assets/${editingAsset.id}`)
      const response = await fetch(`/api/baserow/${clientId}/brand-assets/${editingAsset.id}`, {
        method: 'PATCH',
        headers,
        body: requestBody
      })

      console.log('📡 Response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Update failed:', errorText)
        throw new Error('Failed to update brand asset')
      }

      const result = await response.json()
      console.log('✅ Update successful:', result)

      await fetchBrandAssets()
      setEditingAsset(null)
      setShowForm(false)
      
      // Show success message
      alert('Brand asset updated successfully!')
    } catch (error) {
      console.error('❌ Error updating brand asset:', error)
      alert('Error updating brand asset. Please try again.')
    }
  }

  const handleDeleteAsset = async (assetId: string) => {
    if (!confirm('Are you sure you want to delete this brand asset? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/baserow/${clientId}/brand-assets/${assetId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete brand asset')
      }

      await fetchBrandAssets()
      alert('Brand asset deleted successfully!')
    } catch (error) {
      console.error('Error deleting brand asset:', error)
      alert('Error deleting brand asset. Please try again.')
    }
  }

  const handleViewAsset = (asset: BrandAsset) => {
    // For now, just show an alert with asset details
    // In the future, this could open a detailed view modal
    const details = [
      `Name: ${asset.assetName}`,
      `Type: ${asset.assetType}`,
      `Platform: ${asset.platform}`,
      `Status: ${asset.status}`,
      `Priority: ${asset.priority}`,
              asset.assetInformation ? `Content: ${asset.assetInformation.substring(0, 200)}...` : '',
      asset.notes ? `Notes: ${asset.notes.substring(0, 100)}...` : ''
    ].filter(Boolean).join('\n\n')
    
    alert(`Brand Asset Details:\n\n${details}`)
  }

  const handleEditClick = (asset: BrandAsset) => {
    setEditingAsset(asset)
    setShowForm(true)
  }

  const handleGenerateAsset = async (formData: any) => {
    try {
             // First, create the brand asset in Baserow with basic information
       const basicAssetData = {
         assetName: formData.assetName,
         platform: Array.isArray(formData.platform) ? formData.platform : [formData.platform],
         contentType: formData.contentType,
         assetType: formData.assetType,
         assetInformation: formData.assetInformation || '',
         brandVoiceGuidelines: formData.brandVoiceGuidelines || '',
         approvedHashtags: formData.approvedHashtags || '',
         forbiddenWordsTopics: formData.forbiddenWordsTopics || '',
         platformSpecificRules: formData.platformSpecificRules || '',
         fileUrl: formData.fileUrl || '',
         status: 'Draft', // Start as draft while AI processes
         priority: 'Medium',
         notes: formData.notes ? `AI generation in progress...\n\nUser Notes: ${formData.notes}` : 'AI generation in progress...'
       }

      // If there's a file, we need to use FormData
      let requestBody: any
      let headers: any = {}

      if (formData.file) {
        const formDataObj = new FormData()
        Object.entries(basicAssetData).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            formDataObj.append(key, value.toString())
          }
        })
        formDataObj.append('file', formData.file)
        requestBody = formDataObj
      } else {
        headers['Content-Type'] = 'application/json'
        requestBody = JSON.stringify(basicAssetData)
      }

      // Create the asset in Baserow
      const createResponse = await fetch(`/api/baserow/${clientId}/brand-assets`, {
        method: 'POST',
        headers,
        body: requestBody
      })

      if (!createResponse.ok) {
        throw new Error('Failed to create brand asset')
      }

             const createResult = await createResponse.json()
       const newAssetId = createResult.id // This is the Baserow row ID

       // Now send the data to our API endpoint which will handle the n8n webhook call
       const webhookResponse = await fetch('/api/brand-asset-generator', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
         },
         body: JSON.stringify({
           formData,
           newAssetId,
           clientId,
           clientConfig
         })
       })

       if (!webhookResponse.ok) {
         throw new Error('Failed to send generation request to AI workflow')
       }

      // Close the form and show success message
      setShowGenerateForm(false)
      alert(`Brand asset created successfully! AI generation started for asset ID: ${newAssetId}. The asset will be updated with AI-generated content shortly.`)
      
      // Refresh the assets list to show the new asset
      await fetchBrandAssets()
      
    } catch (error) {
      console.error('Error generating brand asset:', error)
      alert('Error creating brand asset. Please try again.')
    }
  }

  const getAssetTypeIcon = (assetType: string) => {
    switch (assetType.toLowerCase()) {
      case 'brand voice': return <Mic className="h-4 w-4" />
      case 'visual asset': return <ImageIcon className="h-4 w-4" />
      case 'template': return <Layout className="h-4 w-4" />
      case 'guidelines': return <FileText className="h-4 w-4" />
      case 'logo': return <ImageIcon className="h-4 w-4" />
      case 'color palette': return <Palette className="h-4 w-4" />
      case 'font': return <Type className="h-4 w-4" />
      case 'style guide': return <FileText className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  // Filter assets by platform for tabs
  const getAssetsByPlatform = (platform: string) => {
    if (platform === 'all') return brandAssets
    return brandAssets.filter(asset => {
      // Use the mapped platform field directly
      const platformValue = asset.platform
      return platformValue === platform || platformValue === 'All Platforms'
    })
  }

  const platforms = ['all', ...Object.keys(stats.byPlatform).filter(p => p !== 'All Platforms')]

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
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    }>
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
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
                <Palette className="h-8 w-8" />
                Brand Assets
              </h1>
              <p className="text-muted-foreground">
                Manage brand guidelines, assets, and resources for {clientConfig.name}
              </p>
            </div>
          </div>
                     <div className="flex items-center gap-3">
             <Button
               onClick={() => {
                 setEditingAsset(null)
                 setShowForm(true)
               }}
               style={{ backgroundColor: clientConfig.branding.primaryColor }}
               className="hover:opacity-90"
             >
               <Plus className="h-4 w-4 mr-2" />
               Add Asset
             </Button>
             <Button
               onClick={() => {
                 setEditingAsset(null)
                 setShowGenerateForm(true)
               }}
               variant="outline"
               className="border-2 border-dashed"
             >
               <Palette className="h-4 w-4 mr-2" />
               Generate with AI
             </Button>
           </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
              <Palette className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                Across all platforms
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Assets</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              <p className="text-xs text-muted-foreground">
                Ready to use
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Priority</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.highPriority}</div>
              <p className="text-xs text-muted-foreground">
                Priority assets
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Asset Types</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Object.keys(stats.byAssetType).length}</div>
              <p className="text-xs text-muted-foreground">
                Different types
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Asset Type Breakdown */}
        {Object.keys(stats.byAssetType).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Asset Type Distribution</CardTitle>
              <CardDescription>
                Breakdown of assets by type across your brand library
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(stats.byAssetType).map(([type, count]) => (
                  <div key={type} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    {getAssetTypeIcon(type)}
                    <div>
                      <p className="font-medium text-sm">{type}</p>
                      <p className="text-xs text-gray-500">{count} assets</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Platform Tabs */}
        <Card>
          <CardHeader>
            <CardTitle>Brand Assets by Platform</CardTitle>
            <CardDescription>
              Organize and manage assets by social media platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
                <TabsTrigger value="all">
                  All ({stats.total})
                </TabsTrigger>
                {platforms.slice(1).map((platform) => (
                  <TabsTrigger key={platform} value={platform}>
                    {platform} ({stats.byPlatform[platform] || 0})
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {platforms.map((platform) => (
                <TabsContent key={platform} value={platform} className="space-y-4">
                  <BrandAssetsTable
                    brandAssets={getAssetsByPlatform(platform)}
                    isLoading={isLoading}
                    onEdit={handleEditClick}
                    onView={handleViewAsset}
                    onDelete={handleDeleteAsset}
                    clientPrimaryColor={clientConfig.branding.primaryColor}
                  />
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {/* Form Modal */}
        {showForm && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowForm(false)
                setEditingAsset(null)
              }
            }}
          >
            <div className="bg-white rounded-lg w-full max-w-6xl max-h-[95vh] flex flex-col">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-xl font-semibold">
                  {editingAsset ? 'Edit Brand Asset' : 'Create New Brand Asset'}
                </h2>
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setShowForm(false)
                    setEditingAsset(null)
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <BrandAssetForm
                  onSubmit={editingAsset ? handleEditAsset : handleCreateAsset}
                  onClose={() => {
                    setShowForm(false)
                    setEditingAsset(null)
                  }}
                  initialData={editingAsset || undefined}
                  isEditing={!!editingAsset}
                />
              </div>
            </div>
          </div>
        )}

        {/* Generate Form Modal */}
        {showGenerateForm && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowGenerateForm(false)
              }
            }}
          >
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[95vh] flex flex-col">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  Generate Brand Asset with AI
                </h2>
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setShowGenerateForm(false)
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <GenerateBrandAssetForm
                  onSubmit={handleGenerateAsset}
                  onClose={() => {
                    setShowGenerateForm(false)
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </ClientOnly>
  )
}