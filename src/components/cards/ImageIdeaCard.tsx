'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
    Eye, 
    Edit, 
    Trash2,
    Image as ImageIcon,
    Sparkles,
    Palette
} from 'lucide-react'

interface ImageIdeaCardProps {
    image: {
        id: string
        imageprompt?: string
        imagetype?: string
        imagestyle?: string
        imagestatus?: string
        image?: any
        referenceurl?: string
    }
    onView?: (id: string) => void
    onEdit?: (id: string) => void
    onDelete?: (id: string) => void
}

export function ImageIdeaCard({ image, onView, onEdit, onDelete }: ImageIdeaCardProps) {
    const getStatusColor = (status: string) => {
        const statusLower = status?.toLowerCase() || ''
        if (statusLower.includes('completed')) return 'bg-green-100 text-green-800 border-green-200'
        if (statusLower.includes('generating')) return 'bg-blue-100 text-blue-800 border-blue-200'
        if (statusLower.includes('failed')) return 'bg-red-100 text-red-800 border-red-200'
        if (statusLower.includes('approved')) return 'bg-purple-100 text-purple-800 border-purple-200'
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }

    const getStyleColor = (style: string) => {
        const styleLower = style?.toLowerCase() || ''
        if (styleLower.includes('photorealistic')) return 'bg-blue-50 text-blue-700 border-blue-200'
        if (styleLower.includes('cartoon')) return 'bg-pink-50 text-pink-700 border-pink-200'
        if (styleLower.includes('abstract')) return 'bg-purple-50 text-purple-700 border-purple-200'
        if (styleLower.includes('minimalist')) return 'bg-gray-50 text-gray-700 border-gray-200'
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }

    const getImageUrl = () => {
        if (!image.image) return null
        if (Array.isArray(image.image) && image.image.length > 0) {
            return image.image[0].url
        }
        if (typeof image.image === 'object' && image.image.url) {
            return image.image.url
        }
        return null
    }

    const imageUrl = getImageUrl()

    return (
        <Card className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] group overflow-hidden">
            <CardContent className="p-0">
                {/* Image Preview */}
                <div className="relative aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    {imageUrl ? (
                        <img 
                            src={imageUrl} 
                            alt={image.imageprompt || 'Image'} 
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="text-center p-6">
                            <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">No image yet</p>
                        </div>
                    )}
                    {/* Status Badge Overlay */}
                    {image.imagestatus && (
                        <div className="absolute top-2 right-2">
                            <Badge className={`${getStatusColor(image.imagestatus)} border shadow-sm`}>
                                {image.imagestatus}
                            </Badge>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                    {/* Image Type & Style */}
                    <div className="flex items-center gap-2 flex-wrap">
                        {image.imagetype && (
                            <Badge variant="outline" className="text-xs">
                                {image.imagetype}
                            </Badge>
                        )}
                        {image.imagestyle && (
                            <Badge className={`${getStyleColor(image.imagestyle)} border text-xs`}>
                                <Palette className="h-3 w-3 mr-1" />
                                {image.imagestyle}
                            </Badge>
                        )}
                    </div>

                    {/* Prompt */}
                    {image.imageprompt && (
                        <div className="space-y-1">
                            <div className="flex items-center text-xs font-medium text-gray-700 gap-1">
                                <Sparkles className="h-3 w-3" />
                                Prompt
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-3">
                                {image.imageprompt}
                            </p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2 opacity-0 group-hover:opacity-100 transition-opacity border-t border-gray-100">
                        {onView && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onView(image.id)}
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
                                onClick={() => onEdit(image.id)}
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
                                onClick={() => onDelete(image.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                            >
                                <Trash2 className="h-3 w-3" />
                            </Button>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

