import { NextRequest, NextResponse } from 'next/server'
import { BaserowAPI } from '@/lib/baserow/api'
import { getClientConfigForAPI } from '@/lib/utils/getClientConfigForAPI'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { clientId } = await params
    const clientConfig = await getClientConfigForAPI(clientId)

    if (!clientConfig) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    const productUvpsTableId = clientConfig.baserow.tables.productUvps

    if (!productUvpsTableId) {
      return NextResponse.json(
        { error: 'Product UVPs table not configured' },
        { status: 500 }
      )
    }

    const baserowAPI = new BaserowAPI(
      clientConfig.baserow.token,
      clientConfig.baserow.databaseId,
      clientConfig.fieldMappings
    )

    // Fetch all product UVPs
    const result = await baserowAPI.request(
      `/api/database/rows/table/${productUvpsTableId}/?user_field_names=true`,
      {
        method: 'GET'
      }
    )

    console.log('Product UVPs fetched:', result)

    // Helper function to extract value from Baserow select field
    const extractValue = (field: any): string => {
      if (!field) return ''
      if (typeof field === 'string') return field
      if (typeof field === 'object' && field?.value) return field.value
      return String(field)
    }

    // Map fields from Baserow format to display format
    if (result.results) {
      result.results = result.results.map((uvp: any) => ({
        id: uvp.id,
        productServiceName: uvp['Product/Service Name'] || uvp['product/servicename'] || '',
        productUrl: uvp['Product URL'] || uvp['producturl'] || '',
        customerType: extractValue(uvp['Customer Type'] || uvp['customertype']),
        industryCategory: extractValue(uvp['Industry Category'] || uvp['industrycategory']),
        problemSolved: uvp['Problem Solved'] || uvp['problemsolved'] || '',
        keyDifferentiator: uvp['Key Differentiator'] || uvp['keydifferentiator'] || '',
        uvp: uvp['UVP'] || uvp['uvp'] || '',
        createdDate: uvp['Created Date'] || uvp['createddate'] || '',
        lastModified: uvp['Last Modified'] || uvp['lastmodified'] || ''
      }))
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching product UVPs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product UVPs' },
      { status: 500 }
    )
  }
}

