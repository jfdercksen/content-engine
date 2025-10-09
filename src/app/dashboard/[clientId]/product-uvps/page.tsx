'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useClientConfig } from '@/hooks/useClientConfig'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, ExternalLink, Edit, Trash2, Lightbulb, Home } from 'lucide-react'
import { ProductUVP } from '@/components/forms/ProductUVPForm'

export default function ProductUVPsPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params?.clientId as string
  const { clientConfig, isLoading: configLoading } = useClientConfig(clientId)
  
  const [uvps, setUvps] = useState<ProductUVP[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {uvps.map((uvp) => (
            <Card key={uvp.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-1">
                      {uvp.productServiceName}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {uvp.industryCategory} • {uvp.customerType}
                    </CardDescription>
                  </div>
                  {uvp.productUrl && (
                    <a
                      href={uvp.productUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-primary" />
                    </a>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {uvp.uvp && (
                  <div className="mb-4 p-3 bg-primary/5 rounded-md border border-primary/10">
                    <p className="text-sm font-medium text-primary mb-1">Generated UVP</p>
                    <p className="text-sm text-muted-foreground line-clamp-3">{uvp.uvp}</p>
                  </div>
                )}
                
                <div className="space-y-2 mb-4">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Problem Solved</p>
                    <p className="text-sm line-clamp-2">{uvp.problemSolved}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Key Differentiator</p>
                    <p className="text-sm line-clamp-2">{uvp.keyDifferentiator}</p>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => router.push(`/dashboard/${clientId}/product-uvps/${uvp.id}`)}
                  >
                    <Edit className="mr-2 h-3 w-3" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => uvp.id && handleDelete(uvp.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

