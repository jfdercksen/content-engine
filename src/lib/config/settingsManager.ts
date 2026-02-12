/**
 * Settings Manager - Manages client settings and preferences in Baserow
 * 
 * Two tables in Client Info base (233):
 * 1. Client Settings (1061) - System-level settings (webhooks, API keys, integrations)
 * 2. Client Preferences (1062) - Client-specific preferences (AI settings, publishing, notifications)
 */

interface ClientSetting {
    id: number
    'Client ID': string
    'Category': string
    'Setting Key': string
    'Setting Value': string
    'Is Encrypted': boolean
    'Is Active': boolean
    'Description': string
    'Created on': string
    'Last modified': string
}

interface ClientPreference {
    id: number
    'Client ID': string
    'Category': string
    'Preference Key': string
    'Preference Value': string
    'Data Type': string
    'Description': string
    'Created on': string
    'Last modified': string
}

export class SettingsManager {
    private static baserowToken = process.env.BASEROW_MODERN_MANAGEMENT_TOKEN || 'SXe0k6Btm7i28uZP5mp8hr5KPBoWsiE1'
    private static baseUrl = process.env.BASEROW_API_URL || 'https://baserow.aiautomata.co.za'
    private static clientInfoDatabaseId = '233'
    private static clientSettingsTableId = '1061'
    private static clientPreferencesTableId = '1062'

    /**
     * Get all settings for a client
     */
    static async getSettings(clientId: string): Promise<Record<string, any>> {
        try {
            const settings: Record<string, any> = {}
            let page = 1
            const pageSize = 200
            let hasMore = true

            while (hasMore) {
                const response = await fetch(
                    `${this.baseUrl}/api/database/rows/table/${this.clientSettingsTableId}/?user_field_names=true&page=${page}&size=${pageSize}`,
                    {
                        headers: {
                            'Authorization': `Token ${this.baserowToken}`,
                            'Content-Type': 'application/json',
                        },
                    }
                )

                if (!response.ok) {
                    throw new Error(`Failed to fetch settings (page ${page}): ${response.statusText}`)
                }

                const data = await response.json()

                data.results
                    .filter((row: ClientSetting) => row['Client ID'] === clientId && row['Is Active'])
                    .forEach((row: ClientSetting) => {
                        const category = row['Category'].toLowerCase().replace(/\s+/g, '_')
                        if (!settings[category]) {
                            settings[category] = {}
                        }
                        settings[category][row['Setting Key']] = row['Setting Value']
                    })

                hasMore = Boolean(data.next)
                page += 1
            }

            return settings
        } catch (error) {
            console.error('Error fetching settings:', error)
            return {}
        }
    }

    /**
     * Get all preferences for a client
     */
    static async getPreferences(clientId: string): Promise<Record<string, any>> {
        try {
            const preferences: Record<string, any> = {}
            let page = 1
            const pageSize = 200
            let hasMore = true

            while (hasMore) {
                const response = await fetch(
                    `${this.baseUrl}/api/database/rows/table/${this.clientPreferencesTableId}/?user_field_names=true&page=${page}&size=${pageSize}`,
                    {
                        headers: {
                            'Authorization': `Token ${this.baserowToken}`,
                            'Content-Type': 'application/json',
                        },
                    }
                )

                if (!response.ok) {
                    throw new Error(`Failed to fetch preferences (page ${page}): ${response.statusText}`)
                }

                const data = await response.json()

                data.results
                    .filter((row: ClientPreference) => row['Client ID'] === clientId)
                    .forEach((row: ClientPreference) => {
                        const category = row['Category'].toLowerCase().replace(/\s+/g, '_')
                        if (!preferences[category]) {
                            preferences[category] = {}
                        }
                        // Parse value based on data type
                        let value: any = row['Preference Value']
                        switch (row['Data Type'].toLowerCase()) {
                            case 'number':
                                value = parseFloat(value)
                                break
                            case 'boolean':
                                value = value.toLowerCase() === 'true'
                                break
                            case 'json':
                                try {
                                    value = JSON.parse(value)
                                } catch (e) {
                                    console.error('Failed to parse JSON preference:', e)
                                }
                                break
                        }
                        preferences[category][row['Preference Key']] = value
                    })

                hasMore = Boolean(data.next)
                page += 1
            }

            return preferences
        } catch (error) {
            console.error('Error fetching preferences:', error)
            return {}
        }
    }

    /**
     * Get a specific setting value
     */
    static async getSetting(clientId: string, category: string, key: string): Promise<string | null> {
        const settings = await this.getSettings(clientId)
        const categoryKey = category.toLowerCase().replace(/\s+/g, '_')
        return settings[categoryKey]?.[key] || null
    }

    /**
     * Get a specific preference value
     */
    static async getPreference(clientId: string, category: string, key: string): Promise<any> {
        const preferences = await this.getPreferences(clientId)
        const categoryKey = category.toLowerCase().replace(/\s+/g, '_')
        return preferences[categoryKey]?.[key] || null
    }

    /**
     * Set or update a setting
     */
    static async setSetting(
        clientId: string,
        category: string,
        key: string,
        value: string,
        description: string = '',
        isEncrypted: boolean = false
    ): Promise<boolean> {
        try {
            // First, check if setting exists
            // Fetch settings with pagination to find an existing record
            let existingSetting: ClientSetting | undefined = undefined
            let page = 1
            const pageSize = 200
            while (!existingSetting) {
                const response = await fetch(
                    `${this.baseUrl}/api/database/rows/table/${this.clientSettingsTableId}/?user_field_names=true&page=${page}&size=${pageSize}`,
                    {
                        headers: {
                            'Authorization': `Token ${this.baserowToken}`,
                            'Content-Type': 'application/json',
                        },
                    }
                )

                if (!response.ok) {
                    const errorText = await response.text()
                    throw new Error(`Failed to fetch settings (page ${page}): ${response.status} ${response.statusText} - ${errorText}`)
                }

                const data = await response.json()
                existingSetting = data.results.find(
                    (row: ClientSetting) =>
                        row['Client ID'] === clientId &&
                        row['Category'] === category &&
                        row['Setting Key'] === key
                )

                if (!data.next) break
                page += 1
            }

            if (existingSetting) {
                // Update existing setting
                const updateResponse = await fetch(
                    `${this.baseUrl}/api/database/rows/table/${this.clientSettingsTableId}/${existingSetting.id}/?user_field_names=true`,
                    {
                        method: 'PATCH',
                        headers: {
                            'Authorization': `Token ${this.baserowToken}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            'Setting Value': value,
                            'Description': description || existingSetting['Description'],
                            'Is Encrypted': isEncrypted,
                            'Is Active': true,
                        }),
                    }
                )

                if (!updateResponse.ok) {
                    const errorText = await updateResponse.text()
                    console.error('Failed to update setting:', {
                        clientId,
                        category,
                        key,
                        status: updateResponse.status,
                        statusText: updateResponse.statusText,
                        errorText
                    })
                }

                return updateResponse.ok
            } else {
                // Create new setting
                const createResponse = await fetch(
                    `${this.baseUrl}/api/database/rows/table/${this.clientSettingsTableId}/?user_field_names=true`,
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': `Token ${this.baserowToken}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            'Client ID': clientId,
                            'Category': category,
                            'Setting Key': key,
                            'Setting Value': value,
                            'Is Encrypted': isEncrypted,
                            'Is Active': true,
                            'Description': description,
                        }),
                    }
                )

                if (!createResponse.ok) {
                    const errorText = await createResponse.text()
                    console.error('Failed to create setting:', {
                        clientId,
                        category,
                        key,
                        status: createResponse.status,
                        statusText: createResponse.statusText,
                        errorText
                    })
                }

                return createResponse.ok
            }
        } catch (error) {
            console.error('Error setting value:', error)
            return false
        }
    }

    /**
     * Set or update a preference
     */
    static async setPreference(
        clientId: string,
        category: string,
        key: string,
        value: any,
        dataType: string = 'text',
        description: string = ''
    ): Promise<boolean> {
        try {
            // Convert value to string based on data type
            let stringValue: string
            switch (dataType.toLowerCase()) {
                case 'json':
                    stringValue = JSON.stringify(value)
                    break
                case 'boolean':
                    stringValue = value ? 'true' : 'false'
                    break
                default:
                    stringValue = String(value)
            }

            // First, check if preference exists
            const response = await fetch(
                `${this.baseUrl}/api/database/rows/table/${this.clientPreferencesTableId}/?user_field_names=true`,
                {
                    headers: {
                        'Authorization': `Token ${this.baserowToken}`,
                        'Content-Type': 'application/json',
                    },
                }
            )

            if (!response.ok) {
                throw new Error(`Failed to fetch preferences: ${response.statusText}`)
            }

            const data = await response.json()
            const existingPreference = data.results.find(
                (row: ClientPreference) =>
                    row['Client ID'] === clientId &&
                    row['Category'] === category &&
                    row['Preference Key'] === key
            )

            if (existingPreference) {
                // Update existing preference
                const updateResponse = await fetch(
                    `${this.baseUrl}/api/database/rows/table/${this.clientPreferencesTableId}/${existingPreference.id}/?user_field_names=true`,
                    {
                        method: 'PATCH',
                        headers: {
                            'Authorization': `Token ${this.baserowToken}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            'Preference Value': stringValue,
                            'Data Type': dataType,
                            'Description': description || existingPreference['Description'],
                        }),
                    }
                )

                return updateResponse.ok
            } else {
                // Create new preference
                const createResponse = await fetch(
                    `${this.baseUrl}/api/database/rows/table/${this.clientPreferencesTableId}/?user_field_names=true`,
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': `Token ${this.baserowToken}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            'Client ID': clientId,
                            'Category': category,
                            'Preference Key': key,
                            'Preference Value': stringValue,
                            'Data Type': dataType,
                            'Description': description,
                        }),
                    }
                )

                return createResponse.ok
            }
        } catch (error) {
            console.error('Error setting preference:', error)
            return false
        }
    }

    /**
     * Delete a setting
     */
    static async deleteSetting(clientId: string, category: string, key: string): Promise<boolean> {
        try {
            const response = await fetch(
                `${this.baseUrl}/api/database/rows/table/${this.clientSettingsTableId}/?user_field_names=true`,
                {
                    headers: {
                        'Authorization': `Token ${this.baserowToken}`,
                        'Content-Type': 'application/json',
                    },
                }
            )

            if (!response.ok) {
                throw new Error(`Failed to fetch settings: ${response.statusText}`)
            }

            const data = await response.json()
            const setting = data.results.find(
                (row: ClientSetting) =>
                    row['Client ID'] === clientId &&
                    row['Category'] === category &&
                    row['Setting Key'] === key
            )

            if (setting) {
                const deleteResponse = await fetch(
                    `${this.baseUrl}/api/database/rows/table/${this.clientSettingsTableId}/${setting.id}/`,
                    {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Token ${this.baserowToken}`,
                        },
                    }
                )

                return deleteResponse.ok
            }

            return false
        } catch (error) {
            console.error('Error deleting setting:', error)
            return false
        }
    }

    /**
     * Get all settings and preferences combined for a client
     */
    static async getAllClientConfig(clientId: string): Promise<{
        settings: Record<string, any>
        preferences: Record<string, any>
    }> {
        const [settings, preferences] = await Promise.all([
            this.getSettings(clientId),
            this.getPreferences(clientId),
        ])

        return { settings, preferences }
    }
}

