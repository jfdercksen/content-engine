import { EnvironmentManager } from '@/lib/config/environmentManager'
import {
  VIDEO_STUDIO_DEFAULT_CALLBACK_SECRET,
  VIDEO_STUDIO_DEFAULT_DATABASE_ID,
  VIDEO_STUDIO_DEFAULT_TOKEN,
  VIDEO_STUDIO_DEFAULT_WEBHOOK_URL,
} from './constants'

export async function getVideoStudioConfig(clientId: string) {
  const [webhookUrl, callbackSecret, token, databaseId] = await Promise.all([
    EnvironmentManager.getVariable(clientId, 'VIDEO_STUDIO_WEBHOOK_URL'),
    EnvironmentManager.getVariable(clientId, 'VIDEO_STUDIO_CALLBACK_SECRET'),
    EnvironmentManager.getVariable(clientId, 'VIDEO_STUDIO_TOKEN'),
    EnvironmentManager.getVariable(clientId, 'VIDEO_STUDIO_DATABASE_ID'),
  ])

  return {
    webhookUrl: webhookUrl || VIDEO_STUDIO_DEFAULT_WEBHOOK_URL,
    callbackSecret: callbackSecret || VIDEO_STUDIO_DEFAULT_CALLBACK_SECRET,
    token: token || VIDEO_STUDIO_DEFAULT_TOKEN,
    databaseId: databaseId || VIDEO_STUDIO_DEFAULT_DATABASE_ID,
  }
}


