'use client'

import { LayoutGrid, TableIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ViewToggleProps {
    view: 'cards' | 'table'
    onViewChange: (view: 'cards' | 'table') => void
}

export function ViewToggle({ view, onViewChange }: ViewToggleProps) {
    return (
        <div className="inline-flex rounded-lg border border-gray-300 bg-white p-1">
            <Button
                variant={view === 'cards' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewChange('cards')}
                className={`${
                    view === 'cards'
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
            >
                <LayoutGrid className="h-4 w-4 mr-2" />
                Cards
            </Button>
            <Button
                variant={view === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewChange('table')}
                className={`${
                    view === 'table'
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
            >
                <TableIcon className="h-4 w-4 mr-2" />
                Table
            </Button>
        </div>
    )
}

