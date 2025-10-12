'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useClientConfig } from '@/hooks/useClientConfig'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, ExternalLink, Edit, Trash2, Lightbulb, Home } from 'lucide-react'
import { ProductUVP } from '@/components/forms/ProductUVPForm'
import { ProductUVPCard } from '@/components/cards/ProductUVPCard'
import { ViewToggle } from '@/components/ui/view-toggle'

export default function ProductUVPsPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params?.clientId as string
  const { clientConfig, isLoading: configLoading } = useClientConfig(clientId)
  
  const [uvps, setUvps] = useState<ProductUVP[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')

  useEffect(() => {
    if (!clientConfig) return

    const fetchUVPs = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch(`/api/baserow/${clientId}/product-uvps`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch product UVPs')
        }

        const data = await response.json()
        setUvps(data.results || [])
      } catch (err) {
        console.error('Error fetching product UVPs:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch product UVPs')
      } finally {
        setIsLoading(false)
      }
    }

    fetchUVPs()
  }, [clientConfig, clientId])

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this Product UVP?')) {
      return
    }

    try {
      const response = await fetch(`/api/baserow/${clientId}/product-uvps/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete product UVP')
      }

      // Remove from state
      setUvps(uvps.filter(uvp => uvp.id !== id))
    } catch (err) {
      console.error('Error deleting product UVP:', err)
      alert('Failed to delete product UVP')
    }
  }

  if (configLoading || isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading product UVPs...</p>
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
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Product UVPs</h1>
          <p className="text-muted-foreground mt-1">
            Manage your product unique value propositions
          </p>
        </div>
        <div className="flex gap-3">
          <ViewToggle view={viewMode} onViewChange={setViewMode} />
          <Button 
            variant="outline"
            onClick={() => router.push(`/dashboard/${clientId}`)}
            className="flex items-center gap-2"
          >
            <Home className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <Button onClick={() => router.push(`/dashboard/${clientId}/product-uvps/create`)}>
            <Plus className="mr-2 h-4 w-4" />
            Create UVP
          </Button>
        </div>
      </div>

      {/* UVPs List */}
      {uvps.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Lightbulb className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Product UVPs Yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Start by creating your first product unique value proposition
            </p>
            <Button onClick={() => router.push(`/dashboard/${clientId}/product-uvps/create`)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First UVP
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === 'cards' ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {uvps.map((uvp) => (
            <ProductUVPCard
              key={uvp.id}
              uvp={{
                id: uvp.id?.toString() || '',
                product_service_name: uvp.productServiceName,
                product_url: uvp.productUrl,
                customer_type: uvp.customerType,
                industry_category: uvp.industryCategory,
                problem_solved: uvp.problemSolved,
                key_differentiator: uvp.keyDifferentiator,
                uvp: uvp.uvp
              }}
              onView={(id) => router.push(`/dashboard/${clientId}/product-uvps/${id}`)}
              onEdit={(id) => router.push(`/dashboard/${clientId}/product-uvps/${id}`)}
            />
          ))}
        </div>
      ) : (
        <div className="grid gap-4">
          {uvps.map((uvp) => (
            <Card key={uvp.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Lightbulb className="h-5 w-5 text-yellow-600" />
                      <h3 className="text-lg font-semibold text-gray-900">
                        {uvp.productServiceName || 'Unnamed Product'}
                      </h3>
                      {uvp.productUrl && (
                        <a
                          href={uvp.productUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                      <div>
                        <span className="text-gray-500">Industry:</span>
                        <span className="ml-2 font-medium">{uvp.industryCategory}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Customer:</span>
                        <span className="ml-2 font-medium">{uvp.customerType}</span>
                      </div>
                    </div>

                    {uvp.problemSolved && (
                      <div className="mb-2">
                        <p className="text-xs font-medium text-gray-500">Problem Solved:</p>
                        <p className="text-sm text-gray-700">{uvp.problemSolved}</p>
                      </div>
                    )}

                    {uvp.keyDifferentiator && (
                      <div className="mb-2">
                        <p className="text-xs font-medium text-gray-500">Key Differentiator:</p>
                        <p className="text-sm text-gray-700">{uvp.keyDifferentiator}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => router.push(`/dashboard/${clientId}/product-uvps/${uvp.id}`)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-red-600 hover:text-red-700"
                      onClick={() => uvp.id && handleDelete(uvp.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

