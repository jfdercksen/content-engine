'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight, FileText, Image, Video, Mail, Lightbulb, Users, Settings } from 'lucide-react'

export default function Home() {
  const router = useRouter()

  const features = [
    {
      icon: FileText,
      title: 'Content Ideas',
      description: 'Generate and manage creative content ideas for all platforms'
    },
    {
      icon: Image,
      title: 'Social Media',
      description: 'Create engaging social media posts with AI-powered suggestions'
    },
    {
      icon: Video,
      title: 'Video Content',
      description: 'Plan and organize video content strategies'
    },
    {
      icon: Mail,
      title: 'Email Campaigns',
      description: 'Design effective email marketing campaigns'
    },
    {
      icon: Lightbulb,
      title: 'Product UVP',
      description: 'Define unique value propositions for your products'
    },
    {
      icon: Settings,
      title: 'Multi-Client Support',
      description: 'Manage content for multiple clients from one dashboard'
    }
  ]

  const handleGetStarted = () => {
    router.push('/dashboard/modern-management')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Content Engine</h1>
          </div>
          <Button onClick={handleGetStarted} className="bg-blue-600 hover:bg-blue-700">
            Get Started
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Streamline Your
            <span className="text-blue-600"> Content Creation</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            The ultimate content management platform for agencies and businesses. 
            Create, organize, and manage all your content from one powerful dashboard.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={handleGetStarted}
              size="lg" 
              className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-3"
            >
              Start Creating Content
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="text-lg px-8 py-3"
            >
              Learn More
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center bg-white rounded-2xl p-12 shadow-lg">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Transform Your Content Strategy?
          </h3>
          <p className="text-lg text-gray-600 mb-8">
            Join thousands of content creators who are already using Content Engine 
            to streamline their workflow and create better content.
          </p>
          <Button 
            onClick={handleGetStarted}
            size="lg" 
            className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-3"
          >
            Get Started Now
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-gray-600">
        <p>&copy; 2024 Content Engine. All rights reserved.</p>
      </footer>
    </div>
  )
}
