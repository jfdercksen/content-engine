/**
 * Baserow Videos API Helper
 * 
 * Special handler for the shared Videos table in Client Info database (233)
 * All clients use the same Videos table, filtered by clientId
 */

import { BaserowAPI } from './api'

const VIDEOS_DATABASE_ID = '233' // Client Info database
const VIDEOS_TABLE_ID = '3395' // Shared Videos table
const BASEROW_TOKEN = 'SXe0k6Btm7i28uZP5mp8hr5KPBoWsiE1' // System token

/**
 * Get videos for a specific client
 */
export async function getClientVideos(clientId: string, filters?: any) {
  const api = new BaserowAPI(BASEROW_TOKEN, VIDEOS_DATABASE_ID)
  
  console.log(`📹 VideosAPI: Getting videos for client: ${clientId}`)
  
  // Build URL with filters
  let url = `/api/database/rows/table/${VIDEOS_TABLE_ID}/?user_field_names=true`
  
  // Filter by clientId (required)
  url += `&filter__field_43375__equal=${clientId}`
  
  // Add optional filters
  if (filters?.videoStatus) {
    url += `&filter__field_43373__equal=${filters.videoStatus}`
  }
  if (filters?.videoType) {
    url += `&filter__field_43372__equal=${filters.videoType}`
  }
  
  console.log(`📹 VideosAPI: Fetching from URL: ${url}`)
  
  const result = await api.request(url)
  
  console.log(`✅ VideosAPI: Retrieved ${result.results?.length || 0} videos`)
  
  return result
}

/**
 * Get a single video by ID (with clientId verification)
 */
export async function getVideoById(videoId: string, clientId: string) {
  const api = new BaserowAPI(BASEROW_TOKEN, VIDEOS_DATABASE_ID)
  const video = await api.getVideoById(VIDEOS_TABLE_ID, videoId)
  
  // Verify the video belongs to this client
  if (video.clientId !== clientId) {
    throw new Error('Video not found or access denied')
  }
  
  return video
}

/**
 * Create a new video
 */
export async function createVideo(data: any) {
  const api = new BaserowAPI(BASEROW_TOKEN, VIDEOS_DATABASE_ID)
  return api.createVideo(VIDEOS_TABLE_ID, data)
}

/**
 * Update a video (with clientId verification)
 */
export async function updateVideo(videoId: string, clientId: string, data: any) {
  const api = new BaserowAPI(BASEROW_TOKEN, VIDEOS_DATABASE_ID)
  
  // First verify the video belongs to this client
  const existingVideo = await api.getVideoById(VIDEOS_TABLE_ID, videoId)
  if (existingVideo.clientId !== clientId) {
    throw new Error('Video not found or access denied')
  }
  
  return api.updateVideo(VIDEOS_TABLE_ID, videoId, data)
}

/**
 * Delete a video (with clientId verification)
 */
export async function deleteVideo(videoId: string, clientId: string) {
  const api = new BaserowAPI(BASEROW_TOKEN, VIDEOS_DATABASE_ID)
  
  // First verify the video belongs to this client
  const existingVideo = await api.getVideoById(VIDEOS_TABLE_ID, videoId)
  if (existingVideo.clientId !== clientId) {
    throw new Error('Video not found or access denied')
  }
  
  return api.deleteVideo(VIDEOS_TABLE_ID, videoId)
}

/**
 * Get Videos table configuration
 */
export function getVideosTableConfig() {
  return {
    databaseId: VIDEOS_DATABASE_ID,
    tableId: VIDEOS_TABLE_ID,
    token: BASEROW_TOKEN
  }
}

