'use client'

import { useParams, useRouter } from 'next/navigation'
import { useClientConfig } from '@/hooks/useClientConfig'
import ClientOnly from '@/components/ClientOnly'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Video, Construction } from 'lucide-react'

export default function VideoContentPage() {
    const params = useParams()
    const router = useRouter()
    const clientId = params.clientId as string
    const { clientConfig, isLoading: configLoading, error: configError } = useClientConfig(clientId)

    if (!clientConfig) {
        return <div>Client not found</div>
    }

    return (
        <ClientOnly>
            <div className="container mx-auto py-6 space-y-6">
                {/* Header with Back Button */}
                <div className="flex items-center gap-4 mb-6">
                    <Button 
                        variant="ghost" 
                        onClick={() => router.push(`/dashboard/${clientId}`)}
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
                            <Video className="h-8 w-8" />
                            Video Content Ideas
                        </h1>
                        <p className="text-muted-foreground">
                            Create and manage video content for {clientConfig.name}
                        </p>
                    </div>
                </div>

                {/* Coming Soon Card */}
                <Card className="max-w-2xl mx-auto">
                    <CardContent className="p-12 text-center space-y-6">
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                            <Construction className="h-10 w-10 text-red-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Coming Soon</h2>
                            <p className="text-gray-600 mb-6">
                                Video Content Ideas functionality is currently under development. 
                                This will include features for YouTube, TikTok, and other video platforms.
                            </p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h3 className="font-semibold text-gray-900 mb-2">Planned Features:</h3>
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li>• YouTube video planning</li>
                                <li>• TikTok content creation</li>
                                <li>• Video script generation</li>
                                <li>• Thumbnail design ideas</li>
                                <li>• Multi-platform optimization</li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </ClientOnly>
    )
}