'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  Facebook, 
  Instagram, 
  Twitter, 
  Linkedin, 
  Youtube,
  Eye, 
  Edit, 
  Download,
  Trash2,
  FileText,
  Image as ImageIcon,
  Palette,
  Type,
  Layout,
  Mic,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  AlertTriangle
} from 'lucide-react'
import { BrandAsset, BrandAssetFilters } from '@/lib/types/content'

interface BrandAssetsTableProps {
  brandAssets: BrandAsset[]
  isLoading: boolean
  onEdit?: (asset: BrandAsset) => void
  onView?: (asset: BrandAsset) => void
  onDelete?: (assetId: string) => void
  onDownload?: (asset: BrandAsset) => void
  clientPrimaryColor: string
}

export default function BrandAssetsTable({
  brandAssets,
  isLoading,
  onEdit,
  onView,
  onDelete,
  onDownload,
  clientPrimaryColor
}: BrandAssetsTableProps) {
  const [filteredAssets, setFilteredAssets] = useState<BrandAsset[]>(brandAssets)
  const [filters, setFilters] = useState<BrandAssetFilters>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(12)
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid')

  useEffect(() => {
    let filtered = brandAssets

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(asset => 
        asset.assetname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (asset.assetinformation && asset.assetinformation.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (asset.assetnotes && asset.assetnotes.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Apply platform filter
    if (filters.platform && filters.platform !== 'all') {
      filtered = filtered.filter(asset => getDisplayValue(asset.platform) === filters.platform)
    }

    // Apply asset type filter
    if (filters.assetType && filters.assetType !== 'all') {
      filtered = filtered.filter(asset => getDisplayValue(asset.assettype) === filters.assetType)
    }

    // Apply status filter
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(asset => getDisplayValue(asset.status) === filters.status)
    }

    // Apply priority filter
    if (filters.priority && filters.priority !== 'all') {
      filtered = filtered.filter(asset => getDisplayValue(asset.priority) === filters.priority)
    }

    setFilteredAssets(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }, [brandAssets, searchTerm, filters])

  const getDisplayValue = (field: string | any) => {
    // Handle null/undefined
    if (field === null || field === undefined) {
      return ''
    }
    
    // Handle Baserow select field format {id, value, color}
    if (Array.isArray(field)) {
      // Handle multiple select fields - return comma-separated values
      return field.map((item, index) => {
        if (typeof item === 'object' && item?.value) {
          return item.value
        }
        return String(item || '')
      }).join(', ')
    } else if (typeof field === 'object' && field !== null && field?.value) {
      // Handle single select field
      return String(field.value || '')
    } else {
      // Handle string or other types
      return String(field || '')
    }
  }

  const getPlatformIcon = (platform: string | any) => {
    // Handle null/undefined
    if (platform === null || platform === undefined) {
      return <FileText className="h-4 w-4 text-gray-400" />
    }
    
    // Handle Baserow select field format {id, value, color} or array of select options
    let platformValue = '';
    if (Array.isArray(platform)) {
      // For multiple select, use the first platform for the icon
      if (platform.length > 0) {
        if (typeof platform[0] === 'object' && platform[0]?.value) {
          platformValue = platform[0].value
        } else {
          platformValue = String(platform[0] || '')
        }
      }
    } else if (typeof platform === 'object' && platform !== null && platform?.value) {
      platformValue = String(platform.value || '')
    } else {
      platformValue = String(platform || '')
    }
    
    if (!platformValue || typeof platformValue !== 'string') {
      return <Layout className="h-4 w-4 text-gray-500" />
    }
    
    switch (platformValue.toLowerCase()) {
      case 'facebook': return <Facebook className="h-4 w-4 text-blue-600" />
      case 'instagram': return <Instagram className="h-4 w-4 text-pink-600" />
      case 'x': 
      case 'twitter': return <Twitter className="h-4 w-4 text-blue-400" />
      case 'linkedin': return <Linkedin className="h-4 w-4 text-blue-700" />
      case 'youtube': return <Youtube className="h-4 w-4 text-red-600" />
      case 'all platforms':
      case 'all': return <Layout className="h-4 w-4 text-gray-600" />
      default: return <Layout className="h-4 w-4 text-gray-500" />
    }
  }

  const getAssetTypeIcon = (assetType: string | any) => {
    // Handle Baserow select field format {id, value, color}
    const assetTypeValue = typeof assetType === 'object' && assetType?.value ? assetType.value : assetType
    
    if (!assetTypeValue || typeof assetTypeValue !== 'string') {
      return <FileText className="h-4 w-4 text-gray-500" />
    }
    
    switch (assetTypeValue.toLowerCase()) {
      case 'brand voice': return <Mic className="h-4 w-4 text-purple-600" />
      case 'visual asset': return <ImageIcon className="h-4 w-4 text-green-600" />
      case 'template': return <Layout className="h-4 w-4 text-blue-600" />
      case 'guidelines': return <FileText className="h-4 w-4 text-orange-600" />
      case 'logo': return <ImageIcon className="h-4 w-4 text-red-600" />
      case 'color palette': return <Palette className="h-4 w-4 text-pink-600" />
      case 'font': return <Type className="h-4 w-4 text-indigo-600" />
      case 'style guide': return <FileText className="h-4 w-4 text-teal-600" />
      default: return <FileText className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusVariant = (status: string | any) => {
    // Handle Baserow select field format {id, value, color}
    const statusValue = typeof status === 'object' && status?.value ? status.value : status
    
    if (!statusValue || typeof statusValue !== 'string') {
      return 'outline'
    }
    
    switch (statusValue.toLowerCase()) {
      case 'active': return 'default'
      case 'inactive': return 'secondary'
      case 'draft': return 'outline'
      case 'archived': return 'secondary'
      default: return 'outline'
    }
  }

  const getStatusColor = (status: string | any) => {
    // Handle Baserow select field format {id, value, color}
    const statusValue = typeof status === 'object' && status?.value ? status.value : status
    
    if (!statusValue || typeof statusValue !== 'string') {
      return 'text-gray-600 bg-gray-50'
    }
    
    switch (statusValue.toLowerCase()) {
      case 'active': return 'text-green-600 bg-green-50'
      case 'inactive': return 'text-gray-600 bg-gray-50'
      case 'draft': return 'text-yellow-600 bg-yellow-50'
      case 'archived': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getPriorityVariant = (priority: string | any) => {
    // Handle Baserow select field format {id, value, color}
    const priorityValue = typeof priority === 'object' && priority?.value ? priority.value : priority
    
    if (!priorityValue || typeof priorityValue !== 'string') {
      return 'outline'
    }
    
    switch (priorityValue.toLowerCase()) {
      case 'high': return 'destructive'
      case 'medium': return 'default'
      case 'low': return 'secondary'
      default: return 'outline'
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  const handleDownloadClick = (asset: BrandAsset) => {
    if (asset.fileUrl) {
      // Open file URL in new tab for download
      window.open(asset.fileUrl, '_blank')
    } else if (onDownload) {
      onDownload(asset)
    }
  }

  // Pagination
  const totalPages = Math.ceil(filteredAssets.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentAssets = filteredAssets.slice(startIndex, endIndex)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (brandAssets.length === 0) {
    return (
      <div className="text-center py-12">
        <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No brand assets yet
        </h3>
        <p className="text-gray-500 mb-6">
          Start building your brand asset library by uploading logos, guidelines, templates, and more.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Brand Assets</h3>
          <p className="text-sm text-gray-500">
            {filteredAssets.length} of {brandAssets.length} assets
          </p>
        </div>
        
        {/* View Mode Toggle */}
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('table')}
          >
            Table
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            Grid
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search assets, content, or notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
                 <Select value={filters.platform || ''} onValueChange={(value) => 
           setFilters(prev => ({ ...prev, platform: value || undefined }))
         }>
           <SelectTrigger className="w-[150px]">
             <SelectValue placeholder="Platform" />
           </SelectTrigger>
           <SelectContent>
             <SelectItem value="all">All Platforms</SelectItem>
             <SelectItem value="Facebook">Facebook</SelectItem>
             <SelectItem value="Instagram">Instagram</SelectItem>
             <SelectItem value="X">X (Twitter)</SelectItem>
             <SelectItem value="LinkedIn">LinkedIn</SelectItem>
             <SelectItem value="Universal">Universal</SelectItem>
           </SelectContent>
         </Select>

                 <Select value={filters.assetType || ''} onValueChange={(value) => 
           setFilters(prev => ({ ...prev, assetType: value || undefined }))
         }>
           <SelectTrigger className="w-[150px]">
             <SelectValue placeholder="Asset Type" />
           </SelectTrigger>
           <SelectContent>
             <SelectItem value="all">All Types</SelectItem>
             <SelectItem value="Brand Voice">Brand Voice</SelectItem>
             <SelectItem value="Visual Asset">Visual Asset</SelectItem>
             <SelectItem value="Template">Template</SelectItem>
             <SelectItem value="Guidelines">Guidelines</SelectItem>
           </SelectContent>
         </Select>

                 <Select value={filters.status || ''} onValueChange={(value) => 
           setFilters(prev => ({ ...prev, status: value || undefined }))
         }>
           <SelectTrigger className="w-[120px]">
             <SelectValue placeholder="Status" />
           </SelectTrigger>
           <SelectContent>
             <SelectItem value="all">All Status</SelectItem>
             <SelectItem value="Active">Active</SelectItem>
             <SelectItem value="Inactive">Inactive</SelectItem>
             <SelectItem value="Draft">Draft</SelectItem>
           </SelectContent>
         </Select>

                 <Select value={filters.priority || ''} onValueChange={(value) => 
           setFilters(prev => ({ ...prev, priority: value || undefined }))
         }>
           <SelectTrigger className="w-[120px]">
             <SelectValue placeholder="Priority" />
           </SelectTrigger>
           <SelectContent>
             <SelectItem value="all">All Priority</SelectItem>
             <SelectItem value="High">High</SelectItem>
             <SelectItem value="Medium">Medium</SelectItem>
             <SelectItem value="Low">Low</SelectItem>
           </SelectContent>
         </Select>
      </div>

      {/* Content Display */}
      {viewMode === 'table' ? (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentAssets.map((asset) => (
                <TableRow key={asset.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {getAssetTypeIcon(asset.assetType)}
                      <div className="min-w-0">
                        <p className="font-medium truncate">{asset.assetName}</p>
                        {asset.assetInformation && (
                          <p className="text-xs text-gray-500 truncate">
                            {truncateText(asset.assetInformation, 50)}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{getDisplayValue(asset.assetType)}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getPlatformIcon(asset.platform)}
                      <span className="text-sm">{getDisplayValue(asset.platform)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={getStatusVariant(asset.status) as any}
                      className={getStatusColor(asset.status)}
                    >
                      {getDisplayValue(asset.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getPriorityVariant(asset.priority) as any}>
                      {getDisplayValue(asset.priority)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-500">
                      {formatDate(asset.lastUpdated)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {onView && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onView(asset)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      {(asset.fileUrl || onDownload) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadClick(asset)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                      {onEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(asset)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(asset.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {currentAssets.map((asset) => (
            <Card key={asset.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {getAssetTypeIcon(asset.assetType)}
                    <CardTitle className="text-base truncate">
                      {asset.assetName}
                    </CardTitle>
                  </div>
                  <Badge variant={getPriorityVariant(asset.priority) as any}>
                    {getDisplayValue(asset.priority)}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{getDisplayValue(asset.assetType)}</Badge>
                  <div className="flex items-center gap-1">
                    {getPlatformIcon(asset.platform)}
                    <span className="text-xs text-gray-500">{getDisplayValue(asset.platform)}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {asset.assetInformation && (
                  <div>
                    <p className="text-sm text-gray-700">
                      {truncateText(asset.assetInformation, 120)}
                    </p>
                  </div>
                )}

                {asset.fileUrl && (
                  <div className="flex items-center gap-1 text-xs text-blue-600">
                    <ExternalLink className="h-3 w-3" />
                    <span>File attached</span>
                  </div>
                )}

                {asset.notes && (
                  <div className="text-xs text-gray-500">
                    <strong>Notes:</strong> {truncateText(asset.notes, 80)}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t">
                  <Badge 
                    variant={getStatusVariant(asset.status) as any}
                    className={getStatusColor(asset.status)}
                  >
                    {getDisplayValue(asset.status)}
                  </Badge>
                  
                  <div className="flex items-center gap-1">
                    {onView && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView(asset)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    {(asset.fileUrl || onDownload) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadClick(asset)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    {onEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(asset)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(asset.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="text-xs text-gray-500">
                  Updated: {formatDate(asset.lastUpdated)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredAssets.length)} of {filteredAssets.length} results
          </p>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}