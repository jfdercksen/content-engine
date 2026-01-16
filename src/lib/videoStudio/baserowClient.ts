import { BaserowAPI } from '@/lib/baserow/api'
import { getVideoStudioConfig } from './config'

export async function getVideoStudioClient(clientId: string) {
  const cfg = await getVideoStudioConfig(clientId)
  if (!cfg.token) {
    throw new Error('Baserow token for Video Studio is not configured')
  }
  return new BaserowAPI(cfg.token, cfg.databaseId)
}


