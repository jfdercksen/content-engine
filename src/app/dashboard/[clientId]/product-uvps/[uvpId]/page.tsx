'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useClientConfig } from '@/hooks/useClientConfig'
import ProductUVPForm, { ProductUVP, ProductUVPFormData } from '@/components/forms/ProductUVPForm'
import { ArrowLeft, Edit3, Eye, Home, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import ReactMarkdown from 'react-markdown'

export default function EditProductUVPPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params?.clientId as string
  const uvpId = params?.uvpId as string
  const { clientConfig, isLoading: configLoading } = useClientConfig(clientId)
  
  const [uvp, setUvp] = useState<ProductUVP | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isEditingUVP, setIsEditingUVP] = useState(false)
  const [uvpContent, setUvpContent] = useState('')

  useEffect(() => {
    if (!clientConfig || !uvpId) return

    const fetchUVP = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch(`/api/baserow/${clientId}/product-uvps/${uvpId}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch product UVP')
        }

        const data = await response.json()
        setUvp(data)
        setUvpContent(data.uvp || '')
      } catch (err) {
        console.error('Error fetching product UVP:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch product UVP')
      } finally {
        setIsLoading(false)
      }
    }

    fetchUVP()
  }, [clientConfig, clientId, uvpId])

  const handleSaveUVP = async () => {
    if (!uvp) return

    try {
      setIsSubmitting(true)

      const response = await fetch(`/api/baserow/${clientId}/product-uvps/${uvpId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uvp: uvpContent })
      })

      if (!response.ok) {
        throw new Error('Failed to update UVP content')
      }

      // Update local state
      setUvp({ ...uvp, uvp: uvpContent })
      setIsEditingUVP(false)
      alert('UVP content updated successfully!')
    } catch (error) {
      console.error('Error updating UVP:', error)
      alert(error instanceof Error ? error.message : 'Failed to update UVP content')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFormSubmit = async (data: ProductUVPFormData) => {
    console.log('=== UPDATE FORM SUBMIT CALLED ===')
    console.log('Form data received:', data)
    
    try {
      setIsSubmitting(true)

      const response = await fetch(`/api/baserow/${clientId}/product-uvps/${uvpId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })

      console.log('API Response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('API Error:', errorData)
        throw new Error(errorData.error || 'Failed to update product UVP')
      }

      const result = await response.json()
      console.log('API Success:', result)

      // Show success message
      alert('Product UVP updated successfully!')
      
      // Redirect back to the list
      router.push(`/dashboard/${clientId}/product-uvps`)
    } catch (error) {
      console.error('Error updating product UVP:', error)
      alert(error instanceof Error ? error.message : 'Failed to update product UVP')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (configLoading || isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600 font-medium">{error}</p>
          <Button 
            className="mt-4"
            onClick={() => router.push(`/dashboard/${clientId}/product-uvps`)}
          >
            Back to Product UVPs
          </Button>
        </div>
      </div>
    )
  }

  if (!uvp) {
    return (
      <div className="container mx-auto py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-600 font-medium">Product UVP not found</p>
          <Button 
            className="mt-4"
            onClick={() => router.push(`/dashboard/${clientId}/product-uvps`)}
          >
            Back to Product UVPs
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/dashboard/${clientId}`)}
          className="flex items-center gap-2 h-auto p-1 text-muted-foreground hover:text-foreground"
        >
          <Home className="h-4 w-4" />
          Dashboard
        </Button>
        <ChevronRight className="h-4 w-4" />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/dashboard/${clientId}/product-uvps`)}
          className="h-auto p-1 text-muted-foreground hover:text-foreground"
        >
          Product UVPs
        </Button>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">Edit UVP</span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/dashboard/${clientId}/product-uvps`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Product UVP</h1>
            <p className="text-muted-foreground mt-1">
              Update your product's unique value proposition
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push(`/dashboard/${clientId}`)}
          className="flex items-center gap-2"
        >
          <Home className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>

      {/* Generated UVP Display */}
      {uvp.uvp && (
        <div className="bg-primary/5 border border-primary/10 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-primary">AI-Generated UVP</h3>
            <div className="flex gap-2">
              {!isEditingUVP ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingUVP(true)}
                  className="flex items-center gap-2"
                >
                  <Edit3 className="h-4 w-4" />
                  Edit UVP
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsEditingUVP(false)
                      setUvpContent(uvp.uvp || '')
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveUVP}
                    disabled={isSubmitting}
                    className="flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    Save UVP
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          {!isEditingUVP ? (
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown>{uvp.uvp}</ReactMarkdown>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="uvp-edit">Edit UVP Content (Markdown)</Label>
              <Textarea
                id="uvp-edit"
                value={uvpContent}
                onChange={(e) => setUvpContent(e.target.value)}
                rows={15}
                className="font-mono text-sm"
                placeholder="Edit the AI-generated UVP content..."
              />
              <p className="text-sm text-muted-foreground">
                You can edit the markdown content above. Use standard markdown syntax like # for headers, ** for bold, etc.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Form */}
      <ProductUVPForm 
        onSubmit={handleFormSubmit} 
        initialData={uvp}
        isLoading={isSubmitting}
        showUVPField={false}
      />
    </div>
  )
}

