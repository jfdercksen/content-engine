'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
    Eye, 
    Edit, 
    Trash2, 
    Calendar, 
    MessageSquare, 
    Facebook,
    Instagram,
    Twitter,
    Linkedin
} from 'lucide-react'

interface SocialMediaContentCardProps {
    content: {
        id: string
        post: string
        platform: string
        status: string
        scheduledtime?: string
        charactercount?: number
        hashtags?: string
        images?: any
    }
    onView?: (id: string) => void
    onEdit?: (content: any) => void
    onDelete?: (id: string) => void
}

export function SocialMediaContentCard({ content, onView, onEdit, onDelete }: SocialMediaContentCardProps) {
    const getPlatformIcon = (platform: string) => {
        const platformLower = platform?.toLowerCase() || ''
        if (platformLower.includes('facebook')) return <Facebook className="h-4 w-4" />
        if (platformLower.includes('instagram')) return <Instagram className="h-4 w-4" />
        if (platformLower.includes('twitter') || platformLower.includes('x')) return <Twitter className="h-4 w-4" />
        if (platformLower.includes('linkedin')) return <Linkedin className="h-4 w-4" />
        return <MessageSquare className="h-4 w-4" />
    }

    const getPlatformColor = (platform: string) => {
        const platformLower = platform?.toLowerCase() || ''
        if (platformLower.includes('facebook')) return 'bg-blue-600'
        if (platformLower.includes('instagram')) return 'bg-pink-600'
        if (platformLower.includes('twitter') || platformLower.includes('x')) return 'bg-sky-500'
        if (platformLower.includes('linkedin')) return 'bg-blue-700'
        return 'bg-gray-600'
    }

    const getStatusColor = (status: string) => {
        const statusLower = status?.toLowerCase() || ''
        if (statusLower.includes('published')) return 'bg-green-100 text-green-800 border-green-200'
        if (statusLower.includes('scheduled')) return 'bg-blue-100 text-blue-800 border-blue-200'
        if (statusLower.includes('draft')) return 'bg-gray-100 text-gray-800 border-gray-200'
        if (statusLower.includes('approved')) return 'bg-purple-100 text-purple-800 border-purple-200'
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }

    const truncateText = (text: string, maxLength: number = 120) => {
        if (!text) return ''
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
    }

    return (
        <Card className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] group">
            <CardContent className="p-4 space-y-3">
                {/* Header: Platform & Status */}
                <div className="flex items-center justify-between">
                    <div className={`${getPlatformColor(content.platform)} text-white px-3 py-1 rounded-full flex items-center gap-2 text-sm font-medium`}>
                        {getPlatformIcon(content.platform)}
                        {content.platform}
                    </div>
                    <Badge className={`${getStatusColor(content.status)} border`}>
                        {content.status}
                    </Badge>
                </div>

                {/* Post Content Preview */}
                <div className="min-h-[80px]">
                    <p className="text-gray-700 text-sm leading-relaxed">
                        {truncateText(content.post)}
                    </p>
                </div>

                {/* Metadata */}
                <div className="space-y-2 pt-2 border-t border-gray-100">
                    {content.scheduledtime && (
                        <div className="flex items-center text-xs text-gray-500 gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(content.scheduledtime).toLocaleDateString()} at {new Date(content.scheduledtime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    )}
                    {content.charactercount && (
                        <div className="flex items-center text-xs text-gray-500 gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {content.charactercount} characters
                        </div>
                    )}
                    {content.hashtags && (
                        <div className="text-xs text-blue-600 truncate">
                            {content.hashtags}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onView && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onView(content.id)}
                            className="flex-1"
                        >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                        </Button>
                    )}
                    {onEdit && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEdit(content)}
                            className="flex-1"
                        >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                        </Button>
                    )}
                    {onDelete && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onDelete(content.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                        >
                            <Trash2 className="h-3 w-3" />
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

