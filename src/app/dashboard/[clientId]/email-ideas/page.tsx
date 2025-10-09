'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useClientConfig } from '@/hooks/useClientConfig'

import ClientOnly from '@/components/ClientOnly'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Mail, Search, Filter, MoreHorizontal, ArrowLeft, Eye, Edit } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EmailIdea, EMAIL_TYPES, EMAIL_STATUS } from '@/lib/types/content'
import EmailIdeaForm from '@/components/forms/EmailIdeaForm'
import EmailPreviewModal from '@/components/modals/EmailPreviewModal'

export default function EmailIdeasPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.clientId as string
  const { clientConfig, isLoading: configLoading, error: configError } = useClientConfig(clientId)

  const [emailIdeas, setEmailIdeas] = useState<EmailIdea[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingEmailIdea, setEditingEmailIdea] = useState<EmailIdea | null>(null)
  const [previewingEmailIdea, setPreviewingEmailIdea] = useState<EmailIdea | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Move useEffect hooks to the top to avoid hooks order issues
  useEffect(() => {
    if (clientConfig) {
      fetchEmailIdeas()
    }
  }, [refreshTrigger, clientConfig])

  useEffect(() => {
    console.log('emailIdeas state changed:', emailIdeas.length, 'items')
  }, [emailIdeas])

  const fetchEmailIdeas = async () => {
    try {
      console.log('fetchEmailIdeas: Starting fetch...')
      setLoading(true)
      const response = await fetch(`/api/baserow/${clientId}/email-ideas`)
      if (response.ok) {
        const data = await response.json()
        console.log('fetchEmailIdeas: Fetched data:', data)
        console.log('fetchEmailIdeas: Results count:', data.results?.length || 0)
        setEmailIdeas(data.results || [])
        console.log('fetchEmailIdeas: State updated with', data.results?.length || 0, 'items')
      } else {
        console.error('fetchEmailIdeas: Failed to fetch email ideas')
      }
    } catch (error) {
      console.error('fetchEmailIdeas: Error fetching email ideas:', error)
    } finally {
      setLoading(false)
      console.log('fetchEmailIdeas: Loading set to false')
    }
  }

  const filteredEmailIdeas = emailIdeas.filter(idea => {
    const matchesSearch = (idea.emailIdeaName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (idea.hook || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (idea.cta || '').toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || idea.status === statusFilter
    const matchesType = typeFilter === 'all' || idea.emailType === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft': return 'bg-gray-100 text-gray-800'
      case 'Send': return 'bg-green-100 text-green-800'
      case 'Generating Image': return 'bg-blue-100 text-blue-800'
      case 'Approved': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Welcome & Onboarding Emails': return 'bg-blue-100 text-blue-800'
      case 'Promotional Emails': return 'bg-orange-100 text-orange-800'
      case 'Newsletter / Content Emails': return 'bg-green-100 text-green-800'
      case 'Lead Nurture / Drip Emails': return 'bg-purple-100 text-purple-800'
      case 'Event or Launch Emails': return 'bg-red-100 text-red-800'
      case 'Transactional Emails': return 'bg-gray-100 text-gray-800'
      case 'Re-Engagement Emails': return 'bg-yellow-100 text-yellow-800'
      case 'Customer Loyalty & Upsell Emails': return 'bg-pink-100 text-pink-800'
      case 'Survey & Feedback Emails': return 'bg-indigo-100 text-indigo-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleSaveEmailIdea = async (emailIdea: EmailIdea) => {
    console.log('handleSaveEmailIdea called with:', emailIdea)
    
    // Close the form first
    if (editingEmailIdea) {
      setEditingEmailIdea(null)
    } else {
      setShowCreateForm(false)
    }
    
    // Add a small delay to ensure the form is closed
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Then refresh the data from the server to get the latest state
    await fetchEmailIdeas()
    
    // Force a re-render
    setRefreshTrigger(prev => prev + 1)
    
    console.log('handleSaveEmailIdea completed, emailIdeas state:', emailIdeas)
  }

  const handleEditEmailIdea = (emailIdea: EmailIdea) => {
    setEditingEmailIdea(emailIdea)
  }

  const handleViewEmailIdea = (emailIdea: EmailIdea) => {
    setPreviewingEmailIdea(emailIdea)
  }

  const handleCancelEdit = () => {
    setEditingEmailIdea(null)
    setShowCreateForm(false)
  }

  const handleClosePreview = () => {
    setPreviewingEmailIdea(null)
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    }>
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => {
                console.log('Back to Dashboard button clicked')
                console.log('clientId:', clientId)
                console.log('router:', router)
                try {
                  router.push(`/dashboard/${clientId}`)
                } catch (error) {
                  console.error('Navigation error:', error)
                }
              }}
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
                <Mail className="h-8 w-8" />
                Email Ideas
              </h1>
              <p className="text-muted-foreground">
                Create and manage email marketing campaigns for {clientConfig.name}
              </p>
            </div>
          </div>
          <Button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Email Idea
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Mail className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Ideas</p>
                  <p className="text-2xl font-bold">{emailIdeas.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Draft</p>
                  <p className="text-2xl font-bold">
                    {emailIdeas.filter(idea => idea.status === 'Draft').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Approved</p>
                  <p className="text-2xl font-bold">
                    {emailIdeas.filter(idea => idea.status === 'Approved').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Generating</p>
                  <p className="text-2xl font-bold">
                    {emailIdeas.filter(idea => idea.status === 'Generating Image').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search email ideas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {Object.values(EMAIL_STATUS).map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.values(EMAIL_TYPES).map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Email Ideas Table */}
        <Card>
          <CardHeader>
            <CardTitle>Email Ideas ({filteredEmailIdeas.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-16 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : filteredEmailIdeas.length === 0 ? (
              <div className="text-center py-8">
                <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No email ideas found</h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' 
                    ? 'Try adjusting your filters' 
                    : 'Get started by creating your first email idea'}
                </p>
                {!searchTerm && statusFilter === 'all' && typeFilter === 'all' && (
                  <Button onClick={() => setShowCreateForm(true)}>
                    Create Email Idea
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredEmailIdeas.map((idea) => (
                  <div key={idea.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">
                            {idea.emailIdeaName || `Email Idea ${idea.emailId || idea.id}`}
                          </h3>
                          {idea.status && (
                            <Badge className={getStatusColor(idea.status)}>
                              {idea.status}
                            </Badge>
                          )}
                          {idea.emailType && (
                            <Badge className={getTypeColor(idea.emailType)}>
                              {idea.emailType}
                            </Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          {idea.hook && (
                            <div>
                              <span className="font-medium">Hook:</span> {idea.hook}
                            </div>
                          )}
                          {idea.cta && (
                            <div>
                              <span className="font-medium">CTA:</span> {idea.cta}
                            </div>
                          )}
                          <div>
                            <span className="font-medium">Modified:</span> {idea.lastModified}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {idea.generatedHtml && (
                          <Button 
                            variant={idea.status === 'Generated' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleViewEmailIdea(idea)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditEmailIdea(idea)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Email Idea Form Modal */}
        {(showCreateForm || editingEmailIdea) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
              <EmailIdeaForm
                clientId={clientId}
                initialData={editingEmailIdea || undefined}
                onSave={handleSaveEmailIdea}
                onCancel={handleCancelEdit}
              />
            </div>
          </div>
        )}

        {/* Email Preview Modal */}
        <EmailPreviewModal
          emailIdea={previewingEmailIdea}
          isOpen={!!previewingEmailIdea}
          onClose={handleClosePreview}
          onRefresh={() => setRefreshTrigger(prev => prev + 1)}
        />
      </div>
    </ClientOnly>
  )
}
