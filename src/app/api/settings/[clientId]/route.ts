import { NextRequest, NextResponse } from 'next/server'
import { SettingsManager } from '@/lib/config/settingsManager'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ clientId: string }> }
) {
    try {
        const { clientId } = await params

        // Get all settings and preferences from Baserow
        const { settings, preferences } = await SettingsManager.getAllClientConfig(clientId)

        return NextResponse.json({
            success: true,
            settings,
            preferences
        })
    } catch (error) {
        console.error('Error fetching settings:', error)
        return NextResponse.json(
            { error: 'Failed to fetch settings' },
            { status: 500 }
        )
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ clientId: string }> }
) {
    try {
        const { clientId } = await params
        const body = await request.json()

        console.log('Updating settings for client:', clientId)
        console.log('Update data:', body)

        const updates: Array<Promise<boolean>> = []

        // Update settings (webhooks, integrations)
        if (body.settings) {
            for (const [category, categoryData] of Object.entries(body.settings)) {
                for (const [key, value] of Object.entries(categoryData as Record<string, any>)) {
                    const isEncrypted = key.toLowerCase().includes('key') || 
                                       key.toLowerCase().includes('token') ||
                                       key.toLowerCase().includes('secret')
                    
                    updates.push(
                        SettingsManager.setSetting(
                            clientId,
                            category,
                            key,
                            String(value),
                            `${category} - ${key}`,
                            isEncrypted
                        )
                    )
                }
            }
        }

        // Update preferences (AI settings, publishing, notifications)
        if (body.preferences) {
            for (const [category, categoryData] of Object.entries(body.preferences)) {
                for (const [key, value] of Object.entries(categoryData as Record<string, any>)) {
                    // Determine data type
                    let dataType = 'text'
                    if (typeof value === 'number') dataType = 'number'
                    else if (typeof value === 'boolean') dataType = 'boolean'
                    else if (typeof value === 'object') dataType = 'json'

                    updates.push(
                        SettingsManager.setPreference(
                            clientId,
                            category,
                            key,
                            value,
                            dataType,
                            `${category} - ${key}`
                        )
                    )
                }
            }
        }

        // Wait for all updates to complete
        const results = await Promise.all(updates)
        const allSuccessful = results.every(result => result === true)

        if (!allSuccessful) {
            console.error('Some settings failed to update')
        }

        // Fetch updated settings
        const { settings, preferences } = await SettingsManager.getAllClientConfig(clientId)

        return NextResponse.json({
            success: allSuccessful,
            message: allSuccessful ? 'Settings updated successfully' : 'Some settings failed to update',
            settings,
            preferences
        })
    } catch (error) {
        console.error('Error updating settings:', error)
        return NextResponse.json(
            { error: 'Failed to update settings' },
            { status: 500 }
        )
    }
}

