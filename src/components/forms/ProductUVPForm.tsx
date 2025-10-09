'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

// Industry Categories
export const INDUSTRY_CATEGORIES = [
  'Automotive',
  'Software/SaaS',
  'Professional Services',
  'Manufacturing',
  'Healthcare',
  'Financial Services',
  'E-commerce/Retail',
  'Real Estate',
  'Education',
  'Other'
] as const

// Customer Types
export const CUSTOMER_TYPES = [
  'Individual Consumers',
  'Small Business Owners (1-50 employees)',
  'Mid-Market Companies (51-500 employees)',
  'Enterprise (500+ employees)',
  'Industry Professionals',
  'C-Level Executives'
] as const

// Zod schema for validation
const productUVPSchema = z.object({
  productServiceName: z.string().min(1, 'Product/Service name is required'),
  productUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  industryCategory: z.enum(INDUSTRY_CATEGORIES, {
    required_error: 'Please select an industry category'
  }),
  customerType: z.enum(CUSTOMER_TYPES, {
    required_error: 'Please select a customer type'
  }),
  problemSolved: z.string().min(10, 'Please provide at least 10 characters describing the problem solved'),
  keyDifferentiator: z.string().min(10, 'Please provide at least 10 characters describing the key differentiator'),
  uvp: z.string().optional()
})

export type ProductUVPFormData = z.infer<typeof productUVPSchema>

export interface ProductUVP extends ProductUVPFormData {
  id?: number
  uvp?: string
  createdDate?: string
  lastModified?: string
}

interface ProductUVPFormProps {
  onSubmit: (data: ProductUVPFormData) => Promise<void>
  initialData?: ProductUVP
  isLoading?: boolean
  showUVPField?: boolean
}

export default function ProductUVPForm({ onSubmit, initialData, isLoading, showUVPField = false }: ProductUVPFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<ProductUVPFormData>({
    resolver: zodResolver(productUVPSchema),
    defaultValues: {
      productServiceName: initialData?.productServiceName || '',
      productUrl: initialData?.productUrl || '',
      industryCategory: initialData?.industryCategory || '',
      customerType: initialData?.customerType || '',
      problemSolved: initialData?.problemSolved || '',
      keyDifferentiator: initialData?.keyDifferentiator || '',
      uvp: initialData?.uvp || ''
    }
  })

  const industryCategory = watch('industryCategory')
  const customerType = watch('customerType')

  const handleFormSubmit = async (data: ProductUVPFormData) => {
    try {
      setIsSubmitting(true)
      await onSubmit(data)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>{initialData ? 'Edit Product UVP' : 'Create Product UVP'}</CardTitle>
        <CardDescription>
          Define your product's unique value proposition and target market
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Product/Service Name */}
          <div className="space-y-2">
            <Label htmlFor="productServiceName">
              Product/Service Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="productServiceName"
              {...register('productServiceName')}
              placeholder="e.g., AI Content Engine Pro"
              className={errors.productServiceName ? 'border-red-500' : ''}
            />
            {errors.productServiceName && (
              <p className="text-sm text-red-500">{errors.productServiceName.message}</p>
            )}
          </div>

          {/* Product URL */}
          <div className="space-y-2">
            <Label htmlFor="productUrl">Product/Service URL</Label>
            <Input
              id="productUrl"
              type="url"
              {...register('productUrl')}
              placeholder="https://example.com/product"
              className={errors.productUrl ? 'border-red-500' : ''}
            />
            {errors.productUrl && (
              <p className="text-sm text-red-500">{errors.productUrl.message}</p>
            )}
          </div>

          {/* Industry Category */}
          <div className="space-y-2">
            <Label htmlFor="industryCategory">
              Industry Category <span className="text-red-500">*</span>
            </Label>
            <Select
              value={industryCategory || ''}
              onValueChange={(value) => setValue('industryCategory', value as typeof INDUSTRY_CATEGORIES[number])}
            >
              <SelectTrigger className={errors.industryCategory ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select an industry" />
              </SelectTrigger>
              <SelectContent>
                {INDUSTRY_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.industryCategory && (
              <p className="text-sm text-red-500">{errors.industryCategory.message}</p>
            )}
          </div>

          {/* Customer Type */}
          <div className="space-y-2">
            <Label htmlFor="customerType">
              Customer Type <span className="text-red-500">*</span>
            </Label>
            <Select
              value={customerType || ''}
              onValueChange={(value) => setValue('customerType', value as typeof CUSTOMER_TYPES[number])}
            >
              <SelectTrigger className={errors.customerType ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select customer type" />
              </SelectTrigger>
              <SelectContent>
                {CUSTOMER_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.customerType && (
              <p className="text-sm text-red-500">{errors.customerType.message}</p>
            )}
          </div>

          {/* Primary Problem Solved */}
          <div className="space-y-2">
            <Label htmlFor="problemSolved">
              Primary Problem Solved <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="problemSolved"
              {...register('problemSolved')}
              placeholder="Describe the main problem your product/service solves..."
              rows={4}
              className={errors.problemSolved ? 'border-red-500' : ''}
            />
            {errors.problemSolved && (
              <p className="text-sm text-red-500">{errors.problemSolved.message}</p>
            )}
            <p className="text-sm text-gray-500">
              What specific pain point or challenge does your product address?
            </p>
          </div>

          {/* Key Differentiator */}
          <div className="space-y-2">
            <Label htmlFor="keyDifferentiator">
              Key Differentiator <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="keyDifferentiator"
              {...register('keyDifferentiator')}
              placeholder="What makes your product unique compared to competitors..."
              rows={4}
              className={errors.keyDifferentiator ? 'border-red-500' : ''}
            />
            {errors.keyDifferentiator && (
              <p className="text-sm text-red-500">{errors.keyDifferentiator.message}</p>
            )}
            <p className="text-sm text-gray-500">
              What sets you apart from the competition?
            </p>
          </div>

          {/* AI-Generated UVP */}
          {showUVPField && (
            <div className="space-y-2">
              <Label htmlFor="uvp">AI-Generated UVP</Label>
              <Textarea
                id="uvp"
                {...register('uvp')}
                placeholder="AI-generated unique value proposition will appear here..."
                rows={12}
                className="font-mono text-sm"
              />
              <p className="text-sm text-gray-500">
                This field contains the AI-generated markdown content. You can edit it here.
              </p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="min-w-[150px]"
            >
              {isSubmitting || isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {initialData ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>{initialData ? 'Update UVP' : 'Create UVP'}</>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

