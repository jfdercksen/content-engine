'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Users, Database, Settings, Trash2 } from 'lucide-react'
import ClientOnboardingForm from '@/components/forms/ClientOnboardingForm'
import { toast } from 'sonner'

interface ClientConfig {
  id: string
  name: string
  displayName: string
  isActive: boolean
  createdAt: string
  tables: {
    contentIdeas?: string
    socialMediaContent: string
    images: string
    brandAssets: string
    emailIdeas: string
    templates: string
    imageIdeas?: string
  }
}

export default function AdminClientsPage() {
  const router = useRouter()
  const [clients, setClients] = useState<ClientConfig[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/admin/clients')
      
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setClients(result.clients)
        } else {
          console.error('Error fetching clients:', result.error)
          setClients([])
        }
      } else {
        console.error('Failed to fetch clients:', response.status)
        setClients([])
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
      setClients([])
    } finally {
      setIsLoading(false)
    }
  }

  // Client creation is now handled entirely by the ClientOnboardingForm component
  // which saves progressively after each step

  const handleViewDashboard = (clientId: string) => {
    router.push(`/dashboard/${clientId}`)
  }

  const handleDeleteClient = async (clientId: string, displayName: string) => {
    // Double confirmation for safety
    const confirmMessage = `Are you sure you want to delete "${displayName}"?\n\nThis will:\n• Remove the client from the app\n• Delete the Baserow database (if possible)\n• Clean up environment variables\n\nThis action cannot be undone!`
    
    if (!confirm(confirmMessage)) {
      return
    }

    // Final confirmation
    if (!confirm(`FINAL WARNING: This will permanently delete "${displayName}" and all its data. Type "DELETE" to confirm:`)) {
      return
    }

    try {
      setIsDeleting(clientId)
      
      const response = await fetch('/api/admin/clients', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ clientId })
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Client deleted successfully:', result)
        
        // Refresh clients list
        await fetchClients()
        
        alert(`Client "${displayName}" deleted successfully!\n\nDetails:\n• App configuration: ${result.details.appConfigRemoved ? 'Removed' : 'Failed'}\n• Environment variables: ${result.details.envVariablesCleaned ? 'Cleaned' : 'Failed'}\n• Baserow database: ${result.details.baserowDatabaseDeleted ? 'Deleted' : 'Failed (may require manual cleanup)'}`)
      } else {
        const error = await response.json()
        alert(`Error deleting client: ${error.error}\n\nDetails: ${error.details || 'No additional details'}`)
      }
    } catch (error) {
      console.error('Error deleting client:', error)
      alert('Error deleting client. Please try again.')
    } finally {
      setIsDeleting(null)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading clients...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Client Management</h1>
          <p className="text-gray-600">Manage your content engine clients</p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add New Client
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Client Onboarding</DialogTitle>
              <DialogDescription>
                Complete this 5-step onboarding process to set up a new client with all their information.
              </DialogDescription>
            </DialogHeader>
            
            <ClientOnboardingForm 
              onSuccess={(clientId) => {
                setShowCreateDialog(false)
                toast.success('Client onboarded successfully!')
                router.push(`/dashboard/${clientId}`)
                fetchClients()
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clients.map((client) => (
          <Card key={client.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{client.displayName}</CardTitle>
                <div className={`px-2 py-1 rounded-full text-xs ${
                  client.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {client.isActive ? 'Active' : 'Inactive'}
                </div>
              </div>
              <CardDescription>ID: {client.name}</CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <Database className="h-4 w-4 mr-2" />
                  {Object.keys(client.tables).length} tables configured
                </div>
                
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="h-4 w-4 mr-2" />
                  Created: {new Date(client.createdAt).toLocaleDateString()}
                </div>
                
                <div className="flex space-x-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Settings className="h-3 w-3 mr-1" />
                    Configure
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleViewDashboard(client.id)}
                  >
                    View Dashboard
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                    onClick={() => handleDeleteClient(client.id, client.displayName)}
                    disabled={isDeleting === client.id}
                  >
                    {isDeleting === client.id ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600"></div>
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {clients.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No clients found</h3>
          <p className="text-gray-600 mb-4">Get started by creating your first client.</p>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create First Client
          </Button>
        </div>
      )}
    </div>
  )
}
