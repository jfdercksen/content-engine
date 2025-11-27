'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
    Eye, 
    Edit, 
    Trash2,
    Mail,
    MousePointerClick,
    FileText,
    Image as ImageIcon,
    Send
} from 'lucide-react'

interface EmailIdeaCardProps {
    email: {
        id: string
        emailideaname?: string
        emailtype?: string
        hook?: string
        cta?: string
        emailtextidea?: string
        status?: string
        createddate?: string
        generatedhtml?: string
        generatedHtml?: string
        mailchimpcampaignid?: string
        mailchimpCampaignId?: string
    }
    onView?: (id: string) => void
    onEdit?: (id: string) => void
    onDelete?: (id: string) => void
    onSendToMailchimp?: (id: string) => void
    clientId?: string
}

export function EmailIdeaCard({ email, onView, onEdit, onDelete, onSendToMailchimp, clientId }: EmailIdeaCardProps) {
    const getEmailTypeColor = (type: string) => {
        const typeLower = type?.toLowerCase() || ''
        if (typeLower.includes('newsletter')) return 'bg-blue-100 text-blue-800 border-blue-200'
        if (typeLower.includes('promotional')) return 'bg-purple-100 text-purple-800 border-purple-200'
        if (typeLower.includes('transactional')) return 'bg-green-100 text-green-800 border-green-200'
        if (typeLower.includes('welcome')) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }

    const getStatusColor = (status: string) => {
        const statusLower = status?.toLowerCase() || ''
        if (statusLower.includes('sent')) return 'bg-green-100 text-green-800 border-green-200'
        if (statusLower.includes('scheduled')) return 'bg-blue-100 text-blue-800 border-blue-200'
        if (statusLower.includes('draft')) return 'bg-gray-100 text-gray-800 border-gray-200'
        if (statusLower.includes('approved')) return 'bg-purple-100 text-purple-800 border-purple-200'
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }

    const truncateText = (text: string, maxLength: number = 100) => {
        if (!text) return ''
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
    }

    return (
        <Card className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] group">
            <CardContent className="p-5 space-y-3">
                {/* Header: Email Name & Type */}
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1">
                        <Mail className="h-5 w-5 text-blue-600 shrink-0" />
                        <h3 className="font-semibold text-gray-900 text-base leading-tight line-clamp-2">
                            {email.emailideaname || 'Untitled Email'}
                        </h3>
                    </div>
                    {email.emailtype && (
                        <Badge className={`${getEmailTypeColor(email.emailtype)} border shrink-0 text-xs`}>
                            {email.emailtype}
                        </Badge>
                    )}
                </div>

                {/* Status Badge */}
                {email.status && (
                    <Badge className={`${getStatusColor(email.status)} border text-xs w-fit`}>
                        {email.status}
                    </Badge>
                )}

                {/* Hook */}
                {email.hook && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="text-xs font-medium text-yellow-900 mb-1">Hook</p>
                        <p className="text-sm text-yellow-800 line-clamp-2">
                            {email.hook}
                        </p>
                    </div>
                )}

                {/* Email Content Preview */}
                {email.emailtextidea && (
                    <div className="space-y-1">
                        <div className="flex items-center text-xs font-medium text-gray-700 gap-1">
                            <FileText className="h-3 w-3" />
                            Content Preview
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-3">
                            {truncateText(email.emailtextidea)}
                        </p>
                    </div>
                )}

                {/* CTA */}
                {email.cta && (
                    <div className="flex items-center text-sm gap-2 py-2 border-t border-gray-100">
                        <MousePointerClick className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-gray-700">{email.cta}</span>
                    </div>
                )}

                {/* Created Date */}
                {email.createddate && (
                    <div className="text-xs text-gray-500">
                        Created: {new Date(email.createddate).toLocaleDateString()}
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {(email.generatedhtml || email.generatedHtml) && onView && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onView(email.id)}
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
                            onClick={() => onEdit(email.id)}
                            className="flex-1"
                        >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                        </Button>
                    )}
                    {/* Send to Mailchimp button - only show if status is Approved and not already sent */}
                    {email.status === 'Approved' &&
                     (email.generatedhtml || email.generatedHtml) && 
                     !(email.mailchimpcampaignid || email.mailchimpCampaignId) && 
                     onSendToMailchimp && (
                        <Button
                            variant="default"
                            size="sm"
                            onClick={() => onSendToMailchimp(email.id)}
                            className="bg-orange-600 hover:bg-orange-700 text-white"
                        >
                            <Send className="h-3 w-3 mr-1" />
                            Send to Mailchimp
                        </Button>
                    )}
                    {onDelete && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onDelete(email.id)}
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

