'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
    Eye, 
    Edit, 
    ExternalLink,
    Target,
    Users,
    Building2,
    Lightbulb
} from 'lucide-react'

interface ProductUVPCardProps {
    uvp: {
        id: string
        product_service_name?: string
        product_url?: string
        customer_type?: string
        industry_category?: string
        problem_solved?: string
        key_differentiator?: string
        uvp?: string
    }
    onView?: (id: string) => void
    onEdit?: (id: string) => void
}

export function ProductUVPCard({ uvp, onView, onEdit }: ProductUVPCardProps) {
    const getIndustryColor = (industry: string) => {
        const industryLower = industry?.toLowerCase() || ''
        if (industryLower.includes('software') || industryLower.includes('saas')) return 'bg-blue-100 text-blue-800 border-blue-200'
        if (industryLower.includes('healthcare')) return 'bg-green-100 text-green-800 border-green-200'
        if (industryLower.includes('automotive')) return 'bg-red-100 text-red-800 border-red-200'
        if (industryLower.includes('finance')) return 'bg-emerald-100 text-emerald-800 border-emerald-200'
        if (industryLower.includes('retail') || industryLower.includes('commerce')) return 'bg-purple-100 text-purple-800 border-purple-200'
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }

    return (
        <Card className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] group">
            <CardContent className="p-5 space-y-4">
                {/* Header: Product Name & Industry */}
                <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1">
                            <Lightbulb className="h-5 w-5 text-yellow-600 shrink-0" />
                            <h3 className="font-semibold text-gray-900 text-lg leading-tight line-clamp-2">
                                {uvp.product_service_name || 'Unnamed Product'}
                            </h3>
                        </div>
                        {uvp.product_url && (
                            <a 
                                href={uvp.product_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-700"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <ExternalLink className="h-4 w-4" />
                            </a>
                        )}
                    </div>
                    {uvp.industry_category && (
                        <Badge className={`${getIndustryColor(uvp.industry_category)} border text-xs`}>
                            {uvp.industry_category}
                        </Badge>
                    )}
                </div>

                {/* Customer Type */}
                {uvp.customer_type && (
                    <div className="flex items-center text-sm text-gray-600 gap-2 py-2 border-y border-gray-100">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span>{uvp.customer_type}</span>
                    </div>
                )}

                {/* Problem Solved */}
                {uvp.problem_solved && (
                    <div className="space-y-1">
                        <div className="flex items-center text-xs font-medium text-gray-700 gap-1">
                            <Target className="h-3 w-3" />
                            Problem Solved
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">
                            {uvp.problem_solved}
                        </p>
                    </div>
                )}

                {/* Key Differentiator */}
                {uvp.key_differentiator && (
                    <div className="space-y-1">
                        <div className="flex items-center text-xs font-medium text-gray-700 gap-1">
                            <Building2 className="h-3 w-3" />
                            Key Differentiator
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">
                            {uvp.key_differentiator}
                        </p>
                    </div>
                )}

                {/* UVP Preview */}
                {uvp.uvp && (
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                        <p className="text-xs font-medium text-blue-900 mb-1">Value Proposition</p>
                        <p className="text-sm text-blue-800 line-clamp-3">
                            {uvp.uvp.replace(/[#*_`]/g, '')}
                        </p>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onView && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onView(uvp.id)}
                            className="flex-1"
                        >
                            <Eye className="h-3 w-3 mr-1" />
                            View Full UVP
                        </Button>
                    )}
                    {onEdit && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEdit(uvp.id)}
                            className="flex-1"
                        >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

