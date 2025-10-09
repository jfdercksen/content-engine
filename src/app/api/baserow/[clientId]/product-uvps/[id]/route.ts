import { NextRequest, NextResponse } from 'next/server'
import { BaserowAPI } from '@/lib/baserow/api'
import { getClientConfigForAPI } from '@/lib/utils/getClientConfigForAPI'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string; id: string }> }
) {
  try {
    const { clientId, id } = await params
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

    const result = await baserowAPI.request(
      `/api/database/rows/table/${productUvpsTableId}/${id}/?user_field_names=true`,
      {
        method: 'GET'
      }
    )

    // Helper function to extract value from Baserow select field
    const extractValue = (field: any): string => {
      if (!field) return ''
      if (typeof field === 'string') return field
      if (typeof field === 'object' && field?.value) return field.value
      return String(field)
    }

    // Map fields
    const uvp = {
      id: result.id,
      productServiceName: result['Product/Service Name'] || result['product/servicename'] || '',
      productUrl: result['Product URL'] || result['producturl'] || '',
      customerType: extractValue(result['Customer Type'] || result['customertype']),
      industryCategory: extractValue(result['Industry Category'] || result['industrycategory']),
      problemSolved: result['Problem Solved'] || result['problemsolved'] || '',
      keyDifferentiator: result['Key Differentiator'] || result['keydifferentiator'] || '',
      uvp: result['UVP'] || result['uvp'] || '',
      createdDate: result['Created Date'] || result['createddate'] || '',
      lastModified: result['Last Modified'] || result['lastmodified'] || ''
    }

    return NextResponse.json(uvp)
  } catch (error) {
    console.error('Error fetching product UVP:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product UVP' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string; id: string }> }
) {
  try {
    const { clientId, id } = await params
    const body = await request.json()
    
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

    // Map form data to Baserow field names
    const updateData: any = {}
    if (body.productServiceName !== undefined) updateData['Product/Service Name'] = body.productServiceName
    if (body.productUrl !== undefined) updateData['Product URL'] = body.productUrl
    if (body.customerType !== undefined) updateData['Customer Type'] = body.customerType
    if (body.industryCategory !== undefined) updateData['Industry Category'] = body.industryCategory
    if (body.problemSolved !== undefined) updateData['Problem Solved'] = body.problemSolved
    if (body.keyDifferentiator !== undefined) updateData['Key Differentiator'] = body.keyDifferentiator
    if (body.uvp !== undefined) updateData['UVP'] = body.uvp

    const result = await baserowAPI.request(
      `/api/database/rows/table/${productUvpsTableId}/${id}/?user_field_names=true`,
      {
        method: 'PATCH',
        body: JSON.stringify(updateData)
      }
    )

    // Map response
    const uvp = {
      id: result.id,
      productServiceName: result['Product/Service Name'] || '',
      productUrl: result['Product URL'] || '',
      customerType: result['Customer Type'] || '',
      industryCategory: result['Industry Category'] || '',
      problemSolved: result['Problem Solved'] || '',
      keyDifferentiator: result['Key Differentiator'] || '',
      uvp: result['UVP'] || '',
      createdDate: result['Created Date'] || '',
      lastModified: result['Last Modified'] || ''
    }

    return NextResponse.json(uvp)
  } catch (error) {
    console.error('Error updating product UVP:', error)
    return NextResponse.json(
      { error: 'Failed to update product UVP' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string; id: string }> }
) {
  try {
    const { clientId, id } = await params
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

    await baserowAPI.request(
      `/api/database/rows/table/${productUvpsTableId}/${id}/`,
      {
        method: 'DELETE'
      }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting product UVP:', error)
    return NextResponse.json(
      { error: 'Failed to delete product UVP' },
      { status: 500 }
    )
  }
}

