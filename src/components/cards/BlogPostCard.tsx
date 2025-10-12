'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
    Eye, 
    Edit, 
    Trash2, 
    Calendar,
    FileText,
    TrendingUp,
    Hash
} from 'lucide-react'

interface BlogPostCardProps {
    post: {
        id: string
        title: string
        slug?: string
        status: string
        focus_keyword?: string
        seo_score?: number
        word_count?: number
        readability_score?: number
        created_at?: string
        category?: string
    }
    onView?: (id: string) => void
    onEdit?: (id: string) => void
    onDelete?: (id: string) => void
}

export function BlogPostCard({ post, onView, onEdit, onDelete }: BlogPostCardProps) {
    const getStatusColor = (status: string) => {
        const statusLower = status?.toLowerCase() || ''
        if (statusLower.includes('published')) return 'bg-green-100 text-green-800 border-green-200'
        if (statusLower.includes('scheduled')) return 'bg-blue-100 text-blue-800 border-blue-200'
        if (statusLower.includes('draft')) return 'bg-gray-100 text-gray-800 border-gray-200'
        if (statusLower.includes('review')) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }

    const getSeoScoreColor = (score?: number) => {
        if (!score) return 'text-gray-400'
        if (score >= 80) return 'text-green-600'
        if (score >= 60) return 'text-yellow-600'
        return 'text-red-600'
    }

    return (
        <Card className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] group">
            <CardContent className="p-5 space-y-4">
                {/* Header: Title & Status */}
                <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-gray-900 text-lg leading-tight line-clamp-2 flex-1">
                            {post.title || 'Untitled Post'}
                        </h3>
                        <Badge className={`${getStatusColor(post.status)} border shrink-0`}>
                            {post.status}
                        </Badge>
                    </div>
                    {post.slug && (
                        <p className="text-xs text-gray-500 truncate">/{post.slug}</p>
                    )}
                </div>

                {/* SEO Metrics */}
                <div className="grid grid-cols-2 gap-3 py-3 border-y border-gray-100">
                    <div className="space-y-1">
                        <div className="flex items-center text-xs text-gray-500 gap-1">
                            <TrendingUp className="h-3 w-3" />
                            SEO Score
                        </div>
                        <div className={`text-lg font-bold ${getSeoScoreColor(post.seo_score)}`}>
                            {post.seo_score || '--'}/100
                        </div>
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center text-xs text-gray-500 gap-1">
                            <FileText className="h-3 w-3" />
                            Word Count
                        </div>
                        <div className="text-lg font-bold text-gray-700">
                            {post.word_count?.toLocaleString() || '--'}
                        </div>
                    </div>
                </div>

                {/* Metadata */}
                <div className="space-y-2">
                    {post.focus_keyword && (
                        <div className="flex items-center text-xs text-gray-600 gap-1">
                            <Hash className="h-3 w-3" />
                            <span className="font-medium">{post.focus_keyword}</span>
                        </div>
                    )}
                    {post.category && (
                        <div className="text-xs text-blue-600 font-medium">
                            📁 {post.category}
                        </div>
                    )}
                    {post.created_at && (
                        <div className="flex items-center text-xs text-gray-500 gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(post.created_at).toLocaleDateString()}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onView && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onView(post.id)}
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
                            onClick={() => onEdit(post.id)}
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
                            onClick={() => onDelete(post.id)}
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

