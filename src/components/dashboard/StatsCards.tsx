'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Clock, Eye, CheckCircle } from 'lucide-react'

interface ContentIdea {
  status: string
  priority: string
}

interface StatsCardsProps {
  contentIdeas: ContentIdea[]
}

export default function StatsCards({ contentIdeas }: StatsCardsProps) {
  const totalIdeas = contentIdeas.length
  const inProgress = contentIdeas.filter(idea => 
    idea.status === 'In Progress' || idea.status === 'in_progress'
  ).length
  const pendingReview = contentIdeas.filter(idea => 
    idea.status === 'Client Review' || idea.status === 'pending_review' || idea.status === 'Ready for Review'
  ).length
  const published = contentIdeas.filter(idea => 
    idea.status === 'Published' || idea.status === 'published' || idea.status === 'Completed'
  ).length

  const stats = [
    {
      title: 'Total Ideas',
      value: totalIdeas,
      icon: FileText,
      description: 'All content ideas'
    },
    {
      title: 'In Progress',
      value: inProgress,
      icon: Clock,
      description: 'Currently being worked on'
    },
    {
      title: 'Pending Review',
      value: pendingReview,
      icon: Eye,
      description: 'Awaiting client approval'
    },
    {
      title: 'Published',
      value: published,
      icon: CheckCircle,
      description: 'Live content'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}