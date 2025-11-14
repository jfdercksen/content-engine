# Video API Testing Guide

## 🎯 Testing Checklist

Use this guide to test the Videos API with Postman, Thunder Client, or curl.

---

## 🔧 Setup

### Base URL
```
http://localhost:3000/api/baserow/modern-management/videos
```

### Required Headers
```
Content-Type: application/json
```

---

## 📋 Test Cases

### 1. **CREATE VIDEO** (POST)

#### **Test 1.1: Simple Text-to-Video (Minimal Fields)**

**Endpoint:**
```
POST http://localhost:3000/api/baserow/modern-management/videos
```

**Request Body:**
```json
{
  "videoPrompt": "A cinematic shot of a peaceful mountain landscape at sunrise, with golden light breaking through the clouds",
  "videoType": "Text-to-Video",
  "model": "Sora 2",
  "aspectRatio": "16:9 (Landscape)",
  "duration": 10
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "video": {
    "id": 12345,
    "videoPrompt": "A cinematic shot...",
    "videoType": "Text-to-Video",
    "videoStatus": "Pending",
    "model": "Sora 2",
    "aspectRatio": "16:9 (Landscape)",
    "duration": 10,
    "clientId": "modern-management",
    "createdAt": "2025-01-11T12:00:00.000Z",
    "updatedAt": "2025-01-11T12:00:00.000Z"
  },
  "message": "Video generation started"
}
```

**✅ Validation:**
- [ ] Status code is 200
- [ ] Response has `success: true`
- [ ] Response has `video.id`
- [ ] Video status is "Pending"
- [ ] createdAt and updatedAt are populated

---

#### **Test 1.2: Text-to-Video with All Optional Fields**

**Request Body:**
```json
{
  "videoPrompt": "A vertical TikTok-style video showing a day in the life of a content creator",
  "videoType": "Text-to-Video",
  "model": "Veo 3.1",
  "aspectRatio": "9:16 (Vertical)",
  "duration": 8,
  "nFrames": 10,
  "removeWatermark": true,
  "platform": "TikTok",
  "useMusic": true,
  "backgroundMusicPrompt": "Upbeat, energetic background music",
  "useCaptions": true,
  "captionText": "Day in the Life 📹",
  "captionPosition": "Top"
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "video": {
    "id": 12346,
    "videoPrompt": "A vertical TikTok-style video...",
    "videoType": "Text-to-Video",
    "videoStatus": "Pending",
    "model": "Veo 3.1",
    "aspectRatio": "9:16 (Vertical)",
    "duration": 8,
    "nFrames": 10,
    "removeWatermark": true,
    "platform": "TikTok",
    "useMusic": true,
    "backgroundMusicPrompt": "Upbeat, energetic background music",
    "useCaptions": true,
    "captionText": "Day in the Life 📹",
    "captionPosition": "Top",
    "clientId": "modern-management",
    "createdAt": "2025-01-11T12:00:00.000Z"
  },
  "message": "Video generation started"
}
```

---

#### **Test 1.3: UGC Ad with Product Info**

**Request Body:**
```json
{
  "videoPrompt": "A young woman in her kitchen holding a hair product, speaking enthusiastically about how it transformed her curls",
  "videoType": "UGC Ad",
  "model": "Veo 3.1",
  "aspectRatio": "9:16 (Vertical)",
  "duration": 8,
  "product": "Curl Defining Cream",
  "productPhotoUrl": "https://example.com/product.jpg",
  "icp": "Women aged 18-35 with curly hair looking for natural hair care solutions",
  "productFeatures": "Long-lasting curl definition, no frizz, lightweight formula, natural ingredients",
  "videoSetting": "Modern bright kitchen with natural morning light, casual and authentic atmosphere",
  "platform": "Instagram"
}
```

---

#### **Test 1.4: Validation Error (Missing Required Fields)**

**Request Body:**
```json
{
  "videoPrompt": "Short",
  "videoType": "Text-to-Video"
}
```

**Expected Response (400):**
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "code": "too_small",
      "minimum": 10,
      "path": ["videoPrompt"],
      "message": "Video prompt must be at least 10 characters"
    },
    {
      "code": "invalid_type",
      "path": ["model"],
      "message": "Required"
    },
    {
      "code": "invalid_type",
      "path": ["aspectRatio"],
      "message": "Required"
    },
    {
      "code": "invalid_type",
      "path": ["duration"],
      "message": "Required"
    }
  ]
}
```

**✅ Validation:**
- [ ] Status code is 400
- [ ] Response has `success: false`
- [ ] Response has `details` array with validation errors

---

### 2. **GET ALL VIDEOS** (GET)

#### **Test 2.1: Get All Videos**

**Endpoint:**
```
GET http://localhost:3000/api/baserow/modern-management/videos
```

**Expected Response (200):**
```json
{
  "success": true,
  "videos": [
    {
      "id": 12345,
      "videoPrompt": "A cinematic shot...",
      "videoStatus": "Pending",
      "videoType": "Text-to-Video",
      "model": "Sora 2",
      "createdAt": "2025-01-11T12:00:00.000Z"
    },
    {
      "id": 12346,
      "videoPrompt": "A vertical TikTok-style...",
      "videoStatus": "Completed",
      "videoType": "Text-to-Video",
      "model": "Veo 3.1",
      "createdAt": "2025-01-11T11:00:00.000Z"
    }
  ],
  "count": 2
}
```

**✅ Validation:**
- [ ] Status code is 200
- [ ] Response has `videos` array
- [ ] Response has `count` property
- [ ] All videos have `clientId: "modern-management"`

---

#### **Test 2.2: Filter by Status**

**Endpoint:**
```
GET http://localhost:3000/api/baserow/modern-management/videos?videoStatus=Completed
```

**Expected Response (200):**
```json
{
  "success": true,
  "videos": [
    {
      "id": 12346,
      "videoStatus": "Completed",
      "videoUrl": "https://example.com/video.mp4"
    }
  ],
  "count": 1
}
```

**✅ Validation:**
- [ ] All returned videos have `videoStatus: "Completed"`

---

#### **Test 2.3: Filter by Video Type**

**Endpoint:**
```
GET http://localhost:3000/api/baserow/modern-management/videos?videoType=UGC%20Ad
```

**Expected Response (200):**
```json
{
  "success": true,
  "videos": [
    {
      "id": 12347,
      "videoType": "UGC Ad",
      "product": "Curl Defining Cream"
    }
  ],
  "count": 1
}
```

---

### 3. **GET SINGLE VIDEO** (GET)

#### **Test 3.1: Get Video by ID**

**Endpoint:**
```
GET http://localhost:3000/api/baserow/modern-management/videos/12345
```

**Expected Response (200):**
```json
{
  "success": true,
  "video": {
    "id": 12345,
    "videoPrompt": "A cinematic shot of a peaceful mountain landscape...",
    "videoType": "Text-to-Video",
    "videoStatus": "Pending",
    "model": "Sora 2",
    "aspectRatio": "16:9 (Landscape)",
    "duration": 10,
    "clientId": "modern-management",
    "createdAt": "2025-01-11T12:00:00.000Z",
    "updatedAt": "2025-01-11T12:00:00.000Z"
  }
}
```

**✅ Validation:**
- [ ] Status code is 200
- [ ] Response has complete video object

---

#### **Test 3.2: Get Non-Existent Video**

**Endpoint:**
```
GET http://localhost:3000/api/baserow/modern-management/videos/99999
```

**Expected Response (404):**
```json
{
  "success": false,
  "error": "Video not found"
}
```

**✅ Validation:**
- [ ] Status code is 404

---

### 4. **UPDATE VIDEO** (PATCH)

#### **Test 4.1: Update Video Status**

**Endpoint:**
```
PATCH http://localhost:3000/api/baserow/modern-management/videos/12345
```

**Request Body:**
```json
{
  "videoStatus": "Generating Videos"
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "video": {
    "id": 12345,
    "videoStatus": "Generating Videos",
    "updatedAt": "2025-01-11T12:05:00.000Z"
  },
  "message": "Video updated successfully"
}
```

**✅ Validation:**
- [ ] Status code is 200
- [ ] `videoStatus` is updated
- [ ] `updatedAt` is updated

---

#### **Test 4.2: Update Video with URL (Completion)**

**Endpoint:**
```
PATCH http://localhost:3000/api/baserow/modern-management/videos/12345
```

**Request Body:**
```json
{
  "videoStatus": "Completed",
  "videoUrl": "https://example.com/generated-video.mp4",
  "thumbnailUrl": "https://example.com/thumbnail.jpg",
  "completedAt": "2025-01-11T12:10:00.000Z"
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "video": {
    "id": 12345,
    "videoStatus": "Completed",
    "videoUrl": "https://example.com/generated-video.mp4",
    "thumbnailUrl": "https://example.com/thumbnail.jpg",
    "completedAt": "2025-01-11T12:10:00.000Z",
    "updatedAt": "2025-01-11T12:10:00.000Z"
  },
  "message": "Video updated successfully"
}
```

---

#### **Test 4.3: Update Video with Error**

**Endpoint:**
```
PATCH http://localhost:3000/api/baserow/modern-management/videos/12345
```

**Request Body:**
```json
{
  "videoStatus": "Failed",
  "errorMessage": "API rate limit exceeded. Please try again later."
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "video": {
    "id": 12345,
    "videoStatus": "Failed",
    "errorMessage": "API rate limit exceeded. Please try again later.",
    "updatedAt": "2025-01-11T12:15:00.000Z"
  },
  "message": "Video updated successfully"
}
```

---

### 5. **DELETE VIDEO** (DELETE)

#### **Test 5.1: Delete Video**

**Endpoint:**
```
DELETE http://localhost:3000/api/baserow/modern-management/videos/12345
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Video deleted successfully"
}
```

**✅ Validation:**
- [ ] Status code is 200
- [ ] Video is removed from Baserow
- [ ] Subsequent GET returns 404

---

#### **Test 5.2: Delete Non-Existent Video**

**Endpoint:**
```
DELETE http://localhost:3000/api/baserow/modern-management/videos/99999
```

**Expected Response (404):**
```json
{
  "success": false,
  "error": "Video not found"
}
```

---

## 🔍 Verification in Baserow

After each test, verify in Baserow:

1. **After CREATE**: Check that new record appears in Videos table (3394)
2. **After UPDATE**: Check that fields are updated correctly
3. **After DELETE**: Check that record is removed

---

## 🐛 Troubleshooting

### Common Errors:

#### **Error: "Videos table not configured for this client"**
**Solution:** Ensure videos table ID (3394) is in client config

#### **Error: "Client not found"**
**Solution:** Ensure `modern-management` client exists in database

#### **Error: "Validation failed"**
**Solution:** Check request body matches schema exactly

#### **Error: 500 Internal Server Error**
**Solution:** Check server logs for details:
```bash
npm run dev
```

---

## ✅ Testing Checklist

- [ ] Test 1.1: Simple text-to-video creation
- [ ] Test 1.2: Text-to-video with all fields
- [ ] Test 1.3: UGC Ad creation
- [ ] Test 1.4: Validation errors
- [ ] Test 2.1: Get all videos
- [ ] Test 2.2: Filter by status
- [ ] Test 2.3: Filter by type
- [ ] Test 3.1: Get single video
- [ ] Test 3.2: Get non-existent video
- [ ] Test 4.1: Update status
- [ ] Test 4.2: Update with URL
- [ ] Test 4.3: Update with error
- [ ] Test 5.1: Delete video
- [ ] Test 5.2: Delete non-existent video

---

## 🚀 Next Steps

Once all API tests pass:
1. Build frontend form component
2. Test form submission
3. Set up n8n webhook
4. Test end-to-end video generation

---

**Last Updated**: 2025-01-11

