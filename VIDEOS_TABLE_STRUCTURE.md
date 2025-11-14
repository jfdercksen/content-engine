# Videos Table Structure & Implementation Guide

## 📋 Table Information
- **Table Name**: Videos
- **Table ID**: 3394
- **Database**: Modern Management (176)
- **Purpose**: Unified video generation and management system

---

## 🗂️ Complete Field Structure

### Auto-Generated Fields
| Field Name | Field ID | Type | Description |
|------------|----------|------|-------------|
| video_id | 43313 | Auto Number | Unique video identifier |

### Core Video Fields
| Field Name | Field ID | Type | Options | Required |
|------------|----------|------|---------|----------|
| video | 43314 | File | - | ❌ |
| videoUrl | 43315 | URL | - | ❌ |
| thumbnailUrl | 43316 | URL | - | ❌ |
| videoPrompt | 43317 | Long Text | - | ✅ |
| videoType | 43364 | Single Select | Text-to-Video, Image-to-Video, Storyboard, Multi-Scene Process, UGC Ad, Social Post Video | ✅ |
| videoStatus | 43318 | Single Select | Pending, Preparing, Generating Scenes, Generating Images, Generating Videos, Processing Audio, Finalizing, Completed, Failed | ✅ |
| model | 43319 | Single Select | Sora 2, Veo 3.1, Veo 3.1 Fast, Kling Video, NanoBanana + Veo 3.1, fal.ai | ✅ |
| clientId | 43320 | Text | - | ✅ |

### Video Configuration
| Field Name | Field ID | Type | Options | Required |
|------------|----------|------|---------|----------|
| aspectRatio | 43321 | Single Select | 9:16 (Vertical), 16:9 (Landscape), 1:1 (Square), 4:5 (Portrait) | ✅ |
| duration | 43322 | Number | - | ✅ |
| nFrames | 43323 | Number | - | ❌ |
| removeWatermark | 43324 | Boolean | - | ❌ |

### Reference Media
| Field Name | Field ID | Type | Required |
|------------|----------|------|----------|
| referenceImage | 43325 | File | ❌ |
| referenceImageUrl | 43326 | URL | ❌ |
| referenceVideo | 43327 | File | ❌ |
| referenceVideoUrl | 43328 | URL | ❌ |
| styleReferenceImage | 43329 | File | ❌ |

### Process & Product Information
| Field Name | Field ID | Type | Used By | Required |
|------------|----------|------|---------|----------|
| process | 43330 | Text | Multi-Scene | ❌ |
| processId | 43331 | Link | Multi-Scene | ❌ |
| product | 43334 | Text | UGC Ads | ❌ |
| productPhoto | 43335 | File | UGC Ads | ❌ |
| productPhotoUrl | 43336 | URL | UGC Ads | ❌ |
| icp | 43337 | Long Text | UGC Ads | ❌ |
| productFeatures | 43338 | Long Text | UGC Ads | ❌ |
| videoSetting | 43339 | Long Text | UGC Ads, Multi-Scene | ❌ |

### Audio & Music
| Field Name | Field ID | Type | Required |
|------------|----------|------|----------|
| backgroundMusicPrompt | 43332 | Long Text | ❌ |
| musicTrack | 43333 | Link | ❌ |
| useMusic | 43348 | Boolean | ❌ |
| useSoundFX | 43349 | Boolean | ❌ |

### Platform & Distribution
| Field Name | Field ID | Type | Options | Required |
|------------|----------|------|---------|----------|
| platform | 43340 | Single Select | Facebook, Instagram, Twitter, LinkedIn, TikTok, YouTube | ❌ |
| youtubeTitle | 43354 | Text | - | ❌ |
| youtubeHashtags | 43355 | Text | - | ❌ |
| youtubeVideoId | 43356 | Text | - | ❌ |

### Scenes & Multi-Scene Videos
| Field Name | Field ID | Type | Required |
|------------|----------|------|----------|
| scenes | 43341 | Link | ❌ |
| sceneCount | 43342 | Number | ❌ |

### Captions
| Field Name | Field ID | Type | Options | Required |
|------------|----------|------|---------|----------|
| useCaptions | 43343 | Boolean | - | ❌ |
| captionText | 43344 | Long Text | - | ❌ |
| captionFontStyle | 43345 | Text | - | ❌ |
| captionFontSize | 43346 | Text | - | ❌ |
| captionPosition | 43347 | Single Select | Top, Center, Bottom | ❌ |

### Processing URLs
| Field Name | Field ID | Type | Description | Required |
|------------|----------|------|-------------|----------|
| rawVideoUrl | 43350 | URL | Pre-processing video URL | ❌ |
| processedVideoUrl | 43351 | URL | Post-processing video URL | ❌ |

### Relationships
| Field Name | Field ID | Type | Links To | Required |
|------------|----------|------|----------|----------|
| socialMediaContent | 43352 | Link | Social Media Content (712) | ❌ |
| contentIdea | 43353 | Link | Content Ideas (721) | ❌ |

### Metadata & Tracking
| Field Name | Field ID | Type | Required |
|------------|----------|------|----------|
| taskId | 43357 | Text | ❌ |
| errorMessage | 43358 | Long Text | ❌ |
| metadata | 43359 | Long Text | ❌ |

### Timestamps
| Field Name | Field ID | Type | Auto | Required |
|------------|----------|------|------|----------|
| createdAt | 43360 | Date | ❌ | ✅ |
| updatedAt | 43361 | Date | ✅ | ✅ |
| completedAt | 43362 | Date | ❌ | ❌ |

---

## 📊 Field Mappings Configuration

### TypeScript Interface
```typescript
export interface VideosFieldMapping {
  video_id: '43313'
  video: '43314'
  videoUrl: '43315'
  thumbnailUrl: '43316'
  videoPrompt: '43317'
  videoType: '43364'
  videoStatus: '43318'
  model: '43319'
  clientId: '43320'
  aspectRatio: '43321'
  duration: '43322'
  nFrames: '43323'
  removeWatermark: '43324'
  referenceImage: '43325'
  referenceImageUrl: '43326'
  referenceVideo: '43327'
  referenceVideoUrl: '43328'
  styleReferenceImage: '43329'
  process: '43330'
  processId: '43331'
  backgroundMusicPrompt: '43332'
  musicTrack: '43333'
  product: '43334'
  productPhoto: '43335'
  productPhotoUrl: '43336'
  icp: '43337'
  productFeatures: '43338'
  videoSetting: '43339'
  platform: '43340'
  scenes: '43341'
  sceneCount: '43342'
  useCaptions: '43343'
  captionText: '43344'
  captionFontStyle: '43345'
  captionFontSize: '43346'
  captionPosition: '43347'
  useMusic: '43348'
  useSoundFX: '43349'
  rawVideoUrl: '43350'
  processedVideoUrl: '43351'
  socialMediaContent: '43352'
  contentIdea: '43353'
  youtubeTitle: '43354'
  youtubeHashtags: '43355'
  youtubeVideoId: '43356'
  taskId: '43357'
  errorMessage: '43358'
  metadata: '43359'
  createdAt: '43360'
  updatedAt: '43361'
  completedAt: '43362'
}
```

### JSON Configuration
```json
{
  "videos": {
    "video_id": "43313",
    "video": "43314",
    "videoUrl": "43315",
    "thumbnailUrl": "43316",
    "videoPrompt": "43317",
    "videoType": "43364",
    "videoStatus": "43318",
    "model": "43319",
    "clientId": "43320",
    "aspectRatio": "43321",
    "duration": "43322",
    "nFrames": "43323",
    "removeWatermark": "43324",
    "referenceImage": "43325",
    "referenceImageUrl": "43326",
    "referenceVideo": "43327",
    "referenceVideoUrl": "43328",
    "styleReferenceImage": "43329",
    "process": "43330",
    "processId": "43331",
    "backgroundMusicPrompt": "43332",
    "musicTrack": "43333",
    "product": "43334",
    "productPhoto": "43335",
    "productPhotoUrl": "43336",
    "icp": "43337",
    "productFeatures": "43338",
    "videoSetting": "43339",
    "platform": "43340",
    "scenes": "43341",
    "sceneCount": "43342",
    "useCaptions": "43343",
    "captionText": "43344",
    "captionFontStyle": "43345",
    "captionFontSize": "43346",
    "captionPosition": "43347",
    "useMusic": "43348",
    "useSoundFX": "43349",
    "rawVideoUrl": "43350",
    "processedVideoUrl": "43351",
    "socialMediaContent": "43352",
    "contentIdea": "43353",
    "youtubeTitle": "43354",
    "youtubeHashtags": "43355",
    "youtubeVideoId": "43356",
    "taskId": "43357",
    "errorMessage": "43358",
    "metadata": "43359",
    "createdAt": "43360",
    "updatedAt": "43361",
    "completedAt": "43362"
  }
}
```

---

## 🎯 Video Types & Use Cases

### 1. Text-to-Video
**Fields Used:**
- videoPrompt, model, aspectRatio, duration, nFrames, removeWatermark
- Optional: platform, useCaptions, captionText, useMusic

**Models Supported:**
- Sora 2
- Veo 3.1

**Example Use Case:** Generate a video from a text description

---

### 2. Image-to-Video
**Fields Used:**
- videoPrompt, referenceImage/referenceImageUrl, model, aspectRatio, duration
- Optional: platform, useCaptions, useMusic

**Models Supported:**
- Sora 2
- Veo 3.1
- Kling Video

**Example Use Case:** Animate a static image

---

### 3. Storyboard
**Fields Used:**
- videoPrompt, scenes, sceneCount, model, aspectRatio, duration
- Optional: backgroundMusicPrompt, useMusic

**Models Supported:**
- Sora 2

**Example Use Case:** Multi-scene video with defined shots

---

### 4. Multi-Scene Process
**Fields Used:**
- process, processId, scenes, sceneCount, styleReferenceImage
- videoSetting, backgroundMusicPrompt, useMusic, useSoundFX
- youtubeTitle, youtubeHashtags

**Models Supported:**
- Kling Video
- fal.ai

**Example Use Case:** TikTok automation (tiny workers)

---

### 5. UGC Ad
**Fields Used:**
- product, productPhoto/productPhotoUrl, icp, productFeatures
- videoSetting, videoPrompt, model, aspectRatio, duration
- Optional: referenceImage, useMusic

**Models Supported:**
- Veo 3.1
- Sora 2
- NanoBanana + Veo 3.1

**Example Use Case:** Product demonstration video

---

### 6. Social Post Video
**Fields Used:**
- videoPrompt, socialMediaContent, platform, model
- aspectRatio, duration, useCaptions, captionText
- Optional: referenceImage, useMusic

**Models Supported:**
- Sora 2
- Veo 3.1

**Example Use Case:** Video for social media post

---

## 🔄 Status Flow

```
Pending
  ↓
Preparing (validating inputs, uploading files)
  ↓
Generating Scenes (multi-scene only)
  ↓
Generating Images (image-to-video)
  ↓
Generating Videos (calling AI API)
  ↓
Processing Audio (adding music/SFX)
  ↓
Finalizing (uploading to Baserow)
  ↓
Completed / Failed
```

---

## 📡 Webhook Payload Structure

```json
{
  "event": "video_generation",
  "clientId": "modern-management",
  "videoType": "text-to-video",
  "model": "sora-2",
  "timestamp": "2025-01-11T12:00:00Z",
  
  "client": {
    "id": "modern-management",
    "name": "Modern Management",
    "baserowToken": "TOKEN",
    "databaseId": "176"
  },
  
  "tables": {
    "videos": {
      "id": "3394",
      "recordId": "12345"
    }
  },
  
  "fieldMappings": {
    "videos": {
      "videoUrl": "43315",
      "videoStatus": "43318",
      "taskId": "43357",
      "completedAt": "43362"
    }
  },
  
  "video": {
    "prompt": "A cinematic video of...",
    "type": "text-to-video",
    "model": "sora-2",
    "aspectRatio": "9:16",
    "duration": 10,
    "nFrames": 10,
    "removeWatermark": true
  },
  
  "metadata": {
    "source": "content-engine-app",
    "version": "1.0"
  }
}
```

---

## 🚀 Next Steps

### Phase 1: API Setup
1. Update `ClientConfiguration` interface to include videos table
2. Create `/api/baserow/[clientId]/videos/route.ts`
3. Implement CRUD operations
4. Test with Postman/Thunder Client

### Phase 2: Frontend
1. Create `VideoGenerationForm.tsx`
2. Create `/dashboard/[clientId]/videos/page.tsx`
3. Test form submission and display

### Phase 3: n8n Integration
1. Create webhook endpoint
2. Build basic Sora 2 text-to-video workflow
3. Test end-to-end generation

### Phase 4: Expansion
1. Add more video types
2. Add more AI models
3. Add post-processing features

---

## ✅ Implementation Checklist

- [ ] Update ClientConfiguration type
- [ ] Add videos table to modern-management config
- [ ] Create API routes
- [ ] Create TypeScript types for videos
- [ ] Create frontend components
- [ ] Set up n8n webhook
- [ ] Build basic workflow
- [ ] Test end-to-end
- [ ] Document API endpoints
- [ ] Add error handling

