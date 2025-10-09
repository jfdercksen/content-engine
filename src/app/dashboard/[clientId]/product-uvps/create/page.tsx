'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useClientConfig } from '@/hooks/useClientConfig'
import ProductUVPForm, { ProductUVPFormData } from '@/components/forms/ProductUVPForm'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function CreateProductUVPPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params?.clientId as string
  const { clientConfig, isLoading: configLoading } = useClientConfig(clientId)
  
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleFormSubmit = async (data: ProductUVPFormData) => {
    console.log('=== PAGE HANDLE FORM SUBMIT CALLED ===')
    console.log('Form data received:', data)
    console.log('Client ID:', clientId)
    
    try {
      setIsSubmitting(true)

      const payload = {
        clientId,
        ...data
      }

      console.log('Making API call with payload:', payload)

      const response = await fetch('/api/product-uvp/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      console.log('API Response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('API Error:', errorData)
        throw new Error(errorData.error || 'Failed to create product UVP')
      }

      const result = await response.json()
      console.log('API Success:', result)

      // Show success message
      alert('Product UVP created successfully! AI will now generate the unique value proposition.')
      
      // Redirect back to the list
      router.push(`/dashboard/${clientId}/product-uvps`)
    } catch (error) {
      console.error('Error creating product UVP:', error)
      alert(error instanceof Error ? error.message : 'Failed to create product UVP')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (configLoading) {
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

  if (!clientConfig) {
    return (
      <div className="container mx-auto py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600 font-medium">Client not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(`/dashboard/${clientId}/product-uvps`)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Product UVP</h1>
          <p className="text-muted-foreground mt-1">
            Define your product's unique value proposition
          </p>
        </div>
      </div>

      {/* Form */}
      <ProductUVPForm 
        onSubmit={handleFormSubmit} 
        isLoading={isSubmitting}
      />
    </div>
  )
}

