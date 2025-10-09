import { useState, useEffect } from 'react'

interface ClientConfig {
  id: string
  name: string
  baserow: {
    token: string
    databaseId: string
    tables: {
      contentIdeas: string
      socialMediaContent: string
      brandAssets: string
      contentAssets: string
      publishingSchedule: string
      performanceAnalytics: string
      images: string
      emailIdeas: string
      templates: string
      imageIdeas: string
      blogPosts: string
      blogRequests: string
      keywordResearch: string
    }
  }
  branding: {
    primaryColor: string
    secondaryColor: string
    logo?: string
  }
  settings: {
    maxFileSize: number
    allowedFileTypes: string[]
    autoApproval: boolean
  }
  users: Array<{
    email: string
    role: string
  }>
}

interface UseClientConfigResult {
  clientConfig: ClientConfig | null
  isLoading: boolean
  error: string | null
}

export function useClientConfig(clientId: string): UseClientConfigResult {
  const [clientConfig, setClientConfig] = useState<ClientConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchClientConfig = async () => {
      if (!clientId) {
        setError('Client ID is required')
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)
        
        const response = await fetch(`/api/client-config/${clientId}`)
        const data = await response.json()
        
        if (data.success) {
          setClientConfig(data.clientConfig)
        } else {
          setError(data.error || 'Failed to load client configuration')
        }
      } catch (err) {
        setError('Failed to fetch client configuration')
        console.error('Error fetching client config:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchClientConfig()
  }, [clientId])

  return { clientConfig, isLoading, error }
}
