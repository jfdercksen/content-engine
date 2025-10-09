'use client'

import { ClientConfig } from '@/lib/config/clients'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

interface ClientHeaderProps {
  clientConfig: ClientConfig
  onNewContentIdea?: () => void
  hideNewButton?: boolean
}

export default function ClientHeader({ clientConfig, onNewContentIdea, hideNewButton = false }: ClientHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h1 
          className="text-3xl font-bold mb-2" 
          style={{ color: clientConfig.branding.primaryColor }}
        >
          Content Ideas
        </h1>
        <p className="text-muted-foreground">
          Create and manage content ideas for {clientConfig.name}
        </p>
      </div>
      {!hideNewButton && onNewContentIdea && (
        <Button
          onClick={onNewContentIdea}
          style={{ backgroundColor: clientConfig.branding.primaryColor }}
          className="hover:opacity-90"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Content Idea
        </Button>
      )}
    </div>
  )
}