import { NextRequest, NextResponse } from 'next/server'

import { BaserowAPI } from '@/lib/baserow/api'
import { getClientConfigForAPI } from '@/lib/utils/getClientConfigForAPI'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { clientId } = await params

    const clientConfig = await getClientConfigForAPI(clientId)
    if (!clientConfig) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const socialMediaTableId = clientConfig.baserow?.tables?.socialMediaContent
    if (!socialMediaTableId) {
      return NextResponse.json(
        { error: 'Social media table not configured for this client' },
        { status: 400 }
      )
    }

    const baserowAPI = new BaserowAPI(
      clientConfig.baserow.token,
      clientConfig.baserow.databaseId,
      clientConfig.fieldMappings
    )

    // Build a lightweight filter to return only rows with a scheduled time
    const filters: Record<string, string | number> = {
      size: 200
    }

    const scheduledFieldId =
      clientConfig.fieldMappings?.socialMediaContent?.scheduledtime ??
      clientConfig.fieldMappings?.socialMediaContent?.scheduledTime

    if (scheduledFieldId) {
      const normalizedId = typeof scheduledFieldId === 'number'
        ? scheduledFieldId
        : String(scheduledFieldId).replace('field_', '')
      const filterKey = `filter__field_${normalizedId}__not_empty`
      filters[filterKey] = '1'
    }

    const socialResult = await baserowAPI.getSocialMediaContent(
      socialMediaTableId,
      filters
    )

    const events =
      socialResult?.results?.map((item: any) => {
        const scheduledRaw =
          item.scheduledTime ||
          item.scheduledtime ||
          item.scheduled_time ||
          item?.scheduledtime

        if (!scheduledRaw) return null

        const iso = new Date(scheduledRaw).toISOString()

        return {
          id: String(item.id ?? ''),
          type: 'social',
          platform: item.platform || '',
          status: item.status || '',
          hook: item.hook || '',
          post: item.post || '',
          scheduledTime: iso,
          raw: item
        }
      })?.filter(Boolean) ?? []

    return NextResponse.json({
      success: true,
      timezone: 'Africa/Johannesburg',
      count: events.length,
      events
    })
  } catch (error) {
    console.error('Calendar API error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to fetch calendar data', details: message },
      { status: 500 }
    )
  }
}

